# SuperDoc — Policy Management POC

A collaborative policy document management platform built with Angular 21, NestJS, SuperDoc (DOCX editor), and PostgreSQL.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21, Angular Material, SuperDoc 1.43.2 |
| Backend API | NestJS 10, Prisma ORM, PostgreSQL 16 |
| Collaboration | y-websocket server (Yjs CRDT) |
| PDF Export | Gotenberg v8 (LibreOffice conversion) |
| Auth | JWT (passport-jwt) |

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Docker Desktop** (for PostgreSQL, Redis, Gotenberg)

---

## Quick Start

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd superDoc
npm run install:all
```

This installs packages for `frontend/`, `backend/`, and `ws-server/` in one step.

### 2. Start infrastructure (Docker)

```bash
docker-compose up -d
```

Starts:
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`
- **Gotenberg 8** on port `3030` (PDF conversion)

### 3. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` if needed (defaults work for local dev):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/policy_mgmt"
JWT_SECRET="change-me-in-production-use-a-long-random-secret"
JWT_EXPIRES_IN="24h"
PORT=3000
UPLOAD_DIR="./uploads"
CORS_ORIGIN="http://localhost:4200"
GOTENBERG_URL="http://localhost:3030"
```

### 4. Configure WebSocket server environment

Create `ws-server/.env`:

```env
JWT_SECRET=change-me-in-production-use-a-long-random-secret
WS_PORT=1234
```

> **Important:** `JWT_SECRET` must be identical in both `backend/.env` and `ws-server/.env`, otherwise browser WebSocket connections will be rejected with code 4003 and users will not see each other's presence.

### 5. Run database migrations

```bash
npm run migrate
```

### 6. Seed the database

```bash
npm run seed
```

This creates the following demo users:

| Email | Password | Role |
|---|---|---|
| `admin@lrn.com` | `Admin@123` | Approver (Admin) |
| `policy.editor@lrn.local` | `Policy@12345` | Editor |
| `policy.reviewer@lrn.local` | `Policy@12345` | Reviewer |
| `policy.approver@lrn.local` | `Policy@12345` | Approver |
| `policy.viewer@lrn.local` | `Policy@12345` | Viewer |

### 7. Start all services

Open four terminal tabs and run each command:

```bash
# Tab 1 — NestJS API (hot reload)
npm run start:api

# Tab 2 — Angular dev server
npm run start:frontend

# Tab 3 — y-websocket collaboration server
npm run start:ws
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api |
| WebSocket | ws://localhost:1234 |
| Gotenberg | http://localhost:3030 |

---

## Project Structure

```
superDoc/
├── docker-compose.yml        # PostgreSQL, Redis, Gotenberg
├── package.json              # Root scripts (install:all, start:*)
│
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Prisma migration history
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # JWT auth, login, register
│   │   │   ├── policies/     # Policy CRUD, versioning, compare, PDF export
│   │   │   ├── chat/         # AI chat per policy
│   │   │   └── export/       # Export orchestration
│   │   └── config/
│   │       └── prisma.service.ts
│   └── uploads/              # Uploaded DOCX files (git-ignored)
│
├── frontend/                 # Angular 21 SPA
│   └── src/app/
│       ├── core/             # Auth service, guards, interceptors, models
│       ├── features/
│       │   ├── auth/login/
│       │   ├── policies/     # Policy list, editor page, new-policy dialog
│       │   ├── editor/       # SuperDoc editor, autosave, compare dialog, export
│       │   └── version-history/
│       └── shared/
│
└── ws-server/                # y-websocket collaboration server
    └── server.js
```

---

## Key Features

- **DOCX editing** via SuperDoc (real-time collaborative WYSIWYG editor)
- **Autosave** — changes are saved automatically with a 1.5 s debounce; no manual save required
- **Version history** — every manual snapshot creates a new numbered version
- **Inline document comparison** — select any two versions to see a word-level red/green diff rendered directly in the browser (no file download)
- **Version restore** — one-click restore: any compared version can be promoted as the latest version
- **PDF export** — converts the current DOCX to PDF via Gotenberg/LibreOffice
- **Role-based access** — Editor, Reviewer, Approver, Viewer roles

---

## API Overview

Base URL: `http://localhost:3000/api`

All endpoints (except `POST /auth/login` and `POST /auth/register`) require a JWT `Authorization: Bearer <token>` header.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Returns `accessToken` |
| POST | `/auth/register` | Create a new user |

### Policies
| Method | Path | Description |
|---|---|---|
| GET | `/policies` | List all policies |
| POST | `/policies` | Create a policy |
| GET | `/policies/:id` | Get policy detail |
| GET | `/policies/:id/versions` | List versions |
| GET | `/policies/:id/versions/:vId/docx` | Download DOCX |
| POST | `/policies/:id/versions/upload` | Upload new DOCX version |
| POST | `/policies/:id/versions/current/docx` | Autosave current DOCX |
| GET | `/policies/:id/compare?v1=&v2=` | Inline HTML diff |
| POST | `/policies/:id/versions/:vId/restore` | Restore version as latest |
| GET | `/policies/:id/export/pdf` | Export PDF via Gotenberg |

---

## Running Tests

```bash
# Backend unit tests
npm --prefix backend test

# Frontend unit tests
npm --prefix frontend test -- --watch=false
```

---

## Common Issues

**`Cannot connect to PostgreSQL`** — make sure Docker containers are running: `docker-compose ps`

**`prisma migrate` fails** — ensure `DATABASE_URL` in `backend/.env` is correct and Postgres is healthy.

**PDF export fails** — verify Gotenberg is running: `curl http://localhost:3030/health`

**WebSocket not connecting** — ensure `JWT_SECRET` in `ws-server/.env` matches `backend/.env`.

**Uploads directory missing** — the backend creates `backend/uploads/` automatically on first run. If you see a file-not-found error, create it manually: `mkdir -p backend/uploads`
