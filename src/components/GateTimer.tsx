import { useEffect, useRef, useState } from 'react';
import type { Sesion, Intento } from '../lib/types';
import { elegirClipAleatorio, type ClipGate } from '../lib/audio';
import { crearIntento } from '../lib/db';

interface Props {
  sesion: Sesion;
  onFinalizarSesion: (intentos: Intento[]) => void;
}

type Estado = 'listo' | 'reproduciendo' | 'corriendo' | 'detenido';

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

export default function GateTimer({ sesion, onFinalizarSesion }: Props) {
  const [estado, setEstado] = useState<Estado>('listo');
  const [clip, setClip] = useState<ClipGate | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [intentosSesion, setIntentosSesion] = useState<Intento[]>([]);
  const [guardando, setGuardando] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inicioRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function iniciarLoop() {
    function tick() {
      setElapsedMs(performance.now() - inicioRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function reproducirSalida() {
    setError(null);
    try {
      const elegido = elegirClipAleatorio();
      setClip(elegido);
      setElapsedMs(0);
      setEstado('reproduciendo');

      const audio = audioRef.current;
      if (!audio) return;
      audio.src = elegido.url;
      audio.load();
      audio.play().catch((err) => {
        setError('No se pudo reproducir el audio: ' + err.message);
        setEstado('listo');
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleAudioEnded() {
    inicioRef.current = performance.now();
    setEstado('corriendo');
    iniciarLoop();
  }

  function detener() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const final = performance.now() - inicioRef.current;
    setElapsedMs(final);
    setEstado('detenido');
  }

  async function guardarYRepetir() {
    if (!clip) return;
    setGuardando(true);
    try {
      const intento = await crearIntento({
        sesionId: sesion.id,
        corredorId: sesion.corredorId,
        numero: intentosSesion.length + 1,
        audioId: clip.id,
        tiempoTotalMs: elapsedMs
      });
      setIntentosSesion((prev) => [...prev, intento]);
      setEstado('listo');
      setClip(null);
      setElapsedMs(0);
    } finally {
      setGuardando(false);
    }
  }

  function descartarYRepetir() {
    setEstado('listo');
    setClip(null);
    setElapsedMs(0);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 text-center">
      <div className="text-left">
        <h1 className="text-xl font-bold text-slate-900">Gate — {sesion.distanciaMetros} m</h1>
        <p className="text-slate-500">Intento {intentosSesion.length + 1}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-left text-sm text-red-700">{error}</div>
      )}

      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" />

      <div className="rounded-lg border border-slate-200 bg-white py-12">
        <span className="font-mono text-6xl font-bold tabular-nums text-slate-900">
          {formatearTiempo(elapsedMs)}
        </span>
        <p className="mt-2 text-sm text-slate-400">
          {estado === 'listo' && 'Listo para arrancar'}
          {estado === 'reproduciendo' && 'Reproduciendo salida...'}
          {estado === 'corriendo' && '¡Corriendo!'}
          {estado === 'detenido' && 'Detenido'}
        </p>
      </div>

      {estado === 'listo' && (
        <button
          onClick={reproducirSalida}
          className="w-full rounded-md bg-slate-900 px-4 py-4 text-lg font-medium text-white hover:bg-slate-700"
        >
          Reproducir salida
        </button>
      )}

      {estado === 'reproduciendo' && (
        <button disabled className="w-full rounded-md bg-slate-300 px-4 py-4 text-lg font-medium text-white">
          Esperando el gate...
        </button>
      )}

      {estado === 'corriendo' && (
        <button
          onClick={detener}
          className="w-full rounded-md bg-red-600 px-4 py-6 text-2xl font-bold text-white hover:bg-red-700"
        >
          DETENER
        </button>
      )}

      {estado === 'detenido' && (
        <div className="flex gap-3">
          <button
            onClick={guardarYRepetir}
            disabled={guardando}
            className="flex-1 rounded-md bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar y repetir'}
          </button>
          <button
            onClick={descartarYRepetir}
            className="rounded-md border border-slate-300 px-4 py-3 text-slate-600 hover:bg-slate-50"
          >
            Descartar
          </button>
        </div>
      )}

      {intentosSesion.length > 0 && (
        <div className="text-left">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Intentos guardados
          </h2>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {intentosSesion.map((i) => (
              <li key={i.id} className="flex justify-between px-4 py-2">
                <span className="text-slate-500">#{i.numero}</span>
                <span className="font-mono font-medium text-slate-900">{formatearTiempo(i.tiempoTotalMs)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => onFinalizarSesion(intentosSesion)}
        className="w-full rounded-md border border-slate-900 px-4 py-3 font-medium text-slate-900 hover:bg-slate-50"
      >
        Finalizar sesión
      </button>
    </div>
  );
}
