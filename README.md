# GATERIGHT BMX (v2.0.1)

Cronómetro de gate y Suite Institucional para entrenamientos de BMX Racing: registra corredores y escuelas deportivas, gestiona entrenadores, audita atletas, programa la agenda semanal, genera mangas de 8 carriles con locución por voz sintética y mide el tiempo de sprint desde el "gate drop" hasta la meta.

## Stack & Arquitectura

- **Astro** (`output: 'static'`) — el sitio se genera como HTML/JS estático optimizado. La app habla directo con Supabase desde el navegador; el panel de admin usa funciones serverless de Vercel (`api/admin/*`) para operaciones privilegiadas.
- **React** — islas de React (`src/components/SprintApp.tsx`) montadas con `client:only="react"`.
- **Suite Institucional de Clubes & Escuelas BMX** — gestión integral para escuelas deportivas:
  - **Credenciales para Entrenadores:** Alta de profesores secundarios con correo y clave para dirigir entrenamientos en pista.
  - **Vinculación & Fichas de Atletas:** Fichas manuales completas (Nombre del niño, Edad, Categoría, Teléfono de Padres y Peso kg) o vinculación autónoma vía código de invitación (`RAPT-5821`).
  - **Invitaciones por WhatsApp 📲:** Enlaces directos (`https://gaterightbmx.com/?unirse=RAPT-5821`) con mensaje formateado para enviar a grupos de padres.
  - **Sorteo de Mangas de 8 Carriles con Locución por Voz (TTS):** Asistencia en vivo en la grilla, agrupación por edades (*5-8, 9-12, 13-16, 17+*) y anuncio automático por altoparlantes.
  - **Agenda Semanal Dinámica:** Publicación de rutinas y horarios oficiales del equipo.
- **Categorías BMX Estandarizadas (`CATEGORIAS_BMX_ESTANDAR`)** — desplegables `<select>` con la estructura oficial de categorías (Principiantes, Novatos, Expertos, Damas, Cruiser, Championship, Elite Pro).
- **Tolerancia a Fallos de Red & Fallback Offline** — persistencia local en `localStorage` con botón de *"Entrar en Modo Local / Autónomo ⚡"* ante caídas o interrupciones de red.
- **PWA Standalone & Service Worker** — aplicación web progresiva instalable en Android e iOS sin barras de navegación (`manifest.webmanifest` y `public/sw.js`).
- **Modo Solo con Acelerómetro 3D** — detección de frenado por sensores de movimiento (`devicemotion`) calibrados para iPhone 15 (fuerza dinámica) y Android (con gravedad), con confirmación sonora/vibratoria de 3s.
- **Tailwind CSS v4** — estilizado vía `@tailwindcss/vite`.
- **Supabase (Auth + Postgres)** — persistencia universal de perfiles, sesiones, intentos y metas con Row Level Security.
- **Panel Super Admin (`/bmxadmin`)** — gestión de corredores, campaigns de email y nueva pestaña **"Clubes & Escuelas 🏆"** para supervisar códigos de invitación e instituciones registradas.

## Estructura de Archivos

```text
src/
├── components/
│   ├── Acceso.tsx                  # Pestañas de acceso para Corredores vs Clubes
│   ├── Registro.tsx                # Formulario de registro adaptado por rol (Atleta vs Club)
│   ├── IniciarSesion.tsx           # Login con respaldo de Modo Local / Offline ⚡
│   ├── PanelCorredor.tsx           # Dashboard limpio para corredores y familias
│   ├── PanelClub.tsx               # Hub institucional para gestión de Clubes, Atletas y Profesores
│   ├── GeneradorMangasCarriles.tsx # Partidor de 8 carriles con asistencia y voz TTS
│   ├── ProgramadorSemanalClub.tsx  # CRUD de agenda semanal del club
│   ├── GateTimer.tsx               # Cronómetro de gate y sensores de acelerómetro
│   └── AdminApp.tsx                # Super Admin con gestión de Corredores, Clubes y Email Campaigns
├── lib/
│   ├── cuenta.ts                   # Persistencia local y auth de Supabase
│   ├── clubes.ts                   # Helpers de gestión de clubes, invitaciones WA y TTS
│   ├── adminApi.ts                 # Cliente API de administración y clubes
│   └── types.ts                    # Modelo de datos (Corredor, Club, EntrenadorClub, AtletaClub, Categorías)
```

## Comandos

| Comando           | Acción                                        |
| :---------------- | :--------------------------------------------- |
| `npm run dev`     | Corre el servidor local en `localhost:4321`   |
| `npm run build`   | Genera el sitio estático en `./dist/`         |
| `npm run preview` | Sirve el build de producción localmente        |
