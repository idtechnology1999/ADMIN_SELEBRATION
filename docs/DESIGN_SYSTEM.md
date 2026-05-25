# Design System — Selliberation Admin

The admin panel shares its design language with the main Selliberation app. Both use the same brand colors, typography, and component patterns.

---

## Brand Colors

| Token | Hex | Usage |
|---|---|---|
| Navy Dark | `#08192E` | Sidebar gradient start |
| Navy Darker | `#050F1C` | Sidebar gradient end |
| Navy | `#0D2847` | Admin avatar bg, accents |
| Orange | `#F5820A` | Primary CTA, active nav, buttons |
| Orange Light | `rgba(245,130,10,0.15)` | Active nav background |
| Orange Muted | `rgba(245,130,10,0.08)` | Settings tab active bg |
| Green | `#1CB957` | Positive amounts, success badges |
| Red | `#EF4444` | Danger actions, error badges |
| Page BG | `#F0F2F5` | Main content area background |
| Card BG | `#FFFFFF` | All card/panel backgrounds |
| Border | `rgba(0,0,0,0.07)` | Header border |
| Sidebar Border | `rgba(255,255,255,0.07)` | Sidebar internal borders |

---

## Typography

### Font Families
- **Headings (h1–h6):** `'Plus Jakarta Sans', sans-serif` — set globally in `index.css` and via inline style
- **Body/UI:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — set on `body`

### Common Text Sizes
- Page title (h1): `text-2xl font-bold text-gray-900`
- Section title (h2): `text-base font-bold` or `text-lg font-bold`
- Table header: `text-xs font-semibold text-gray-500 uppercase tracking-wider`
- Body: `text-sm`
- Caption/meta: `text-xs text-gray-500`

---

## Layout

### Sidebar
```
Width:      256px (w-64)
Position:   fixed, full height
Background: linear-gradient(180deg, #08192E 0%, #050F1C 100%)
Z-index:    40
Mobile:     hidden, toggleable with hamburger
```

### Header
```
Height:     60px
Position:   fixed top, offset lg:left-64
Background: bg-white/95 backdrop-blur-sm
Border:     1px solid rgba(0,0,0,0.07)
Z-index:    20
```

### Main Content
```
Margin:     lg:ml-64
Padding:    pt-15 (top) + p-4 md:p-6
Max-width:  max-w-7xl mx-auto
```

---

## Components

### Cards
```tsx
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
```

### Stat Cards
```tsx
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(X,Y,Z,0.1)' }}>
    <Icon size={22} style={{ color: '#HEX' }} />
  </div>
  <p className="text-2xl font-bold text-gray-900">{value}</p>
  <p className="text-gray-500 text-sm">{label}</p>
</div>
```

### Tables
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Column
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <tr className="hover:bg-gray-50">
          <td className="px-5 py-4 text-sm">...</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Status Badges
```tsx
// Active / success
<span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>

// Trial / warning
<span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Trial</span>

// Expired / error
<span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Expired</span>

// Info
<span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Pending</span>
```

### Primary Button
```tsx
<button
  className="text-white px-4 py-2.5 rounded-xl font-semibold text-sm"
  style={{ background: '#F5820A', boxShadow: '0 4px 20px rgba(245,130,10,0.3)' }}
>
  Action
</button>
```

### Ghost/Secondary Button
```tsx
<button className="border border-gray-300 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50">
  Cancel
</button>
```

### Filter Tab Bar
```tsx
{['all', 'pending', 'approved'].map(f => (
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
```

### Input Fields
```tsx
<input
  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:border-amber-500 text-sm"
/>
```

### Modal
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
    {/* header */}
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-xl font-bold">Title</h3>
      <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
    </div>
    {/* content */}
    {/* footer */}
    <div className="flex gap-2 mt-6">
      <button className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm">Cancel</button>
      <button className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#F5820A' }}>Confirm</button>
    </div>
  </div>
</div>
```

---

## Navigation Active State

```tsx
style={({ isActive }) => isActive
  ? { background: 'rgba(245,130,10,0.15)', color: '#F5820A', borderLeft: '3px solid #F5820A' }
  : { color: 'rgba(255,255,255,0.6)' }
}
```

---

## Custom CSS Utilities

Defined in `src/index.css`:

| Class | Effect |
|---|---|
| `.glass` | White glassmorphism (70% opacity + backdrop-blur) |
| `.glass-dark` | Dark glassmorphism (navy 80% opacity + backdrop-blur) |
| `.gradient-text` | Navy → green gradient text fill |
| `.gradient-text-amber` | Amber → red gradient text fill |
| `.card-hover` | `translateY(-5px)` + shadow increase on hover |
| `.animate-float` | Gentle float loop (4s) |
| `.animate-fade-up` | Fade in from below (0.6s) |
| `.animate-slide-left` | Slide in from left (0.6s) |
| `.animate-pulse-glow` | Green pulsing glow (2s loop) |

---

## Spacing & Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-xl` | 12px | Cards, inputs, most elements |
| `rounded-2xl` | 16px | Modals, login card |
| `rounded-full` | 50% | Avatars, pill badges |
| `rounded-lg` | 8px | Small badges, icon containers |
| `p-4 md:p-6` | 16px/24px | Page padding |
| `gap-4` | 16px | Grid/flex gaps |
| `gap-6` | 24px | Section gaps |

---

## Icons

All icons from **Lucide React**.

Common sizes:
- `size={16}` — inline table action icons
- `size={17}` — sidebar nav icons, small buttons
- `size={18}` — standard buttons
- `size={20}` — stat card icons, header icons
- `size={22}` / `size={24}` — large feature icons
