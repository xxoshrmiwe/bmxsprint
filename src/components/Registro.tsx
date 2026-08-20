import { useState } from 'react';
import { registrarCorredor } from '../lib/cuenta';
import CampoPassword from './CampoPassword';
import { IconoAlerta } from './Icono';

interface Props {
  onRegistrado: (opciones: { sesionActiva: boolean; email: string }) => void;
  onVolver: () => void;
  onIrALogin: () => void;
}

export default function Registro({ onRegistrado, onVolver, onIrALogin }: Props) {
  const [tipoCuenta, setTipoCuenta] = useState<'atleta' | 'entrenador'>('atleta');

  // Campos para Atleta / Corredor
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [edad, setEdad] = useState('');

  // Campos para Entrenador / Club
  const [nombreEntrenador, setNombreEntrenador] = useState('');
  const [nombreClub, setNombreClub] = useState('');
  const [ciudad, setCiudad] = useState('');

  // Credenciales comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nombreFinal = tipoCuenta === 'entrenador' ? nombreEntrenador.trim() : nombre.trim();

    if (!nombreFinal) {
      setError(tipoCuenta === 'entrenador' ? 'Escribe tu nombre de entrenador.' : 'Escribe tu nombre.');
      return;
    }

    if (tipoCuenta === 'entrenador' && !nombreClub.trim()) {
      setError('Escribe el nombre de tu Club o Escuela de BMX.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCreando(true);
    try {
      const resultado = await registrarCorredor({
        nombre: nombreFinal,
        categoria: tipoCuenta === 'atleta' ? (categoria.trim() || undefined) : undefined,
        edad: tipoCuenta === 'atleta' && edad ? Number(edad) : undefined,
        email: email.trim(),
        password,
        rol: tipoCuenta,
        nombreClub: tipoCuenta === 'entrenador' ? nombreClub.trim() : undefined,
        ciudad: tipoCuenta === 'entrenador' ? (ciudad.trim() || undefined) : undefined
      });
      onRegistrado({ ...resultado, email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 py-6 sm:p-6">
      <button onClick={onVolver} className="btn-ghost text-xs font-bold">
        ← Volver
      </button>

      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold uppercase text-slate-900">Crear Cuenta Nueva</h1>
        <p className="text-xs text-slate-500">Elige el tipo de cuenta para configurar tus campos correctamente.</p>
      </div>

      {/* PESTAÑAS DE ROL */}
      <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => setTipoCuenta('atleta')}
          className={`w-1/2 py-2.5 rounded-lg transition-all ${
            tipoCuenta === 'atleta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🚴 Corredor / Atleta
        </button>
        <button
          type="button"
          onClick={() => setTipoCuenta('entrenador')}
          className={`w-1/2 py-2.5 rounded-lg transition-all ${
            tipoCuenta === 'entrenador' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          🏆 Entrenador / Club
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 shadow-sm">
        {tipoCuenta === 'atleta' ? (
          /* CAMPOS CORREDOR */
          <>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="nombre">
                Nombre del Corredor / Atleta
              </label>
              <input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
                className="input"
                placeholder="Ej. Mateo Gómez"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="edad">
                  Edad (opcional)
                </label>
                <input
                  id="edad"
                  type="number"
                  min={3}
                  max={99}
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  placeholder="ej. 8"
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="categoria">
                  Categoría (opcional)
                </label>
                <input
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="input"
                  placeholder="ej. 8 Expertos"
                />
              </div>
            </div>
          </>
        ) : (
          /* CAMPOS ENTRENADOR / CLUB */
          <>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="nombreEntrenador">
                Nombre del Entrenador / Director
              </label>
              <input
                id="nombreEntrenador"
                value={nombreEntrenador}
                onChange={(e) => setNombreEntrenador(e.target.value)}
                required
                autoFocus
                className="input"
                placeholder="Ej. Profe Carlos Restrepo"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="nombreClub">
                Nombre de la Escuela / Club de BMX
              </label>
              <input
                id="nombreClub"
                value={nombreClub}
                onChange={(e) => setNombreClub(e.target.value)}
                required
                className="input"
                placeholder="Ej. Club BMX Raptors"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="ciudad">
                Ciudad / Liga Deportivo (opcional)
              </label>
              <input
                id="ciudad"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="input"
                placeholder="Ej. Bogotá / Liga Antioqueña"
              />
            </div>
          </>
        )}

        {/* CREDENCIALES DE ACCESO */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="username"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="input"
              placeholder="profe@correo.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <CampoPassword
              id="password"
              name="password"
              value={password}
              onChange={setPassword}
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-700" htmlFor="confirmar">
              Confirmar Contraseña
            </label>
            <CampoPassword
              id="confirmar"
              name="confirmar-password"
              value={confirmar}
              onChange={setConfirmar}
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="submit" disabled={creando} className="btn-primary w-full py-3.5 font-bold text-base shadow-md">
          {creando ? 'Creando Cuenta...' : tipoCuenta === 'entrenador' ? 'Registrar mi Club de BMX' : 'Registrarme'}
        </button>
      </form>

      <button onClick={onIrALogin} className="btn-ghost w-full text-center text-xs">
        ¿Ya tienes usuario? Inicia sesión
      </button>
    </div>
  );
}
