import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Fetch user preferences and API keys
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { preferences: true, apiKeys: true }
    })

    // Mask API keys so they are not leaked in plaintext
    const maskedApiKeys = (user?.apiKeys || []).map(k => {
      const originalKey = k.key || ''
      const maskedKey = originalKey.length > 15
        ? `${originalKey.substring(0, 10)}...${originalKey.substring(originalKey.length - 4)}`
        : '••••••••••••••••'
      return {
        ...k,
        key: maskedKey
      }
    })

    // Fetch global system settings
    const settings = await prisma.setting.findMany()
    const globalSettings: Record<string, any> = {}
    settings.forEach(s => {
      try {
        globalSettings[s.key] = JSON.parse(s.value)
      } catch (e) {
        globalSettings[s.key] = s.value
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        preferences: user?.preferences ? JSON.parse(user.preferences) : {},
        apiKeys: maskedApiKeys,
        system: globalSettings
      }
    })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const data = await req.json()
    const { type, payload } = data

    if (!type || !payload || typeof payload !== 'object') {
      return NextResponse.json({ message: 'Invalid payload request', success: false }, { status: 400 })
    }

    if (type === 'preferences') {
      // Prevent HTML injection in preferences values (convert keys to string and sanitize if string)
      const sanitizedPayload: Record<string, any> = {}
      for (const [key, value] of Object.entries(payload)) {
        const sanitizedKey = key.replace(/<[^>]*>/g, '').trim()
        if (typeof value === 'string') {
          sanitizedPayload[sanitizedKey] = value.replace(/<[^>]*>/g, '').trim()
        } else {
          sanitizedPayload[sanitizedKey] = value
        }
      }

      // Update User specific settings
      await prisma.user.update({
        where: { id: session.id },
        data: { preferences: JSON.stringify(sanitizedPayload) }
      })
      return NextResponse.json({ success: true, message: 'Preferences updated' })
    } 
    
    if (type === 'system') {
      // Update global system settings (Admins only)
      if (session.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden: Admins only', success: false }, { status: 403 })
      }

      // Sanitize global settings payload
      const sanitizedPayload: Record<string, any> = {}
      for (const [key, value] of Object.entries(payload)) {
        const sanitizedKey = key.replace(/<[^>]*>/g, '').trim()
        if (typeof value === 'string') {
          sanitizedPayload[sanitizedKey] = value.replace(/<[^>]*>/g, '').trim()
        } else {
          sanitizedPayload[sanitizedKey] = value
        }
      }

      for (const [key, value] of Object.entries(sanitizedPayload)) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) }
        })
      }
      return NextResponse.json({ success: true, message: 'System settings updated' })
    }

    return NextResponse.json({ message: 'Invalid update type or permissions', success: false }, { status: 400 })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
