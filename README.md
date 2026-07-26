# Clinic Management System - SofOmar Tech

A full-stack clinic management system built with NestJS + Drizzle ORM (backend) and React + Vite + shadcn/ui (frontend). Designed for managing patients, doctor schedules, appointment queues, and role-based access control in a clinical environment.

## Tech Stack

### Backend (`apps/api`)
- **Framework:** NestJS v11
- **ORM:** Drizzle ORM v0.45 (PostgreSQL)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Passport.js + JWT (access + refresh tokens)
- **Real-time:** Socket.IO (WebSocket queue updates)
- **Validation:** class-validator + class-transformer
- **Password Hashing:** bcrypt

### Frontend (`apps/web`)
- **Framework:** React 19 + TypeScript
- **Build:** Vite 8
- **Styling:** Tailwind CSS 4 + shadcn/ui (base-nova)
- **Routing:** react-router-dom v7
- **HTTP:** Axios
- **Real-time:** socket.io-client

---

## What Has Been Built So Far

### 1. Authentication & Authorization (JWT + RBAC)

- **Login** (`POST /auth/login`) - Email/password authentication, returns JWT access token (15min) + refresh token (7 days)
- **Refresh** (`POST /auth/refresh`) - Exchange a valid refresh token for a new access token
- **Get Current User** (`GET /auth/me`) - Returns the authenticated user's profile
- Refresh tokens are stored in the database (hashed with bcrypt) and can be revoked
- JWT strategy via Passport.js extracts user from Bearer token

**Role-Based Access Control (RBAC):**
- 6 roles defined: `admin`, `doctor`, `nurse`, `receptionist`, `lab_tech`, `cashier`
- `@Roles()` decorator to restrict endpoints by role
- `RolesGuard` checks the user's role against required roles
- `JwtAuthGuard` protects all guarded routes
- `@CurrentUser()` decorator to access the authenticated user in controllers

### 2. Users Module

- **Create User** (`POST /users`) - Register a new user (admin, doctor, nurse, receptionist, lab_tech, cashier)
- **List Users** (`GET /users`) - Admin-only endpoint to list all users (passwords excluded)
- Passwords are hashed with bcrypt before storage
- Email uniqueness validation with conflict handling

### 3. Patients Module

- **Create Patient** (`POST /patients`) - Register a new patient (receptionist, nurse, admin)
- **List Patients** (`GET /patients`) - View all patients (admin, receptionist, nurse, doctor)
- **Get Patient** (`GET /patients/:id`) - View a single patient by ID
- Auto-generated Medical Record Number (MRN) in format `MRN-YYYY-00001`
- Patient data includes: name, DOB, gender, phone, email, address, blood group, allergies, chronic conditions, emergency contact

**RBAC applied:**
| Endpoint | Allowed Roles |
|----------|---------------|
| `POST /patients` | admin, receptionist, nurse |
| `GET /patients` | admin, receptionist, nurse, doctor |
| `GET /patients/:id` | admin, receptionist, nurse, doctor |

### 4. Doctor Schedules Module

- **Create Schedule** (`POST /schedules`) - Admin-only: assign weekly schedule to a doctor
- **List All Schedules** (`GET /schedules`) - View all doctor schedules
- **Get Doctor Schedule** (`GET /schedules/doctor/:doctorId`) - View a specific doctor's weekly schedule
- Supports day-of-week enum, start/end times, and configurable slot duration (default 20 min)

**RBAC applied:**
| Endpoint | Allowed Roles |
|----------|---------------|
| `POST /schedules` | admin |
| `GET /schedules` | admin, receptionist, doctor, nurse |
| `GET /schedules/doctor/:doctorId` | admin, receptionist, doctor, nurse |

### 5. Appointments Module

- **Book Appointment** (`POST /appointments`) - Receptionist or admin books an appointment
- **Get Doctor Queue** (`GET /appointments/queue/:doctorId`) - View today's queue for a doctor
- Auto-assigned queue number based on existing appointments for that doctor on the same day
- Appointment statuses: `booked`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show`

**Real-time Updates via WebSockets:**
- When an appointment is booked, the doctor's queue is broadcast to all connected clients via Socket.IO
- Clients can join a doctor's queue channel with `joinDoctorQueue` event
- Queue updates are emitted on `queue:{doctorId}` channel

**RBAC applied:**
| Endpoint | Allowed Roles |
|----------|---------------|
| `POST /appointments` | admin, receptionist |
| `GET /appointments/queue/:doctorId` | admin, receptionist, doctor, nurse |

### 6. Database Schema (4 tables, all migrated)

- **users** - UUID PK, email (unique), password_hash, name, role (enum), is_active, timestamps
- **refresh_tokens** - UUID PK, FK to users (cascade delete), token_hash, expires_at, revoked, created_at
- **patients** - UUID PK, MRN (unique), first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, allergies, chronic_conditions, emergency contact fields, timestamps
- **doctor_schedules** - UUID PK, FK to users, day_of_week (enum), start_time, end_time, slot_duration_minutes, created_at
- **appointments** - UUID PK, FK to patients (cascade), FK to users (cascade), scheduled_at, queue_number, status (enum), created_at

### 7. Frontend (Scaffolded)

- React 19 + Vite 8 project initialized
- Tailwind CSS 4 configured with shadcn/ui (base-nova style)
- shadcn components installed: Button, Card, Input, Label
- Axios, react-router-dom, socket.io-client installed and ready
- Geist font configured
- App.tsx currently has default Vite demo (frontend pages not yet built)

---

## Project Structure

```
Clinic-Management-System/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/                 # JWT auth, guards, decorators, strategy
│   │   │   ├── users/                # User management (CRUD)
│   │   │   ├── patients/             # Patient registration & lookup
│   │   │   ├── schedules/            # Doctor weekly schedules
│   │   │   ├── appointments/         # Appointment booking + WebSocket gateway
│   │   │   ├── db/                   # Drizzle ORM setup + schemas
│   │   │   │   ├── index.ts          # DB connection (pg Pool)
│   │   │   │   └── schema/           # All table schemas
│   │   │   ├── app.module.ts         # Root module
│   │   │   └── main.ts              # Bootstrap with ValidationPipe
│   │   └── drizzle/                  # SQL migrations (4 applied)
│   └── web/                          # React frontend (scaffolded)
│       └── src/
│           ├── components/ui/        # shadcn components
│           └── lib/utils.ts          # cn() utility
└── packages/
    └── types/                        # Shared types (placeholder)
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Backend Setup
```bash
cd apps/api
cp .env.example .env    # Set DATABASE_URL and JWT_SECRET
npm install
npx drizzle-kit push     # Sync schema to database
npm run start:dev
```

### Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```

## API Endpoints Summary

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/auth/login` | No | - | Login and get tokens |
| POST | `/auth/refresh` | No | - | Refresh access token |
| GET | `/auth/me` | Yes | Any | Get current user profile |
| POST | `/users` | No | - | Register new user |
| GET | `/users` | Yes | admin | List all users |
| POST | `/patients` | Yes | admin, receptionist, nurse | Register patient |
| GET | `/patients` | Yes | admin, receptionist, nurse, doctor | List patients |
| GET | `/patients/:id` | Yes | admin, receptionist, nurse, doctor | Get patient details |
| POST | `/schedules` | Yes | admin | Create doctor schedule |
| GET | `/schedules` | Yes | admin, receptionist, doctor, nurse | List all schedules |
| GET | `/schedules/doctor/:id` | Yes | admin, receptionist, doctor, nurse | Get doctor schedule |
| POST | `/appointments` | Yes | admin, receptionist | Book appointment |
| GET | `/appointments/queue/:doctorId` | Yes | admin, receptionist, doctor, nurse | View doctor queue |

## What's Next

- [ ] Frontend pages: Login, Dashboard, Patient Management, Scheduling, Appointment Queue
- [ ] API service layer with Axios interceptors for token management
- [ ] WebSocket client for real-time queue display
- [ ] Role-based UI rendering
- [ ] CORS configuration
- [ ] Unit and integration tests
