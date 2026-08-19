import React, { useRef, useState } from 'react';
import type { PuntoTelemetria } from '../lib/types';
import { formatearTiempo } from '../lib/tiempo';

interface Props {
  nombreCorredor: string;
  distanciaMetros: number;
  tiempoTotalMs: number;
  numeroIntento?: number;
  telemetria?: PuntoTelemetria[];
  onCerrar: () => void;
}

export default function TarjetasResumen({
  nombreCorredor,
  distanciaMetros,
  tiempoTotalMs,
  numeroIntento,
  telemetria = [],
  onCerrar
}: Props) {
  const [compartiendo, setCompartiendo] = useState(false);

  // Cálculos estadísticos
  const aceleraciones = telemetria.map((p) => p.a);
  const maxAcel = aceleraciones.length > 0 ? Math.max(...aceleraciones) : 0;
  const velocidades = telemetria.map((p) => p.v ?? 0);
  let maxVelMs = Math.max(0, ...velocidades);

  if (maxVelMs === 0 && telemetria.length > 1) {
    let vInteg = 0;
    let maxVInteg = 0;
    for (let i = 1; i < telemetria.length; i++) {
      const dt = (telemetria[i].t - telemetria[i - 1].t) / 1000;
      const a = telemetria[i].a;
      if (a > 1.5) {
        vInteg += a * dt * 0.45;
        if (vInteg > maxVInteg) maxVInteg = vInteg;
      } else {
        vInteg = Math.max(0, vInteg - 2.0 * dt);
      }
    }
    maxVelMs = maxVInteg;
  }

  const maxVelKmh = (maxVelMs * 3.6).toFixed(1);
  const fechaStr = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Generar la tarjeta en un Canvas HTML5 (600x600 px) para compartir/descargar como PNG
  async function generarImagenPng(): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fondo Gradient Navy / Slate
    const gradFondo = ctx.createLinearGradient(0, 0, 0, 600);
    gradFondo.addColorStop(0, '#0f172a');
    gradFondo.addColorStop(1, '#020617');
    ctx.fillStyle = gradFondo;
    ctx.fillRect(0, 0, 600, 600);

    // Borde Neón Verde
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 568, 568);

    // Cabecera Brand Badge
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('⚡ GATERIGHT BMX', 40, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(fechaStr, 560, 60);
    ctx.textAlign = 'left';

    // Nombre Corredor & Distancia
    ctx.fillStyle = '#ffffff';
    ctx.font = 'extrabold 32px sans-serif';
    ctx.fillText(nombreCorredor.toUpperCase(), 40, 110);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Sprint ${distanciaMetros} Metros ${numeroIntento ? `• Intento #${numeroIntento}` : ''}`, 40, 140);

    // Caja Principal de Tiempo Récord
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.roundRect(40, 165, 520, 120, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.5)';
    ctx.lineWidth = 2;
    ctx.roundRect(40, 165, 520, 120, 16);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('TIEMPO TOTAL SPRINT', 60, 195);

    ctx.fillStyle = '#ea580c';
    ctx.font = 'black 56px sans-serif';
    ctx.fillText(formatearTiempo(tiempoTotalMs), 60, 260);

    // Dos Tarjetas Secundarias (Velocidad Punta & Pico Fuerza)
    // 1. Vel Punta
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.roundRect(40, 305, 250, 90, 14);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('VELOCIDAD PUNTA', 55, 330);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'black 28px sans-serif';
    ctx.fillText(`${maxVelKmh} km/h`, 55, 372);

    // 2. Pico Fuerza G
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.roundRect(310, 305, 250, 90, 14);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('PICO ACELERACIÓN', 325, 330);
    ctx.fillStyle = '#10b981';
    ctx.font = 'black 28px sans-serif';
    ctx.fillText(`${maxAcel.toFixed(1)} m/s²`, 325, 372);

    // Mini Gráfico SVG en Canvas (40 a 560 en X, 420 a 540 en Y)
    if (telemetria.length > 2) {
      const gX = 40;
      const gY = 420;
      const gW = 520;
      const gH = 110;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.roundRect(gX, gY, gW, gH, 12);
      ctx.fill();

      const maxT = telemetria[telemetria.length - 1].t || 1;
      const maxA = Math.max(20, maxAcel);

      ctx.beginPath();
      telemetria.forEach((p, idx) => {
        const x = gX + 15 + (p.t / maxT) * (gW - 30);
        const y = gY + gH - 12 - (p.a / maxA) * (gH - 24);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Pie de tarjeta
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Entrenamiento Medido con GATERIGHT BMX • gaterightbmx.app', 300, 565);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  async function handleCompartir() {
    setCompartiendo(true);
    try {
      const blob = await generarImagenPng();
      if (!blob) return;

      const file = new File([blob], `gateright_sprint_${distanciaMetros}m.png`, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Sprint ${distanciaMetros}m — GATERIGHT BMX`,
          text: `🔥 Sprint de ${distanciaMetros}m en ${formatearTiempo(tiempoTotalMs)}! Vel. Punta: ${maxVelKmh} km/h. #GATERIGHTBMX`,
          files: [file]
        });
      } else {
        // Fallback: Descarga directa si la Web Share API no está disponible en la PC
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gateright_${nombreCorredor}_${distanciaMetros}m.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.warn('Error al compartir imagen:', err);
    } finally {
      setCompartiendo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>📲 Ficha de Sprint</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              Para Compartir
            </span>
          </h3>
          <button onClick={onCerrar} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        {/* Vista Previa de la Tarjeta Resumen */}
        <div className="card bg-gradient-to-b from-slate-950 to-slate-900 border-emerald-500/30 p-5 space-y-4 shadow-inner">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-emerald-400">⚡ GATERIGHT BMX</span>
            <span className="text-slate-400">{fechaStr}</span>
          </div>

          <div>
            <span className="text-xl font-black text-white block">{nombreCorredor.toUpperCase()}</span>
            <span className="text-xs font-bold text-sky-400">
              Sprint {distanciaMetros}m {numeroIntento ? `• Intento #${numeroIntento}` : ''}
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-slate-800/60 p-4 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tiempo Total</span>
            <span className="font-heading text-4xl font-black text-amber-500 tabular-nums">
              {formatearTiempo(tiempoTotalMs)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Vel. Punta</span>
              <span className="text-base font-black text-purple-400">{maxVelKmh} km/h</span>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Pico Fuerza</span>
              <span className="text-base font-black text-emerald-400">{maxAcel.toFixed(1)} m/s²</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCompartir}
            disabled={compartiendo}
            className="flex-1 cursor-pointer rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {compartiendo ? 'Generando...' : '📲 Compartir / Guardar Imagen'}
          </button>
          <button onClick={onCerrar} className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
