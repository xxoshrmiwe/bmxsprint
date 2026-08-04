import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verificarAdmin } from '../_lib/verificarAdmin.js';
import { obtenerClienteAdmin } from '../_lib/supabaseAdmin.js';

const REMITENTE_DEFAULT = process.env.RESEND_FROM_EMAIL || 'GATERIGHT BMX <noticias@gaterightbmx.com>';
const MAX_LARGO_HTML = 50000;

// Lista de dominios ficticios/de prueba que Resend rechaza estrictamente
const DOMINIOS_DISCARD = ['example.com', 'example.org', 'example.net', 'test.com', 'testing.com', 'localhost', 'invalid'];

function esEmailValidoParaResend(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const dominio = email.split('@')[1]?.toLowerCase().trim();
  if (!dominio) return false;
  return !DOMINIOS_DISCARD.some((d) => dominio === d || dominio.endsWith('.' + d));
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
    res.status(500).json({ error: 'Falta configurar la variable de entorno RESEND_API_KEY en Vercel.' });
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
        .filter((e): e is string => Boolean(e && esEmailValidoParaResend(e)));

      if (destinatarios.length === 0) {
        res.status(400).json({ error: 'No se encontraron corredores con correos válidos para envío.' });
        return;
      }
    }

    let totalEnviados = 0;
    let totalErrores = 0;
    let ultimoErrorResend = '';

    // Enviar a los destinatarios mediante solicitudes individuales tolerantes a fallos (en paralelo de 5 en 5)
    const TAMANO_CONCURRENCIA = 5;
    for (let i = 0; i < destinatarios.length; i += TAMANO_CONCURRENCIA) {
      const grupo = destinatarios.slice(i, i + TAMANO_CONCURRENCIA);

      const promesas = grupo.map(async (destino) => {
        try {
          const respuesta = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: REMITENTE_DEFAULT,
              to: [destino],
              subject: asunto.trim(),
              html
            })
          });

          if (respuesta.ok) {
            return { ok: true };
          } else {
            const errorText = await respuesta.text();
            let msj = errorText;
            try {
              const jsonErr = JSON.parse(errorText);
              msj = jsonErr.message || jsonErr.error || errorText;
            } catch {
              // usar errorText
            }
            return { ok: false, error: msj };
          }
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Error de red' };
        }
      });

      const resultados = await Promise.all(promesas);

      for (const r of resultados) {
        if (r.ok) {
          totalEnviados++;
        } else {
          totalErrores++;
          if (r.error) ultimoErrorResend = r.error;
        }
      }
    }

    if (totalEnviados === 0 && totalErrores > 0) {
      res.status(400).json({
        ok: false,
        error: `Resend rechazó el envío: ${ultimoErrorResend || 'Verifica la configuración de tu cuenta.'}`
      });
      return;
    }

    res.status(200).json({
      ok: true,
      enviados: totalEnviados,
      errores: totalErrores,
      mensaje: esPrueba
        ? `Correo de prueba enviado con éxito a ${destinatarios[0]}.`
        : `Campaña procesada: ${totalEnviados} correo(s) enviado(s) con éxito${totalErrores > 0 ? `, ${totalErrores} omitido(s)` : ''}.`
    });
  } catch (err) {
    console.error('Error al procesar envío de campaña de email:', err);
    res.status(500).json({ error: 'Ocurrió un error inesperado al procesar la campaña.' });
  }
}
