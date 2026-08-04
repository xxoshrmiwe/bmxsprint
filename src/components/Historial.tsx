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
import GraficaSprint from './GraficaSprint';

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
  const [distanciaFiltro, setDistanciaFiltro] = useState<number | 'todas'>('todas');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [intentoGrafica, setIntentoGrafica] = useState<Intento | null>(null);

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
        .filter((s) => s.intentos.length > 0)
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
    if (!window.confirm('¿Eliminar este intento de la sesión?')) return;
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
      alert('No se pudo eliminar el intento.');
      console.error(err);
    } finally {
      setEliminandoId(null);
    }
  }

  async function handleBorrarSesion(sesionId: string, fechaMs: number, distancia: number) {
    const fechaTxt = formatearFechaCompleta(fechaMs);
    const respuesta = window.prompt(
      `⚠️ ELIMINAR SESIÓN COMPLETA:\nPara confirmar el borrado de la sesión del ${fechaTxt} (${distancia}m) y todos sus sprints, escribe la palabra BORRAR:`
    );

    if (!respuesta || respuesta.trim().toUpperCase() !== 'BORRAR') {
      if (respuesta !== null) {
        alert('Palabra de confirmación incorrecta. No se eliminó la sesión.');
      }
      return;
    }

    setEliminandoId(sesionId);
    try {
      await eliminarSesion(sesionId);
      setSesionesConIntentos((prev) => prev.filter((s) => s.id !== sesionId));
    } catch (err) {
      alert('No se pudo eliminar la sesión.');
      console.error(err);
    } finally {
      setEliminandoId(null);
    }
  }

  if (cargando) {
    return <p className="p-6 text-center text-muted-foreground">Cargando historial...</p>;
  }

  const distanciasDisponibles = Array.from(
    new Set(sesionesConIntentos.map((s) => s.distanciaMetros))
  ).sort((a, b) => a - b);

  const sesionesFiltradas = sesionesConIntentos.filter((s) => {
    if (distanciaFiltro === 'todas') return true;
    return s.distanciaMetros === distanciaFiltro;
  });

  const totalSprints = sesionesFiltradas.reduce((acc, s) => acc + s.intentos.length, 0);

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-12">
      {/* Botón Volver */}
      <button onClick={onVolver} className="btn-ghost -ml-2 text-sm font-medium">
        ← Volver al Panel ({corredor.nombre})
      </button>

      {/* Encabezado Principal */}
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">Historial</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sesionesFiltradas.length} sesión(es) • {totalSprints} sprint(s) registrados
        </p>
      </div>

      {/* TABS DE DISTANCIA (Móvil Frecuente / Scroll Horizontal) */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
        <button
          onClick={() => setDistanciaFiltro('todas')}
          className={`cursor-pointer shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
            distanciaFiltro === 'todas'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
              : 'border border-border bg-white text-muted-foreground hover:bg-surface'
          }`}
        >
          Todas las Distancias
        </button>

        {distanciasDisponibles.map((dist) => (
          <button
            key={dist}
            onClick={() => setDistanciaFiltro(dist)}
            className={`cursor-pointer shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
              distanciaFiltro === dist
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                : 'border border-border bg-white text-muted-foreground hover:bg-surface'
            }`}
          >
            {dist} Metros
          </button>
        ))}
      </div>

      {/* LISTA DE SESIONES AGRUPADAS POR DÍA */}
      {sesionesFiltradas.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay entrenamientos guardados en este filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sesionesFiltradas.map((sesion) => {
            const tiemposMs = sesion.intentos.map((i) => i.tiempoTotalMs);
            const mejorTiempo = Math.min(...tiemposMs);
            const promedioMs = tiemposMs.reduce((acc, v) => acc + v, 0) / tiemposMs.length;

            return (
              <section key={sesion.id} className="card space-y-4 shadow-sm">
                {/* Cabecera de la Sesión */}
                <div className="flex items-start justify-between border-b border-border/70 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg font-bold text-foreground capitalize">
                        {formatearFechaCompleta(sesion.fecha)}
                      </span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary border border-primary/20">
                        {sesion.distanciaMetros} m
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{sesion.intentos.length} sprint(s)</span>
                      <span>•</span>
                      <span>
                        Mejor:{' '}
                        <strong className="font-heading text-sm text-primary font-bold">
                          {formatearTiempo(mejorTiempo)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Promed: <strong className="font-heading font-semibold text-foreground">{formatearTiempo(promedioMs)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Botón de Borrar Sesión Completa en Rojo */}
                  <button
                    onClick={() => handleBorrarSesion(sesion.id, sesion.fecha, sesion.distanciaMetros)}
                    disabled={eliminandoId === sesion.id}
                    title="Eliminar sesión completa"
                    className="cursor-pointer flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                  >
                    <IconoBasura className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Borrar Sesión</span>
                  </button>
                </div>

                {/* LISTA VERTICAL DE INTENTOS */}
                <div className="divide-y divide-border/60">
                  {sesion.intentos.map((intento) => {
                    const esMejor = intento.tiempoTotalMs === mejorTiempo;
                    let vMs = Math.max(0, ...(intento.telemetria?.map((p) => p.v ?? 0) ?? []));
                    if (vMs === 0 && intento.telemetria && intento.telemetria.length > 1) {
                      let vInteg = 0;
                      let maxInteg = 0;
                      for (let idx = 1; idx < intento.telemetria.length; idx++) {
                        const dt = (intento.telemetria[idx].t - intento.telemetria[idx - 1].t) / 1000;
                        const a = intento.telemetria[idx].a;
                        if (a > 1.5) {
                          vInteg += a * dt * 0.45;
                          if (vInteg > maxInteg) maxInteg = vInteg;
                        } else {
                          vInteg = Math.max(0, vInteg - 2.0 * dt);
                        }
                      }
                      vMs = maxInteg;
                    }
                    const vKmh = (vMs * 3.6).toFixed(1);
                    return (
                      <div
                        key={intento.id}
                        className={`flex items-center justify-between py-3 px-1 transition-colors ${
                          esMejor ? 'bg-emerald-500/5 -mx-1 px-2 rounded-lg' : ''
                        }`}
                      >
                        {/* Lado Izquierdo: Número, Tiempo, Velocidad Punta y Récord */}
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-bold text-muted-foreground/80 tabular-nums">
                            #{intento.numero}
                          </span>
                          <div>
                            <span className="font-heading text-lg font-bold tabular-nums text-foreground block">
                              {formatearTiempo(intento.tiempoTotalMs)}
                            </span>
                            {intento.telemetria && intento.telemetria.length > 0 && (
                              <span className="text-[10px] font-bold text-violet-500 block -mt-1">
                                ⚡ {vKmh} km/h
                              </span>
                            )}
                          </div>

                          {esMejor && (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600">
                              ⭐ Récord
                            </span>
                          )}
                        </div>

                        {/* Lado Derecho: BOTÓN TELEMETRÍA Y BOTÓN BORRAR */}
                        <div className="flex items-center gap-2">
                          {intento.telemetria && intento.telemetria.length > 0 && (
                            <button
                              onClick={() => setIntentoGrafica(intento)}
                              className="cursor-pointer flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white"
                              title="Ver gráfica de telemetría del sprint"
                            >
                              📊 Grafica
                            </button>
                          )}
                          <button
                            onClick={() => handleBorrarIntento(intento.id, sesion.id)}
                            disabled={eliminandoId === intento.id}
                            title="Eliminar intento"
                            className="cursor-pointer flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive hover:text-white disabled:opacity-50"
                          >
                            <IconoBasura className="h-3.5 w-3.5" />
                            <span>Borrar</span>
                          </button>
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

      {/* Modal de Gráfica de Telemetría */}
      {intentoGrafica && intentoGrafica.telemetria && (
        <GraficaSprint
          telemetria={intentoGrafica.telemetria}
          tiempoTotalMs={intentoGrafica.tiempoTotalMs}
          numeroIntento={intentoGrafica.numero}
          onCerrar={() => setIntentoGrafica(null)}
        />
      )}
    </div>
  );
}
