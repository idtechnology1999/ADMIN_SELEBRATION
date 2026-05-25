# CLAUDE.md — Selliberation Admin

This file gives Claude Code full context for working in this repository.

## Project Overview

**Selliberation Admin** is a standalone admin dashboard for the Selliberation platform — a Nigerian affiliate/referral e-commerce platform. This project is intentionally separate from the main `../Selliberation` app so it can be deployed independently and access-controlled separately.

**Main app:** `../Selliberation` — the user-facing frontend (landing page, user dashboard, courses, referrals).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5.9 |
| Build tool | Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin — no tailwind.config.js) |
| Icons | Lucide React |
| Charts | Recharts (AreaChart, BarChart, LineChart, PieChart) |
| State | React Context API (no Redux) |
| Fonts | Plus Jakarta Sans (headings), Inter (body) — loaded from Google Fonts |
| Deployment | Vercel (`vercel.json` — framework: vite, installCommand: npm install --include=dev) |

---

## Project Structure

```
src/
├── components/
│   └── AdminLayout.tsx   # Sidebar + header shell with <Outlet>
├── context/
│   ├── AuthContext.tsx   # Admin-only auth (localStorage: selliberation_admin_session)
│   └── ToastContext.tsx  # Toast notification context
├── pages/
│   ├── Login.tsx         # Admin login page (route: /login)
│   ├── Dashboard.tsx     # Overview stats + recharts (route: /)
│   ├── Users.tsx         # User management (route: /users)
│   ├── Courses.tsx       # Course + module management (route: /courses)
│   ├── Commissions.tsx   # Commission tracking (route: /commissions)
│   ├── Withdrawals.tsx   # Withdrawal approval queue (route: /withdrawals)
│   ├── Analytics.tsx     # Charts & KPIs — recharts (route: /analytics)
│   ├── Announcements.tsx # Platform announcements (route: /announcements)
│   └── Settings.tsx      # Platform config: Paystack, bank, commissions (route: /settings)
├── types/
│   └── index.ts          # AdminUser, User, Course, Commission, Withdrawal, PlatformSettings, etc.
├── App.tsx               # Router + ProtectedRoute guard
├── main.tsx
└── index.css             # Tailwind + custom animations + design tokens
```

---

## Routing Architecture

- `/login` — Public admin login
- `/` — Protected: Overview dashboard
- `/users` — Protected: User management
- `/courses` — Protected: Course management
- `/commissions` — Protected: Commission ledger
- `/withdrawals` — Protected: Withdrawal approval
- `/analytics` — Protected: Charts & KPIs
- `/announcements` — Protected: Platform announcements
- `/settings` — Protected: Platform settings
- `*` — Redirects to `/`

`ProtectedRoute` in `App.tsx` redirects unauthenticated visitors to `/login`.

---

## Auth System

`AuthContext` stores an `AdminUser` object in `localStorage` under key `selliberation_admin_session`.

**AdminUser type:**
```typescript
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  createdAt: string;
}
```

**TODO:** Replace mock `login()` in `AuthContext.tsx` with a real API call that verifies admin credentials server-side.

---

## Design System

### Brand Colors
```
Navy (sidebar):      #08192E → #050F1C (gradient)
Navy (accents):      #0D2847
Orange (primary):    #F5820A
Green (success):     #1CB957
Red (danger):        #EF4444
Page background:     #F0F2F5
Card background:     #FFFFFF
```

### Key Patterns
- **Sidebar:** fixed, 256px, dark navy gradient, orange active states
- **Active nav:** `rgba(245,130,10,0.15)` bg + `#F5820A` text + `3px solid #F5820A` left border
- **Header:** 60px, `bg-white/95`, `backdrop-blur-sm`, `border-bottom`
- **Cards:** `bg-white rounded-xl shadow-sm border border-gray-100`
- **Primary buttons:** `background: #F5820A`, white text, `rounded-xl`
- **Tables:** `<table>` with `thead bg-gray-50`, `divide-y divide-gray-100`, hover row `hover:bg-gray-50`
- **Status badges:** `rounded` pill, colored `bg-X-100 text-X-700`
- **Modals:** `fixed inset-0 bg-black/50`, centered `bg-white rounded-2xl p-6`

### Custom CSS Classes (index.css)
- `.glass` / `.glass-dark` — glassmorphism panels
- `.gradient-text` / `.gradient-text-amber` — gradient text
- `.card-hover` — translateY(-5px) hover lift
- `.animate-float`, `.animate-fade-up`, `.animate-slide-left`, `.animate-pulse-glow`

### Font Usage
- **Headings:** `style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}` (inline — not in Tailwind config)
- **Body:** Inter (set globally on `body` in `index.css`)

---

## Pages Summary

| Page | Key Features |
|---|---|
| **Login** | Email + password form, show/hide password, error state |
| **Dashboard** | 4 stat cards, pending withdrawals alert, recent signups table, recent payments table |
| **Users** | Search + filter, 4 summary cards, data table, ban/unban/activate/cancel, user detail modal |
| **Courses** | Tab view (courses / all modules), add/edit/delete courses, collapsible module manager |
| **Commissions** | 4 summary cards, filter tabs (all/pending/withdrawable/withdrawn), search, export CSV button |
| **Withdrawals** | 3 stat cards (pending/approved/rejected), filter tabs, approve/reject actions, reject reason modal |
| **Analytics** | KPI cards, revenue/user LineChart, conversion AreaChart, commission BarChart, top referrers table |
| **Announcements** | Platform-wide announcements management |
| **Settings** | 5 tabs: General, Paystack, Bank Account, Commissions (with live calc), Notifications (toggles) |

---

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (Vite, default port 5173)
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

---

## Key Conventions

1. **Inline styles for brand colors** — Use `style={{ color: '#F5820A' }}` for precise brand colors; Tailwind doesn't know our custom values.
2. **No Tailwind config** — Tailwind CSS v4 via `@tailwindcss/vite`; no `tailwind.config.js` needed.
3. **TypeScript strict** — All types in `src/types/index.ts`. No `any`.
4. **Context-only state** — No Redux. Keep global state to auth + toasts only.
5. **Mock data** — All pages use local state with hardcoded arrays. Replace with real API calls when backend is ready.
6. **localStorage key** — `selliberation_platform_settings` for Settings page persistence.
7. **Lucide icons** — Standard sizes: 16, 17, 18, 20, 24px.
8. **Confirm dialogs** — Destructive actions (ban, delete, cancel) use `window.confirm()` for now. Replace with proper modal confirmation in production.
9. **Recharts formatters** — Never type `formatter` callbacks as `(val: number)`. Recharts passes `ValueType | undefined`. Use `(val) => ...` and cast with `Number(val)` when calling numeric methods.
10. **node_modules must NOT be committed** — `.gitignore` excludes `node_modules/`. Committing it causes Windows binary incompatibility on Vercel (exit 126).
11. **Vercel config** — `vercel.json` sets `installCommand: "npm install --include=dev"` to ensure devDependencies (vite, tsc) are installed even when `NODE_ENV=production`.

---

## Relationship with Selliberation (Main App)

The `../Selliberation` app has admin pages at `/admin/*` that mirror this project's pages. When updating admin UI/logic in this project, check if the same changes should be applied to `../Selliberation/src/pages/admin/` as well.

---

## TODO / Future Work

- [ ] Replace mock auth with real admin login API (JWT + refresh tokens)
- [ ] Replace all hardcoded data with real API calls
- [ ] Add pagination to Users, Commissions, Withdrawals tables
- [ ] Add date range filters to Commissions and Withdrawals
- [x] Add analytics charts to Dashboard (recharts — AreaChart, PieChart, BarChart)
- [x] Add Analytics page with KPI cards + revenue/user/conversion/commission charts
- [ ] Add real CSV export for Commissions
- [ ] Add submodule and video management to Courses page
- [ ] Role-based UI differences between `admin` and `superadmin`
- [ ] Audit log / activity feed
