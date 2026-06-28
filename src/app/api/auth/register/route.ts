import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting: 3 registration requests per minute per IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const limiter = rateLimit(ip, 3, 60000)
    if (!limiter.success) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((limiter.reset - Date.now()) / 1000))
          }
        }
      )
    }

    // 2. Input Validation & Sanitization
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const { name, username, email, password } = parsed.data

    // 3. Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Username or email already exists' }, { status: 400 })
    }

    // 4. Create User
    const hashedPassword = await bcrypt.hash(password, 12) // Hardened salt rounds

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        // First user is automatically admin, else operator
        role: (await prisma.user.count()) === 0 ? 'admin' : 'operator',
        status: 'active'
      }
    })

    const token = signToken({ id: user.id, username: user.username, role: user.role })
    
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Registration successful'
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 })
  }
}
