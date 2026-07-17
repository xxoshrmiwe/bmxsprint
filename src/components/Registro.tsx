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
      <button onClick={onVolver} className="btn-ghost">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold text-foreground">Soy un corredor nuevo</h1>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="nombre">
            Nombre de usuario
          </label>
          <input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
            className="input"
            placeholder="Ej. Mateo"
          />
        </div>
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
            className="input"
            placeholder="papa@correo.com"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lo usamos para el correo de bienvenida y para recuperar la contraseña si la olvidas.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="categoria">
            Categoría (opcional)
          </label>
          <input
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="input"
            placeholder="Ej. Cruiser, Expert"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="edad">
            Edad (opcional)
          </label>
          <input
            id="edad"
            type="number"
            min={1}
            max={99}
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="password">
            Contraseña
          </label>
          <CampoPassword id="password" value={password} onChange={setPassword} required autoComplete="new-password" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground" htmlFor="confirmar">
            Confirmar contraseña
          </label>
          <CampoPassword id="confirmar" value={confirmar} onChange={setConfirmar} required autoComplete="new-password" />
        </div>
        <button type="submit" disabled={creando} className="btn-primary w-full">
          {creando ? 'Creando...' : 'Registrarme'}
        </button>
      </form>

      <button onClick={onIrALogin} className="btn-ghost w-full text-center">
        ¿Ya tienes usuario? Inicia sesión
      </button>
    </div>
  );
}
