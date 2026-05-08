import Link from "next/link";
import { ArrowRight, MonitorPlay, Shield, Video } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <SiteHeader />

      <main className="relative">
        <section className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid w-full gap-4 md:grid-cols-3">
            <Link
              href="/church"
              className="group overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-950/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-8 md:col-span-2 lg:p-10"
            >
              <div className="flex min-h-56 flex-col justify-between sm:min-h-64">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Video className="h-6 w-6" />
                  </span>
                  <ArrowRight className="h-6 w-6 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">
                    Church access
                  </p>
                  <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
                    Join Service
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-blue-50 sm:text-lg">
                    Connect your church camera to the active zonal video wall.
                  </p>
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
              <Link
                href="/wall"
                className="group flex min-h-32 items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:p-6"
              >
                <div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <MonitorPlay className="h-5 w-5 text-emerald-600" />
                  </span>
                  <h2 className="mt-5 text-xl font-bold text-slate-900">
                    Open Wall
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Display connected churches.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/admin"
                className="group flex min-h-32 items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:p-6"
              >
                <div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <Shield className="h-5 w-5 text-indigo-600" />
                  </span>
                  <h2 className="mt-5 text-xl font-bold text-slate-900">
                    Admin
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage services and churches.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
