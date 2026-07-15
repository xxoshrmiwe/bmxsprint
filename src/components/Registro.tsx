import { useState } from 'react';
import { registrarCorredor } from '../lib/cuenta';
import CampoPassword from './CampoPassword';

interface Props {
  onRegistrado: (opciones: { sesionActiva: boolean; email: string }) => void;
  onVolver: () => void;
  onIrALogin: () => void;
}

export default function Registro({ onRegistrado, onVolver, onIrALogin }: Props) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [edad, setEdad] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('Escribe un nombre de usuario.');
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
        nombre: nombre.trim(),
        categoria: categoria.trim() || undefined,
        edad: edad ? Number(edad) : undefined,
        email: email.trim(),
        password
      });
      onRegistrado({ ...resultado, email: email.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <button onClick={onVolver} className="text-sm text-slate-500 hover:text-slate-700">
        ← Volver
      </button>

      <h1 className="text-xl font-bold text-slate-900">Soy un corredor nuevo</h1>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="nombre">
            Nombre de usuario
          </label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            placeholder="Ej. Mateo"
          />
        </div>
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            placeholder="papa@correo.com"
          />
          <p className="mt-1 text-xs text-slate-400">
            Lo usamos para el correo de bienvenida y para recuperar la contraseña si la olvidas.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="categoria">
            Categoría (opcional)
          </label>
          <input
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            placeholder="Ej. Cruiser, Expert"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="edad">
            Edad (opcional)
          </label>
          <input
            id="edad"
            type="number"
            min={1}
            max={99}
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="password">
            Contraseña
          </label>
          <CampoPassword id="password" value={password} onChange={setPassword} required autoComplete="new-password" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="confirmar">
            Confirmar contraseña
          </label>
          <CampoPassword id="confirmar" value={confirmar} onChange={setConfirmar} required autoComplete="new-password" />
        </div>
        <button
          type="submit"
          disabled={creando}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {creando ? 'Creando...' : 'Registrarme'}
        </button>
      </form>

      <button onClick={onIrALogin} className="w-full text-center text-sm text-slate-500 hover:text-slate-700">
        ¿Ya tienes usuario? Inicia sesión
      </button>
    </div>
  );
}
