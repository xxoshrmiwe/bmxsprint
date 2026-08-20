import { supabase } from './supabase';
import type { Club, HorarioEntrenamientoClub, MangaEntrenamiento, EntrenadorClub, AtletaClub } from './types';

export function generarCodigoInvite(nombre: string): string {
  const prefix = nombre.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'BMX';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export async function crearClubLocally(nombre: string, descripcion?: string): Promise<Club> {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'invitado';
  const club: Club = {
    id: `club_${Date.now()}`,
    codigoInvite: generarCodigoInvite(nombre),
    nombre,
    descripcion,
    creadoPor: userId,
    creadoEn: Date.now()
  };
  localStorage.setItem(`bmx_club_${club.id}`, JSON.stringify(club));
  localStorage.setItem(`bmx_mi_club`, JSON.stringify(club));
  return club;
}

// --- ENTRENADORES DEL CLUB ---
export function obtenerEntrenadoresClub(clubId: string): EntrenadorClub[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`bmx_entrenadores_${clubId}`);
  return raw ? JSON.parse(raw) : [];
}

export function agregarEntrenadorClub(clubId: string, nombre: string, email?: string, especialidad?: string): EntrenadorClub {
  const actuales = obtenerEntrenadoresClub(clubId);
  const nuevo: EntrenadorClub = {
    id: `ent_${Date.now()}`,
    clubId,
    nombre: nombre.trim(),
    email: email?.trim(),
    especialidad: especialidad?.trim(),
    creadoEn: Date.now()
  };
  const actualizados = [nuevo, ...actuales];
  localStorage.setItem(`bmx_entrenadores_${clubId}`, JSON.stringify(actualizados));
  return nuevo;
}

export function eliminarEntrenadorClub(clubId: string, entrenadorId: string): void {
  const actuales = obtenerEntrenadoresClub(clubId);
  const filtrados = actuales.filter((e) => e.id !== entrenadorId);
  localStorage.setItem(`bmx_entrenadores_${clubId}`, JSON.stringify(filtrados));
}

// --- ATLETAS DEL CLUB ---
export function obtenerAtletasClub(clubId: string): AtletaClub[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`bmx_atletas_${clubId}`);
  return raw ? JSON.parse(raw) : [];
}

export function agregarAtletaClub(clubId: string, nombre: string, edad: number, categoria: string): AtletaClub {
  const actuales = obtenerAtletasClub(clubId);
  const nuevo: AtletaClub = {
    id: `atl_${Date.now()}`,
    clubId,
    nombre: nombre.trim(),
    edad,
    categoria: categoria.trim(),
    creadoEn: Date.now()
  };
  const actualizados = [nuevo, ...actuales];
  localStorage.setItem(`bmx_atletas_${clubId}`, JSON.stringify(actualizados));
  return nuevo;
}

export function eliminarAtletaClub(clubId: string, atletaId: string): void {
  const actuales = obtenerAtletasClub(clubId);
  const filtrados = actuales.filter((a) => a.id !== atletaId);
  localStorage.setItem(`bmx_atletas_${clubId}`, JSON.stringify(filtrados));
}

// --- AGENDA SEMANAL DEL CLUB ---
export function obtenerHorariosClub(clubId: string): HorarioEntrenamientoClub[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(`bmx_agenda_${clubId}`);
  return raw ? JSON.parse(raw) : [];
}

export function agregarHorarioClub(
  clubId: string,
  diaSemana: HorarioEntrenamientoClub['diaSemana'],
  horaInicio: string,
  titulo: string,
  descripcion?: string
): HorarioEntrenamientoClub {
  const actuales = obtenerHorariosClub(clubId);
  const nuevo: HorarioEntrenamientoClub = {
    id: `hor_${Date.now()}`,
    clubId,
    diaSemana,
    horaInicio: horaInicio.trim(),
    titulo: titulo.trim(),
    descripcion: descripcion?.trim()
  };
  const actualizados = [...actuales, nuevo];
  localStorage.setItem(`bmx_agenda_${clubId}`, JSON.stringify(actualizados));
  return nuevo;
}

export function eliminarHorarioClub(clubId: string, horarioId: string): void {
  const actuales = obtenerHorariosClub(clubId);
  const filtrados = actuales.filter((h) => h.id !== horarioId);
  localStorage.setItem(`bmx_agenda_${clubId}`, JSON.stringify(filtrados));
}

// --- ANUNCIO POR VOZ ---
export function anunciarMangaPorVoz(manga: MangaEntrenamiento): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const textoAnuncio = `Manga ${manga.numeroManga} a la grilla. ` +
    manga.carriles.map((c) => `Carril ${c.carril}, ${c.corredorNombre}.`).join(' ');

  const utterance = new SpeechSynthesisUtterance(textoAnuncio);
  utterance.lang = 'es-ES';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
