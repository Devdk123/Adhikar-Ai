import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * POST /api/automate/confirm
 *
 * Sends the user's confirmation (or cancellation) back to the running
 * smart_fill.py process via a temp file.
 *
 * Body:
 * {
 *   sessionId: string,
 *   action: "submit" | "cancel",
 *   captcha_value?: string,       // Human-filled captcha
 *   captcha_selector?: string,     // CSS selector for the captcha input
 *   accept_declaration?: boolean,  // Whether to check declaration checkbox
 *   corrections?: Array<{ selector: string, value: string }>  // Field corrections
 * }
 *
 * The smart_fill.py script polls for this file and reads the confirmation.
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.VERCEL) {
      return NextResponse.json({
        status: "simulated",
        message: "Confirmation is only available in local/Docker mode.",
      });
    }

    const limited = rateLimit(getRateLimitKey(req, "automate-confirm"), {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const {
      sessionId,
      action,
      captcha_value,
      captcha_selector,
      accept_declaration,
      corrections,
    } = await req.json();

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

    if (!action || !["submit", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "submit" or "cancel"' },
        { status: 400 }
      );
    }

    // Write confirmation file to the same temp directory smart_fill.py is watching
    const reviewDir = path.join(os.tmpdir(), "adhikaar_reviews");

    // Ensure the directory exists
    if (!fs.existsSync(reviewDir)) {
      fs.mkdirSync(reviewDir, { recursive: true });
    }

    const confirmFile = path.join(reviewDir, `${sessionId}_confirm.json`);

    const confirmData = {
      action,
      ...(captcha_value && { captcha_value }),
      ...(captcha_selector && { captcha_selector }),
      ...(accept_declaration !== undefined && { accept_declaration }),
      ...(corrections && Array.isArray(corrections) && { corrections }),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(confirmFile, JSON.stringify(confirmData, null, 2), "utf-8");

    console.log(
      `[Adhikaar] Confirmation written for session ${sessionId}: ${action}`
    );

    return NextResponse.json({
      status: "confirmed",
      action,
      message:
        action === "submit"
          ? "Confirmation sent. The agent will apply corrections and submit the form."
          : "Cancellation sent. The agent will abort submission.",
    });
  } catch (error) {
    console.error("Confirm API error:", error);
    return NextResponse.json(
      { error: "Failed to send confirmation" },
      { status: 500 }
    );
  }
}
