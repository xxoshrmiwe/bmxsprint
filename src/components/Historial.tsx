import { useEffect, useState } from 'react';
import type { Corredor, Sesion, Intento } from '../lib/types';
import {
  listarSesionesPorCorredor,
  listarIntentosPorCorredor,
  eliminarIntento,
  eliminarSesion
} from '../lib/db';
import { formatearTiempo } from '../lib/tiempo';
import { IconoBasura } from './Icono';

interface Props {
  corredor: Corredor;
  onVolver: () => void;
}

function formatearFechaCompleta(ms: number): string {
  return new Date(ms).toLocaleDateString('es', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

interface SesionConIntentos extends Sesion {
  intentos: Intento[];
}

export default function Historial({ corredor, onVolver }: Props) {
  const [cargando, setCargando] = useState(true);
  const [sesionesConIntentos, setSesionesConIntentos] = useState<SesionConIntentos[]>([]);
  const [vistaModo, setVistaModo] = useState<'sesiones' | 'distancias'>('sesiones');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  async function cargarHistorial() {
    setCargando(true);
    try {
      const [sesiones, todosIntentos] = await Promise.all([
        listarSesionesPorCorredor(corredor.id),
        listarIntentosPorCorredor(corredor.id)
      ]);

      const intentosPorSesion = new Map<string, Intento[]>();
      for (const i of todosIntentos) {
        const lista = intentosPorSesion.get(i.sesionId) ?? [];
        lista.push(i);
        intentosPorSesion.set(i.sesionId, lista);
      }

      const listaCompleta: SesionConIntentos[] = sesiones
        .map((s) => {
          const intentos = (intentosPorSesion.get(s.id) ?? []).sort((a, b) => a.numero - b.numero);
          return { ...s, intentos };
        })
        .filter((s) => s.intentos.length > 0) // Omitir sesiones vacías
        .sort((a, b) => b.fecha - a.fecha);

      setSesionesConIntentos(listaCompleta);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarHistorial();
  }, [corredor.id]);

  async function handleBorrarIntento(intentoId: string, sesionId: string) {
    if (!window.confirm('¿Borrar este intento de la sesión?')) return;
    setEliminandoId(intentoId);
    try {
      await eliminarIntento(intentoId);
      setSesionesConIntentos((prev) =>
        prev
          .map((s) => {
            if (s.id !== sesionId) return s;
            const nuevosIntentos = s.intentos.filter((i) => i.id !== intentoId);
            return { ...s, intentos: nuevosIntentos };
          })
          .filter((s) => s.intentos.length > 0)
      );
    } catch (err) {
      alert('No se pudo eliminar el intento. Intenta de nuevo.');
      console.error(err);
    } finally {
      setEliminandoId(null);
    }
  }

  async function handleBorrarSesion(sesionId: string, fechaMs: number, distancia: number) {
    const fechaTxt = formatearFechaCompleta(fechaMs);
    if (
      !window.confirm(
        `¿Seguro que querés eliminar la sesión completa del ${fechaTxt} (${distancia}m)? Se borrarán todos sus sprints.`
      )
    ) {
      return;
    }

    setEliminandoId(sesionId);
    try {
      await eliminarSesion(sesionId);
      setSesionesConIntentos((prev) => prev.filter((s) => s.id !== sesionId));
    } catch (err) {
      alert('No se pudo eliminar la sesión. Intenta de nuevo.');
      console.error(err);
    } finally {
      setEliminandoId(null);
    }
  }

  if (cargando) {
    return <p className="p-6 text-center text-muted-foreground">Cargando historial...</p>;
  }

  const totalIntentosValidos = sesionesConIntentos.reduce((acc, s) => acc + s.intentos.length, 0);

  // Agrupación alternativa por Distancia si el usuario elige ver por distancias
  const distanciasUnicas = Array.from(new Set(sesionesConIntentos.map((s) => s.distanciaMetros))).sort(
    (a, b) => a - b
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      <button onClick={onVolver} className="btn-ghost">
        ← {corredor.nombre}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial de Entrenamientos</h1>
          <p className="text-sm text-muted-foreground">
            {sesionesConIntentos.length} sesión(es) • {totalIntentosValidos} sprint(s) registrados
          </p>
        </div>

        <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs">
          <button
            onClick={() => setVistaModo('sesiones')}
            className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors ${
              vistaModo === 'sesiones' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Por Días
          </button>
          <button
            onClick={() => setVistaModo('distancias')}
            className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors ${
              vistaModo === 'distancias' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Por Distancia
          </button>
        </div>
      </div>

      {sesionesConIntentos.length === 0 ? (
        <div className="card text-center p-8">
          <p className="text-muted-foreground">Todavía no hay tiempos o entrenamientos guardados.</p>
        </div>
      ) : vistaModo === 'sesiones' ? (
        /* VISTA AGRUPADA POR DÍA / SESIÓN */
        <div className="space-y-4">
          {sesionesConIntentos.map((s) => {
            const tiemposMs = s.intentos.map((i) => i.tiempoTotalMs);
            const mejorTiempo = Math.min(...tiemposMs);
            const promedioMs = tiemposMs.reduce((acc, v) => acc + v, 0) / tiemposMs.length;

            return (
              <section key={s.id} className="card space-y-3">
                {/* Cabecera de la Sesión */}
                <div className="flex items-start justify-between border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg font-bold text-foreground capitalize">
                        {formatearFechaCompleta(s.fecha)}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {s.distanciaMetros} m
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{s.intentos.length} sprint(s)</span>
                      <span>•</span>
                      <span>
                        Mejor:{' '}
                        <strong className="font-heading text-primary">{formatearTiempo(mejorTiempo)}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Promedio: <strong className="font-heading">{formatearTiempo(promedioMs)}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBorrarSesion(s.id, s.fecha, s.distanciaMetros)}
                    disabled={eliminandoId === s.id}
                    title="Eliminar esta sesión completa"
                    className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <IconoBasura className="h-4 w-4" />
                  </button>
                </div>

                {/* Grilla / Lista de Intentos de la Sesión */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {s.intentos.map((intento) => {
                    const esMejor = intento.tiempoTotalMs === mejorTiempo;
                    return (
                      <div
                        key={intento.id}
                        className={`group relative flex items-center justify-between rounded-lg border p-2 text-xs transition-all ${
                          esMejor
                            ? 'border-accent/40 bg-accent/10 font-bold text-foreground'
                            : 'border-border bg-surface hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground tabular-nums">#{intento.numero}</span>
                          <span className="font-heading text-sm tabular-nums text-foreground">
                            {formatearTiempo(intento.tiempoTotalMs)}
                          </span>
                          {esMejor && <span title="Mejor tiempo de la sesión" className="text-xs">⭐</span>}
                        </div>

                        <button
                          onClick={() => handleBorrarIntento(intento.id, s.id)}
                          disabled={eliminandoId === intento.id}
                          title="Borrar intento"
                          className="cursor-pointer text-muted-foreground opacity-60 transition-opacity hover:opacity-100 hover:text-destructive group-hover:opacity-100"
                        >
                          <IconoBasura className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* VISTA AGRUPADA POR DISTANCIA */
        <div className="space-y-6">
          {distanciasUnicas.map((distancia) => {
            const sesionesDeDistancia = sesionesConIntentos.filter((s) => s.distanciaMetros === distancia);
            const todosLosIntentos = sesionesDeDistancia.flatMap((s) => s.intentos);
            const mejorGlobal = Math.min(...todosLosIntentos.map((i) => i.tiempoTotalMs));
            const promedioGlobal =
              todosLosIntentos.reduce((acc, i) => acc + i.tiempoTotalMs, 0) / todosLosIntentos.length;

            return (
              <section key={distancia} className="card space-y-4">
                <div className="flex items-baseline justify-between border-b border-border pb-3">
                  <h2 className="font-heading text-2xl font-bold text-foreground">{distancia} metros</h2>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>
                      Récord:{' '}
                      <span className="font-heading font-bold text-primary text-sm">{formatearTiempo(mejorGlobal)}</span>
                    </div>
                    <div>Promed: {formatearTiempo(promedioGlobal)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {sesionesDeDistancia.map((s) => {
                    const mejorDeSesion = Math.min(...s.intentos.map((i) => i.tiempoTotalMs));
                    return (
                      <div key={s.id} className="rounded-lg border border-border/60 bg-surface/50 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground capitalize">
                            {formatearFechaCompleta(s.fecha)} ({s.intentos.length} sprints)
                          </span>
                          <button
                            onClick={() => handleBorrarSesion(s.id, s.fecha, s.distanciaMetros)}
                            className="cursor-pointer text-muted-foreground hover:text-destructive"
                            title="Eliminar sesión"
                          >
                            <IconoBasura className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {s.intentos.map((intento) => {
                            const esMejor = intento.tiempoTotalMs === mejorDeSesion;
                            return (
                              <div
                                key={intento.id}
                                className={`flex items-center gap-1 rounded border px-2 py-1 text-xs tabular-nums ${
                                  esMejor
                                    ? 'border-accent/40 bg-accent/15 font-bold text-foreground'
                                    : 'border-border bg-white text-muted-foreground'
                                }`}
                              >
                                <span>#{intento.numero}: {formatearTiempo(intento.tiempoTotalMs)}</span>
                                <button
                                  onClick={() => handleBorrarIntento(intento.id, s.id)}
                                  className="cursor-pointer text-muted-foreground hover:text-destructive"
                                  title="Borrar intento"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
