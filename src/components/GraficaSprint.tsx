import React from 'react';
import type { PuntoTelemetria } from '../lib/types';
import { formatearTiempo } from '../lib/tiempo';

interface Props {
  telemetria: PuntoTelemetria[];
  tiempoTotalMs: number;
  numeroIntento?: number;
  onCerrar: () => void;
}

export default function GraficaSprint({ telemetria, tiempoTotalMs, numeroIntento, onCerrar }: Props) {
  if (!telemetria || telemetria.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 text-center shadow-2xl">
          <p className="text-muted-foreground mb-4">No hay datos de telemetría suficientes registrados para este intento.</p>
          <button
            onClick={onCerrar}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Cálculos estadísticos
  const aceleraciones = telemetria.map((p) => p.a);
  const maxAcel = Math.max(...aceleraciones);
  const avgAcel = (aceleraciones.reduce((acc, curr) => acc + curr, 0) / aceleraciones.length).toFixed(1);
  const maxPunto = telemetria.find((p) => p.a === maxAcel) || telemetria[0];

  // Velocidad GPS Doppler (m/s a km/h)
  const velocidadesMs = telemetria.map((p) => p.v ?? 0);
  const maxVelocidadMs = Math.max(0, ...velocidadesMs);
  const maxVelocidadKmh = (maxVelocidadMs * 3.6).toFixed(1);

  // Dimensiones del gráfico SVG
  const width = 600;
  const height = 260;
  const padding = { top: 30, right: 30, bottom: 40, left: 45 };

  const minT = 0;
  const maxT = Math.max(tiempoTotalMs, telemetria[telemetria.length - 1].t);
  const rangeT = maxT - minT || 1;

  const yMin = 0;
  const yMax = Math.max(25, Math.ceil(maxAcel * 1.15));
  const rangeY = yMax - yMin;

  // Convertir puntos a coordenadas SVG
  const points = telemetria.map((p) => {
    const x = padding.left + ((p.t - minT) / rangeT) * (width - padding.left - padding.right);
    const y = height - padding.bottom - ((p.a - yMin) / rangeY) * (height - padding.top - padding.bottom);
    return { x, y, t: p.t, a: p.a };
  });

  const pathD = points.reduce(
    (acc, p, idx) => (idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
    ''
  );

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - padding.bottom} L ${points[0].x},${height - padding.bottom} Z`;

  // Coordenada del pico máximo
  const maxX = padding.left + ((maxPunto.t - minT) / rangeT) * (width - padding.left - padding.right);
  const maxY = height - padding.bottom - ((maxPunto.a - yMin) / rangeY) * (height - padding.top - padding.bottom);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl overflow-hidden text-card-foreground">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>📊 Telemetría del Sprint</span>
              {numeroIntento !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Intento #{numeroIntento}
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tiempo Total: <strong className="text-foreground">{formatearTiempo(tiempoTotalMs)}</strong> ({telemetria.length} lecturas capturadas)
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tarjetas de Métricas Rápidas */}
        <div className={`grid ${maxVelocidadMs > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-2.5 mb-4`}>
          <div className="bg-background/60 border border-border rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Pico Fuerza</span>
            <p className="text-base font-black text-emerald-400">{maxAcel.toFixed(1)} <span className="text-[10px] font-normal text-muted-foreground">m/s²</span></p>
          </div>
          <div className="bg-background/60 border border-border rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Fuerza Media</span>
            <p className="text-base font-black text-amber-400">{avgAcel} <span className="text-[10px] font-normal text-muted-foreground">m/s²</span></p>
          </div>
          <div className="bg-background/60 border border-border rounded-xl p-2.5 text-center">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Tiempo Pico</span>
            <p className="text-base font-black text-sky-400">{(maxPunto.t / 1000).toFixed(2)} <span className="text-[10px] font-normal text-muted-foreground">s</span></p>
          </div>
          {maxVelocidadMs > 0 && (
            <div className="bg-background/60 border border-border rounded-xl p-2.5 text-center">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Vel. Punta</span>
              <p className="text-base font-black text-violet-400">{maxVelocidadKmh} <span className="text-[10px] font-normal text-muted-foreground">km/h</span></p>
            </div>
          )}
        </div>

        {/* Gráfico SVG */}
        <div className="w-full bg-background/80 border border-border rounded-xl p-2 relative overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
              <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>

            {/* Guías de red (eje Y) */}
            {[0, 10, 20].map((val) => {
              if (val > yMax) return null;
              const y = height - padding.bottom - ((val - yMin) / rangeY) * (height - padding.top - padding.bottom);
              return (
                <g key={val}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.5">
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Guías de red (eje X - segundos) */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sec) => {
              const tMs = sec * 1000;
              if (tMs > maxT) return null;
              const x = padding.left + ((tMs - minT) / rangeT) * (width - padding.left - padding.right);
              return (
                <g key={sec}>
                  <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <text x={x} y={height - padding.bottom + 16} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5">
                    {sec}s
                  </text>
                </g>
              );
            })}

            {/* Área sombreada bajo la curva */}
            <path d={areaD} fill="url(#gradientArea)" />

            {/* Línea principal del gráfico */}
            <path d={pathD} fill="none" stroke="url(#gradientLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Marcador del punto máximo */}
            <circle cx={maxX} cy={maxY} r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <text x={maxX} y={Math.max(padding.top, maxY - 10)} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#10b981">
              ⚡ {maxAcel.toFixed(1)} m/s²
            </text>
          </svg>
        </div>

        {/* Leyenda y Explicación */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Salida</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Pedaleo</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span> Frenado</span>
          </div>
          <button
            onClick={onCerrar}
            className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
