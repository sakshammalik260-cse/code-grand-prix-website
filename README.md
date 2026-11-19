# Code Grand Prix 2026 — Backend API 🏎️💨

Official authoritative backend engine for **Code Grand Prix 2026**, an F1-themed competitive coding platform organized by the **Competitive Programming Club (CPC)**.

Built with **Node.js, TypeScript, Express, PostgreSQL, and Prisma ORM**.

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- **Node.js**: `v18+` or `v20+` (Tested on `v26.13.0`)
- **npm**: `v9+` or `v11+`

### 2. Installation
```bash
# Clone and enter directory
cd "Code Grand Prix"

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(Default settings are already pre-configured for instant zero-setup local development).*

### 4. Run the Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:4000/api`. Verify health:
```bash
curl http://localhost:4000/api/health
```

### 5. Run the Automated Test Suite
```bash
npm test
```
Executes all **46 automated integration tests** covering Authentication, Pre-Race Check-in, Sandboxed Code Runs, Judging Submissions, Anti-Cheat Violations, Volunteer Bulk Resume, Hints, Leaderboard, and Admin Controls.

---

## 🔐 Default Demo Accounts

Pre-configured in seed data for immediate testing:

| Role | Driver ID / Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **CANDIDATE** | `CGP2026` | `Race2026!` | Frontend Demo Driver (Monaco coding arena, hints, submissions) |
| **CANDIDATE** | `CGP_045` | `driver123` | Lewis Hamilton (Sample driver) |
| **VOLUNTEER** | `VOLUNTEER2026` | `Marshal2026!` | Race Control proctor (Incident reviews, one-click bulk unlocks) |
| **VOLUNTEER** | `VOL_RACE_CONTROL` | `racecontrol2026`| Charlie Whiting (FIA Race Director) |
| **ADMIN** | `ADMIN2026` | `Control2026!` | Club Organizer (Create problems, publish rounds, toggle standings) |

---

## 🗄️ Database Setup (PostgreSQL / Supabase)

The backend uses **Prisma ORM** with PostgreSQL.

### Connecting to Supabase (Recommended Free Cloud Hosting)
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection String (URI)**.
3. Open `.env` and paste your connection string:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with contest questions, test cases, and demo users:
   ```bash
   npm run prisma:seed
   ```
6. Open **Prisma Studio** to inspect database tables in your browser:
   ```bash
   npx prisma studio
   ```

*(Note: If a remote database is not connected during local testing, the backend seamlessly uses an in-memory repository fallback preloaded with all competition data).*

---

## ⚙️ Judging & Code Execution Engine

Code execution is isolated via the **Modular Judge Adapter** pattern:
- **Development**: `LocalSandboxJudge` executes code inside temporary isolated scratch directories with stdin piping, 64KB buffer truncation, and hard process timeouts (`SIGKILL`).
- **Production**: `Judge0Adapter` communicates with an isolated Judge0 cluster via HTTP (`JUDGE_PROVIDER="judge0"`).

### Supported Languages
1. **Python 3** (`python`): Interpreted with memory limits and execution timeout.
2. **JavaScript** (`javascript`): Runs in Node.js with V8 memory constraints (`--max-old-space-size=256`).
3. **C++** (`cpp`): Compiled with `g++ -O2 -std=c++17` before execution.
4. **Java** (`java`): Compiled with `javac` and executed in JVM bounded by `-Xmx256m`.

---

## 📡 API Reference Overview

Base URL: `http://localhost:4000/api`

### 1. Authentication & Sessions
- `POST /api/auth/login`: Authenticates driverId & password; issues HttpOnly cookie and JWT token.
- `GET /api/auth/me`: Returns profile of authenticated user.
- `POST /api/auth/logout`: Revokes token immediately and clears cookie.
- `POST /api/checkin`: Pre-race check-in (rules, camera, fullscreen).
- `GET /api/session`: Rehydrates session status, lock reason, and time remaining.

### 2. Contest Clock & Questions
- `GET /api/contest`: Authoritative server time, countdown milliseconds, and status.
- `GET /api/contest/problems`: Lists published problems (Easy, Medium, Hard).
- `GET /api/contest/problems/:id`: Returns Markdown statement, constraints, and **public sample tests only** (hidden test cases are strictly protected).
- `GET /api/languages`: Supported programming languages and starter templates.

### 3. Execution & Judging
- `POST /api/code/run`: Runs code against sample test cases or custom input.
- `POST /api/code/submit`: Evaluates code against hidden private test cases, awards points, and saves submission.
- `GET /api/submissions/:id`: Retrieves persisted verdict (`ACCEPTED`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, etc.) and score.

### 4. Anti-Cheat Monitoring & Race Control
- `POST /api/violations`: Ingests client browser signals (`TAB_HIDDEN`, `FULLSCREEN_EXIT`, `WINDOW_FOCUS_LOST`).
  - Critical events trigger immediate session `LOCK`.
  - Deduplicated by `clientEventId`.
- `GET /api/volunteer/participants`: Lists live participant statuses, lock counts, and scores.
- `GET /api/volunteer/incidents`: Lists reported violation alerts.
- `POST /api/volunteer/sessions/:id/authorize-resume`: **One-Action Bulk Session Recovery** — atomically resolves all open incidents for the session and restores status to `ACTIVE`.

### 5. Race Assist Hints
- `GET /api/contest/problems/:id/hints`: Returns problem hints (locked hint content is concealed).
- `POST /api/contest/problems/:id/hints/:hintId/unlock`: Unlocks hint, reveals text, and deducts penalty points (idempotent; no double deductions).

### 6. Leaderboard & Results
- `GET /api/leaderboard`: Authoritative server-ranked standings.
- `GET /api/contest/progress`: Candidate personal score and solved problem IDs.
- `GET /api/contest/results/visibility`: Check if standings are visible to candidates.
- `POST /api/admin/results/visibility`: Admin toggle to show/hide leaderboard.

### 7. Admin Question Management
- `GET /api/admin/overview`: Contest health and entity counts.
- `GET /api/admin/problems`: All problems including drafts.
- `POST /api/admin/problems`: Create custom problem draft.
- `POST /api/admin/problems/:id/publish`: Publish problem for candidates.
- `POST /api/admin/problems/:id/unpublish`: Retract problem to draft.

---

## 🧪 Postman Collection

Import [`docs/code-grand-prix-postman.json`](file:///Users/sneha/Documents/Code%20Grand%20Prix/docs/code-grand-prix-postman.json) into Postman for pre-configured requests with variables and sample payloads.

---

## 🚢 Deployment (Render / Railway)

1. Connect this GitHub repository to Render or Railway.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Configure Environment Variables in deployment dashboard:
   - `DATABASE_URL`: Supabase connection string.
   - `JWT_SECRET`: Secure random string.
   - `ALLOWED_ORIGINS`: Frontend URL (e.g. `https://your-frontend.vercel.app`).
   - `COOKIE_SECURE`: `true`.
