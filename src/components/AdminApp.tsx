import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { iniciarSesion, cerrarSesion } from '../lib/cuenta';
import { obtenerDatosAdmin, enviarRecuperacion, type DatosAdmin } from '../lib/adminApi';
import CampoPassword from './CampoPassword';
import OlvideContrasena from './OlvideContrasena';
import { IconoAlerta, IconoBuscar } from './Icono';

type Vista = 'cargando' | 'login' | 'olvide-password' | 'sin-acceso' | 'dashboard';

function formatearFecha(valor: string | number | null): string {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminApp() {
  const [vista, setVista] = useState<Vista>('cargando');
  const [datos, setDatos] = useState<DatosAdmin | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [entrando, setEntrando] = useState(false);

  const [estadoRecuperacion, setEstadoRecuperacion] = useState<Record<string, 'enviando' | 'enviado' | 'error'>>({});
  const [erroresRecuperacion, setErroresRecuperacion] = useState<Record<string, string>>({});

  async function cargarDashboard() {
    try {
      const resultado = await obtenerDatosAdmin();
      setDatos(resultado);
      setVista('dashboard');
    } catch {
      setVista('sin-acceso');
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) cargarDashboard();
      else setVista('login');
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEntrando(true);
    try {
      await iniciarSesion(email.trim(), password, recordar);
      await cargarDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setEntrando(false);
    }
  }

  async function handleSalir() {
    await cerrarSesion();
    setDatos(null);
    setVista('login');
  }

  async function handleRecuperar(usuarioEmail: string) {
    setEstadoRecuperacion((prev) => ({ ...prev, [usuarioEmail]: 'enviando' }));
    try {
      await enviarRecuperacion(usuarioEmail);
      setEstadoRecuperacion((prev) => ({ ...prev, [usuarioEmail]: 'enviado' }));
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error al enviar recuperación para', usuarioEmail, ':', mensaje);
      setErroresRecuperacion((prev) => ({ ...prev, [usuarioEmail]: mensaje }));
      setEstadoRecuperacion((prev) => ({ ...prev, [usuarioEmail]: 'error' }));
    }
  }

  if (vista === 'cargando') {
    return <p className="p-6 text-center text-muted-foreground">Cargando...</p>;
  }

  if (vista === 'login') {
    return (
      <div className="mx-auto max-w-sm space-y-6 p-6">
        <h1 className="text-2xl font-bold text-foreground">GATERIGHT BMX — Admin</h1>
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleLogin} className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="input"
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
          <button type="submit" disabled={entrando} className="btn-primary w-full">
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button onClick={() => setVista('olvide-password')} className="btn-ghost w-full text-center">
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    );
  }

  if (vista === 'olvide-password') {
    return <OlvideContrasena onVolver={() => setVista('login')} />;
  }

  if (vista === 'sin-acceso') {
    return (
      <div className="mx-auto max-w-sm space-y-4 p-6 text-center">
        <IconoAlerta className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Sin acceso</h1>
        <p className="text-muted-foreground">Esta cuenta no tiene permisos de administrador.</p>
        <button onClick={handleSalir} className="btn-secondary w-full">
          Cerrar sesión
        </button>
      </div>
    );
  }

  const usuariosFiltrados = (datos?.usuarios ?? []).filter((u) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">GATERIGHT BMX — Admin</h1>
        <button onClick={handleSalir} className="btn-ghost">
          Cerrar sesión
        </button>
      </div>

      {datos && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Corredores', datos.resumen.totalCorredores],
            ['Sesiones', datos.resumen.totalSesiones],
            ['Intentos', datos.resumen.totalIntentos],
            ['Nuevos (7 días)', datos.resumen.corredoresNuevosUltimos7Dias],
            ['Sesiones (7 días)', datos.resumen.sesionesUltimos7Dias]
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta as string} className="card text-center">
              <div className="font-heading text-3xl font-bold tabular-nums text-primary">{valor}</div>
              <div className="text-xs text-muted-foreground">{etiqueta}</div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="input pl-9"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2">Edad</th>
              <th className="px-3 py-2">Registrado</th>
              <th className="px-3 py-2">Sesiones</th>
              <th className="px-3 py-2">Intentos</th>
              <th className="px-3 py-2">Última sesión</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usuariosFiltrados.map((u) => {
              const estado = estadoRecuperacion[u.email];
              return (
                <tr key={u.id} className="transition-colors duration-150 hover:bg-surface">
                  <td className="px-3 py-2 font-medium text-foreground">{u.nombre}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.categoria ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.edad ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatearFecha(u.creadoEn)}</td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{u.totalSesiones}</td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">{u.totalIntentos}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatearFecha(u.ultimaSesion)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleRecuperar(u.email)}
                      disabled={estado === 'enviando'}
                      title={estado === 'error' ? erroresRecuperacion[u.email] : undefined}
                      className="cursor-pointer rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {estado === 'enviando'
                        ? 'Enviando...'
                        : estado === 'enviado'
                          ? 'Enviado ✓'
                          : estado === 'error'
                            ? 'Error, reintentar'
                            : 'Enviar recuperación'}
                    </button>
                    {estado === 'error' && erroresRecuperacion[u.email] && (
                      <p className="mt-1 max-w-[16rem] text-xs text-destructive">{erroresRecuperacion[u.email]}</p>
                    )}
                  </td>
                </tr>
              );
            })}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  No hay corredores que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
