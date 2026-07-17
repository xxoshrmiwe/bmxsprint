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

// Ritmo = tiempo normalizado cada 10 metros, para poder comparar/ponerse una
// meta única sin importar qué distancia se entrene ese día.
export function calcularRitmoMsPor10m(tiempoTotalMs: number, distanciaMetros: number): number {
  return tiempoTotalMs / (distanciaMetros / 10);
}

export function formatearRitmo(msPor10m: number): string {
  return `${(msPor10m / 1000).toFixed(2)} s /10m`;
}
