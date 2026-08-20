# Perfil Mecánico & Calculador de Relaciones BMX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend rider profile and training session workflows to store BMX bike configuration, rider biometrics, and automatically calculate Gear Ratio, Gear Inches, and Roll-out distance.

**Architecture:** Extend core TypeScript interfaces in `src/lib/types.ts`, create a dedicated BMX engineering utility module `src/lib/bmx.ts`, build new UI components (`TarjetaBicicleta.tsx` and `ModalConfiguracionBicicleta.tsx`), and integrate transmission snapshots into `PanelCorredor.tsx` and `NuevaSesion.tsx`.

**Tech Stack:** React 19, TypeScript 6, Astro 7, TailwindCSS 4.

**Spec:** [`docs/superpowers/specs/2026-08-20-perfil-mecanico-relaciones-bmx-design.md`](file:///f:/repos/Sprints/docs/superpowers/specs/2026-08-20-perfil-mecanico-relaciones-bmx-design.md)

## Global Constraints

- Preserve all existing Supabase and local storage fields without breaking existing rider sessions.
- Default bike setup values: 44T chainring, 16T cog, 20x1.75 wheel size.
- Exact math formulas: Gear Ratio = Plato / Piñón; Gear Inches = Gear Ratio * DiametroInches; Roll-out = Gear Ratio * CircunferenciaMetros.

---

### Task 1: Extend Data Types and BMX Calculations Utility

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/bmx.ts`

**Interfaces:**
- Produces: `calcularMetricasBMX(plato, pinon, rodadoKey)` -> `{ gearRatio, gearInches, rollOutMetros, infoRodado }`
- Produces: `RodadoRueda`, `TallaCuadro`, `TransmisionSnapshot` types.

- [ ] **Step 1: Extend `src/lib/types.ts` with new BMX fields**

Update `src/lib/types.ts`:
```typescript
export type RodadoRueda = '20x1.75' | '20x1.50' | '20x1-3/8' | 'OS20' | '24x1.75';
export type TallaCuadro =
  | 'Micro'
  | 'Mini'
  | 'Junior'
  | 'Expert'
  | 'Expert XL'
  | 'Pro'
  | 'Pro XL'
  | 'Pro XXL'
  | 'Pro XXXL'
  | 'Cruiser 24"';

export interface Corredor {
  id: string;
  nombre: string;
  categoria?: string;
  edad?: number;
  email: string;
  creadoEn: number;
  estaturaCm?: number;
  entrepiernaCm?: number;
  dientesPlato?: number;
  dientesPinon?: number;
  rodadoRueda?: RodadoRueda;
  tallaCuadro?: TallaCuadro;
  largoBielasMm?: number;
  tipoPedales?: 'clips' | 'plataforma';
}

export interface TransmisionSnapshot {
  plato: number;
  pinon: number;
  gearInches: number;
  rollOutMetros: number;
}
```

- [ ] **Step 2: Create `src/lib/bmx.ts` calculation library**

Create `src/lib/bmx.ts`:
```typescript
import type { RodadoRueda } from './types';

export interface DatosRodado {
  nombre: string;
  diametroInches: number;
  circunferenciaMetros: number;
}

export const TABLA_RODADOS: Record<RodadoRueda, DatosRodado> = {
  '20x1.75': { nombre: '20" x 1.75 (Estándar Pro)', diametroInches: 19.6, circunferenciaMetros: 1.56 },
  '20x1.50': { nombre: '20" x 1.50 (Junior/Expert)', diametroInches: 19.0, circunferenciaMetros: 1.51 },
  '20x1-3/8': { nombre: '20" x 1-3/8 (Mini/Junior)', diametroInches: 18.6, circunferenciaMetros: 1.48 },
  'OS20': { nombre: 'OS20 (Oversize 20")', diametroInches: 20.3, circunferenciaMetros: 1.62 },
  '24x1.75': { nombre: '24" x 1.75 (Cruiser 24")', diametroInches: 23.6, circunferenciaMetros: 1.88 }
};

export function calcularMetricasBMX(
  plato: number = 44,
  pinon: number = 16,
  rodadoKey: RodadoRueda = '20x1.75'
) {
  const infoRodado = TABLA_RODADOS[rodadoKey] || TABLA_RODADOS['20x1.75'];
  const gearRatio = pinon > 0 ? plato / pinon : 0;
  const gearInches = gearRatio * infoRodado.diametroInches;
  const rollOutMetros = gearRatio * infoRodado.circunferenciaMetros;

  return {
    gearRatio: Number(gearRatio.toFixed(3)),
    gearInches: Number(gearInches.toFixed(1)),
    rollOutMetros: Number(rollOutMetros.toFixed(2)),
    infoRodado
  };
}
```

- [ ] **Step 3: Run typecheck verification**

Run: `npx astro check`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/bmx.ts
git commit -m "feat(bmx): add BMX engineering calculations library and data types"
```

---

### Task 2: Create Bike Setup UI Components (`TarjetaBicicleta.tsx` & `ModalConfiguracionBicicleta.tsx`)

**Files:**
- Create: `src/components/TarjetaBicicleta.tsx`
- Create: `src/components/ModalConfiguracionBicicleta.tsx`

**Interfaces:**
- Consumes: `Corredor`, `calcularMetricasBMX`
- Produces: `TarjetaBicicleta({ corredor, onEditar })`, `ModalConfiguracionBicicleta({ corredor, isOpen, onClose, onGuardar })`

- [ ] **Step 1: Create `TarjetaBicicleta.tsx`**

Create `src/components/TarjetaBicicleta.tsx`:
```tsx
import type { Corredor } from '../lib/types';
import { calcularMetricasBMX } from '../lib/bmx';

interface Props {
  corredor: Corredor;
  onEditar: () => void;
}

export default function TarjetaBicicleta({ corredor, onEditar }: Props) {
  const metricas = calcularMetricasBMX(
    corredor.dientesPlato ?? 44,
    corredor.dientesPinon ?? 16,
    corredor.rodadoRueda ?? '20x1.75'
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚲</span>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 uppercase">Mi Bicicleta & Setup BMX</h3>
            <p className="text-xs text-slate-500">
              {corredor.tallaCuadro ? `Cuadro ${corredor.tallaCuadro}` : 'Configuración de transmisión'}
            </p>
          </div>
        </div>
        <button
          onClick={onEditar}
          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Editar Setup
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center border border-slate-100">
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">Transmisión</span>
          <span className="font-heading text-lg font-extrabold text-slate-900">
            {corredor.dientesPlato ?? 44}t / {corredor.dientesPinon ?? 16}t
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">Gear Inches</span>
          <span className="font-heading text-lg font-extrabold text-emerald-600">
            {metricas.gearInches}"
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">Roll-out</span>
          <span className="font-heading text-lg font-extrabold text-primary">
            {metricas.rollOutMetros}m
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `ModalConfiguracionBicicleta.tsx`**

Create `src/components/ModalConfiguracionBicicleta.tsx`:
```tsx
import { useState } from 'react';
import type { Corredor, RodadoRueda, TallaCuadro } from '../lib/types';
import { calcularMetricasBMX, TABLA_RODADOS } from '../lib/bmx';

interface Props {
  corredor: Corredor;
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (datosActualizados: Partial<Corredor>) => Promise<void>;
}

export default function ModalConfiguracionBicicleta({ corredor, isOpen, onClose, onGuardar }: Props) {
  if (!isOpen) return null;

  const [plato, setPlato] = useState(corredor.dientesPlato ?? 44);
  const [pinon, setPinon] = useState(corredor.dientesPinon ?? 16);
  const [rodado, setRodado] = useState<RodadoRueda>(corredor.rodadoRueda ?? '20x1.75');
  const [tallaCuadro, setTallaCuadro] = useState<TallaCuadro | ''>(corredor.tallaCuadro ?? '');
  const [bielas, setBielas] = useState(corredor.largoBielasMm ?? 175);
  const [estatura, setEstatura] = useState(corredor.estaturaCm ?? '');
  const [entrepierna, setEntrepierna] = useState(corredor.entrepiernaCm ?? '');
  const [cargando, setCargando] = useState(false);

  const metricas = calcularMetricasBMX(plato, pinon, rodado);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      await onGuardar({
        dientesPlato: Number(plato),
        dientesPinon: Number(pinon),
        rodadoRueda: rodado,
        tallaCuadro: tallaCuadro || undefined,
        largoBielasMm: Number(bielas),
        estaturaCm: estatura ? Number(estatura) : undefined,
        entrepiernaCm: entrepierna ? Number(entrepierna) : undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-heading text-xl font-bold uppercase text-slate-900">🚲 Ajuste de Bicicleta & Biometría</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Dientes Plato</label>
              <input
                type="number"
                min="30"
                max="60"
                value={plato}
                onChange={(e) => setPlato(Number(e.target.value))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Dientes Piñón</label>
              <input
                type="number"
                min="10"
                max="24"
                value={pinon}
                onChange={(e) => setPinon(Number(e.target.value))}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rodado de Rueda</label>
            <select value={rodado} onChange={(e) => setRodado(e.target.value as RodadoRueda)} className="input">
              {Object.entries(TABLA_RODADOS).map(([key, val]) => (
                <option key={key} value={key}>{val.nombre}</option>
              ))}
            </select>
          </div>

          {/* Dynamic calculations preview */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 text-xs flex justify-between items-center">
            <div>
              <span className="font-bold">Desarrollo Calculado:</span>
              <p>{metricas.gearInches}" Gear Inches ({metricas.rollOutMetros}m por pedaleada)</p>
            </div>
            <span className="font-heading text-lg font-bold bg-white px-2 py-1 rounded border border-emerald-200">{metricas.gearRatio}x</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Talla Cuadro</label>
              <select value={tallaCuadro} onChange={(e) => setTallaCuadro(e.target.value as TallaCuadro)} className="input">
                <option value="">Seleccionar Talla</option>
                <option value="Micro">Micro</option>
                <option value="Mini">Mini</option>
                <option value="Junior">Junior</option>
                <option value="Expert">Expert</option>
                <option value="Expert XL">Expert XL</option>
                <option value="Pro">Pro</option>
                <option value="Pro XL">Pro XL</option>
                <option value="Pro XXL">Pro XXL</option>
                <option value="Pro XXXL">Pro XXXL</option>
                <option value="Cruiser 24&quot;">Cruiser 24"</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Bielas (mm)</label>
              <input
                type="number"
                step="2.5"
                value={bielas}
                onChange={(e) => setBielas(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Estatura (cm)</label>
              <input
                type="number"
                placeholder="ej. 165"
                value={estatura}
                onChange={(e) => setEstatura(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Entrepierna (cm)</label>
              <input
                type="number"
                placeholder="ej. 72"
                value={entrepierna}
                onChange={(e) => setEntrepierna(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button type="button" onClick={onClose} className="btn-ghost w-1/2">Cancelar</button>
            <button type="submit" disabled={cargando} className="btn-primary w-1/2">
              {cargando ? 'Guardando...' : 'Guardar Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck verification**

Run: `npx astro check`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/TarjetaBicicleta.tsx src/components/ModalConfiguracionBicicleta.tsx
git commit -m "feat(ui): add bike setup card and interactive configuration modal"
```

---

### Task 3: Integrate Bike Setup into PanelCorredor and Account Storage

**Files:**
- Modify: `src/components/PanelCorredor.tsx`
- Modify: `src/lib/cuenta.ts`

**Interfaces:**
- Consumes: `TarjetaBicicleta`, `ModalConfiguracionBicicleta`, `obtenerCorredorActual`

- [ ] **Step 1: Add update rider function in `src/lib/cuenta.ts`**

Update `src/lib/cuenta.ts` to support updating rider bike specs in Supabase user metadata:
```typescript
export async function actualizarDatosCorredor(datos: Partial<Corredor>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('corredores')
    .update({
      dientes_plato: datos.dientesPlato,
      dientes_pinon: datos.dientesPinon,
      rodado_rueda: datos.rodadoRueda,
      talla_cuadro: datos.tallaCuadro,
      largo_bielas_mm: datos.largoBielasMm,
      estatura_cm: datos.estaturaCm,
      entrepierna_cm: datos.entrepiernaCm
    })
    .eq('id', user.id);

  if (error) {
    // Fallback: update user metadata if table update has schema restrictions
    await supabase.auth.updateUser({
      data: { ...user.user_metadata, ...datos }
    });
  }
}
```

- [ ] **Step 2: Update `src/components/PanelCorredor.tsx` to display `TarjetaBicicleta`**

Update `PanelCorredor.tsx` to include modal state and render `TarjetaBicicleta`.

- [ ] **Step 3: Run full project build verification**

Run: `npm run build`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PanelCorredor.tsx src/lib/cuenta.ts
git commit -m "feat(dashboard): integrate bike setup card and persistence into rider panel"
```
