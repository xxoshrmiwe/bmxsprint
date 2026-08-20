import { useState } from 'react';
import type { Corredor } from '../lib/types';
import { iniciarSesion, crearCorredorOffline, obtenerCorredorLocal } from '../lib/cuenta';
import CampoPassword from './CampoPassword';
import { IconoAlerta } from './Icono';

interface Props {
  onAcceso: (corredor: Corredor) => void;
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
      const corredor = await iniciarSesion(email.trim(), password, recordar);
      onAcceso(corredor);
    } catch (err) {
      console.warn('Fallo en autenticación con Supabase:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Failed to fetch') || msg.includes('network') || msg.includes('CONNECTION') || msg.includes('FETCH')) {
        setError('No hay conexión con el servidor. Puedes entrar en Modo Local/Offline para entrenar ahora.');
      } else {
        setError('No pudimos iniciar sesión: ' + msg);
      }
    } finally {
      setVerificando(false);
    }
  }

  function handleEntrarOffline() {
    const local = obtenerCorredorLocal() || crearCorredorOffline(email.split('@')[0] || 'Corredor BMX');
    onAcceso(local);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <button onClick={onVolver} className="btn-ghost text-xs font-bold">
        ← Volver
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Ingreso de Corredor</h1>
        <p className="text-xs text-slate-500">Ingresa con tu correo registrado para sincronizar tus tiempos.</p>
      </div>

      {error && (
        <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 shadow-2xs">
          <div className="flex items-start gap-2">
            <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleEntrarOffline}
            className="w-full cursor-pointer rounded-lg bg-slate-900 px-3 py-2 font-bold text-white hover:bg-slate-800 transition-colors"
          >
            Entrar en Modo Local / Autónomo ⚡
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted-foreground" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            name="username"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            className="input"
            placeholder="corredor@correo.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-muted-foreground" htmlFor="password">
            Contraseña
          </label>
          <CampoPassword
            id="password"
            name="password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
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
        <button type="submit" disabled={verificando} className="btn-primary w-full py-3.5 font-bold text-base shadow-md">
          {verificando ? 'Iniciando Sesión...' : 'Entrar'}
        </button>
      </form>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <button onClick={onOlvideContrasena} className="btn-ghost w-full text-center text-xs">
          ¿Olvidaste tu contraseña?
        </button>

        <button onClick={onIrARegistro} className="btn-ghost w-full text-center text-xs font-bold text-primary">
          ¿Todavía no tienes usuario? Regístrate gratis
        </button>
      </div>
    </div>
  );
}
