'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const mockTimeSeries = Array.from({ length: 14 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (13 - i))
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    incidents: Math.floor(Math.random() * 12) + 1,
    analyses: Math.floor(Math.random() * 25) + 5,
    resolved: Math.floor(Math.random() * 8),
  }
})

const mockRadar = [
  { metric: 'SSH/RDP', score: 82 },
  { metric: 'Malware', score: 65 },
  { metric: 'CVEs', score: 91 },
  { metric: 'Data Exfil', score: 48 },
  { metric: 'Phishing', score: 73 },
  { metric: 'Insider', score: 35 },
]

export default function AnalyticsPage() {
  const { data: analytics } = useSWR('/api/incidents/analytics', fetcher, { refreshInterval: 60000 })
  const stats = analytics?.data || {}
  const severityDist = stats.severity_distribution || {}
  const statusDist = stats.status_distribution || {}

  const severityData = Object.entries(severityDist).map(([name, value]) => ({ name, value }))
  const statusData = Object.entries(statusDist).map(([name, value]) => ({ name, value }))

  const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
    info: '#22c55e',
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform usage metrics and incident intelligence trends
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: stats.total_incidents ?? 0, delta: '+12%' },
          { label: 'Analyses Run', value: stats.total_analyses ?? 0, delta: '+28%' },
          { label: 'Avg Resolution', value: '4.2h', delta: '-18%' },
          { label: 'Detection Rate', value: '94.7%', delta: '+3.2%' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <span className="text-sm text-muted-foreground">{card.label}</span>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">{card.delta} vs last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-foreground mb-1">14-Day Activity</h2>
          <p className="text-xs text-muted-foreground mb-5">Incidents, analyses, and resolutions</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mockTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 35% 15%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 8%)', border: '1px solid hsl(222 35% 15%)', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={2} dot={false} name="Incidents" />
              <Line type="monotone" dataKey="analyses" stroke="#a855f7" strokeWidth={2} dot={false} name="Analyses" />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-foreground mb-1">Threat Radar</h2>
          <p className="text-xs text-muted-foreground mb-5">Attack category exposure scores</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={mockRadar}>
              <PolarGrid stroke="hsl(222 35% 15%)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'hsl(215 20% 50%)' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Exposure" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 8%)', border: '1px solid hsl(222 35% 15%)', borderRadius: '8px', fontSize: '11px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-foreground mb-1">Severity Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-5">Distribution by severity level</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityData.length > 0 ? severityData : [{ name: 'No data', value: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 35% 15%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 8%)', border: '1px solid hsl(222 35% 15%)', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-6"
        >
          <h2 className="font-semibold text-foreground mb-1">Status Distribution</h2>
          <p className="text-xs text-muted-foreground mb-5">Current workflow state</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData.length > 0 ? statusData : [{ name: 'No data', value: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 35% 15%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215 20% 50%)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 8%)', border: '1px solid hsl(222 35% 15%)', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#a855f7" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
