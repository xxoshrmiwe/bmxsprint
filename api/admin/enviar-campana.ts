import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAdmin } from '../_lib/verificarAdmin.js';
import { obtenerClienteAdmin } from '../_lib/supabaseAdmin.js';

const REMITENTE_DEFAULT = 'GATERIGHT BMX <onboarding@resend.dev>';
const MAX_LARGO_HTML = 50000;

interface ResendPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

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

  const { asunto, html, esPrueba = true, emailPrueba } = (req.body ?? {}) as {
    asunto?: string;
    html?: string;
    esPrueba?: boolean;
    emailPrueba?: string;
  };

  if (!asunto || !asunto.trim()) {
    res.status(400).json({ error: 'El asunto del correo no puede estar vacío.' });
    return;
  }

  if (!html || !html.trim()) {
    res.status(400).json({ error: 'El cuerpo HTML del correo no puede estar vacío.' });
    return;
  }

  if (html.length > MAX_LARGO_HTML) {
    res.status(400).json({ error: 'El contenido HTML es demasiado extenso.' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'No se ha configurado la variable de entorno RESEND_API_KEY en el servidor.' });
    return;
  }

  try {
    let destinatarios: string[] = [];

    if (esPrueba) {
      const emailDestino = (emailPrueba || admin.email).trim().toLowerCase();
      if (!emailDestino.includes('@')) {
        res.status(400).json({ error: 'El correo de prueba proporcionado no es válido.' });
        return;
      }
      destinatarios = [emailDestino];
    } else {
      const supabase = obtenerClienteAdmin();
      const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (error) {
        console.error('Error al listar usuarios para campaña:', error);
        res.status(500).json({ error: 'Error al consultar la lista de corredores.' });
        return;
      }

      destinatarios = (data.users ?? [])
        .map((u) => u.email?.trim().toLowerCase())
        .filter((e): e is string => Boolean(e && e.includes('@')));

      if (destinatarios.length === 0) {
        res.status(400).json({ error: 'No se encontraron corredores con correo registrado.' });
        return;
      }
    }

    let totalEnviados = 0;
    let totalErrores = 0;

    // Enviar individualmente o en lotes de Resend (máximo 100 por lote en /emails/batch)
    const TAMANO_LOTE = 100;
    for (let i = 0; i < destinatarios.length; i += TAMANO_LOTE) {
      const loteEmails = destinatarios.slice(i, i + TAMANO_LOTE);

      const batchPayload: ResendPayload[] = loteEmails.map((dest) => ({
        from: REMITENTE_DEFAULT,
        to: [dest],
        subject: asunto.trim(),
        html
      }));

      const respuesta = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batchPayload)
      });

      if (respuesta.ok) {
        totalEnviados += loteEmails.length;
      } else {
        const errorText = await respuesta.text();
        console.error(`Error enviando lote de correos (${i} - ${i + loteEmails.length}):`, errorText);
        totalErrores += loteEmails.length;
      }
    }

    if (totalEnviados === 0 && totalErrores > 0) {
      res.status(500).json({
        ok: false,
        error: 'No se pudo enviar ningún correo. Verifica tus credenciales y limites de Resend.'
      });
      return;
    }

    res.status(200).json({
      ok: true,
      enviados: totalEnviados,
      errores: totalErrores,
      mensaje: esPrueba
        ? `Correo de prueba enviado con éxito a ${destinatarios[0]}.`
        : `Campaña enviada con éxito a ${totalEnviados} corredor(es).`
    });
  } catch (err) {
    console.error('Error al procesar envío de campaña de email:', err);
    res.status(500).json({ error: 'Ocurrió un error inesperado al procesar la campaña.' });
  }
}
