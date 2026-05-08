import Link from "next/link";
import type { ReactNode } from "react";
import { Calendar, Church, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  actions?: ReactNode;
}

export function AdminHeader({ actions }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
          <Link
            href="/admin/dashboard"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Go to admin dashboard"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl">
                UKZ1 Admin Portal
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block lg:text-sm">
                Control Center Dashboard
              </p>
            </div>
          </Link>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 lg:gap-3">
            <Link href="/admin/services">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:w-auto sm:px-4"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Services</span>
              </Button>
            </Link>
            <Link href="/admin/churches">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:w-auto sm:px-4"
              >
                <Church className="h-4 w-4" />
                <span className="hidden sm:inline">Churches</span>
              </Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 sm:w-auto sm:px-4"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
