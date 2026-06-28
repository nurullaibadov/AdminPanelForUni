import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    // Check ownership
    const apiKey = await prisma.apiKey.findUnique({ where: { id } })
    if (!apiKey) return NextResponse.json({ message: 'API Key not found' }, { status: 404 })
    
    if (apiKey.userId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await prisma.apiKey.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'API Key deleted' })
  } catch (error: any) {
    console.error('API Key delete error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
