import { supabase } from './supabase';
import type { Corredor } from './types';

export interface DatosRegistro {
  nombre: string;
  categoria?: string;
  edad?: number;
  email: string;
  password: string;
}

export async function registrarCorredor(datos: DatosRegistro): Promise<{ sesionActiva: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: {
        nombre: datos.nombre,
        categoria: datos.categoria ?? null,
        edad: datos.edad ?? null
      }
    }
  });

  if (error) throw error;

  return { sesionActiva: data.session !== null };
}

export async function iniciarSesion(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

export async function obtenerCorredorActual(): Promise<Corredor | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('corredores').select('*').eq('id', user.id).single();
  if (error || !data) return null;

  return {
    id: data.id,
    nombre: data.nombre,
    categoria: data.categoria ?? undefined,
    edad: data.edad ?? undefined,
    email: user.email ?? '',
    creadoEn: new Date(data.creado_en).getTime()
  };
}

export async function solicitarRecuperacion(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/restablecer-password`
  });
  if (error) throw error;
}

export async function actualizarPassword(nuevaPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
  if (error) throw error;
}
