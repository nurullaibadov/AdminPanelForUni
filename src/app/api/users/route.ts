import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { userCreateSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'

export async function GET(req: Request) {
  try {
    // 1. Authenticate user session
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only allow admin and manager to read user list
    if (session.role !== 'admin' && session.role !== 'manager') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        department: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: users, success: true })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // 1. Authenticate user session
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only admin can create users
    if (session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 })
    }

    // 2. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const limiter = rateLimit(ip, 20, 60000)
    if (!limiter.success) {
      return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    // 3. Input Validation
    const body = await req.json()
    const parsed = userCreateSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const { name, username, email, password, role, status, department, phone } = parsed.data

    // 4. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    })
    
    if (existingUser) {
      return NextResponse.json({ message: 'Username or email already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // 5. Create user securely (prevent mass assignment)
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: role || 'operator',
        status: status || 'active',
        department: department || null,
        phone: phone || null
      },
      select: { id: true, name: true, username: true, email: true, role: true, status: true }
    })

    return NextResponse.json({ data: user, success: true, message: 'User created' })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
