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
  const [modoAcceso, setModoAcceso] = useState<'crear' | 'unirse'>('crear');
  const [codigoUnirse, setCodigoUnirse] = useState('');

  async function handleCrearClub(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreClub.trim()) return;
    const nuevo = await crearClubLocally(nombreClub.trim());
    setClub(nuevo);
  }

  async function handleUnirseClub(e: React.FormEvent) {
    e.preventDefault();
    if (!codigoUnirse.trim()) return;
    const clubUnido: Club = {
      id: `club_${Date.now()}`,
      codigoInvite: codigoUnirse.trim().toUpperCase(),
      nombre: `Club (${codigoUnirse.trim().toUpperCase()})`,
      creadoPor: 'entrenador',
      creadoEn: Date.now()
    };
    localStorage.setItem(`bmx_mi_club`, JSON.stringify(clubUnido));
    setClub(clubUnido);
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
        <div className="space-y-4 p-2">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setModoAcceso('crear')}
              className={`w-1/2 py-2 rounded-lg transition-all ${
                modoAcceso === 'crear' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Crear Nuevo Club 🛠️
            </button>
            <button
              onClick={() => setModoAcceso('unirse')}
              className={`w-1/2 py-2 rounded-lg transition-all ${
                modoAcceso === 'unirse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Unirme con Código 🔑
            </button>
          </div>

          {modoAcceso === 'crear' ? (
            <form onSubmit={handleCrearClub} className="space-y-3">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Crear mi Club de BMX</h2>
                <p className="text-xs text-slate-500">
                  Para entrenadores y directores que gestionan sus atletas, mangas y entrenamientos.
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
            <form onSubmit={handleUnirseClub} className="space-y-3">
              <div className="space-y-1">
                <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Unirme a un Club Existente</h2>
                <p className="text-xs text-slate-500">
                  Ingresa el código que te compartió tu entrenador (ej. RAPT-5821) para sincronizar tu cuenta.
                </p>
              </div>
              <input
                type="text"
                placeholder="Código del Club (ej. RAPT-5821)"
                value={codigoUnirse}
                onChange={(e) => setCodigoUnirse(e.target.value)}
                className="input uppercase font-mono tracking-wider font-bold"
                required
              />
              <button type="submit" className="btn-primary w-full py-3.5 font-bold text-base shadow-md">
                Unirme al Club
              </button>
            </form>
          )}
        </div>
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
