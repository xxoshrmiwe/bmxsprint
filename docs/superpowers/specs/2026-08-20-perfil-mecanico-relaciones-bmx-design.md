# Especificación Técnica: Perfil Mecánico & Calculador de Relaciones BMX

**Fecha:** 2026-08-20  
**Estado:** Propuesta Aprobada  

---

## 1. Visión General

Esta funcionalidad transforma **GateRight BMX** incorporando la ingeniería mecánica real de la bicicleta y los datos biométricos del corredor. Permite guardar la relación de transmisión (*plato/piñón*), el rodado, la longitud de bielas, la talla del cuadro y las medidas físicas del corredor, calculando automáticamente las **Pulgadas de Desarrollo (*Gear Inches*)** y el **Desplazamiento por Pedaleada (*Roll-out*)** para vincular cada tiempo de entrenamiento con la relación mecánica utilizada.

---

## 2. Modelo de Datos y Tipos (`src/lib/types.ts`)

### 2.1 Extensión de la interfaz `Corredor`
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

  // Nuevos campos mecánicos y biométricos
  estaturaCm?: number;
  entrepiernaCm?: number;
  dientesPlato?: number;
  dientesPinon?: number;
  rodadoRueda?: RodadoRueda;
  tallaCuadro?: TallaCuadro;
  largoBielasMm?: number;
  tipoPedales?: 'clips' | 'plataforma';
}
```

### 2.2 Instantánea en `Sesion`
```typescript
export interface TransmisionSnapshot {
  plato: number;
  pinon: number;
  gearInches: number;
  rollOutMetros: number;
}

export interface Sesion {
  id: string;
  corredorId: string;
  fecha: number;
  distanciaMetros: number;
  calentamientoRealizado: boolean;
  modoMedicion?: 'asistido' | 'acelerometro';
  notas?: string;
  transmisionSnapshot?: TransmisionSnapshot;
}
```

---

## 3. Lógica de Ingeniería BMX (`src/lib/bmx.ts`)

Se crea la utilidad `src/lib/bmx.ts` con la tabla de referencias y las fórmulas de cálculo:

```typescript
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
  const gearRatio = plato / pinon;
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

---

## 4. Interfaz de Usuario (UI/UX)

1. **`TarjetaBicicleta.tsx`:** Componente visual en el panel principal que muestra la relación configurada, *Gear Inches*, *Roll-out* y botón para editar.
2. **`ModalConfiguracionBicicleta.tsx`:** Modal interactivo para ingresar/editar plato, piñón, rodado, bielas, talla de cuadro y biometría (estatura y entrepierna) con previsualización en vivo.
3. **`NuevaSesion.tsx`:** Chip visual de confirmación de transmisión activa antes de iniciar el cronómetro.

---

## 5. Plan de Verificación

- **Compilación y Tipos:** Ejecutar `npx astro check` y `npm run build` para asegurar 0 errores de TypeScript.
- **Pruebas de Cálculo:** Verificar que la relación 44/16 en rodado 20x1.75 calcule correctamente ~53.9" Gear Inches y ~4.29m Roll-out.
