# Architecture — Selliberation Admin

## Overview

Selliberation Admin is a **Single Page Application (SPA)** built with React + Vite. It is intentionally decoupled from the main Selliberation app so it can be:
- Deployed to a separate domain (e.g., `admin.selliberation.com`)
- Protected behind separate network rules or HTTP basic auth at the infrastructure level
- Developed and versioned independently

---

## Folder Architecture

```
Selliberation-Admin/
├── src/
│   ├── components/         # Layout shells (AdminLayout)
│   ├── context/            # Global state (AuthContext, ToastContext)
│   ├── pages/              # One file per route
│   ├── types/              # Shared TypeScript interfaces
│   ├── App.tsx             # Router entry + route guards
│   ├── main.tsx            # React DOM mount
│   └── index.css           # Global styles (Tailwind + custom)
├── public/                 # Static assets (favicon, etc.)
├── docs/                   # Documentation (this folder)
├── CLAUDE.md               # Claude Code context file
├── index.html              # HTML entry point + font links
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── vercel.json             # Vercel config: framework, outputDir, installCommand, SPA rewrite
```

---

## Data Flow

```
Browser
  └── React SPA (Vite)
        ├── AuthContext (localStorage)    ← admin session persisted
        ├── AdminLayout (sidebar + header)
        └── Pages
              ├── Local useState           ← all data currently hardcoded
              └── [Future] API calls       ← replace with real backend
```

Currently all page data is stored in component-level `useState` with hardcoded arrays. When a backend is ready, each page will fetch from an API and pass data down via props or context.

---

## Route Guard Pattern

```tsx
// App.tsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}
```

All routes except `/login` are wrapped in `ProtectedRoute`. The admin session is read from `localStorage` on mount, so refreshing the page keeps the user logged in.

---

## Component Patterns

### Layout Shell (`AdminLayout.tsx`)
- Fixed sidebar (256px) + fixed header (60px) + scrollable `<main>`
- Uses React Router `<Outlet>` to render child pages
- Mobile: sidebar hidden by default, toggled by hamburger button
- Sidebar overlay (`bg-black/50`) on mobile when sidebar is open

### Pages
- Each page is a single `.tsx` file in `src/pages/`
- Pages manage their own local state (`useState`)
- Modals are rendered inline at the bottom of the page component
- No shared state between pages (future: lift to context or API layer)

### Modals
- Implemented as conditionally rendered `div` with `fixed inset-0 bg-black/50`
- Centered content card: `bg-white rounded-2xl p-6 max-w-Xpx`
- Closed by setting local state flag to `false`

---

## Separation from Main App

| Aspect | Selliberation (main) | Selliberation-Admin |
|---|---|---|
| Purpose | User-facing platform | Admin management UI |
| Auth | `selliberation_user` in localStorage | `selliberation_admin_session` in localStorage |
| Routes | `/`, `/login`, `/dashboard/*`, `/admin/*` | `/login`, `/`, `/users`, etc. |
| Deployment | `selliberation.com` | `admin.selliberation.com` |
| Admin pages | Duplicated at `/admin/*` | Primary source of truth |

---

## Future: API Integration

When a backend is built, follow this pattern for each page:

```tsx
// Example: Users page
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json())
    .then(data => setUsers(data))
    .finally(() => setLoading(false));
}, []);
```

Recommended API structure:
- `GET /api/admin/users` — paginated user list
- `PATCH /api/admin/users/:id` — ban/activate/update user
- `GET /api/admin/withdrawals` — withdrawal queue
- `POST /api/admin/withdrawals/:id/approve`
- `POST /api/admin/withdrawals/:id/reject`
- `GET /api/admin/commissions`
- `GET /api/admin/courses` + CRUD
- `GET/PUT /api/admin/settings`

---

## Deployment

**Vercel (recommended):**
1. Push `Selliberation-Admin` to a separate GitHub repo (do NOT commit `node_modules`)
2. Import into Vercel → New Project → Import repo
3. Vercel auto-detects Vite via `vercel.json` (`"framework": "vite"`)
4. `vercel.json` sets `installCommand: "npm install --include=dev"` — required so devDependencies (vite, tsc) install even under `NODE_ENV=production`
5. `vercel.json` rewrites all paths to `/index.html` for SPA routing

**Why `--include=dev` matters:** Vercel builds with `NODE_ENV=production`, which causes plain `npm install` to skip devDependencies. Without this flag, `vite` and `tsc` won't be installed → build exits with code 126.

**Why `node_modules` must not be in git:** Windows-built binaries (`.exe`, platform-specific `.node` files) cannot execute on Vercel's Linux environment → exit 126. The `.gitignore` already excludes `node_modules/`.

**Custom domain:** Set `admin.selliberation.com` in Vercel settings.
