import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import { 
  Stethoscope, 
  User, 
  Clock, 
  FileText, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ChevronRight,
  Activity,
  History,
  RefreshCw
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const fetchDoctorAppointments = async () => {
    try {
      const res = await api.get(`/doctor/appointments?date=${selectedDate}`);
      setAppointments(res.data.appointments || []);
      setDoctorProfile(res.data.doctor || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load doctor appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchDoctorAppointments();
    };

    socket.on('queue_update', handleUpdate);
    socket.on('global_queue_update', handleUpdate);

    // Auto-refresh interval fallback
    const interval = setInterval(fetchDoctorAppointments, 5000);

    return () => {
      socket.off('queue_update', handleUpdate);
      socket.off('global_queue_update', handleUpdate);
      clearInterval(interval);
    };
  }, [selectedDate]);

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setActionLoadingId(appointmentId);
    try {
      await api.patch(`/doctor/appointments/${appointmentId}/status`, { status: newStatus });
      await fetchDoctorAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update consultation status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewPatient = async (appointment) => {
    setSelectedPatient(appointment);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/doctor/patients/${appointment.student_id}`);
      setPatientHistory(res.data.history || []);
    } catch (err) {
      console.error('Error fetching patient history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const inProgressAppt = appointments.find((a) => a.status === 'IN_PROGRESS');
  const waitingAppts = appointments.filter((a) => a.status === 'WAITING' || a.status === 'BOOKED');
  const completedAppts = appointments.filter((a) => a.status === 'COMPLETED');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Stethoscope className="w-4 h-4" /> Doctor Consultation Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {user.name}
            </h1>
            <p className="text-teal-100 text-sm mt-1">
              {doctorProfile?.specialization || user.specialization || 'General Medicine'} • {doctorProfile?.room_number || user.doctorRoom || 'Room 101'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-teal-900/80 border border-teal-700/60 rounded-xl px-4 py-2 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-300" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={fetchDoctorAppointments}
              className="p-2.5 bg-teal-700/60 hover:bg-teal-700 text-teal-200 rounded-xl transition-colors border border-teal-600/60"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-teal-800/80">
          <div className="bg-teal-900/40 rounded-xl p-3 border border-teal-700/40">
            <div className="text-xs text-teal-200 font-medium">Currently Serving</div>
            <div className="text-xl font-bold mt-1 text-white flex items-center gap-2">
              {inProgressAppt ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {inProgressAppt.token_number}
                </>
              ) : (
                <span className="text-teal-400 text-sm font-normal">None active</span>
              )}
            </div>
          </div>
          <div className="bg-teal-900/40 rounded-xl p-3 border border-teal-700/40">
            <div className="text-xs text-teal-200 font-medium">Waiting in Queue</div>
            <div className="text-xl font-bold mt-1 text-amber-300">{waitingAppts.length}</div>
          </div>
          <div className="bg-teal-900/40 rounded-xl p-3 border border-teal-700/40">
            <div className="text-xs text-teal-200 font-medium">Completed Today</div>
            <div className="text-xl font-bold mt-1 text-teal-200">{completedAppts.length}</div>
          </div>
          <div className="bg-teal-900/40 rounded-xl p-3 border border-teal-700/40">
            <div className="text-xs text-teal-200 font-medium">Total Bookings</div>
            <div className="text-xl font-bold mt-1 text-white">{appointments.length}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Currently In-Progress Consultation Highlight */}
      {inProgressAppt && (
        <div className="mb-8 bg-emerald-50/70 border-2 border-emerald-500 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                  Active Consultation In Progress
                </span>
                <span className="text-sm font-mono text-emerald-800 font-semibold">
                  Slot: {inProgressAppt.slot}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-emerald-950 font-mono">
                  {inProgressAppt.token_number}
                </span>
                <span className="text-xl font-bold text-slate-800">
                  {inProgressAppt.student_name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-mono">
                  {inProgressAppt.student_roll_no || 'Student'}
                </span>
              </div>
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-200 text-sm text-slate-700 mt-2">
                <div className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-0.5">
                  Reported Symptoms:
                </div>
                {inProgressAppt.symptoms}
                {inProgressAppt.medical_history && (
                  <div className="mt-1 pt-1 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Medical History:</span> {inProgressAppt.medical_history}
                  </div>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col gap-3 flex-shrink-0">
              <button
                onClick={() => handleUpdateStatus(inProgressAppt.id, 'COMPLETED')}
                disabled={actionLoadingId === inProgressAppt.id}
                className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Consultation</span>
              </button>
              <button
                onClick={() => handleViewPatient(inProgressAppt)}
                className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>View Full Medical History</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Queue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Today's Consultation Schedule
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {appointments.length} Appointments Total
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No appointments scheduled</h3>
            <p className="text-xs text-slate-400 mt-1">There are no appointments booked for this date yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Token</th>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-6">Slot Time</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Symptoms & History</th>
                  <th className="py-3.5 px-6 text-right">Consultation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      appt.status === 'IN_PROGRESS' ? 'bg-emerald-50/40' : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                        {appt.token_number}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{appt.student_name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {appt.student_roll_no || appt.student_email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {appt.slot}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="truncate text-slate-800" title={appt.symptoms}>
                        {appt.symptoms}
                      </div>
                      {appt.medical_history && (
                        <div className="text-xs text-slate-400 truncate" title={appt.medical_history}>
                          Hist: {appt.medical_history}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewPatient(appt)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg border border-slate-200 transition-colors"
                          title="Patient History"
                        >
                          Details
                        </button>

                        {(appt.status === 'WAITING' || appt.status === 'BOOKED') && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                            disabled={actionLoadingId === appt.id}
                            className="px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start</span>
                          </button>
                        )}

                        {appt.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                            disabled={actionLoadingId === appt.id}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Details & Medical History Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedPatient.student_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Roll No: {selectedPatient.student_roll_no || 'N/A'} • Token: {selectedPatient.token_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Consultation Details
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-700">Symptoms:</span>
                  <p className="text-sm text-slate-800 mt-0.5">{selectedPatient.symptoms}</p>
                </div>
                {selectedPatient.medical_history && (
                  <div>
                    <span className="text-xs font-semibold text-slate-700">Reported Medical History:</span>
                    <p className="text-sm text-slate-800 mt-0.5">{selectedPatient.medical_history}</p>
                  </div>
                )}
              </div>

              {/* Past Visits at Health Centre */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Patient Visit History
                </h4>
                {loadingHistory ? (
                  <div className="py-4 text-center text-xs text-slate-400">Loading history...</div>
                ) : patientHistory.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {patientHistory.map((h) => (
                      <div key={h.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                          <span>{h.date} • {h.doctor_name || 'Health Centre'}</span>
                          <StatusBadge status={h.status} />
                        </div>
                        <p className="text-slate-600 italic">"{h.symptoms}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">No prior consultations recorded for this student.</p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
