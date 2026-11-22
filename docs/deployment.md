# Code Grand Prix 2026 — Production Deployment Guide

This guide covers shifting and deploying the **Code Grand Prix 2026** frontend from development/demo mock mode to production deployment.

---

## 1. Architecture Overview

Code Grand Prix 2026 is architected with a strict separation between mock simulation and production API connectivity:

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|  - Brand Intro & F1 Cinematic Hero                          |
|  - Monaco Code Editor & Real-Time Test Runner               |
|  - Anti-Cheat Window / Focus Monitor                        |
|  - Staff Race Control & Participant Monitoring              |
+-------------------------------------------------------------+
                              |
               HTTP /api & Cookie Auth Credentials
                              v
+-------------------------------------------------------------+
|               Reverse Proxy / Static CDN                    |
|  - Vercel Edge / Netlify / Nginx Container                 |
|  - SPA Client Routing: /* -> /index.html                    |
|  - Asset Caching: /assets/* (immutable 1 year)              |
+-------------------------------------------------------------+
                              |
                     Reverse Proxy /api/
                              v
+-------------------------------------------------------------+
|             Code Grand Prix Backend (Express/Node)          |
|  - Authentication & HttpOnly Cookies (/api/auth)            |
|  - Contest Clock & Problem Service (/api/contest)           |
|  - Code Execution & Judge0 Sandbox (/api/code)              |
|  - Volunteer Incident Resolution (/api/volunteer)           |
|  - PostgreSQL via Prisma ORM                                |
+-------------------------------------------------------------+
```

---

## 2. Environment Variables

Frontend environment variables are prefixed with `VITE_` and embedded at build time by Vite.

| Variable | Default (Production) | Default (Development) | Description |
| :--- | :--- | :--- | :--- |
| `VITE_ARENA_MODE` | `api` | `mock` | When set to `api`, all arena services make live HTTP requests. In `mock`, in-memory browser simulation is used. |
| `VITE_API_BASE_URL` | `/api` | `/api` | Base path/URL for API endpoints. Keep as `/api` when using a reverse proxy or same-domain deployment. |
| `VITE_BACKEND_URL` | `http://localhost:4000` | `http://localhost:4000` | Target URL used by the Vite dev server proxy to forward `/api` requests to backend in local full-stack dev. |
| `VITE_MONITORING_POLL_MS` | `3000` | `2000` | Heartbeat & incident polling interval in ms (allowed: 1000–30000). |
| `VITE_REPLAY_BRAND_INTRO` | `false` | `false` | Set to `true` only for motion QA to replay intro on every refresh. |

### Production Environment File (`.env.production`)
A ready-to-use `.env.production` is provided in the repository root:
```env
VITE_ARENA_MODE=api
VITE_API_BASE_URL=/api
VITE_MONITORING_POLL_MS=3000
VITE_REPLAY_BRAND_INTRO=false
```

---

## 3. Pre-Flight Verification & Build

Before pushing to production, run the automated verification pipeline:

```bash
# 1. Install dependencies
npm ci

# 2. Run static linter
npm run lint

# 3. Run algorithmic contract & integrity tests
npm test

# 4. Compile and verify production build
npm run build

# Or run all 3 in one step:
npm run check
```

To preview the exact production build locally:
```bash
npm run preview
```

---

## 4. Deployment Targets

### Option A: Vercel (Recommended)
1. Push your branch to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select `code-grand-prix-website`.
3. Vercel automatically detects the framework preset as **Vite**.
4. Set Build & Output Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Environment Variables:
   - `VITE_ARENA_MODE`: `api`
   - `VITE_API_BASE_URL`: `/api` (or your backend domain: `https://api.yourdomain.com/api`)
6. `vercel.json` in the root automatically handles:
   - SPA rewrites (`/(.*)` -> `/index.html`)
   - Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)
   - Immutable cache headers for `/assets/*`

### Option B: Netlify / Cloudflare Pages
1. Deploy from Git.
2. Set Build Settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. SPA routing is automatically handled by `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### Option C: Docker Container (Cloud Run / AWS ECS / VPS)
A production multi-stage `Dockerfile` and `nginx.conf` are included:

```bash
# Build the Docker image
docker build -t cgp-website:latest .

# Run the container on port 80
docker run -d -p 80:80 --name cgp-frontend cgp-website:latest
```

The Nginx image:
- Compresses assets using gzip
- Sets caching headers on `/assets/`
- Directs all unmatched routes to `/index.html` for React Router SPA navigation
- Passes Docker health checks on `/`

---

## 5. Connecting with the Backend

The official backend lives on the `origin/backend` (or `origin/backend-hardening-cgp`) branch:

1. **CORS & Origin Configuration**:
   The backend's `ALLOWED_ORIGINS` environment variable must include your production frontend URL (e.g. `https://codegrandprix.com,https://www.codegrandprix.com`).
2. **Cookie Handling**:
   The frontend uses `withCredentials: true` in Axios (`src/services/api.ts`). The backend sets HttpOnly session cookies with `SameSite=None` (for cross-domain) or `SameSite=Lax` (for same-domain reverse proxies).
3. **Staff Access**:
   In production, the mock account preview panel on `/login` and mock banners in `/admin` and `/volunteer` are automatically eliminated (`isDevelopmentMock === false`). Access strictly requires valid server-issued credentials.
