import { useState } from 'react';
import type { Corredor, Club, EntrenadorClub, AtletaClub } from '../lib/types';
import {
  crearClubLocally,
  obtenerEntrenadoresClub,
  agregarEntrenadorClub,
  eliminarEntrenadorClub,
  obtenerAtletasClub,
  agregarAtletaClub,
  eliminarAtletaClub,
  generarEnlaceInvitacionWhatsApp
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
  const [passwordEntrenador, setPasswordEntrenador] = useState('');
  const [especialidadEntrenador, setEspecialidadEntrenador] = useState('');

  // ESTADO ATLETAS
  const [atletas, setAtletas] = useState<AtletaClub[]>(() => obtenerAtletasClub(clubId));
  const [nombreAtleta, setNombreAtleta] = useState('');
  const [edadAtleta, setEdadAtleta] = useState('');
  const [categoriaAtleta, setCategoriaAtleta] = useState('');
  const [telefonoPadres, setTelefonoPadres] = useState('');
  const [pesoKg, setPesoKg] = useState('');

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
    const nuevo = agregarEntrenadorClub(
      clubId,
      nombreEntrenador,
      emailEntrenador,
      passwordEntrenador,
      especialidadEntrenador
    );
    setEntrenadores((prev) => [nuevo, ...prev]);
    setNombreEntrenador('');
    setEmailEntrenador('');
    setPasswordEntrenador('');
    setEspecialidadEntrenador('');
  }

  function handleEliminarEntrenador(id: string) {
    eliminarEntrenadorClub(clubId, id);
    setEntrenadores((prev) => prev.filter((e) => e.id !== id));
  }

  function handleAgregarAtleta(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreAtleta.trim() || !edadAtleta) return;
    const nuevo = agregarAtletaClub(clubId, {
      nombre: nombreAtleta,
      edad: Number(edadAtleta),
      categoria: categoriaAtleta || `${edadAtleta} años`,
      telefonoPadres,
      pesoKg: pesoKg ? Number(pesoKg) : undefined,
      esRegistrado: false
    });
    setAtletas((prev) => [nuevo, ...prev]);
    setNombreAtleta('');
    setEdadAtleta('');
    setCategoriaAtleta('');
    setTelefonoPadres('');
    setPesoKg('');
  }

  function handleEliminarAtleta(id: string) {
    eliminarAtletaClub(clubId, id);
    setAtletas((prev) => prev.filter((a) => a.id !== id));
  }

  function handleCompartirWhatsApp() {
    if (!club) return;
    const enlaceWA = generarEnlaceInvitacionWhatsApp(club);
    window.open(enlaceWA, '_blank');
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
          <h2 className="font-heading text-xl font-bold uppercase text-slate-900">👨‍🏫 Entrenadores del Club</h2>
          <button onClick={() => setVista('main')} className="btn-ghost text-xs font-bold">← Volver</button>
        </div>

        <form onSubmit={handleAgregarEntrenador} className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
          <h3 className="font-bold text-xs uppercase text-slate-700">Crear Acceso a Entrenador / Profe:</h3>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo del Profesor</label>
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
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo de Acceso</label>
              <input
                type="email"
                placeholder="profe@correo.com"
                value={emailEntrenador}
                onChange={(e) => setEmailEntrenador(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordEntrenador}
                onChange={(e) => setPasswordEntrenador(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Especialidad / Rol en Pista</label>
            <input
              type="text"
              placeholder="ej. Entrenador Categorías Infantiles (6-10)"
              value={especialidadEntrenador}
              onChange={(e) => setEspecialidadEntrenador(e.target.value)}
              className="input text-xs"
            />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold shadow-xs">
            + Crear Credenciales de Entrenador
          </button>
        </form>

        <div className="space-y-2 pt-2">
          {entrenadores.length === 0 ? (
            <p className="text-xs text-slate-400 text-center p-4">No has registrado entrenadores todavía.</p>
          ) : (
            entrenadores.map((e) => (
              <div key={e.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{e.nombre}</h4>
                  <p className="text-xs text-slate-500">{e.especialidad || 'Entrenador de Pista'} · {e.email || 'Sin correo'}</p>
                  {e.password && <p className="text-[10px] text-emerald-700 font-mono">Clave asignada: {e.password}</p>}
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
          <h2 className="font-heading text-xl font-bold uppercase text-slate-900">🚴 Atletas / Corredores</h2>
          <button onClick={() => setVista('main')} className="btn-ghost text-xs font-bold">← Volver</button>
        </div>

        {/* BOTÓN INVITACIÓN WHATSAPP */}
        {club && (
          <button
            onClick={handleCompartirWhatsApp}
            className="w-full cursor-pointer py-3 px-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 font-bold text-xs hover:bg-emerald-100 transition-colors shadow-2xs flex items-center justify-center gap-2"
          >
            <span>📲 Compartir Invitación por WhatsApp al Club ({club.codigoInvite})</span>
          </button>
        )}

        <form onSubmit={handleAgregarAtleta} className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
          <h3 className="font-bold text-xs uppercase text-slate-700">Ficha de Registro Manual de Atleta:</h3>
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teléfono Papá/Mamá</label>
              <input
                type="tel"
                placeholder="3001234567"
                value={telefonoPadres}
                onChange={(e) => setTelefonoPadres(e.target.value)}
                className="input text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Peso (kg - opcional)</label>
              <input
                type="number"
                placeholder="ej. 28"
                value={pesoKg}
                onChange={(e) => setPesoKg(e.target.value)}
                className="input text-xs"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold shadow-xs">
            + Guardar Ficha de Atleta en el Club
          </button>
        </form>

        <div className="space-y-2 pt-2">
          {atletas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center p-4">No hay atletas en la lista. Agrega la ficha manual o comparte el código por WhatsApp.</p>
          ) : (
            atletas.map((a) => (
              <div key={a.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{a.nombre}</h4>
                    {a.esRegistrado ? (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                        VINCULADO VÍA CÓDIGO
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        FICHA MANUAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {a.edad} años · {a.categoria} {a.telefonoPadres ? `· 📞 ${a.telefonoPadres}` : ''}
                  </p>
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
          <div className="rounded-xl bg-slate-900 text-white p-4 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-emerald-500/30">
                Código Invite: {club.codigoInvite}
              </span>
              <button
                onClick={handleCompartirWhatsApp}
                className="cursor-pointer text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50 hover:bg-emerald-900 transition-colors"
              >
                📲 Invitar por WA
              </button>
            </div>
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
              <p className="text-[11px] text-slate-500 leading-tight">Fichas manuales & invitaciones</p>
            </button>

            <button
              onClick={() => setVista('entrenadores')}
              className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">👨‍🏫</div>
              <h3 className="font-heading text-base font-bold text-slate-900">Entrenadores ({entrenadores.length})</h3>
              <p className="text-[11px] text-slate-500 leading-tight">Credenciales para profesores</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
