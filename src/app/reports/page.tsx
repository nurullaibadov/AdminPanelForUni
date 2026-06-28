'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { reportsApi } from '@/lib/api'
import { ReportSummary } from '@/types'
import { Spinner, StatCard } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { useRef, useState as useStateRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import toast from 'react-hot-toast'

// Generate monthly data
function genMonthly() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month) => ({
    month,
    incidents: Math.floor(Math.random() * 30 + 5),
    resolved: Math.floor(Math.random() * 28 + 3),
    uptime: parseFloat((99 + Math.random() * 0.99).toFixed(2)),
    cost: Math.floor(Math.random() * 20000 + 5000),
    servers: Math.floor(Math.random() * 5 + 20),
  }))
}

const CATEGORY_DATA = [
  { name: 'Outage', value: 12, color: '#ef4444' },
  { name: 'Degraded', value: 23, color: '#f59e0b' },
  { name: 'Security', value: 8, color: '#8b5cf6' },
  { name: 'Maintenance', value: 31, color: '#3b82f6' },
  { name: 'Other', value: 15, color: '#6b7280' },
]

const ASSET_HEALTH = [
  { category: 'Hardware', healthy: 85, warning: 10, critical: 5 },
  { category: 'Software', healthy: 92, warning: 6, critical: 2 },
  { category: 'Network', healthy: 78, warning: 15, critical: 7 },
  { category: 'Licenses', healthy: 95, warning: 3, critical: 2 },
]

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#94a3b8' },
  itemStyle: { color: '#e2e8f0' },
}
const axisProps = { tick: { fontSize: 10, fill: '#94a3b8' }, tickLine: false, axisLine: false }

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [monthly] = useState(genMonthly())
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState('12m')
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    reportsApi.getSummary().then(setSummary).finally(() => setLoading(false))
  }, [])

  const exportPDF = async () => {
    if (!reportRef.current) return
    setExporting(true)
    const toastId = toast.loading('Generating PDF...')
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('EIOMS_Infrastructure_Report.pdf')
      toast.success('PDF Exported Successfully!', { id: toastId })
    } catch (error) {
      toast.error('Failed to generate PDF', { id: toastId })
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <Spinner />

  const currentMonth = monthly[new Date().getMonth()]
  const prevMonth = monthly[new Date().getMonth() - 1] || monthly[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Infrastructure performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden text-xs">
            {['3m', '6m', '12m'].map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 font-medium transition-colors ${dateRange === r ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                {r}
              </button>
            ))}
          </div>
          <button className="btn-secondary text-sm" onClick={exportPDF} disabled={exporting}>
            {exporting ? <Spinner className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-white dark:bg-slate-900 p-2 rounded-xl">
        {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'System Uptime', value: `${summary.uptime99}%`,
              sub: 'SLA target: 99.9%', trend: 0.02, up: true,
              color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20'
            },
            {
              title: 'Avg Resolution Time', value: '4.2h',
              sub: 'P1 incidents this month', trend: -12.5, up: false,
              color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20'
            },
            {
              title: 'Infrastructure Cost', value: formatCurrency(currentMonth.cost),
              sub: 'This month', trend: ((currentMonth.cost - prevMonth.cost) / prevMonth.cost * 100), up: false,
              color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20'
            },
            {
              title: 'Asset Utilization', value: '78.4%',
              sub: 'Avg across all assets', trend: 3.1, up: true,
              color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20'
            },
          ].map(k => (
            <div key={k.title} className={`card p-4 ${k.bg}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{k.title}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              <div className="flex items-center gap-2 mt-1">
                {k.trend !== 0 && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${k.up !== (k.trend > 0) ? 'text-red-500' : 'text-green-500'}`}>
                    {k.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(k.trend).toFixed(1)}%
                  </span>
                )}
                <span className="text-xs text-gray-400">{k.sub}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incident trend + Uptime */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Incident Trends (Monthly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="incidents" name="Created" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Incident Categories</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {CATEGORY_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v) => [v, 'incidents']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {CATEGORY_DATA.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uptime + Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">System Uptime (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthly} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gup" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} domain={[99, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, 'Uptime']} />
              <Area type="monotone" dataKey="uptime" stroke="#22c55e" fill="url(#gup)" strokeWidth={2} name="Uptime" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Infrastructure Cost ($)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthly} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Cost']} />
              <Line type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} name="Cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Health */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Asset Health Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ASSET_HEALTH} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" {...axisProps} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="category" {...axisProps} width={70} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`]} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="healthy" name="Healthy" fill="#22c55e" stackId="a" />
            <Bar dataKey="warning" name="Warning" fill="#f59e0b" stackId="a" />
            <Bar dataKey="critical" name="Critical" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      {summary && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Executive Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Servers', value: summary.totalServers },
              { label: 'Online Rate', value: `${((summary.onlineServers / summary.totalServers) * 100).toFixed(0)}%` },
              { label: 'Open Incidents', value: summary.openIncidents },
              { label: 'Active Users', value: summary.activeUsers },
              { label: 'Total Assets', value: summary.totalAssets },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
