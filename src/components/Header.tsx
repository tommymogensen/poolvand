import React from 'react';
import { Waves, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 bg-sky-700 text-white shadow-md border-b border-sky-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <a href="/" className="flex items-center space-x-3" aria-label="Gå til startsiden og nulstil formularen">
            <div className="bg-white/20 p-2 sm:p-2.5 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white">
                Pool Facebook Opslagshjælper
              </h1>
            </div>
          </a>

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
