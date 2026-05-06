"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Church,
  Activity,
  Plus,
  LogOut,
  Users,
  Wifi,
  WifiOff,
  Radio,
  Shield,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSSE } from "@/lib/hooks/use-sse";

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
}

type DashboardActivity = DashboardStats["recentActivity"][number];

type DashboardStatsResponse = Omit<DashboardStats, "recentActivity"> & {
  recentActivity?: Array<
    Omit<DashboardActivity, "timestamp"> & { timestamp: string }
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
      };
    }

    return {
      ...sseStats,
      recentActivity:
        sseStats.recentActivity?.map((activity) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
        })) || [],
    };
  }, [sseStats]);

  const lastUpdate = useMemo(() => (sseStats ? new Date() : null), [sseStats]);

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
  const isBandwidthWarning = !loading && stats.bandwidthUsage.average > 400;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                  UKZ1 Admin Portal
                </h1>
                <p className="text-xs lg:text-sm text-slate-500">
                  Control Center Dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-500">Last Updated</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium",
                    isConnected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  <Radio
                    className={cn("h-3 w-3", isConnected && "animate-pulse")}
                  />
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2 h-10 lg:h-11"
              >
                <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 pt-6 lg:pt-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            Welcome to Your Dashboard
          </h2>
          <p className="text-slate-600">
            Monitor your video wall services and manage church connections in real-time.
          </p>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {statCards.map(
            ({ label, value, description, Icon, iconBg, iconColor }) => (
              <article
                key={label}
                className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("rounded-xl p-3 shadow-sm", iconBg)}>
                    <Icon className={cn("h-6 w-6", iconColor)} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums">
                      {value}
                    </p>
                    <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-600 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Active
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    {label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {description}
                  </p>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </article>
            ),
          )}
        </section>

        {/* Dashboard Content Grid */}
        <section className="grid gap-8 lg:grid-cols-3 mb-8">
          {/* Bandwidth Overview */}
          <article className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Network Performance
                  </h2>
                  <p className="text-sm text-slate-600">
                    Real-time bandwidth monitoring and usage analytics
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-emerald-600">Live</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Total Usage</h3>
                      <p className="text-xs text-slate-500">All active connections</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {formattedTotalUsage}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-xs text-slate-500">65%</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Average per Church</h3>
                      <p className="text-xs text-slate-500">Per connection</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">
                    {formattedAverageUsage}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-full bg-emerald-200 rounded-full h-2">
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
                <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">Bandwidth Alert</h4>
                      <p className="text-sm text-amber-800">
                        Average bandwidth usage is above the recommended 400 Kbps. 
                        Consider optimizing video quality or reducing active connections to maintain service quality.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Recent Activity */}
          <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h2>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Live Feed
                </span>
              </div>
            </div>
            
            <div className="p-6">
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

        {/* Quick Actions */}
        <section className="grid gap-6 md:grid-cols-2 mb-8">
          <Link
            href="/admin/services"
            className="group bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="rounded-xl bg-emerald-100 p-4 group-hover:bg-emerald-200 transition-colors">
                  <Calendar className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Service Management
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Create, schedule, and manage your zonal meetings and video sessions with comprehensive control.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-600">Ready to create</span>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-600 group-hover:gap-3">
                  <Plus className="h-4 w-4" />
                  New Service
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/churches"
            className="group bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="rounded-xl bg-blue-100 p-4 group-hover:bg-blue-200 transition-colors">
                  <Church className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Church Directory
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Manage your church network with detailed profiles, unique codes, and connection tracking.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-blue-600">{stats.totalChurches} churches</span>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-blue-600 group-hover:gap-3">
                  <Plus className="h-4 w-4" />
                  Add Church
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* Quick Start Guide */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden">
          <div className="p-8 lg:p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Quick Start Guide
                </h3>
                <p className="text-slate-300">
                  Get your video wall running in minutes
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                  <h4 className="font-semibold text-white">Setup Churches</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Create church profiles with unique 6-digit codes for identification and security.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                  <h4 className="font-semibold text-white">Create Service</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Schedule your zonal meeting and generate a session code for churches to join.
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                  <h4 className="font-semibold text-white">Monitor & Manage</h4>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Open the video wall, monitor connections, and ensure smooth streaming experience.
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/admin/churches"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Church className="w-4 h-4" />
                Start with Churches
              </Link>
              <Link
                href="/admin/services"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Create Service
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
