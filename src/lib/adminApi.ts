import { supabase } from './supabase';

async function encabezadoAuth(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('No hay sesión activa.');
  return { Authorization: `Bearer ${token}` };
}

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  categoria: string | null;
  edad: number | null;
  email: string;
  creadoEn: string;
  totalSesiones: number;
  totalIntentos: number;
  ultimaSesion: number | null;
}

export interface ResumenAdmin {
  totalCorredores: number;
  totalSesiones: number;
  totalIntentos: number;
  corredoresNuevosUltimos7Dias: number;
  sesionesUltimos7Dias: number;
}

export interface DatosAdmin {
  usuarios: UsuarioAdmin[];
  resumen: ResumenAdmin;
}

export async function obtenerDatosAdmin(): Promise<DatosAdmin> {
  const headers = await encabezadoAuth();
  const res = await fetch('/api/admin/data', { headers });
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new Error(cuerpo.error ?? 'No autorizado');
  }
  return res.json();
}

export async function enviarRecuperacion(email: string): Promise<void> {
  const headers = await encabezadoAuth();
  const res = await fetch('/api/admin/recuperar', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new Error(cuerpo.error ?? 'No se pudo enviar el correo.');
  }
}

export async function eliminarCorredor(id: string, email: string): Promise<void> {
  const headers = await encabezadoAuth();
  const res = await fetch('/api/admin/eliminar', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, email })
  });
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new Error(cuerpo.error ?? 'No se pudo eliminar la cuenta.');
  }
}

export async function generarEnlaceEntrarComo(email: string): Promise<string> {
  const headers = await encabezadoAuth();
  const res = await fetch('/api/admin/entrar-como', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new Error(cuerpo.error ?? 'No se pudo generar el enlace.');
  }
  const { link } = await res.json();
  return link;
}
