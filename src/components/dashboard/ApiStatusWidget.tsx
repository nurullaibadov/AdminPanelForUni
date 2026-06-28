'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Globe, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiStatus {
  name: string
  url: string
  endpoint: string
  status: 'checking' | 'online' | 'offline' | 'error'
  latency?: number
  description: string
  color: string
}

const APIS: Omit<ApiStatus, 'status' | 'latency'>[] = [
  {
    name: 'DummyJSON Auth',
    url: 'https://dummyjson.com',
    endpoint: 'https://dummyjson.com/auth/login',
    description: 'User authentication & JWT tokens',
    color: 'text-green-500',
  },
  {
    name: 'DummyJSON Users',
    url: 'https://dummyjson.com',
    endpoint: 'https://dummyjson.com/users?limit=1',
    description: 'User management CRUD',
    color: 'text-blue-500',
  },
  {
    name: 'DummyJSON Posts',
    url: 'https://dummyjson.com',
    endpoint: 'https://dummyjson.com/posts?limit=1',
    description: 'Incidents data source',
    color: 'text-purple-500',
  },
  {
    name: 'DummyJSON Products',
    url: 'https://dummyjson.com',
    endpoint: 'https://dummyjson.com/products?limit=1',
    description: 'Asset inventory source',
    color: 'text-yellow-500',
  },
  {
    name: 'Open-Meteo Weather',
    url: 'https://api.open-meteo.com',
    endpoint: 'https://api.open-meteo.com/v1/forecast?latitude=40.4&longitude=49.8&current=temperature_2m',
    description: 'Real-time DC weather data',
    color: 'text-cyan-500',
  },
  {
    name: 'REST Countries',
    url: 'https://restcountries.com',
    endpoint: 'https://restcountries.com/v3.1/region/europe?fields=name,cca2&limit=1',
    description: 'Server location data',
    color: 'text-orange-500',
  },
]

export default function ApiStatusWidget() {
  const [statuses, setStatuses] = useState<ApiStatus[]>(
    APIS.map(a => ({ ...a, status: 'checking' }))
  )
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkAll = async () => {
    setStatuses(prev => prev.map(s => ({ ...s, status: 'checking' })))

    const results = await Promise.allSettled(
      APIS.map(async (api) => {
        const start = Date.now()
        try {
          const method = api.name.includes('Auth') ? 'POST' : 'GET'
          const opts: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
          }
          if (method === 'POST') {
            opts.body = JSON.stringify({ username: 'emilys', password: 'emilyspass' })
          }
          const res = await fetch(api.endpoint, opts)
          const latency = Date.now() - start
          return { ...api, status: res.ok ? 'online' : 'error', latency } as ApiStatus
        } catch {
          return { ...api, status: 'offline', latency: Date.now() - start } as ApiStatus
        }
      })
    )

    setStatuses(results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { ...APIS[i], status: 'offline' as const }
    ))
    setLastCheck(new Date())
  }

  useEffect(() => { checkAll() }, [])

  const online = statuses.filter(s => s.status === 'online').length
  const allGood = online === statuses.length

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Connected Public APIs</h3>
          <span className={cn(
            'badge text-xs',
            allGood ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            online > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          )}>
            {online}/{statuses.length} online
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastCheck && (
            <span className="text-xs text-gray-400">
              Checked {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <button onClick={checkAll} className="btn-ghost p-1.5">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {statuses.map((api) => (
          <div key={api.name} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">
              {api.status === 'checking' ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : api.status === 'online' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('text-xs font-semibold', api.color)}>{api.name}</p>
                {api.latency !== undefined && api.status === 'online' && (
                  <span className="text-[10px] text-gray-400 ml-auto flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />{api.latency}ms
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{api.description}</p>
              <a
                href={api.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary-400 hover:underline truncate block"
              >
                {api.url}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
