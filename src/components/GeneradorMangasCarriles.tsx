import { useState } from 'react';
import type { MangaEntrenamiento, AsignacionCarrilManga, AtletaClub } from '../lib/types';
import { anunciarMangaPorVoz, obtenerAtletasClub } from '../lib/clubes';

interface Props {
  clubId: string;
  onVolver: () => void;
}

export default function GeneradorMangasCarriles({ clubId, onVolver }: Props) {
  const [atletas] = useState<AtletaClub[]>(() => obtenerAtletasClub(clubId));
  const [seleccionadosIds, setSeleccionadosIds] = useState<string[]>(() => atletas.map((a) => a.id));
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [numeroManga, setNumeroManga] = useState(1);
  const [mangaActual, setMangaActual] = useState<MangaEntrenamiento | null>(null);

  function toggleAtleta(id: string) {
    setSeleccionadosIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const atletasDisponibles = atletas.filter((a) => seleccionadosIds.includes(a.id));

  const atletasFiltrados = atletasDisponibles.filter((a) => {
    if (categoriaSeleccionada === '5-8') return a.edad >= 5 && a.edad <= 8;
    if (categoriaSeleccionada === '9-12') return a.edad >= 9 && a.edad <= 12;
    if (categoriaSeleccionada === '13-16') return a.edad >= 13 && a.edad <= 16;
    if (categoriaSeleccionada === '17+') return a.edad >= 17;
    return true;
  });

  function generarManga() {
    if (atletasFiltrados.length === 0) {
      alert('No hay atletas seleccionados o que coincidan con la categoría elegida.');
      return;
    }

    const mezclados = [...atletasFiltrados].sort(() => Math.random() - 0.5).slice(0, 8);

    const carriles: AsignacionCarrilManga[] = mezclados.map((atleta, index) => ({
      carril: index + 1,
      corredorId: atleta.id,
      corredorNombre: `${atleta.nombre} (${atleta.edad}a)`
    }));

    const nuevaManga: MangaEntrenamiento = {
      id: `manga_${Date.now()}`,
      clubId,
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
        <h2 className="font-heading text-xl font-bold uppercase text-slate-900">🚥 Generador de Mangas con Voz</h2>
        <button onClick={onVolver} className="btn-ghost text-xs font-bold">← Volver</button>
      </div>

      {atletas.length === 0 ? (
        <div className="p-6 text-center space-y-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800 font-medium">
            ⚠️ No has registrado atletas en tu club todavía. Agrega a los niños de tu equipo desde la pestaña <strong>"🚴 Mis Atletas"</strong> para realizar el sorteo de carril.
          </p>
          <button onClick={onVolver} className="btn-secondary w-full py-2 text-xs font-bold">
            Ir a registrar atletas
          </button>
        </div>
      ) : (
        <>
          {/* MARCAR ASISTENCIA */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-700 uppercase">
              <span>Atletas Presentes en la Pista ({atletasDisponibles.length}/{atletas.length}):</span>
              <button
                onClick={() =>
                  setSeleccionadosIds(seleccionadosIds.length === atletas.length ? [] : atletas.map((a) => a.id))
                }
                className="text-[10px] text-emerald-700 hover:underline"
              >
                {seleccionadosIds.length === atletas.length ? 'Deseleccionar todos' : 'Marcar todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pt-1">
              {atletas.map((a) => (
                <label key={a.id} className="flex items-center gap-1.5 cursor-pointer bg-white p-1.5 rounded border border-slate-200 shadow-2xs truncate">
                  <input
                    type="checkbox"
                    checked={seleccionadosIds.includes(a.id)}
                    onChange={() => toggleAtleta(a.id)}
                    className="accent-primary"
                  />
                  <span className="truncate font-medium">{a.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* FILTRO POR EDAD */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-600">Agrupar por Rango de Edad:</label>
            <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
              {[
                { id: 'todos', label: 'Todas' },
                { id: '5-8', label: '🧒 5 - 8' },
                { id: '9-12', label: '👦 9 - 12' },
                { id: '13-16', label: '🚴 13 - 16' },
                { id: '17+', label: '🔥 17+' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={`cursor-pointer py-1.5 px-1 rounded-lg border text-center transition-all ${
                    categoriaSeleccionada === cat.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generarManga} className="btn-primary w-full py-3.5 text-base font-bold shadow-md flex items-center justify-center gap-2">
            <span>🎲 Sortear Manga #{numeroManga} & Anunciar</span>
          </button>

          {mangaActual && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-heading text-base font-bold text-slate-900">Manga #{mangaActual.numeroManga}</h3>
                <button
                  onClick={() => anunciarMangaPorVoz(mangaActual)}
                  className="cursor-pointer text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  🔊 Repetir Anuncio
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
        </>
      )}
    </div>
  );
}
