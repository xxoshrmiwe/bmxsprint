import { useEffect, useMemo, useState } from 'react';
import type { Corredor, Sesion, Intento, Meta } from '../lib/types';
import { listarSesionesPorCorredor, listarIntentosPorCorredor, obtenerMeta, guardarMeta } from '../lib/db';
import { formatearTiempo, formatearRitmo, calcularRitmoMsPor10m } from '../lib/tiempo';
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

// Progreso genérico: sirve tanto para tiempo (ms) como para ritmo (ms/10m),
// ya que ambos son "menor es mejor".
function calcularProgreso(primero: number, mejor: number, objetivo: number): number {
  if (mejor <= objetivo) return 100;
  if (primero <= objetivo) return 0;
  const progreso = ((primero - mejor) / (primero - objetivo)) * 100;
  return Math.min(100, Math.max(0, progreso));
}

export default function DashboardCorredor({ corredor }: Props) {
  const [cargando, setCargando] = useState(true);
  const [sinDatos, setSinDatos] = useState(false);
  const [racha, setRacha] = useState(0);
  const [intentos, setIntentos] = useState<IntentoConDistancia[]>([]);
  const [distanciasDisponibles, setDistanciasDisponibles] = useState<number[]>([]);
  const [distanciaSeleccionada, setDistanciaSeleccionada] = useState<number | null>(null);

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

    const grafico = ultimos30.slice(-8).map((i) => ({ ms: i.tiempoTotalMs, esMejor: i.tiempoTotalMs === mejorMs }));

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

  // El ritmo (tiempo cada 10m) se normaliza entre TODAS las distancias
  // entrenadas, para que una sola meta sirva sin importar cuál se corra hoy.
  const ritmoGlobal = useMemo(() => {
    if (intentos.length === 0) return null;
    const ordenados = [...intentos].sort((a, b) => a.creadoEn - b.creadoEn);
    const ritmos = ordenados.map((i) => calcularRitmoMsPor10m(i.tiempoTotalMs, i.distanciaMetros));
    return { mejor: Math.min(...ritmos), primero: ritmos[0] };
  }, [intentos]);

  async function handleGuardarMeta(e: React.FormEvent) {
    e.preventDefault();
    const segundos = Number(metaTexto);
    if (!segundos || segundos <= 0) return;
    setGuardandoMeta(true);
    setErrorMeta(null);
    try {
      const nuevaMeta = await guardarMeta(corredor.id, segundos * 1000);
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
    return <p className="text-center text-muted-foreground">Cargando estadísticas...</p>;
  }

  if (sinDatos || !stats || !distanciaSeleccionada) {
    return (
      <div className="card text-center text-muted-foreground">
        Todavía no hay entrenamientos en los últimos 30 días. ¡Arranca un "Nuevo entrenamiento" para ver tus
        estadísticas acá!
      </div>
    );
  }

  const alturaBarra = (ms: number) => {
    const valores = stats.grafico.map((g) => g.ms);
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const rango = max - min || 1;
    return 16 + ((max - ms) / rango) * 48;
  };

  const progreso =
    meta && ritmoGlobal ? calcularProgreso(ritmoGlobal.primero, ritmoGlobal.mejor, meta.ritmoObjetivoMsPor10m) : 0;
  const metaLograda = meta && ritmoGlobal ? ritmoGlobal.mejor <= meta.ritmoObjetivoMsPor10m : false;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Últimos 30 días</h2>
          {distanciasDisponibles.length > 1 ? (
            <select
              value={distanciaSeleccionada}
              onChange={(e) => setDistanciaSeleccionada(Number(e.target.value))}
              className="cursor-pointer rounded border border-border bg-white px-1.5 py-0.5 text-xs text-muted-foreground"
              aria-label="Elegir distancia"
            >
              {distanciasDisponibles.map((d) => (
                <option key={d} value={d}>
                  {d} m
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground">{distanciaSeleccionada} m</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-heading text-2xl font-bold tabular-nums text-primary">
              {formatearTiempo(stats.mejorMs)}
            </div>
            <div className="text-xs text-muted-foreground">Mejor (histórico)</div>
          </div>
          <div>
            <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {formatearTiempo(stats.promedioMs)}
            </div>
            <div className="text-xs text-muted-foreground">Promedio</div>
          </div>
          <div>
            <div className="font-heading text-2xl font-bold tabular-nums text-foreground">
              {stats.totalIntentos30}
            </div>
            <div className="text-xs text-muted-foreground">Intentos (30 días)</div>
          </div>
          <div className="flex items-center gap-1">
            <IconoLlama className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <div className="font-heading text-2xl font-bold tabular-nums text-foreground">{racha}</div>
              <div className="text-xs text-muted-foreground">Días seguidos</div>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Ritmo:{' '}
          <span className="font-heading font-semibold tabular-nums text-primary">
            {formatearRitmo(stats.ritmoMejor)}
          </span>
        </p>
        {stats.tendencia && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              stats.tendencia === 'mejor' ? 'text-primary' : 'text-destructive'
            }`}
          >
            {stats.tendencia === 'mejor' ? (
              <IconoFlechaAbajo className="h-4 w-4" />
            ) : (
              <IconoFlechaArriba className="h-4 w-4" />
            )}
            <span>{stats.tendencia === 'mejor' ? 'Bajando el tiempo' : 'Subiendo el tiempo'}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {stats.grafico.length >= 2 && (
          <div className="card">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Progreso reciente — {distanciaSeleccionada} m
            </h2>
            <svg viewBox="0 0 160 64" className="h-16 w-full overflow-visible" preserveAspectRatio="none">
              {stats.grafico.map((g, idx) => {
                const ancho = 160 / stats.grafico.length;
                const alto = alturaBarra(g.ms);
                const x = idx * ancho + ancho * 0.2;
                return (
                  <rect
                    key={idx}
                    x={x}
                    y={64 - alto}
                    width={ancho * 0.6}
                    height={alto}
                    rx={2}
                    className={g.esMejor ? 'fill-accent' : 'fill-primary'}
                  />
                );
              })}
            </svg>
            <p className="mt-1 text-xs text-muted-foreground">Más alto = más rápido. Verde = tu mejor tiempo.</p>
          </div>
        )}

        <div className="card">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <IconoObjetivo className="h-4 w-4" />
            Meta de ritmo
          </h2>

          {!meta && !editandoMeta && (
            <button onClick={() => setEditandoMeta(true)} className="btn-secondary w-full text-sm">
              Definir meta
            </button>
          )}

          {editandoMeta && (
            <form onSubmit={handleGuardarMeta} className="space-y-2">
              {errorMeta && <p className="text-xs text-destructive">{errorMeta}</p>}
              <label className="block text-xs text-muted-foreground" htmlFor="meta-segundos">
                Ritmo objetivo (segundos cada 10 metros)
              </label>
              <div className="flex gap-2">
                <input
                  id="meta-segundos"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={metaTexto}
                  onChange={(e) => setMetaTexto(e.target.value)}
                  placeholder="Ej. 1.75"
                  autoFocus
                  className="input"
                  required
                />
                <button type="submit" disabled={guardandoMeta} className="btn-primary px-4 text-sm">
                  {guardandoMeta ? '...' : 'Guardar'}
                </button>
              </div>
            </form>
          )}

          {meta && !editandoMeta && ritmoGlobal && (
            <div className="space-y-2">
              {metaLograda ? (
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <IconoCheck className="h-5 w-5 text-accent" />
                  ¡Meta lograda!
                </div>
              ) : (
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Mejor ritmo:{' '}
                <span className="font-heading font-semibold tabular-nums text-primary">
                  {formatearRitmo(ritmoGlobal.mejor)}
                </span>{' '}
                — Meta:{' '}
                <span className="font-heading font-semibold tabular-nums text-primary">
                  {formatearRitmo(meta.ritmoObjetivoMsPor10m)}
                </span>
              </p>
              <button
                onClick={() => {
                  setMetaTexto((meta.ritmoObjetivoMsPor10m / 1000).toString());
                  setEditandoMeta(true);
                }}
                className="btn-ghost text-xs"
              >
                Cambiar meta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
