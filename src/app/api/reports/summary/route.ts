import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const [
      totalUsers,
      totalServers,
      onlineServers,
      offlineServers,
      totalIncidents,
      openIncidents,
      resolvedIncidentsThisMonth,
      totalAssets,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'active' } }),
      prisma.server.count(),
      prisma.server.count({ where: { status: 'online' } }),
      prisma.server.count({ where: { status: { in: ['offline', 'warning', 'maintenance'] } } }),
      prisma.incident.count(),
      prisma.incident.count({ where: { status: { in: ['open', 'in-progress'] } } }),
      prisma.incident.count({
        where: {
          status: 'resolved',
          resolvedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.asset.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalServers,
        onlineServers,
        offlineServers,
        openIncidents,
        resolvedIncidentsThisMonth,
        totalAssets,
        activeUsers: totalUsers,
        totalUsers,
        totalIncidents,
        avgCpuUsage: 42.3, // Mock average, can be calculated from monitoring data
        avgMemoryUsage: 67.8, // Mock average
        uptime99: 99.97, // Mock uptime metric
      },
    })
  } catch (error: any) {
    console.error('Reports summary error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
