import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateMetricHistory(points = 24, base = 50, variance = 20) {
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(Date.now() - (points - i) * 3600000).toISOString(),
    value: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance * 2)),
  }))
}

export const statusColors = {
  online: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  offline: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  maintenance: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  warning: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  active: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  inactive: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
  suspended: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  open: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  'in-progress': 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  resolved: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  closed: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
  p1: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  p2: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  p3: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
  p4: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  critical: 'text-red-600 bg-red-100',
  high: 'text-orange-600 bg-orange-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-blue-600 bg-blue-100',
  admin: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  manager: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  operator: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30',
  viewer: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30',
} as const

export type StatusKey = keyof typeof statusColors

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function getAvatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=3b82f6`
}

export function exportToCsv(data: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(data[0] || {})
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
