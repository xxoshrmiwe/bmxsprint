import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { actualizarPassword } from '../lib/cuenta';

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
        <h1 className="text-xl font-bold text-slate-900">¡Contraseña actualizada!</h1>
        <p className="text-slate-500">Ya puedes volver a la app e iniciar sesión con tu nueva contraseña.</p>
        <a
          href="/"
          className="inline-block w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Ir a la app
        </a>
      </div>
    );
  }

  if (enlaceInvalido && !listo) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Enlace no válido o vencido</h1>
        <p className="text-slate-500">
          Pide un nuevo enlace de recuperación desde la app ("¿Olvidaste tu contraseña?").
        </p>
        <a
          href="/"
          className="inline-block w-full rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Volver a la app
        </a>
      </div>
    );
  }

  if (!listo) {
    return <p className="p-6 text-center text-slate-400">Verificando enlace...</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-xl font-bold text-slate-900">Elige una nueva contraseña</h1>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="password">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="confirmar">
            Confirmar contraseña
          </label>
          <input
            id="confirmar"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>
    </div>
  );
}
