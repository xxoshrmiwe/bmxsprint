import React, { useState } from 'react';
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

  // Generar la tarjeta en Light Mode (600x600 px) para visibilidad perfecta en WhatsApp
  async function generarImagenPng(): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Fondo Blanco Nítido (Light Mode)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 600);

    // 2. Borde de Marca Verde BMX
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 568, 568);

    // 3. Cabecera Brand Badge
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('⚡ GATERIGHT BMX', 40, 60);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(fechaStr, 560, 60);
    ctx.textAlign = 'left';

    // 4. Nombre del Corredor & Distancia
    ctx.fillStyle = '#0f172a';
    ctx.font = 'black 34px sans-serif';
    ctx.fillText(nombreCorredor.toUpperCase(), 40, 110);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`Sprint ${distanciaMetros} Metros ${numeroIntento ? `• Intento #${numeroIntento}` : ''}`, 40, 140);

    // 5. Caja Principal de Tiempo Récord (Light Surface)
    ctx.fillStyle = '#f8fafc';
    ctx.roundRect(40, 165, 520, 120, 16);
    ctx.fill();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.5;
    ctx.roundRect(40, 165, 520, 120, 16);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('TIEMPO TOTAL SPRINT', 60, 195);

    ctx.fillStyle = '#ea580c';
    ctx.font = 'black 58px sans-serif';
    ctx.fillText(formatearTiempo(tiempoTotalMs), 60, 260);

    // 6. Dos Tarjetas Secundarias (Velocidad Punta & Pico Fuerza)
    // Velocidad Punta
    ctx.fillStyle = '#f1f5f9';
    ctx.roundRect(40, 305, 250, 90, 14);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.roundRect(40, 305, 250, 90, 14);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('VELOCIDAD PUNTA', 55, 330);
    ctx.fillStyle = '#7e22ce';
    ctx.font = 'black 30px sans-serif';
    ctx.fillText(`${maxVelKmh} km/h`, 55, 372);

    // Pico Fuerza G
    ctx.fillStyle = '#f1f5f9';
    ctx.roundRect(310, 305, 250, 90, 14);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.roundRect(310, 305, 250, 90, 14);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('PICO ACELERACIÓN', 325, 330);
    ctx.fillStyle = '#059669';
    ctx.font = 'black 30px sans-serif';
    ctx.fillText(`${maxAcel.toFixed(1)} m/s²`, 325, 372);

    // 7. Mini Gráfico SVG en Canvas
    if (telemetria.length > 2) {
      const gX = 40;
      const gY = 415;
      const gW = 520;
      const gH = 115;

      ctx.fillStyle = '#ffffff';
      ctx.roundRect(gX, gY, gW, gH, 12);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.roundRect(gX, gY, gW, gH, 12);
      ctx.stroke();

      const maxT = telemetria[telemetria.length - 1].t || 1;
      const maxA = Math.max(20, maxAcel);

      ctx.beginPath();
      telemetria.forEach((p, idx) => {
        const x = gX + 15 + (p.t / maxT) * (gW - 30);
        const y = gY + gH - 12 - (p.a / maxA) * (gH - 24);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    // 8. Pie de tarjeta con URL correcta (.com)
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Entrenamiento Medido con GATERIGHT BMX • gaterightbmx.com', 300, 565);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>📲 Ficha de Sprint</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
              Para Compartir
            </span>
          </h3>
          <button onClick={onCerrar} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            ✕
          </button>
        </div>

        {/* Vista Previa Light Mode en pantalla */}
        <div className="card bg-white border-2 border-emerald-600 p-5 space-y-4 shadow-md text-slate-900">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-emerald-600 text-base">⚡ GATERIGHT BMX</span>
            <span className="text-slate-500 font-medium">{fechaStr}</span>
          </div>

          <div>
            <span className="text-2xl font-black text-slate-900 block">{nombreCorredor.toUpperCase()}</span>
            <span className="text-xs font-bold text-sky-600">
              Sprint {distanciaMetros}m {numeroIntento ? `• Intento #${numeroIntento}` : ''}
            </span>
          </div>

          <div className="rounded-xl border-2 border-orange-500 bg-orange-50/50 p-4 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Tiempo Total</span>
            <span className="font-heading text-5xl font-black text-orange-600 tabular-nums">
              {formatearTiempo(tiempoTotalMs)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl bg-slate-100 p-3 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Vel. Punta</span>
              <span className="text-lg font-black text-purple-700">{maxVelKmh} km/h</span>
            </div>
            <div className="rounded-lg bg-slate-100 p-3 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Pico Aceleración</span>
              <span className="text-lg font-black text-emerald-700">{maxAcel.toFixed(1)} m/s²</span>
            </div>
          </div>

          <div className="text-center pt-1 text-[11px] font-bold text-slate-400">
            Entrenamiento Medido con GATERIGHT BMX • gaterightbmx.com
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCompartir}
            disabled={compartiendo}
            className="flex-1 cursor-pointer rounded-xl bg-emerald-600 px-4 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-sm"
          >
            {compartiendo ? 'Generando...' : '📲 Compartir / Guardar Imagen'}
          </button>
          <button onClick={onCerrar} className="cursor-pointer rounded-xl border border-slate-300 bg-slate-100 px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-200">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
