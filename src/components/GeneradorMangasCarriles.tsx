import { useState } from 'react';
import type { MangaEntrenamiento, AsignacionCarrilManga } from '../lib/types';
import { anunciarMangaPorVoz } from '../lib/clubes';

interface Props {
  nombresCorredores: string[];
  onVolver: () => void;
}

export default function GeneradorMangasCarriles({ nombresCorredores, onVolver }: Props) {
  const [numeroManga, setNumeroManga] = useState(1);
  const [mangaActual, setMangaActual] = useState<MangaEntrenamiento | null>(null);

  function generarManga() {
    const seleccionados = [...nombresCorredores].sort(() => Math.random() - 0.5).slice(0, 8);
    const carriles: AsignacionCarrilManga[] = seleccionados.map((nombre, index) => ({
      carril: index + 1,
      corredorId: `c_${index}`,
      corredorNombre: nombre
    }));

    const nuevaManga: MangaEntrenamiento = {
      id: `manga_${Date.now()}`,
      clubId: 'c1',
      numeroManga,
      carriles,
      creadoEn: Date.now()
    };

    setMangaActual(nuevaManga);
    anunciarMangaPorVoz(nuevaManga);
    setNumeroManga((n) => n + 1);
  }

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-slate-900">🚥 Generador de Mangas (Carriles 1-8)</h2>
        <button onClick={onVolver} className="btn-ghost text-xs">← Volver</button>
      </div>

      <p className="text-xs text-slate-500">
        Sortea automáticamente los carriles de 1 a 8 para los corredores presentes en la pista y los anuncia por voz.
      </p>

      <button onClick={generarManga} className="btn-primary w-full py-3.5 text-base font-bold shadow-md flex items-center justify-center gap-2">
        <span>🎲 Sortear Manga #{numeroManga} y Anunciar</span>
      </button>

      {mangaActual && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <h3 className="font-heading text-base font-bold text-slate-900">Manga #{mangaActual.numeroManga}</h3>
            <button
              onClick={() => anunciarMangaPorVoz(mangaActual)}
              className="cursor-pointer text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              🔊 Repetir Anuncio por Voz
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mangaActual.carriles.map((c) => (
              <div key={c.carril} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs flex items-center justify-between shadow-2xs">
                <span className="font-heading text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  C{c.carril}
                </span>
                <span className="font-bold text-slate-800 truncate pl-2">{c.corredorNombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
