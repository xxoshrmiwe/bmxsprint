import { useState } from 'react';
import type { Corredor, Club, EntrenadorClub, AtletaClub } from '../lib/types';
import {
  crearClubLocally,
  obtenerEntrenadoresClub,
  agregarEntrenadorClub,
  eliminarEntrenadorClub,
  obtenerAtletasClub,
  agregarAtletaClub,
  eliminarAtletaClub
} from '../lib/clubes';
import GeneradorMangasCarriles from './GeneradorMangasCarriles';
import ProgramadorSemanalClub from './ProgramadorSemanalClub';

interface Props {
  corredor: Corredor;
  onVolver: () => void;
}

export default function PanelClub({ corredor, onVolver }: Props) {
  const [vista, setVista] = useState<'main' | 'entrenadores' | 'atletas' | 'mangas' | 'agenda'>('main');

  const [club, setClub] = useState<Club | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('bmx_mi_club');
    if (cached) return JSON.parse(cached);
    if (corredor.nombreClub) {
      const autoClub: Club = {
        id: `club_${Date.now()}`,
        codigoInvite: 'RAPT-5821',
        nombre: corredor.nombreClub,
        creadoPor: corredor.nombre,
        creadoEn: Date.now()
      };
      localStorage.setItem('bmx_mi_club', JSON.stringify(autoClub));
      return autoClub;
    }
    return null;
  });

  const clubId = club?.id || 'club_default';

  // ESTADO ENTRENADORES
  const [entrenadores, setEntrenadores] = useState<EntrenadorClub[]>(() => obtenerEntrenadoresClub(clubId));
  const [nombreEntrenador, setNombreEntrenador] = useState('');
  const [emailEntrenador, setEmailEntrenador] = useState('');
  const [especialidadEntrenador, setEspecialidadEntrenador] = useState('');

  // ESTADO ATLETAS
  const [atletas, setAtletas] = useState<AtletaClub[]>(() => obtenerAtletasClub(clubId));
  const [nombreAtleta, setNombreAtleta] = useState('');
  const [edadAtleta, setEdadAtleta] = useState('');
  const [categoriaAtleta, setCategoriaAtleta] = useState('');

  const [nombreNuevoClub, setNombreNuevoClub] = useState('');

  async function handleCrearClub(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreNuevoClub.trim()) return;
    const nuevo = await crearClubLocally(nombreNuevoClub.trim());
    setClub(nuevo);
  }

  function handleAgregarEntrenador(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreEntrenador.trim()) return;
    const nuevo = agregarEntrenadorClub(clubId, nombreEntrenador, emailEntrenador, especialidadEntrenador);
    setEntrenadores((prev) => [nuevo, ...prev]);
    setNombreEntrenador('');
    setEmailEntrenador('');
    setEspecialidadEntrenador('');
  }

  function handleEliminarEntrenador(id: string) {
    eliminarEntrenadorClub(clubId, id);
    setEntrenadores((prev) => prev.filter((e) => e.id !== id));
  }

  function handleAgregarAtleta(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreAtleta.trim() || !edadAtleta) return;
    const nuevo = agregarAtletaClub(clubId, nombreAtleta, Number(edadAtleta), categoriaAtleta || `${edadAtleta} años`);
    setAtletas((prev) => [nuevo, ...prev]);
    setNombreAtleta('');
    setEdadAtleta('');
    setCategoriaAtleta('');
  }

  function handleEliminarAtleta(id: string) {
    eliminarAtletaClub(clubId, id);
    setAtletas((prev) => prev.filter((a) => a.id !== id));
  }

  if (vista === 'mangas') {
    return <GeneradorMangasCarriles clubId={clubId} onVolver={() => setVista('main')} />;
  }

  if (vista === 'agenda') {
    return <ProgramadorSemanalClub clubId={clubId} onVolver={() => setVista('main')} />;
  }

  if (vista === 'entrenadores') {
    return (
      <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold uppercase text-slate-900">👨‍🏫 Plantilla de Entrenadores</h2>
          <button onClick={() => setVista('main')} className="btn-ghost text-xs font-bold">← Volver</button>
        </div>

        <form onSubmit={handleAgregarEntrenador} className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
          <h3 className="font-bold text-xs uppercase text-slate-700">Dar de alta a un Entrenador / Profe:</h3>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej. Profe Carlos Restrepo"
              value={nombreEntrenador}
              onChange={(e) => setNombreEntrenador(e.target.value)}
              className="input text-xs"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo (Opcional)</label>
              <input
                type="email"
                placeholder="carlos@correo.com"
                value={emailEntrenador}
                onChange={(e) => setEmailEntrenador(e.target.value)}
                className="input text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Especialidad</label>
              <input
                type="text"
                placeholder="ej. Infantil 6-10"
                value={especialidadEntrenador}
                onChange={(e) => setEspecialidadEntrenador(e.target.value)}
                className="input text-xs"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold shadow-xs">
            + Agregar Entrenador al Club
          </button>
        </form>

        <div className="space-y-2 pt-2">
          {entrenadores.length === 0 ? (
            <p className="text-xs text-slate-400 text-center p-4">No has registrado entrenadores aún.</p>
          ) : (
            entrenadores.map((e) => (
              <div key={e.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{e.nombre}</h4>
                  <p className="text-xs text-slate-500">{e.especialidad || 'Entrenador de Pista'} · {e.email || 'Sin correo registrado'}</p>
                </div>
                <button onClick={() => handleEliminarEntrenador(e.id)} className="text-slate-400 hover:text-red-600 text-xs p-1">
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (vista === 'atletas') {
    return (
      <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold uppercase text-slate-900">🚴 Mis Atletas / Corredores</h2>
          <button onClick={() => setVista('main')} className="btn-ghost text-xs font-bold">← Volver</button>
        </div>

        <form onSubmit={handleAgregarAtleta} className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
          <h3 className="font-bold text-xs uppercase text-slate-700">Registrar un Niño / Atleta en el Club:</h3>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo del Niño(a)</label>
            <input
              type="text"
              placeholder="Ej. Mateo Gómez"
              value={nombreAtleta}
              onChange={(e) => setNombreAtleta(e.target.value)}
              className="input text-xs"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Edad</label>
              <input
                type="number"
                min={3}
                max={99}
                placeholder="ej. 8"
                value={edadAtleta}
                onChange={(e) => setEdadAtleta(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Categoría</label>
              <input
                type="text"
                placeholder="ej. 8 Novatos"
                value={categoriaAtleta}
                onChange={(e) => setCategoriaAtleta(e.target.value)}
                className="input text-xs"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold shadow-xs">
            + Registrar Atleta en el Club
          </button>
        </form>

        <div className="space-y-2 pt-2">
          {atletas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center p-4">No has registrado atletas aún en tu club.</p>
          ) : (
            atletas.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{a.nombre}</h4>
                  <p className="text-xs text-slate-500">{a.edad} años · {a.categoria}</p>
                </div>
                <button onClick={() => handleEliminarAtleta(a.id)} className="text-slate-400 hover:text-red-600 text-xs p-1">
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onVolver} className="btn-ghost text-xs font-bold">← Volver al Perfil</button>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          🏆 Módulo Clubes BMX
        </span>
      </div>

      {!club ? (
        <form onSubmit={handleCrearClub} className="space-y-3 p-2">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Configurar mi Club de BMX</h2>
            <p className="text-xs text-slate-500">
              Ingresa el nombre oficial de tu escuela o institución deportiva para iniciar la gestión.
            </p>
          </div>
          <input
            type="text"
            placeholder="Nombre de tu Club (ej. Raptors BMX)"
            value={nombreNuevoClub}
            onChange={(e) => setNombreNuevoClub(e.target.value)}
            className="input"
            required
          />
          <button type="submit" className="btn-primary w-full py-3.5 font-bold text-base shadow-md">
            Crear Ficha del Club
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900 text-white p-4 space-y-1.5 shadow-md">
            <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-emerald-500/30">
              Código Invite: {club.codigoInvite}
            </span>
            <h2 className="font-heading text-2xl font-bold uppercase text-white">{club.nombre}</h2>
            <p className="text-xs text-slate-300">Director: {corredor.nombre} · {atletas.length} Atletas · {entrenadores.length} Entrenadores</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVista('mangas')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🚥</div>
              <h3 className="font-heading text-base font-bold text-slate-900">Mangas (1-8)</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Sortear carriles con voz sintética</p>
            </button>

            <button
              onClick={() => setVista('agenda')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📅</div>
              <h3 className="font-heading text-base font-bold text-slate-900">Agenda Semanal</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Publicar rutinas y días</p>
            </button>

            <button
              onClick={() => setVista('atletas')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🚴</div>
              <h3 className="font-heading text-base font-bold text-slate-900">Mis Atletas ({atletas.length})</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Registrar corredores del club</p>
            </button>

            <button
              onClick={() => setVista('entrenadores')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">👨‍🏫</div>
              <h3 className="font-heading text-base font-bold text-slate-900">Entrenadores ({entrenadores.length})</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Registrar profesores</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
