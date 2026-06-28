'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Shield, Loader2, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { User as UserType } from '@/types'

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    // DummyJSON demo credentials
    defaultValues: { username: 'emilys', password: 'emilyspass', remember: false },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      // Real DummyJSON auth: POST https://dummyjson.com/auth/login
      const result = await authApi.login(data.username, data.password)
      login(result.user as UserType, result.token, data.remember)
      toast.success(`Welcome back, ${result.user.name}! ✓`)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-600/30">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to EIOMS</h1>
        <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
      </div>

      {/* Card */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
        {/* Demo hint — real DummyJSON credentials */}
        <div className="mb-6 p-3 bg-primary-900/40 border border-primary-700/40 rounded-lg space-y-1">
          <p className="text-xs text-primary-300 text-center font-medium">🔐 Live API: DummyJSON Auth</p>
          <p className="text-[11px] text-slate-400 text-center">
            Username: <strong className="text-primary-300">emilys</strong> &nbsp;·&nbsp;
            Password: <strong className="text-primary-300">emilyspass</strong>
          </p>
          <p className="text-[10px] text-slate-500 text-center">
            Or try: <span className="text-slate-400">michaelw / michaelwpass</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <div>
            <label className="label text-slate-300">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register('username')}
                type="text"
                placeholder="emilys"
                className="input pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500"
              />
            </div>
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register('remember')}
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 text-primary-600 focus:ring-primary-500 bg-slate-700"
              />
              <span className="text-sm text-slate-400">Remember me</span>
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-base font-semibold shadow-lg shadow-primary-600/20"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Create account
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-slate-600 mt-6">
        Powered by <a href="https://dummyjson.com" target="_blank" className="text-slate-500 hover:text-slate-400">DummyJSON</a>
        &nbsp;·&nbsp;
        <a href="https://open-meteo.com" target="_blank" className="text-slate-500 hover:text-slate-400">Open-Meteo</a>
        &nbsp;·&nbsp;
        <a href="https://restcountries.com" target="_blank" className="text-slate-500 hover:text-slate-400">REST Countries</a>
      </p>
    </div>
  )
}
