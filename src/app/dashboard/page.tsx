'use client'
import { useEffect, useState } from 'react'
import {
  Server, Users, AlertTriangle, Package, Activity,
  TrendingUp, CheckCircle, Clock, Zap
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { reportsApi, serversApi, incidentsApi } from "@/lib/api"
import ApiStatusWidget from '@/components/dashboard/ApiStatusWidget'
import { ReportSummary, Server as ServerType, Incident } from '@/types'
import { StatCard, StatusBadge, Spinner } from '@/components/ui'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

// Generate sparkline data for charts
function genHistory(points = 24, base = 50, v = 20) {
  return Array.from({ length: points }, (_, i) => ({
    time: `${String(Math.floor((i * 60) / 60)).padStart(2,'0')}:${String((i * 60) % 60).padStart(2,'0')}`,
    cpu: Math.max(5, Math.min(100, base + (Math.random() - 0.5) * v * 2)),
    memory: Math.max(20, Math.min(100, (base + 15) + (Math.random() - 0.5) * v)),
    network: Math.max(0, Math.random() * 800 + 100),
  }))
}

const INCIDENT_PIE = [
  { name: 'Open', value: 5, color: '#ef4444' },
  { name: 'In Progress', value: 8, color: '#3b82f6' },
  { name: 'Resolved', value: 23, color: '#22c55e' },
  { name: 'Closed', value: 12, color: '#6b7280' },
]

const SERVER_TYPES = [
  { name: 'Web', count: 6, color: '#3b82f6' },
  { name: 'DB', count: 4, color: '#8b5cf6' },
  { name: 'App', count: 5, color: '#10b981' },
  { name: 'Cache', count: 3, color: '#f59e0b' },
  { name: 'LB', count: 2, color: '#ef4444' },
  { name: 'Mail', count: 4, color: '#06b6d4' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [criticalServers, setCriticalServers] = useState<ServerType[]>([])
  const [history] = useState(genHistory(24, 45, 25))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportsApi.getSummary(),
      incidentsApi.getAll(),
      serversApi.getAll(),
    ]).then(([sum, incidents, servers]) => {
      setSummary(sum)
      setRecentIncidents(incidents.slice(0, 5))
      setCriticalServers(servers.filter((s: ServerType) => s.status === 'warning' || s.status === 'offline').slice(0, 5))
    }).finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Spinner />

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">All systems operational</span>
        </div>
      </div>

      {/* Stat cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Servers"
            value={summary.totalServers}
            subtitle={`${summary.onlineServers} online · ${summary.offlineServers} offline`}
            icon={<Server className="w-6 h-6" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            trend={{ value: 8.2, positive: true }}
          />
          <StatCard
            title="Open Incidents"
            value={summary.openIncidents}
            subtitle={`${summary.resolvedIncidentsThisMonth} resolved this month`}
            icon={<AlertTriangle className="w-6 h-6" />}
            iconBg="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            trend={{ value: 12.5, positive: false }}
          />
          <StatCard
            title="Total Assets"
            value={summary.totalAssets}
            subtitle="Hardware + Software + Licenses"
            icon={<Package className="w-6 h-6" />}
            iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            trend={{ value: 3.1, positive: true }}
          />
          <StatCard
            title="Active Users"
            value={summary.activeUsers}
            subtitle="Platform users"
            icon={<Users className="w-6 h-6" />}
            iconBg="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
            trend={{ value: 5.7, positive: true }}
          />
        </div>
      )}

      {/* Uptime / quick metrics */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'System Uptime', value: `${summary.uptime99}%`, icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600 dark:text-green-400' },
            { label: 'Avg CPU Usage', value: `${summary.avgCpuUsage}%`, icon: <Zap className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Avg Memory', value: `${summary.avgMemoryUsage}%`, icon: <Activity className="w-4 h-4" />, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Response Time', value: '142ms', icon: <Clock className="w-4 h-4" />, color: 'text-yellow-600 dark:text-yellow-400' },
          ].map((m) => (
            <div key={m.label} className="card p-4 flex items-center gap-3">
              <div className={`${m.color}`}>{m.icon}</div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CPU / Memory trend */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Performance Overview (24h)</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" />CPU</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-500 inline-block" />Memory</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#e2e8f0' }}
                formatter={(v: number) => [`${v.toFixed(1)}%`]}
              />
              <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#cpu)" strokeWidth={2} name="CPU" />
              <Area type="monotone" dataKey="memory" stroke="#8b5cf6" fill="url(#mem)" strokeWidth={2} name="Memory" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Incident distribution */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Incident Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={INCIDENT_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {INCIDENT_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, '']} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {INCIDENT_PIE.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Server types bar + tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server types */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Server Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={SERVER_TYPES} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={35} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {SERVER_TYPES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent incidents */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Incidents</h3>
          <div className="space-y-3">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  inc.priority === 'p1' ? 'bg-red-500' :
                  inc.priority === 'p2' ? 'bg-orange-500' :
                  inc.priority === 'p3' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate capitalize">{String(inc.title)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={inc.status} />
                    <span className="text-[10px] text-gray-400">{formatRelativeTime(inc.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical servers */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attention Required</h3>
          {criticalServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All servers healthy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalServers.map((srv) => (
                <div key={srv.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${srv.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{srv.name}</p>
                    <p className="text-[10px] text-gray-400">{srv.ip} · {srv.location}</p>
                  </div>
                  <StatusBadge status={srv.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Status Widget */}
      <ApiStatusWidget />
    </div>
  )
}
