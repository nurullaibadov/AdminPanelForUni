import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { assetSchema } from '@/lib/validation'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) return NextResponse.json({ message: 'Asset not found' }, { status: 404 })

    const parsedAsset = {
      ...asset,
      tags: (() => { try { return JSON.parse(asset.tags || '[]') } catch { return [] } })()
    }

    return NextResponse.json({ data: parsedAsset, success: true })
  } catch (error: any) {
    console.error('Get asset error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin and manager to update assets
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ message: 'Forbidden: Admins or Managers only' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = assetSchema.partial().safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const val = parsed.data
    const updateData: any = {}

    if (val.name !== undefined) updateData.name = val.name
    if (val.type !== undefined) updateData.type = val.type
    if (val.serial !== undefined) updateData.serial = val.serial
    if (val.model !== undefined) updateData.model = val.model
    if (val.manufacturer !== undefined) updateData.manufacturer = val.manufacturer
    if (val.purchaseDate !== undefined) updateData.purchaseDate = val.purchaseDate
    if (val.warrantyExpiry !== undefined) updateData.warrantyExpiry = val.warrantyExpiry
    if (val.status !== undefined) updateData.status = val.status
    if (val.location !== undefined) updateData.location = val.location
    if (val.assignedTo !== undefined) updateData.assignedTo = val.assignedTo
    if (val.cost !== undefined) updateData.cost = val.cost
    if (val.notes !== undefined) updateData.notes = val.notes
    if (val.tags !== undefined) updateData.tags = JSON.stringify(val.tags)

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData
    })

    const parsedUpdatedAsset = {
      ...updatedAsset,
      tags: (() => { try { return JSON.parse(updatedAsset.tags || '[]') } catch { return [] } })()
    }

    return NextResponse.json({ data: parsedUpdatedAsset, success: true, message: 'Asset updated' })
  } catch (error: any) {
    console.error('Asset update error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Asset not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin to delete assets
    if (session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    await prisma.asset.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Asset deleted' })
  } catch (error: any) {
    console.error('Asset delete error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Asset not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
