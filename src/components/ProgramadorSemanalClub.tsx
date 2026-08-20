import { useState } from 'react';
import type { HorarioEntrenamientoClub } from '../lib/types';

interface Props {
  onVolver: () => void;
}

export default function ProgramadorSemanalClub({ onVolver }: Props) {
  const [horarios] = useState<HorarioEntrenamientoClub[]>([
    { diaSemana: 'martes', horaInicio: '17:00', titulo: 'Salidas de Gate + Sprints 20m', descripcion: 'Enfoque en tiempo de reacción al drop y primeras 3 pedaleadas.' },
    { diaSemana: 'jueves', horaInicio: '17:00', titulo: 'Fuerza en Partidor + Sprints 50m', descripcion: 'Aceleración en recta principal y pruebas de desarrollo.' },
    { diaSemana: 'sabado', horaInicio: '09:00', titulo: 'Simulacro de Carrera (Mangas 8 Carriles)', descripcion: 'Mangas competitivas de 8 carriles con anuncio por voz.' }
  ]);

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-slate-900">📅 Agenda Semanal del Club</h2>
        <button onClick={onVolver} className="btn-ghost text-xs">← Volver</button>
      </div>

      <p className="text-xs text-slate-500">
        Programación oficial de días y rutinas de entrenamiento configurada por el entrenador del club.
      </p>

      <div className="space-y-3">
        {horarios.map((h, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                {h.diaSemana} · {h.horaInicio} HS
              </span>
              <span className="text-[10px] font-bold text-slate-400">Confirmación ABIERTA</span>
            </div>
            <h3 className="font-heading text-base font-bold text-slate-900">{h.titulo}</h3>
            {h.descripcion && <p className="text-xs text-slate-500">{h.descripcion}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
