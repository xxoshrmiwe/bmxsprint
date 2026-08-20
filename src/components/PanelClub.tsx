import { useState } from 'react';
import type { Corredor, Club } from '../lib/types';
import { crearClubLocally } from '../lib/clubes';
import GeneradorMangasCarriles from './GeneradorMangasCarriles';
import ProgramadorSemanalClub from './ProgramadorSemanalClub';

interface Props {
  corredor: Corredor;
  onVolver: () => void;
}

export default function PanelClub({ corredor, onVolver }: Props) {
  const [vista, setVista] = useState<'main' | 'mangas' | 'agenda'>('main');
  const [club, setClub] = useState<Club | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('bmx_mi_club');
    return cached ? JSON.parse(cached) : null;
  });
  const [nombreClub, setNombreClub] = useState('');

  async function handleCrearClub(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreClub.trim()) return;
    const nuevo = await crearClubLocally(nombreClub.trim());
    setClub(nuevo);
  }

  if (vista === 'mangas') {
    return <GeneradorMangasCarriles nombresCorredores={['Santi', 'Mateo', 'Lucas', 'Sofía', 'Camilo', 'Mariana', 'Thiago', 'David']} onVolver={() => setVista('main')} />;
  }

  if (vista === 'agenda') {
    return <ProgramadorSemanalClub onVolver={() => setVista('main')} />;
  }

  return (
    <div className="space-y-5 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onVolver} className="btn-ghost text-xs">← Volver al Panel</button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          🏆 Módulo Clubes BMX
        </span>
      </div>

      {!club ? (
        <form onSubmit={handleCrearClub} className="space-y-3 p-2">
          <div className="space-y-1">
            <h2 className="font-heading text-xl font-bold text-slate-900 uppercase">Crear o Unirse a un Club</h2>
            <p className="text-xs text-slate-500">
              Administra tu equipo, asigna entrenamientos y sortea carriles de grilla con anuncio por voz.
            </p>
          </div>
          <input
            type="text"
            placeholder="Nombre de tu Club (ej. Raptors BMX)"
            value={nombreClub}
            onChange={(e) => setNombreClub(e.target.value)}
            className="input"
            required
          />
          <button type="submit" className="btn-primary w-full py-3.5 font-bold text-base shadow-md">
            Crear mi Club BMX
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900 text-white p-4 space-y-1.5 shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-emerald-500/30">
              Código Invite: {club.codigoInvite}
            </span>
            <h2 className="font-heading text-2xl font-bold uppercase text-white">{club.nombre}</h2>
            <p className="text-xs text-slate-300">Club Activo · Director: {corredor.nombre}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVista('mangas')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🚥</div>
              <h3 className="font-heading text-base font-bold text-slate-900">Mangas (1-8)</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Sortear carriles y anunciar por voz</p>
            </button>

            <button
              onClick={() => setVista('agenda')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📅</div>
              <h3 className="font-heading text-base font-bold text-slate-900">Agenda Semanal</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Días y rutinas del equipo</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
