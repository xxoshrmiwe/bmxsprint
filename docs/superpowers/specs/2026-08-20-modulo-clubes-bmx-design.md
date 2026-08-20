# Especificación Técnica: Módulo de Clubes, Mangas y Programación Semanal BMX

**Fecha:** 2026-08-20  
**Estado:** Propuesta de Arquitectura  

---

## 1. Visión General

Esta funcionalidad introduce el subsistema de **Clubes & Equipos de BMX Racing** en GateRight. Permite a entrenadores y directores de club crear su equipo, establecer calendarios semanales de entrenamiento, gestionar la asistencia de atletas, generar asignaciones de carriles por mangas (1 a 8 carriles) con locución por voz y mantener rankings de tiempos del grupo.

---

## 2. Modelo de Datos (`src/lib/types.ts`)

```typescript
export type RolClub = 'entrenador' | 'atleta';

export interface Club {
  id: string;
  codigoInvite: string; // ej. "RAPTORS-2026"
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
  horaInicio: string; // "17:00"
  titulo: string; // "Técnica de Gate y Sprints"
  descripcion?: string;
}

export interface AsignacionCarrilManga {
  carril: number; // 1 a 8
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

---

## 3. Componentes e Interfaz de Usuario (UI/UX)

1. **`PanelClub.tsx`:** Centro de control del club (Creación/Unión por código `RAPTORS-2026`, lista de miembros, ranking interno).
2. **`ProgramadorSemanalClub.tsx`:** Calendario interactivo donde el entrenador define los días y rutinas de entrenamiento.
3. **`GeneradorMangasCarriles.tsx`:** Asignador de carriles de 1 a 8 con locución por voz (Web Speech API) y captura de tiempos en meta.

---

## 4. Plan de Verificación

- **Compilación y Tipos:** `npx astro check` y `npm run build` con 0 errores.
- **Locución por Voz:** Probar locución sintética de prueba en iOS/Android.
