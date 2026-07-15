import { useState } from 'react';
import { iniciarSesion } from '../lib/cuenta';

interface Props {
  onAcceso: () => void;
  onVolver: () => void;
  onIrARegistro: () => void;
  onOlvideContrasena: () => void;
}

export default function IniciarSesion({ onAcceso, onVolver, onIrARegistro, onOlvideContrasena }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerificando(true);
    try {
      await iniciarSesion(email.trim(), password);
      onAcceso();
    } catch (err) {
      setError(
        err instanceof Error ? 'No pudimos iniciar sesión: ' + err.message : 'No pudimos iniciar sesión.'
      );
    } finally {
      setVerificando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <button onClick={onVolver} className="text-sm text-slate-500 hover:text-slate-700">
        ← Volver
      </button>

      <h1 className="text-xl font-bold text-slate-900">Ya soy un corredor</h1>

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
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={verificando}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {verificando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <button onClick={onOlvideContrasena} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
        ¿Olvidaste tu contraseña?
      </button>

      <button onClick={onIrARegistro} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
        ¿Todavía no tienes usuario? Regístrate
      </button>
    </div>
  );
}
