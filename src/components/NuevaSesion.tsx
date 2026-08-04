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
  const [modoMedicion, setModoMedicion] = useState<'asistido' | 'acelerometro'>('asistido');
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
        modoMedicion,
        notas: notas.trim() || undefined
      });
      onSesionCreada(sesion);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <button onClick={onVolver} className="btn-ghost">
        ← {corredor.nombre}
      </button>

      <h1 className="text-2xl font-bold text-foreground">Nuevo entrenamiento</h1>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* MODO DE MEDICIÓN */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Modo de Entrenamiento
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModoMedicion('asistido')}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                modoMedicion === 'asistido'
                  ? 'border-primary bg-primary/10 font-bold text-primary shadow-sm'
                  : 'border-border bg-white text-muted-foreground hover:bg-surface'
              }`}
            >
              <div className="text-base mb-0.5">👥 Asistido</div>
              <div className="text-[11px] font-normal leading-tight">
                Alguien frena el tiempo manualmente en la meta.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModoMedicion('acelerometro')}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                modoMedicion === 'acelerometro'
                  ? 'border-primary bg-primary/10 font-bold text-primary shadow-sm'
                  : 'border-border bg-white text-muted-foreground hover:bg-surface'
              }`}
            >
              <div className="text-base mb-0.5">📱 Solo (Bolsillo)</div>
              <div className="text-[11px] font-normal leading-tight">
                Acelerómetro auto-detecta frenado y vibra.
              </div>
            </button>
          </div>
        </div>

        {/* DISTANCIA */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted-foreground">
            Distancia del sprint (metros)
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {DISTANCIAS_SUGERIDAS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDistancia(d)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-medium transition-colors duration-200 ${
                  distancia === d
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white text-muted-foreground hover:bg-surface'
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
            className="input"
            required
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-foreground text-sm font-medium">
          <input
            type="checkbox"
            checked={calentamiento}
            onChange={(e) => setCalentamiento(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          Hacer calentamiento antes de arrancar
        </label>

        <div>
          <label className="mb-1 block text-sm font-semibold text-muted-foreground">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="input"
            placeholder="Ej. pista mojada, gate mecánico, etc."
          />
        </div>

        <button type="submit" disabled={guardando} className="btn-primary w-full py-3.5 text-base font-bold">
          {guardando ? 'Creando...' : calentamiento ? 'Continuar a calentamiento' : 'Ir al gate'}
        </button>
      </form>
    </div>
  );
}
