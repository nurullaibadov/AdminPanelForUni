import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'
import crypto from 'crypto'

const apiKeyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less').transform(v => v.replace(/<[^>]*>/g, '').trim())
})

export async function POST(req: Request) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Viewers cannot generate API keys
    if (session.role === 'viewer') {
      return NextResponse.json({ message: 'Forbidden: Viewers cannot create API keys' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = apiKeyCreateSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const { name } = parsed.data

    // Generate a cryptographically secure random key
    const randomKey = crypto.randomBytes(24).toString('hex')
    const key = `eioms_${randomKey}`

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        userId: session.id
      }
    })

    return NextResponse.json({ success: true, data: apiKey, message: 'API Key created' })
  } catch (error: any) {
    console.error('API Key create error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
