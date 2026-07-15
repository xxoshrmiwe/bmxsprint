import { useRef, useState } from 'react';
import type { Corredor, BackupCorredor } from '../lib/types';
import { exportarCorredor, importarCorredor } from '../lib/db';

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
        throw new Error('El archivo no tiene el formato esperado de respaldo de Sprints BMX.');
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
      <button onClick={onVolver} className="text-sm text-slate-500 hover:text-slate-700">
        ← {corredor.nombre}
      </button>

      <h1 className="text-xl font-bold text-slate-900">Exportar / Importar</h1>
      <p className="text-slate-500">
        Tus datos ya viven en tu cuenta y están disponibles desde cualquier dispositivo donde inicies sesión.
        Usa esto solo para tener un respaldo aparte o para juntar datos de un respaldo anterior.
      </p>

      {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {mensaje && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
          {mensaje}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Exportar</h2>
        <p className="mb-3 text-sm text-slate-500">
          Descarga un archivo .json con las sesiones y tiempos de {corredor.nombre}.
        </p>
        <button
          onClick={exportar}
          className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Descargar respaldo de {corredor.nombre}
        </button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Importar</h2>
        <p className="mb-3 text-sm text-slate-500">
          Sube un archivo .json exportado previamente. Se suma a la cuenta con la que iniciaste sesión ahora
          (no reemplaza lo que ya tienes guardado).
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          onChange={handleImportar}
          disabled={importando}
          className="w-full text-sm text-slate-600"
        />
      </section>
    </div>
  );
}
