import { useEffect, useRef, useState } from 'react';
import type { Sesion, Intento, PuntoTelemetria, Corredor } from '../lib/types';
import { elegirClipAleatorio, type ClipGate } from '../lib/audio';
import { crearIntento, eliminarIntento, listarIntentosPorCorredor } from '../lib/db';
import { formatearTiempo } from '../lib/tiempo';
import { IconoAlerta, IconoBasura } from './Icono';
import GraficaSprint from './GraficaSprint';
import TarjetasResumen from './TarjetasResumen';
import { guardarRunCrudo, exportarRunCSV, type SampleCrudo, type GpsSampleCrudo, type RunCrudo } from '../lib/loggerDb';

interface Props {
  sesion: Sesion;
  corredor?: Corredor;
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

function anunciarTiempoPorVoz(tiempoTotalMs: number, mejorTiempoPrevioMs?: number) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const segs = (tiempoTotalMs / 1000).toFixed(2).replace('.', ' coma ');
    let texto = `${segs} segundos.`;

    if (mejorTiempoPrevioMs && mejorTiempoPrevioMs > 1000) {
      if (tiempoTotalMs < mejorTiempoPrevioMs) {
        const difSeg = ((mejorTiempoPrevioMs - tiempoTotalMs) / 1000).toFixed(2).replace('.', ' coma ');
        texto += ` ¡Nuevo récord personal! Mejoraste ${difSeg} segundos.`;
      } else {
        const difMs = tiempoTotalMs - mejorTiempoPrevioMs;
        if (difMs < 800) {
          const difSeg = (difMs / 1000).toFixed(2).replace('.', ' coma ');
          texto += ` Estuviste a solo ${difSeg} segundos de tu récord personal.`;
        }
      }
    }

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 1.02;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
}

export default function GateTimer({ sesion, corredor, onFinalizarSesion }: Props) {
  const [estado, setEstado] = useState<Estado>('listo');
  const [clip, setClip] = useState<ClipGate | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [intentosSesion, setIntentosSesion] = useState<Intento[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [conteoBolsillo, setConteoBolsillo] = useState(10);
  const [graficaModal, setGraficaModal] = useState<{ telemetria: PuntoTelemetria[]; tiempoMs: number; numero?: number } | null>(null);
  const [tarjetaModal, setTarjetaModal] = useState<{ telemetria?: PuntoTelemetria[]; tiempoMs: number; numero?: number } | null>(null);
  const [telemetriaFantasma, setTelemetriaFantasma] = useState<PuntoTelemetria[] | undefined>(undefined);
  const [mejorTiempoHistoricoMs, setMejorTiempoHistoricoMs] = useState<number>(0);
  const [vozActivada, setVozActivada] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gateright_voz_activada') !== 'false';
    }
    return true;
  });

  const vozActivadaRef = useRef(vozActivada);
  useEffect(() => {
    vozActivadaRef.current = vozActivada;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gateright_voz_activada', String(vozActivada));
    }
  }, [vozActivada]);

  const esModoSolo = sesion.modoMedicion === 'acelerometro';

  // Cargar telemetría del mejor sprint histórico (PR) para la curva fantasma y comparación por voz
  useEffect(() => {
    if (!sesion.corredorId) return;
    listarIntentosPorCorredor(sesion.corredorId).then((todos) => {
      const delMismaDistancia = todos.filter((i) => i.tiempoTotalMs > 1500);
      if (delMismaDistancia.length === 0) return;
      const mejor = delMismaDistancia.reduce((prev, curr) => (curr.tiempoTotalMs < prev.tiempoTotalMs ? curr : prev));
      if (mejor) {
        setMejorTiempoHistoricoMs(mejor.tiempoTotalMs);
        if (mejor.telemetria && mejor.telemetria.length > 2) {
          setTelemetriaFantasma(mejor.telemetria);
        }
      }
    }).catch(() => {});
  }, [sesion.corredorId]);

  const estadoRef = useRef<Estado>(estado);
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inicioRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const anticipoRef = useRef<number | null>(null);
  const bolsilloTimerRef = useRef<number | null>(null);
  const iniciadoRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const telemetriaRef = useRef<PuntoTelemetria[]>([]);
  const ultimaMuestraMsRef = useRef<number>(0);

  // Refs de GPS Doppler y Calibración ZUPT (Exclusivo Modo Solo)
  const watchGpsIdRef = useRef<number | null>(null);
  const velocidadGpsRef = useRef<number>(0);
  const biasZuptRef = useRef<number>(0);
  const muestrasZuptRef = useRef<number[]>([]);

  // Refs del Logger Crudo CSV (Paso 0)
  const muestrasCrudasRef = useRef<SampleCrudo[]>([]);
  const gpsCrudoRef = useRef<GpsSampleCrudo[]>([]);
  const [ultimoRunCrudo, setUltimoRunCrudo] = useState<RunCrudo | null>(null);

  useEffect(() => {
    // Desenfocar cualquier elemento activo (inputs/teclados) para evitar que iOS dispare "Agitar para deshacer"
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (anticipoRef.current) clearTimeout(anticipoRef.current);
      if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);
      if (watchGpsIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchGpsIdRef.current);
      }
      audioCtxRef.current?.close();
    };
  }, []);

  // Monitor de GPS Doppler (watchPosition) — Exclusivo Modo Solo
  useEffect(() => {
    if (!esModoSolo || (estado !== 'preparando_bolsillo' && estado !== 'corriendo')) {
      if (watchGpsIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchGpsIdRef.current);
        watchGpsIdRef.current = null;
      }
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator && watchGpsIdRef.current === null) {
      velocidadGpsRef.current = 0;
      watchGpsIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (pos.coords && typeof pos.coords.speed === 'number' && pos.coords.speed >= 0) {
            velocidadGpsRef.current = pos.coords.speed;
          }
          // Registrar muestra de GPS cruda para el CSV
          gpsCrudoRef.current.push({
            t: performance.now(),
            tFix: pos.timestamp,
            speed: pos.coords.speed,
            accuracy: pos.coords.accuracy,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        (err) => {
          console.warn('GPS Doppler error/unsupported:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  }, [estado, esModoSolo]);

  // Monitoreo de Acelerómetro para Modo Solo (Bolsillo) — Detención por Frenado Total con ZUPT y Doppler
  useEffect(() => {
    if (estado !== 'corriendo' || !esModoSolo) return;

    let movimientoRegistrado = false;
    let lecturasQuietoConsecutivas = 0;

    // Muestras consecutivas de teléfono quieto requeridas (~500ms a 600ms de detención total)
    const MUESTRAS_QUIETO_REQUERIDAS = 30;

    // Ventana de gracia inicial adaptada a la distancia (mínimo 2.0s, hasta 3.0s)
    const ventanaGraciaMs = Math.min(3000, Math.max(2000, sesion.distanciaMetros * 70));

    function handleMotion(e: DeviceMotionEvent) {
      // Registrar muestra cruda completa para el CSV (Paso 0)
      muestrasCrudasRef.current.push({
        t: performance.now(),
        ax: e.acceleration?.x ?? 0,
        ay: e.acceleration?.y ?? 0,
        az: e.acceleration?.z ?? 0,
        gx: e.accelerationIncludingGravity?.x ?? 0,
        gy: e.accelerationIncludingGravity?.y ?? 0,
        gz: e.accelerationIncludingGravity?.z ?? 0,
        rx: e.rotationRate?.alpha ?? 0,
        ry: e.rotationRate?.beta ?? 0,
        rz: e.rotationRate?.gamma ?? 0,
        interval: e.interval ?? 16.6,
        src: e.acceleration ? 'fused' : 'lowpass'
      });

      // 1. Evaluar Aceleración Dinámica Pura (iOS Safari / Android Chrome)
      let magDinamica = 0;
      if (e.acceleration && (e.acceleration.x !== null || e.acceleration.y !== null || e.acceleration.z !== null)) {
        const ax = e.acceleration.x ?? 0;
        const ay = e.acceleration.y ?? 0;
        const az = e.acceleration.z ?? 0;
        magDinamica = Math.sqrt(ax * ax + ay * ay + az * az);
      } else if (e.accelerationIncludingGravity) {
        const gx = e.accelerationIncludingGravity.x ?? 0;
        const gy = e.accelerationIncludingGravity.y ?? 0;
        const gz = e.accelerationIncludingGravity.z ?? 0;
        const magTotal = Math.sqrt(gx * gx + gy * gy + gz * gz);
        magDinamica = Math.max(0, magTotal - 9.81);
      }

      // Descontar la calibración ZUPT obtenida en el partidor
      const nivelMovimiento = Math.max(0, magDinamica - biasZuptRef.current);
      const tiempoCorrido = performance.now() - inicioRef.current;
      const velocidadDoppler = velocidadGpsRef.current;

      // Capturar punto de telemetría cada ~40ms (Fuerza G + Velocidad GPS Doppler)
      if (tiempoCorrido - ultimaMuestraMsRef.current >= 40) {
        ultimaMuestraMsRef.current = tiempoCorrido;
        telemetriaRef.current.push({
          t: Math.round(tiempoCorrido),
          a: Math.round(nivelMovimiento * 10) / 10,
          v: Math.round(velocidadDoppler * 10) / 10
        });
      }

      // Confirmar que el atleta ya arrancó a pedalear / moverse
      if (nivelMovimiento > 2.5 || velocidadDoppler > 1.8) {
        movimientoRegistrado = true;
      }

      // Ignorar durante la ventana de gracia inicial de la arrancada
      if (tiempoCorrido < ventanaGraciaMs) return;

      // Se considera que el sprint terminó (frenado tras la meta) cuando la aceleración cae < 1.8 m/s^2 y la velocidad es baja
      const estaQuieto = nivelMovimiento < 1.8 && velocidadDoppler < 1.2;

      if (movimientoRegistrado && estaQuieto) {
        lecturasQuietoConsecutivas++;
        // Con 15 muestras (~250ms a 300ms de desaceleración sostenida) se detiene de inmediato
        if (lecturasQuietoConsecutivas >= 15) {
          detener();
        }
      } else {
        // Mientras esté en movimiento o pedaleando o tomando curvas, reiniciar el contador de quieto
        lecturasQuietoConsecutivas = 0;
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [estado, esModoSolo, sesion.distanciaMetros]);

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
    // Solo permitir iniciar si venimos de reproduciendo o preparando_bolsillo
    if (estadoRef.current !== 'reproduciendo' && estadoRef.current !== 'preparando_bolsillo') return;
    iniciadoRef.current = true;
    if (anticipoRef.current) {
      clearTimeout(anticipoRef.current);
      anticipoRef.current = null;
    }
    inicioRef.current = performance.now();
    telemetriaRef.current = [];
    muestrasCrudasRef.current = [];
    gpsCrudoRef.current = [];
    ultimaMuestraMsRef.current = 0;
    setEstado('corriendo');
    iniciarLoop();
  }

  function reproducirSalidaConClip(elegidoClip?: ClipGate) {
    setError(null);
    iniciadoRef.current = false;
    try {
      const elegido = elegidoClip || clip || elegirClipAleatorio();
      setClip(elegido);
      setElapsedMs(0);
      setEstado('reproduciendo');

      const audio = audioRef.current;
      if (!audio) return;

      audio.muted = false;
      audio.currentTime = 0;
      audio.src = elegido.url;
      audio.load();
      asegurarGananciaAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }

      const programarSalida = () => {
        const duracionMs = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration * 1000 : 0;
        // Si el audio es corto (< 2.5s), anticipar solo 300ms; si es largo, anticipar ANTICIPO_MS (2000ms)
        const anticipoFinal = duracionMs > 2500 ? ANTICIPO_MS : 300;
        const esperaMs = Math.max(100, duracionMs - anticipoFinal);

        if (anticipoRef.current) clearTimeout(anticipoRef.current);
        anticipoRef.current = window.setTimeout(iniciarCronometro, esperaMs);
      };

      audio
        .play()
        .then(() => {
          if (audio.duration && Number.isFinite(audio.duration)) {
            programarSalida();
          } else {
            audio.onloadedmetadata = programarSalida;
          }
        })
        .catch((err) => {
          console.error('Error al reproducir audio del gate:', err);
          setError('El navegador bloqueó la reproducción automática. Toca el botón de nuevo para escuchar la salida.');
          setEstado('listo');
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setEstado('listo');
    }
  }

  function reproducirSalida() {
    reproducirSalidaConClip();
  }

  async function iniciarPrebucleBolsillo() {
    setError(null);

    // 1. SOLICITUD DIRECTA DE PERMISO SINCRO CON EL CLICK DEL USUARIO EN iOS (iPhone)
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

    // 2. DESBLOQUEO OBLIGATORIO DE AUDIO EN iOS SAFARI (Al toque directo del usuario)
    const audio = audioRef.current;
    const elegido = elegirClipAleatorio();
    setClip(elegido);
    if (audio) {
      audio.src = elegido.url;
      audio.load();
      asegurarGananciaAudio();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      // Silenciar temporalmente durante el toque para desbloquear el canal de audio de iOS sin emitir sonido a t=0s
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {
        audio.muted = false;
      });
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
        reproducirSalidaConClip(elegido);
      }
    }, 1000);
  }

  function cancelarPrebucleBolsillo() {
    if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);
    if (anticipoRef.current) clearTimeout(anticipoRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.muted = false;
      audioRef.current.onloadedmetadata = null;
    }
    iniciadoRef.current = false;
    setEstado('listo');
    setConteoBolsillo(10);
  }

  function handleAudioEnded() {
    if (estadoRef.current === 'reproduciendo') {
      iniciarCronometro();
    }
  }

  const [telemetriaUltimoSprint, setTelemetriaUltimoSprint] = useState<PuntoTelemetria[]>([]);

  function detener() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (anticipoRef.current) {
      clearTimeout(anticipoRef.current);
      anticipoRef.current = null;
    }
    if (bolsilloTimerRef.current) {
      clearInterval(bolsilloTimerRef.current);
      bolsilloTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onloadedmetadata = null;
    }
    let final = performance.now() - inicioRef.current;

    // ALGORITMO DE CORTE DE PRECISIÓN (Elimina el delay/ruido de sacar el celular del bolsillo)
    if (esModoSolo && telemetriaRef.current.length > 5) {
      // Buscar el último instante de pedaleo/aceleración activa (a >= 3.0 m/s²)
      let ultimoIndiceActivo = -1;
      for (let i = telemetriaRef.current.length - 1; i >= 0; i--) {
        if (telemetriaRef.current[i].a >= 3.0) {
          ultimoIndiceActivo = i;
          break;
        }
      }

      if (ultimoIndiceActivo !== -1 && ultimoIndiceActivo < telemetriaRef.current.length - 1) {
        // Añadir 5 muestras (~200ms) para cubrir la inercia completa de frenado en la meta
        const indiceCorte = Math.min(telemetriaRef.current.length - 1, ultimoIndiceActivo + 5);
        const tCorte = telemetriaRef.current[indiceCorte].t;
        if (tCorte > 1500 && tCorte < final) {
          final = tCorte;
          // Limpiar la cola de lecturas producidas al manipular el teléfono con la mano
          telemetriaRef.current = telemetriaRef.current.slice(0, indiceCorte + 1);
        }
      }
    }

    setElapsedMs(final);
    setEstado('detenido');
    setTelemetriaUltimoSprint([...telemetriaRef.current]);

    // Volcado asíncrono a IndexedDB para el Logger Crudo (Paso 0)
    const runCrudo: RunCrudo = {
      id: `run_${Date.now()}`,
      corredorId: sesion.corredorId,
      distanciaMetros: sesion.distanciaMetros,
      fecha: Date.now(),
      muestras: [...muestrasCrudasRef.current],
      gps: [...gpsCrudoRef.current]
    };
    setUltimoRunCrudo(runCrudo);
    guardarRunCrudo(runCrudo);

    // 1. Tono rítmico de 3 segundos de confirmación en el bolsillo (Especialmente para iPhone / iOS Safari)
    try {
      const AudioCtxCtor = window.AudioContext ?? (window as any).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtxCtor();
      if (ctx.state === 'suspended') ctx.resume();

      const ahora = ctx.currentTime;
      // 3 ráfagas metálicas de 0.8s con 0.2s de descanso = 3.0 segundos totales
      [0, 1.0, 2.0].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ahora + offset);
        gain.gain.setValueAtTime(0.6, ahora + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + offset + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ahora + offset);
        osc.stop(ahora + offset + 0.8);
      });
    } catch (_) {}

    // 2. Vibración de 3 segundos continuos en el bolsillo (Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([1000, 200, 1000, 200, 1000]);
      } catch (_) {}
    }

    // 3. Lectura de Tiempo por Voz Sintetizada en Vivo (después del tono de 3s en el bolsillo)
    if (vozActivadaRef.current) {
      setTimeout(() => {
        anunciarTiempoPorVoz(final, mejorTiempoHistoricoMs);
      }, 3100);
    }
  }


  async function guardarYRepetir() {
    if (!clip) return;
    setGuardando(true);
    try {
      if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);
      if (anticipoRef.current) clearTimeout(anticipoRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onloadedmetadata = null;
      }
      iniciadoRef.current = false;
      const intento = await crearIntento({
        sesionId: sesion.id,
        corredorId: sesion.corredorId,
        numero: intentosSesion.length + 1,
        audioId: clip.id,
        tiempoTotalMs: elapsedMs,
        telemetria: telemetriaRef.current.length > 0 ? [...telemetriaRef.current] : undefined
      });
      setIntentosSesion((prev) => [...prev, intento]);
      setEstado('listo');
      setClip(null);
      setElapsedMs(0);
      telemetriaRef.current = [];
    } finally {
      setGuardando(false);
    }
  }

  function descartarYRepetir() {
    if (bolsilloTimerRef.current) clearInterval(bolsilloTimerRef.current);
    if (anticipoRef.current) clearTimeout(anticipoRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.onloadedmetadata = null;
    }
    iniciadoRef.current = false;
    setEstado('listo');
    setClip(null);
    setElapsedMs(0);
    telemetriaRef.current = [];
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
        {estado === 'detenido' && telemetriaUltimoSprint.length > 0 && (
          (() => {
            let vMs = Math.max(0, ...telemetriaUltimoSprint.map((p) => p.v ?? 0));
            if (vMs === 0 && telemetriaUltimoSprint.length > 1) {
              let vInteg = 0;
              let maxInteg = 0;
              for (let i = 1; i < telemetriaUltimoSprint.length; i++) {
                const dt = (telemetriaUltimoSprint[i].t - telemetriaUltimoSprint[i - 1].t) / 1000;
                const a = telemetriaUltimoSprint[i].a;
                if (a > 1.5) {
                  vInteg += a * dt * 0.45;
                  if (vInteg > maxInteg) maxInteg = vInteg;
                } else {
                  vInteg = Math.max(0, vInteg - 2.0 * dt);
                }
              }
              vMs = maxInteg;
            }
            return (
              <div className="mt-2 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 px-3.5 py-1 text-xs font-black text-violet-600 dark:text-violet-400 shadow-xs">
                  ⚡ Vel. Punta: {(vMs * 3.6).toFixed(1)} km/h
                </span>
              </div>
            );
          })()
        )}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setVozActivada(!vozActivada)}
            title="Activar/desactivar locución de voz tras cada sprint"
            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold transition-all border shadow-2xs ${
              vozActivada
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-300 bg-slate-100 text-slate-400'
            }`}
          >
            {vozActivada ? '🗣️ Voz de Entrenador (ON)' : '🔇 Voz de Entrenador (OFF)'}
          </button>
        </div>
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
            Guardá el celular en el bolsillo y acomodate en el partidor. <strong>Al cruzar la meta ({sesion.distanciaMetros}m), frená con firmeza</strong> para congelar el tiempo al instante.
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
            <p className="text-xs font-medium text-amber-600 bg-amber-500/10 p-3 rounded-lg border border-amber-500/30 text-left">
              📱 <strong>Modo Bolsillo Activo:</strong> Pedaleá a máxima velocidad los {sesion.distanciaMetros}m. <strong>Apenas cruces la meta, frená con firmeza</strong> para congelar el reloj de inmediato.
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

          {telemetriaUltimoSprint.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setGraficaModal({
                    telemetria: [...telemetriaUltimoSprint],
                    tiempoMs: elapsedMs,
                    numero: intentosSesion.length + 1
                  })
                }
                className="cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 px-3 text-xs font-extrabold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xs"
              >
                📊 Ver gráfica (PR Fantasma)
              </button>
              <button
                onClick={() =>
                  setTarjetaModal({
                    telemetria: [...telemetriaUltimoSprint],
                    tiempoMs: elapsedMs,
                    numero: intentosSesion.length + 1
                  })
                }
                className="cursor-pointer rounded-xl border border-sky-500/30 bg-sky-500/10 py-2.5 px-3 text-xs font-extrabold text-sky-400 hover:bg-sky-500 hover:text-white transition-all shadow-xs"
              >
                📲 Compartir Ficha
              </button>
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
            {intentosSesion.map((i) => {
              let vMs = Math.max(0, ...(i.telemetria?.map((p) => p.v ?? 0) ?? []));
              if (vMs === 0 && i.telemetria && i.telemetria.length > 1) {
                let vInteg = 0;
                let maxInteg = 0;
                for (let idx = 1; idx < i.telemetria.length; idx++) {
                  const dt = (i.telemetria[idx].t - i.telemetria[idx - 1].t) / 1000;
                  const a = i.telemetria[idx].a;
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
                <li key={i.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground font-semibold">#{i.numero}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-heading font-semibold tabular-nums text-primary block">
                        {formatearTiempo(i.tiempoTotalMs)}
                      </span>
                      {i.telemetria && i.telemetria.length > 0 && (
                        <span className="text-[10px] font-bold text-violet-500 block -mt-1">
                          ⚡ {vKmh} km/h
                        </span>
                      )}
                    </div>
                    {i.telemetria && i.telemetria.length > 0 && (
                      <>
                        <button
                          onClick={() =>
                            setGraficaModal({
                              telemetria: i.telemetria!,
                              tiempoMs: i.tiempoTotalMs,
                              numero: i.numero
                            })
                          }
                          title="Ver gráfica de telemetría"
                          className="cursor-pointer text-xs font-bold text-emerald-600 hover:underline"
                        >
                          📊 Gráfica
                        </button>
                        <button
                          onClick={() =>
                            setTarjetaModal({
                              telemetria: i.telemetria!,
                              tiempoMs: i.tiempoTotalMs,
                              numero: i.numero
                            })
                          }
                          title="Compartir tarjeta de sprint"
                          className="cursor-pointer text-xs font-bold text-sky-600 hover:underline"
                        >
                          📲 Ficha
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleBorrarIntentoGuardado(i.id)}
                      title="Eliminar este intento de la sesión"
                      className="cursor-pointer text-muted-foreground hover:text-destructive"
                    >
                      <IconoBasura className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button onClick={() => onFinalizarSesion(intentosSesion)} className="btn-secondary w-full">
        Finalizar sesión
      </button>

      {/* Modal de Gráfica de Telemetría (Con Récord Fantasma) */}
      {graficaModal && (
        <GraficaSprint
          telemetria={graficaModal.telemetria}
          tiempoTotalMs={graficaModal.tiempoMs}
          numeroIntento={graficaModal.numero}
          telemetriaFantasma={telemetriaFantasma}
          onCerrar={() => setGraficaModal(null)}
        />
      )}

      {/* Modal de Ficha Resumen Compartible */}
      {tarjetaModal && (
        <TarjetasResumen
          nombreCorredor={corredor?.nombre || 'Corredor BMX'}
          distanciaMetros={sesion.distanciaMetros}
          tiempoTotalMs={tarjetaModal.tiempoMs}
          numeroIntento={tarjetaModal.numero}
          telemetria={tarjetaModal.telemetria}
          onCerrar={() => setTarjetaModal(null)}
        />
      )}
    </div>
  );
}

