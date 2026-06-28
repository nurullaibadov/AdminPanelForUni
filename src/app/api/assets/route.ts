import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { assetSchema } from '@/lib/validation'

export async function GET() {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const assets = await prisma.asset.findMany({
      orderBy: { name: 'asc' }
    })

    const parsedAssets = assets.map(a => ({
      ...a,
      tags: (() => { try { return JSON.parse(a.tags || '[]') } catch { return [] } })()
    }))

    return NextResponse.json({ data: parsedAssets, success: true })
  } catch (error: any) {
    console.error('Get assets error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin and manager to create assets
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ message: 'Forbidden: Admins or Managers only' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = assetSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const val = parsed.data

    const asset = await prisma.asset.create({
      data: {
        name: val.name,
        type: val.type,
        serial: val.serial,
        model: val.model,
        manufacturer: val.manufacturer,
        purchaseDate: val.purchaseDate,
        warrantyExpiry: val.warrantyExpiry,
        status: val.status,
        location: val.location,
        assignedTo: val.assignedTo,
        cost: val.cost,
        notes: val.notes,
        tags: JSON.stringify(val.tags),
      }
    })

    return NextResponse.json({ data: asset, success: true, message: 'Asset created' })
  } catch (error: any) {
    console.error('Asset create error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
