export type RodadoRueda = '20x1.75' | '20x1.50' | '20x1-3/8' | 'OS20' | '24x1.75';

export type TallaCuadro =
  | 'Micro'
  | 'Mini'
  | 'Junior'
  | 'Expert'
  | 'Expert XL'
  | 'Pro'
  | 'Pro XL'
  | 'Pro XXL'
  | 'Pro XXXL'
  | 'Cruiser 24"';

export interface Corredor {
  id: string;
  nombre: string;
  categoria?: string;
  edad?: number;
  email: string;
  creadoEn: number;
  estaturaCm?: number;
  entrepiernaCm?: number;
  dientesPlato?: number;
  dientesPinon?: number;
  rodadoRueda?: RodadoRueda;
  tallaCuadro?: TallaCuadro;
  largoBielasMm?: number;
  tipoPedales?: 'clips' | 'plataforma';
}

export interface TransmisionSnapshot {
  plato: number;
  pinon: number;
  gearInches: number;
  rollOutMetros: number;
}

export interface Sesion {
  id: string;
  corredorId: string;
  fecha: number;
  distanciaMetros: number;
  calentamientoRealizado: boolean;
  modoMedicion?: 'asistido' | 'acelerometro';
  notas?: string;
  transmisionSnapshot?: TransmisionSnapshot;
}

export interface PuntoTelemetria {
  t: number; // tiempo transcurrido en ms
  a: number; // magnitud de la fuerza/aceleración en m/s^2
  v?: number; // velocidad GPS Doppler instantánea en m/s
}

export interface Intento {
  id: string;
  sesionId: string;
  corredorId: string;
  numero: number;
  audioId: string;
  tiempoTotalMs: number;
  creadoEn: number;
  telemetria?: PuntoTelemetria[];
}

export interface Meta {
  corredorId: string;
  ritmoObjetivoMsPor10m: number;
  creadoEn: number;
}

export interface BackupCorredor {
  version: 2;
  corredorNombre: string;
  exportadoEn: number;
  sesiones: Sesion[];
  intentos: Intento[];
}
