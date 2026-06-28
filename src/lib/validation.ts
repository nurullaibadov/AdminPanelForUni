import { z } from 'zod'

// Simple helper to strip HTML tags to prevent XSS
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val
  return val.replace(/<[^>]*>/g, '').trim()
}

// Zod custom type for sanitized strings
export const sanitizedString = z.string().transform(sanitizeString)

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').transform(sanitizeString),
  password: z.string().min(1, 'Password is required')
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').transform(sanitizeString),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username must be alphanumeric, underscores or hyphens').transform(sanitizeString),
  email: z.string().email('Invalid email address').transform(sanitizeString),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').transform(sanitizeString),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username must be alphanumeric, underscores or hyphens').transform(sanitizeString),
  email: z.string().email('Invalid email address').transform(sanitizeString),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'operator', 'viewer']).default('operator'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  department: z.string().optional().nullable().transform(v => v ? sanitizeString(v) : null),
  phone: z.string().optional().nullable().transform(v => v ? sanitizeString(v) : null),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional().transform(v => v ? sanitizeString(v) : undefined),
  username: z.string().min(3).optional().transform(v => v ? sanitizeString(v) : undefined),
  email: z.string().email().optional().transform(v => v ? sanitizeString(v) : undefined),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'manager', 'operator', 'viewer']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  department: z.string().optional().nullable().transform(v => v ? (v ? sanitizeString(v) : null) : undefined),
  phone: z.string().optional().nullable().transform(v => v ? (v ? sanitizeString(v) : null) : undefined),
})

export const assetSchema = z.object({
  name: z.string().min(1, 'Name is required').transform(sanitizeString),
  type: z.string().min(1, 'Type is required').transform(sanitizeString),
  serial: z.string().nullable().optional().transform(v => v ? sanitizeString(v) : null),
  model: z.string().nullable().optional().transform(v => v ? sanitizeString(v) : null),
  manufacturer: z.string().nullable().optional().transform(v => v ? sanitizeString(v) : null),
  purchaseDate: z.string().nullable().optional().transform(v => v ? new Date(v) : null),
  warrantyExpiry: z.string().nullable().optional().transform(v => v ? new Date(v) : null),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired', 'lost']).default('active'),
  location: z.string().nullable().optional().transform(v => v ? sanitizeString(v) : null),
  assignedTo: z.string().nullable().optional().transform(v => v ? sanitizeString(v) : null),
  cost: z.number().nullable().optional(),
  notes: z.string().nullable().optional().transform(v => v ? sanitizeString(v) : null),
  tags: z.array(z.string()).optional().default([]),
})

export const serverSchema = z.object({
  name: z.string().min(1, 'Name is required').transform(sanitizeString),
  ip: z.string().ip('Invalid IP address'),
  hostname: z.string().min(1, 'Hostname is required').transform(sanitizeString),
  os: z.string().min(1, 'OS is required').transform(sanitizeString),
  type: z.enum(['web', 'db', 'cache', 'app', 'load-balancer', 'mail']).default('web'),
  status: z.enum(['online', 'offline', 'maintenance', 'warning']).default('offline'),
  cpu: z.number().min(0).max(100).default(0),
  memory: z.number().min(0).max(100).default(0),
  disk: z.number().min(0).max(100).default(0),
  uptime: z.string().default('0m').transform(sanitizeString),
  location: z.string().default('').transform(sanitizeString),
  environment: z.enum(['production', 'staging', 'development', 'testing']).default('production'),
  tags: z.array(z.string()).optional().default([]),
  cpuCores: z.number().int().min(1).default(1),
  ramGB: z.number().int().min(1).default(1),
  diskGB: z.number().int().min(1).default(20),
  network: z.string().default('1Gbps').transform(sanitizeString),
})

export const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required').transform(sanitizeString),
  description: z.string().min(1, 'Description is required').transform(sanitizeString),
  status: z.enum(['open', 'in-progress', 'resolved', 'closed']).default('open'),
  priority: z.enum(['p1', 'p2', 'p3', 'p4']).default('p3'),
  category: z.enum(['outage', 'degraded', 'security', 'maintenance', 'other']).default('other'),
  assignedTo: z.string().default('Unassigned').transform(sanitizeString),
  reportedBy: z.string().optional().transform(v => v ? sanitizeString(v) : undefined),
  affectedSystems: z.array(z.string()).optional().default([]),
})
