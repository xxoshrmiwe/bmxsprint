import { cerrarSesion } from '../lib/cuenta';
import type { Corredor } from '../lib/types';
import { IconoRayo, IconoGrafico, IconoDescarga } from './Icono';

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
      <button onClick={handleCerrarSesion} className="btn-ghost">
        ← Cerrar sesión
      </button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">{corredor.nombre}</h1>
        {corredor.categoria && (
          <span className="mt-1 inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-sm font-medium text-primary">
            {corredor.categoria}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <button onClick={onNuevaSesion} className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg">
          <IconoRayo className="h-5 w-5" />
          Nuevo entrenamiento
        </button>
        <button
          onClick={onHistorial}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 font-semibold text-foreground transition-colors duration-200 hover:bg-surface"
        >
          <IconoGrafico className="h-5 w-5 text-muted-foreground" />
          Ver historial
        </button>
        <button
          onClick={onExportarImportar}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 font-semibold text-foreground transition-colors duration-200 hover:bg-surface"
        >
          <IconoDescarga className="h-5 w-5 text-muted-foreground" />
          Exportar / Importar
        </button>
      </div>
    </div>
  );
}
