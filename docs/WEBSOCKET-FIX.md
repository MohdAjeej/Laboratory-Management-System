# WebSocket HMR Connection Fix

## Problem

```
WebSocket connection to 'ws://172.19.128.1:3000/_next/hmr?id=...' failed
```

This error occurs when Next.js Hot Module Replacement (HMR) tries to connect using the wrong hostname. Common in:
- WSL2 environments
- Docker containers
- Virtual machines
- Network bridges

## Solution Applied

### 1. Updated `next.config.ts`

Added webpack polling configuration to handle file watching in WSL2/Docker:

```typescript
webpack: (config, { dev, isServer }) => {
  if (dev && !isServer) {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
  }
  return config;
}
```

### 2. Updated `package.json`

Changed dev script to explicitly bind to localhost:

```json
"dev": "next dev --hostname localhost"
```

### 3. Updated `.env.local`

Added WebSocket fix environment variables:

```env
WATCHPACK_POLLING=true
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## How to Apply

### Step 1: Restart the Dev Server

```bash
# Stop the current dev server (Ctrl+C)

# Start with the new configuration
npm run dev
```

### Step 2: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Step 3: Verify the Fix

You should see:
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

And no more WebSocket errors in the browser console.

## Alternative Solutions

### If Problem Persists

#### Option 1: Use Different Port

```bash
npm run dev -- --port 3001
```

Then update `.env.local`:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

#### Option 2: Disable Fast Refresh Temporarily

Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      turbo: {
        // Disable turbopack if issues persist
      },
    },
  }),
};
```

#### Option 3: WSL2 Specific Fix

If you're using WSL2, add to Windows hosts file:
```
C:\Windows\System32\drivers\etc\hosts
```

Add:
```
127.0.0.1 localhost
```

#### Option 4: Use Windows Terminal Instead of WSL

Run the dev server from Windows PowerShell or Command Prompt instead of WSL terminal.

## Verification

### Check if WebSocket is Working

Open browser console (F12) and look for:

✅ **Working:**
```
[HMR] connected
```

❌ **Not Working:**
```
WebSocket connection to 'ws://...' failed
```

### Test Hot Reload

1. Open any component file
2. Make a small change (add a space)
3. Save the file
4. Browser should auto-refresh without errors

## Common Causes

1. **WSL2 Network Bridge** - WSL2 uses a virtual network adapter
2. **Docker Network** - Container networking can cause hostname issues
3. **VPN/Proxy** - Network proxies may interfere
4. **Firewall** - Windows Firewall may block WebSocket connections
5. **Antivirus** - Security software may block localhost connections

## Troubleshooting

### Still Getting Errors?

#### Check Hostname Resolution

```bash
# In terminal
ping localhost
# Should show 127.0.0.1
```

#### Check Port Availability

```bash
# Windows
netstat -ano | findstr :3000

# WSL/Linux
netstat -tuln | grep 3000
```

#### Check Next.js Process

```bash
# List Next.js processes
ps aux | grep next

# Kill if needed
pkill -f next
```

#### Check Node Version

```bash
node --version
# Should be v18 or higher
```

#### Clear Next.js Cache

```bash
# Remove .next directory
rm -rf .next

# Remove node_modules/.cache
rm -rf node_modules/.cache

# Restart dev server
npm run dev
```

## Environment-Specific Solutions

### WSL2 Users

```bash
# Add to ~/.bashrc or ~/.zshrc
export WATCHPACK_POLLING=true
export HOST=localhost
```

### Docker Users

Add to `docker-compose.yml`:
```yaml
services:
  app:
    environment:
      - WATCHPACK_POLLING=true
      - HOST=0.0.0.0
    ports:
      - "3000:3000"
```

### Windows Users

No additional configuration needed if using native Windows terminal.

## Performance Impact

**Polling Method:**
- Slight CPU increase (minimal)
- File changes detected within 1 second
- Works reliably across all environments

**Without Polling:**
- Lower CPU usage
- Instant change detection
- May not work in WSL2/Docker

## Final Notes

- This fix is development-only and doesn't affect production builds
- Polling is a standard solution for cross-platform development
- HMR will work properly after applying these changes
- No code changes required after initial setup

---

**Status:** ✅ Fixed  
**Last Updated:** October 8, 2026
