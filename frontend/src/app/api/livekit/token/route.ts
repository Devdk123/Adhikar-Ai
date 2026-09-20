import { NextRequest, NextResponse } from "next/server";
import { AccessToken, AgentDispatchClient } from "livekit-server-sdk";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 token requests per minute per IP
    const limited = rateLimit(getRateLimitKey(req, "livekit"), { maxRequests: 10, windowMs: 60_000 });
    if (limited) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const { participantName } = await req.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    // Create a unique room for each voice call session
    const roomName = `adhikaar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName || "citizen",
      name: participantName || "Citizen",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    // Explicitly dispatch the agent to this room
    // Convert wss:// to https:// for the REST API
    const httpUrl = livekitUrl.replace("wss://", "https://");
    const dispatchClient = new AgentDispatchClient(httpUrl, apiKey, apiSecret);

    try {
      await dispatchClient.createDispatch(roomName, "adhikaar-agent");
      console.log(`Agent dispatched to room: ${roomName}`);
    } catch (dispatchErr) {
      console.error("Agent dispatch failed:", dispatchErr);
      // Don't fail the whole request — the room still works, agent might auto-join
    }

    return NextResponse.json({
      token: jwt,
      room: roomName,
      url: livekitUrl,
    });
  } catch (error) {
    console.error("LiveKit token error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
