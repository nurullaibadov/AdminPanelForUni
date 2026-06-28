'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/lib/api'

const schema = z.object({ email: z.string().email('Invalid email address') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
    } catch {
      // still show success to prevent email enumeration
      setSentEmail(data.email)
      setSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-600/30">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        <p className="text-slate-400 text-sm mt-1">We&apos;ll send you a reset link</p>
      </div>

      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
        {sent ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm mb-1">
              We&apos;ve sent a reset link to
            </p>
            <p className="text-primary-400 font-medium text-sm mb-6">{sentEmail}</p>
            <p className="text-slate-500 text-xs mb-6">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} className="text-primary-400 hover:underline">
                try again
              </button>
            </p>
            <Link href="/auth/login" className="btn-primary w-full justify-center">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <p className="text-slate-400 text-sm">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <div>
              <label className="label text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@company.com"
                  className="input pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500 focus:border-primary-500"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full btn-primary py-3 text-base font-semibold shadow-lg shadow-primary-600/20">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-700">
          <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
