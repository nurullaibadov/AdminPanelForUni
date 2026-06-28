import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { incidentSchema } from '@/lib/validation'

export async function GET() {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const incidents = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    const parsedIncidents = incidents.map(i => ({
      ...i,
      affectedSystems: (() => { try { return JSON.parse(i.affectedSystems || '[]') } catch { return [] } })(),
      timeline: []
    }))

    return NextResponse.json({ data: parsedIncidents, success: true })
  } catch (error: any) {
    console.error('Get incidents error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = incidentSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const val = parsed.data

    const incident = await prisma.incident.create({
      data: {
        title: val.title,
        description: val.description,
        status: val.status,
        priority: val.priority,
        category: val.category,
        assignedTo: val.assignedTo,
        reportedBy: val.reportedBy || session.username, // Fallback to current session username if not specified
        affectedSystems: JSON.stringify(val.affectedSystems),
      }
    })

    const parsedIncident = {
      ...incident,
      affectedSystems: (() => { try { return JSON.parse(incident.affectedSystems || '[]') } catch { return [] } })()
    }

    return NextResponse.json({ data: parsedIncident, success: true, message: 'Incident reported' })
  } catch (error: any) {
    console.error('Incident create error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
