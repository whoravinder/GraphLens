'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { Filter, Plus, RefreshCw, Search } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info']

export default function IncidentsPage() {
  const [page, setPage] = useState(1)
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const params = new URLSearchParams({ page: String(page), per_page: '20' })
  if (severity) params.set('severity', severity)
  if (status) params.set('status', status)

  const { data, isLoading, mutate } = useSWR(`/api/incidents?${params}`, fetcher, { refreshInterval: 30000 })

  const incidents = data?.data || []
  const total = data?.total || 0
  const hasNext = data?.has_next
  const hasPrev = data?.has_prev

  const filtered = search
    ? incidents.filter((i: any) =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : incidents

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Incidents</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total incidents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="btn-secondary flex items-center gap-1.5 text-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link href="/playground" className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus className="w-3.5 h-3.5" />
            New Incident
          </Link>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="input-field pl-9"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select className="input-field w-36" value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1) }}>
            <option value="">All Severities</option>
            {SEVERITY_ORDER.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className="input-field w-36" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {['open', 'investigating', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><div className="skeleton h-4 w-16 rounded" /></td>
                    <td className="p-4"><div className="skeleton h-4 w-64 rounded" /></td>
                    <td className="p-4"><div className="skeleton h-4 w-20 rounded" /></td>
                    <td className="p-4"><div className="skeleton h-4 w-20 rounded" /></td>
                    <td className="p-4"><div className="skeleton h-4 w-28 rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">
                    No incidents found.{' '}
                    <Link href="/playground" className="text-primary hover:underline">Create your first incident analysis</Link>
                  </td>
                </tr>
              ) : (
                filtered.map((incident: any, i: number) => (
                  <motion.tr
                    key={incident.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-4">
                      <span className={`badge-${incident.severity}`}>{incident.severity}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-foreground max-w-xs truncate">{incident.title}</div>
                      {incident.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{incident.description}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{incident.source_type || '—'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        incident.status === 'open' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        incident.status === 'investigating' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        incident.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-muted-foreground">{new Date(incident.created_at).toLocaleDateString()}</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && (hasPrev || hasNext) && (
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={!hasPrev} className="btn-secondary text-sm disabled:opacity-40">
                Previous
              </button>
              <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext} className="btn-secondary text-sm disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
