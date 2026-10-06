-- Campus OPD Database Schema
-- Compatible with PostgreSQL 14+ and PGlite


-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'DOCTOR', 'ADMIN')),
    student_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(available);

-- 3. Doctor Schedules Table
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER NOT NULL DEFAULT 15,
    max_patients INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_schedule_times CHECK (start_time < end_time),
    CONSTRAINT chk_slot_duration CHECK (slot_duration > 0),
    CONSTRAINT chk_max_patients CHECK (max_patients > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_doctor_schedule_date ON doctor_schedules(doctor_id, date);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_date ON doctor_schedules(date);

-- 4. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot VARCHAR(50) NOT NULL,
    token_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('BOOKED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'WAITING',
    symptoms TEXT NOT NULL,
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crucial Constraint: Prevent double booking for the same doctor, date, and slot unless cancelled
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_doctor_slot 
    ON appointments (doctor_id, date, slot) 
    WHERE status != 'CANCELLED';

-- Additional helpful indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_appointments_student_id ON appointments(student_id);
CREATE INDEX IF NOT EXISTS idx_appointments_queue ON appointments(doctor_id, date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_token ON appointments(token_number);
