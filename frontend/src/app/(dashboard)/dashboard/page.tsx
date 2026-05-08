'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, BarChart3, Brain, CheckCircle, Shield, TrendingUp, Zap } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const areaData = [
  { time: '00:00', incidents: 2, analyses: 5 },
  { time: '04:00', incidents: 1, analyses: 3 },
  { time: '08:00', incidents: 6, analyses: 14 },
  { time: '12:00', incidents: 11, analyses: 22 },
  { time: '16:00', incidents: 8, analyses: 18 },
  { time: '20:00', incidents: 4, analyses: 9 },
  { time: '24:00', incidents: 3, analyses: 7 },
]

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#22c55e',
}

export default function DashboardPage() {
  const { data: analytics } = useSWR('/api/incidents/analytics', fetcher, { refreshInterval: 30000 })
  const { data: health } = useSWR('/api/health', fetcher, { refreshInterval: 15000 })
  const { data: incidents } = useSWR('/api/incidents?per_page=5', fetcher, { refreshInterval: 20000 })

  const stats = analytics?.data || {}
  const severityDist = stats.severity_distribution || {}
  const pieData = Object.entries(severityDist).map(([name, value]) => ({ name, value }))

  const statCards = [
    {
      label: 'Total Incidents',
      value: stats.total_incidents ?? '—',
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Analyses Run',
      value: stats.total_analyses ?? '—',
      icon: Brain,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Critical Alerts',
      value: severityDist.critical ?? 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'System Status',
      value: health?.status === 'ok' ? 'Healthy' : 'Degraded',
      icon: Activity,
      color: health?.status === 'ok' ? 'text-green-400' : 'text-orange-400',
      bg: health?.status === 'ok' ? 'bg-green-500/10' : 'bg-orange-500/10',
    },
  ]

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time overview of your incident intelligence platform</p>
        </div>
        <Link href="/playground" className="btn-primary flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4" />
          New Analysis
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-foreground">Activity Overview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Incidents and analyses over 24h</p>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221 83% 62%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221 83% 62%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="analysisGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(253 91% 65%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(253 91% 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 35% 15%)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 8%)', border: '1px solid hsl(222 35% 15%)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: 'hsl(213 31% 91%)' }}
              />
              <Area type="monotone" dataKey="incidents" stroke="hsl(221 83% 62%)" fill="url(#incidentGrad)" strokeWidth={2} name="Incidents" />
              <Area type="monotone" dataKey="analyses" stroke="hsl(253 91% 65%)" fill="url(#analysisGrad)" strokeWidth={2} name="Analyses" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-foreground mb-1">Severity Distribution</h2>
          <p className="text-xs text-muted-foreground mb-4">All time</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(222 40% 8%)', border: '1px solid hsl(222 35% 15%)', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[entry.name] }} />
                      <span className="text-muted-foreground capitalize">{entry.name}</span>
                    </div>
                    <span className="text-foreground font-medium">{entry.value as number}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              No incident data yet
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card"
      >
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Incidents</h2>
          <Link href="/incidents" className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-border/50">
          {incidents?.data?.length > 0 ? (
            incidents.data.map((incident: any) => (
              <div key={incident.id} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                <div className={`dot-${incident.severity}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{incident.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {incident.source_type || 'unknown'} · {new Date(incident.created_at).toLocaleString()}
                  </div>
                </div>
                <span className={`badge-${incident.severity}`}>{incident.severity}</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No incidents yet.{' '}
              <Link href="/playground" className="text-primary hover:underline">
                Run your first analysis
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="glass-card p-5"
      >
        <h2 className="font-semibold text-foreground mb-4">Service Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'API', status: health?.status === 'ok' },
            { name: 'Neo4j', status: health?.services?.neo4j === 'ok' },
            { name: 'Qdrant', status: health?.services?.qdrant === 'ok' },
            { name: 'Database', status: health?.status === 'ok' },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center gap-2 text-sm">
              {svc.status ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              )}
              <span className="text-muted-foreground">{svc.name}</span>
              <span className={svc.status ? 'text-green-400' : 'text-orange-400'}>
                {svc.status ? 'OK' : 'Degraded'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
