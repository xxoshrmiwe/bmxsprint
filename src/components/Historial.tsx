import { useEffect, useState } from 'react';
import type { Corredor, Sesion, Intento } from '../lib/types';
import { listarSesionesPorCorredor, listarIntentosPorCorredor } from '../lib/db';
import { formatearTiempo } from '../lib/tiempo';

interface Props {
  corredor: Corredor;
  onVolver: () => void;
}

function formatearFecha(ms: number): string {
  return new Date(ms).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface GrupoDistancia {
  distanciaMetros: number;
  intentos: (Intento & { fechaSesion: number })[];
}

export default function Historial({ corredor, onVolver }: Props) {
  const [cargando, setCargando] = useState(true);
  const [grupos, setGrupos] = useState<GrupoDistancia[]>([]);
  const [totalSesiones, setTotalSesiones] = useState(0);

  useEffect(() => {
    (async () => {
      setCargando(true);
      const [sesiones, intentos] = await Promise.all([
        listarSesionesPorCorredor(corredor.id),
        listarIntentosPorCorredor(corredor.id)
      ]);

      const sesionPorId = new Map<string, Sesion>(sesiones.map((s) => [s.id, s]));
      const porDistancia = new Map<number, (Intento & { fechaSesion: number })[]>();

      for (const intento of intentos) {
        const sesion = sesionPorId.get(intento.sesionId);
        if (!sesion) continue;
        const lista = porDistancia.get(sesion.distanciaMetros) ?? [];
        lista.push({ ...intento, fechaSesion: sesion.fecha });
        porDistancia.set(sesion.distanciaMetros, lista);
      }

      const gruposOrdenados = Array.from(porDistancia.entries())
        .map(([distanciaMetros, lista]) => ({
          distanciaMetros,
          intentos: lista.sort((a, b) => b.creadoEn - a.creadoEn)
        }))
        .sort((a, b) => a.distanciaMetros - b.distanciaMetros);

      setGrupos(gruposOrdenados);
      setTotalSesiones(sesiones.length);
      setCargando(false);
    })();
  }, [corredor.id]);

  if (cargando) {
    return <p className="p-4 text-center text-muted-foreground">Cargando historial...</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <button onClick={onVolver} className="btn-ghost">
        ← {corredor.nombre}
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Historial</h1>
        <p className="text-muted-foreground">{totalSesiones} sesiones registradas</p>
      </div>

      {grupos.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay tiempos guardados.</p>
      ) : (
        grupos.map((grupo) => {
          const mejor = Math.min(...grupo.intentos.map((i) => i.tiempoTotalMs));
          const promedio = grupo.intentos.reduce((acc, i) => acc + i.tiempoTotalMs, 0) / grupo.intentos.length;

          return (
            <section key={grupo.distanciaMetros} className="card">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-heading text-xl font-semibold text-foreground">{grupo.distanciaMetros} m</h2>
                <div className="text-right text-sm text-muted-foreground">
                  <div>
                    Mejor:{' '}
                    <span className="rounded-md bg-accent/15 px-1.5 py-0.5 font-heading font-semibold tabular-nums text-primary">
                      {formatearTiempo(mejor)}
                    </span>
                  </div>
                  <div>
                    Promedio: <span className="font-heading tabular-nums">{formatearTiempo(promedio)}</span>
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {grupo.intentos.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-muted-foreground">{formatearFecha(i.fechaSesion)}</span>
                    <span
                      className={`font-heading font-medium tabular-nums ${
                        i.tiempoTotalMs === mejor
                          ? 'rounded-md bg-accent/15 px-1.5 py-0.5 text-primary'
                          : 'text-foreground'
                      }`}
                    >
                      {formatearTiempo(i.tiempoTotalMs)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
