import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { incidentSchema } from '@/lib/validation'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Viewers cannot update incidents
    if (session.role === 'viewer') {
      return NextResponse.json({ message: 'Forbidden: Read-only access' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = incidentSchema.partial().safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const val = parsed.data
    const updateData: any = {}

    if (val.title !== undefined) updateData.title = val.title
    if (val.description !== undefined) updateData.description = val.description
    if (val.status !== undefined) {
      updateData.status = val.status
      if (val.status === 'resolved' || val.status === 'closed') {
        updateData.resolvedAt = new Date()
      }
    }
    if (val.priority !== undefined) updateData.priority = val.priority
    if (val.category !== undefined) updateData.category = val.category
    if (val.assignedTo !== undefined) updateData.assignedTo = val.assignedTo
    if (val.reportedBy !== undefined) updateData.reportedBy = val.reportedBy
    if (val.affectedSystems !== undefined) {
      updateData.affectedSystems = JSON.stringify(val.affectedSystems)
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: updateData
    })

    const parsedUpdatedIncident = {
      ...updatedIncident,
      affectedSystems: (() => { try { return JSON.parse(updatedIncident.affectedSystems || '[]') } catch { return [] } })()
    }

    return NextResponse.json({ data: parsedUpdatedIncident, success: true, message: 'Incident updated' })
  } catch (error: any) {
    console.error('Incident update error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Incident not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin to delete incidents
    if (session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    await prisma.incident.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Incident deleted' })
  } catch (error: any) {
    console.error('Incident delete error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Incident not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
