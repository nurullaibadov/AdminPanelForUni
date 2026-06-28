'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getAvatarUrl, cn } from '@/lib/utils'
import { Save, Shield, Bell, Database, Palette, Key, Users, Lock, Trash2, Plus, Copy, Download, Upload, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { settingsApi, usersApi } from '@/lib/api'
import { Spinner, Badge } from '@/components/ui'
import { useTheme } from 'next-themes'

const TABS = [
  { id: 'profile', label: 'Profile', icon: Users },
  { id: 'security', label: 'Security & Access', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'system', label: 'System & Advanced', icon: Database },
]

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onChange(!checked)
        }}
        className={cn("relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer", checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600')}
      >
        <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", checked ? 'translate-x-6' : 'translate-x-1')} />
      </button>
      {label && <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>}
    </div>
  )
}

const ACCENT_COLORS = [
  { hex: '#3b82f6', label: 'Blue',   tailwind: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a',950:'#172554' } },
  { hex: '#8b5cf6', label: 'Violet', tailwind: { 50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',800:'#5b21b6',900:'#4c1d95',950:'#2e1065' } },
  { hex: '#10b981', label: 'Green',  tailwind: { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b',950:'#022c22' } },
  { hex: '#f59e0b', label: 'Amber',  tailwind: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f',950:'#451a03' } },
  { hex: '#ef4444', label: 'Red',    tailwind: { 50:'#fef2f2',100:'#fee2e2',200:'#fecaca',300:'#fca5a5',400:'#f87171',500:'#ef4444',600:'#dc2626',700:'#b91c1c',800:'#991b1b',900:'#7f1d1d',950:'#450a0a' } },
  { hex: '#06b6d4', label: 'Cyan',   tailwind: { 50:'#ecfeff',100:'#cffafe',200:'#a5f3fc',300:'#67e8f9',400:'#22d3ee',500:'#06b6d4',600:'#0891b2',700:'#0e7490',800:'#155e75',900:'#164e63',950:'#083344' } },
]

function applyAccentColor(color: typeof ACCENT_COLORS[0]) {
  const root = document.documentElement
  Object.entries(color.tailwind).forEach(([shade, hex]) => {
    // Convert hex to RGB for Tailwind
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    root.style.setProperty(`--color-primary-${shade}`, `${r} ${g} ${b}`)
  })
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [accentColor, setAccentColor] = useState('#3b82f6')

  // -- Profile State --
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || 'IT',
  })

  // -- Security State --
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome on Windows', ip: '10.0.1.45', time: 'Current session', current: true },
    { id: 2, device: 'Safari on iPhone', ip: '192.168.1.10', time: '2 hours ago', current: false },
    { id: 3, device: 'Firefox on Ubuntu', ip: '10.0.2.33', time: 'Yesterday', current: false },
  ])

  // -- Preferences State --
  const [prefs, setPrefs] = useState({
    timezone: 'UTC',
    language: 'en',
    emailAlerts: true,
    slackAlerts: false,
    smsAlerts: false,
    incidentCreated: true,
    serverDown: true,
    cpuAlert: true,
    memAlert: true,
    weeklyReport: true,
    maintenanceReminder: false,
  })

  // -- System State --
  const [system, setSystem] = useState({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.internal.com',
    refreshInterval: '30',
    sessionTimeout: '60',
    maxLoginAttempts: '5',
    logRetention: '90',
    backupEnabled: true,
    maintenanceMode: false,
    debugMode: false,
    auditLogging: true,
  })

  // -- API Keys State --
  const [apiKeys, setApiKeys] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    fetchSettings()
    // Restore saved accent color from localStorage
    const savedAccent = localStorage.getItem('eioms_accent')
    if (savedAccent) {
      setAccentColor(savedAccent)
      const color = ACCENT_COLORS.find(c => c.hex === savedAccent)
      if (color) applyAccentColor(color)
    }
  }, [])

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getSettings()
      if (data.preferences) {
        setPrefs(p => ({ ...p, ...data.preferences }))
        if (data.preferences.twoFactor !== undefined) setTwoFactor(data.preferences.twoFactor)
      }
      if (data.system && Object.keys(data.system).length > 0) setSystem(data.system)
      setApiKeys(data.apiKeys || [])
    } catch (error: any) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const toastId = toast.loading('Saving settings...')
    try {
      switch (tab) {
        case 'profile': {
          // Update core profile data + localization preferences
          const updatedUser = await usersApi.update(user.id, profile)
          setUser({ ...user, ...updatedUser })
          const profilePrefs = { ...prefs, twoFactor }
          await settingsApi.updatePreferences(profilePrefs)
          break
        }
        case 'security': {
          // Update password if filled
          if (passwordForm.new) {
            if (passwordForm.new !== passwordForm.confirm) {
              throw new Error('New passwords do not match')
            }
            if (!passwordForm.current) {
              throw new Error('Current password is required')
            }
            await usersApi.update(user.id, { password: passwordForm.new })
            setPasswordForm({ current: '', new: '', confirm: '' })
          }
          // Save 2FA preference
          const securityPrefs = { ...prefs, twoFactor }
          await settingsApi.updatePreferences(securityPrefs)
          break
        }
        case 'notifications': {
          // Save notification preferences
          const notifPrefs = { ...prefs, twoFactor }
          await settingsApi.updatePreferences(notifPrefs)
          break
        }
        case 'appearance': {
          // Theme and accent color are saved instantly (localStorage/next-themes)
          // Just persist preferences to server for cross-device sync
          const appearancePrefs = { ...prefs, twoFactor, accentColor }
          await settingsApi.updatePreferences(appearancePrefs)
          break
        }
        case 'system': {
          if (user.role !== 'admin') {
            throw new Error('Only administrators can modify system settings')
          }
          await settingsApi.updateSystem(system)
          break
        }
      }
      
      toast.success('Settings saved successfully!', { id: toastId })
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  // API Key handlers
  const handleGenerateKey = async () => {
    try {
      const name = prompt('Enter a name for the new API Key:')
      if (!name) return
      const newKey = await settingsApi.createApiKey(name)
      setApiKeys([...apiKeys, newKey])
      toast.success('API Key generated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate key')
    }
  }

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this key?')) return
    try {
      await settingsApi.deleteApiKey(id)
      setApiKeys(apiKeys.filter(k => k.id !== id))
      toast.success('API Key revoked')
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke key')
    }
  }

  // Backup handlers
  const handleDownloadBackup = () => {
    const backupData = { profile, prefs, system, timestamp: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `eioms_settings_backup_${new Date().getTime()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded')
  }

  const handleRevokeSession = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id))
    toast.success('Session revoked')
  }

  if (loading) return <div className="p-10 flex justify-center"><Spinner className="w-8 h-8" /></div>

  const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="py-6 border-b border-gray-200 dark:border-slate-700/60 last:border-0 animate-fade-in">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )

  const renderTab = () => {
    switch (tab) {
      case 'profile':
        return (
          <div className="max-w-2xl">
            <div className="flex items-center gap-6 mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700/50 rounded-2xl border border-blue-100 dark:border-slate-600">
              <img src={getAvatarUrl(profile.name)} className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md" alt={profile.name} />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{profile.email}</p>
                <Badge variant="info" className="capitalize px-3 py-1 text-xs">{user?.role}</Badge>
              </div>
            </div>
            <Section title="Personal Information" description="Update your personal details">
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: 'Full Name', key: 'name', type: 'text' },
                  { label: 'Email Address', key: 'email', type: 'email' },
                  { label: 'Phone Number', key: 'phone', type: 'tel' },
                  { label: 'Department', key: 'department', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input
                      type={f.type}
                      value={profile[f.key as keyof typeof profile]}
                      onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                      className="input"
                    />
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Localization" description="Regional settings for your account">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="label">Timezone</label>
                  <select value={prefs.timezone} onChange={e => setPrefs(p => ({ ...p, timezone: e.target.value }))} className="input">
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">US Eastern (EST/EDT)</option>
                    <option value="America/Los_Angeles">US Pacific (PST/PDT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Central European Time (CET/CEST)</option>
                    <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Language</label>
                  <select value={prefs.language} onChange={e => setPrefs(p => ({ ...p, language: e.target.value }))} className="input">
                    <option value="en">English (US)</option>
                    <option value="en-gb">English (UK)</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
            </Section>
          </div>
        )

      case 'security':
        return (
          <div className="max-w-2xl">
            <Section title="Change Password" description="Ensure your account is using a long, random password to stay secure">
              <div className="space-y-4 max-w-md p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" value={passwordForm.current} onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" value={passwordForm.new} onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))} className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} className="input" placeholder="••••••••" />
                </div>
              </div>
            </Section>
            <Section title="Two-Factor Authentication" description="Add an extra layer of security to your account">
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Authenticator App</p>
                    <p className="text-xs text-gray-500 mt-1">Use an authenticator app or security key for 2FA</p>
                  </div>
                </div>
                <Toggle checked={twoFactor} onChange={setTwoFactor} />
              </div>
            </Section>
            <Section title="Active Sessions" description="Devices that are currently logged into your account">
              <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Activity className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.device}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.ip} · {s.time}</p>
                      </div>
                    </div>
                    {s.current ? (
                      <Badge variant="success" className="text-xs">Current Session</Badge>
                    ) : (
                      <button onClick={() => handleRevokeSession(s.id)} className="btn-ghost text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1">Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )

      case 'notifications':
        return (
          <div className="max-w-2xl">
            <Section title="Alert Channels" description="Where you want to receive notifications">
              <div className="space-y-1">
                {[
                  { key: 'emailAlerts', label: 'Email Notifications', desc: 'Receive alerts directly to your inbox' },
                  { key: 'slackAlerts', label: 'Slack Integration', desc: 'Send alerts to your team Slack channel' },
                  { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Critical alerts via text message (Charges may apply)' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{n.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                    </div>
                    <Toggle checked={prefs[n.key as keyof typeof prefs] as boolean} onChange={v => setPrefs(prev => ({ ...prev, [n.key]: v }))} />
                  </div>
                ))}
              </div>
            </Section>
            <Section title="System Events" description="Select which events trigger a notification">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'incidentCreated', label: 'New Incident Created' },
                  { key: 'serverDown', label: 'Server Goes Offline' },
                  { key: 'cpuAlert', label: 'CPU Usage > 90%' },
                  { key: 'memAlert', label: 'Memory Usage > 85%' },
                  { key: 'weeklyReport', label: 'Weekly Summary Report' },
                  { key: 'maintenanceReminder', label: 'Maintenance Reminders' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{n.label}</p>
                    <Toggle checked={prefs[n.key as keyof typeof prefs] as boolean} onChange={v => setPrefs(prev => ({ ...prev, [n.key]: v }))} />
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )

      case 'appearance':
        return (
          <div className="max-w-2xl">
            <Section title="Theme Preference" description="Choose your preferred interface theme">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light Mode', icon: '☀️', preview: 'bg-white border-gray-200' },
                  { id: 'dark', label: 'Dark Mode', icon: '🌙', preview: 'bg-slate-900 border-slate-700' },
                  { id: 'system', label: 'System Default', icon: '💻', preview: 'bg-gradient-to-r from-white to-slate-900 border-gray-300' }
                ].map(t => {
                  const isActive = mounted && theme === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id)
                        toast.success(`Theme set to ${t.label}`)
                      }}
                      className={cn(
                        "relative p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 group",
                        isActive
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-lg shadow-primary-500/10 ring-2 ring-primary-500/20'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500 hover:shadow-md'
                      )}
                    >
                      {/* Theme preview bar */}
                      <div className={cn('w-full h-8 rounded-lg border', t.preview)} />
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-sm font-semibold">{t.label}</span>
                      {isActive && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {mounted && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Currently using <strong className="capitalize">{resolvedTheme}</strong> theme
                </p>
              )}
            </Section>
            <Section title="Accent Color" description="Personalize the primary color used throughout the UI — changes apply instantly">
              <div className="flex gap-4 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 flex-wrap">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      setAccentColor(c.hex)
                      applyAccentColor(c)
                      localStorage.setItem('eioms_accent', c.hex)
                      toast.success(`Accent color set to ${c.label}`)
                    }}
                    className={cn(
                      "w-12 h-12 rounded-full border-4 shadow-sm transition-all duration-200 relative group",
                      accentColor === c.hex
                        ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800'
                        : 'border-transparent hover:scale-110'
                    )}
                    style={{ background: c.hex, '--tw-ring-color': c.hex } as any}
                    title={c.label}
                  >
                    {accentColor === c.hex && (
                      <svg className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </Section>
          </div>
        )

      case 'api':
        return (
          <div className="max-w-3xl">
            <Section title="API Keys" description="Manage programmatic access tokens for integrations">
              <button className="btn-primary mb-6" onClick={handleGenerateKey}>
                <Plus className="w-4 h-4 mr-2" />
                Generate New API Key
              </button>
              
              <div className="space-y-4">
                {apiKeys.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                    <Key className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No API keys generated yet.</p>
                  </div>
                )}
                {apiKeys.map(k => (
                  <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <Key className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{k.name}</p>
                        <code className="text-xs text-primary-600 dark:text-primary-400 font-mono bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded mt-1 inline-block break-all">{k.key}</code>
                        <p className="text-xs text-gray-500 mt-2">Created on {new Date(k.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:self-center self-start">
                      <button className="btn-secondary text-xs" onClick={() => { navigator.clipboard.writeText(k.key); toast.success('Copied to clipboard') }}>
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </button>
                      <button className="btn-danger text-xs" onClick={() => handleDeleteKey(k.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )

      case 'system':
        return (
          <div className="max-w-2xl">
            {user?.role !== 'admin' && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Notice:</strong> Only Administrators can modify System Settings. These fields are read-only for your role.
                </p>
              </div>
            )}
            
            <Section title="Configuration Backup" description="Download a JSON backup of all application settings and configurations">
              <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Export Settings</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Download settings to your local machine</p>
                </div>
                <button onClick={handleDownloadBackup} className="btn-primary bg-blue-600 hover:bg-blue-700 border-none">
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </button>
              </div>
            </Section>

            <Section title="System Parameters" description="Global parameters applied across the entire instance">
              <div className="grid grid-cols-2 gap-5 p-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
                {[
                  { key: 'refreshInterval', label: 'Dashboard Refresh (s)', min: 10, max: 300 },
                  { key: 'sessionTimeout', label: 'Session Timeout (min)', min: 5, max: 480 },
                  { key: 'maxLoginAttempts', label: 'Max Login Attempts', min: 3, max: 10 },
                  { key: 'logRetention', label: 'Log Retention (days)', min: 7, max: 365 },
                ].map(f => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input
                      type="number"
                      value={system[f.key as keyof typeof system] as string}
                      onChange={e => setSystem(p => ({ ...p, [f.key]: e.target.value }))}
                      min={f.min} max={f.max}
                      disabled={user?.role !== 'admin'}
                      className="input disabled:bg-gray-100 disabled:dark:bg-slate-900"
                    />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Global Policies" description="Feature toggles and administrative states">
              <div className="space-y-1">
                {[
                  { key: 'backupEnabled', label: 'Automated Database Backups', desc: 'Run nightly automated backups to cold storage' },
                  { key: 'auditLogging', label: 'Strict Audit Logging', desc: 'Record every read/write action in the system logs' },
                  { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Restrict access to administrators only' },
                  { key: 'debugMode', label: 'Debug Mode', desc: 'Enable verbose logging (Not recommended for production)' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{s.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                    <div className={user?.role !== 'admin' ? 'opacity-50 pointer-events-none' : ''}>
                      <Toggle checked={system[s.key as keyof typeof system] as boolean} onChange={v => setSystem(p => ({ ...p, [s.key]: v }))} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account settings, preferences, and system configuration</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left",
                  tab === t.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 shadow-sm scale-[0.98]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                <t.icon className={cn("w-5 h-5 flex-shrink-0", tab === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 md:p-10 min-h-[600px]">
          <div className="mb-8 pb-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{TABS.find(t => t.id === tab)?.label}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your {TABS.find(t => t.id === tab)?.label.toLowerCase()} preferences</p>
            </div>
            
            <button onClick={handleSave} disabled={saving || (tab === 'system' && user?.role !== 'admin')} className="btn-primary shadow-md">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Save Changes</>
              )}
            </button>
          </div>
          
          <div className="animate-fade-in relative">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  )
}
