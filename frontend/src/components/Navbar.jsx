import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogOut, Menu, X, User, Calendar, Users, Activity, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/Login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/Dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                  Campus OPD
                  {user && (
                    <span className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      {user.role}
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500 hidden sm:block">Campus Health Centre Management</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex md:ml-8 md:space-x-1">
                {user.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/Dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/Dashboard')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/Doctors"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/Doctors')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Doctors
                    </Link>
                    <Link
                      to="/BookAppointment"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/BookAppointment')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Book Appointment
                    </Link>
                    <Link
                      to="/Queue"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/Queue')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Live Queue
                    </Link>
                  </>
                )}

                {user.role === 'DOCTOR' && (
                  <>
                    <Link
                      to="/Dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/Dashboard')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Doctor Consultations
                    </Link>
                    <Link
                      to="/Queue"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/Queue')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Queue Monitor
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/Dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/Dashboard')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/Queue"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/Queue')
                          ? 'text-teal-700 bg-teal-50 font-semibold'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      Live Queue Monitor
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User profile info & logout */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500">
                    {user.role === 'STUDENT'
                      ? user.student_id || user.email
                      : user.role === 'DOCTOR'
                      ? `${user.specialization || 'Doctor'} • ${user.doctorRoom || ''}`
                      : 'System Administrator'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/Login"
                className="text-sm font-medium px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {user ? (
            <>
              <div className="pb-3 border-b border-slate-100 mb-2">
                <div className="font-semibold text-slate-800">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email} ({user.role})</div>
              </div>

              {user.role === 'STUDENT' && (
                <>
                  <Link
                    to="/Dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/Doctors"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Doctors
                  </Link>
                  <Link
                    to="/BookAppointment"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Book Appointment
                  </Link>
                  <Link
                    to="/Queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Live Queue
                  </Link>
                </>
              )}

              {user.role === 'DOCTOR' && (
                <>
                  <Link
                    to="/Dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Doctor Consultations
                  </Link>
                  <Link
                    to="/Queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Queue Monitor
                  </Link>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <Link
                    to="/Dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/Queue"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Live Queue Monitor
                  </Link>
                </>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left mt-2 px-3 py-2 rounded-md text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/Login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center py-2 bg-teal-600 text-white rounded-lg font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
