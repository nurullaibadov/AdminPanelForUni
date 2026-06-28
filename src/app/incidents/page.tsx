'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, Plus, RefreshCw, Eye, Edit, Trash2, Clock, CheckCircle2 } from 'lucide-react'
import { incidentsApi } from '@/lib/api'
import { Incident } from '@/types'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge, Badge, Modal, ConfirmDialog, Spinner } from '@/components/ui'
import { formatDateTime, formatRelativeTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(5, 'Title too short'),
  description: z.string().min(10),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']),
  priority: z.enum(['p1', 'p2', 'p3', 'p4']),
  category: z.enum(['outage', 'degraded', 'security', 'maintenance', 'other']),
  assignedTo: z.string().email().optional().or(z.literal('')),
})
type FormData = z.infer<typeof schema>

const priorityInfo: Record<string, { label: string; color: string; bg: string }> = {
  p1: { label: 'P1 Critical', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  p2: { label: 'P2 High', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  p3: { label: 'P3 Medium', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  p4: { label: 'P4 Low', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | null>(null)
  const [selected, setSelected] = useState<Incident | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const load = () => {
    setLoading(true)
    incidentsApi.getAll().then(setIncidents).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    reset({ status: 'open', priority: 'p3', category: 'other' })
    setSelected(null)
    setModalMode('create')
  }

  const openEdit = (inc: Incident) => {
    reset({ title: String(inc.title), description: String(inc.description), status: inc.status, priority: inc.priority, category: inc.category, assignedTo: inc.assignedTo })
    setSelected(inc)
    setModalMode('edit')
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (modalMode === 'create') {
        await incidentsApi.create(data as Record<string, unknown>)
        toast.success('Incident created')
      } else {
        await incidentsApi.update(selected!.id, data as Record<string, unknown>)
        toast.success('Incident updated')
      }
      setModalMode(null)
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await incidentsApi.delete(deleteTarget.id)
      toast.success('Incident deleted')
      setDeleteTarget(null)
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const info = priorityInfo[priority] || priorityInfo.p4
    return <span className={cn('badge font-bold uppercase text-xs', info.color, info.bg)}>{info.label}</span>
  }

  const stats = {
    open: incidents.filter(i => i.status === 'open').length,
    inProgress: incidents.filter(i => i.status === 'in-progress').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    p1: incidents.filter(i => i.priority === 'p1').length,
  }

  const columns = [
    {
      key: 'id', label: '#', render: (v: unknown) => <span className="text-xs text-gray-400 font-mono">#{String(v)}</span>
    },
    {
      key: 'title', label: 'Title', sortable: true,
      render: (v: unknown) => <span className="text-sm font-medium text-gray-900 dark:text-white capitalize line-clamp-1 max-w-xs">{String(v)}</span>
    },
    { key: 'priority', label: 'Priority', sortable: true, render: (v: unknown) => <PriorityBadge priority={String(v)} /> },
    { key: 'status', label: 'Status', sortable: true, render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'category', label: 'Category', sortable: true, render: (v: unknown) => <Badge variant="info" className="capitalize text-xs">{String(v)}</Badge> },
    { key: 'assignedTo', label: 'Assigned To', render: (v: unknown) => <span className="text-xs text-gray-500">{String(v || '—')}</span> },
    { key: 'createdAt', label: 'Created', sortable: true, render: (v: unknown) => <span className="text-xs text-gray-400">{formatRelativeTime(String(v))}</span> },
  ]

  const FormFields = ({ readOnly = false }: { readOnly?: boolean }) => (
    <div className="space-y-4">
      <div>
        <label className="label">Title</label>
        <input {...register('title')} className="input" placeholder="Brief incident title" disabled={readOnly} />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea {...register('description')} rows={4} className="input resize-none" placeholder="Detailed incident description..." disabled={readOnly} />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Priority</label>
          <select {...register('priority')} className="input" disabled={readOnly}>
            <option value="p1">P1 Critical</option>
            <option value="p2">P2 High</option>
            <option value="p3">P3 Medium</option>
            <option value="p4">P4 Low</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input" disabled={readOnly}>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select {...register('category')} className="input" disabled={readOnly}>
            <option value="outage">Outage</option>
            <option value="degraded">Degraded</option>
            <option value="security">Security</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Assigned To (email)</label>
        <input {...register('assignedTo')} type="email" className="input" placeholder="engineer@company.com" disabled={readOnly} />
        {errors.assignedTo && <p className="text-red-500 text-xs mt-1">{errors.assignedTo.message}</p>}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Incident Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{incidents.length} total incidents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />New Incident</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'P1 Critical', value: stats.p1, color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
        ].map(s => (
          <div key={s.label} className={cn('card p-4', s.bg)}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]['columns']}
          data={incidents as unknown as Record<string, unknown>[]}
          isLoading={loading}
          searchPlaceholder="Search incidents..."
          exportFilename="incidents"
          actions={(row) => (
            <div className="flex items-center gap-1 justify-end">
              <button onClick={() => { setSelected(row as unknown as Incident); setModalMode('view') }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-600">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => openEdit(row as unknown as Incident)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-green-600">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget(row as unknown as Incident)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      {/* View modal */}
      {modalMode === 'view' && selected && (
        <Modal title={`Incident #${selected.id}`} onClose={() => setModalMode(null)} size="lg">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <PriorityBadge priority={selected.priority} />
              <StatusBadge status={selected.status} />
              <Badge variant="info" className="capitalize">{selected.category}</Badge>
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white capitalize">{String(selected.title)}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{String(selected.description)}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Assigned To</p>
                <p className="font-medium">{selected.assignedTo || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Reported By</p>
                <p className="font-medium">{selected.reportedBy || '—'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Created</p>
                <p className="font-medium">{formatDateTime(selected.createdAt)}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                <p className="font-medium">{formatDateTime(selected.updatedAt)}</p>
              </div>
            </div>
            {selected.affectedSystems?.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Affected Systems</p>
                <div className="flex flex-wrap gap-2">
                  {selected.affectedSystems.map((s) => <Badge key={s} variant="danger" className="text-xs">{s}</Badge>)}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { openEdit(selected); }} className="btn-primary flex-1">Edit Incident</button>
              <button onClick={() => setModalMode(null)} className="btn-secondary flex-1">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Modal
          title={modalMode === 'create' ? 'Create Incident' : `Edit Incident #${selected?.id}`}
          onClose={() => setModalMode(null)}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormFields />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalMode(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">
                {modalMode === 'create' ? 'Create Incident' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Incident"
          message={`Delete incident "${String(deleteTarget.title).slice(0, 50)}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel="Delete"
          danger
        />
      )}
    </div>
  )
}
