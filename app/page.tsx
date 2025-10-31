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
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 mb-6">
                  <Zap className="w-4 h-4" />
                  Enterprise-Grade Video Collaboration
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                  Connect Your
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Church Community
                  </span>
                  Virtually
                </h1>
                
                <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
                  Stream high-quality video to 50-60 churches simultaneously with our 
                  bandwidth-optimized platform. Built for reliability, designed for scale.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link
                    href="/church"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 group"
                  >
                    Join Service
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/wall"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                  >
                    View Video Wall
                  </Link>
                </div>
                
                <div className="flex items-center gap-8 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    99.9% Uptime
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    &lt;400 Kbps Bandwidth
                  </div>
                </div>
              </div>
              
              <div className="relative lg:block">
                <div className="relative rounded-2xl bg-white p-8 shadow-2xl border border-slate-200">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25"></div>
                  <div className="relative bg-white rounded-xl p-6">
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center">
                      <Grid3x3 className="w-16 h-16 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-slate-200 rounded-full w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded-full w-1/2"></div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
                        <div className="w-8 h-8 bg-emerald-100 rounded-full"></div>
                        <div className="w-8 h-8 bg-purple-100 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">60+</div>
                <div className="text-sm font-medium text-slate-600">Churches Connected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">&lt;400</div>
                <div className="text-sm font-medium text-slate-600">Kbps Per Stream</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">99.9%</div>
                <div className="text-sm font-medium text-slate-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">24/7</div>
                <div className="text-sm font-medium text-slate-600">Support</div>
              </div>
            </div>
          </div>
        </section>

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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              Join thousands of churches already using our platform for seamless virtual collaboration.
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
              © 2024 UKZ1 Virtual Video Wall. Built for church communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
