import Link from "next/link";
import {
  Video,
  Grid3x3,
  Shield,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const navigationCards: Array<{
    href: string;
    title: string;
    description: string;
    Icon: LucideIcon;
    accentBg: string;
    accentHover: string;
    iconColor: string;
    focusRing: string;
  }> = [
    {
      href: "/church",
      title: "Church Interface",
      description: "Low-bandwidth join flow for participating churches.",
      Icon: Video,
      accentBg: "bg-sky-100",
      accentHover: "group-hover:bg-sky-200",
      iconColor: "text-sky-600",
      focusRing: "focus-visible:outline-sky-500",
    },
    {
      href: "/wall",
      title: "Video Wall",
      description: "Paginated wall with up to 20 live tiles per page.",
      Icon: Grid3x3,
      accentBg: "bg-emerald-100",
      accentHover: "group-hover:bg-emerald-200",
      iconColor: "text-emerald-600",
      focusRing: "focus-visible:outline-emerald-500",
    },
    {
      href: "/admin",
      title: "Admin Portal",
      description: "Manage services, session codes, and church access.",
      Icon: Shield,
      accentBg: "bg-indigo-100",
      accentHover: "group-hover:bg-indigo-200",
      iconColor: "text-indigo-600",
      focusRing: "focus-visible:outline-indigo-500",
    },
  ];

  const highlights = [
    {
      title: "Optimised Streams",
      detail: "240x180 video @ 8fps keeps bandwidth near 300-500 Kbps.",
    },
    {
      title: "Reliable Sessions",
      detail: "Daily.co rooms with audio muted by default to prevent feedback.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-100">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Virtual Video Wall
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              UKZ1 Church VideoWall
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Connecting 50-60 churches every zonal meeting with a resilient, low-bandwidth video wall built on Next.js 15 and Daily.co.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                Open Admin Portal
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/wall"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                Preview Video Wall
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {highlights.map(({ title, detail }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{detail}</p>
                </article>
              ))}
            </div>
          </section>

          <nav
            className="grid gap-6"
            role="navigation"
            aria-label="Primary navigation"
          >
            {navigationCards.map(({ href, title, description, Icon, accentBg, accentHover, iconColor, focusRing }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  focusRing,
                )}
                aria-label={`${title} – ${description}`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
                      accentBg,
                      accentHover,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className={cn("h-8 w-8", iconColor)} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
                    <p className="mt-3 text-sm text-slate-600">{description}</p>
                  </div>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition group-hover:text-slate-900">
                  Enter {title}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </main>
    </div>
  );
}
