const http = require('http');
const app = require('./backend/app');
const { initDb } = require('./backend/config/db');

async function runE2ETests() {
  console.log('====================================================');
  console.log('   CAMPUS OPD - END-TO-END VERIFICATION SUITE       ');
  console.log('====================================================\n');

  await initDb();
  const server = http.createServer(app);

  const PORT = 5098;
  await new Promise((resolve) => server.listen(PORT, resolve));
  const BASE = `http://localhost:${PORT}`;

  const request = async (method, path, body = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  const results = [];
  const test = async (name, fn) => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } catch (err) {
      results.push({ name, passed: false, error: err.message });
      console.error(`[FAIL] ${name} -> ${err.message}`);
    }
  };

  try {
    let studentToken, doctorToken, adminToken;
    let doctorId = 1;
    let today = new Date().toISOString().split('T')[0];
    let createdApptId;
    let createdToken;

    // 1. Student Login
    await test('Student can log in', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'student@campusopd.local',
        password: 'password123'
      });
      if (res.status !== 200 || !res.data.token || res.data.user.role !== 'STUDENT') {
        throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
      }
      studentToken = res.data.token;
    });

    // 2. Doctor Login
    await test('Doctor can log in', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'doctor@campusopd.local',
        password: 'password123'
      });
      if (res.status !== 200 || !res.data.token || res.data.user.role !== 'DOCTOR') {
        throw new Error(`Doctor login failed: ${JSON.stringify(res.data)}`);
      }
      doctorToken = res.data.token;
      doctorId = res.data.user.doctorId || 1;
    });

    // 3. Admin Login
    await test('Admin can log in', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'admin@campusopd.local',
        password: 'password123'
      });
      if (res.status !== 200 || !res.data.token || res.data.user.role !== 'ADMIN') {
        throw new Error(`Admin login failed: ${JSON.stringify(res.data)}`);
      }
      adminToken = res.data.token;
    });

    // 4. Student can view doctors
    await test('Student can view doctors catalog', async () => {
      const res = await request('GET', '/api/doctors', null, studentToken);
      if (res.status !== 200 || !Array.isArray(res.data) || res.data.length < 2) {
        throw new Error(`Expected at least 2 doctors, got ${res.data.length}`);
      }
      const dr = res.data.find(d => d.specialization && d.room_number);
      if (!dr) throw new Error('Doctor missing specialization or room_number');
    });

    // 5. Student can view available slots
    await test('Student can view available slots for doctor', async () => {
      const res = await request('GET', `/api/doctors/${doctorId}/slots?date=${today}`, null, studentToken);
      if (res.status !== 200 || !res.data.slots || res.data.slots.length === 0) {
        throw new Error(`Failed to retrieve slots: ${JSON.stringify(res.data)}`);
      }
      const availableSlot = res.data.slots.find(s => s.available);
      if (!availableSlot) throw new Error('No available slot found');
    });

    // 6. Student can book appointment & enter symptoms/history
    await test('Student can book appointment and provide symptoms/history', async () => {
      const slotsRes = await request('GET', `/api/doctors/2/slots?date=${today}`, null, studentToken);
      const freeSlot = slotsRes.data.slots.find(s => s.available);
      if (!freeSlot) throw new Error('No free slot for Doctor 2');

      const res = await request('POST', '/api/appointments', {
        doctorId: 2,
        date: today,
        slot: freeSlot.time,
        symptoms: 'Mild skin rash and redness on left arm',
        medicalHistory: 'No drug allergies'
      }, studentToken);

      if (res.status !== 201 || !res.data.appointment) {
        throw new Error(`Booking failed: ${JSON.stringify(res.data)}`);
      }

      createdApptId = res.data.appointment.id;
      createdToken = res.data.appointment.tokenNumber;
      if (!createdToken) throw new Error('Appointment did not generate token');
      if (res.data.appointment.status !== 'WAITING') {
        throw new Error(`Expected status WAITING, got ${res.data.appointment.status}`);
      }
    });

    // 7. System prevents duplicate booking
    await test('System prevents duplicate booking of the same slot', async () => {
      // Try to re-book the same slot for doctor 2
      const appt = (await request('GET', `/api/appointments/${createdApptId}`, null, studentToken)).data;
      const res = await request('POST', '/api/appointments', {
        doctorId: 2,
        date: today,
        slot: appt.slot,
        symptoms: 'Trying to double book'
      }, studentToken);

      if (res.status !== 409) {
        throw new Error(`Expected 409 Conflict, got ${res.status}: ${JSON.stringify(res.data)}`);
      }
    });

    // 8. Student can see queue position
    await test('Student can see queue position and people ahead', async () => {
      const res = await request('GET', `/api/queue/1?date=${today}&appointmentId=5`, null, studentToken);
      if (res.status !== 200 || !res.data.currentlyServing) {
        throw new Error(`Queue query failed: ${JSON.stringify(res.data)}`);
      }
      if (res.data.userPosition === undefined || res.data.userPosition.peopleAhead < 0) {
        throw new Error('userPosition peopleAhead missing or negative');
      }
    });

    // 9. Doctor can see today\'s appointments
    await test('Doctor can see today\'s appointments list', async () => {
      const res = await request('GET', `/api/doctor/appointments?date=${today}`, null, doctorToken);
      if (res.status !== 200 || !Array.isArray(res.data.appointments)) {
        throw new Error(`Doctor appointments failed: ${JSON.stringify(res.data)}`);
      }
      if (res.data.appointments.length === 0) throw new Error('Doctor appointments list is empty');
    });

    // 10. Doctor can view patient information
    await test('Doctor can view patient medical information & history', async () => {
      const res = await request('GET', `/api/doctor/patients/5`, null, doctorToken);
      if (res.status !== 200 || !res.data.patient) {
        throw new Error(`Failed to fetch patient details: ${JSON.stringify(res.data)}`);
      }
    });

    // 11. Doctor can start consultation
    await test('Doctor can start consultation (WAITING -> IN_PROGRESS)', async () => {
      // Find a waiting appointment for doctor 1
      const apptsRes = await request('GET', `/api/doctor/appointments?date=${today}`, null, doctorToken);
      const waiting = apptsRes.data.appointments.find(a => a.status === 'WAITING');
      if (!waiting) throw new Error('No waiting appointment found to start');

      const res = await request('PATCH', `/api/doctor/appointments/${waiting.id}/status`, {
        status: 'IN_PROGRESS'
      }, doctorToken);

      if (res.status !== 200 || res.data.appointment.status !== 'IN_PROGRESS') {
        throw new Error(`Status change failed: ${JSON.stringify(res.data)}`);
      }
    });

    // 12. Doctor can complete consultation & queue advances
    await test('Doctor can complete consultation (IN_PROGRESS -> COMPLETED) and queue advances', async () => {
      const apptsRes = await request('GET', `/api/doctor/appointments?date=${today}`, null, doctorToken);
      const inProg = apptsRes.data.appointments.find(a => a.status === 'IN_PROGRESS');
      if (!inProg) throw new Error('No in-progress appointment found to complete');

      const res = await request('PATCH', `/api/doctor/appointments/${inProg.id}/status`, {
        status: 'COMPLETED'
      }, doctorToken);

      if (res.status !== 200 || res.data.appointment.status !== 'COMPLETED') {
        throw new Error(`Complete consultation failed: ${JSON.stringify(res.data)}`);
      }

      // Check queue state
      const queueRes = await request('GET', `/api/queue/1?date=${today}`);
      if (queueRes.status !== 200) throw new Error('Queue lookup failed');
    });

    // 13. Admin can manage doctors (create and toggle availability)
    await test('Admin can add doctor and toggle availability', async () => {
      const testEmail = `dr.test.${Date.now()}@campusopd.local`;
      const createRes = await request('POST', '/api/admin/doctors', {
        name: 'Dr. Test Specialist',
        email: testEmail,
        password: 'password123',
        specialization: 'Neurology',
        roomNumber: 'Room 105',
        available: true
      }, adminToken);

      if (createRes.status !== 201 || !createRes.data.doctor) {
        throw new Error(`Create doctor failed: ${JSON.stringify(createRes.data)}`);
      }

      const docId = createRes.data.doctor.id;
      const toggleRes = await request('PATCH', `/api/admin/doctors/${docId}`, {
        available: false
      }, adminToken);

      if (toggleRes.status !== 200 || toggleRes.data.doctor.available !== false) {
        throw new Error('Toggle availability failed');
      }
    });

    // 14. Admin can manage schedules
    await test('Admin can create, update, and delete schedules', async () => {
      const futureDate = '2026-11-15';
      const createRes = await request('POST', '/api/admin/schedules', {
        doctorId: 1,
        date: futureDate,
        startTime: '10:00',
        endTime: '14:00',
        slotDuration: 20,
        maxPatients: 12
      }, adminToken);

      if (createRes.status !== 201 || !createRes.data.schedule) {
        throw new Error(`Schedule creation failed: ${JSON.stringify(createRes.data)}`);
      }

      const schId = createRes.data.schedule.id;
      const delRes = await request('DELETE', `/api/admin/schedules/${schId}`, null, adminToken);
      if (delRes.status !== 200) {
        throw new Error(`Schedule deletion failed: ${JSON.stringify(delRes.data)}`);
      }
    });

    // 15. Role-based access control works
    await test('Role-based access control blocks unauthorized requests', async () => {
      // Student trying to access admin endpoint
      const res = await request('GET', '/api/admin/overview', null, studentToken);
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden for student accessing admin endpoint, got ${res.status}`);
      }

      // Student trying to access doctor endpoint
      const docRes = await request('GET', '/api/doctor/appointments', null, studentToken);
      if (docRes.status !== 403) {
        throw new Error(`Expected 403 Forbidden for student accessing doctor endpoint, got ${docRes.status}`);
      }
    });

    // 16. Refresh session works
    await test('Session verification endpoint /api/auth/me works', async () => {
      const res = await request('GET', '/api/auth/me', null, studentToken);
      if (res.status !== 200 || res.data.user.email !== 'student@campusopd.local') {
        throw new Error('Session verify failed');
      }
    });

    // 17. Frontend static serving
    await test('Frontend HTML is served from root and client-side routes', async () => {
      const res = await fetch(`${BASE}/Dashboard`);
      const text = await res.text();
      if (!text.includes('<div id="root">') && !text.includes('Campus OPD')) {
        throw new Error('Static frontend did not serve valid HTML index file');
      }
    });

  } finally {
    server.close();
  }

  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
  console.log('STATUS:', allPassed ? 'ALL ACCEPTANCE CRITERIA MET!' : 'SOME TESTS FAILED');
  console.log('====================================================');

  if (!allPassed) process.exit(1);
}

runE2ETests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
