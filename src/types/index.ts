// ─── Auth ──────────────────────────────────────────────────────────────────
export interface User {
  id: number
  name: string
  username: string
  email: string
  phone?: string
  website?: string
  role: 'admin' | 'manager' | 'operator' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  avatar?: string
  department?: string
  createdAt?: string
  lastLogin?: string
  address?: {
    street: string
    city: string
    state: string
    zipcode: string
    country: string
  }
  company?: {
    name: string
    catchPhrase?: string
    bs?: string
  }
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  username: string
  password: string
  confirmPassword: string
  role?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  confirmPassword: string
}

// ─── Server / Infrastructure ────────────────────────────────────────────────
export interface Server {
  id: number
  name: string
  ip: string
  hostname: string
  os: string
  type: 'web' | 'db' | 'cache' | 'app' | 'load-balancer' | 'mail'
  status: 'online' | 'offline' | 'maintenance' | 'warning'
  cpu: number
  memory: number
  disk: number
  uptime: string
  location: string
  environment: 'production' | 'staging' | 'development' | 'testing'
  tags: string[]
  lastChecked: string
  specs: {
    cpuCores: number
    ramGB: number
    diskGB: number
    network: string
  }
}

// ─── Monitoring ─────────────────────────────────────────────────────────────
export interface MetricPoint {
  timestamp: string
  value: number
}

export interface MonitoringData {
  serverId: number
  serverName: string
  cpuHistory: MetricPoint[]
  memoryHistory: MetricPoint[]
  networkIn: MetricPoint[]
  networkOut: MetricPoint[]
  requestsPerSecond: MetricPoint[]
}

export interface Alert {
  id: number
  serverId: number
  serverName: string
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'service'
  severity: 'critical' | 'warning' | 'info'
  message: string
  status: 'open' | 'acknowledged' | 'resolved'
  createdAt: string
  resolvedAt?: string
  assignedTo?: string
}

// ─── Incidents ───────────────────────────────────────────────────────────────
export interface Incident {
  id: number
  title: string
  description: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'p1' | 'p2' | 'p3' | 'p4'
  category: 'outage' | 'degraded' | 'security' | 'maintenance' | 'other'
  assignedTo: string
  reportedBy: string
  affectedSystems: string[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  timeline: IncidentEvent[]
}

export interface IncidentEvent {
  id: number
  incidentId: number
  message: string
  author: string
  type: 'update' | 'comment' | 'status-change' | 'escalation'
  createdAt: string
}

// ─── Assets ──────────────────────────────────────────────────────────────────
export interface Asset {
  id: number
  name: string
  type: 'hardware' | 'software' | 'license' | 'network' | 'peripheral'
  serial?: string
  model?: string
  manufacturer?: string
  purchaseDate?: string
  warrantyExpiry?: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'lost'
  location?: string
  assignedTo?: string
  cost?: number
  notes?: string
  tags: string[]
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface ReportSummary {
  totalServers: number
  onlineServers: number
  offlineServers: number
  openIncidents: number
  resolvedIncidentsThisMonth: number
  totalAssets: number
  activeUsers: number
  avgCpuUsage: number
  avgMemoryUsage: number
  uptime99: number
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

// ─── UI / Table ──────────────────────────────────────────────────────────────
export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  search?: string
  status?: string
  type?: string
  role?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
}
