import { useEffect, useMemo, useRef, useState } from 'react';
import { obtenerRutina } from '../lib/warmup';

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
        <h1 className="text-xl font-bold text-slate-900">Calentamiento</h1>
        <p className="text-slate-500">
          {terminado ? 'Rutina completa' : `Ejercicio ${indice + 1} de ${rutina.length}`}
        </p>
      </div>

      {terminado ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-semibold text-emerald-800">¡Calentamiento listo!</p>
          <p className="text-emerald-700">A darle al gate.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <span className="font-mono text-6xl font-bold tabular-nums text-slate-900">
            {formatearSegundos(msRestante)}
          </span>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">{ejercicio.nombre}</h2>
          <ul className="mt-3 space-y-1 text-left text-sm text-slate-600">
            {ejercicio.pasos.map((paso, i) => (
              <li key={i}>• {paso}</li>
            ))}
          </ul>
        </div>
      )}

      {!terminado && (
        <div className="flex gap-3">
          {!corriendo ? (
            <button
              onClick={() => setCorriendo(true)}
              className="flex-1 rounded-md bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700"
            >
              {msRestante === ejercicio.segundos * 1000 ? 'Iniciar' : 'Reanudar'}
            </button>
          ) : (
            <button
              onClick={() => setCorriendo(false)}
              className="flex-1 rounded-md bg-amber-500 px-4 py-3 font-medium text-white hover:bg-amber-600"
            >
              Pausar
            </button>
          )}
          <button
            onClick={saltarEjercicio}
            className="rounded-md border border-slate-300 px-4 py-3 text-slate-600 hover:bg-slate-50"
          >
            Siguiente
          </button>
        </div>
      )}

      <button
        onClick={onListo}
        className="w-full rounded-md border border-slate-900 px-4 py-3 font-medium text-slate-900 hover:bg-slate-50"
      >
        {terminado ? 'Ir al gate →' : 'Saltar calentamiento e ir al gate →'}
      </button>
    </div>
  );
}
