import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Stethoscope, DoorOpen, Calendar, Search, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await api.get('/doctors');
        setDoctors(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load doctors catalog');
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const term = searchTerm.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.specialization.toLowerCase().includes(term) ||
      doc.room_number.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Campus Doctors Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consult qualified medical professionals available at the Campus Health Centre
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by doctor or dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No doctors found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    {doc.available ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Available Today
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">{doc.name}</h3>
                  <p className="text-sm font-semibold text-teal-700 mt-0.5">{doc.specialization}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-2">
                    <DoorOpen className="w-4 h-4 text-slate-400" />
                    <span>{doc.room_number}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                {doc.available ? (
                  <Link
                    to={`/BookAppointment?doctorId=${doc.id}`}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Book Appointment</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 font-semibold rounded-xl text-sm cursor-not-allowed"
                  >
                    Currently Off-Duty
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
