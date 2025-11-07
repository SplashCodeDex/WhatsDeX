import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">WhatsDeX</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white">
                SaaS Platform
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/analytics" className="text-gray-300 hover:text-white transition-colors">
                Analytics
              </Link>
              <Link href="/admin" className="text-gray-300 hover:text-white transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-6xl font-bold text-white mb-6">
              WhatsApp Bot
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                SaaS Platform
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Professional WhatsApp bot management platform with enterprise-grade monitoring, 
              analytics, and multi-tenant architecture.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard" className="btn-primary">
                📊 View Dashboard
              </Link>
              <Link href="/analytics" className="btn-secondary">
                📈 Analytics
              </Link>
              <Link href="/admin" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                👑 Admin Panel
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">WhatsApp Bot Engine</h3>
              <p className="text-gray-300">
                100+ commands, AI chat, media downloads, group management, and more.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
              <p className="text-gray-300">
                Track usage, performance, revenue, and user engagement in real-time.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-white mb-2">Multi-Tenant SaaS</h3>
              <p className="text-gray-300">
                Serve multiple customers with isolated bot instances and dashboards.
              </p>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-400 font-semibold">✅ Bot Engine</div>
              <div className="text-sm text-gray-300">Ready</div>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="text-blue-400 font-semibold">📊 Monitoring</div>
              <div className="text-sm text-gray-300">Active</div>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
              <div className="text-purple-400 font-semibold">🌐 Dashboard</div>
              <div className="text-sm text-gray-300">Live</div>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-yellow-400 font-semibold">🚀 SaaS Ready</div>
              <div className="text-sm text-gray-300">95%</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            WhatsDeX Platform - Enterprise WhatsApp Bot SaaS Solution
          </p>
        </div>
      </footer>
    </div>
  )
}