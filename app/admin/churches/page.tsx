"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Church,
  Plus,
  ArrowLeft,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

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
  const [formData, setFormData] = useState({ name: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [churchToDelete, setChurchToDelete] = useState<Church | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchChurches = async () => {
    try {
      const response = await fetch("/api/admin/churches");
      const data = await response.json();
      setChurches(data.churches);
    } catch (error) {
      console.error("Error fetching churches:", error);
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
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="h-10 lg:h-11">
                  <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline ml-2">Back to Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Church className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                  Church Directory
                </h1>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="h-10 lg:h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline ml-2">Add Church</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Add New Church
                </h2>
                <p className="text-blue-100">
                  Create a new church profile with unique identification
                </p>
              </div>
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
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
                        className="h-12"
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
                        className="h-12"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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
                      className="h-12"
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
        ) : (
          <>
            {/* Stats Header */}
            <div className="mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      Church Directory
                    </h2>
                    <p className="text-slate-600">
                      Manage your church network and their connection details
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-900">{churches.length}</div>
                    <div className="text-sm text-slate-500">Total Churches</div>
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
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Church
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {churches.map((church) => (
                  <div
                    key={church.id}
                    className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                        <Church className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                          {church.name}
                        </h3>
                        {church.location && (
                          <p className="text-sm text-slate-500 mb-3">
                            {church.location}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            Church Code
                          </span>
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                        <div className="text-2xl font-bold font-mono text-slate-900 tracking-wider">
                          {church.code}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm text-slate-600">
                            {church._count.sessions} session{church._count.sessions !== 1 ? 's' : ''}
                          </span>
                        </div>
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
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {churchToDelete && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                aria-describedby="delete-modal-description"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
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
                    <div className="grid grid-cols-2 gap-4 text-sm">
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

                  <div className="flex gap-3">
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
      </div>
    </div>
  );
}
