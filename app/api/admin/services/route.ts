import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSessionCode } from "@/lib/utils";
import { serverAnalytics } from "@/lib/server-analytics";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    void serverAnalytics.trackServiceCreated(name, maxChurches);

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const action = typeof body.action === "string" ? body.action : "";

    if (!id || !["activate", "deactivate", "end"].includes(action)) {
      return NextResponse.json(
        { error: "Service ID and a valid action are required" },
        { status: 400 },
      );
    }

    const endedAt = new Date();
    const [service] = await prisma.$transaction([
      prisma.service.update({
        where: { id },
        data: {
          active: action === "activate",
          endTime:
            action === "end"
              ? endedAt
              : action === "activate"
                ? null
                : undefined,
        },
      }),
      ...(action === "end"
        ? [
            prisma.session.updateMany({
              where: {
                serviceId: id,
                isActive: true,
              },
              data: {
                isActive: false,
                leftAt: endedAt,
                lastStatus: "disconnected",
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 },
    );
  }
}
