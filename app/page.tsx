import Link from "next/link";
import { Video, Grid3x3, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Virtual Video Wall
          </h1>
          <p className="text-xl text-gray-600">
            Connect churches through video for zonal meetings
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Link
            href="/church"
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Video className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Church Interface
              </h2>
              <p className="text-gray-600 text-center">
                Enter your code and join the video wall
              </p>
            </div>
          </Link>

          <Link
            href="/wall"
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Grid3x3 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Video Wall
              </h2>
              <p className="text-gray-600 text-center">
                Display the connected churches
              </p>
            </div>
          </Link>

          <Link
            href="/admin"
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Admin Panel
              </h2>
              <p className="text-gray-600 text-center">
                Manage services and churches
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Optimized for low bandwidth (300-500 Kbps)</p>
          <p className="mt-2">Supports up to 60 simultaneous churches</p>
        </div>
      </div>
    </div>
  );
}
