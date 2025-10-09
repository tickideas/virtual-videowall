import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSessionCode } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { startTime: "desc" },
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startTime, maxChurches = 60 } = body;

    if (!name || !startTime) {
      return NextResponse.json(
        { error: "Name and start time are required" },
        { status: 400 }
      );
    }

    let sessionCode = generateSessionCode();
    let exists = await prisma.service.findUnique({ where: { sessionCode } });
    
    while (exists) {
      sessionCode = generateSessionCode();
      exists = await prisma.service.findUnique({ where: { sessionCode } });
    }

    const service = await prisma.service.create({
      data: {
        name,
        sessionCode,
        startTime: new Date(startTime),
        maxChurches,
        active: true,
      },
    });

    analytics.trackServiceCreated(name, maxChurches);

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
