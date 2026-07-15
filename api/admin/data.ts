import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAdmin } from '../_lib/verificarAdmin.js';
import { obtenerClienteAdmin } from '../_lib/supabaseAdmin.js';

interface FilaCorredor {
  id: string;
  nombre: string;
  categoria: string | null;
  edad: number | null;
  creado_en: string;
}

interface FilaSesion {
  id: string;
  corredor_id: string;
  fecha: string;
}

interface FilaIntento {
  id: string;
  corredor_id: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const admin = await verificarAdmin(req);
  if (!admin) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const supabase = obtenerClienteAdmin();

  const [corredoresRes, sesionesRes, intentosRes, usuariosAuth] = await Promise.all([
    supabase.from('corredores').select('*'),
    supabase.from('sesiones').select('id, corredor_id, fecha'),
    supabase.from('intentos').select('id, corredor_id'),
    supabase.auth.admin.listUsers({ perPage: 1000 })
  ]);

  if (corredoresRes.error) {
    res.status(500).json({ error: corredoresRes.error.message });
    return;
  }

  const corredores = (corredoresRes.data ?? []) as FilaCorredor[];
  const sesiones = (sesionesRes.data ?? []) as FilaSesion[];
  const intentos = (intentosRes.data ?? []) as FilaIntento[];

  const emailPorId = new Map(usuariosAuth.data.users.map((u) => [u.id, u.email ?? '']));
  const sesionesPorCorredor = new Map<string, number>();
  const ultimaSesionPorCorredor = new Map<string, number>();
  for (const s of sesiones) {
    sesionesPorCorredor.set(s.corredor_id, (sesionesPorCorredor.get(s.corredor_id) ?? 0) + 1);
    const fechaMs = new Date(s.fecha).getTime();
    const actual = ultimaSesionPorCorredor.get(s.corredor_id) ?? 0;
    if (fechaMs > actual) ultimaSesionPorCorredor.set(s.corredor_id, fechaMs);
  }
  const intentosPorCorredor = new Map<string, number>();
  for (const i of intentos) {
    intentosPorCorredor.set(i.corredor_id, (intentosPorCorredor.get(i.corredor_id) ?? 0) + 1);
  }

  const ahora = Date.now();
  const hace7Dias = ahora - 7 * 24 * 60 * 60 * 1000;

  const usuarios = corredores.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    categoria: c.categoria,
    edad: c.edad,
    email: emailPorId.get(c.id) ?? '(sin correo)',
    creadoEn: c.creado_en,
    totalSesiones: sesionesPorCorredor.get(c.id) ?? 0,
    totalIntentos: intentosPorCorredor.get(c.id) ?? 0,
    ultimaSesion: ultimaSesionPorCorredor.get(c.id) ?? null
  }));

  const resumen = {
    totalCorredores: usuarios.length,
    totalSesiones: sesiones.length,
    totalIntentos: intentos.length,
    corredoresNuevosUltimos7Dias: usuarios.filter((u) => new Date(u.creadoEn).getTime() >= hace7Dias).length,
    sesionesUltimos7Dias: sesiones.filter((s) => new Date(s.fecha).getTime() >= hace7Dias).length
  };

  res.status(200).json({ usuarios, resumen });
}
