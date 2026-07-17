import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_LARGO_MENSAJE = 2000;

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { mensaje, sitioWeb } = (req.body ?? {}) as { mensaje?: string; sitioWeb?: string };

  // Campo trampa: invisible para una persona, pero los bots suelen rellenar
  // todos los campos del formulario. Si viene lleno, se descarta en
  // silencio (sin avisarle al bot que fue detectado).
  if (sitioWeb) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!mensaje || !mensaje.trim()) {
    res.status(400).json({ error: 'Escribe una idea antes de enviar.' });
    return;
  }
  if (mensaje.length > MAX_LARGO_MENSAJE) {
    res.status(400).json({ error: 'El mensaje es demasiado largo.' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destinatario = process.env.FEEDBACK_TO_EMAIL;
  if (!apiKey || !destinatario) {
    console.error('Falta configurar RESEND_API_KEY o FEEDBACK_TO_EMAIL');
    res.status(500).json({ error: 'El buzón de ideas no está configurado todavía.' });
    return;
  }

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GATERIGHT BMX <onboarding@resend.dev>',
        to: [destinatario],
        subject: 'Nueva idea en GATERIGHT BMX',
        html: `<p>${escaparHtml(mensaje).replace(/\n/g, '<br>')}</p>`
      })
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('Resend rechazó el envío:', respuesta.status, detalle);
      res.status(500).json({ error: 'No se pudo enviar la idea. Intenta de nuevo más tarde.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error enviando la idea:', err);
    res.status(500).json({ error: 'No se pudo enviar la idea. Intenta de nuevo más tarde.' });
  }
}
