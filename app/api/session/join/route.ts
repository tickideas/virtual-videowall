import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionCode, churchName } = body;

    if (!sessionCode || !churchName) {
      return NextResponse.json(
        { error: "Session code and church name are required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { sessionCode },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    if (!service.active) {
      return NextResponse.json(
        { error: "Service is not active" },
        { status: 400 }
      );
    }

    // Find or create church by name (auto-generate code)
    let church = await prisma.church.findFirst({
      where: { 
        name: {
          equals: churchName,
          mode: 'insensitive',
        }
      },
    });

    if (!church) {
      // Auto-create church with generated code
      const code = `CH${Date.now().toString().slice(-4)}`;
      church = await prisma.church.create({
        data: {
          name: churchName,
          code,
        },
      });
    }

    const activeSessionsCount = await prisma.session.count({
      where: {
        serviceId: service.id,
        isActive: true,
      },
    });

    if (activeSessionsCount >= service.maxChurches) {
      return NextResponse.json(
        { error: "Service has reached maximum capacity" },
        { status: 400 }
      );
    }

    const existingSession = await prisma.session.findFirst({
      where: {
        churchId: church.id,
        serviceId: service.id,
        isActive: true,
      },
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        session: existingSession,
        church,
        service,
      });
    }

    const session = await prisma.session.create({
      data: {
        churchId: church.id,
        serviceId: service.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      session,
      church,
      service,
    });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}
