import { useEffect, useRef, useState } from 'react';
import type { Sesion, Intento } from '../lib/types';
import { elegirClipAleatorio, type ClipGate } from '../lib/audio';
import { crearIntento, eliminarIntento } from '../lib/db';
import { formatearTiempo } from '../lib/tiempo';
import { IconoAlerta, IconoBasura } from './Icono';

interface Props {
  sesion: Sesion;
  onFinalizarSesion: (intentos: Intento[]) => void;
}

type Estado = 'listo' | 'preparando_bolsillo' | 'reproduciendo' | 'corriendo' | 'detenido';

// El cronómetro arranca este tanto antes de que el audio termine de sonar,
// para compensar la cola de silencio/reverb que queda después del "drop" real.
const ANTICIPO_MS = 2000;

// Umbral en milisegundos por debajo del cual se considera una prueba o salida en falso
const UMBRAL_TIEMPO_DUDOSO_MS = 2500;

// Los audios del partidor suenan bajito (~-11 dB de pico), así que se
// amplifican un 30% extra vía Web Audio API (el .volume del <audio> no
// puede pasar de 100%, no alcanza para subir más que el nivel original).
const VOLUMEN_BOOST = 1.3;

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
  const [conteoBolsillo, setConteoBolsillo] = useState(10);

  const esModoSolo = sesion.modoMedicion === 'acelerometro';

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inicioRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const anticipoRef = useRef<number | null>(null);
  const bolsilloTimerRef = useRef<number | null>(null);
  const iniciadoRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (anticipoRef.current) clearTimeout(anticipoRef.current);
      if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  // Monitoreo de Acelerómetro para Modo Solo (Bolsillo)
  useEffect(() => {
    if (estado !== 'corriendo' || !esModoSolo) return;

    let ultimoPico = 0;
    function handleMotion(e: DeviceMotionEvent) {
      // 1. Evaluar Aceleración Dinámica Pura (iOS iPhone 15 sin gravedad)
      let magDinamica = 0;
      if (e.acceleration && (e.acceleration.x !== null || e.acceleration.y !== null)) {
        const ax = e.acceleration.x ?? 0;
        const ay = e.acceleration.y ?? 0;
        const az = e.acceleration.z ?? 0;
        magDinamica = Math.sqrt(ax * ax + ay * ay + az * az);
      }

      // 2. Evaluar Aceleración con Gravedad (Android / fallback)
      let magConGravedad = 0;
      if (e.accelerationIncludingGravity) {
        const gx = e.accelerationIncludingGravity.x ?? 0;
        const gy = e.accelerationIncludingGravity.y ?? 0;
        const gz = e.accelerationIncludingGravity.z ?? 0;
        magConGravedad = Math.sqrt(gx * gx + gy * gy + gz * gz);
      }

      // Ignorar los primeros 1.5s iniciales (potencia de salida del gate)
      const tiempoCorrido = performance.now() - inicioRef.current;
      if (tiempoCorrido < 1500) return;

      // Umbrales adaptativos de frenado tras la meta:
      // - Desaceleración dinámica pura (iOS iPhone 15): > 11.5 m/s^2
      // - Fuerza total con gravedad (Android): > 17.0 m/s^2
      const esDesaceleracionMeta = magDinamica > 11.5 || magConGravedad > 17.0;

      if (esDesaceleracionMeta && tiempoCorrido > ultimoPico + 1000) {
        ultimoPico = tiempoCorrido;
        detener();
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [estado, esModoSolo]);

  function asegurarGananciaAudio() {
    const audio = audioRef.current;
    if (!audio || gainNodeRef.current) return;
    const AudioCtxCtor = window.AudioContext ?? (window as any).webkitAudioContext;
    const ctx = new AudioCtxCtor();
    const gain = ctx.createGain();
    gain.gain.value = VOLUMEN_BOOST;
    ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
    audioCtxRef.current = ctx;
    gainNodeRef.current = gain;
  }

  function iniciarLoop() {
    function tick() {
      setElapsedMs(performance.now() - inicioRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function iniciarCronometro() {
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;
    if (anticipoRef.current) clearTimeout(anticipoRef.current);
    inicioRef.current = performance.now();
    setEstado('corriendo');
    iniciarLoop();
  }

  function reproducirSalida() {
    setError(null);
    iniciadoRef.current = false;
    try {
      const elegido = elegirClipAleatorio();
      setClip(elegido);
      setElapsedMs(0);
      setEstado('reproduciendo');

      const audio = audioRef.current;
      if (!audio) return;
      audio.src = elegido.url;
      audio.load();
      asegurarGananciaAudio();
      audioCtxRef.current?.resume();
      audio
        .play()
        .then(() => {
          const duracionMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : 0;
          const esperaMs = Math.max(0, duracionMs - ANTICIPO_MS);
          anticipoRef.current = window.setTimeout(iniciarCronometro, esperaMs);
        })
        .catch((err) => {
          setError('No se pudo reproducir el audio: ' + err.message);
          setEstado('listo');
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function iniciarPrebucleBolsillo() {
    setError(null);

    // SOLICITUD DIRECTA DE PERMISO SINCRO CON EL CLICK DEL USUARIO EN iOS (iPhone 15)
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const respuesta = await (DeviceMotionEvent as any).requestPermission();
        if (respuesta !== 'granted') {
          setError('Se requiere permiso del Acelerómetro en tu iPhone para medir en Modo Solo.');
          return;
        }
      } catch (err) {
        console.warn('Permiso del acelerómetro rechazado o no soportado:', err);
      }
    }

    setEstado('preparando_bolsillo');
    setConteoBolsillo(10);
    let faltan = 10;
    if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);

    bolsilloTimerRef.current = window.setInterval(() => {
      faltan -= 1;
      setConteoBolsillo(faltan);
      if (faltan <= 0) {
        if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);
        reproducirSalida();
      }
    }, 1000);
  }

  function cancelarPrebucleBolsillo() {
    if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);
    setEstado('listo');
    setConteoBolsillo(10);
  }

  function handleAudioEnded() {
    iniciarCronometro();
  }

  function detener() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const final = performance.now() - inicioRef.current;
    setElapsedMs(final);
    setEstado('detenido');

    // 1. Sonido Beep metálico de confirmación en el bolsillo (Especialmente para iPhone 15)
    try {
      const AudioCtxCtor = window.AudioContext ?? (window as any).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtxCtor();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}

    // 2. Vibración en el bolsillo (Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 100, 300]);
      } catch (_) {}
    }
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

  async function handleBorrarIntentoGuardado(intentoId: string) {
    try {
      await eliminarIntento(intentoId);
      setIntentosSesion((prev) => prev.filter((i) => i.id !== intentoId));
    } catch (err) {
      alert('No se pudo eliminar el intento');
      console.error(err);
    }
  }

  const esTiempoDudoso = elapsedMs > 0 && elapsedMs < UMBRAL_TIEMPO_DUDOSO_MS;

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
          {estado === 'listo' && (esModoSolo ? '📱 Modo Solo (Bolsillo)' : 'Listo para arrancar')}
          {estado === 'preparando_bolsillo' && '⌛ Guardando celular...'}
          {estado === 'reproduciendo' && 'Reproduciendo salida...'}
          {estado === 'corriendo' && (esModoSolo ? '📱 Corriendo (Auto-frenado activo)' : '¡Corriendo!')}
          {estado === 'detenido' && (esTiempoDudoso ? '⚠️ ¿Prueba o salida en falso?' : 'Detenido')}
        </p>
      </div>

      {estado === 'listo' && (
        <button
          onClick={esModoSolo ? iniciarPrebucleBolsillo : reproducirSalida}
          className="btn-primary w-full py-4 text-lg font-bold shadow-lg"
        >
          {esModoSolo ? '📱 Guardar en bolsillo e Iniciar (10s)' : 'Reproducir salida'}
        </button>
      )}

      {estado === 'preparando_bolsillo' && (
        <div className="card py-8 border-amber-500/40 bg-amber-500/10 text-center space-y-3 shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600">
            📱 Modo Solo — Tiempo para guardar el celular
          </div>
          <div className="font-heading text-6xl font-extrabold text-foreground tabular-nums animate-pulse">
            {conteoBolsillo} s
          </div>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Meté el celular al bolsillo del jersey/pantalón y acomodate en el partidor. El audio arrancará automáticamente.
          </p>
          <button onClick={cancelarPrebucleBolsillo} className="btn-ghost text-xs text-destructive font-bold">
            Cancelar
          </button>
        </div>
      )}

      {estado === 'reproduciendo' && (
        <button disabled className="w-full cursor-not-allowed rounded-lg bg-warning px-4 py-4 text-lg font-semibold text-warning-foreground opacity-90">
          Esperando el gate...
        </button>
      )}

      {estado === 'corriendo' && (
        <div className="space-y-2">
          {esModoSolo && (
            <p className="text-xs font-medium text-amber-500 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              📱 <strong>Acelerómetro activo en bolsillo:</strong> Pedaleá los {sesion.distanciaMetros}m. Al frenar, el reloj se congelará y el celular vibrará.
            </p>
          )}
          <button
            onClick={detener}
            className="w-full cursor-pointer rounded-lg bg-destructive px-4 py-6 text-2xl font-bold text-destructive-foreground shadow-lg transition-transform duration-150 hover:scale-[1.02] active:scale-95"
          >
            DETENER {esModoSolo ? 'MANUAL' : ''}
          </button>
        </div>
      )}

      {estado === 'detenido' && (
        <div className="space-y-3">
          {esTiempoDudoso && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-500">
              <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>¿Prueba o toque accidental? ({formatearTiempo(elapsedMs)})</strong><br />
                Este tiempo es inusualmente corto para un sprint real de {sesion.distanciaMetros}m. Te sugerimos descartarlo para mantener tus estadísticas limpias.
              </span>
            </div>
          )}

          <div className="flex gap-3">
            {esTiempoDudoso ? (
              <>
                <button
                  onClick={descartarYRepetir}
                  className="flex-1 cursor-pointer rounded-lg bg-warning px-4 py-3 font-bold text-warning-foreground shadow-md transition-all hover:opacity-95"
                >
                  Descartar y Repetir
                </button>
                <button
                  onClick={guardarYRepetir}
                  disabled={guardando}
                  className="cursor-pointer rounded-lg border border-border bg-white px-4 py-3 font-semibold text-muted-foreground transition-colors hover:bg-surface text-xs"
                >
                  Guardar de todos modos
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      {intentosSesion.length > 0 && (
        <div className="text-left">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Intentos guardados en esta sesión
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-white">
            {intentosSesion.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-muted-foreground">#{i.numero}</span>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-semibold tabular-nums text-primary">
                    {formatearTiempo(i.tiempoTotalMs)}
                  </span>
                  <button
                    onClick={() => handleBorrarIntentoGuardado(i.id)}
                    title="Eliminar este intento de la sesión"
                    className="cursor-pointer text-muted-foreground hover:text-destructive"
                  >
                    <IconoBasura className="h-4 w-4" />
                  </button>
                </div>
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

