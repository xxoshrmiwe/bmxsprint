import { useState } from 'react';
import { solicitarRecuperacion } from '../lib/cuenta';
import { IconoAlerta, IconoCheck } from './Icono';

interface Props {
  onVolver: () => void;
}

export default function OlvideContrasena({ onVolver }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await solicitarRecuperacion(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <button onClick={onVolver} className="btn-ghost">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold text-foreground">Recuperar contraseña</h1>

      {enviado ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-primary">
          <IconoCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <span>
            Te enviamos un correo a <strong>{email}</strong> con un enlace para elegir una nueva contraseña.
            Revisa también la carpeta de spam.
          </span>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground">
            Escribe el correo con el que te registraste y te mandamos un enlace para restablecer tu contraseña.
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="input"
                placeholder="papa@correo.com"
              />
            </div>
            <button type="submit" disabled={enviando} className="btn-primary w-full">
              {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
