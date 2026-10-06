import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import BookAppointment from './pages/BookAppointment';
import Queue from './pages/Queue';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Route */}
              <Route path="/Login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/Dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/Doctors"
                element={
                  <ProtectedRoute>
                    <Doctors />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/BookAppointment"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/Queue"
                element={
                  <ProtectedRoute>
                    <Queue />
                  </ProtectedRoute>
                }
              />

              {/* Fallback & Default */}
              <Route path="/" element={<Navigate to="/Dashboard" replace />} />
              <Route path="*" element={<Navigate to="/Dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
