import type { RodadoRueda } from './types';

export interface DatosRodado {
  nombre: string;
  diametroInches: number;
  circunferenciaMetros: number;
}

export const TABLA_RODADOS: Record<RodadoRueda, DatosRodado> = {
  '20x1.75': { nombre: '20" x 1.75 (Estándar Pro)', diametroInches: 19.6, circunferenciaMetros: 1.56 },
  '20x1.50': { nombre: '20" x 1.50 (Junior/Expert)', diametroInches: 19.0, circunferenciaMetros: 1.51 },
  '20x1-3/8': { nombre: '20" x 1-3/8 (Mini/Junior)', diametroInches: 18.6, circunferenciaMetros: 1.48 },
  'OS20': { nombre: 'OS20 (Oversize 20")', diametroInches: 20.3, circunferenciaMetros: 1.62 },
  '24x1.75': { nombre: '24" x 1.75 (Cruiser 24")', diametroInches: 23.6, circunferenciaMetros: 1.88 }
};

export function calcularMetricasBMX(
  plato: number = 44,
  pinon: number = 16,
  rodadoKey: RodadoRueda = '20x1.75'
) {
  const infoRodado = TABLA_RODADOS[rodadoKey] || TABLA_RODADOS['20x1.75'];
  const gearRatio = pinon > 0 ? plato / pinon : 0;
  const gearInches = gearRatio * infoRodado.diametroInches;
  const rollOutMetros = gearRatio * infoRodado.circunferenciaMetros;

  return {
    gearRatio: Number(gearRatio.toFixed(3)),
    gearInches: Number(gearInches.toFixed(1)),
    rollOutMetros: Number(rollOutMetros.toFixed(2)),
    infoRodado
  };
}
