import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { iniciarSesion, cerrarSesion } from '../lib/cuenta';
import { obtenerDatosAdmin, enviarRecuperacion, type DatosAdmin } from '../lib/adminApi';

type Vista = 'cargando' | 'login' | 'sin-acceso' | 'dashboard';

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
  const [entrando, setEntrando] = useState(false);

  const [estadoRecuperacion, setEstadoRecuperacion] = useState<Record<string, 'enviando' | 'enviado' | 'error'>>({});

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
      await iniciarSesion(email.trim(), password);
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
    } catch {
      setEstadoRecuperacion((prev) => ({ ...prev, [usuarioEmail]: 'error' }));
    }
  }

  if (vista === 'cargando') {
    return <p className="p-6 text-center text-slate-400">Cargando...</p>;
  }

  if (vista === 'login') {
    return (
      <div className="mx-auto max-w-sm space-y-6 p-6">
        <h1 className="text-xl font-bold text-slate-900">Sprints BMX — Admin</h1>
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleLogin} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-sm text-slate-600" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
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
            disabled={entrando}
            className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  if (vista === 'sin-acceso') {
    return (
      <div className="mx-auto max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Sin acceso</h1>
        <p className="text-slate-500">Esta cuenta no tiene permisos de administrador.</p>
        <button
          onClick={handleSalir}
          className="w-full rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
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
        <h1 className="text-xl font-bold text-slate-900">Sprints BMX — Admin</h1>
        <button onClick={handleSalir} className="text-sm text-slate-500 hover:text-slate-700">
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
            <div key={etiqueta as string} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
              <div className="text-2xl font-bold text-slate-900">{valor}</div>
              <div className="text-xs text-slate-500">{etiqueta}</div>
            </div>
          ))}
        </div>
      )}

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o correo..."
        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
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
          <tbody className="divide-y divide-slate-100">
            {usuariosFiltrados.map((u) => {
              const estado = estadoRecuperacion[u.email];
              return (
                <tr key={u.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">{u.nombre}</td>
                  <td className="px-3 py-2 text-slate-600">{u.email}</td>
                  <td className="px-3 py-2 text-slate-600">{u.categoria ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{u.edad ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{formatearFecha(u.creadoEn)}</td>
                  <td className="px-3 py-2 text-slate-600">{u.totalSesiones}</td>
                  <td className="px-3 py-2 text-slate-600">{u.totalIntentos}</td>
                  <td className="px-3 py-2 text-slate-600">{formatearFecha(u.ultimaSesion)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleRecuperar(u.email)}
                      disabled={estado === 'enviando'}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {estado === 'enviando'
                        ? 'Enviando...'
                        : estado === 'enviado'
                          ? 'Enviado ✓'
                          : estado === 'error'
                            ? 'Error, reintentar'
                            : 'Enviar recuperación'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
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
