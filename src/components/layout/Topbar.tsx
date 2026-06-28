'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Bell, Search, Sun, Moon, RefreshCw, Check, CheckCheck, Trash2, AlertTriangle, Info, BellOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getAvatarUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Modal, Badge } from '@/components/ui'

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Dashboard', description: 'System overview and key metrics' },
  '/users': { title: 'User Management', description: 'Manage platform users and permissions' },
  '/servers': { title: 'Server Management', description: 'Monitor and manage infrastructure servers' },
  '/monitoring': { title: 'Monitoring', description: 'Real-time performance metrics' },
  '/incidents': { title: 'Incidents', description: 'Track and resolve operational incidents' },
  '/assets': { title: 'Asset Management', description: 'Hardware, software and license inventory' },
  '/reports': { title: 'Reports', description: 'Analytics and operational insights' },
  '/settings': { title: 'Settings', description: 'System configuration and preferences' },
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [darkMode, setDarkMode] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [time, setTime] = useState(new Date())

  const pageInfo = pageTitles[pathname] || { title: 'EIOMS', description: 'Enterprise Operations' }

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const isDark = localStorage.getItem('eioms-theme') === 'dark'
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('eioms-theme', next ? 'dark' : 'light')
  }

  const [notifs, setNotifs] = useState([
    { id: 1, type: 'critical', msg: 'DB-01 CPU usage exceeded 95%', time: '2m ago', read: false },
    { id: 2, type: 'warning', msg: 'SSL certificate expires in 7 days', time: '15m ago', read: false },
    { id: 3, type: 'info', msg: 'Scheduled maintenance at 02:00 AM', time: '1h ago', read: false },
    { id: 4, type: 'critical', msg: 'New P1 incident created: API outage', time: '3h ago', read: false },
    { id: 5, type: 'info', msg: 'Backup completed successfully', time: '5h ago', read: true },
    { id: 6, type: 'warning', msg: 'High disk latency detected on Web-02', time: '1d ago', read: true },
    { id: 7, type: 'info', msg: 'User role updated for John Doe', time: '2d ago', read: true },
    { id: 8, type: 'critical', msg: 'Security policy violation alert: unauthorized root login attempt', time: '3d ago', read: true },
  ])
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'critical' | 'warning' | 'info'>('all')
  const [notifSearch, setNotifSearch] = useState('')

  const unreadCount = notifs.filter(n => !n.read).length
  const criticalCount = notifs.filter(n => n.type === 'critical' && !n.read).length

  const toggleRead = (id: number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))
  }

  const markAsRead = (id: number) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotif = (id: number) => {
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifs = () => {
    setNotifs([])
  }

  const filteredNotifs = notifs.filter(n => {
    const matchesSearch = n.msg.toLowerCase().includes(notifSearch.toLowerCase())
    if (!matchesSearch) return false
    if (notifFilter === 'all') return true
    if (notifFilter === 'unread') return !n.read
    return n.type === notifFilter
  })

  return (
    <header className="h-16 glass border-b border-gray-200/50 dark:border-slate-700/50 flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-30">
      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400">
        <Menu className="w-5 h-5" />
      </button>

      {/* Page info */}
      <div className="hidden sm:block">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{pageInfo.title}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">{pageInfo.description}</p>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-2 w-56">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          placeholder="Search..."
          className="bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none w-full"
        />
      </div>

      {/* Clock */}
      <span className="hidden lg:block text-xs text-gray-500 dark:text-gray-400 font-mono">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>

      {/* Dark mode */}
      <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors">
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {showNotifs && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>
                {criticalCount > 0 && (
                  <span className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    {criticalCount} critical
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifs.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id)
                      }}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer flex items-start gap-3",
                        !n.read && "bg-blue-50/10 dark:bg-blue-900/5"
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                        n.type === 'critical' ? 'bg-red-500' :
                        n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs", !n.read ? "text-gray-900 dark:text-white font-medium" : "text-gray-700 dark:text-gray-300")}>{n.msg}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setShowNotifs(false)
                    setShowNotifModal(true)
                  }}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline w-full text-center font-medium"
                >
                  View all notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User avatar */}
      {user && (
        <img
          src={getAvatarUrl(user.name)}
          alt={user.name}
          className="w-8 h-8 rounded-full border-2 border-primary-200 dark:border-primary-800 cursor-pointer"
          title={user.name}
        />
      )}

      {/* View All Notifications Modal */}
      {showNotifModal && (
        <Modal
          title="Notifications Center"
          onClose={() => setShowNotifModal(false)}
          size="lg"
        >
          <div className="space-y-4">
            {/* Search and Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center pb-2 border-b border-gray-100 dark:border-slate-800">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  className="input pl-9 py-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={markAllAsRead}
                  disabled={notifs.every(n => n.read)}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
                <button
                  onClick={clearAllNotifs}
                  disabled={notifs.length === 0}
                  className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-gray-100 dark:border-slate-800">
              {(['all', 'unread', 'critical', 'warning', 'info'] as const).map((filterType) => {
                const count = notifs.filter(n => {
                  if (filterType === 'all') return true;
                  if (filterType === 'unread') return !n.read;
                  return n.type === filterType;
                }).length;

                return (
                  <button
                    key={filterType}
                    onClick={() => setNotifFilter(filterType)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                      notifFilter === filterType
                        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent"
                    )}
                  >
                    {filterType}
                    <span className="ml-1.5 px-1.5 py-0.25 text-[10px] rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Notifications List */}
            <div className="divide-y divide-gray-100 dark:divide-slate-800 max-h-[50vh] overflow-y-auto pr-1">
              {filteredNotifs.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-2">
                  <BellOff className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm font-semibold">No notifications found</p>
                  <p className="text-xs">There are no notifications matching your filters.</p>
                </div>
              ) : (
                filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "py-3.5 px-4 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200 group border border-transparent",
                      !n.read && "bg-blue-50/20 dark:bg-blue-900/5 border-l-2 border-l-primary-500"
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "p-2 rounded-lg flex-shrink-0 mt-0.5",
                        n.type === 'critical' ? 'bg-red-50 dark:bg-red-950/20 text-red-500' :
                        n.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500' :
                        'bg-blue-50 dark:bg-blue-950/20 text-blue-500'
                      )}>
                        {n.type === 'critical' ? <AlertTriangle className="w-4 h-4" /> :
                         n.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         <Info className="w-4 h-4" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-semibold capitalize",
                            n.type === 'critical' ? 'text-red-600 dark:text-red-400' :
                            n.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-blue-600 dark:text-blue-400'
                          )}>
                            {n.type}
                          </span>
                          <span className="text-[10px] text-gray-400">{n.time}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                          )}
                        </div>
                        <p className={cn(
                          "text-sm mt-0.5 break-words",
                          n.read ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white font-medium"
                        )}>
                          {n.msg}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleRead(n.id)}
                        title={n.read ? "Mark as unread" : "Mark as read"}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNotif(n.id)}
                        title="Delete notification"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </header>
  )
}
