import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting: 5 requests per minute for login attempts
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const limiter = rateLimit(ip, 5, 60000)
    if (!limiter.success) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again in 1 minute.' },
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
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const { username, password } = parsed.data

    // 3. Authenticate User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    })

    if (!user) {
      // Use generic error message to prevent username enumeration
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })
    }

    if (user.status !== 'active') {
      return NextResponse.json({ message: 'Account is not active' }, { status: 403 })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    const token = signToken({ id: user.id, username: user.username, role: user.role })
    
    // omit password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 })
  }
}
