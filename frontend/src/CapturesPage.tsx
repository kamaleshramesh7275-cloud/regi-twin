import React from 'react';
import { Sidebar } from './components/Sidebar';
import { CaptureDashboard } from './components/CaptureDashboard';
import { useAuth } from './context/AuthContext';

export default function CapturesPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          {user ? (
            <CaptureDashboard userId={user.uid} />
          ) : (
            <div className="text-slate-400">Please log in to view captures.</div>
          )}
        </div>
      </main>
    </div>
  );
}
