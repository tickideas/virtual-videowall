"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Church, Activity, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats] = useState({
    totalChurches: 0,
    activeServices: 0,
    totalSessions: 0,
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Church className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalChurches}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Churches</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.activeServices}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Active Services</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.totalSessions}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Total Sessions</h3>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin/services">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Manage Services</h2>
                  <p className="text-gray-600 text-sm">Create and manage zonal meetings</p>
                </div>
              </div>
              <Button className="w-full">
                <Plus className="w-4 h-4" />
                Create New Service
              </Button>
            </div>
          </Link>

          <Link href="/admin/churches">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <Church className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Manage Churches</h2>
                  <p className="text-gray-600 text-sm">Add and organize churches</p>
                </div>
              </div>
              <Button className="w-full">
                <Plus className="w-4 h-4" />
                Add New Church
              </Button>
            </div>
          </Link>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Start Guide</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Add churches with unique codes</li>
            <li>Create a service and generate a session code</li>
            <li>Share the session code with churches</li>
            <li>Open the video wall with the session code</li>
            <li>Churches join using their church code</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
