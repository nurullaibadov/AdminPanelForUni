'use client'
import { useEffect, useState, useRef } from 'react'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Activity, RefreshCw, Wifi, Zap, Server, Thermometer, Wind, Droplets, Globe } from 'lucide-react'
import { serversApi, monitoringApi } from '@/lib/api'
import { Server as ServerType } from '@/types'
import { StatusBadge, ProgressBar, Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

function genPoint(base: number, v: number) {
  return Math.max(5, Math.min(98, base + (Math.random() - 0.5) * v * 2))
}

function genHistory(points = 30, base = 50, v = 20) {
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(Date.now() - (points - i) * 60000)
    return {
      time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
      cpu: genPoint(base, v),
      memory: genPoint(base + 15, v),
      disk: genPoint(30, 5),
      network: Math.round(Math.random() * 900 + 100),
      requests: Math.round(Math.random() * 1500 + 200),
    }
  })
}

const COLORS = {
  cpu: '#3b82f6', memory: '#8b5cf6', disk: '#f59e0b',
  network: '#10b981', requests: '#ef4444',
}

const WMO_CODES: Record<number, string> = {
  0: '☀️ Clear', 1: '🌤 Mainly clear', 2: '⛅ Partly cloudy', 3: '☁️ Overcast',
  45: '🌫 Foggy', 51: '🌦 Light drizzle', 61: '🌧 Light rain', 71: '🌨 Light snow',
  80: '🌦 Showers', 95: '⛈ Thunderstorm',
}

export default function MonitoringPage() {
  const [servers, setServers] = useState<ServerType[]>([])
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null)
  const [history, setHistory] = useState(genHistory(30, 45, 25))
  const [live, setLive] = useState(true)
  const [weatherData, setWeatherData] = useState<any[]>([])
  const [currentWeather, setCurrentWeather] = useState<any>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [serversLoading, setServersLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load servers + weather
  useEffect(() => {
    serversApi.getAll()
      .then(s => { setServers(s); setSelectedServer(s[0] || null) })
      .finally(() => setServersLoading(false))

    // Real weather from Open-Meteo
    Promise.all([
      monitoringApi.getWeatherForDCs(),
      monitoringApi.getCurrentWeather(40.4093, 49.8671), // Baku, Azerbaijan
    ]).then(([dcWeather, currentW]) => {
      setWeatherData(dcWeather)
      setCurrentWeather(currentW)
    }).catch(console.error)
      .finally(() => setWeatherLoading(false))
  }, [])

  // Live chart updates
  useEffect(() => {
    if (live) {
      intervalRef.current = setInterval(() => {
        setHistory(prev => {
          const last = prev[prev.length - 1]
          const t = new Date()
          return [...prev.slice(-29), {
            time: `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`,
            cpu: genPoint(last.cpu, 8),
            memory: genPoint(last.memory, 5),
            disk: Math.min(last.disk + 0.1, 95),
            network: Math.round(Math.random() * 900 + 100),
            requests: Math.round(Math.random() * 1500 + 200),
          }]
        })
      }, 3000)
      return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }
  }, [live])

  const current = history[history.length - 1]

  const tooltipStyle = {
    contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 },
    labelStyle: { color: '#94a3b8' },
    itemStyle: { color: '#e2e8f0' },
  }
  const axisProps = { tick: { fontSize: 10, fill: '#94a3b8' }, tickLine: false, axisLine: false }

  const MetricCard = ({ label, value, unit, icon, color }: {
    label: string; value: string | number; unit: string; icon: React.ReactNode; color: string
  }) => (
    <div className="card p-4">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', color)}>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toFixed(1) : value}
        <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Real-Time Monitoring</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {live && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />}
            {live ? 'Live — updates every 3s' : 'Paused'}
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-xs">Weather: <strong className="text-blue-500">Open-Meteo API</strong></span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setHistory(genHistory(30, 45, 25))} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setLive(!live)} className={cn('btn', live ? 'btn-danger' : 'btn-success')}>
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* ── REAL WEATHER WIDGET (Open-Meteo) ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">DC Location Weather</h3>
          <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
            LIVE · Open-Meteo API
          </span>
        </div>
        {weatherLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-500">Fetching real weather data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {weatherData.map((dc: any, i) => {
              const w = dc.weather?.current
              const wCode = WMO_CODES[w?.weather_code] || '🌐 Unknown'
              return (
                <div key={i} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-center">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate mb-1">{dc.name}</p>
                  <p className="text-lg">{wCode.split(' ')[0]}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    {w?.temperature_2m?.toFixed(1) ?? '--'}°C
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-gray-400">{w?.relative_humidity_2m ?? '--'}%</span>
                    <Wind className="w-3 h-3 text-gray-400 ml-1" />
                    <span className="text-[10px] text-gray-400">{w?.wind_speed_10m?.toFixed(0) ?? '--'}km/h</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Server selector */}
      {!serversLoading && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {servers.slice(0, 8).map(srv => (
            <button
              key={srv.id}
              onClick={() => { setSelectedServer(srv); setHistory(genHistory(30, srv.cpu, 20)) }}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                selectedServer?.id === srv.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-primary-300'
              )}
            >
              <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                srv.status === 'online' ? 'bg-green-400' :
                srv.status === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
              )} />
              {srv.name}
            </button>
          ))}
        </div>
      )}

      {/* Current metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="CPU Usage" value={current.cpu} unit="%" icon={<Zap className="w-4 h-4 text-blue-600" />} color="bg-blue-50 dark:bg-blue-900/20" />
        <MetricCard label="Memory Usage" value={current.memory} unit="%" icon={<Activity className="w-4 h-4 text-purple-600" />} color="bg-purple-50 dark:bg-purple-900/20" />
        <MetricCard label="Network I/O" value={current.network} unit="Mbps" icon={<Wifi className="w-4 h-4 text-green-600" />} color="bg-green-50 dark:bg-green-900/20" />
        <MetricCard label="Requests/s" value={current.requests} unit="rps" icon={<Server className="w-4 h-4 text-red-600" />} color="bg-red-50 dark:bg-red-900/20" />
      </div>

      {/* CPU + Memory chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {selectedServer ? `${selectedServer.name} — ` : ''}CPU & Memory (Live)
          </h3>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />CPU</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded" />Memory</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gcpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gmem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
            <XAxis dataKey="time" {...axisProps} interval={4} />
            <YAxis {...axisProps} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`]} />
            <Area type="monotone" dataKey="cpu" stroke={COLORS.cpu} fill="url(#gcpu)" strokeWidth={2} name="CPU" />
            <Area type="monotone" dataKey="memory" stroke={COLORS.memory} fill="url(#gmem)" strokeWidth={2} name="Memory" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Network + Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Network Traffic (Mbps)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis dataKey="time" {...axisProps} interval={4} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} Mbps`]} />
              <Line type="monotone" dataKey="network" stroke={COLORS.network} strokeWidth={2} dot={false} name="Network" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Requests per Second</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="greq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
              <XAxis dataKey="time" {...axisProps} interval={4} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} rps`]} />
              <Area type="monotone" dataKey="requests" stroke={COLORS.requests} fill="url(#greq)" strokeWidth={2} name="Requests" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Server health table */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">All Servers Health</h3>
        {serversLoading ? <Spinner /> : (
          <div className="space-y-3">
            {servers.slice(0, 12).map(srv => (
              <div key={srv.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                  srv.status === 'online' ? 'bg-green-500' :
                  srv.status === 'offline' ? 'bg-red-500' :
                  srv.status === 'warning' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'
                )} />
                <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white w-28 flex-shrink-0">{srv.name}</span>
                <span className="text-xs text-gray-400 w-20 flex-shrink-0">{srv.ip}</span>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  {[
                    { label: 'CPU', val: srv.cpu },
                    { label: 'RAM', val: srv.memory },
                    { label: 'Disk', val: srv.disk },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{m.label}</span>
                        <span className={m.val > 80 ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-400'}>{m.val}%</span>
                      </div>
                      <ProgressBar value={m.val} size="sm" />
                    </div>
                  ))}
                </div>
                <StatusBadge status={srv.status} />
                {(srv as any).locationFlag && (
                  <img src={(srv as any).locationFlag} alt="" className="w-6 h-4 rounded-sm object-cover flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
