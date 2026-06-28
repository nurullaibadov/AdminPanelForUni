'use client'
import { useEffect, useState } from 'react'
import { UserPlus, Edit, Trash2, Eye, Shield, RefreshCw } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { User } from '@/types'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge, Badge, Modal, ConfirmDialog, Spinner } from '@/components/ui'
import { formatRelativeTime, getAvatarUrl } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().optional(),
  role: z.enum(['admin', 'manager', 'operator', 'viewer']),
  status: z.enum(['active', 'inactive', 'suspended']),
  department: z.string().optional(),
  phone: z.string().optional(),
})
type UserForm = z.infer<typeof userSchema>

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create' | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  })

  const load = () => {
    setLoading(true)
    usersApi.getAll().then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    reset({ role: 'operator', status: 'active' })
    setSelected(null)
    setModalMode('create')
  }

  const openEdit = (user: User) => {
    reset(user as UserForm)
    setSelected(user)
    setModalMode('edit')
  }

  const openView = (user: User) => {
    setSelected(user)
    setModalMode('view')
  }

  const onSubmit = async (data: UserForm) => {
    try {
      if (modalMode === 'create') {
        if (!data.password || data.password.length < 6) {
          toast.error('Password is required and must be at least 6 characters')
          return
        }
        await usersApi.create(data as Record<string, unknown>)
        toast.success('User created successfully')
      } else {
        // Don't send empty password on edit
        const payload = { ...data }
        if (!payload.password) delete payload.password
        await usersApi.update(selected!.id, payload as Record<string, unknown>)
        toast.success('User updated successfully')
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
      await usersApi.delete(deleteTarget.id)
      toast.success('User deleted')
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const roleBadge = (role: string) => {
    const map: Record<string, 'purple' | 'info' | 'success' | 'default'> = {
      admin: 'purple', manager: 'info', operator: 'success', viewer: 'default'
    }
    return <Badge variant={map[role] || 'default'} className="capitalize">{role}</Badge>
  }

  const columns = [
    {
      key: 'name', label: 'User', sortable: true,
      render: (_: unknown, row: User) => (
        <div className="flex items-center gap-3">
          <img src={getAvatarUrl(row.name)} alt={row.name} className="w-8 h-8 rounded-full flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-400">@{row.username}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', sortable: true, render: (v: unknown) => <span className="text-xs">{String(v)}</span> },
    { key: 'role', label: 'Role', sortable: true, render: (v: unknown) => roleBadge(String(v)) },
    { key: 'department', label: 'Department', sortable: true, render: (v: unknown) => <span className="text-sm text-gray-600 dark:text-gray-400">{String(v ?? '—')}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'lastLogin', label: 'Last Login', sortable: true, render: (v: unknown) => <span className="text-xs text-gray-400">{v ? formatRelativeTime(String(v)) : '—'}</span> },
  ]

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name</label>
          <input {...register('name')} className="input" placeholder="John Doe" disabled={modalMode === 'view'} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Username</label>
          <input {...register('username')} className="input" placeholder="johndoe" disabled={modalMode === 'view'} />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>
      </div>
      <div>
        <label className="label">Email</label>
        <input {...register('email')} type="email" className="input" placeholder="john@company.com" disabled={modalMode === 'view'} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      {modalMode === 'create' && (
        <div>
          <label className="label">Password <span className="text-red-500">*</span></label>
          <input {...register('password')} type="password" className="input" placeholder="Min. 6 characters" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
      )}
      {modalMode === 'edit' && (
        <div>
          <label className="label">New Password <span className="text-gray-400 text-xs">(leave blank to keep current)</span></label>
          <input {...register('password')} type="password" className="input" placeholder="Leave blank to keep unchanged" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Role</label>
          <select {...register('role')} className="input" disabled={modalMode === 'view'}>
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register('status')} className="input" disabled={modalMode === 'view'}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Department</label>
          <input {...register('department')} className="input" placeholder="IT, DevOps..." disabled={modalMode === 'view'} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register('phone')} className="input" placeholder="+1 555 0000" disabled={modalMode === 'view'} />
        </div>
      </div>
      {modalMode !== 'view' && (
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setModalMode(null)} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1">
            {modalMode === 'create' ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} total users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-blue-600' },
          { label: 'Active', value: users.filter(u => u.status === 'active').length, color: 'text-green-600' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-purple-600' },
          { label: 'Inactive', value: users.filter(u => u.status !== 'active').length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-5">
        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]['columns']}
          data={users as unknown as Record<string, unknown>[]}
          isLoading={loading}
          searchPlaceholder="Search users..."
          exportFilename="users"
          actions={(row) => (
            <div className="flex items-center gap-1 justify-end">
              <button onClick={() => openView(row as unknown as User)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-blue-600" title="View">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => openEdit(row as unknown as User)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-green-600" title="Edit">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget(row as unknown as User)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-red-600" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Modals */}
      {(modalMode === 'create' || modalMode === 'edit' || modalMode === 'view') && (
        <Modal
          title={modalMode === 'create' ? 'Add New User' : modalMode === 'edit' ? `Edit: ${selected?.name}` : `User: ${selected?.name}`}
          onClose={() => setModalMode(null)}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormFields />
          </form>
        </Modal>
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel="Delete"
          danger
        />
      )}
    </div>
  )
}
