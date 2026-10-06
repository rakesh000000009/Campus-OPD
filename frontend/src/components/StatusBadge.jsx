import React from 'react';

export default function StatusBadge({ status }) {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          In Progress
        </span>
      );
    case 'WAITING':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          Waiting
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
          Cancelled
        </span>
      );
    case 'BOOKED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          Booked
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {status}
        </span>
      );
  }
}
