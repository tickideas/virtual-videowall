import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    const role = session?.user?.role?.toLowerCase();

    if (!session?.user || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalChurches,
      activeServices,
      totalSessions,
      activeSessions
    ] = await Promise.all([
      prisma.church.count(),
      prisma.service.count({
        where: {
          active: true
        }
      }),
      prisma.session.count(),
      prisma.session.findMany({
        where: {
          isActive: true,
          leftAt: null,
        },
        include: {
          church: true,
          service: true,
        },
        orderBy: { joinedAt: "desc" },
      })
    ]);

    const activeConnections = activeSessions.length;
    const totalBandwidthUsage = activeSessions.reduce(
      (total, activeSession) => total + (activeSession.avgBandwidth ?? 0),
      0,
    );

    // Build recent activity feed from joins, leaves, and services created
    const [recentJoins, recentLeaves, recentServices] = await Promise.all([
      prisma.session.findMany({
        take: 5,
        orderBy: { joinedAt: "desc" },
        include: {
          church: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.session.findMany({
        take: 5,
        where: { leftAt: { not: null } },
        orderBy: { leftAt: "desc" },
        include: {
          church: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.service.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      }),
    ]);

    const formattedActivity = [
      ...recentJoins.map((session) => ({
        id: `join-${session.id}`,
        type: "church_joined" as const,
        message: `${session.church.name} joined ${session.service.name}`,
        timestamp: session.joinedAt,
      })),
      ...recentLeaves
        .filter((session) => session.leftAt)
        .map((session) => ({
          id: `leave-${session.id}`,
          type: "church_left" as const,
          message: `${session.church.name} left ${session.service.name}`,
          timestamp: session.leftAt as Date,
        })),
      ...recentServices.map((service) => ({
        id: `service-${service.id}`,
        type: "service_created" as const,
        message: `${service.name} service created`,
        timestamp: service.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return NextResponse.json({
      totalChurches,
      activeServices,
      totalSessions,
      activeConnections,
      connections: activeSessions.map((activeSession) => ({
        id: activeSession.id,
        churchName: activeSession.church.name,
        serviceName: activeSession.service.name,
        avgBandwidth: activeSession.avgBandwidth,
        connectionQuality: activeSession.connectionQuality,
        lastHealthAt: activeSession.lastHealthAt,
        lastStatus: activeSession.lastStatus,
        videoStatus: activeSession.videoStatus,
        cameraEnabled: activeSession.cameraEnabled,
        packetLoss: activeSession.packetLoss,
        reconnectCount: activeSession.reconnectCount,
        joinedAt: activeSession.joinedAt,
      })),
      bandwidthUsage: {
        total: totalBandwidthUsage,
        average: activeConnections > 0 ? totalBandwidthUsage / activeConnections : 0
      },
      recentActivity: formattedActivity
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
