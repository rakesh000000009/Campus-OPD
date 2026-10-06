# Campus OPD 🏥
> **Campus Doctor Appointment & OPD Queue-Management System**

Campus OPD solves the problem of students waiting in crowded physical lines at the campus health centre. Students can browse available campus doctors, book specific consultation slots, submit their current symptoms and medical history in advance, receive a digital queue token (e.g. `A-17`), and track their queue position live from their hostel or classroom.

---

## 1. Project Overview

Campus health centres often face long, unpredictable physical queues during peak hours. **Campus OPD** streamlines the consultation lifecycle:
* **Students** book appointments with available on-duty doctors, receive deterministic digital tokens, and track real-time queue status (e.g. "Currently Serving: A-13", "Your Token: A-17", "3 people ahead").
* **Doctors** manage their consultation console in real-time: view booked patients, review reported symptoms and past medical history before calling a patient, start consultations (`WAITING` → `IN_PROGRESS`), and complete consultations (`IN_PROGRESS` → `COMPLETED`).
* **Admins** manage doctors, configure daily consultation schedules (duty hours, slot duration, patient capacity limit), monitor all OPD lines, and advance queues.

---

## 2. Key Features

- **Role-Based Authentication & Authorization (RBAC)**: Secure JWT authentication supporting `STUDENT`, `DOCTOR`, and `ADMIN` roles. Role middleware enforces route protection.
- **Doctor Roster & Availability**: Real-time listing of campus doctors, department specializations, room numbers, and on-duty availability.
- **Dynamic Slot Generation & Double-Booking Prevention**: Slots are computed on-the-fly based on doctor duty hours and slot durations. A database unique constraint ensures two students cannot book the same slot.
- **Capacity Management**: Once a doctor reaches their scheduled capacity limit (`max_patients`), remaining slots show `FULL` and cannot be booked.
- **Deterministic Token Generation**: Generates clean sequential tokens per doctor and room (e.g., `A-1`, `A-2`, `A-5`, `B-1`).
- **Real-Time Live Queue Tracking**: Synchronized with **Socket.IO** and fallback polling. As soon as a doctor or admin starts or finishes a consultation, students' screens update live without page refreshes.
- **Medical Triage**: Students submit current symptoms and medical history during booking; doctors can review full visit history during consultation.
- **Schedule Management**: Admins can define duty timings, slot intervals, and capacity per doctor.

---

## 3. Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   React + Vite Frontend                │
│    (Tailwind CSS, React Router, Axios, Socket.IO Client)│
└───────────────▲────────────────────────▲───────────────┘
                │ REST API               │ WebSocket
                │ (/api/*)               │ (Socket.IO events)
┌───────────────▼────────────────────────▼───────────────┐
│                    Express.js Backend                  │
│       Controllers ── Services ── Middleware (JWT)      │
└───────────────────────────▲────────────────────────────┘
                            │ SQL Queries
┌───────────────────────────▼────────────────────────────┐
│                  PostgreSQL Database                   │
│   (Embedded PGlite for Zero-Config, or Remote Postgres) │
│    Users • Doctors • Schedules • Appointments & Queue   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack

- **Frontend**:
  - React 18
  - Vite
  - Tailwind CSS
  - React Router DOM v6
  - Axios
  - Socket.IO Client
  - Lucide Icons
- **Backend**:
  - Node.js (v20+)
  - Express.js
  - JSON Web Tokens (JWT) & bcryptjs
  - Socket.IO
  - RESTful API Architecture
- **Database**:
  - PostgreSQL 16
  - `@electric-sql/pglite` (Embedded PostgreSQL engine for instant zero-config persistence)
  - `pg` (node-postgres connection pool for external PostgreSQL/Docker)

---

## 5. Folder Structure

```text
campus-opd/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Clean login & demo credentials switcher
│   │   │   ├── Dashboard.jsx         # Role-aware dashboard (Student, Doctor, Admin)
│   │   │   ├── Doctors.jsx           # Campus doctors catalog & availability
│   │   │   ├── BookAppointment.jsx   # Guided slot booking & token confirmation
│   │   │   ├── Queue.jsx             # Real-time OPD queue tracker
│   │   │   ├── DoctorDashboard.jsx   # Doctor consultation management
│   │   │   └── AdminDashboard.jsx    # Doctor, schedule & queue administration
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Responsive navigation & role switcher
│   │   │   ├── StatusBadge.jsx       # Styled status indicators
│   │   │   └── ProtectedRoute.jsx    # Role-based route authorization
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                # Axios instance with JWT interceptor
│   │   │   └── socket.js             # Socket.IO connection and queue listeners
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state & session manager
│   │   │
│   │   ├── App.jsx                   # Route declarations
│   │   ├── main.jsx                  # React application entrypoint
│   │   └── index.css                 # Tailwind CSS styles
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── backend/
│   ├── config/
│   │   ├── config.js                 # Environment variable configurations
│   │   └── db.js                     # Unified PostgreSQL & PGlite adapter
│   ├── controllers/
│   │   ├── authController.js         # Login, register, me
│   │   ├── doctorController.js       # Doctor listings & slot calculations
│   │   ├── appointmentController.js  # Booking, student history, cancellation
│   │   ├── queueController.js        # Queue state and advance
│   │   ├── doctorDashboardController.js # Doctor consultation actions
│   │   └── adminController.js        # Doctor, schedule, and queue management
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── queueRoutes.js
│   │   ├── doctorDashboardRoutes.js
│   │   └── adminRoutes.js
│   ├── models/
│   │   ├── userModel.js
│   │   ├── doctorModel.js
│   │   ├── scheduleModel.js
│   │   └── appointmentModel.js
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT verification & role authorization
│   │   └── errorHandler.js           # API error response formatting
│   ├── services/
│   │   ├── queueService.js           # Queue calculations & advance logic
│   │   ├── tokenService.js           # Deterministic token sequence generation
│   │   └── socketService.js          # Socket.IO broadcast handlers
│   ├── seed/
│   │   └── seed.js                   # Development demo accounts & queue seed
│   ├── app.js                        # Express app & static build integration
│   ├── server.js                     # HTTP & Socket.IO server entrypoint
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   └── schema.sql                    # Production PostgreSQL DDL schema
│
├── .env.example                      # Environment variables template
├── .env                              # Local environment configuration
├── docker-compose.yml                # Multi-container orchestration
├── package.json                      # Workspace scripts
└── README.md
```

---

## 6. Database Setup

The database schema is defined in [`database/schema.sql`](database/schema.sql).

### Tables:
1. `users`: Stores credentials, roles (`STUDENT`, `DOCTOR`, `ADMIN`), and student roll numbers.
2. `doctors`: Linked to `users` with specialization, room number, and availability flag.
3. `doctor_schedules`: Doctor duty schedules with date, start time, end time, slot duration, and max patients limit.
4. `appointments`: Stores student bookings with slot time, token number, status (`BOOKED`, `WAITING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), symptoms, and medical history.

### Constraints & Indexes:
```sql
CREATE UNIQUE INDEX idx_unique_active_doctor_slot 
    ON appointments (doctor_id, date, slot) 
    WHERE status != 'CANCELLED';
```
This ensures strict prevention of double bookings while allowing cancelled appointments to free up their time slots.

---

## 7. Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=campus-opd-secret-jwt-key-2026
JWT_EXPIRES_IN=24h

# Optional: If unset or empty, the backend runs with embedded PostgreSQL (PGlite) automatically
DATABASE_URL=
PG_DATA_DIR=./database/pgdata
```

---

## 8. Demo Credentials

All seeded demo accounts share the password: **`password123`**. The login page also features **One-Click Quick Login** buttons for instant testing.

| Role | Email | Password | Details |
|---|---|---|---|
| **Student** | `student@campusopd.local` | `password123` | Rahul Verma (Roll: `STU-2024-001`), has active Token `A-5` |
| **Doctor** | `doctor@campusopd.local` | `password123` | Dr. Sharma (General Medicine • Room 101) |
| **Doctor** | `dr.patel@campusopd.local` | `password123` | Dr. Priya Patel (Dermatology • Room 102) |
| **Doctor** | `dr.verma@campusopd.local` | `password123` | Dr. Rajesh Verma (Orthopedics • Room 103) |
| **Admin** | `admin@campusopd.local` | `password123` | Campus Health Admin |

---

## 9. How to Run the Application

### Option A: Quick Standalone Run (Zero External Dependencies)

1. **Install backend and frontend dependencies** (already installed in workspace):
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Seed the database** (creates tables and initial test data):
   ```bash
   node backend/seed/seed.js
   ```

3. **Start the Backend**:
   ```bash
   cd backend && npm start
   # Backend runs on http://localhost:5000
   ```

4. **Start the Frontend** (in a second terminal):
   ```bash
   cd frontend && npm run dev
   # Frontend runs on http://localhost:5173
   ```

> **Note**: Because the frontend is built into `frontend/dist`, running `node backend/server.js` alone serves both the API and the full interactive UI directly on `http://localhost:5000`!

---

### Option B: Running with Docker Compose

If Docker is available:
```bash
docker-compose up --build
```
This launches a PostgreSQL container with `schema.sql` preloaded and runs the backend service on port 5000.

---

## 10. API Overview

### Authentication
- `POST /api/auth/login` — Authenticate and receive JWT token + user profile
- `POST /api/auth/register` — Student account registration
- `GET  /api/auth/me` — Verify current session and fetch profile

### Doctors & Schedules
- `GET  /api/doctors` — List all campus doctors with availability status
- `GET  /api/doctors/:id` — Doctor details
- `GET  /api/doctors/:id/slots?date=YYYY-MM-DD` — Computed available, booked, and full slots

### Appointments
- `POST  /api/appointments` — Book appointment, generate token, set status to `WAITING`
- `GET   /api/appointments/:id` — View appointment details and live queue position
- `GET   /api/appointments/my` — Get authenticated student's appointment history
- `GET   /api/appointments/upcoming` — Get student's upcoming active appointment
- `PATCH /api/appointments/:id/cancel` — Cancel appointment (releases slot)

### OPD Queue
- `GET  /api/queue/:doctorId?date=YYYY-MM-DD` — Real-time queue for doctor
- `POST /api/queue/:doctorId/next` — Advance queue (`DOCTOR` / `ADMIN` only)

### Doctor Console
- `GET   /api/doctor/appointments?date=YYYY-MM-DD` — Doctor's schedule for today
- `GET   /api/doctor/patients/:id` — Patient visit history and records
- `PATCH /api/doctor/appointments/:id/status` — Start/complete consultation

### Admin Operations
- `GET    /api/admin/overview` — Health centre high-level metrics
- `GET    /api/admin/doctors` — All doctors roster
- `POST   /api/admin/doctors` — Register new doctor
- `PATCH  /api/admin/doctors/:id` — Update doctor details or toggle availability
- `GET    /api/admin/schedules` — All configured duty schedules
- `POST   /api/admin/schedules` — Add doctor duty schedule
- `DELETE /api/admin/schedules/:id` — Remove schedule
- `POST   /api/admin/queue/:doctorId/next` — Advance OPD line

---

## 11. End-to-End User Flow Example

1. **Student Login**: Log in with `student@campusopd.local` (`password123`).
2. **Dashboard**: Rahul Verma sees Token `A-5` with Dr. Sharma, currently 3 people ahead.
3. **Queue Tracking**: Click **Track Queue** (`/Queue`) to view "Currently Serving: A-2", "Your Token: A-5", "People Ahead: 3".
4. **Doctor Consultation**: Open an incognito tab or log in as `doctor@campusopd.local`. Dr. Sharma sees Token `A-2` In Progress. Doctor clicks **Complete Consultation** on `A-2` and **Start Consultation** on `A-3`.
5. **Real-Time Synchronous Update**: In the student window, the queue immediately advances: `A-3` is now currently serving, and Rahul's people ahead drops from 3 to 2!
6. **New Booking**: Book a new appointment under Dr. Priya Patel (`/BookAppointment`), pick a free slot, enter symptoms, confirm, and receive Token `B-2`.
7. **Admin Management**: Log in as `admin@campusopd.local` to monitor queues, call next patients, configure new doctor duty hours, and toggle doctor availability.
