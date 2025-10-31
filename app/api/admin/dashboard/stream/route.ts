/**
 * Server-Sent Events endpoint for real-time dashboard stats
 * Replaces polling with efficient push-based updates
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Set up SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Disable buffering for Nginx
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Function to send data to client
      const sendEvent = (data: unknown) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Function to fetch and send stats
      const sendStats = async () => {
        try {
          const [
            totalChurches,
            activeServices,
            totalSessions,
            activeSessions,
            recentActivity,
          ] = await Promise.all([
            prisma.church.count(),
            prisma.service.count({ where: { active: true } }),
            prisma.session.count(),
            prisma.session.findMany({
              where: { isActive: true },
              include: { church: true },
            }),
            prisma.session.findMany({
              take: 5,
              orderBy: { joinedAt: "desc" },
              include: {
                church: true,
                service: true,
              },
            }),
          ]);

          const bandwidthMetrics = activeSessions.reduce(
            (acc, session) => {
              const bandwidth = session.avgBandwidth || 0;
              return {
                total: acc.total + bandwidth,
                count: acc.count + 1,
              };
            },
            { total: 0, count: 0 }
          );

          const stats = {
            totalChurches,
            activeServices,
            totalSessions,
            activeConnections: activeSessions.length,
            recentActivity: recentActivity.map((activity) => {
              const type = activity.isActive
                ? "church_joined"
                : "church_left";
              const message = activity.isActive
                ? `${activity.church.name} joined ${activity.service.name}`
                : `${activity.church.name} left ${activity.service.name}`;

              return {
                id: activity.id,
                type,
                message,
                timestamp: activity.joinedAt.toISOString(),
              };
            }),
            bandwidthUsage: {
              total: bandwidthMetrics.total,
              average:
                bandwidthMetrics.count > 0
                  ? bandwidthMetrics.total / bandwidthMetrics.count
                  : 0,
            },
          };

          sendEvent(stats);
        } catch (error) {
          console.error("Error fetching dashboard stats:", error);
          sendEvent({ error: "Failed to fetch stats" });
        }
      };

      // Send initial stats
      await sendStats();

      // Set up interval to send updates every 10 seconds
      const intervalId = setInterval(sendStats, 10000);

      // Clean up on connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, { headers });
}
