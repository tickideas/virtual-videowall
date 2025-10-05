"use client";

import { useState, useEffect } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalChurches: number;
  activeServices: number;
  totalSessions: number;
  activeConnections: number;
  recentActivity: Array<{
    id: string;
    type: 'church_joined' | 'church_left' | 'service_created';
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
  const [stats, setStats] = useState<DashboardStats>({
    totalChurches: 0,
    activeServices: 0,
    totalSessions: 0,
    activeConnections: 0,
    recentActivity: [],
    bandwidthUsage: {
      total: 0,
      average: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data: DashboardStatsResponse = await response.json();
        setStats({
          ...data,
          recentActivity: data.recentActivity?.map((activity) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          })) || []
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  const connectionIcon = stats.activeConnections > 0 ? Wifi : WifiOff;
  const connectionAccent = stats.activeConnections > 0
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
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Control Center
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">
              Last updated at {lastUpdate ? lastUpdate.toLocaleTimeString() : "—"}
              {loading && <span className="ml-2 inline-flex items-center text-xs text-blue-600">• Updating</span>}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="self-start gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12 pt-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 xl:gap-6">
          {statCards.map(({ label, value, description, Icon, iconBg, iconColor }) => (
            <article
              key={label}
              className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <div className={cn("rounded-full p-2.5", iconBg)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <p className="text-3xl font-semibold text-slate-900 tabular-nums">{value}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3 xl:gap-8">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Bandwidth Overview</h2>
                <p className="text-sm text-slate-500">
                  Monitor usage to stay within the 400 Kbps target.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Live
              </span>
            </div>
            <dl className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Total Usage</dt>
                <dd className="mt-2 text-2xl font-semibold text-slate-900">{formattedTotalUsage}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Average per Church</dt>
                <dd className="mt-2 text-2xl font-semibold text-slate-900">{formattedAverageUsage}</dd>
              </div>
            </dl>
            {isBandwidthWarning && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Average bandwidth usage is above the recommended 400 Kbps. Review active streams to maintain quality for all churches.
              </div>
            )}
          </article>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Last 5 events
              </span>
            </div>
            {loading ? (
              <div className="mt-6 animate-pulse space-y-3">
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
              </div>
            ) : stats.recentActivity.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity) => {
                  const badgeStyles =
                    activity.type === "church_joined"
                      ? { wrapper: "bg-emerald-50", icon: "text-emerald-600" }
                      : activity.type === "church_left"
                      ? { wrapper: "bg-rose-50", icon: "text-rose-600" }
                      : { wrapper: "bg-blue-50", icon: "text-blue-600" };

                  const ActivityIcon =
                    activity.type === "service_created" ? Calendar : Users;

                  return (
                    <li
                      key={activity.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", badgeStyles.wrapper)}>
                        <ActivityIcon className={cn("h-4 w-4", badgeStyles.icon)} />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                        <p className="text-xs text-slate-500">
                          {activity.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
                No recent activity yet. New events will appear here.
              </p>
            )}
          </aside>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:gap-8">
          <Link
            href="/admin/services"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <div className="flex items-start gap-4">
              <span className="rounded-full bg-emerald-100 p-4 text-emerald-600">
                <Calendar className="h-7 w-7" />
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Manage Services</h3>
                <p className="mt-2 text-sm text-slate-500">Create and manage upcoming zonal meetings.</p>
              </div>
            </div>
            <span className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-emerald-600">
              <Plus className="h-4 w-4" />
              Create New Service
            </span>
          </Link>

          <Link
            href="/admin/churches"
            className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <div className="flex items-start gap-4">
              <span className="rounded-full bg-blue-100 p-4 text-blue-600">
                <Church className="h-7 w-7" />
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Manage Churches</h3>
                <p className="mt-2 text-sm text-slate-500">Add organisations and keep their details up to date.</p>
              </div>
            </div>
            <span className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-blue-600">
              <Plus className="h-4 w-4" />
              Add New Church
            </span>
          </Link>
        </section>

        <section className="mt-8">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-blue-50 to-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-indigo-900">Quick Start Guide</h3>
            <p className="mt-2 text-sm text-indigo-800">
              Keep every church aligned before each service begins.
            </p>
            <ol className="mt-4 space-y-2 text-sm text-indigo-900">
              <li className="flex gap-3">
                <span className="font-semibold">1.</span>
                <span>Create church profiles with unique codes.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold">2.</span>
                <span>Set up a service and generate a session code.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold">3.</span>
                <span>Share the session code with participating churches.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold">4.</span>
                <span>Open the video wall using the active session.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold">5.</span>
                <span>Churches join from the interface with their code.</span>
              </li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
