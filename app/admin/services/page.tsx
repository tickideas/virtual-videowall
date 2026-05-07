"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Plus,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Power,
  Square,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { SiteFooter } from "@/components/layout/site-chrome";
import { AdminHeader } from "@/components/admin/admin-header";

interface Service {
  id: string;
  name: string;
  sessionCode: string;
  startTime: string;
  endTime: string | null;
  active: boolean;
  maxChurches: number;
  _count: {
    sessions: number;
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    maxChurches: 60,
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    try {
      setError("");
      const response = await fetch("/api/admin/services");
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to load services");
      }
      const data = await response.json();
      setServices(Array.isArray(data.services) ? data.services : []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      setError(error instanceof Error ? error.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchServices();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: "", startTime: "", maxChurches: 60 });
        setShowForm(false);
        fetchServices();
      }
    } catch (error) {
      console.error("Error creating service:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const updateService = async (id: string, action: "activate" | "deactivate" | "end") => {
    setUpdatingServiceId(id);

    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (response.ok) {
        await fetchServices();
      }
    } catch (error) {
      console.error("Error updating service:", error);
    } finally {
      setUpdatingServiceId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AdminHeader
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="h-10 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create Service</span>
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {showForm && (
          <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Create New Service
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Schedule a zonal meeting and generate a wall access code.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Service Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Monthly Zonal Meeting - January 2024"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium text-slate-700">
                    Start Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxChurches" className="text-sm font-medium text-slate-700">
                    Maximum Churches
                  </Label>
                  <Input
                    id="maxChurches"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxChurches}
                    onChange={(e) =>
                      setFormData({ ...formData, maxChurches: parseInt(e.target.value) })
                    }
                    className="h-10"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-10 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Service
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="h-10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-400" />
            <p className="text-slate-500">Loading services...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <h2 className="text-lg font-semibold text-red-900">Unable to load services</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-red-700">{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLoading(true);
                void fetchServices();
              }}
              className="mt-6 border-red-200 bg-white text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900">No services yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Create a service to generate a session code for churches and the wall display.
            </p>
            <Button onClick={() => setShowForm(true)} className="mt-6 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Create Service
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Services</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage session codes, wall links, and join availability.
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                    <Radio className="h-3 w-3" />
                    {services.filter((service) => service.active).length} active
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                    {services.length} total
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
              >
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 truncate text-base font-semibold text-slate-900">
                          {service.name}
                        </h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          service.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {service.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span>{format(new Date(service.startTime), "MMM d, yyyy h:mm a")}</span>
                        <span>{service._count.sessions} / {service.maxChurches} churches</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">Session Code</p>
                      <p className="truncate font-mono text-lg font-bold tracking-wider text-slate-900">
                        {service.sessionCode}
                      </p>
                    </div>
                    <button
                      onClick={() => copyCode(service.sessionCode)}
                      className="rounded-md p-2 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Copy session code"
                      aria-label={`Copy session code ${service.sessionCode}`}
                    >
                      {copiedCode === service.sessionCode ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className="mt-3 grid gap-2"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  }}
                >
                  <Link href={`/wall/${service.sessionCode}`} target="_blank">
                    <Button size="sm" variant="outline" className="w-full whitespace-nowrap">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open Wall
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingServiceId === service.id}
                    onClick={() => updateService(service.id, service.active ? "deactivate" : "activate")}
                    className="gap-2"
                  >
                    {updatingServiceId === service.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                    {service.active ? "Lock Joins" : "Reopen"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingServiceId === service.id || Boolean(service.endTime)}
                    onClick={() => updateService(service.id, "end")}
                    className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <Square className="h-4 w-4" />
                    {service.endTime ? "Ended" : "End Service"}
                  </Button>
                </div>
              </article>
            ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
