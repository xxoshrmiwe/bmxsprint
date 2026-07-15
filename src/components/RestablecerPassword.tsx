import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { actualizarPassword } from '../lib/cuenta';
import CampoPassword from './CampoPassword';
import { IconoAlerta, IconoCheck } from './Icono';

export default function RestablecerPassword() {
  const [listo, setListo] = useState(false);
  const [enlaceInvalido, setEnlaceInvalido] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [listaParaEntrar, setListaParaEntrar] = useState(false);

  const listoRef = useRef(false);

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') {
        listoRef.current = true;
        setListo(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        listoRef.current = true;
        setListo(true);
      } else {
        setTimeout(() => {
          if (!listoRef.current) setEnlaceInvalido(true);
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      await actualizarPassword(password);
      setListaParaEntrar(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardando(false);
    }
  }

  if (listaParaEntrar) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 text-center">
        <IconoCheck className="mx-auto h-12 w-12 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">¡Contraseña actualizada!</h1>
        <p className="text-muted-foreground">Ya puedes volver a la app e iniciar sesión con tu nueva contraseña.</p>
        <a href="/" className="btn-primary block w-full">
          Ir a la app
        </a>
      </div>
    );
  }

  if (enlaceInvalido && !listo) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 text-center">
        <IconoAlerta className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Enlace no válido o vencido</h1>
        <p className="text-muted-foreground">
          Pide un nuevo enlace de recuperación desde la app ("¿Olvidaste tu contraseña?").
        </p>
        <a href="/" className="btn-secondary block w-full">
          Volver a la app
        </a>
      </div>
    );
  }

  if (!listo) {
    return <p className="p-6 text-center text-muted-foreground">Verificando enlace...</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">Elige una nueva contraseña</h1>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="password">
            Nueva contraseña
          </label>
          <CampoPassword
            id="password"
            value={password}
            onChange={setPassword}
            required
            autoFocus
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="confirmar">
            Confirmar contraseña
          </label>
          <CampoPassword id="confirmar" value={confirmar} onChange={setConfirmar} required autoComplete="new-password" />
        </div>
        <button type="submit" disabled={guardando} className="btn-primary w-full">
          {guardando ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>
    </div>
  );
}
