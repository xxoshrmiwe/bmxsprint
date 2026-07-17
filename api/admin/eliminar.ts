import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAdmin, listaAdmins } from '../_lib/verificarAdmin.js';
import { obtenerClienteAdmin } from '../_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const admin = await verificarAdmin(req);
  if (!admin) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  const { id, email } = (req.body ?? {}) as { id?: string; email?: string };
  if (!id) {
    res.status(400).json({ error: 'Falta el id del corredor.' });
    return;
  }

  if (email && listaAdmins().includes(email.trim().toLowerCase())) {
    res.status(400).json({ error: 'No se puede eliminar una cuenta de administrador.' });
    return;
  }

  const supabase = obtenerClienteAdmin();
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
