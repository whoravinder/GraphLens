'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  GitBranch,
  Home,
  Network,
  Search,
  Shield,
  Zap,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/playground', icon: Brain, label: 'AI Playground' },
  { href: '/incidents', icon: Shield, label: 'Incidents' },
  { href: '/graph', icon: Network, label: 'Graph View' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/docs', icon: BookOpen, label: 'API Docs' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen border-r border-border/50 bg-background/80 backdrop-blur-xl flex flex-col sticky top-0">
      <div className="p-5 border-b border-border/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">GraphLens AI</div>
            <div className="text-xs text-muted-foreground">Intelligence Platform</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        <div className="section-header px-3 py-2 mb-1">Navigation</div>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${active ? 'active' : ''}`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="glass-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">API Online</span>
          </div>
          <Link
            href="/api/docs"
            target="_blank"
            className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Zap className="w-3 h-3" />
            View OpenAPI Docs
          </Link>
        </div>
        <div className="mt-4 text-center">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">
            Created by Ravinder Singh
          </span>
        </div>
      </div>
    </aside>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <Sidebar />
      <main className="flex-1 overflow-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
