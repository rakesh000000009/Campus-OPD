-- Campus OPD - Demo Seed Data
-- Demo password for all accounts: password123
-- Schedules/appointments are anchored to CURRENT_DATE so the queue demo works on any day.

-- 1. Admin
INSERT INTO users (name, email, password_hash, role)
VALUES ('Campus Health Admin', 'admin@campusopd.local',
        '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'ADMIN');

-- 2. Doctor user accounts
INSERT INTO users (name, email, password_hash, role)
VALUES
  ('Dr. Sharma',      'doctor@campusopd.local',   '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'DOCTOR'),
  ('Dr. Priya Patel', 'dr.patel@campusopd.local', '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'DOCTOR'),
  ('Dr. Rajesh Verma','dr.verma@campusopd.local', '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'DOCTOR');

-- 3. Doctor profiles
INSERT INTO doctors (user_id, specialization, room_number, available)
VALUES
  ((SELECT id FROM users WHERE email = 'doctor@campusopd.local'),   'General Medicine', 'Room 101', TRUE),
  ((SELECT id FROM users WHERE email = 'dr.patel@campusopd.local'), 'Dermatology',      'Room 102', TRUE),
  ((SELECT id FROM users WHERE email = 'dr.verma@campusopd.local'), 'Orthopedics',      'Room 103', TRUE);

-- 4. Students
INSERT INTO users (name, email, password_hash, role, student_id)
VALUES
  ('Rahul Verma', 'student@campusopd.local', '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'STUDENT', 'STU-2024-001'),
  ('Aman Gupta',  'aman@campusopd.local',    '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'STUDENT', 'STU-2024-002'),
  ('Riya Sen',    'riya@campusopd.local',    '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'STUDENT', 'STU-2024-003'),
  ('Kavita Rao',  'kavita@campusopd.local',  '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'STUDENT', 'STU-2024-004'),
  ('Dev Sharma',  'dev@campusopd.local',     '$2a$10$heNcd3kwXPMOxRvRPB2Wp.kikDARBRnrYifHb9m59ApIjR1TcmQ0W', 'STUDENT', 'STU-2024-005');

-- 5. Schedules (today + tomorrow where applicable)
INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, slot_duration, max_patients)
VALUES
  ((SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'doctor@campusopd.local')),   CURRENT_DATE,              '09:00', '13:00', 15, 20),
  ((SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'doctor@campusopd.local')),   CURRENT_DATE + INTERVAL '1 day', '09:00', '13:00', 15, 20),
  ((SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'dr.patel@campusopd.local')), CURRENT_DATE,              '10:00', '14:00', 20, 15),
  ((SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'dr.patel@campusopd.local')), CURRENT_DATE + INTERVAL '1 day', '10:00', '14:00', 20, 15),
  ((SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'dr.verma@campusopd.local')), CURRENT_DATE,              '14:00', '17:00', 15, 12);

-- 6. Sample appointments for today's queue (Dr. Sharma = doctor 1, Dr. Patel = doctor 2)
INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
VALUES
  ((SELECT id FROM users WHERE email = 'aman@campusopd.local'),
   (SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'doctor@campusopd.local')),
   CURRENT_DATE, '09:00 AM', 'A-1', 'COMPLETED', 'Mild fever and headache for 2 days', 'No allergies'),

  ((SELECT id FROM users WHERE email = 'riya@campusopd.local'),
   (SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'doctor@campusopd.local')),
   CURRENT_DATE, '09:15 AM', 'A-2', 'IN_PROGRESS', 'Throat pain and dry cough', 'Seasonal dust allergy'),

  ((SELECT id FROM users WHERE email = 'kavita@campusopd.local'),
   (SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'doctor@campusopd.local')),
   CURRENT_DATE, '09:30 AM', 'A-3', 'WAITING', 'Severe stomach cramps and nausea', 'Gastritis'),

  ((SELECT id FROM users WHERE email = 'dev@campusopd.local'),
   (SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'doctor@campusopd.local')),
   CURRENT_DATE, '09:45 AM', 'A-4', 'WAITING', 'Persistent sneezing, runny nose, and chills', 'Childhood asthma'),

  ((SELECT id FROM users WHERE email = 'student@campusopd.local'),
   (SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'doctor@campusopd.local')),
   CURRENT_DATE, '10:00 AM', 'A-5', 'WAITING', 'Twisted right ankle during basketball practice yesterday afternoon', 'No previous surgical history'),

  ((SELECT id FROM users WHERE email = 'aman@campusopd.local'),
   (SELECT id FROM doctors WHERE user_id = (SELECT id FROM users WHERE email = 'dr.patel@campusopd.local')),
   CURRENT_DATE, '10:00 AM', 'B-1', 'WAITING', 'Skin rash and itching on forearm', 'Contact dermatitis');
