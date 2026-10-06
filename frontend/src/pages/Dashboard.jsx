import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import DoctorDashboard from './DoctorDashboard';
import AdminDashboard from './AdminDashboard';
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  Users, 
  ArrowRight, 
  PlusCircle, 
  Activity, 
  AlertCircle,
  FileText,
  XCircle,
  CheckCircle,
  User
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is DOCTOR or ADMIN, render their respective dashboards
  if (user?.role === 'DOCTOR') {
    return <DoctorDashboard />;
  }
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Otherwise STUDENT Dashboard
  const [upcoming, setUpcoming] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchStudentData = async () => {
    try {
      const [upRes, myRes] = await Promise.all([
        api.get('/appointments/upcoming'),
        api.get('/appointments/my')
      ]);
      setUpcoming(upRes.data.upcoming || null);
      setAppointments(myRes.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch appointment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchStudentData();
    };

    socket.on('queue_update', handleUpdate);
    socket.on('global_queue_update', handleUpdate);

    // Reliable 4-second polling fallback
    const interval = setInterval(fetchStudentData, 4000);

    return () => {
      socket.off('queue_update', handleUpdate);
      socket.off('global_queue_update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await api.patch(`/appointments/${id}/cancel`);
      await fetchStudentData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-teal-700 to-teal-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-teal-300">
            Student Health Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Welcome, {user.name}
          </h1>
          <p className="text-teal-100 text-sm mt-1">
            Roll No: <span className="font-mono font-medium">{user.student_id || 'STU-REGISTERED'}</span> • Campus Health Centre
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/BookAppointment"
            className="py-3 px-5 bg-white text-teal-800 hover:bg-teal-50 font-bold rounded-2xl shadow-md text-sm transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Book Appointment</span>
          </Link>
          <Link
            to="/Queue"
            className="py-3 px-5 bg-teal-800/80 hover:bg-teal-800 border border-teal-600 text-white font-bold rounded-2xl text-sm transition-colors flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-teal-300" />
            <span>Track Queue</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Highlight: UPCOMING APPOINTMENT & QUEUE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Upcoming Appointment
            </h2>
            {upcoming && (
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                Active Booking
              </span>
            )}
          </div>

          {upcoming ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full pointer-events-none -z-0"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {upcoming.doctor_name}
                    </h3>
                    <div className="text-sm font-semibold text-teal-700 mt-0.5">
                      {upcoming.specialization} • {upcoming.room_number}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{upcoming.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{upcoming.slot}</span>
                    </div>
                    <div>
                      <StatusBadge status={upcoming.status} />
                    </div>
                  </div>

                  {upcoming.symptoms && (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                      <span className="font-semibold text-slate-800">Reported Symptoms: </span>
                      {upcoming.symptoms}
                    </div>
                  )}
                </div>

                {/* Prominent Token & Queue Position Display */}
                <div className="bg-gradient-to-b from-teal-50 to-teal-100/70 p-6 rounded-2xl border border-teal-200 text-center flex flex-col items-center justify-center min-w-[200px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                    Your Token
                  </span>
                  <div className="text-4xl font-extrabold text-teal-950 font-mono my-1 tracking-tight">
                    {upcoming.token_number}
                  </div>
                  <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5 mt-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {upcoming.status === 'IN_PROGRESS'
                        ? 'You are being served!'
                        : `${upcoming.peopleAhead ?? 0} people ahead`}
                    </span>
                  </div>

                  <div className="mt-4 w-full flex flex-col gap-2">
                    <Link
                      to={`/Queue?doctorId=${upcoming.doctor_id}&appointmentId=${upcoming.id}`}
                      className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Track Queue</span>
                    </Link>
                    <button
                      onClick={() => handleCancelAppointment(upcoming.id)}
                      disabled={cancellingId === upcoming.id}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold py-1 transition-colors"
                    >
                      {cancellingId === upcoming.id ? 'Cancelling...' : 'Cancel Appointment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No Upcoming Appointments</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You do not have any active appointments scheduled. Select an available doctor to book a consultation slot.
                </p>
              </div>
              <Link
                to="/BookAppointment"
                className="inline-flex items-center gap-2 py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Book Appointment Now</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick OPD Information & Guidelines */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Health Centre Info</h2>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">OPD Timings</div>
                <div className="text-xs text-slate-500">Mon - Sat: 09:00 AM - 05:00 PM</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Digital Token Queue</div>
                <div className="text-xs text-slate-500">
                  Track your turn live from your hostel or library. Arrive when 1-2 people are ahead.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to="/Doctors"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <span>View Campus Doctors Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          My Consultation History
        </h2>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {appointments.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No appointments on record yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="py-3.5 px-6">Token</th>
                    <th className="py-3.5 px-6">Doctor</th>
                    <th className="py-3.5 px-6">Date & Slot</th>
                    <th className="py-3.5 px-6">Symptoms</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {a.token_number}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800">{a.doctor_name}</div>
                        <div className="text-xs text-slate-400">{a.specialization} • {a.room_number}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-700">{a.date}</div>
                        <div className="text-xs text-slate-500">{a.slot}</div>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-slate-600">
                        {a.symptoms}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        {(a.status === 'WAITING' || a.status === 'BOOKED') ? (
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/Queue?doctorId=${a.doctor_id}&appointmentId=${a.id}`}
                              className="text-xs font-semibold px-2.5 py-1 text-teal-700 hover:bg-teal-50 rounded-lg border border-teal-200 transition-colors"
                            >
                              Track
                            </Link>
                            <button
                              onClick={() => handleCancelAppointment(a.id)}
                              disabled={cancellingId === a.id}
                              className="text-xs font-semibold px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
