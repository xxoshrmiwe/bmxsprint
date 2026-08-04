import { useState } from 'react';
import { enviarCampanaEmail, type ResultadoCampana } from '../lib/adminApi';
import { IconoAlerta, IconoCheck } from './Icono';

interface Props {
  emailAdmin: string;
  totalCorredores: number;
}

const PLANTILLAS = [
  {
    nombre: '⚡ Recordatorio de Entrenamiento',
    asunto: '¡Es hora de entrenar tu salida en GATERIGHT BMX!',
    html: `<meta charset="UTF-8">
<div style="background-color: #0b0f19; padding: 30px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #151c2c; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 30px rgba(0, 0, 0, 0.3);">
    
    <!-- Barra Superior de Gradiente Deportivo -->
    <div style="height: 5px; background: linear-gradient(90deg, #059669 0%, #f97316 50%, #ea580c 100%);"></div>

    <!-- Encabezado de Marca -->
    <div style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
      <div style="display: inline-block; background-color: rgba(249, 115, 22, 0.12); color: #f97316; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(249, 115, 22, 0.2); margin-bottom: 12px;">
        BMX RACING • ENTRENAMIENTO
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
        GATERIGHT <span style="color: #f97316;">BMX</span>
      </h1>
      <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Medición de precisión para tu gate drop</p>
    </div>

    <!-- Cuerpo del Correo -->
    <div style="padding: 32px;">
      <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">
        ¡Hora de bajar centésimas a tu arranque! 🏁
      </h2>
      <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px; margin: 0 0 20px 0;">
        Recuerda que en el BMX la carrera se gana en los primeros 10 metros. Mantener tu racha de entrenamientos fuera de la pista es el secreto para reaccionar antes que nadie cuando cae la puerta.
      </p>

      <!-- Caja destacada de Tip de Entrenamiento -->
      <div style="background: linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%); border-left: 4px solid #059669; border-radius: 10px; padding: 18px; margin: 24px 0;">
        <div style="color: #34d399; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
          💡 Tip de Reacción del Día
        </div>
        <p style="color: #e2e8f0; font-size: 14px; line-height: 1.5; margin: 0;">
          Realiza 5 sprints explosivos concentrándote en el <strong>último bip del audio</strong>. No intentes adivinar el ritmo; entrena tus reflejos al sonido.
        </p>
      </div>

      <!-- Botón de Acción Principal -->
      <div style="text-align: center; margin: 36px 0 16px 0;">
        <a href="https://gaterightbmx.com/" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 10px 20px rgba(234, 88, 12, 0.3);">
          Iniciar Sesión de Gate
        </a>
      </div>
    </div>

    <!-- Pie de Página -->
    <div style="padding: 20px 32px; background-color: #0d1320; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; font-weight: 500;">
        GATERIGHT BMX — Entrena tu arranque donde estés
      </p>
      <p style="color: #475569; font-size: 11px; margin: 0;">
        Recibiste este correo porque tienes una cuenta registrada en <a href="https://gaterightbmx.com" style="color: #f97316; text-decoration: none;">gaterightbmx.com</a>.
      </p>
    </div>

  </div>
</div>`
  },
  {
    nombre: '🚀 Nueva Actualización',
    asunto: 'Nuevas funciones disponibles en GATERIGHT BMX',
    html: `<meta charset="UTF-8">
<div style="background-color: #0b0f19; padding: 30px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #151c2c; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 30px rgba(0, 0, 0, 0.3);">
    
    <!-- Barra Superior -->
    <div style="height: 5px; background: linear-gradient(90deg, #3b82f6 0%, #059669 50%, #f97316 100%);"></div>

    <!-- Encabezado -->
    <div style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
      <div style="display: inline-block; background-color: rgba(5, 150, 105, 0.12); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(5, 150, 105, 0.2); margin-bottom: 12px;">
        NOVEDADES DE LA APP
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
        GATERIGHT <span style="color: #f97316;">BMX</span>
      </h1>
    </div>

    <!-- Cuerpo -->
    <div style="padding: 32px;">
      <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">
        ¡Hemos actualizado tu experiencia! 🎉
      </h2>
      <p style="color: #cbd5e1; line-height: 1.6; font-size: 15px; margin: 0 0 24px 0;">
        Seguimos trabajando para darte la herramienta más precisa de entrenamiento. Estas son las novedades que ya puedes usar en tu cuenta:
      </p>

      <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.05);">
        <div style="margin-bottom: 16px;">
          <h3 style="color: #f97316; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">📈 Estadísticas y Ritmo Lanzado</h3>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">Medición mejorada descontando el arranque para comparar distancias de 10m a 50m con precisión.</p>
        </div>
        <div style="margin-bottom: 16px;">
          <h3 style="color: #34d399; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">🎯 Pronóstico de Tiempos</h3>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">Descubre cuál sería tu tiempo en cualquier distancia en función de tu mejor ritmo.</p>
        </div>
        <div>
          <h3 style="color: #60a5fa; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">🌐 Dominio Oficial</h3>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">Accede ahora directamente desde tu navegador en <strong style="color: #ffffff;">gaterightbmx.com</strong>.</p>
        </div>
      </div>

      <!-- Botón CTA -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="https://gaterightbmx.com/" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 10px 20px rgba(5, 150, 105, 0.3);">
          Ver Nuevas Funciones
        </a>
      </div>
    </div>

    <!-- Pie -->
    <div style="padding: 20px 32px; background-color: #0d1320; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06);">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0;">GATERIGHT BMX • La app para corredores de BMX</p>
      <p style="color: #475569; font-size: 11px; margin: 0;"><a href="https://gaterightbmx.com" style="color: #f97316; text-decoration: none;">gaterightbmx.com</a></p>
    </div>

  </div>
</div>`
  }
];

export default function AdminEmailCampaign({ emailAdmin, totalCorredores }: Props) {
  const [asunto, setAsunto] = useState(PLANTILLAS[0].asunto);
  const [html, setHtml] = useState(PLANTILLAS[0].html);
  const [tabVisualizacion, setTabVisualizacion] = useState<'editor' | 'preview'>('editor');

  const [esPrueba, setEsPrueba] = useState(true);
  const [emailPrueba, setEmailPrueba] = useState(emailAdmin);

  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCampana | null>(null);
  const [errorMsj, setErrorMsj] = useState<string | null>(null);

  function cargarPlantilla(index: number) {
    const p = PLANTILLAS[index];
    if (p) {
      setAsunto(p.asunto);
      setHtml(p.html);
      setResultado(null);
      setErrorMsj(null);
    }
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    setErrorMsj(null);

    if (!esPrueba) {
      const confirmado = window.confirm(
        `¿Estás seguro de enviar esta campaña a los ${totalCorredores} corredores registrados? Esta acción no se puede deshacer.`
      );
      if (!confirmado) return;
    }

    setEnviando(true);
    try {
      const res = await enviarCampanaEmail({
        asunto,
        html,
        esPrueba,
        emailPrueba: esPrueba ? emailPrueba : undefined
      });
      setResultado(res);
    } catch (err) {
      setErrorMsj(err instanceof Error ? err.message : 'Error al enviar la campaña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Crear Campaña de Email</h2>
            <p className="text-xs text-muted-foreground">
              Redacta el boletín o mensaje masivo en HTML para enviar a los corredores registrados.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Plantillas rápidas:</span>
            {PLANTILLAS.map((p, idx) => (
              <button
                key={p.nombre}
                type="button"
                onClick={() => cargarPlantilla(idx)}
                className="cursor-pointer rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {p.nombre}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleEnviar} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground" htmlFor="asunto">
              Asunto del correo
            </label>
            <input
              id="asunto"
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: ¡Nuevo reto esta semana en GATERIGHT BMX!"
              required
              className="input w-full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Contenido del correo (HTML)</label>
              <div className="flex rounded-lg border border-border bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setTabVisualizacion('editor')}
                  className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tabVisualizacion === 'editor' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Código HTML
                </button>
                <button
                  type="button"
                  onClick={() => setTabVisualizacion('preview')}
                  className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tabVisualizacion === 'preview' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Vista previa
                </button>
              </div>
            </div>

            {tabVisualizacion === 'editor' ? (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={14}
                required
                className="input w-full font-mono text-xs leading-relaxed"
                placeholder="<h1>Tu HTML aquí...</h1>"
              />
            ) : (
              <div className="min-h-[320px] rounded-xl border border-border bg-slate-900 p-4">
                <div className="mx-auto max-w-[600px] overflow-hidden rounded-lg shadow-lg">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Modo de Envío</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="modoEnvio"
                  checked={esPrueba}
                  onChange={() => setEsPrueba(true)}
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">Envío de prueba (1 correo)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="modoEnvio"
                  checked={!esPrueba}
                  onChange={() => setEsPrueba(false)}
                  className="accent-primary"
                />
                <span className="font-medium text-foreground">
                  Difusión masiva a todos los corredores ({totalCorredores})
                </span>
              </label>
            </div>

            {esPrueba && (
              <div className="pt-2">
                <label className="mb-1 block text-xs text-muted-foreground" htmlFor="emailPrueba">
                  Enviar prueba a:
                </label>
                <input
                  id="emailPrueba"
                  type="email"
                  value={emailPrueba}
                  onChange={(e) => setEmailPrueba(e.target.value)}
                  placeholder="tu@correo.com"
                  required={esPrueba}
                  className="input max-w-sm"
                />
              </div>
            )}
          </div>

          {errorMsj && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsj}</span>
            </div>
          )}

          {resultado && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              <IconoCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{resultado.mensaje ?? 'Campaña procesada con éxito.'}</p>
                <p className="text-xs opacity-80">Enviados: {resultado.enviados} | Errores: {resultado.errores}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={enviando}
              className={esPrueba ? 'btn-secondary' : 'btn-primary'}
            >
              {enviando
                ? 'Enviando...'
                : esPrueba
                ? 'Enviar correo de prueba'
                : `Enviar campaña a ${totalCorredores} corredores`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
