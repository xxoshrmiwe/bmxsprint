import { useState } from 'react';
import { iniciarSesion } from '../lib/cuenta';
import CampoPassword from './CampoPassword';
import { IconoAlerta } from './Icono';

interface Props {
  onAcceso: () => void;
  onVolver: () => void;
  onIrARegistro: () => void;
  onOlvideContrasena: () => void;
}

export default function IniciarSesion({ onAcceso, onVolver, onIrARegistro, onOlvideContrasena }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerificando(true);
    try {
      await iniciarSesion(email.trim(), password, recordar);
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
      <button onClick={onVolver} className="btn-ghost">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold text-foreground">Ya soy un corredor</h1>

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
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="password">
            Contraseña
          </label>
          <CampoPassword id="password" value={password} onChange={setPassword} required autoComplete="current-password" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          Recordarme en este dispositivo
        </label>
        <button type="submit" disabled={verificando} className="btn-primary w-full">
          {verificando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <button onClick={onOlvideContrasena} className="btn-ghost w-full text-center">
        ¿Olvidaste tu contraseña?
      </button>

      <button onClick={onIrARegistro} className="btn-ghost w-full text-center">
        ¿Todavía no tienes usuario? Regístrate
      </button>
    </div>
  );
}
