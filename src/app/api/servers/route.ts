import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { serverSchema } from '@/lib/validation'

export async function GET() {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const servers = await prisma.server.findMany({ orderBy: { name: 'asc' } })

    const parsedServers = servers.map(s => ({
      ...s,
      tags: (() => { try { return JSON.parse(s.tags || '[]') } catch { return [] } })(),
      specs: { cpuCores: s.cpuCores, ramGB: s.ramGB, diskGB: s.diskGB, network: s.network }
    }))

    return NextResponse.json({ data: parsedServers, success: true })
  } catch (error: any) {
    console.error('Get servers error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin and manager to create servers
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ message: 'Forbidden: Admins or Managers only' }, { status: 403 })
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

    const parsed = serverSchema.safeParse(mappedBody)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const val = parsed.data

    const server = await prisma.server.create({
      data: {
        name: val.name,
        ip: val.ip,
        hostname: val.hostname,
        os: val.os,
        type: val.type,
        status: val.status,
        cpu: val.cpu,
        memory: val.memory,
        disk: val.disk,
        uptime: val.uptime,
        location: val.location,
        environment: val.environment,
        tags: JSON.stringify(val.tags),
        cpuCores: val.cpuCores,
        ramGB: val.ramGB,
        diskGB: val.diskGB,
        network: val.network,
      }
    })

    return NextResponse.json({ data: server, success: true, message: 'Server created' })
  } catch (error: any) {
    console.error('Server create error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
