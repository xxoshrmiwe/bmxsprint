# Especificación Técnica: Suite Institucional de Clubes, Mangas y Gestión BMX

**Fecha:** 2026-08-20  
**Estado:** IMPLEMENTADO — v2.0.1  

---

## 1. Visión General

Esta funcionalidad comprende el subsistema de **Clubes & Escuelas Deportivo de BMX Racing** en GateRight. Permite a directores y representantes legales registrar la cuenta oficial del club, crear credenciales para entrenadores secundarios, administrar fichas completas de niños/atletas (manuales e invitaciones vía WhatsApp), publicar la agenda semanal de rutinas y generar mangas de 8 carriles con marcado de asistencia en grilla y locución por voz (TTS).

---

## 2. Modelo de Datos (`src/lib/types.ts`)

```typescript
export type RolClub = 'entrenador' | 'atleta';

export interface Club {
  id: string;
  codigoInvite: string; // ej. "RAPT-5821"
  nombre: string;
  descripcion?: string;
  creadoPor: string;
  creadoEn: number;
}

export interface EntrenadorClub {
  id: string;
  clubId: string;
  nombre: string;
  email?: string;
  password?: string;
  especialidad?: string;
  creadoEn: number;
}

export interface AtletaClub {
  id: string;
  clubId: string;
  nombre: string;
  edad: number;
  categoria: string;
  telefonoPadres?: string;
  pesoKg?: number;
  esRegistrado?: boolean;
  corredorId?: string;
  creadoEn: number;
}

export interface HorarioEntrenamientoClub {
  id: string;
  clubId: string;
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  horaInicio: string; // "17:00"
  titulo: string;
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

1. **`PanelClub.tsx`:** Hub del club (Alta de profesores con clave, fichas completas de niños, invitaciones por WhatsApp, enlaces automáticos y cambio de vistas).
2. **`GeneradorMangasCarriles.tsx`:** Asignador de carriles de 1 a 8 con atletas reales, marcado de asistencia en grilla en vivo, filtro por edad y locución por altoparlante (Web Speech API).
3. **`ProgramadorSemanalClub.tsx`:** CRUD dinámico para publicar rutinas y días de entrenamiento.
4. **`AdminApp.tsx`:** Pestaña Super Admin "Clubes & Escuelas 🏆" para auditar instituciones registradas en la plataforma.
