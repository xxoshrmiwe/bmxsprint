import { useState } from 'react';
import { solicitarRecuperacion } from '../lib/cuenta';

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
      <button onClick={onVolver} className="text-sm text-slate-500 hover:text-slate-700">
        ← Volver
      </button>

      <h1 className="text-xl font-bold text-slate-900">Recuperar contraseña</h1>

      {enviado ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-700">
          Te enviamos un correo a <strong>{email}</strong> con un enlace para elegir una nueva contraseña.
          Revisa también la carpeta de spam.
        </div>
      ) : (
        <>
          <p className="text-slate-500">
            Escribe el correo con el que te registraste y te mandamos un enlace para restablecer tu contraseña.
          </p>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
                placeholder="papa@correo.com"
              />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
