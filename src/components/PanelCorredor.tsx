import { cerrarSesion } from '../lib/cuenta';
import type { Corredor } from '../lib/types';

interface Props {
  corredor: Corredor;
  onNuevaSesion: () => void;
  onHistorial: () => void;
  onExportarImportar: () => void;
  onCerrarSesion: () => void;
}

export default function PanelCorredor({
  corredor,
  onNuevaSesion,
  onHistorial,
  onExportarImportar,
  onCerrarSesion
}: Props) {
  async function handleCerrarSesion() {
    await cerrarSesion();
    onCerrarSesion();
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <button onClick={handleCerrarSesion} className="text-sm text-slate-500 hover:text-slate-700">
        ← Cerrar sesión
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{corredor.nombre}</h1>
        {corredor.categoria && <p className="text-slate-500">{corredor.categoria}</p>}
      </div>

      <div className="space-y-3">
        <button
          onClick={onNuevaSesion}
          className="w-full rounded-md bg-slate-900 px-4 py-4 text-lg font-medium text-white hover:bg-slate-700"
        >
          Nuevo entrenamiento
        </button>
        <button
          onClick={onHistorial}
          className="w-full rounded-md border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver historial
        </button>
        <button
          onClick={onExportarImportar}
          className="w-full rounded-md border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
        >
          Exportar / Importar
        </button>
      </div>
    </div>
  );
}
