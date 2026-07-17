import type { VercelRequest } from '@vercel/node';
import { obtenerClienteAdmin } from './supabaseAdmin.js';

export interface AdminVerificado {
  id: string;
  email: string;
}

export function listaAdmins(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function verificarAdmin(req: VercelRequest): Promise<AdminVerificado | null> {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  const admins = listaAdmins();
  if (admins.length === 0) return null;

  const supabase = obtenerClienteAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || !data.user.email) return null;

  const email = data.user.email.toLowerCase();
  if (!admins.includes(email)) return null;

  return { id: data.user.id, email };
}
