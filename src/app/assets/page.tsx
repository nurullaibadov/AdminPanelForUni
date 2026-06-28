'use client'
import { useEffect, useState } from 'react'
import { Package, Plus, RefreshCw, Edit, Trash2, Eye } from 'lucide-react'
import { assetsApi } from '@/lib/api'
import { Asset } from '@/types'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge, Badge, Modal, ConfirmDialog, Spinner } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(['hardware', 'software', 'license', 'network', 'peripheral']),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired', 'lost']),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  cost: z.coerce.number().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | null>(null)
  const [selected, setSelected] = useState<Asset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const load = () => {
    setLoading(true)
    assetsApi.getAll().then(setAssets).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    reset({ type: 'hardware', status: 'active' })
    setSelected(null)
    setModalMode('create')
  }

  const openEdit = (asset: Asset) => {
    reset(asset as unknown as FormData)
    setSelected(asset)
    setModalMode('edit')
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (modalMode === 'create') {
        await assetsApi.create(data as Record<string, unknown>)
        toast.success('Asset created')
      } else {
        await assetsApi.update(selected!.id, data as Record<string, unknown>)
        toast.success('Asset updated')
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
      await assetsApi.delete(deleteTarget.id)
      toast.success('Asset deleted')
      setDeleteTarget(null)
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const typeColors: Record<string, string> = {
    hardware: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    software: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    license: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    network: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    peripheral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }

  const TypeBadge = ({ type }: { type: string }) => (
    <span className={cn('badge capitalize text-xs', typeColors[type] || 'bg-gray-100 text-gray-700')}>{type}</span>
  )

  const isExpiringSoon = (date?: string) => {
    if (!date) return false
    const days = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days > 0 && days < 30
  }

  const isExpired = (date?: string) => {
    if (!date) return false
    return new Date(date).getTime() < Date.now()
  }

  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    totalCost: assets.reduce((s, a) => s + (a.cost || 0), 0),
    expiringSoon: assets.filter(a => isExpiringSoon(a.warrantyExpiry)).length,
  }

  const columns = [
    {
      key: 'name', label: 'Asset', sortable: true,
      render: (_: unknown, row: Asset) => (
        <div>
          <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{row.name}</p>
          <p className="text-xs text-gray-400">{row.manufacturer} {row.model}</p>
        </div>
      ),
    },
    { key: 'type', label: 'Type', sortable: true, render: (v: unknown) => <TypeBadge type={String(v)} /> },
    { key: 'serial', label: 'Serial', render: (v: unknown) => <code className="text-xs text-gray-500 dark:text-gray-400">{String(v || '—')}</code> },
    { key: 'status', label: 'Status', sortable: true, render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'location', label: 'Location', sortable: true, render: (v: unknown) => <span className="text-sm text-gray-600 dark:text-gray-400">{String(v || '—')}</span> },
    { key: 'assignedTo', label: 'Assigned To', render: (v: unknown) => <span className="text-xs text-gray-500 truncate max-w-[120px] block">{String(v || '—')}</span> },
    {
      key: 'warrantyExpiry', label: 'Warranty', sortable: true,
      render: (v: unknown, row: Asset) => {
        if (!v) return <span className="text-xs text-gray-400">—</span>
        const exp = isExpired(String(v))
        const soon = isExpiringSoon(String(v))
        return (
          <span className={cn('text-xs font-medium', exp ? 'text-red-500' : soon ? 'text-yellow-500' : 'text-gray-500')}>
            {exp ? '⚠ Expired' : soon ? '⚠ Soon' : formatDate(String(v))}
          </span>
        )
      },
    },
    { key: 'cost', label: 'Cost', sortable: true, render: (v: unknown) => <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{v ? formatCurrency(Number(v)) : '—'}</span> },
  ]

  const FormFields = ({ readOnly = false }: { readOnly?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Asset Name</label>
          <input {...register('name')} className="input" disabled={readOnly} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Type</label>
          <select {...register('type')} className="input" disabled={readOnly}>
            {['hardware', 'software', 'license', 'network', 'peripheral'].map(t => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Manufacturer</label>
          <input {...register('manufacturer')} className="input" placeholder="Dell, HP..." disabled={readOnly} />
        </div>
        <div>
          <label className="label">Model</label>
          <input {...register('model')} className="input" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Serial Number</label>
          <input {...register('serial')} className="input font-mono" disabled={readOnly} />
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input" disabled={readOnly}>
            {['active', 'inactive', 'maintenance', 'retired', 'lost'].map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Location</label>
          <input {...register('location')} className="input" disabled={readOnly} />
        </div>
        <div>
          <label className="label">Assigned To</label>
          <input {...register('assignedTo')} className="input" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Cost ($)</label>
          <input {...register('cost')} type="number" className="input" disabled={readOnly} />
        </div>
        <div>
          <label className="label">Purchase Date</label>
          <input {...register('purchaseDate')} type="date" className="input" disabled={readOnly} />
        </div>
        <div>
          <label className="label">Warranty Expiry</label>
          <input {...register('warrantyExpiry')} type="date" className="input" disabled={readOnly} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea {...register('notes')} rows={3} className="input resize-none" disabled={readOnly} />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Asset Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{assets.length} assets in inventory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add Asset</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: stats.total, color: 'text-blue-600', sub: '' },
          { label: 'Active', value: stats.active, color: 'text-green-600', sub: '' },
          { label: 'Total Value', value: formatCurrency(stats.totalCost), color: 'text-purple-600', sub: '' },
          { label: 'Warranty Expiring', value: stats.expiringSoon, color: 'text-yellow-600', sub: 'within 30 days' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]['columns']}
          data={assets as unknown as Record<string, unknown>[]}
          isLoading={loading}
          searchPlaceholder="Search assets..."
          exportFilename="assets"
          actions={(row) => (
            <div className="flex items-center gap-1 justify-end">
              <button onClick={() => { setSelected(row as unknown as Asset); setModalMode('view') }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-600">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => openEdit(row as unknown as Asset)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-green-600">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget(row as unknown as Asset)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      {(modalMode === 'create' || modalMode === 'edit' || modalMode === 'view') && (
        <Modal
          title={modalMode === 'create' ? 'Add Asset' : modalMode === 'edit' ? `Edit: ${selected?.name}` : `Asset: ${selected?.name}`}
          onClose={() => setModalMode(null)}
          size="xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormFields readOnly={modalMode === 'view'} />
            {modalMode !== 'view' && (
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalMode(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">
                  {modalMode === 'create' ? 'Add Asset' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Asset"
          message={`Delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel="Delete"
          danger
        />
      )}
    </div>
  )
}
