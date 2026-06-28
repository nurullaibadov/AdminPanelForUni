'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Server, Activity, AlertTriangle,
  Package, BarChart3, Settings, ChevronLeft, ChevronRight,
  Shield, LogOut, Bell, X
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn, getInitials, getAvatarUrl } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { href: '/users', icon: Users, label: 'Users', badge: null },
  { href: '/servers', icon: Server, label: 'Servers', badge: null },
  { href: '/monitoring', icon: Activity, label: 'Monitoring', badge: null },
  { href: '/incidents', icon: AlertTriangle, label: 'Incidents', badge: '5' },
  { href: '/assets', icon: Package, label: 'Assets', badge: null },
  { href: '/reports', icon: BarChart3, label: 'Reports', badge: null },
  { href: '/settings', icon: Settings, label: 'Settings', badge: null },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-slate-700',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex-shrink-0 w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-md">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">EIOMS</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">Enterprise Ops</p>
          </div>
        )}
        {onMobileClose && (
          <button onClick={onMobileClose} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn('sidebar-link group', isActive && 'active', collapsed && 'justify-center px-2')}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn('flex-shrink-0 w-5 h-5', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200')} />
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className={cn(
        'px-3 py-4 border-t border-gray-200 dark:border-slate-700',
        collapsed && 'px-2'
      )}>
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 mb-2">
            <img
              src={getAvatarUrl(user.name)}
              alt={user.name}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate capitalize">{user.role}</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn('sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20', collapsed && 'justify-center px-2')}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col h-screen bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-gray-100 dark:border-slate-800 transition-all duration-300 flex-shrink-0 relative',
        collapsed ? 'w-20' : 'w-64'
      )}>
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-5 -right-3 w-6 h-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative w-72 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-white/20 dark:border-slate-800 flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.1)] animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
