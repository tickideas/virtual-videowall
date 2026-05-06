import { NextRequest, NextResponse } from "next/server";
import { createDailyToken, createOrGetDailyRoom, getDailyRoomUrl } from "@/lib/daily";
import { parseDailyTokenRequest } from "@/lib/daily-token";
import { prisma } from "@/lib/prisma";
import { rateLimits } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimits.session(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const parsedRequest = parseDailyTokenRequest(body);

    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: parsedRequest.error },
        { status: 400 },
      );
    }

    const { sessionCode, churchName, participantType, sessionId } = parsedRequest;

    const service = await prisma.service.findUnique({
      where: { sessionCode },
    });

    if (!service || !service.active) {
      return NextResponse.json(
        { error: "Service not found or inactive" },
        { status: 404 },
      );
    }

    const roomName = service.id;
    await createOrGetDailyRoom({ roomName, maxParticipants: 65 });

    let participantName = "Viewer";
    let participantIdentity = `viewer-${Date.now()}`;
    let canPublish = false;
    const canSubscribe = true;

    if (participantType === "church" && churchName && sessionId) {
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          serviceId: service.id,
          isActive: true,
        },
        include: {
          church: true,
        },
      });

      if (!session || session.church.name.toLowerCase() !== churchName.toLowerCase()) {
        return NextResponse.json(
          { error: "Active session not found" },
          { status: 403 },
        );
      }

      participantName = session.church.name;
      participantIdentity = session.church.id;
      canPublish = true;
    }

    const token = await createDailyToken({
      roomName,
      participantName,
      participantIdentity,
      canPublish,
      canSubscribe,
    });

    return NextResponse.json({
      token: String(token),
      roomName,
      roomUrl: getDailyRoomUrl(roomName),
      serviceName: service.name,
    });
  } catch (error) {
    console.error("Error generating Daily.co token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 },
    );
  }
}
