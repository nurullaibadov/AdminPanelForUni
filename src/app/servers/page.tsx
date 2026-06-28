'use client'
import { useEffect, useState } from 'react'
import { Server, RefreshCw, Eye, Plus, Edit, Trash2 } from 'lucide-react'
import { serversApi } from '@/lib/api'
import { Server as ServerType } from '@/types'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge, Badge, Modal, ConfirmDialog, ProgressBar } from '@/components/ui'
import { formatRelativeTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const serverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ip: z.string().min(1, 'IP address is required'),
  hostname: z.string().min(1, 'Hostname is required'),
  os: z.string().min(1, 'OS is required'),
  type: z.enum(['web', 'db', 'cache', 'app', 'load-balancer', 'mail']),
  status: z.enum(['online', 'offline', 'warning', 'maintenance']),
  environment: z.enum(['production', 'staging', 'development', 'testing']),
  location: z.string().optional(),
  cpu: z.coerce.number().min(0).max(100).optional(),
  memory: z.coerce.number().min(0).max(100).optional(),
  disk: z.coerce.number().min(0).max(100).optional(),
  uptime: z.string().optional(),
})
type ServerForm = z.infer<typeof serverSchema>

export default function ServersPage() {
  const [servers, setServers] = useState<ServerType[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ServerType | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServerType | null>(null)
  const [view, setView] = useState<'table' | 'grid'>('table')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ServerForm>({
    resolver: zodResolver(serverSchema),
  })

  const load = () => {
    setLoading(true)
    serversApi.getAll().then(setServers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    reset({ type: 'web', status: 'offline', environment: 'production', cpu: 0, memory: 0, disk: 0, uptime: '0m' })
    setSelected(null)
    setModalMode('create')
  }

  const openEdit = (srv: ServerType) => {
    reset({
      name: srv.name,
      ip: srv.ip,
      hostname: srv.hostname,
      os: srv.os,
      type: srv.type as any,
      status: srv.status as any,
      environment: srv.environment as any,
      location: srv.location,
      cpu: srv.cpu,
      memory: srv.memory,
      disk: srv.disk,
      uptime: srv.uptime,
    })
    setSelected(srv)
    setModalMode('edit')
  }

  const onSubmit = async (data: ServerForm) => {
    try {
      if (modalMode === 'create') {
        await serversApi.create(data as Record<string, unknown>)
        toast.success('Server added successfully')
      } else {
        await serversApi.update(selected!.id, data as Record<string, unknown>)
        toast.success('Server updated successfully')
      }
      setModalMode(null)
      load()
    } catch (err: any) {
      const msg = err?.message || 'Operation failed'
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await serversApi.delete(deleteTarget.id)
      toast.success('Server deleted')
      setDeleteTarget(null)
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const envBadge = (env: string) => {
    const map: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
      production: 'danger', staging: 'warning', development: 'info', testing: 'default'
    }
    return <Badge variant={map[env] || 'default'} className="capitalize text-xs">{env}</Badge>
  }

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      web: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      db: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      cache: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      app: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'load-balancer': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      mail: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    }
    return <span className={cn('badge uppercase text-xs font-bold', colors[type] || 'bg-gray-100 text-gray-700')}>{type}</span>
  }

  const columns = [
    {
      key: 'name', label: 'Server', sortable: true,
      render: (_: unknown, row: ServerType) => (
        <div className="flex items-center gap-3">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
            row.status === 'online' ? 'bg-green-500 shadow-sm shadow-green-500' :
            row.status === 'offline' ? 'bg-red-500' :
            row.status === 'warning' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'
          )} />
          <div>
            <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-400">{row.hostname}</p>
          </div>
        </div>
      ),
    },
    { key: 'ip', label: 'IP Address', sortable: true, render: (v: unknown) => <code className="text-xs bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{String(v)}</code> },
    { key: 'type', label: 'Type', sortable: true, render: (v: unknown) => typeBadge(String(v)) },
    { key: 'environment', label: 'Environment', sortable: true, render: (v: unknown) => envBadge(String(v)) },
    { key: 'status', label: 'Status', sortable: true, render: (v: unknown) => <StatusBadge status={String(v)} /> },
    {
      key: 'cpu', label: 'CPU', sortable: true,
      render: (v: unknown) => (
        <div className="flex items-center gap-2 min-w-[80px]">
          <ProgressBar value={Number(v)} showLabel size="sm" className="flex-1" />
        </div>
      ),
    },
    {
      key: 'memory', label: 'Memory', sortable: true,
      render: (v: unknown) => (
        <div className="flex items-center gap-2 min-w-[80px]">
          <ProgressBar value={Number(v)} showLabel size="sm" className="flex-1" />
        </div>
      ),
    },
    { key: 'location', label: 'Location', sortable: true, render: (v: unknown) => <Badge variant="default" className="text-xs font-mono">{String(v || '—')}</Badge> },
    { key: 'uptime', label: 'Uptime', sortable: false, render: (v: unknown) => <span className="text-xs text-green-600 dark:text-green-400 font-mono">{String(v)}</span> },
  ]

  const stats = {
    total: servers.length,
    online: servers.filter(s => s.status === 'online').length,
    warning: servers.filter(s => s.status === 'warning').length,
    offline: servers.filter(s => s.status === 'offline').length,
  }

  const ServerFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Server Name <span className="text-red-500">*</span></label>
          <input {...register('name')} className="input" placeholder="WEB-01" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">IP Address <span className="text-red-500">*</span></label>
          <input {...register('ip')} className="input" placeholder="10.0.0.1" />
          {errors.ip && <p className="text-red-500 text-xs mt-1">{errors.ip.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Hostname <span className="text-red-500">*</span></label>
          <input {...register('hostname')} className="input" placeholder="web-01.internal" />
          {errors.hostname && <p className="text-red-500 text-xs mt-1">{errors.hostname.message}</p>}
        </div>
        <div>
          <label className="label">Operating System <span className="text-red-500">*</span></label>
          <input {...register('os')} className="input" placeholder="Ubuntu 22.04 LTS" />
          {errors.os && <p className="text-red-500 text-xs mt-1">{errors.os.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Type</label>
          <select {...register('type')} className="input">
            <option value="web">Web</option>
            <option value="db">Database</option>
            <option value="cache">Cache</option>
            <option value="app">Application</option>
            <option value="load-balancer">Load Balancer</option>
            <option value="mail">Mail</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input">
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="warning">Warning</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div>
          <label className="label">Environment</label>
          <select {...register('environment')} className="input">
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Location</label>
          <input {...register('location')} className="input" placeholder="us-east-1" />
        </div>
        <div>
          <label className="label">Uptime</label>
          <input {...register('uptime')} className="input" placeholder="30d 12h" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">CPU %</label>
          <input {...register('cpu')} type="number" min="0" max="100" className="input" />
        </div>
        <div>
          <label className="label">Memory %</label>
          <input {...register('memory')} type="number" min="0" max="100" className="input" />
        </div>
        <div>
          <label className="label">Disk %</label>
          <input {...register('disk')} type="number" min="0" max="100" className="input" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => setModalMode(null)} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Add Server' : 'Save Changes'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Server Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{servers.length} servers across all environments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => setView('table')} className={cn('px-3 py-2 text-xs font-medium transition-colors', view === 'table' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700')}>Table</button>
            <button onClick={() => setView('grid')} className={cn('px-3 py-2 text-xs font-medium transition-colors', view === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700')}>Grid</button>
          </div>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add Server</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Servers', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Online', value: stats.online, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Warning', value: stats.warning, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Offline', value: stats.offline, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(s => (
          <div key={s.label} className={cn('card p-4', s.bg)}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {view === 'table' ? (
        <div className="card p-5">
          <DataTable
            columns={columns as Parameters<typeof DataTable>[0]['columns']}
            data={servers as unknown as Record<string, unknown>[]}
            isLoading={loading}
            searchPlaceholder="Search servers..."
            exportFilename="servers"
            onRowClick={(row) => { setSelected(row as unknown as ServerType); setModalMode('view') }}
            actions={(row) => (
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setSelected(row as unknown as ServerType); setModalMode('view') }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-blue-600">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); openEdit(row as unknown as ServerType) }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-green-600">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row as unknown as ServerType) }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? <div className="col-span-full"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto my-12" /></div> :
            servers.map((srv) => (
              <div key={srv.id} onClick={() => { setSelected(srv); setModalMode('view') }} className="card p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0',
                      srv.status === 'online' ? 'bg-green-500' :
                      srv.status === 'offline' ? 'bg-red-500' :
                      srv.status === 'warning' ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'
                    )} />
                    <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{srv.name}</span>
                  </div>
                  <StatusBadge status={srv.status} />
                </div>
                <p className="text-xs text-gray-400 mb-3">{srv.ip} · {srv.location}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">CPU</span>
                    <span className="font-medium">{srv.cpu}%</span>
                  </div>
                  <ProgressBar value={srv.cpu} size="sm" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Memory</span>
                    <span className="font-medium">{srv.memory}%</span>
                  </div>
                  <ProgressBar value={srv.memory} size="sm" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Disk</span>
                    <span className="font-medium">{srv.disk}%</span>
                  </div>
                  <ProgressBar value={srv.disk} size="sm" />
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  {typeBadge(srv.type)}
                  <span className="text-[10px] text-gray-400">Up {srv.uptime}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Create/Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Modal
          title={modalMode === 'create' ? 'Add New Server' : `Edit Server: ${selected?.name}`}
          onClose={() => setModalMode(null)}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <ServerFormFields />
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {modalMode === 'view' && selected && (
        <Modal title={`Server: ${selected.name}`} onClose={() => setModalMode(null)} size="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Server className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-mono">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.hostname} · {selected.ip}</p>
                <div className="flex gap-2 mt-1">{typeBadge(selected.type)}<StatusBadge status={selected.status} /></div>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={() => { setModalMode(null); setTimeout(() => openEdit(selected), 50) }} className="btn-secondary text-sm"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => { setModalMode(null); setDeleteTarget(selected) }} className="btn-danger text-sm"><Trash2 className="w-4 h-4" />Delete</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'OS', value: selected.os },
                { label: 'Environment', value: selected.environment },
                { label: 'Location', value: selected.location || '—' },
                { label: 'Uptime', value: selected.uptime },
                { label: 'CPU Cores', value: selected.specs ? `${selected.specs.cpuCores} cores` : '—' },
                { label: 'RAM', value: selected.specs ? `${selected.specs.ramGB} GB` : '—' },
                { label: 'Disk', value: selected.specs ? `${selected.specs.diskGB} GB` : '—' },
                { label: 'Network', value: selected.specs?.network || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current Resource Usage</h4>
              {[
                { label: 'CPU Usage', value: selected.cpu },
                { label: 'Memory Usage', value: selected.memory },
                { label: 'Disk Usage', value: selected.disk },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                    <span className="font-semibold">{value}%</span>
                  </div>
                  <ProgressBar value={value} size="md" />
                </div>
              ))}
            </div>

            {selected.tags && selected.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map((tag) => <Badge key={tag} variant="info" className="text-xs">{tag}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Server"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
