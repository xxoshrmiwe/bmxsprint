# Módulo de Clubes, Mangas y Programación BMX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete BMX Club management module, including team creation/joining by invite code, weekly training schedule planning, moto lane assignments (1-8 lanes) with text-to-speech voice announcements, and team leaderboards.

**Architecture:** Extend core types in `src/lib/types.ts`, create dedicated storage handlers in `src/lib/clubes.ts`, build UI components (`PanelClub.tsx`, `ProgramadorSemanalClub.tsx`, `GeneradorMangasCarriles.tsx`), and integrate into `SprintApp.tsx` and `PanelCorredor.tsx`.

**Tech Stack:** React 19, TypeScript 6, Astro 7, Web Speech API (speechSynthesis).

**Spec:** [`docs/superpowers/specs/2026-08-20-modulo-clubes-bmx-design.md`](file:///f:/repos/Sprints/docs/superpowers/specs/2026-08-20-modulo-clubes-bmx-design.md)

## Global Constraints

- Standalone, backwards-compatible extension of the existing rider schema.
- Support Web Speech API for voice lane announcements with graceful fallback when TTS is unsupported.
- Maintain responsive, mobile-first UI for outdoor track usage.

---

### Task 1: Extend Data Types and Club Storage Module (`src/lib/clubes.ts`)

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/clubes.ts`

**Interfaces:**
- Produces: `crearClub(nombre, descripcion)`, `unirseAClub(codigoInvite)`, `obtenerClubCorredor()`, `guardarHorariosClub(horarios)`, `anunciarMangaPorVoz(manga)`

- [ ] **Step 1: Update `src/lib/types.ts` with Club interfaces**

```typescript
export type RolClub = 'entrenador' | 'atleta';

export interface Club {
  id: string;
  codigoInvite: string;
  nombre: string;
  descripcion?: string;
  creadoPor: string;
  creadoEn: number;
}

export interface MiembroClub {
  clubId: string;
  corredorId: string;
  rol: RolClub;
  unidoEn: number;
}

export interface HorarioEntrenamientoClub {
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string;
  titulo: string;
  descripcion?: string;
}

export interface AsignacionCarrilManga {
  carril: number;
  corredorId: string;
  corredorNombre: string;
  tiempoTotalMs?: number;
}

export interface MangaEntrenamiento {
  id: string;
  clubId: string;
  numeroManga: number;
  carriles: AsignacionCarrilManga[];
  creadoEn: number;
}
```

- [ ] **Step 2: Create `src/lib/clubes.ts` storage and voice utility**

```typescript
import { supabase } from './supabase';
import type { Club, HorarioEntrenamientoClub, MangaEntrenamiento } from './types';

export function generarCodigoInvite(nombre: string): string {
  const prefix = nombre.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'BMX';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export async function crearClubLocally(nombre: string, descripcion?: string): Promise<Club> {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'invitado';
  const club: Club = {
    id: `club_${Date.now()}`,
    codigoInvite: generarCodigoInvite(nombre),
    nombre,
    descripcion,
    creadoPor: userId,
    creadoEn: Date.now()
  };
  localStorage.setItem(`bmx_club_${club.id}`, JSON.stringify(club));
  localStorage.setItem(`bmx_mi_club`, JSON.stringify(club));
  return club;
}

export function anunciarMangaPorVoz(manga: MangaEntrenamiento): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const textoAnuncio = `Manga ${manga.numeroManga} a la grilla. ` +
    manga.carriles.map((c) => `Carril ${c.carril}, ${c.corredorNombre}.`).join(' ');

  const utterance = new SpeechSynthesisUtterance(textoAnuncio);
  utterance.lang = 'es-ES';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
```

- [ ] **Step 3: Run typecheck verification**

Run: `npx astro check`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/clubes.ts
git commit -m "feat(clubes): add club data structures and voice announcer utility"
```

---

### Task 2: Create Club UI Components (`PanelClub.tsx`, `ProgramadorSemanalClub.tsx`, `GeneradorMangasCarriles.tsx`)

**Files:**
- Create: `src/components/PanelClub.tsx`
- Create: `src/components/ProgramadorSemanalClub.tsx`
- Create: `src/components/GeneradorMangasCarriles.tsx`

**Interfaces:**
- Consumes: `Club`, `anunciarMangaPorVoz`, `Corredor`
- Produces: `PanelClub({ corredor, onVolver })`, `GeneradorMangasCarriles({ miembros, onVolver })`

- [ ] **Step 1: Create `GeneradorMangasCarriles.tsx` for 1-8 lane assignments & TTS voice**

```tsx
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
  }

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-slate-900">🚥 Generador de Mangas (Carriles 1-8)</h2>
        <button onClick={onVolver} className="btn-ghost text-xs">← Volver</button>
      </div>

      <button onClick={generarManga} className="btn-primary w-full py-3 text-base font-bold shadow-md">
        <span>🎲 Sortear Manga #{numeroManga} y Anunciar</span>
      </button>

      {mangaActual && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <h3 className="font-heading text-base font-bold text-slate-900">Manga #{mangaActual.numeroManga}</h3>
            <button onClick={() => anunciarMangaPorVoz(mangaActual)} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              🔊 Repetir Anuncio
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mangaActual.carriles.map((c) => (
              <div key={c.carril} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs flex items-center justify-between">
                <span className="font-heading text-sm font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  C{c.carril}
                </span>
                <span className="font-bold text-slate-700 truncate pl-2">{c.corredorNombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `ProgramadorSemanalClub.tsx`**

```tsx
import { useState } from 'react';
import type { HorarioEntrenamientoClub } from '../lib/types';

interface Props {
  onVolver: () => void;
}

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

export default function ProgramadorSemanalClub({ onVolver }: Props) {
  const [horarios, setHorarios] = useState<HorarioEntrenamientoClub[]>([
    { diaSemana: 'martes', horaInicio: '17:00', titulo: 'Salidas de Gate + Sprints 20m' },
    { diaSemana: 'jueves', horaInicio: '17:00', titulo: 'Fuerza en Partidor + Sprints 50m' },
    { diaSemana: 'sabado', horaInicio: '09:00', titulo: 'Simulacro de Carrera (Mangas 8 Carriles)' }
  ]);

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold uppercase text-slate-900">📅 Agenda Semanal del Club</h2>
        <button onClick={onVolver} className="btn-ghost text-xs">← Volver</button>
      </div>

      <div className="space-y-2">
        {horarios.map((h, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {h.diaSemana} · {h.horaInicio}
              </span>
              <h3 className="font-heading text-sm font-bold text-slate-900 mt-1">{h.titulo}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `PanelClub.tsx`**

```tsx
import { useState } from 'react';
import type { Corredor, Club } from '../lib/types';
import { crearClubLocally } from '../lib/clubes';
import GeneradorMangasCarriles from './GeneradorMangasCarriles';
import ProgramadorSemanalClub from './ProgramadorSemanalClub';

interface Props {
  corredor: Corredor;
  onVolver: () => void;
}

export default function PanelClub({ corredor, onVolver }: Props) {
  const [vista, setVista] = useState<'main' | 'mangas' | 'agenda'>('main');
  const [club, setClub] = useState<Club | null>(() => {
    const cached = localStorage.getItem('bmx_mi_club');
    return cached ? JSON.parse(cached) : null;
  });
  const [nombreClub, setNombreClub] = useState('');

  async function handleCrearClub(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreClub.trim()) return;
    const nuevo = await crearClubLocally(nombreClub.trim());
    setClub(nuevo);
  }

  if (vista === 'mangas') {
    return <GeneradorMangasCarriles nombresCorredores={['Santi', 'Mateo', 'Lucas', 'Sofía', 'Camilo', 'Mariana', 'Thiago', 'David']} onVolver={() => setVista('main')} />;
  }

  if (vista === 'agenda') {
    return <ProgramadorSemanalClub onVolver={() => setVista('main')} />;
  }

  return (
    <div className="space-y-5 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onVolver} className="btn-ghost text-xs">← Volver al Panel</button>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
          🏆 Módulo Clubes BMX
        </span>
      </div>

      {!club ? (
        <form onSubmit={handleCrearClub} className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900 uppercase">Crear o Unirse a un Club</h2>
          <input
            type="text"
            placeholder="Nombre de tu Club (ej. Raptors BMX)"
            value={nombreClub}
            onChange={(e) => setNombreClub(e.target.value)}
            className="input"
            required
          />
          <button type="submit" className="btn-primary w-full py-3 font-bold">
            Crear mi Club BMX
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-900 text-white p-4 space-y-1 shadow-md">
            <span className="text-[10px] uppercase font-bold text-emerald-400">Código de Invitación: {club.codigoInvite}</span>
            <h2 className="font-heading text-2xl font-bold uppercase">{club.nombre}</h2>
            <p className="text-xs text-slate-300">Club activo · Modo Entrenador / Atleta</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setVista('mangas')} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100 transition-colors">
              <div className="text-xl mb-1">🚥</div>
              <h3 className="font-heading text-sm font-bold text-slate-900">Mangas (Carriles 1-8)</h3>
              <p className="text-[10px] text-slate-500">Sortear y anunciar por voz</p>
            </button>
            <button onClick={() => setVista('agenda')} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-slate-100 transition-colors">
              <div className="text-xl mb-1">📅</div>
              <h3 className="font-heading text-sm font-bold text-slate-900">Agenda Semanal</h3>
              <p className="text-[10px] text-slate-500">Días y rutinas del equipo</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/GeneradorMangasCarriles.tsx src/components/ProgramadorSemanalClub.tsx src/components/PanelClub.tsx
git commit -m "feat(ui): add club management, lane switcher and weekly schedule components"
```

---

### Task 3: Integrate Club Navigation into `PanelCorredor.tsx` and `SprintApp.tsx`

**Files:**
- Modify: `src/components/PanelCorredor.tsx`
- Modify: `src/components/SprintApp.tsx`

- [ ] **Step 1: Add "Mi Club BMX 🏆" button to `PanelCorredor.tsx`**

Update `PanelCorredor.tsx` to add button navigating to `PanelClub`.

- [ ] **Step 2: Update `SprintApp.tsx` to handle `'club'` view state**

Update `SprintApp.tsx` to include `case 'club': return <PanelClub corredor={vista.corredor} onVolver={() => setVista({ tipo: 'panel', corredor: vista.corredor })} />`.

- [ ] **Step 3: Run full build and typecheck**

Run: `npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PanelCorredor.tsx src/components/SprintApp.tsx
git commit -m "feat(app): integrate club suite navigation and view routing"
```
