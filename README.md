# EIOMS — Enterprise Infrastructure & Operations Management System

A full-featured admin panel built with **Next.js 14**, **TypeScript**, **TailwindCSS**, backed by public REST APIs (JSONPlaceholder). Swap in your own C# backend by changing one env variable.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Login
| Field | Value |
|-------|-------|
| Email | `Sincere@april.biz` |
| Password | any value |

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration
│   │   └── forgot-password/# Password reset
│   ├── dashboard/          # Main dashboard
│   ├── users/              # User management (CRUD)
│   ├── servers/            # Server management
│   ├── monitoring/         # Real-time metrics
│   ├── incidents/          # Incident tracking (CRUD)
│   ├── assets/             # Asset inventory (CRUD)
│   ├── reports/            # Analytics & charts
│   └── settings/           # System settings
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx     # Collapsible navigation
│   │   └── Topbar.tsx      # Header with notifications
│   └── ui/
│       ├── index.tsx       # Badge, Modal, StatCard, etc.
│       └── DataTable.tsx   # Sortable, searchable, paginated table
├── lib/
│   ├── api.ts              # Axios client + all API calls
│   └── utils.ts            # Helpers, formatters, color maps
├── store/
│   └── authStore.ts        # Zustand auth state
└── types/
    └── index.ts            # TypeScript interfaces
```

---

## 🔌 Connecting Your C# API

1. Open `.env.local`
2. Change `NEXT_PUBLIC_API_URL` to your backend:

```env
NEXT_PUBLIC_API_URL=https://your-csharp-api.com/api
```

3. Update endpoint paths in `src/lib/api.ts` to match your C# controllers:

```typescript
// Example C# controller routes:
export const usersApi = {
  getAll: () => api.get('/users'),          // GET /api/users
  create: (data) => api.post('/users', data), // POST /api/users
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}
```

### Expected C# API Endpoints

| Module | Endpoint | Methods |
|--------|----------|---------|
| Auth | `/auth/login` | POST |
| Auth | `/auth/register` | POST |
| Auth | `/auth/forgot-password` | POST |
| Auth | `/auth/reset-password` | POST |
| Users | `/users` | GET, POST |
| Users | `/users/{id}` | GET, PUT, DELETE |
| Servers | `/servers` | GET, POST |
| Servers | `/servers/{id}` | GET, PUT, DELETE |
| Incidents | `/incidents` | GET, POST |
| Incidents | `/incidents/{id}` | GET, PUT, DELETE |
| Assets | `/assets` | GET, POST |
| Assets | `/assets/{id}` | GET, PUT, DELETE |
| Reports | `/reports/summary` | GET |
| Monitoring | `/monitoring/{serverId}` | GET |

### JWT Authentication

The API client automatically attaches the JWT token from cookies:

```typescript
// In src/lib/api.ts — request interceptor
config.headers.Authorization = `Bearer ${token}`
```

Your C# API should return:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "name": "Admin", "role": "admin", ... }
}
```

---

## ✨ Features

### 🔐 Authentication
- Login with email + password + remember me
- Register with role selection
- Forgot password flow
- JWT stored in cookies
- Auto-redirect if unauthenticated
- Route protection on all dashboard pages

### 📊 Dashboard
- Live KPI stats (servers, incidents, assets, users)
- 24h CPU/Memory area charts
- Incident status pie chart
- Server type distribution bar chart
- Recent incidents + attention-required servers

### 👥 User Management
- Full CRUD with modal forms
- Role badges (Admin / Manager / Operator / Viewer)
- Status management
- Search + sort + paginate + CSV export

### 🖥️ Server Management
- Table + Grid views
- Real-time CPU/Memory/Disk progress bars
- Status indicators with pulse animation
- Server detail modal with full specs
- Filter by environment/status/type

### 📈 Monitoring
- Live auto-refreshing charts (every 3s)
- CPU, Memory, Network, Requests/s
- Per-server selector
- Pause/Resume live feed
- All-servers health table

### 🚨 Incidents
- Priority system (P1 Critical → P4 Low)
- Status workflow (Open → In Progress → Resolved → Closed)
- Category tagging
- Timeline view
- Full CRUD with modal forms

### 📦 Asset Management
- Hardware/Software/License/Network inventory
- Warranty expiry tracking with warnings
- Cost tracking + total value calculation
- Assignment tracking
- Full CRUD

### 📋 Reports
- Monthly incident trends (bar chart)
- System uptime tracking
- Infrastructure cost over time
- Asset health distribution
- Incident category pie chart
- Executive summary table
- Date range selector (3m/6m/12m)
- PDF export button

### ⚙️ Settings
- Profile management
- Password change
- 2FA toggle
- Session management
- Notification preferences
- System configuration (API URL, timeouts)
- Appearance (dark/light/system)
- API key management + webhook config

---

## 🎨 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.2.5 | React framework |
| TypeScript | 5.5 | Type safety |
| TailwindCSS | 3.4 | Styling |
| Zustand | 4.5 | State management |
| React Hook Form | 7.52 | Form handling |
| Zod | 3.23 | Schema validation |
| Recharts | 2.12 | Data visualization |
| Axios | 1.7 | HTTP client |
| Lucide React | 0.414 | Icons |
| React Hot Toast | 2.4 | Notifications |
| js-cookie | 3.0 | Cookie management |

---

## 🌙 Dark Mode

Dark mode is toggled via the moon/sun icon in the topbar. The preference is saved to `localStorage`. The `dark` class is applied to `<html>` and TailwindCSS dark variants handle all theming.

---

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## 🔧 Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-api.com/api   # Your C# API base URL
NEXT_PUBLIC_APP_NAME=EIOMS
NEXT_PUBLIC_APP_VERSION=1.0.0
JWT_SECRET=your-secret-key                       # Used server-side only
```
