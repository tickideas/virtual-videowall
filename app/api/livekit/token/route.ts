import { NextRequest, NextResponse } from "next/server";
import { createLiveKitToken } from "@/lib/livekit";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionCode, churchName, participantType = "church" } = body;

    if (!sessionCode) {
      return NextResponse.json(
        { error: "Session code is required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { sessionCode },
    });

    if (!service || !service.active) {
      return NextResponse.json(
        { error: "Service not found or inactive" },
        { status: 404 }
      );
    }

    let participantName = "Viewer";
    let participantIdentity = `viewer-${Date.now()}`;
    let canPublish = false;
    let canSubscribe = true;

    if (participantType === "church" && churchName) {
      // Find or create church by name
      let church = await prisma.church.findFirst({
        where: { 
          name: {
            equals: churchName,
            mode: 'insensitive',
          }
        },
      });

      if (!church) {
        const code = `CH${Date.now().toString().slice(-4)}`;
        church = await prisma.church.create({
          data: {
            name: churchName,
            code,
          },
        });
      }

      participantName = church.name;
      participantIdentity = church.id;
      canPublish = true;

      // Create or update session
      const existingSession = await prisma.session.findFirst({
        where: {
          churchId: church.id,
          serviceId: service.id,
          isActive: true,
        },
      });

      if (!existingSession) {
        await prisma.session.create({
          data: {
            churchId: church.id,
            serviceId: service.id,
            isActive: true,
          },
        });
      }
    }

    const token = await createLiveKitToken({
      roomName: service.id,
      participantName,
      participantIdentity,
      canPublish,
      canSubscribe,
    });

    console.log('Generated token type in API:', typeof token);
    console.log('Generated token in API:', token?.substring?.(0, 20) + '...');
    console.log('Token is string:', typeof token === 'string');

    return NextResponse.json({
      token: String(token),
      roomName: service.id,
      serviceName: service.name,
      livekitUrl: process.env.LIVEKIT_URL,
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
