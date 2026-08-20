import { useState } from 'react';
import type { HorarioEntrenamientoClub } from '../lib/types';
import { obtenerHorariosClub, agregarHorarioClub, eliminarHorarioClub } from '../lib/clubes';

interface Props {
  clubId: string;
  onVolver: () => void;
}

export default function ProgramadorSemanalClub({ clubId, onVolver }: Props) {
  const [horarios, setHorarios] = useState<HorarioEntrenamientoClub[]>(() => obtenerHorariosClub(clubId));
  const [mostrarForm, setMostrarForm] = useState(false);

  const [diaSemana, setDiaSemana] = useState<HorarioEntrenamientoClub['diaSemana']>('martes');
  const [horaInicio, setHoraInicio] = useState('17:00');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    const nuevo = agregarHorarioClub(clubId, diaSemana, horaInicio, titulo, descripcion);
    setHorarios((prev) => [...prev, nuevo]);
    setTitulo('');
    setDescripcion('');
    setMostrarForm(false);
  }

  function handleEliminar(id: string) {
    eliminarHorarioClub(clubId, id);
    setHorarios((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-slate-900">📅 Agenda Semanal del Club</h2>
        <button onClick={onVolver} className="btn-ghost text-xs font-bold">← Volver</button>
      </div>

      <p className="text-xs text-slate-500">
        Configura los días y rutinas de entrenamiento de tu club para que tus atletas y familias los consulten.
      </p>

      <button
        onClick={() => setMostrarForm(!mostrarForm)}
        className="w-full cursor-pointer py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 font-bold text-xs hover:bg-emerald-100 transition-colors shadow-2xs"
      >
        {mostrarForm ? '✕ Cancelar' : '+ Agregar Nuevo Horario / Rutina'}
      </button>

      {mostrarForm && (
        <form onSubmit={handleAgregar} className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Día de la Semana</label>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value as any)}
                className="input text-xs"
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Hora Inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Título de la Rutina</label>
            <input
              type="text"
              placeholder="ej. Técnica de Partidor y Reacción"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="input text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Descripción / Indicaciones</label>
            <input
              type="text"
              placeholder="ej. Traer relación 44x16 y protección completa"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="input text-xs"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-2 text-xs font-bold shadow-xs">
            Guardar Horario en la Agenda
          </button>
        </form>
      )}

      <div className="space-y-2.5 pt-2">
        {horarios.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
            No has agregado horarios aún. Toca "+ Agregar Nuevo Horario" para publicar tus rutinas.
          </div>
        ) : (
          horarios.map((h) => (
            <div key={h.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 shadow-2xs flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {h.diaSemana} · {h.horaInicio} HS
                  </span>
                </div>
                <h3 className="font-heading text-sm font-bold text-slate-900 mt-1">{h.titulo}</h3>
                {h.descripcion && <p className="text-xs text-slate-500">{h.descripcion}</p>}
              </div>
              <button
                onClick={() => handleEliminar(h.id)}
                className="text-slate-400 hover:text-red-600 text-xs p-1"
                title="Eliminar horario"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
