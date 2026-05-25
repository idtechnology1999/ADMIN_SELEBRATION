# Skills & Capabilities — Selliberation Admin

This document describes how to approach common development tasks in this project.

---

## Adding a New Page

1. Create `src/pages/PageName.tsx`
2. Add route to `App.tsx` inside the `ProtectedRoute > AdminLayout` block:
   ```tsx
   <Route path="/page-name" element={<PageName />} />
   ```
3. Add nav link to `AdminLayout.tsx` `NAV_ITEMS` array:
   ```tsx
   { to: '/page-name', icon: IconName, label: 'Page Name', end: false }
   ```
4. Follow the page template:
   ```tsx
   export default function PageName() {
     return (
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
             Page Title
           </h1>
           <p className="text-gray-500 text-sm">Subtitle here</p>
         </div>
         {/* content */}
       </div>
     );
   }
   ```

---

## Adding a Data Table

Standard table pattern used across Users, Commissions, Withdrawals:

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          {['Col1', 'Col2', 'Actions'].map(h => (
            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items.map(item => (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-5 py-4 text-sm">{item.field}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

## Adding a Modal

```tsx
const [showModal, setShowModal] = useState(false);

// Trigger
<button onClick={() => setShowModal(true)}>Open</button>

// Modal
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold">Modal Title</h3>
        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
      </div>
      {/* content */}
      <div className="flex gap-2 mt-6">
        <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">
          Cancel
        </button>
        <button className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F5820A' }}>
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Using Brand Colors

Never use Tailwind color names for brand colors (they don't map to our values). Use inline styles:

```tsx
// ✅ Correct
<button style={{ background: '#F5820A' }}>CTA</button>
<span style={{ color: '#1CB957' }}>₦3,250</span>

// ❌ Wrong — these don't map to our brand
<button className="bg-orange-500">CTA</button>
```

For transparent backgrounds, use `rgba()`:
```tsx
style={{ background: 'rgba(245,130,10,0.15)' }}  // orange tint
style={{ background: 'rgba(28,185,87,0.1)' }}     // green tint
```

---

## Adding a Filter Tab Bar

```tsx
const [filter, setFilter] = useState('all');
const filters = ['all', 'pending', 'approved', 'rejected'];

<div className="flex gap-1.5">
  {filters.map(f => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
        filter === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      style={filter === f ? { background: '#F5820A' } : {}}
    >
      {f}
    </button>
  ))}
</div>
```

---

## Adding Search

```tsx
const [search, setSearch] = useState('');

<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
  <input
    type="text"
    placeholder="Search..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-56"
  />
</div>

// Filter usage
const filtered = items.filter(item =>
  item.name.toLowerCase().includes(search.toLowerCase())
);
```

---

## Replacing Mock Data with API Calls

When a backend is ready, replace hardcoded arrays with API calls:

```tsx
// Before (mock)
const [users, setUsers] = useState<User[]>(initialUsers);

// After (API)
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/admin/users', {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
    .then(r => r.json())
    .then(data => setUsers(data.users))
    .finally(() => setLoading(false));
}, []);
```

Add a loading skeleton state and error boundary when moving to real API calls.

---

## Deploying to Vercel

1. Push `Selliberation-Admin` to a GitHub repo — **never commit `node_modules`**
2. Go to vercel.com → New Project → Import repo
3. Vercel auto-detects Vite via `vercel.json`
4. No extra settings needed — `vercel.json` handles everything:
   - `"framework": "vite"` — framework detection
   - `"outputDirectory": "dist"` — build output
   - `"installCommand": "npm install --include=dev"` — installs devDeps on Linux
   - `"rewrites"` — SPA routing (all paths → `/index.html`)
5. Add domain `admin.selliberation.com` in Vercel DNS settings

**Common Vercel build failure (exit 126):** Caused by either:
- `node_modules` committed to git (Windows binaries fail on Linux) — fix: `git rm -r --cached node_modules`
- devDependencies skipped due to `NODE_ENV=production` — fix: `installCommand: "npm install --include=dev"` in `vercel.json`

---

## Using Recharts

All charts use `ResponsiveContainer` for fluid width. Import from `recharts`.

```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={250}>
  <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#F5820A" stopOpacity={0.15} />
        <stop offset="95%" stopColor="#F5820A" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50} />
    <Tooltip
      formatter={(val) => [`₦${Number(val).toLocaleString()}`, 'Revenue']}
      contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
    />
    <Area type="monotone" dataKey="revenue" stroke="#F5820A" strokeWidth={2.5} fill="url(#grad)" />
  </AreaChart>
</ResponsiveContainer>
```

**Critical:** Never type `formatter` callbacks as `(val: number)`. Recharts passes `ValueType | undefined`. Always use `(val)` and cast: `Number(val).toLocaleString()`.

---

## Common TypeScript Patterns

### Updating nested settings
```tsx
const update = <S extends keyof PlatformSettings>(section: S, field: string, value: string | number) => {
  setSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
};
```

### Type-safe status badge colors
```tsx
const getStatusColor = (status: 'pending' | 'approved' | 'rejected') => ({
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}[status]);
```

---

## Linting

```bash
npm run lint     # Check for issues
```

TypeScript strict mode is on. Common issues to watch:
- `noUnusedLocals` — remove unused variables
- `noUnusedParameters` — prefix unused params with `_`
- `verbatimModuleSyntax` — use `import type` for type-only imports
