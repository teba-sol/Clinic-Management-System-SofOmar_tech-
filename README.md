# SofOmar Clinic — Clinic Management System

A full clinic management system built for **SofOmar Tech**. It handles the complete patient journey — online booking, queueing, visits, prescriptions, lab orders, billing, and analytics — with a public marketing site and an offline-capable staff dashboard.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React + TypeScript, Vite, TanStack Query, Tailwind CSS v4, shadcn/ui, i18next (EN / AM / OM), PWA |
| Backend | NestJS (Node.js), Passport JWT, Socket.IO |
| Database | PostgreSQL via Drizzle ORM (raw SQL migrations in `apps/api/drizzle/`) |
| Storage | Supabase PostgreSQL; encrypted lab-result file uploads |

## Repository layout

```
apps/
  api/    # NestJS REST API + WebSocket queue updates
  web/    # React SPA (staff dashboard + public landing site)
```

## Features

### Public website
- Landing page with hero, departments, stats, team, and online **booking requests**
- Multilingual UI (English / Amharic / Afaan Oromoo)
- Clinic name, tagline, contact info pulled live from clinic settings

### Staff dashboard (role-based)
Roles: **admin, doctor, nurse, receptionist, lab_tech, cashier**. Each role sees only what it needs.

- **Patients** — register, search, full medical record (visits, prescriptions, labs, invoices)
- **Appointments & Queue** — book, check-in, triage, priority flags, live queue with Socket.IO updates
- **Booking Requests** — review website requests and convert them into appointments
- **Visits** — SOAP notes with ICD-10 diagnosis codes
- **Prescriptions** — digital e-prescriptions with PDF generation (clinic letterhead)
- **Lab Orders** — sample tracking, results with PDF reports and encrypted file uploads
- **Invoices** — smart auto-fill of prescribed medications + lab tests from the latest unbilled visit, with "already billed" exclusion and manual line items; cash / Telebirr / CBE Birr / insurance payments
- **Analytics** — revenue, financial snapshot, needs-attention panel, top diagnoses, patient flow
- **Schedules, Services, Users** — admin configuration

### Settings
- **Personal** — edit profile (name/phone), change password, view active sessions, log out of all devices
- **Appearance** — light / dark theme toggle (persisted per device)
- **Clinic (admin)** — clinic name, tagline, contact info, logo upload, working days/hours, holidays; feeds the landing site and PDF letterheads

### Platform
- JWT access + rotating refresh tokens with session revocation
- PWA + offline-first sync for core flows
- All current-time displays use **East Africa Time (UTC+3, Africa/Addis_Ababa)**

## Getting started

Prerequisites: Node.js 20+, a PostgreSQL database.

```bash
# 1. Install dependencies
cd apps/api && npm install
cd ../web && npm install

# 2. Configure the API
#    Create apps/api/.env with your DATABASE_URL, JWT_SECRET, and PORT (see apps/api/.env for the format)

# 3. Run database migrations
#    Apply the SQL files in apps/api/drizzle/ in order (0000 -> 0021)

# 4. Seed ICD-10 diagnosis codes
cd apps/api && npm run seed:icd10

# 5. Run the API (port 3000)
cd apps/api && npm run start:dev

# 6. Run the web app (Vite dev server)
cd apps/web && npm run dev
```

### Bootstrap admin

With an empty `users` table, create the first administrator:

```bash
curl -X POST http://localhost:3000/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"changeme","name":"Admin"}'
```

## Builds

```bash
cd apps/api && npm run build     # nest build -> dist/
cd apps/web && npm run build     # tsc -b && vite build -> dist/
```

## License

Private project for SofOmar Tech. All rights reserved.
