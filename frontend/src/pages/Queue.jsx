import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import { 
  Activity, 
  Users, 
  Clock, 
  Stethoscope, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  DoorOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Queue() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctorId') || '');
  const [userAppointmentId, setUserAppointmentId] = useState(searchParams.get('appointmentId') || '');

  const [queueData, setQueueData] = useState(null);
  const [userAppointment, setUserAppointment] = useState(null);
  const [peopleAhead, setPeopleAhead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const today = new Date().toISOString().split('T')[0];

  // 1. Initial Load: Fetch doctors and upcoming student appointment if not specified
  useEffect(() => {
    async function init() {
      try {
        const [docsRes, upRes] = await Promise.all([
          api.get('/doctors'),
          user?.role === 'STUDENT' ? api.get('/appointments/upcoming') : Promise.resolve({ data: { upcoming: null } })
        ]);

        setDoctors(docsRes.data);

        let docId = selectedDoctorId;
        let apptId = userAppointmentId;

        if (upRes.data.upcoming) {
          if (!apptId) {
            apptId = upRes.data.upcoming.id.toString();
            setUserAppointmentId(apptId);
          }
          if (!docId) {
            docId = upRes.data.upcoming.doctor_id.toString();
            setSelectedDoctorId(docId);
          }
        } else if (!docId && docsRes.data.length > 0) {
          docId = docsRes.data[0].id.toString();
          setSelectedDoctorId(docId);
        }
      } catch (err) {
        setError('Failed to initialize queue data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  // 2. Fetch live queue for selected doctor & appointment
  const fetchQueue = async () => {
    if (!selectedDoctorId) return;
    try {
      const qRes = await api.get(
        `/queue/${selectedDoctorId}?date=${today}${userAppointmentId ? `&appointmentId=${userAppointmentId}` : ''}`
      );
      setQueueData(qRes.data);

      if (userAppointmentId) {
        try {
          const apptRes = await api.get(`/appointments/${userAppointmentId}`);
          setUserAppointment(apptRes.data);
          setPeopleAhead(apptRes.data.peopleAhead);
        } catch (e) {
          // If appointment lookup fails or student doesn't own it
        }
      }
      setLastRefreshed(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch queue');
    }
  };

  useEffect(() => {
    if (selectedDoctorId) {
      fetchQueue();

      // Socket.IO real-time listener
      const socket = getSocket();
      const handleQueueUpdate = (data) => {
        if (data.doctor?.id?.toString() === selectedDoctorId.toString()) {
          setQueueData(data);
          if (userAppointmentId) {
            // Refresh patient's own peopleAhead
            api.get(`/appointments/${userAppointmentId}`)
              .then((res) => {
                setUserAppointment(res.data);
                setPeopleAhead(res.data.peopleAhead);
              })
              .catch(() => {});
          }
          setLastRefreshed(new Date());
        }
      };

      socket.on('queue_update', handleQueueUpdate);
      socket.on('global_queue_update', handleQueueUpdate);

      // Reliable 3-second polling interval fallback
      const interval = setInterval(fetchQueue, 3000);

      return () => {
        socket.off('queue_update', handleQueueUpdate);
        socket.off('global_queue_update', handleQueueUpdate);
        clearInterval(interval);
      };
    }
  }, [selectedDoctorId, userAppointmentId]);

  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    setSearchParams({ doctorId: docId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Connecting to OPD queue...</p>
        </div>
      </div>
    );
  }

  const currentlyServing = queueData?.currentlyServing;
  const waitingQueue = queueData?.waitingQueue || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Doctor Selector */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-700">
              Live Digital OPD Queue
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Campus OPD Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synchronous queue powered by health centre consultations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.room_number})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchQueue}
            className="p-2.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 rounded-xl transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary 4 Queue Metric Display Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Currently Serving */}
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div className="text-xs uppercase font-bold tracking-wider text-teal-300">
            Currently Serving
          </div>
          <div className="my-4">
            <div className="text-5xl font-extrabold font-mono tracking-tight">
              {currentlyServing ? currentlyServing.tokenNumber : 'None'}
            </div>
            <div className="text-xs text-teal-200 mt-1 font-medium truncate">
              {currentlyServing ? currentlyServing.studentName : 'Room clear'}
            </div>
          </div>
          <div className="text-[11px] text-teal-300 flex items-center gap-1.5 border-t border-teal-800/80 pt-2">
            <DoorOpen className="w-3.5 h-3.5" />
            <span>{queueData?.doctor?.roomNumber || 'Room 101'}</span>
          </div>
        </div>

        {/* Card 2: Your Token */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Your Token
          </div>
          <div className="my-4">
            <div className="text-5xl font-extrabold font-mono text-slate-900 tracking-tight">
              {userAppointment ? userAppointment.token_number : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {userAppointment ? userAppointment.slot : 'No token active'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
            {user?.student_id || user?.email || 'Guest'}
          </div>
        </div>

        {/* Card 3: People Ahead */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
            People Ahead
          </div>
          <div className="my-4">
            <div className="text-5xl font-extrabold font-mono text-amber-500 tracking-tight">
              {userAppointment
                ? userAppointment.status === 'IN_PROGRESS'
                  ? '0'
                  : peopleAhead !== null
                  ? peopleAhead
                  : queueData?.waitingCount || 0
                : queueData?.waitingCount || 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {userAppointment?.status === 'IN_PROGRESS'
                ? 'Your consultation is in progress!'
                : userAppointment
                ? 'Waiting ahead in line'
                : 'Total in queue lobby'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Deterministic order</span>
          </div>
        </div>

        {/* Card 4: Status */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Status
          </div>
          <div className="my-4">
            <div className="mb-2">
              <StatusBadge status={userAppointment?.status || 'WAITING'} />
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {userAppointment?.status === 'IN_PROGRESS'
                ? 'Please proceed to the doctor’s desk'
                : userAppointment?.status === 'COMPLETED'
                ? 'Consultation finished'
                : 'Please wait for your token to be called'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
            Auto-syncs live
          </div>
        </div>
      </div>

      {/* Patient Queue Lobby List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Live Token Order for {queueData?.doctor?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Appointments scheduled for {queueData?.doctor?.specialization} ({queueData?.doctor?.roomNumber})
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            {waitingQueue.length} Waiting
          </span>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No patients currently waiting in this queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {waitingQueue.map((item, idx) => {
              const isUserItem = userAppointment && userAppointment.token_number === item.tokenNumber;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isUserItem
                      ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-500 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-mono font-bold text-base text-slate-900">
                        {item.tokenNumber}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Slot: {item.slot}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isUserItem ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-200/80 px-2.5 py-1 rounded-full">
                        You
                      </span>
                    ) : (
                      <StatusBadge status={item.status} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
