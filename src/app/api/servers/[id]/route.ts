import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { serverSchema } from '@/lib/validation'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    const server = await prisma.server.findUnique({ where: { id } })
    if (!server) return NextResponse.json({ message: 'Server not found' }, { status: 404 })

    const parsedServer = {
      ...server,
      tags: (() => { try { return JSON.parse(server.tags || '[]') } catch { return [] } })(),
      specs: { cpuCores: server.cpuCores, ramGB: server.ramGB, diskGB: server.diskGB, network: server.network }
    }

    return NextResponse.json({ data: parsedServer, success: true })
  } catch (error: any) {
    console.error('Get server error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin and manager to update servers
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ message: 'Forbidden: Admins or Managers only' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    const body = await req.json()
    
    // Support nested specs mapping if sent
    const mappedBody = {
      ...body,
      cpuCores: body.cpuCores ?? body.specs?.cpuCores,
      ramGB: body.ramGB ?? body.specs?.ramGB,
      diskGB: body.diskGB ?? body.specs?.diskGB,
      network: body.network ?? body.specs?.network
    }

    const parsed = serverSchema.partial().safeParse(mappedBody)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const val = parsed.data
    const updateData: any = {}

    if (val.name !== undefined) updateData.name = val.name
    if (val.ip !== undefined) updateData.ip = val.ip
    if (val.hostname !== undefined) updateData.hostname = val.hostname
    if (val.os !== undefined) updateData.os = val.os
    if (val.type !== undefined) updateData.type = val.type
    if (val.status !== undefined) updateData.status = val.status
    if (val.cpu !== undefined) updateData.cpu = val.cpu
    if (val.memory !== undefined) updateData.memory = val.memory
    if (val.disk !== undefined) updateData.disk = val.disk
    if (val.uptime !== undefined) updateData.uptime = val.uptime
    if (val.location !== undefined) updateData.location = val.location
    if (val.environment !== undefined) updateData.environment = val.environment
    if (val.tags !== undefined) updateData.tags = JSON.stringify(val.tags)
    if (val.cpuCores !== undefined) updateData.cpuCores = val.cpuCores
    if (val.ramGB !== undefined) updateData.ramGB = val.ramGB
    if (val.diskGB !== undefined) updateData.diskGB = val.diskGB
    if (val.network !== undefined) updateData.network = val.network

    const updatedServer = await prisma.server.update({
      where: { id },
      data: updateData
    })

    const parsedUpdatedServer = {
      ...updatedServer,
      tags: (() => { try { return JSON.parse(updatedServer.tags || '[]') } catch { return [] } })(),
      specs: { cpuCores: updatedServer.cpuCores, ramGB: updatedServer.ramGB, diskGB: updatedServer.diskGB, network: updatedServer.network }
    }

    return NextResponse.json({ data: parsedUpdatedServer, success: true, message: 'Server updated' })
  } catch (error: any) {
    console.error('Server update error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Server not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin to delete servers
    if (session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    await prisma.server.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Server deleted' })
  } catch (error: any) {
    console.error('Server delete error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Server not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
