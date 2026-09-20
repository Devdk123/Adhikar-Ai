import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
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
 * POST /api/automate
 *
 * Legacy non-HITL endpoint. Runs smart_fill.py without review mode.
 * For the recommended HITL flow, use POST /api/automate/review instead.
 */
export async function POST(req: NextRequest) {
  try {
    // Vercel / serverless environments don't have Python — return early
    if (process.env.VERCEL) {
      return NextResponse.json({
        status: "simulated",
        message:
          "Automation is only available in local/Docker mode. On Vercel, the voice agent handles form filling directly.",
      });
    }

    // Rate limit: 5 automation requests per minute per IP
    const limited = rateLimit(getRateLimitKey(req, "automate"), {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const { citizenData, portalUrl } = await req.json();

    // Validate portalUrl to prevent command injection
    if (portalUrl !== undefined && (typeof portalUrl !== "string" || !isValidUrl(portalUrl))) {
      return NextResponse.json(
        { error: "Invalid portal URL" },
        { status: 400 }
      );
    }

    // Always use AI-powered smart_fill.py
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

    // Build command: decode base64 in Python to avoid shell escaping issues
    const portalUrlArg = portalUrl
      ? ",base64.b64decode('" + portalUrlData + "').decode()"
      : "";
    const cmd = `python -c "import sys,base64,json,asyncio;sys.path.insert(0,r'${path.dirname(scriptPath)}');from smart_fill import smart_fill_form;d=json.loads(base64.b64decode('${base64Data}'));asyncio.run(smart_fill_form(d${portalUrlArg}))"`;

    console.log("[Adhikaar] Starting smart_fill.py automation (non-review mode)...");

    return new Promise<NextResponse>((resolve) => {
      exec(
        cmd,
        {
          timeout: 120000,
          env: { ...process.env },
        },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Automation error:", error.message);
            console.error("stderr:", stderr);

            resolve(
              NextResponse.json(
                {
                  status: "error",
                  message: "Automation failed",
                  output: stdout?.slice(-500),
                },
                { status: 500 }
              )
            );
            return;
          }

          resolve(
            NextResponse.json({
              status: "success",
              message: "Application submitted successfully",
              output: stdout,
              mode: "ai-powered",
            })
          );
        }
      );
    });
  } catch (error) {
    console.error("Automate API error:", error);
    return NextResponse.json(
      { error: "Failed to trigger automation" },
      { status: 500 }
    );
  }
}
