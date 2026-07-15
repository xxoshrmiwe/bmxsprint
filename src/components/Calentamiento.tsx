import { useEffect, useMemo, useRef, useState } from 'react';
import { obtenerRutina } from '../lib/warmup';
import { IconoCheck } from './Icono';

interface Props {
  edad?: number;
  onListo: () => void;
}

function formatearSegundos(ms: number): string {
  const seg = Math.max(0, Math.ceil(ms / 1000));
  return seg.toString().padStart(2, '0');
}

export default function Calentamiento({ edad, onListo }: Props) {
  const rutina = useMemo(() => obtenerRutina(edad), [edad]);

  const [indice, setIndice] = useState(0);
  const [msRestante, setMsRestante] = useState(rutina[0].segundos * 1000);
  const [corriendo, setCorriendo] = useState(false);
  const [terminado, setTerminado] = useState(false);

  const indiceRef = useRef(0);
  const finRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    indiceRef.current = indice;
  }, [indice]);

  useEffect(() => {
    if (!corriendo) return;

    finRef.current = performance.now() + msRestante;

    function tick() {
      const restante = finRef.current - performance.now();
      if (restante > 0) {
        setMsRestante(restante);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const siguiente = indiceRef.current + 1;
      if (siguiente >= rutina.length) {
        setCorriendo(false);
        setTerminado(true);
        setMsRestante(0);
        return;
      }
      indiceRef.current = siguiente;
      setIndice(siguiente);
      const duracion = rutina[siguiente].segundos * 1000;
      finRef.current = performance.now() + duracion;
      setMsRestante(duracion);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);

  function saltarEjercicio() {
    const siguiente = indice + 1;
    if (siguiente >= rutina.length) {
      setCorriendo(false);
      setTerminado(true);
      setMsRestante(0);
      return;
    }
    setIndice(siguiente);
    const duracion = rutina[siguiente].segundos * 1000;
    setMsRestante(duracion);
    if (corriendo) {
      finRef.current = performance.now() + duracion;
    }
  }

  const ejercicio = rutina[indice];

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calentamiento</h1>
        <p className="text-muted-foreground">
          {terminado ? 'Rutina completa' : `Ejercicio ${indice + 1} de ${rutina.length}`}
        </p>
        {!terminado && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${((indice + 1) / rutina.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {terminado ? (
        <div className="card space-y-2 border-accent/30 bg-accent/10 text-center">
          <IconoCheck className="mx-auto h-10 w-10 text-accent" />
          <p className="text-lg font-semibold text-primary">¡Calentamiento listo!</p>
          <p className="text-muted-foreground">A darle al gate.</p>
        </div>
      ) : (
        <div className="card text-center">
          <span className="font-heading text-7xl font-bold tabular-nums text-primary">
            {formatearSegundos(msRestante)}
          </span>
          <h2 className="mt-3 text-lg font-semibold text-foreground">{ejercicio.nombre}</h2>
          <ul className="mt-3 space-y-1 text-left text-sm text-muted-foreground">
            {ejercicio.pasos.map((paso, i) => (
              <li key={i}>• {paso}</li>
            ))}
          </ul>
        </div>
      )}

      {!terminado && (
        <div className="flex gap-3">
          {!corriendo ? (
            <button onClick={() => setCorriendo(true)} className="btn-primary flex-1">
              {msRestante === ejercicio.segundos * 1000 ? 'Iniciar' : 'Reanudar'}
            </button>
          ) : (
            <button
              onClick={() => setCorriendo(false)}
              className="flex-1 cursor-pointer rounded-lg bg-warning px-4 py-3 font-semibold text-warning-foreground shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              Pausar
            </button>
          )}
          <button
            onClick={saltarEjercicio}
            className="cursor-pointer rounded-lg border border-border bg-white px-4 py-3 font-semibold text-muted-foreground transition-colors duration-200 hover:bg-surface"
          >
            Siguiente
          </button>
        </div>
      )}

      <button onClick={onListo} className="btn-secondary w-full">
        {terminado ? 'Ir al gate →' : 'Saltar calentamiento e ir al gate →'}
      </button>
    </div>
  );
}
