import Link from "next/link";
import { Video, Grid3x3, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
            <Grid3x3 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
            UKZ1 Church<br/>VideoWall
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect 50-60 churches simultaneously with optimized low-bandwidth streaming
          </p>
        </div>

        {/* Primary Actions */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          <Link
            href="/church"
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Video className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Join as Church</h2>
            <p className="text-sm text-gray-600 text-center">Connect your camera to the service</p>
          </Link>

          <Link
            href="/wall"
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Grid3x3 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">View Wall</h2>
            <p className="text-sm text-gray-600 text-center">Display live video grid</p>
          </Link>

          <Link
            href="/admin"
            className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin</h2>
            <p className="text-sm text-gray-600 text-center">Manage services & churches</p>
          </Link>
        </div>

        {/* Key Features */}
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
          <div className="p-6 bg-white/60 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Low Bandwidth</h3>
            <p className="text-sm text-gray-600">300-400 Kbps per church with adaptive quality</p>
          </div>
          <div className="p-6 bg-white/60 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Reliable Streaming</h3>
            <p className="text-sm text-gray-600">Powered by Daily.co with auto-reconnect</p>
          </div>
        </div>
      </main>
    </div>
  );
}
