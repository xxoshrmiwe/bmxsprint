import { useState } from 'react';

interface Props {
  onExistente: () => void;
  onNuevo: () => void;
}

export default function Acceso({ onExistente, onNuevo }: Props) {
  const [tab, setTab] = useState<'corredor' | 'club'>('corredor');

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 py-6 sm:p-6 text-center">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-extrabold uppercase text-slate-900">¿Cómo vas a ingresar?</h1>
        <p className="text-xs text-slate-500">Selecciona tu perfil de usuario para continuar.</p>
      </div>

      {/* TABS DE ACCESO */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shadow-2xs">
        <button
          onClick={() => setTab('corredor')}
          className={`w-1/2 py-2.5 rounded-lg transition-all ${
            tab === 'corredor' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🚴 Corredores / Atletas
        </button>
        <button
          onClick={() => setTab('club')}
          className={`w-1/2 py-2.5 rounded-lg transition-all ${
            tab === 'club' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🏆 Clubes & Entrenadores
        </button>
      </div>

      {tab === 'corredor' ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="space-y-1">
            <span className="text-2xl">🚴</span>
            <h2 className="font-heading text-lg font-bold uppercase text-slate-900">Acceso Corredores & Familias</h2>
            <p className="text-xs text-slate-500">
              Para atletas que entrenan individualmente, guardan sus tiempos al drop y configuran su bicicleta.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button onClick={onExistente} className="btn-primary w-full py-3.5 font-bold text-base shadow-md">
              Ya tengo usuario (Iniciar Sesión)
            </button>
            <button onClick={onNuevo} className="btn-secondary w-full py-3.5 font-bold text-base">
              Soy un corredor nuevo (Registrarme)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-left shadow-sm">
          <div className="space-y-1 text-center">
            <span className="text-2xl">🏆</span>
            <h2 className="font-heading text-lg font-bold uppercase text-slate-900">Módulo para Clubes & Entrenadores</h2>
            <p className="text-xs text-slate-600">
              Gestión de equipo, partidor de 8 carriles con voz y agenda semanal.
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-white p-3 border border-emerald-200 text-xs text-slate-700">
            <h3 className="font-bold text-emerald-800 uppercase text-[11px] flex items-center gap-1">
              <span>✨ ¿Qué incluye para tu Club?</span>
            </h3>
            <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-600">
              <li>Sorteo de mangas y asignación de 1 a 8 carriles.</li>
              <li>Anuncio por voz sintética (TTS) por los altoparlantes de la pista.</li>
              <li>Programación semanal de rutinas y entrenamientos.</li>
              <li>Código único de invitación (`RAPT-5821`) para tus atletas.</li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <button onClick={onExistente} className="btn-primary w-full py-3.5 font-bold text-base shadow-md">
              Iniciar Sesión como Entrenador
            </button>
            <button onClick={onNuevo} className="btn-secondary w-full py-3.5 font-bold text-base">
              Registrar Nuevo Club / Entrenador
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
