import { useState } from 'react';
import type { MangaEntrenamiento, AsignacionCarrilManga } from '../lib/types';
import { anunciarMangaPorVoz } from '../lib/clubes';

interface AtletaDemografico {
  nombre: string;
  edad: number;
  categoria: string;
}

const PLANTILLA_ATLETAS: AtletaDemografico[] = [
  { nombre: 'Mateo Gómez', edad: 6, categoria: '6 Novatos' },
  { nombre: 'Sofía Rincón', edad: 7, categoria: '7 Novatos' },
  { nombre: 'Thiago López', edad: 8, categoria: '8 Expertos' },
  { nombre: 'Lucas Martínez', edad: 10, categoria: '10 Expertos' },
  { nombre: 'Mariana Silva', edad: 11, categoria: '11 Expertos' },
  { nombre: 'Santi Restrepo', edad: 14, categoria: '14 Expertos' },
  { nombre: 'Camilo Torres', edad: 15, categoria: '15 Expertos' },
  { nombre: 'David Ramírez', edad: 18, categoria: 'Elite Pro' }
];

interface Props {
  nombresCorredores?: string[];
  onVolver: () => void;
}

export default function GeneradorMangasCarriles({ onVolver }: Props) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [numeroManga, setNumeroManga] = useState(1);
  const [mangaActual, setMangaActual] = useState<MangaEntrenamiento | null>(null);

  const atletasFiltrados = PLANTILLA_ATLETAS.filter((a) => {
    if (categoriaSeleccionada === '5-8') return a.edad >= 5 && a.edad <= 8;
    if (categoriaSeleccionada === '9-12') return a.edad >= 9 && a.edad <= 12;
    if (categoriaSeleccionada === '13-16') return a.edad >= 13 && a.edad <= 16;
    if (categoriaSeleccionada === '17+') return a.edad >= 17;
    return true;
  });

  function generarManga() {
    const candidatos = atletasFiltrados.length > 0 ? atletasFiltrados : PLANTILLA_ATLETAS;
    const mezclados = [...candidatos].sort(() => Math.random() - 0.5).slice(0, 8);

    const carriles: AsignacionCarrilManga[] = mezclados.map((atleta, index) => ({
      carril: index + 1,
      corredorId: `c_${index}`,
      corredorNombre: `${atleta.nombre} (${atleta.edad}a)`
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
        <h2 className="font-heading text-xl font-bold uppercase text-slate-900">🚥 Generador de Mangas para Entrenador</h2>
        <button onClick={onVolver} className="btn-ghost text-xs font-bold">← Volver</button>
      </div>

      <p className="text-xs text-slate-500">
        Agrupa y equilibra a los atletas por edad antes de sortear los carriles (1 a 8) para la locución por voz.
      </p>

      {/* FILTRO POR EDAD Y CATEGORÍA */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase text-slate-600">Agrupar por Rango de Edad:</label>
        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
          {[
            { id: 'todos', label: 'Todas las edades' },
            { id: '5-8', label: '🧒 5 - 8 años' },
            { id: '9-12', label: '👦 9 - 12 años' },
            { id: '13-16', label: '🚴 13 - 16 años' },
            { id: '17+', label: '🔥 17+ / Elite' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaSeleccionada(cat.id)}
              className={`cursor-pointer py-2 px-1 rounded-lg border text-center transition-all ${
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
    </div>
  );
}
