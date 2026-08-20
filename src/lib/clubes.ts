import { supabase } from './supabase';
import type { Club, HorarioEntrenamientoClub, MangaEntrenamiento } from './types';

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

export function anunciarMangaPorVoz(manga: MangaEntrenamiento): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const textoAnuncio = `Manga ${manga.numeroManga} a la grilla. ` +
    manga.carriles.map((c) => `Carril ${c.carril}, ${c.corredorNombre}.`).join(' ');

  const utterance = new SpeechSynthesisUtterance(textoAnuncio);
  utterance.lang = 'es-ES';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
