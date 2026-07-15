import { useEffect, useState } from 'react';
import type { Corredor, Sesion, Intento } from '../lib/types';
import { listarSesionesPorCorredor, listarIntentosPorCorredor } from '../lib/db';

interface Props {
  corredor: Corredor;
  onVolver: () => void;
}

function formatearTiempo(ms: number): string {
  const totalCentesimas = Math.round(ms / 10);
  const centesimas = totalCentesimas % 100;
  const totalSeg = Math.floor(totalCentesimas / 100);
  const seg = totalSeg % 60;
  const min = Math.floor(totalSeg / 60);
  const segTxt = min > 0 ? seg.toString().padStart(2, '0') : seg.toString();
  const prefijo = min > 0 ? `${min}:` : '';
  return `${prefijo}${segTxt}.${centesimas.toString().padStart(2, '0')}`;
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
    return <p className="p-4 text-center text-slate-400">Cargando historial...</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <button onClick={onVolver} className="text-sm text-slate-500 hover:text-slate-700">
        ← {corredor.nombre}
      </button>

      <h1 className="text-xl font-bold text-slate-900">Historial</h1>
      <p className="text-slate-500">{totalSesiones} sesiones registradas</p>

      {grupos.length === 0 ? (
        <p className="text-slate-400">Todavía no hay tiempos guardados.</p>
      ) : (
        grupos.map((grupo) => {
          const mejor = Math.min(...grupo.intentos.map((i) => i.tiempoTotalMs));
          const promedio = grupo.intentos.reduce((acc, i) => acc + i.tiempoTotalMs, 0) / grupo.intentos.length;

          return (
            <section key={grupo.distanciaMetros} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{grupo.distanciaMetros} m</h2>
                <div className="text-right text-sm text-slate-500">
                  <div>
                    Mejor: <span className="font-mono font-semibold text-emerald-700">{formatearTiempo(mejor)}</span>
                  </div>
                  <div>
                    Promedio: <span className="font-mono">{formatearTiempo(promedio)}</span>
                  </div>
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {grupo.intentos.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-slate-400">{formatearFecha(i.fechaSesion)}</span>
                    <span
                      className={`font-mono font-medium ${
                        i.tiempoTotalMs === mejor ? 'text-emerald-700' : 'text-slate-900'
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
