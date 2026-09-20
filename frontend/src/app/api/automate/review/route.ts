import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * POST /api/automate/review
 *
 * Triggers smart_fill.py in --review-mode.
 * Uses spawn() to stream stdout. Once the "Waiting for user confirmation"
 * line appears, reads the review JSON from disk (written by smart_fill.py)
 * and returns it immediately. The Python process continues in background,
 * polling for a confirmation file (written by /api/automate/confirm).
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.VERCEL) {
      return NextResponse.json({
        status: "simulated",
        message: "Review mode is only available in local/Docker mode.",
      });
    }

    const limited = rateLimit(getRateLimitKey(req, "automate-review"), {
      maxRequests: 3,
      windowMs: 60_000,
    });
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const { citizenData, portalUrl, sessionId } = await req.json();

    if (portalUrl !== undefined && (typeof portalUrl !== "string" || !isValidUrl(portalUrl))) {
      return NextResponse.json(
        { error: "Invalid portal URL" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }
    if (typeof sessionId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(sessionId)) {
      return NextResponse.json(
        { error: "Invalid sessionId" },
        { status: 400 }
      );
    }

    const scriptPath = path.resolve(
      process.cwd(),
      "..",
      "automation",
      "smart_fill.py"
    );

    const citizenJson = JSON.stringify(citizenData || {});
    const base64Data = Buffer.from(citizenJson).toString("base64");
    const portalUrlData = portalUrl
      ? Buffer.from(portalUrl).toString("base64")
      : "";
    const sessionIdData = Buffer.from(sessionId).toString("base64");

    // Build the Python one-liner command
    const portalUrlArg = portalUrl
      ? "base64.b64decode('" + portalUrlData + "').decode()"
      : "None";
    const pyCode = [
      "import sys,base64,json,asyncio",
      `sys.path.insert(0,r'${path.dirname(scriptPath)}')`,
      "from smart_fill import smart_fill_form",
      `d=json.loads(base64.b64decode('${base64Data}'))`,
      `session_id=base64.b64decode('${sessionIdData}').decode()`,
      `asyncio.run(smart_fill_form(d,portal_url=${portalUrlArg},review_mode=True,session_id=session_id))`,
    ].join(";");

    console.log(
      `[Adhikaar] Starting smart_fill in REVIEW mode (session: ${sessionId})...`
    );

    // Path where smart_fill.py writes its review JSON file
    const reviewDir = path.join(os.tmpdir(), "adhikaar_reviews");
    const reviewFilePath = path.join(reviewDir, `${sessionId}.json`);

    // Clean up any stale review file from a previous run with the same sessionId
    try {
      if (fs.existsSync(reviewFilePath)) fs.unlinkSync(reviewFilePath);
    } catch {
      // ignore
    }

    return new Promise<NextResponse>((resolve) => {
      const child = spawn("python", ["-c", pyCode], {
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdoutBuf = "";
      let resolved = false;

      // Timeout: if we don't get review data within 90 seconds, fail
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error(
            `[Adhikaar] Review mode timed out for session ${sessionId}`
          );
          resolve(
            NextResponse.json(
              {
                status: "error",
                message: "Review mode timed out waiting for form fill",
                output: stdoutBuf.slice(-500),
              },
              { status: 504 }
            )
          );
        }
      }, 90_000);

      child.stdout.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf-8");
        stdoutBuf += text;

        // Log progress lines to server console (skip large base64 data)
        for (const line of text.split("\n")) {
          const trimmed = line.trim();
          if (
            trimmed &&
            !trimmed.includes("__REVIEW_DATA_") &&
            trimmed.length < 200
          ) {
            console.log(`[smart_fill] ${trimmed}`);
          }
        }

        // Detect when smart_fill has written the review file and is waiting
        // We look for the "Waiting for user confirmation" line OR the __REVIEW_DATA_START__ marker
        if (
          !resolved &&
          (stdoutBuf.includes("Waiting for user confirmation") ||
            stdoutBuf.includes("__REVIEW_DATA_START__"))
        ) {
          // Give a tiny delay to ensure the file is fully written
          setTimeout(() => {
            if (resolved) return;
            try {
              if (fs.existsSync(reviewFilePath)) {
                const fileContent = fs.readFileSync(reviewFilePath, "utf-8");
                const reviewData = JSON.parse(fileContent);
                resolved = true;
                clearTimeout(timeout);
                console.log(
                  `[Adhikaar] Review data loaded from file for session ${sessionId} (${fileContent.length} bytes)`
                );
                resolve(NextResponse.json(reviewData));
              } else {
                console.log(
                  `[Adhikaar] Review file not yet on disk, will retry...`
                );
              }
            } catch (err) {
              console.error(
                "[Adhikaar] Error reading review file:",
                err
              );
            }
          }, 500);
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        const text = chunk.toString("utf-8");
        if (text.trim() && !text.includes("DevTools listening")) {
          console.error(`[smart_fill stderr] ${text.trim()}`);
        }
      });

      child.on("close", (code) => {
        clearTimeout(timeout);
        console.log(
          `[Adhikaar] smart_fill process exited (code ${code}, session: ${sessionId})`
        );

        if (!resolved) {
          resolved = true;
          // Try reading the file one last time
          try {
            if (fs.existsSync(reviewFilePath)) {
              const fileContent = fs.readFileSync(reviewFilePath, "utf-8");
              const reviewData = JSON.parse(fileContent);
              resolve(NextResponse.json(reviewData));
              return;
            }
          } catch {
            // fall through
          }

          if (code === 0) {
            resolve(
              NextResponse.json({
                status: "completed",
                message:
                  "Form process completed (may have been confirmed externally)",
              })
            );
          } else {
            resolve(
              NextResponse.json(
                {
                  status: "error",
                  message: `Form fill process exited with code ${code}`,
                  output: stdoutBuf.slice(-500),
                },
                { status: 500 }
              )
            );
          }
        }
      });

      child.on("error", (err) => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          console.error("[Adhikaar] Failed to spawn smart_fill:", err);
          resolve(
            NextResponse.json(
              {
                status: "error",
                message: "Failed to start form fill process",
              },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error("Review API error:", error);
    return NextResponse.json(
      { error: "Failed to start review mode" },
      { status: 500 }
    );
  }
}
