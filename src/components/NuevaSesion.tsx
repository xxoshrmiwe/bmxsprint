import { useState } from 'react';
import type { Corredor, Sesion } from '../lib/types';
import { crearSesion } from '../lib/db';

interface Props {
  corredor: Corredor;
  onSesionCreada: (sesion: Sesion) => void;
  onVolver: () => void;
}

const DISTANCIAS_SUGERIDAS = [10, 20, 30, 50];

export default function NuevaSesion({ corredor, onSesionCreada, onVolver }: Props) {
  const [distancia, setDistancia] = useState<number>(20);
  const [calentamiento, setCalentamiento] = useState(true);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (distancia <= 0) return;
    setGuardando(true);
    try {
      const sesion = await crearSesion({
        corredorId: corredor.id,
        distanciaMetros: distancia,
        calentamientoRealizado: calentamiento,
        notas: notas.trim() || undefined
      });
      onSesionCreada(sesion);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <button onClick={onVolver} className="text-sm text-slate-500 hover:text-slate-700">
        ← {corredor.nombre}
      </button>

      <h1 className="text-xl font-bold text-slate-900">Nuevo entrenamiento</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600">Distancia del sprint (metros)</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {DISTANCIAS_SUGERIDAS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDistancia(d)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  distancia === d
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d} m
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            value={distancia}
            onChange={(e) => setDistancia(Number(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={calentamiento}
            onChange={(e) => setCalentamiento(e.target.checked)}
            className="h-4 w-4"
          />
          Hacer calentamiento antes de arrancar
        </label>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            placeholder="Ej. pista mojada, gate mecánico, etc."
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {guardando ? 'Creando...' : calentamiento ? 'Continuar a calentamiento' : 'Ir al gate'}
        </button>
      </form>
    </div>
  );
}
