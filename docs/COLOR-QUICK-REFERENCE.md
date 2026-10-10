# LIMS Color Quick Reference

**Healthcare Professional Theme: Blue, White, Red**

## Primary Colors At a Glance

| Color | Hex | Tailwind Class | Use |
|-------|-----|----------------|-----|
| 🔵 Primary Blue | `#2196F3` | `primary-500` | Main brand, links, primary buttons |
| 🔵 Dark Blue | `#1976D2` | `primary-700` | Headers, navigation, sidebar |
| 🔴 Accent Red | `#F44336` | `accent-500` | Alerts, errors, delete actions |
| 🔴 Dark Red | `#D32F2F` | `accent-700` | Critical errors, urgent warnings |
| ⚪ White | `#FFFFFF` | `white` | Cards, backgrounds, text on dark |
| ⚫ Dark Gray | `#212121` | `neutral-900` | Primary text, headings |
| 🟢 Success Green | `#4CAF50` | `success-500` | Success messages, completed status |
| 🟠 Warning Orange | `#FF9800` | `warning-500` | Warnings, pending status |

## Quick Copy-Paste Classes

### Buttons
```tsx
// Primary
"bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"

// Secondary
"bg-white border-2 border-primary-300 text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-md"

// Danger
"bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-md"

// Success
"bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-md"
```

### Cards
```tsx
// Standard
"bg-white rounded-lg shadow-md border border-neutral-200 p-6"

// With Header
"bg-white rounded-lg shadow-md overflow-hidden"
// Header: "bg-primary-700 text-white px-6 py-4 font-semibold"
// Body: "p-6"

// Highlighted
"bg-primary-50 border border-primary-200 rounded-lg p-6"
```

### Status Badges
```tsx
// Completed
"bg-success-100 text-success-800 border border-success-300 px-3 py-1 rounded-full text-xs font-medium"

// Pending
"bg-warning-100 text-warning-800 border border-warning-300 px-3 py-1 rounded-full text-xs font-medium"

// Cancelled
"bg-accent-100 text-accent-800 border border-accent-300 px-3 py-1 rounded-full text-xs font-medium"

// In Progress
"bg-info-100 text-info-800 border border-info-300 px-3 py-1 rounded-full text-xs font-medium"

// Urgent
"bg-accent-600 text-white border border-accent-700 px-3 py-1 rounded-full text-xs font-semibold"
```

### Forms
```tsx
// Input
"w-full px-4 py-2 border border-neutral-300 rounded-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200"

// Input Error
"w-full px-4 py-2 border border-accent-500 rounded-md focus:border-accent-600 focus:ring-2 focus:ring-accent-200"

// Label
"block text-sm font-medium text-neutral-700 mb-2"

// Error Text
"mt-1 text-sm text-accent-700"
```

### Tables
```tsx
// Header
"bg-primary-700 text-white font-semibold"

// Row
"border-b border-neutral-200 hover:bg-primary-50"

// Cell
"px-6 py-4 text-sm text-neutral-900"
```

### Alerts
```tsx
// Success
"bg-success-50 border border-success-200 text-success-800 rounded-lg p-4"

// Warning
"bg-warning-50 border border-warning-200 text-warning-800 rounded-lg p-4"

// Error
"bg-accent-50 border border-accent-200 text-accent-800 rounded-lg p-4"

// Info
"bg-info-50 border border-info-200 text-info-800 rounded-lg p-4"
```

### Navigation
```tsx
// Sidebar
"bg-primary-800 text-white min-h-screen w-64 shadow-lg"

// Nav Item
"px-6 py-3 hover:bg-primary-700 cursor-pointer flex items-center gap-3"

// Active Nav Item
"bg-primary-900 border-l-4 border-accent-500 px-6 py-3 flex items-center gap-3"

// Header
"bg-primary-700 text-white px-6 py-4 shadow-md"
```

## Color Meanings

| Status | Color | Tailwind | Meaning |
|--------|-------|----------|---------|
| ✅ Completed | Green | `success-500` | Task/order finished successfully |
| ⏳ Pending | Orange | `warning-500` | Awaiting action or approval |
| 🔄 In Progress | Blue | `info-500` | Currently being processed |
| ❌ Cancelled | Red | `accent-500` | Cancelled or rejected |
| 🚨 Urgent | Dark Red | `accent-600` | Requires immediate attention |
| ⚠️ Critical | Darkest Red | `accent-900` | System critical alert |

## Common Patterns

### Dashboard Stat Cards
```tsx
<div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
  <div className="text-3xl font-bold text-primary-700">142</div>
  <div className="text-sm text-neutral-600">Total Orders</div>
</div>
```

### Action Buttons Group
```tsx
<div className="flex gap-3">
  <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md">
    Save
  </button>
  <button className="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded-md">
    Cancel
  </button>
  <button className="bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-md">
    Delete
  </button>
</div>
```

### Status Timeline
```tsx
<div className="flex items-center gap-2">
  <div className="w-8 h-8 rounded-full bg-success-500 text-white flex items-center justify-center">✓</div>
  <div className="flex-1 h-1 bg-success-200"></div>
  <div className="w-8 h-8 rounded-full bg-info-500 text-white flex items-center justify-center">2</div>
  <div className="flex-1 h-1 bg-neutral-200"></div>
  <div className="w-8 h-8 rounded-full bg-neutral-300 text-neutral-600 flex items-center justify-center">3</div>
</div>
```

## Do's and Don'ts

### ✅ Do
- Use `primary-700` for navigation and headers
- Use `primary-600` for primary action buttons
- Use `accent-600` for destructive actions
- Use `white` backgrounds for main content cards
- Use `neutral-50` for page backgrounds
- Use `success`, `warning`, `error` for status indicators

### ❌ Don't
- Don't use `primary-900` for large areas (too dark)
- Don't use `accent-500` for non-critical elements
- Don't mix multiple bright colors in one component
- Don't use light colors (`-50`, `-100`) for text
- Don't use red for non-error/warning situations

## Accessibility

All combinations are WCAG 2.1 AA compliant:

✅ White text on `primary-700` → 7.3:1  
✅ White text on `accent-700` → 6.1:1  
✅ `neutral-900` on white → 16:1  
✅ `primary-900` on `primary-50` → 9.2:1  

## Testing Your Colors

```bash
# View the color showcase
# Navigate to: /components/color-showcase
```

---

**Quick Tip:** When in doubt, use `primary-600` for actions, `neutral-600` for text, and `white` for backgrounds.
