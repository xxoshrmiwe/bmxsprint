import { useEffect, useRef, useState } from 'react';
import type { Sesion, Intento } from '../lib/types';
import { elegirClipAleatorio, type ClipGate } from '../lib/audio';
import { crearIntento } from '../lib/db';
import { IconoAlerta } from './Icono';

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

function LuzSemaforo({ color, activa }: { color: 'red' | 'yellow' | 'green'; activa: boolean }) {
  const bg = color === 'red' ? 'bg-destructive' : color === 'yellow' ? 'bg-warning' : 'bg-accent';
  return (
    <span
      className={`h-4 w-4 rounded-full transition-opacity duration-300 ${bg} ${
        activa ? 'opacity-100 animate-pulse' : 'opacity-15'
      }`}
    />
  );
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
        <h1 className="text-2xl font-bold text-foreground">Gate — {sesion.distanciaMetros} m</h1>
        <p className="text-muted-foreground">Intento {intentosSesion.length + 1}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left text-sm text-destructive">
          <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <audio ref={audioRef} onEnded={handleAudioEnded} preload="auto" />

      <div className="card py-10">
        <div className="mb-4 flex justify-center gap-3">
          <LuzSemaforo color="red" activa={estado === 'listo'} />
          <LuzSemaforo color="yellow" activa={estado === 'reproduciendo'} />
          <LuzSemaforo color="green" activa={estado === 'corriendo'} />
        </div>
        <span className="font-heading text-7xl font-bold tabular-nums text-primary">
          {formatearTiempo(elapsedMs)}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">
          {estado === 'listo' && 'Listo para arrancar'}
          {estado === 'reproduciendo' && 'Reproduciendo salida...'}
          {estado === 'corriendo' && '¡Corriendo!'}
          {estado === 'detenido' && 'Detenido'}
        </p>
      </div>

      {estado === 'listo' && (
        <button onClick={reproducirSalida} className="btn-primary w-full py-4 text-lg">
          Reproducir salida
        </button>
      )}

      {estado === 'reproduciendo' && (
        <button disabled className="w-full cursor-not-allowed rounded-lg bg-warning px-4 py-4 text-lg font-semibold text-warning-foreground opacity-90">
          Esperando el gate...
        </button>
      )}

      {estado === 'corriendo' && (
        <button
          onClick={detener}
          className="w-full cursor-pointer rounded-lg bg-destructive px-4 py-6 text-2xl font-bold text-destructive-foreground shadow-lg transition-transform duration-150 hover:scale-[1.02] active:scale-95"
        >
          DETENER
        </button>
      )}

      {estado === 'detenido' && (
        <div className="flex gap-3">
          <button
            onClick={guardarYRepetir}
            disabled={guardando}
            className="flex-1 cursor-pointer rounded-lg bg-accent px-4 py-3 font-semibold text-accent-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar y repetir'}
          </button>
          <button
            onClick={descartarYRepetir}
            className="cursor-pointer rounded-lg border border-border bg-white px-4 py-3 font-semibold text-muted-foreground transition-colors duration-200 hover:bg-surface"
          >
            Descartar
          </button>
        </div>
      )}

      {intentosSesion.length > 0 && (
        <div className="text-left">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Intentos guardados
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-white">
            {intentosSesion.map((i) => (
              <li key={i.id} className="flex justify-between px-4 py-2">
                <span className="text-muted-foreground">#{i.numero}</span>
                <span className="font-heading font-semibold tabular-nums text-primary">
                  {formatearTiempo(i.tiempoTotalMs)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => onFinalizarSesion(intentosSesion)} className="btn-secondary w-full">
        Finalizar sesión
      </button>
    </div>
  );
}
