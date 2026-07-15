import { supabase } from './supabase';
import type { Sesion, Intento, BackupCorredor } from './types';

export async function crearSesion(datos: {
  corredorId: string;
  distanciaMetros: number;
  calentamientoRealizado: boolean;
  notas?: string;
}): Promise<Sesion> {
  const { data, error } = await supabase
    .from('sesiones')
    .insert({
      corredor_id: datos.corredorId,
      distancia_metros: datos.distanciaMetros,
      calentamiento_realizado: datos.calentamientoRealizado,
      notas: datos.notas ?? null
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('No se pudo crear la sesión');

  return {
    id: data.id,
    corredorId: data.corredor_id,
    fecha: new Date(data.fecha).getTime(),
    distanciaMetros: data.distancia_metros,
    calentamientoRealizado: data.calentamiento_realizado,
    notas: data.notas ?? undefined
  };
}

export async function listarSesionesPorCorredor(corredorId: string): Promise<Sesion[]> {
  const { data, error } = await supabase
    .from('sesiones')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('fecha', { ascending: false });

  if (error || !data) return [];

  return data.map((s) => ({
    id: s.id,
    corredorId: s.corredor_id,
    fecha: new Date(s.fecha).getTime(),
    distanciaMetros: s.distancia_metros,
    calentamientoRealizado: s.calentamiento_realizado,
    notas: s.notas ?? undefined
  }));
}

export async function crearIntento(datos: {
  sesionId: string;
  corredorId: string;
  numero: number;
  audioId: string;
  tiempoTotalMs: number;
}): Promise<Intento> {
  const { data, error } = await supabase
    .from('intentos')
    .insert({
      sesion_id: datos.sesionId,
      corredor_id: datos.corredorId,
      numero: datos.numero,
      audio_id: datos.audioId,
      tiempo_total_ms: datos.tiempoTotalMs
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error('No se pudo guardar el intento');

  return {
    id: data.id,
    sesionId: data.sesion_id,
    corredorId: data.corredor_id,
    numero: data.numero,
    audioId: data.audio_id,
    tiempoTotalMs: data.tiempo_total_ms,
    creadoEn: new Date(data.creado_en).getTime()
  };
}

export async function listarIntentosPorSesion(sesionId: string): Promise<Intento[]> {
  const { data, error } = await supabase
    .from('intentos')
    .select('*')
    .eq('sesion_id', sesionId)
    .order('numero', { ascending: true });

  if (error || !data) return [];

  return data.map(mapIntento);
}

export async function listarIntentosPorCorredor(corredorId: string): Promise<Intento[]> {
  const { data, error } = await supabase
    .from('intentos')
    .select('*')
    .eq('corredor_id', corredorId)
    .order('creado_en', { ascending: false });

  if (error || !data) return [];

  return data.map(mapIntento);
}

function mapIntento(i: any): Intento {
  return {
    id: i.id,
    sesionId: i.sesion_id,
    corredorId: i.corredor_id,
    numero: i.numero,
    audioId: i.audio_id,
    tiempoTotalMs: i.tiempo_total_ms,
    creadoEn: new Date(i.creado_en).getTime()
  };
}

export async function exportarCorredor(corredorId: string, corredorNombre: string): Promise<BackupCorredor> {
  const [sesiones, intentos] = await Promise.all([
    listarSesionesPorCorredor(corredorId),
    listarIntentosPorCorredor(corredorId)
  ]);

  return { version: 2, corredorNombre, exportadoEn: Date.now(), sesiones, intentos };
}

export async function importarCorredor(backup: BackupCorredor, corredorIdActual: string): Promise<void> {
  const mapaSesiones = new Map<string, string>();

  for (const sesion of backup.sesiones) {
    const nueva = await crearSesion({
      corredorId: corredorIdActual,
      distanciaMetros: sesion.distanciaMetros,
      calentamientoRealizado: sesion.calentamientoRealizado,
      notas: sesion.notas
    });
    mapaSesiones.set(sesion.id, nueva.id);
  }

  for (const intento of backup.intentos) {
    const sesionId = mapaSesiones.get(intento.sesionId);
    if (!sesionId) continue;
    await crearIntento({
      sesionId,
      corredorId: corredorIdActual,
      numero: intento.numero,
      audioId: intento.audioId,
      tiempoTotalMs: intento.tiempoTotalMs
    });
  }
}
