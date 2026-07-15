import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAdmin } from '../_lib/verificarAdmin.js';
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

  const { email } = (req.body ?? {}) as { email?: string };
  if (!email) {
    res.status(400).json({ error: 'Falta el correo del corredor.' });
    return;
  }

  const supabase = obtenerClienteAdmin();
  const origen = `https://${req.headers.host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origen}/restablecer-password`
  });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
