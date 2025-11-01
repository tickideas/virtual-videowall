import Link from "next/link";
import { Video, Grid3x3, Shield, Users, Zap, Globe, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      {/* Navigation Header */}
      <header className="w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Grid3x3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">UKZ1 VideoWall</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/wall" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                View Wall
              </Link>
              <Link href="/church" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Join Service
              </Link>
              <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative">
     
        {/* Features Section */}
        <section className="py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
                Built for Scale and Reliability
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Enterprise-grade infrastructure designed specifically for church communities 
                with varying bandwidth capabilities.
              </p>
            </div>

            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2" style={{gridTemplateColumns: "repeat(3, minmax(0, 1fr))"}}>
              <div className="group">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Bandwidth Optimized</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Stream at 240x180 @ 8fps with adaptive quality, ensuring smooth connectivity 
                    even on limited 300-500 Kbps connections.
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Global Reliability</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Powered by Daily.co infrastructure with automatic failover, 
                    ensuring your services never miss a beat.
                  </p>
                </div>
              </div>

              <div className="group">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Easy Management</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Comprehensive admin dashboard with real-time monitoring, 
                    church management, and service orchestration tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Zonal Meetings?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Enjoy seamless virtual collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-all duration-200 group"
              >
                <Shield className="w-5 h-5 mr-2" />
                Access Admin Portal
              </Link>
              <Link
                href="/church"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-transparent px-8 py-4 text-base font-semibold text-white hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                <Video className="w-5 h-5 mr-2" />
                Join a Service
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Grid3x3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">UKZ1 VideoWall</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2025 UKZ1 Virtual Video Wall. Built for church communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
