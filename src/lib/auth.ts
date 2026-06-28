import jwt from 'jsonwebtoken'
import { cookies, headers } from 'next/headers'
import prisma from '@/lib/prisma'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production!')
    }
    return 'eioms-super-secret-key'
  }
  return secret
}

export const signToken = (payload: object) => {
  return jwt.sign(payload, getSecret(), { expiresIn: '1d' })
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, getSecret()) as any
  } catch (error) {
    return null
  }
}

export const getSession = () => {
  const token = cookies().get('eioms_token')?.value
  if (!token) return null
  return verifyToken(token)
}

export const requireAuth = (allowedRoles?: string[]) => {
  const session = getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('Forbidden')
  }
  return session
}

export const verifyAuth = async () => {
  const authorization = headers().get('authorization')
  if (!authorization || !authorization.startsWith('Bearer ')) return null
  const token = authorization.split(' ')[1]
  if (!token) return null

  if (token.startsWith('eioms_')) {
    // Authenticate via API Key
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: token },
      include: { user: true }
    })
    
    if (!apiKeyRecord || !apiKeyRecord.user || apiKeyRecord.user.status !== 'active') {
      return null
    }

    // Update lastUsed asynchronously
    prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsed: new Date() }
    }).catch((err) => console.error('Failed to update API key lastUsed:', err))

    return {
      id: apiKeyRecord.user.id,
      username: apiKeyRecord.user.username,
      role: apiKeyRecord.user.role,
      isApiKey: true
    }
  }

  // Authenticate via JWT token
  const decoded = verifyToken(token)
  if (!decoded) return null

  // Ensure user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { status: true }
  })
  
  if (!user || user.status !== 'active') return null

  return decoded
}
