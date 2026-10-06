import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Activity, 
  ToggleLeft, 
  ToggleRight,
  RefreshCw,
  FastForward
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'doctors', 'schedules'
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected doctor for queue monitoring
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [advancingQueue, setAdvancingQueue] = useState(false);

  // Forms
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    specialization: '',
    roomNumber: '',
    available: true
  });

  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [scheduleForm, setScheduleForm] = useState({
    doctorId: '',
    date: today,
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 15,
    maxPatients: 20
  });

  const fetchData = async () => {
    try {
      const [ovRes, docRes, schRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/doctors'),
        api.get('/admin/schedules')
      ]);
      setOverview(ovRes.data);
      setDoctors(docRes.data);
      setSchedules(schRes.data);

      if (!selectedDoctorId && docRes.data.length > 0) {
        setSelectedDoctorId(docRes.data[0].id.toString());
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async (docId) => {
    if (!docId) return;
    try {
      const res = await api.get(`/queue/${docId}`);
      setQueueData(res.data);
    } catch (err) {
      console.error('Queue fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchQueue(selectedDoctorId);
      const socket = getSocket();
      const handleQueueUpdate = (data) => {
        if (selectedDoctorId && data.doctor?.id?.toString() === selectedDoctorId.toString()) {
          setQueueData(data);
        }
      };
      socket.on('queue_update', handleQueueUpdate);
      socket.on('global_queue_update', handleQueueUpdate);

      const interval = setInterval(() => fetchQueue(selectedDoctorId), 4000);

      return () => {
        socket.off('queue_update', handleQueueUpdate);
        socket.off('global_queue_update', handleQueueUpdate);
        clearInterval(interval);
      };
    }
  }, [selectedDoctorId]);

  const handleAdvanceQueue = async () => {
    if (!selectedDoctorId) return;
    setAdvancingQueue(true);
    try {
      const res = await api.post(`/admin/queue/${selectedDoctorId}/next`, { date: today });
      setSuccess(res.data.message || 'Queue advanced successfully');
      setQueueData(res.data.queue);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to advance queue');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAdvancingQueue(false);
    }
  };

  const handleToggleDoctorAvailable = async (doc) => {
    try {
      await api.patch(`/admin/doctors/${doc.id}`, { available: !doc.available });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update doctor');
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/doctors', doctorForm);
      setShowAddDoctorModal(false);
      setDoctorForm({
        name: '',
        email: '',
        password: 'password123',
        specialization: '',
        roomNumber: '',
        available: true
      });
      setSuccess('Doctor added successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create doctor');
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/schedules', scheduleForm);
      setShowAddScheduleModal(false);
      setSuccess('Schedule created successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await api.delete(`/admin/schedules/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete schedule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Campus OPD Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage doctors, consultation schedules, and monitor live OPD tokens
          </p>
        </div>

        {/* Top Overview Cards */}
        {overview && (
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs text-slate-500 font-medium">Students</div>
              <div className="text-lg font-bold text-slate-800">{overview.studentsCount}</div>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs text-slate-500 font-medium">Doctors</div>
              <div className="text-lg font-bold text-teal-600">{overview.doctorsCount}</div>
            </div>
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs text-slate-500 font-medium">Today's Visits</div>
              <div className="text-lg font-bold text-slate-800">{overview.today?.total || 0}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Queue Monitor
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'doctors'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Manage Doctors
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'schedules'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Manage Schedules
        </button>
      </div>

      {/* TAB 1: LIVE QUEUE MONITOR */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Select Doctor Queue:</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialization} - {d.room_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAdvanceQueue}
                disabled={advancingQueue || !queueData?.waitingQueue?.length}
                className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <FastForward className="w-4 h-4" />
                <span>Call Next Patient</span>
              </button>
              <button
                onClick={() => fetchQueue(selectedDoctorId)}
                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {queueData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Serving Card */}
              <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-2xl p-6 shadow-md">
                <div className="text-xs uppercase font-bold tracking-wider text-teal-300 mb-1">
                  Currently Serving
                </div>
                <div className="text-5xl font-mono font-extrabold tracking-tight mt-2">
                  {queueData.currentlyServing?.tokenNumber || 'None'}
                </div>
                <div className="mt-3 text-teal-100 text-sm">
                  {queueData.currentlyServing ? (
                    <div>
                      <div className="font-semibold text-white">{queueData.currentlyServing.studentName}</div>
                      <div className="text-xs text-teal-200">Slot: {queueData.currentlyServing.slot}</div>
                    </div>
                  ) : (
                    'Consultation room is currently clear'
                  )}
                </div>
              </div>

              {/* Waiting Stats */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Waiting in Lobby
                  </div>
                  <div className="text-4xl font-extrabold text-amber-500 mt-2 font-mono">
                    {queueData.waitingCount}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                  {queueData.completedCount} consultations completed today
                </div>
              </div>

              {/* Doctor Details */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    Room & Doctor
                  </div>
                  <div className="text-xl font-bold text-slate-800 mt-2">
                    {queueData.doctor?.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {queueData.doctor?.specialization} • {queueData.doctor?.roomNumber}
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                    queueData.doctor?.available
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {queueData.doctor?.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Queue List Table */}
          {queueData?.appointments && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">Sequential OPD Queue Monitor</h3>
              </div>
              <div className="divide-y divide-slate-100 text-sm">
                {queueData.appointments.map((a) => (
                  <div key={a.id} className="py-3.5 px-6 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-base px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-900">
                        {a.token_number}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800">{a.student_name}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          Slot: {a.slot} • {a.student_roll_no || 'Student'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Registered Campus Doctors</h2>
            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Doctor
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Specialization</th>
                  <th className="py-3.5 px-6">Room</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-semibold text-slate-900">{doc.name}</td>
                    <td className="py-4 px-6 text-slate-700">{doc.specialization}</td>
                    <td className="py-4 px-6 font-mono text-slate-700">{doc.room_number}</td>
                    <td className="py-4 px-6 text-slate-500">{doc.email}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        doc.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.available ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleDoctorAvailable(doc)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          doc.available
                            ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {doc.available ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE SCHEDULES */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Doctor OPD Duty Schedules</h2>
            <button
              onClick={() => {
                if (doctors.length > 0) {
                  setScheduleForm((prev) => ({ ...prev, doctorId: doctors[0].id.toString() }));
                }
                setShowAddScheduleModal(true);
              }}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Schedule
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3.5 px-6">Doctor</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Duty Hours</th>
                  <th className="py-3.5 px-6">Slot Duration</th>
                  <th className="py-3.5 px-6">Max Patients</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {sch.doctor_name}
                      <div className="text-xs text-slate-400 font-normal">{sch.specialization}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">{sch.date}</td>
                    <td className="py-4 px-6 font-mono text-slate-700">
                      {sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}
                    </td>
                    <td className="py-4 px-6 text-slate-700">{sch.slot_duration} mins</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{sch.max_patients}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteSchedule(sch.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add New Doctor</h3>
              <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Anjali Nair"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="dr.nair@campusopd.local"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    placeholder="ENT / Ophthalmology"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Room 104"
                    value={doctorForm.roomNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">Add Doctor Schedule</h3>
              <button onClick={() => setShowAddScheduleModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAddSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor</label>
                <select
                  required
                  value={scheduleForm.doctorId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Duration (mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    required
                    value={scheduleForm.slotDuration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, slotDuration: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Patients</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={scheduleForm.maxPatients}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, maxPatients: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
