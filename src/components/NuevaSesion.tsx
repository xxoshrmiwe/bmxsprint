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
      <button onClick={onVolver} className="btn-ghost">
        ← {corredor.nombre}
      </button>

      <h1 className="text-2xl font-bold text-foreground">Nuevo entrenamiento</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Distancia del sprint (metros)</label>
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

        <label className="flex cursor-pointer items-center gap-2 text-foreground">
          <input
            type="checkbox"
            checked={calentamiento}
            onChange={(e) => setCalentamiento(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          Hacer calentamiento antes de arrancar
        </label>

        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className="input"
            placeholder="Ej. pista mojada, gate mecánico, etc."
          />
        </div>

        <button type="submit" disabled={guardando} className="btn-primary w-full">
          {guardando ? 'Creando...' : calentamiento ? 'Continuar a calentamiento' : 'Ir al gate'}
        </button>
      </form>
    </div>
  );
}
