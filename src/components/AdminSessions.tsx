import React, { FormEvent, useState } from 'react';
import { AlertTriangle, ExternalLink, KeyRound, RefreshCw, Users } from 'lucide-react';

type Session = {
  id: string;
  createdAt: string;
  volumeM3: number | null;
  sanitizerType: string | null;
  waterColor: string | null;
  ph: number | null;
  freeChlorinePpm: number | null;
  status: string | null;
};

const formatDate = (value: string) => new Intl.DateTimeFormat('da-DK', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

export const AdminSessions: React.FC = () => {
  const [password, setPassword] = useState('');
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async (event?: FormEvent) => {
    event?.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/sessions', {
        headers: { 'x-admin-password': password },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kunne ikke hente sessionerne.');
      setSessions(data.sessions);
    } catch (loadError: any) {
      setSessions(null);
      setError(loadError.message || 'Kunne ikke hente sessionerne.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 rounded-xl bg-sky-100 text-sky-700"><Users className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin: Sessioner</h2>
          <p className="text-sm text-slate-500 mt-1">Se alle gemte, delbare diagnoser fra de seneste 14 dage.</p>
        </div>
      </div>

      <form onSubmit={loadSessions} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 mb-6">
        <label className="sr-only" htmlFor="admin-password">Adgangskode</label>
        <div className="relative flex-1">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input id="admin-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Admin-adgangskode" required className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <button type="submit" disabled={isLoading} className="px-4 py-2.5 rounded-lg bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {sessions ? 'Opdatér' : 'Vis sessioner'}
        </button>
      </form>

      {error && <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}

      {sessions && (
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200"><p className="font-bold text-slate-800">{sessions.length} gemte sessioner</p></div>
          {sessions.length === 0 ? <p className="p-6 text-sm text-slate-500">Der er endnu ingen gemte sessioner.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Oprettet</th><th className="px-4 py-3">Pool</th><th className="px-4 py-3">Målinger</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Åbn</span></th></tr></thead>
              <tbody className="divide-y divide-slate-100">{sessions.map(session => <tr key={session.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 whitespace-nowrap text-slate-700">{formatDate(session.createdAt)}</td>
                <td className="px-4 py-3 text-slate-700">{session.volumeM3 ?? '–'} m³ <span className="text-slate-400">·</span> {session.sanitizerType || '–'}</td>
                <td className="px-4 py-3 text-slate-700">pH {session.ph ?? '–'} <span className="text-slate-400">·</span> Klor {session.freeChlorinePpm ?? '–'}</td>
                <td className="px-4 py-3 text-slate-700">{session.status || '–'}</td>
                <td className="px-4 py-3"><a href={`/?diagnose=${encodeURIComponent(session.id)}`} target="_blank" rel="noreferrer" aria-label="Åbn session" className="inline-flex p-2 rounded-lg text-sky-700 hover:bg-sky-100"><ExternalLink className="w-4 h-4" /></a></td>
              </tr>)}</tbody>
            </table></div>
          )}
        </section>
      )}
    </main>
  );
};
