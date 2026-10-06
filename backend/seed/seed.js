const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('--- Starting Database Seed ---');
  await db.initDb();

  // Clear existing data cleanly
  await db.query('DELETE FROM appointments');
  await db.query('DELETE FROM doctor_schedules');
  await db.query('DELETE FROM doctors');
  await db.query('DELETE FROM users');

  const defaultPassword = 'password123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  console.log(`Hashing complete. Default demo password for all accounts: "${defaultPassword}"`);

  // 1. Create Admin
  const adminRes = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    ['Campus Health Admin', 'admin@campusopd.local', passwordHash, 'ADMIN']
  );
  const admin = adminRes.rows[0];
  console.log(`Created Admin: ${admin.email} (ID: ${admin.id})`);

  // 2. Create Doctors
  const doctorUsers = [
    {
      name: 'Dr. Sharma',
      email: 'doctor@campusopd.local',
      specialization: 'General Medicine',
      roomNumber: 'Room 101',
      available: true
    },
    {
      name: 'Dr. Priya Patel',
      email: 'dr.patel@campusopd.local',
      specialization: 'Dermatology',
      roomNumber: 'Room 102',
      available: true
    },
    {
      name: 'Dr. Rajesh Verma',
      email: 'dr.verma@campusopd.local',
      specialization: 'Orthopedics',
      roomNumber: 'Room 103',
      available: true
    }
  ];

  const doctors = [];
  for (const doc of doctorUsers) {
    const userRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email`,
      [doc.name, doc.email, passwordHash, 'DOCTOR']
    );
    const u = userRes.rows[0];

    const dRes = await db.query(
      `INSERT INTO doctors (user_id, specialization, room_number, available)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, specialization, room_number, available`,
      [u.id, doc.specialization, doc.roomNumber, doc.available]
    );
    doctors.push({ ...dRes.rows[0], name: u.name, email: u.email });
    console.log(`Created Doctor: ${doc.name} (${doc.email}) - Room: ${doc.roomNumber}`);
  }

  // 3. Create Students
  const studentUsers = [
    {
      name: 'Rahul Verma',
      email: 'student@campusopd.local',
      studentId: 'STU-2024-001'
    },
    {
      name: 'Aman Gupta',
      email: 'aman@campusopd.local',
      studentId: 'STU-2024-002'
    },
    {
      name: 'Riya Sen',
      email: 'riya@campusopd.local',
      studentId: 'STU-2024-003'
    },
    {
      name: 'Kavita Rao',
      email: 'kavita@campusopd.local',
      studentId: 'STU-2024-004'
    },
    {
      name: 'Dev Sharma',
      email: 'dev@campusopd.local',
      studentId: 'STU-2024-005'
    }
  ];

  const students = [];
  for (const stu of studentUsers) {
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, role, student_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, student_id`,
      [stu.name, stu.email, passwordHash, 'STUDENT', stu.studentId]
    );
    students.push(res.rows[0]);
    console.log(`Created Student: ${stu.name} (${stu.email}) - ID: ${stu.studentId}`);
  }

  // 4. Create Schedules
  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date(Date.now() + 86400000);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  // Dr. Sharma schedule
  await db.query(
    `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, slot_duration, max_patients)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [doctors[0].id, today, '09:00', '13:00', 15, 20]
  );
  await db.query(
    `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, slot_duration, max_patients)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [doctors[0].id, tomorrow, '09:00', '13:00', 15, 20]
  );

  // Dr. Patel schedule
  await db.query(
    `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, slot_duration, max_patients)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [doctors[1].id, today, '10:00', '14:00', 20, 15]
  );
  await db.query(
    `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, slot_duration, max_patients)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [doctors[1].id, tomorrow, '10:00', '14:00', 20, 15]
  );

  // Dr. Verma schedule
  await db.query(
    `INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, slot_duration, max_patients)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [doctors[2].id, today, '14:00', '17:00', 15, 12]
  );

  console.log(`Created schedules for today (${today}) and tomorrow (${tomorrow})`);

  // 5. Create Appointments for Today (Dr. Sharma)
  // Aman (STU-2024-002) - Token A-1, COMPLETED
  await db.query(
    `INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      students[1].id,
      doctors[0].id,
      today,
      '09:00 AM',
      'A-1',
      'COMPLETED',
      'Mild fever and headache for 2 days',
      'No allergies'
    ]
  );

  // Riya (STU-2024-003) - Token A-2, IN_PROGRESS
  await db.query(
    `INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      students[2].id,
      doctors[0].id,
      today,
      '09:15 AM',
      'A-2',
      'IN_PROGRESS',
      'Throat pain and dry cough',
      'Seasonal dust allergy'
    ]
  );

  // Kavita (STU-2024-004) - Token A-3, WAITING
  await db.query(
    `INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      students[3].id,
      doctors[0].id,
      today,
      '09:30 AM',
      'A-3',
      'WAITING',
      'Severe stomach cramps and nausea',
      'Gastritis'
    ]
  );

  // Dev (STU-2024-005) - Token A-4, WAITING
  await db.query(
    `INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      students[4].id,
      doctors[0].id,
      today,
      '09:45 AM',
      'A-4',
      'WAITING',
      'Persistent sneezing, runny nose, and chills',
      'Childhood asthma'
    ]
  );

  // Rahul (STU-2024-001) - Token A-5, WAITING (Our main demo student!)
  await db.query(
    `INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      students[0].id,
      doctors[0].id,
      today,
      '10:00 AM',
      'A-5',
      'WAITING',
      'Twisted right ankle during basketball practice yesterday afternoon',
      'No previous surgical history'
    ]
  );

  // Also one appointment for Dr. Patel
  await db.query(
    `INSERT INTO appointments (student_id, doctor_id, date, slot, token_number, status, symptoms, medical_history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      students[1].id,
      doctors[1].id,
      today,
      '10:00 AM',
      'B-1',
      'WAITING',
      'Skin rash and itching on forearm',
      'Contact dermatitis'
    ]
  );

  console.log('Created sample appointments and OPD queue.');
  console.log('--- Database Seed Completed Successfully ---');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = seed;
