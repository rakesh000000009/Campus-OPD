import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Lock, Mail, ArrowRight, UserCheck, ShieldAlert, Sparkles, GraduationCap } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({ name, email, password, student_id: studentId });
      } else {
        await login(email, password);
      }
      const from = location.state?.from?.pathname || '/Dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50/60 to-slate-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 mb-4">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isRegister ? 'Student Registration' : 'Campus OPD Portal'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isRegister
              ? 'Create a student account to book appointments and track queues'
              : 'Sign in to access health services, appointments & live queue'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Student Roll / ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="STU-2024-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Campus Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campusopd.local"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
          >
            {isRegister ? 'Already have an account? Sign in here' : 'New student? Register an account here'}
          </button>
        </div>

        {/* Demo Credentials Quick-Select Pill Box */}
        <div className="border-t border-slate-100 pt-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Demo Accounts (One-Click)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">pwd: password123</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('student@campusopd.local', 'password123')}
              className="py-2 px-2 text-xs font-medium rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 text-teal-800 transition-colors text-center"
            >
              <div className="font-semibold flex items-center justify-center gap-1">
                <GraduationCap className="w-3 h-3" /> Student
              </div>
              <div className="text-[10px] text-teal-600 truncate">student@...</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('doctor@campusopd.local', 'password123')}
              className="py-2 px-2 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-800 transition-colors text-center"
            >
              <div className="font-semibold flex items-center justify-center gap-1">
                <Stethoscope className="w-3 h-3" /> Doctor
              </div>
              <div className="text-[10px] text-blue-600 truncate">doctor@...</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@campusopd.local', 'password123')}
              className="py-2 px-2 text-xs font-medium rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-purple-800 transition-colors text-center"
            >
              <div className="font-semibold flex items-center justify-center gap-1">
                <UserCheck className="w-3 h-3" /> Admin
              </div>
              <div className="text-[10px] text-purple-600 truncate">admin@...</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
