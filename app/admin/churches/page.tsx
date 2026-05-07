"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Church,
  Plus,
  Loader2,
  Trash2,
  AlertTriangle,
  MapPin,
  Hash,
  LayoutGrid,
  List,
} from "lucide-react";
import { SiteFooter } from "@/components/layout/site-chrome";
import { AdminHeader } from "@/components/admin/admin-header";
import { cn } from "@/lib/utils";

interface Church {
  id: string;
  name: string;
  code: string;
  location: string | null;
  _count: {
    sessions: number;
  };
}

export default function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [formData, setFormData] = useState({ name: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [churchToDelete, setChurchToDelete] = useState<Church | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchChurches = async () => {
    try {
      setError("");
      const response = await fetch("/api/admin/churches");
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to load churches");
      }
      const data = await response.json();
      setChurches(Array.isArray(data.churches) ? data.churches : []);
    } catch (error) {
      console.error("Error fetching churches:", error);
      setChurches([]);
      setError(error instanceof Error ? error.message : "Failed to load churches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchChurches();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/churches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: "", location: "" });
        setShowForm(false);
        fetchChurches();
      }
    } catch (error) {
      console.error("Error creating church:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!churchToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/churches?id=${churchToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setChurchToDelete(null);
        fetchChurches();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete church");
      }
    } catch (error) {
      console.error("Error deleting church:", error);
      alert("Failed to delete church");
    } finally {
      setDeleting(false);
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
            <span>Add Church</span>
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {showForm && (
          <div className="mb-5">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Add New Church
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Create a new church profile with unique identification
                </p>
              </div>
              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700">
                        Church Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        placeholder="First Baptist Church"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="City, State"
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
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Adding Church...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Church
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
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
            <p className="text-slate-500">Loading churches...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <h2 className="text-lg font-semibold text-red-900">Unable to load churches</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-red-700">{error}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setLoading(true);
                void fetchChurches();
              }}
              className="mt-6 border-red-200 bg-white text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="mb-1 text-lg font-bold text-slate-900">
                      Church Directory
                    </h2>
                    <p className="text-sm text-slate-600">
                      Manage your church network and their connection details
                    </p>
                  </div>
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode("cards")}
                        className={cn(
                          "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                          viewMode === "cards"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-900",
                        )}
                        aria-pressed={viewMode === "cards"}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={cn(
                          "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                          viewMode === "list"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-900",
                        )}
                        aria-pressed={viewMode === "list"}
                      >
                        <List className="h-4 w-4" />
                        List
                      </button>
                    </div>
                    <div
                      className="flex min-w-10 justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700"
                      aria-label={`${churches.length} churches`}
                    >
                      {churches.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {churches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Church className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No churches yet
                </h3>
                <p className="text-slate-600 mb-6">
                  Get started by adding your first church to the directory
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Church
                </Button>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-3">
                {churches.map((church) => (
                  <article
                    key={church.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                  >
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                      }}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <Church className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {church.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            {church.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {church.location}
                              </span>
                            )}
                            <span>
                              {church._count.sessions} session
                              {church._count.sessions !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <div>
                          <span className="text-xs font-medium text-slate-500">
                            Church Code
                          </span>
                          <div className="font-mono text-lg font-bold tracking-wider text-slate-900">
                            {church.code}
                          </div>
                        </div>
                        <Hash className="h-4 w-4 text-slate-400" />
                      </div>

                      <div className="flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChurchToDelete(church)}
                          disabled={church._count.sessions > 0}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 px-3 text-xs"
                          title={
                            church._count.sessions > 0
                              ? "Cannot delete church with existing sessions"
                              : "Delete church"
                          }
                          aria-label={`Delete ${church.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                }}
              >
                {churches.map((church) => (
                  <article
                    key={church.id}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <Church className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {church.name}
                          </h3>
                          {church.location && (
                            <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {church.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {church._count.sessions} session
                          {church._count.sessions !== 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setChurchToDelete(church)}
                          disabled={church._count.sessions > 0}
                          className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          title={
                            church._count.sessions > 0
                              ? "Cannot delete church with existing sessions"
                              : "Delete church"
                          }
                          aria-label={`Delete ${church.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          Church Code
                        </span>
                        <Hash className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="font-mono text-xl font-bold tracking-wider text-slate-900">
                        {church.code}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {churchToDelete && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                aria-describedby="delete-modal-description"
              >
                <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        id="delete-modal-title"
                        className="text-xl font-bold text-slate-900"
                      >
                        Delete Church
                      </h3>
                      <p className="text-sm text-slate-500">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <p
                    id="delete-modal-description"
                    className="text-slate-600 mb-6 leading-relaxed"
                  >
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-slate-900">
                      {churchToDelete.name}
                    </span>
                    ? This will permanently remove the church from your directory.
                  </p>

                  {churchToDelete._count.sessions > 0 && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-900 mb-1">
                            Cannot Delete Church
                          </h4>
                          <p className="text-sm text-amber-800">
                            This church has {churchToDelete._count.sessions} existing session
                            {churchToDelete._count.sessions !== 1 ? 's' : ''}. 
                            Churches with sessions cannot be deleted to maintain data integrity.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                      Church Details
                    </h4>
                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-slate-500">Name</span>
                        <p className="font-medium text-slate-900">{churchToDelete.name}</p>
                      </div>
                      {churchToDelete.location && (
                        <div>
                          <span className="text-slate-500">Location</span>
                          <p className="font-medium text-slate-900">{churchToDelete.location}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Code</span>
                        <p className="font-mono font-bold text-slate-900">{churchToDelete.code}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Sessions</span>
                        <p className="font-medium text-slate-900">{churchToDelete._count.sessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => setChurchToDelete(null)}
                      className="flex-1 h-12"
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting || churchToDelete._count.sessions > 0}
                      className="flex-1 h-12"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Church
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
