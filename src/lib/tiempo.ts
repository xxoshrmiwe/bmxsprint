export function formatearTiempo(ms: number): string {
  const totalCentesimas = Math.round(ms / 10);
  const centesimas = totalCentesimas % 100;
  const totalSeg = Math.floor(totalCentesimas / 100);
  const seg = totalSeg % 60;
  const min = Math.floor(totalSeg / 60);
  const segTxt = min > 0 ? seg.toString().padStart(2, '0') : seg.toString();
  const prefijo = min > 0 ? `${min}:` : '';
  return `${prefijo}${segTxt}.${centesimas.toString().padStart(2, '0')}`;
}

// Constante de overhead para el arranque de gate en BMX (reacción + aceleración de 0 a top speed)
// Aproximadamente 1.15 segundos (1150 ms)
export const PENALIZACION_ARRANQUE_MS = 1150;

/**
 * Calcula el ritmo de velocidad lanzada (en ms por cada 10 metros).
 * Descuenta la constante de arranque para no sesgar los sprints cortos (10m)
 * frente a los sprints más largos (50m).
 */
export function calcularRitmoMsPor10m(tiempoTotalMs: number, distanciaMetros: number): number {
  if (distanciaMetros <= 0) return 0;

  if (distanciaMetros <= 5) {
    return tiempoTotalMs / (distanciaMetros / 10);
  }

  const tiempoLanzadoMs = Math.max(100, tiempoTotalMs - PENALIZACION_ARRANQUE_MS);
  return tiempoLanzadoMs / (distanciaMetros / 10);
}

/**
 * Pronostica el tiempo estimado (en ms) para CUALQUIER distancia manual u oficial
 * dado un ritmo de velocidad lanzada (ms/10m).
 */
export function pronosticarTiempoMs(ritmoLanzadoMsPor10m: number, distanciaObjetivoMetros: number): number {
  if (distanciaObjetivoMetros <= 0) return 0;
  if (distanciaObjetivoMetros <= 5) {
    return ritmoLanzadoMsPor10m * (distanciaObjetivoMetros / 10);
  }
  return PENALIZACION_ARRANQUE_MS + ritmoLanzadoMsPor10m * (distanciaObjetivoMetros / 10);
}

export function formatearRitmo(msPor10m: number): string {
  return `${(msPor10m / 1000).toFixed(2)} s /10m (lanzado)`;
}
