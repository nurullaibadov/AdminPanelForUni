'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Shield, Loader2, User, Mail, Lock, AtSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and _ only'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  role: z.enum(['operator', 'viewer', 'manager']),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'operator' },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await authApi.register(data)
      toast.success('Account created! Please sign in.')
      router.push('/auth/login')
    } catch {
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="label text-slate-300">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-3 shadow-lg shadow-primary-600/30">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-slate-400 text-sm mt-1">Join the EIOMS platform</p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" error={errors.name?.message}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('name')} placeholder="John Doe"
                  className="input pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500" />
              </div>
            </Field>
            <Field label="Username" error={errors.username?.message}>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('username')} placeholder="johndoe"
                  className="input pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500" />
              </div>
            </Field>
          </div>

          <Field label="Email Address" error={errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('email')} type="email" placeholder="john@company.com"
                className="input pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500" />
            </div>
          </Field>

          <Field label="Role" error={errors.role?.message}>
            <select {...register('role')}
              className="input bg-slate-700/50 border-slate-600 text-white focus:border-primary-500">
              <option value="viewer">Viewer</option>
              <option value="operator">Operator</option>
              <option value="manager">Manager</option>
            </select>
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 chars"
                className="input pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password" error={errors.confirmPassword?.message}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'} placeholder="Repeat password"
                className="input pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <div className="pt-1">
            <button type="submit" disabled={isLoading}
              className="w-full btn-primary py-3 text-base font-semibold shadow-lg shadow-primary-600/20">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
