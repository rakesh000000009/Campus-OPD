import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Activity, 
  User, 
  History,
  DoorOpen
} from 'lucide-react';

export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctorId') || '');
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const [slotsData, setSlotsData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');

  const [symptoms, setSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Load available doctors
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get('/doctors');
        setDoctors(res.data);
        if (!selectedDoctorId && res.data.length > 0) {
          const firstAvail = res.data.find((d) => d.available) || res.data[0];
          setSelectedDoctorId(firstAvail.id.toString());
        }
      } catch (err) {
        setBookingError('Failed to load doctors list');
      }
    }
    loadDoctors();
  }, []);

  // Fetch slots whenever doctor or date changes
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDoctorId || !selectedDate) return;
      setLoadingSlots(true);
      setSelectedSlot('');
      setBookingError('');
      try {
        const res = await api.get(`/doctors/${selectedDoctorId}/slots?date=${selectedDate}`);
        setSlotsData(res.data);
      } catch (err) {
        setBookingError(err.response?.data?.error || 'Failed to fetch appointment slots');
        setSlotsData(null);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setBookingError('Please select a doctor');
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please choose an available appointment slot');
      return;
    }
    if (!symptoms.trim()) {
      setBookingError('Please describe your current symptoms');
      return;
    }

    setSubmitting(true);
    setBookingError('');

    try {
      const res = await api.post('/appointments', {
        doctorId: parseInt(selectedDoctorId, 10),
        date: selectedDate,
        slot: selectedSlot,
        symptoms: symptoms.trim(),
        medicalHistory: medicalHistory.trim()
      });

      setConfirmedBooking(res.data.appointment);
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to complete appointment booking');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id.toString() === selectedDoctorId.toString());

  // 1. CONFIRMATION SCREEN
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Confirmed & Registered in Queue
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Appointment Confirmed
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Your appointment has been registered and a digital OPD token has been generated.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-500 font-medium">Doctor</span>
              <span className="text-sm font-bold text-slate-900">{confirmedBooking.doctorName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-500 font-medium">Department & Room</span>
              <span className="text-sm font-semibold text-slate-800">
                {confirmedBooking.specialization} ({confirmedBooking.roomNumber})
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-500 font-medium">Date & Slot</span>
              <span className="text-sm font-semibold text-slate-800 font-mono">
                {confirmedBooking.date} • {confirmedBooking.slot}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">OPD Status</span>
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                WAITING
              </span>
            </div>
          </div>

          {/* Token Highlight */}
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-2xl p-6 shadow-md">
            <div className="text-xs uppercase font-bold tracking-wider text-teal-200">
              Your Digital Queue Token
            </div>
            <div className="text-5xl font-extrabold font-mono tracking-tight my-2">
              {confirmedBooking.tokenNumber}
            </div>
            <div className="text-xs text-teal-100 font-medium">
              Estimated {confirmedBooking.peopleAhead ?? 0} patients ahead in line
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/Queue?doctorId=${confirmedBooking.doctorId}&appointmentId=${confirmedBooking.id}`}
              className="flex-1 py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Activity className="w-4 h-4" />
              <span>Track Live Queue</span>
            </Link>
            <Link
              to="/Dashboard"
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. BOOKING FORM
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Book Doctor Appointment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select an on-duty campus doctor, choose an available time slot, and enter medical details.
        </p>
      </div>

      {bookingError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Doctor */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-800">Select Doctor</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {doctors.map((doc) => {
              const isSelected = selectedDoctorId.toString() === doc.id.toString();
              return (
                <div
                  key={doc.id}
                  onClick={() => doc.available && setSelectedDoctorId(doc.id.toString())}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                    !doc.available
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                      : isSelected
                      ? 'border-teal-600 bg-teal-50/70 shadow-sm ring-2 ring-teal-500'
                      : 'border-slate-200 hover:border-teal-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-9 h-9 rounded-xl bg-teal-100/60 text-teal-700 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    {doc.available ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Off-Duty
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                  <div className="text-xs text-teal-700 font-medium">{doc.specialization}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">{doc.room_number}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Date & Available Slots */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-bold text-slate-800">Select Date & Available Time Slot</h2>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Appointment Date
            </label>
            <div className="relative max-w-xs">
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Available Consultation Slots
              </label>
              {slotsData && (
                <span className="text-xs text-slate-500">
                  Capacity: {slotsData.bookedCount || 0} / {slotsData.maxPatients || 20} booked
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading available slots...</div>
            ) : !slotsData || !slotsData.available ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                {slotsData?.reason || 'No available schedule found for this doctor on selected date.'}
              </div>
            ) : slotsData.slots.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                No slots configured for this date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {slotsData.slots.map((s, idx) => {
                  const isSelected = selectedSlot === s.time;
                  if (s.isBooked) {
                    return (
                      <div
                        key={idx}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs font-mono text-center cursor-not-allowed select-none"
                        title="Already Booked"
                      >
                        <div className="line-through">{s.time}</div>
                        <div className="text-[10px] font-bold text-slate-400">BOOKED</div>
                      </div>
                    );
                  }
                  if (s.isFull) {
                    return (
                      <div
                        key={idx}
                        className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-400 text-xs font-mono text-center cursor-not-allowed select-none"
                        title="Doctor capacity reached"
                      >
                        <div>{s.time}</div>
                        <div className="text-[10px] font-bold text-rose-600">FULL</div>
                      </div>
                    );
                  }
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedSlot(s.time)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-mono font-medium transition-all text-center ${
                        isSelected
                          ? 'border-teal-600 bg-teal-600 text-white shadow-sm ring-2 ring-teal-500 font-bold'
                          : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 bg-white text-slate-800'
                      }`}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Symptoms & Medical History */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Provide Symptoms & Medical History
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Current Symptoms <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Describe your symptoms, how long you have had them, and severity.
            </p>
            <textarea
              required
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., Severe fever, body aches and throat pain since yesterday evening..."
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Previous Medical History <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Note any known allergies, chronic conditions (asthma, diabetes), or current medications.
            </p>
            <textarea
              rows={2}
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g., Penicillin allergy, mild asthma..."
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="py-3.5 px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md transition-all text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Confirm Appointment & Generate Token</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
