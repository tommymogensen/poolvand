import React from 'react';
import { Waves, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 bg-sky-700 text-white shadow-md border-b border-sky-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  PoolMaster Pro
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-sky-500/30 text-sky-100 border border-sky-400/30">
                  Hjælpeværktøj
                </span>
              </div>
              <p className="text-xs text-sky-100 uppercase tracking-wider font-medium hidden sm:block">
                Præcis Pool Kemi & Facebook Opslagshjælper
              </p>
            </div>
          </div>

          {/* Tagline / Badge */}
          <div className="flex items-center space-x-2 text-xs font-semibold bg-sky-800/80 text-sky-100 px-3.5 py-1.5 rounded-full border border-sky-600/60 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Klar til Facebook Opslag & Foto</span>
          </div>

        </div>
      </div>
    </header>
  );
};

