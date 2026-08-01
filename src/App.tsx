import React, { useState } from 'react';
import { PoolProfile } from './types';
import { DEFAULT_PROFILE } from './lib/constants';
import { Header } from './components/Header';
import { DiagnosticWizard } from './components/DiagnosticWizard';
import { AdminSessions } from './components/AdminSessions';

export default function App() {
  const [profile, setProfile] = useState<PoolProfile>(DEFAULT_PROFILE);

  const handleUpdateProfile = (updated: PoolProfile) => {
    setProfile(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* App Header */}
      <Header />

      {/* Main View Container */}
      <div className="flex-1 pb-16">
        {window.location.pathname === '/admin' ? (
          <AdminSessions />
        ) : (
          <DiagnosticWizard
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 text-[11px] py-4 px-6 text-center shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-600">
            PoolVand Hjælper • Præcis Pool Kemi & Udstyr Opslag
          </p>
          <div className="flex items-center space-x-4 text-slate-500">
            <span className="font-mono">pH 7.2 - 7.4</span>
            <span>•</span>
            <span className="font-mono">Klor 1.0 - 2.0 ppm</span>
            <span>•</span>
            <span className="font-mono">Salt 3.5 g/L</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
