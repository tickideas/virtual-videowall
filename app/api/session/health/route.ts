import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VIDEO_QUALITY } from "@/lib/constants";
import { rateLimits } from "@/lib/rate-limit";
import { verifySessionHealthToken } from "@/lib/session-health-token";

const QUALITY_VALUES = new Set(["good", "low", "very-low"]);
const STATUS_VALUES = new Set(["connecting", "connected", "reconnecting", "disconnected", "error"]);
const VIDEO_STATUS_VALUES = new Set(["ready", "blocked", "muted", "no-track", "error"]);

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimits.church(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const healthToken = typeof body.healthToken === "string" ? body.healthToken : "";

    if (!sessionId || !healthToken) {
      return NextResponse.json(
        { error: "Session ID and health token are required" },
        { status: 400 },
      );
    }

    if (!verifySessionHealthToken(healthToken, sessionId)) {
      return NextResponse.json(
        { error: "Invalid health token" },
        { status: 403 },
      );
    }

    const uploadKbps = Math.max(0, Math.round(toNumber(body.uploadKbps)));
    const packetLoss = Math.max(0, toNumber(body.packetLoss));
    const reconnectCount = Math.max(0, Math.round(toNumber(body.reconnectCount)));
    const connectionQuality = QUALITY_VALUES.has(body.connectionQuality)
      ? body.connectionQuality
      : "low";
    const lastStatus = STATUS_VALUES.has(body.status) ? body.status : "connected";
    const videoStatus = VIDEO_STATUS_VALUES.has(body.videoStatus) ? body.videoStatus : "ready";
    const cameraEnabled = Boolean(body.cameraEnabled);

    const session = await prisma.session.updateMany({
      where: {
        id: sessionId,
        isActive: true,
        leftAt: null,
      },
      data: {
        avgBandwidth: Math.min(uploadKbps, VIDEO_QUALITY.TARGET_BANDWIDTH_KBPS * 3),
        connectionQuality,
        packetLoss,
        reconnectCount,
        cameraEnabled,
        videoStatus,
        lastStatus,
        lastHealthAt: new Date(),
      },
    });

    if (session.count === 0) {
      return NextResponse.json(
        { error: "Active session not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
      },
    });
  } catch (error) {
    console.error("Error updating session health:", error);
    return NextResponse.json(
      { error: "Failed to update session health" },
      { status: 500 },
    );
  }
}
