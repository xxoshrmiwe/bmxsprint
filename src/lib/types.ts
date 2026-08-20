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

export const CATEGORIAS_BMX_ESTANDAR = [
  'Principiantes (5 - 8 años)',
  'Principiantes (9 - 12 años)',
  'Novatos (6 y menos)',
  'Novatos (7 - 8 años)',
  'Novatos (9 - 10 años)',
  'Novatos (11 - 12 años)',
  'Novatos (13 - 14 años)',
  'Novatos (15 - 16 años)',
  'Novatos (17+ años)',
  'Expertos (6 y menos)',
  'Expertos (7 - 8 años)',
  'Expertos (9 - 10 años)',
  'Expertos (11 - 12 años)',
  'Expertos (13 - 14 años)',
  'Expertos (15 - 16 años)',
  'Expertos (17 - 24 años)',
  'Expertos (25+ años)',
  'Damas Novatas / Expertas',
  'Cruiser (24")',
  'Junior Championship',
  'Under 23',
  'Elite Pro'
] as const;

export interface Corredor {
  id: string;
  nombre: string;
  categoria?: string;
  edad?: number;
  email: string;
  creadoEn: number;
  fotoUrl?: string;
  avatarPreset?: string;
  fotoBiciUrl?: string;
  pesoKg?: number;
  estaturaCm?: number;
  entrepiernaCm?: number;
  dientesPlato?: number;
  dientesPinon?: number;
  rodadoRueda?: RodadoRueda;
  tallaCuadro?: TallaCuadro;
  largoBielasMm?: number;
  tipoPedales?: 'clips' | 'plataforma';
  rol?: RolClub;
  nombreClub?: string;
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

export type RolClub = 'entrenador' | 'atleta';

export interface Club {
  id: string;
  codigoInvite: string;
  nombre: string;
  descripcion?: string;
  creadoPor: string;
  creadoEn: number;
}

export interface MiembroClub {
  clubId: string;
  corredorId: string;
  rol: RolClub;
  unidoEn: number;
}

export interface EntrenadorClub {
  id: string;
  clubId: string;
  nombre: string;
  email?: string;
  password?: string;
  especialidad?: string;
  creadoEn: number;
}

export interface AtletaClub {
  id: string;
  clubId: string;
  nombre: string;
  edad: number;
  categoria: string;
  telefonoPadres?: string;
  pesoKg?: number;
  esRegistrado?: boolean;
  corredorId?: string;
  creadoEn: number;
}

export interface HorarioEntrenamientoClub {
  id: string;
  clubId: string;
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string;
  titulo: string;
  descripcion?: string;
}

export interface AsignacionCarrilManga {
  carril: number;
  corredorId: string;
  corredorNombre: string;
  tiempoTotalMs?: number;
}

export interface MangaEntrenamiento {
  id: string;
  clubId: string;
  numeroManga: number;
  carriles: AsignacionCarrilManga[];
  creadoEn: number;
}

