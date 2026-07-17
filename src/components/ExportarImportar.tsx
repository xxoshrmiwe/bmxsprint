import { useRef, useState } from 'react';
import type { Corredor, BackupCorredor } from '../lib/types';
import { exportarCorredor, importarCorredor } from '../lib/db';
import { IconoAlerta, IconoCheck, IconoDescarga, IconoSubida } from './Icono';

interface Props {
  corredor: Corredor;
  onVolver: () => void;
}

export default function ExportarImportar({ corredor, onVolver }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function exportar() {
    const backup = await exportarCorredor(corredor.id, corredor.nombre);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `sprints-bmx-${corredor.nombre.replace(/\s+/g, '_')}-${fecha}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    setMensaje(null);
    setImportando(true);
    try {
      const texto = await archivo.text();
      const backup = JSON.parse(texto) as BackupCorredor;
      if (backup.version !== 2 || !Array.isArray(backup.sesiones)) {
        throw new Error('El archivo no tiene el formato esperado de respaldo de GATERIGHT BMX.');
      }
      await importarCorredor(backup, corredor.id);
      setMensaje(
        `Se importaron ${backup.sesiones.length} sesiones y ${backup.intentos.length} intentos a la cuenta de ${corredor.nombre}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar el archivo.');
    } finally {
      setImportando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4">
      <button onClick={onVolver} className="btn-ghost">
        ← {corredor.nombre}
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Exportar / Importar</h1>
        <p className="text-muted-foreground">
          Tus datos ya viven en tu cuenta y están disponibles desde cualquier dispositivo donde inicies sesión.
          Usa esto solo para tener un respaldo aparte o para juntar datos de un respaldo anterior.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {mensaje && (
        <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-primary">
          <IconoCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>{mensaje}</span>
        </div>
      )}

      <section className="card">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <IconoDescarga className="h-5 w-5 text-muted-foreground" />
          Exportar
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Descarga un archivo .json con las sesiones y tiempos de {corredor.nombre}.
        </p>
        <button onClick={exportar} className="btn-primary w-full">
          Descargar respaldo de {corredor.nombre}
        </button>
      </section>

      <section className="card">
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <IconoSubida className="h-5 w-5 text-muted-foreground" />
          Importar
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Sube un archivo .json exportado previamente. Se suma a la cuenta con la que iniciaste sesión ahora
          (no reemplaza lo que ya tienes guardado).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          onChange={handleImportar}
          disabled={importando}
          className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-primary-foreground hover:file:opacity-90"
        />
      </section>
    </div>
  );
}
