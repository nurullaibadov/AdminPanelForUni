import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { userUpdateSchema } from '@/lib/validation'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user session
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    // 2. Check ownership or admin status
    const isSelf = session.id === id
    const isAdmin = session.role === 'admin'

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // 3. Input Validation
    const body = await req.json()
    const parsed = userUpdateSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ message: errorMsg }, { status: 400 })
    }

    const valData = parsed.data

    // 4. Construct update payload (prevent mass assignment & self privilege escalation)
    const updateData: any = {}
    
    if (valData.name !== undefined) updateData.name = valData.name
    if (valData.email !== undefined) updateData.email = valData.email
    if (valData.phone !== undefined) updateData.phone = valData.phone
    if (valData.department !== undefined) updateData.department = valData.department

    if (valData.password !== undefined) {
      updateData.password = await bcrypt.hash(valData.password, 12)
    }

    // Role and Status changes require admin
    if (isAdmin) {
      if (valData.role !== undefined) updateData.role = valData.role
      if (valData.status !== undefined) updateData.status = valData.status
      if (valData.username !== undefined) updateData.username = valData.username
    }

    // 5. Check duplicate email or username if changed
    if (updateData.email || updateData.username) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            updateData.username ? { username: updateData.username } : {},
            updateData.email ? { email: updateData.email } : {}
          ],
          NOT: { id }
        }
      })
      if (existing) {
        return NextResponse.json({ message: 'Username or email already in use' }, { status: 400 })
      }
    }

    // 6. Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        department: true,
        phone: true,
        avatar: true,
        createdAt: true,
        lastLogin: true
      }
    })

    return NextResponse.json({ data: updatedUser, success: true, message: 'User updated' })
  } catch (error: any) {
    console.error('Update user error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user session
    const session = await verifyAuth()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Only admin can delete users
    if (session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid ID parameter' }, { status: 400 })
    }

    // Check if user is deleting themselves
    if (session.id === id) {
      return NextResponse.json({ message: 'Cannot delete yourself' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'User deleted' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'User not found', success: false }, { status: 404 })
    }
    return NextResponse.json({ message: 'An internal server error occurred', success: false }, { status: 500 })
  }
}
