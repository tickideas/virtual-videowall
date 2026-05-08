"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Church,
  Activity,
  LogOut,
  Users,
  Wifi,
  WifiOff,
  Radio,
  AlertCircle,
  Camera,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSSE } from "@/lib/hooks/use-sse";
import { SiteFooter } from "@/components/layout/site-chrome";
import { AdminHeader } from "@/components/admin/admin-header";
import { VIDEO_QUALITY } from "@/lib/constants";

interface DashboardStats {
  totalChurches: number;
  activeServices: number;
  totalSessions: number;
  activeConnections: number;
  recentActivity: Array<{
    id: string;
    type: "church_joined" | "church_left" | "service_created";
    message: string;
    timestamp: Date;
  }>;
  bandwidthUsage: {
    total: number;
    average: number;
  };
  connections: Array<{
    id: string;
    churchName: string;
    serviceName: string;
    avgBandwidth: number | null;
    connectionQuality: string | null;
    lastHealthAt: Date | null;
    lastStatus: string | null;
    videoStatus: string | null;
    cameraEnabled: boolean;
    packetLoss: number | null;
    reconnectCount: number;
    joinedAt: Date;
  }>;
}

type DashboardActivity = DashboardStats["recentActivity"][number];

type DashboardStatsResponse = Omit<DashboardStats, "recentActivity" | "connections"> & {
  recentActivity?: Array<
    Omit<DashboardActivity, "timestamp"> & { timestamp: string }
  >;
  connections?: Array<
    Omit<DashboardStats["connections"][number], "lastHealthAt" | "joinedAt"> & {
      lastHealthAt: string | null;
      joinedAt: string;
    }
  >;
};

export default function AdminDashboard() {
  const router = useRouter();

  // Use Server-Sent Events for real-time updates (replaces polling)
  const { data: sseStats, isConnected } = useSSE<DashboardStatsResponse>({
    url: "/api/admin/dashboard/stream",
    initialData: {
      totalChurches: 0,
      activeServices: 0,
      totalSessions: 0,
      activeConnections: 0,
      recentActivity: [],
      bandwidthUsage: {
        total: 0,
        average: 0,
      },
      connections: [],
    },
  });

  // Transform SSE data to match component format
  const stats = useMemo<DashboardStats>(() => {
    if (!sseStats) {
      return {
        totalChurches: 0,
        activeServices: 0,
        totalSessions: 0,
        activeConnections: 0,
        recentActivity: [],
        bandwidthUsage: {
          total: 0,
          average: 0,
        },
        connections: [],
      };
    }

    return {
      ...sseStats,
      recentActivity:
        sseStats.recentActivity?.map((activity) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
        })) || [],
      connections:
        sseStats.connections?.map((connection) => ({
          ...connection,
          lastHealthAt: connection.lastHealthAt
            ? new Date(connection.lastHealthAt)
            : null,
          joinedAt: new Date(connection.joinedAt),
        })) || [],
    };
  }, [sseStats]);

  const lastUpdate = useMemo(() => (sseStats ? new Date() : null), [sseStats]);
  const healthNow = lastUpdate?.getTime() ?? 0;

  const loading = !sseStats;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  const connectionIcon = stats.activeConnections > 0 ? Wifi : WifiOff;
  const connectionAccent =
    stats.activeConnections > 0
      ? { bg: "bg-emerald-100", color: "text-emerald-600" }
      : { bg: "bg-slate-100", color: "text-slate-400" };

  const statCards: Array<{
    label: string;
    value: string;
    description: string;
    Icon: LucideIcon;
    iconBg: string;
    iconColor: string;
  }> = [
    {
      label: "Total Churches",
      value: loading ? "..." : stats.totalChurches.toString(),
      description: "Registered communities",
      Icon: Church,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Active Services",
      value: loading ? "..." : stats.activeServices.toString(),
      description: "Currently scheduled",
      Icon: Calendar,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Total Sessions",
      value: loading ? "..." : stats.totalSessions.toString(),
      description: "Lifetime meetings",
      Icon: Activity,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Live Connections",
      value: loading ? "..." : stats.activeConnections.toString(),
      description: "Churches streaming now",
      Icon: connectionIcon,
      iconBg: connectionAccent.bg,
      iconColor: connectionAccent.color,
    },
  ];

  const formattedTotalUsage = loading
    ? "..."
    : `${(stats.bandwidthUsage.total / 1024).toFixed(1)} MB`;
  const formattedAverageUsage = loading
    ? "..."
    : `${stats.bandwidthUsage.average.toFixed(0)} Kbps`;
  const bandwidthTarget = VIDEO_QUALITY.TARGET_BANDWIDTH_KBPS;
  const isBandwidthWarning = !loading && stats.bandwidthUsage.average > bandwidthTarget;
  const staleConnectionCount = stats.connections.filter((connection) => {
    if (!connection.lastHealthAt) {
      return true;
    }
    return healthNow - connection.lastHealthAt.getTime() > 30000;
  }).length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AdminHeader
        actions={
          <>
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Last Updated</p>
                <p className="text-sm font-semibold text-slate-900">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                  isConnected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                <Radio className={cn("h-3 w-3", isConnected && "animate-pulse")} />
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:w-auto sm:px-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </>
        }
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        {/* Welcome Section */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">
              Dashboard
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Monitor live service health, bandwidth, and church connections.
            </p>
          </div>
          <span
            className={cn(
              "inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
              isConnected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600",
            )}
          >
            <Radio className={cn("h-3 w-3", isConnected && "animate-pulse")} />
            {isConnected ? "Live updates" : "Offline"}
          </span>
        </div>

        {/* Stats Grid */}
        <section
          className="mb-5 grid gap-3 lg:gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          }}
        >
          {statCards.map(
            ({ label, value, description, Icon, iconBg, iconColor }) => (
              <article
                key={label}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className={cn("rounded-lg p-2.5 shadow-sm", iconBg)}>
                    <Icon className={cn("h-5 w-5", iconColor)} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums text-slate-900 lg:text-3xl">
                      {value}
                    </p>
                    <div className="mt-1 hidden items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600 sm:inline-flex">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Active
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight text-slate-900">
                    {label}
                  </h3>
                  <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                    {description}
                  </p>
                </div>
              </article>
            ),
          )}
        </section>

        {/* Dashboard Content Grid */}
        <section
          className="mb-6 grid gap-5"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {/* Bandwidth Overview */}
          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Network Performance
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Keep average church bandwidth under {bandwidthTarget.toLocaleString()} Kbps.
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:flex">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  Live
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-5">
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                      <Wifi className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Total Usage</h3>
                      <p className="text-xs text-slate-500">Active connections</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">
                    {formattedTotalUsage}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 w-full rounded-full bg-blue-200">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: "65%" }} />
                    </div>
                    <span className="text-xs text-slate-500">65%</span>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Average per Church</h3>
                      <p className="text-xs text-slate-500">Per connection</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">
                    {formattedAverageUsage}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 w-full rounded-full bg-emerald-200">
                      <div 
                        className={cn(
                          "h-2 rounded-full",
                          isBandwidthWarning ? "bg-amber-500" : "bg-emerald-600"
                        )} 
                        style={{ width: isBandwidthWarning ? '90%' : '70%' }}
                      ></div>
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isBandwidthWarning ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {isBandwidthWarning ? "90%" : "70%"}
                    </span>
                  </div>
                </div>
              </div>
              
              {isBandwidthWarning && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-amber-900">Bandwidth Alert</h4>
                      <p className="text-sm text-amber-800">
                        Average bandwidth usage is above the recommended {bandwidthTarget.toLocaleString()} Kbps.
                        Consider optimizing video quality or reducing active connections to maintain service quality.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Recent Activity */}
          <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h2>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Live Feed
                </span>
              </div>
            </div>
            
            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.slice(0, 6).map((activity) => {
                    const badgeStyles =
                      activity.type === "church_joined"
                        ? { wrapper: "bg-emerald-100", icon: "text-emerald-600", text: "emerald" }
                        : activity.type === "church_left"
                          ? { wrapper: "bg-rose-100", icon: "text-rose-600", text: "rose" }
                          : { wrapper: "bg-blue-100", icon: "text-blue-600", text: "blue" };

                    const ActivityIcon =
                      activity.type === "service_created" ? Calendar : Users;

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
                            badgeStyles.wrapper,
                          )}
                        >
                          <ActivityIcon
                            className={cn("h-4 w-4", badgeStyles.icon)}
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 leading-tight">
                            {activity.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {activity.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">
                    No recent activity. Events will appear here in real-time.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Live Church Health
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Camera, bitrate, reconnect, and heartbeat status from each active church.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  <Wifi className="h-3 w-3" />
                  {stats.connections.length - staleConnectionCount} fresh
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  <AlertCircle className="h-3 w-3" />
                  {staleConnectionCount} stale
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {stats.connections.length > 0 ? (
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Church</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Camera</th>
                    <th className="px-6 py-3">Bandwidth</th>
                    <th className="px-6 py-3">Reconnects</th>
                    <th className="px-6 py-3">Last Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.connections.map((connection) => {
                    const isStale =
                      !connection.lastHealthAt ||
                      healthNow - connection.lastHealthAt.getTime() > 30000;
                    const quality = connection.connectionQuality ?? "unknown";
                    const status = isStale ? "stale" : connection.lastStatus ?? "connected";
                    const bandwidth = connection.avgBandwidth ?? 0;
                    const isOverTarget = bandwidth > bandwidthTarget;

                    return (
                      <tr
                        key={connection.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">
                            {connection.churchName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {connection.serviceName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                              status === "connected"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "reconnecting"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700",
                            )}
                          >
                            {status}
                          </span>
                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {quality}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-slate-700">
                            <Camera
                              className={cn(
                                "h-4 w-4",
                                connection.cameraEnabled
                                  ? "text-emerald-500"
                                  : "text-slate-400",
                              )}
                            />
                            {connection.cameraEnabled ? "On" : "Off"}
                          </span>
                          <p className="mt-1 text-xs text-slate-500">
                            Video: {connection.videoStatus ?? "unknown"}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className={cn(
                              "font-semibold tabular-nums",
                              isOverTarget ? "text-amber-700" : "text-slate-900",
                            )}
                          >
                            {bandwidth} Kbps
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Loss {(connection.packetLoss ?? 0).toFixed(1)}%
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 text-slate-700">
                            <RefreshCw className="h-4 w-4 text-slate-400" />
                            {connection.reconnectCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {connection.lastHealthAt
                            ? connection.lastHealthAt.toLocaleTimeString()
                            : "No heartbeat"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-10 text-center">
                <WifiOff className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-700">No live church health yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Active churches will appear here after joining and sending their first heartbeat.
                </p>
              </div>
            )}
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
