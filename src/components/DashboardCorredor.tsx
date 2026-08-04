import { useEffect, useMemo, useState } from 'react';
import type { Corredor, Sesion, Intento, Meta } from '../lib/types';
import { listarSesionesPorCorredor, listarIntentosPorCorredor, obtenerMeta, guardarMeta } from '../lib/db';
import { formatearTiempo, formatearRitmo, calcularRitmoMsPor10m, pronosticarTiempoMs } from '../lib/tiempo';
import { IconoLlama, IconoObjetivo, IconoFlechaArriba, IconoFlechaAbajo, IconoCheck } from './Icono';

interface Props {
  corredor: Corredor;
}

const TREINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

interface IntentoConDistancia extends Intento {
  distanciaMetros: number;
}

function calcularRacha(sesiones: Sesion[]): number {
  const dias = new Set(sesiones.map((s) => new Date(s.fecha).toDateString()));
  const cursor = new Date();
  if (!dias.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let racha = 0;
  while (dias.has(cursor.toDateString())) {
    racha++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

export default function DashboardCorredor({ corredor }: Props) {
  const [cargando, setCargando] = useState(true);
  const [sinDatos, setSinDatos] = useState(false);
  const [racha, setRacha] = useState(0);
  const [intentos, setIntentos] = useState<IntentoConDistancia[]>([]);
  const [distanciasDisponibles, setDistanciasDisponibles] = useState<number[]>([]);
  const [distanciaSeleccionada, setDistanciaSeleccionada] = useState<number | null>(null);
  const [distanciaPronostico, setDistanciaPronostico] = useState<number>(20);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaTexto, setMetaTexto] = useState('');
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const [errorMeta, setErrorMeta] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setCargando(true);
      const [sesiones, intentosCorredor, metaActual] = await Promise.all([
        listarSesionesPorCorredor(corredor.id),
        listarIntentosPorCorredor(corredor.id),
        obtenerMeta(corredor.id)
      ]);

      setRacha(calcularRacha(sesiones));
      setMeta(metaActual);

      const sesionPorId = new Map<string, Sesion>(sesiones.map((s) => [s.id, s]));
      const intentosConDistancia: IntentoConDistancia[] = intentosCorredor
        .map((i) => {
          const sesion = sesionPorId.get(i.sesionId);
          return sesion ? { ...i, distanciaMetros: sesion.distanciaMetros } : null;
        })
        .filter((i): i is IntentoConDistancia => i !== null);

      setIntentos(intentosConDistancia);

      const ahora = Date.now();
      const ultimos30 = intentosConDistancia.filter((i) => i.creadoEn >= ahora - TREINTA_DIAS_MS);

      if (ultimos30.length === 0) {
        setSinDatos(true);
        setCargando(false);
        return;
      }

      const conteoPorDistancia = new Map<number, number>();
      for (const i of ultimos30) {
        conteoPorDistancia.set(i.distanciaMetros, (conteoPorDistancia.get(i.distanciaMetros) ?? 0) + 1);
      }
      const distancias = Array.from(conteoPorDistancia.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([d]) => d);

      setDistanciasDisponibles(distancias);
      setDistanciaSeleccionada(distancias[0]);
      setDistanciaPronostico(distancias[0] || 20);
      setCargando(false);
    })();
  }, [corredor.id]);

  const stats = useMemo(() => {
    if (!distanciaSeleccionada) return null;
    const ahora = Date.now();
    const historico = intentos
      .filter((i) => i.distanciaMetros === distanciaSeleccionada)
      .sort((a, b) => a.creadoEn - b.creadoEn);
    const ultimos30 = historico.filter((i) => i.creadoEn >= ahora - TREINTA_DIAS_MS);
    if (historico.length === 0 || ultimos30.length === 0) return null;

    const mejorMs = Math.min(...historico.map((i) => i.tiempoTotalMs));
    const primerMs = historico[0].tiempoTotalMs;
    const promedioMs = ultimos30.reduce((acc, i) => acc + i.tiempoTotalMs, 0) / ultimos30.length;

    let tendencia: 'mejor' | 'peor' | null = null;
    if (ultimos30.length >= 4) {
      const mitad = Math.floor(ultimos30.length / 2);
      const promedioAntes = ultimos30.slice(0, mitad).reduce((a, i) => a + i.tiempoTotalMs, 0) / mitad;
      const promedioDespues =
        ultimos30.slice(mitad).reduce((a, i) => a + i.tiempoTotalMs, 0) / (ultimos30.length - mitad);
      tendencia = promedioDespues < promedioAntes ? 'mejor' : 'peor';
    }

    const ultimosSprints = ultimos30.slice(-8);
    const grafico = ultimosSprints.map((i) => ({
      numero: i.numero,
      ms: i.tiempoTotalMs,
      esMejor: i.tiempoTotalMs === mejorMs
    }));

    return {
      mejorMs,
      primerMs,
      promedioMs,
      totalIntentos30: ultimos30.length,
      tendencia,
      grafico,
      ritmoMejor: calcularRitmoMsPor10m(mejorMs, distanciaSeleccionada)
    };
  }, [intentos, distanciaSeleccionada]);

  const ritmoGlobal = useMemo(() => {
    if (intentos.length === 0) return null;
    const ordenados = [...intentos].sort((a, b) => a.creadoEn - b.creadoEn);
    const ritmos = ordenados.map((i) => calcularRitmoMsPor10m(i.tiempoTotalMs, i.distanciaMetros));
    return { mejor: Math.min(...ritmos), primero: ritmos[0] };
  }, [intentos]);

  const tiempoPronosticado = useMemo(() => {
    if (!ritmoGlobal || distanciaPronostico <= 0) return null;
    return pronosticarTiempoMs(ritmoGlobal.mejor, distanciaPronostico);
  }, [ritmoGlobal, distanciaPronostico]);

  async function handleGuardarMeta(e: React.FormEvent) {
    e.preventDefault();
    const segundosObjetivo = Number(metaTexto);
    if (!segundosObjetivo || segundosObjetivo <= 0 || !distanciaSeleccionada) return;
    setGuardandoMeta(true);
    setErrorMeta(null);
    try {
      const ritmoMsPor10m = (segundosObjetivo * 1000) / (distanciaSeleccionada / 10);
      const nuevaMeta = await guardarMeta(corredor.id, ritmoMsPor10m);
      setMeta(nuevaMeta);
      setEditandoMeta(false);
      setMetaTexto('');
    } catch (err) {
      setErrorMeta(err instanceof Error ? err.message : 'No se pudo guardar la meta.');
    } finally {
      setGuardandoMeta(false);
    }
  }

  if (cargando) {
    return <p className="p-6 text-center text-muted-foreground">Cargando estadísticas...</p>;
  }

  if (sinDatos || !stats || !distanciaSeleccionada) {
    return (
      <div className="card text-center text-muted-foreground p-8">
        Todavía no hay entrenamientos en los últimos 30 días. ¡Inicia un "Nuevo entrenamiento" para ver tus
        estadísticas acá!
      </div>
    );
  }

  const tiempoObjetivoMs = meta && distanciaSeleccionada
    ? meta.ritmoObjetivoMsPor10m * (distanciaSeleccionada / 10)
    : null;

  const metaLograda = Boolean(tiempoObjetivoMs && stats && stats.mejorMs <= tiempoObjetivoMs);
  const porcentajeProgreso = Boolean(tiempoObjetivoMs && stats)
    ? Math.min(100, Math.max(0, (tiempoObjetivoMs! / stats.mejorMs) * 100))
    : 0;
  const faltanSegundos = Boolean(tiempoObjetivoMs && stats && !metaLograda)
    ? (stats.mejorMs - tiempoObjetivoMs!) / 1000
    : 0;

  // Cálculo de alturas del gráfico
  const tiemposGrafico = stats.grafico.map((g) => g.ms);
  const maxTiempo = Math.max(...tiemposGrafico);
  const minTiempo = Math.min(...tiemposGrafico);
  const rangoTiempo = maxTiempo - minTiempo || 1;

  return (
    <div className="space-y-5">
      {/* SELECCIÓN DE DISTANCIA (Pestañas de Selección) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Estadísticas de Entrenamiento</h2>
          <p className="text-xs text-muted-foreground">Resumen de rendimiento de los últimos 30 días</p>
        </div>

        {distanciasDisponibles.length > 1 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface p-1 text-xs">
            <span className="px-2 font-medium text-muted-foreground">Distancia:</span>
            {distanciasDisponibles.map((d) => (
              <button
                key={d}
                onClick={() => setDistanciaSeleccionada(d)}
                className={`cursor-pointer rounded px-2.5 py-1 font-bold transition-all ${
                  distanciaSeleccionada === d
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* METRICAS PRINCIPALES (Grid de 4 tarjetas ordenadas) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Mejor Tiempo */}
        <div className="card space-y-1 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            🏆 Mejor ({distanciaSeleccionada}m)
          </span>
          <div className="font-heading text-2xl font-extrabold tabular-nums text-primary">
            {formatearTiempo(stats.mejorMs)}
          </div>
          {stats.tendencia && (
            <div
              className={`flex items-center gap-1 text-[11px] font-bold ${
                stats.tendencia === 'mejor' ? 'text-emerald-600' : 'text-destructive'
              }`}
            >
              {stats.tendencia === 'mejor' ? (
                <IconoFlechaAbajo className="h-3.5 w-3.5" />
              ) : (
                <IconoFlechaArriba className="h-3.5 w-3.5" />
              )}
              <span>{stats.tendencia === 'mejor' ? 'Mejorando' : 'Subiendo'}</span>
            </div>
          )}
        </div>

        {/* Promedio */}
        <div className="card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            ⏱️ Promedio ({distanciaSeleccionada}m)
          </span>
          <div className="font-heading text-2xl font-extrabold tabular-nums text-foreground">
            {formatearTiempo(stats.promedioMs)}
          </div>
          <div className="text-[11px] text-muted-foreground">De 30 días</div>
        </div>

        {/* Intentos */}
        <div className="card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            📊 Sprints
          </span>
          <div className="font-heading text-2xl font-extrabold tabular-nums text-foreground">
            {stats.totalIntentos30}
          </div>
          <div className="text-[11px] text-muted-foreground">En {distanciaSeleccionada} metros</div>
        </div>

        {/* Racha */}
        <div className="card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            🔥 Racha Activa
          </span>
          <div className="flex items-center gap-1">
            <IconoLlama className="h-6 w-6 text-destructive shrink-0" />
            <div className="font-heading text-2xl font-extrabold tabular-nums text-foreground">
              {racha}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">Días seguidos</div>
        </div>
      </div>

      {/* SECCIÓN 2 COLUMNAS: GRÁFICO DE PROGRESO + META */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* GRÁFICO DE PROGRESO RECIENTE (Claridad Visual de Tiempos) */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              📈 Evolución de Tiempos ({distanciaSeleccionada} m)
            </h3>
            <span className="text-[10px] text-muted-foreground">Últimos {stats.grafico.length} sprints</span>
          </div>

          <div className="pt-4 pb-2">
            <div className="flex items-end justify-between gap-1.5 h-36">
              {stats.grafico.map((g, idx) => {
                // Cálculo proporcional: barra más alta = menor tiempo (sprint más rápido)
                const alturaPorcentaje = Math.max(25, Math.min(100, 100 - ((g.ms - minTiempo) / rangoTiempo) * 70));

                return (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end gap-1">
                    {/* Etiqueta de Tiempo arriba de la barra */}
                    <span
                      className={`text-[10px] font-bold tabular-nums ${
                        g.esMejor ? 'text-emerald-600 font-extrabold' : 'text-muted-foreground'
                      }`}
                    >
                      {formatearTiempo(g.ms)}
                    </span>

                    {/* Barra de Tiempo */}
                    <div className="w-full flex justify-center h-full items-end">
                      <div
                        style={{ height: `${alturaPorcentaje}%` }}
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                          g.esMejor
                            ? 'bg-emerald-500 shadow-md shadow-emerald-500/20'
                            : 'bg-primary/80 hover:bg-primary'
                        }`}
                        title={`Sprint #${g.numero}: ${formatearTiempo(g.ms)}`}
                      />
                    </div>

                    {/* Etiqueta del Número de Sprint */}
                    <span className="text-[10px] text-muted-foreground/70 tabular-nums">#{g.numero}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            🟢 La barra verde resalta tu mejor récord en esta distancia.
          </p>
        </div>

        {/* TARJETA DE META POR DISTANCIA */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <IconoObjetivo className="h-4 w-4 text-primary" />
              Meta en {distanciaSeleccionada} m
            </h3>
          </div>

          {!meta && !editandoMeta && (
            <button
              onClick={() => {
                setMetaTexto('5.00');
                setEditandoMeta(true);
              }}
              className="btn-secondary w-full py-3 text-sm font-semibold"
            >
              + Definir meta para {distanciaSeleccionada}m
            </button>
          )}

          {editandoMeta && (
            <form onSubmit={handleGuardarMeta} className="space-y-3">
              {errorMeta && <p className="text-xs text-destructive">{errorMeta}</p>}
              <label className="block text-xs text-muted-foreground font-medium" htmlFor="meta-segundos">
                Tiempo objetivo para {distanciaSeleccionada}m (segundos):
              </label>
              <div className="flex gap-2">
                <input
                  id="meta-segundos"
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={metaTexto}
                  onChange={(e) => setMetaTexto(e.target.value)}
                  placeholder="Ej. 5.00"
                  autoFocus
                  className="input flex-1"
                  required
                />
                <button type="submit" disabled={guardandoMeta} className="btn-primary px-4 text-sm font-semibold">
                  {guardandoMeta ? '...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}

          {meta && !editandoMeta && tiempoObjetivoMs && stats && (
            <div className="space-y-3 pt-1">
              {metaLograda ? (
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                  <IconoCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>¡Meta lograda en {distanciaSeleccionada}m! 🎉</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>Progreso hacia la meta</span>
                    <span className="text-primary">Faltan {faltanSegundos.toFixed(2)}s</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface border border-border/50">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${porcentajeProgreso}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs bg-surface p-3 rounded-lg border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px]">MEJOR TIEMPO</span>
                  <span className="font-heading font-extrabold text-base text-foreground tabular-nums">
                    {formatearTiempo(stats.mejorMs)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px]">TIEMPO META</span>
                  <span className="font-heading font-extrabold text-base text-primary tabular-nums">
                    {formatearTiempo(tiempoObjetivoMs)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setMetaTexto((tiempoObjetivoMs / 1000).toFixed(2));
                  setEditandoMeta(true);
                }}
                className="btn-ghost text-xs -ml-2"
              >
                ✏️ Cambiar meta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PRONOSTICADOR INTERACTIVO DE TIEMPOS POR METROS */}
      {ritmoGlobal && (
        <div className="card border-primary/20 bg-primary/5 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span>⏱️</span> Pronosticador de Tiempos BMX
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calcula tu tiempo estimado para cualquier distancia según tu mejor ritmo de velocidad.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="distancia-pronostico" className="block text-xs font-semibold text-muted-foreground">
                Selecciona una distancia para probar:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[10, 15, 20, 25, 30, 40, 50].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDistanciaPronostico(d)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                      distanciaPronostico === d
                        ? 'bg-primary text-white border-primary shadow-sm scale-105'
                        : 'bg-white text-muted-foreground border-border hover:bg-surface'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {tiempoPronosticado !== null && (
              <div className="rounded-xl border border-primary/30 bg-white p-3 text-center sm:min-w-[170px] shadow-sm">
                <div className="text-[11px] font-semibold text-muted-foreground">Tiempo Estimado ({distanciaPronostico}m)</div>
                <div className="font-heading text-3xl font-extrabold tabular-nums text-primary">
                  {formatearTiempo(tiempoPronosticado)}
                </div>
                <div className="text-[10px] text-muted-foreground">Incluye +1.15s de arranque de gate</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
