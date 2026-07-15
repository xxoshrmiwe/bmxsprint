# Sprints BMX

Cronómetro de gate para entrenamientos de BMX Racing: registra corredores, arranca un nuevo entrenamiento indicando la distancia del sprint, hace (o salta) un calentamiento, reproduce un audio de salida al azar y mide el tiempo desde el "gate drop" hasta que detienes manualmente.

## Stack

- **Astro** (`output: 'static'`) — el sitio se genera como HTML/JS estático. No hay funciones serverless propias; toda la lógica de cuentas y datos habla directo con Supabase desde el navegador.
- **React** — un solo island (`src/components/SprintApp.tsx`) monta toda la app con `client:only="react"`.
- **Tailwind CSS v4** — vía `@tailwindcss/vite`.
- **Supabase** (Auth + Postgres) — reemplaza lo que antes era IndexedDB local. Cada corredor es una cuenta real (correo + contraseña) que funciona desde cualquier dispositivo, con:
  - Correo de bienvenida al registrarse (plantilla "Confirm signup" de Supabase Auth).
  - Recuperar contraseña por correo (plantilla "Reset password" de Supabase Auth) — ver [`src/pages/restablecer-password.astro`](src/pages/restablecer-password.astro).
  - Base de datos Postgres con Row Level Security: cada corredor solo puede ver/editar sus propias sesiones e intentos.
- **Exportar/Importar JSON** — respaldo manual adicional de las sesiones y tiempos de un corredor (botón "Exportar / Importar" en el panel).
- **Rutina de calentamiento** (`src/lib/warmup.ts`) — ejercicios sin equipo adaptados de [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) (MIT), organizados en tres rutinas según la edad del corredor. Ver [`NOTICE-ejercicios.md`](NOTICE-ejercicios.md) para la atribución completa.

## Configurar Supabase (obligatorio)

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pegá y corré el contenido de [`supabase/schema.sql`](supabase/schema.sql). Esto crea las tablas `corredores`, `sesiones`, `intentos`, sus políticas de Row Level Security, y un trigger que crea el perfil del corredor automáticamente cuando alguien se registra.
3. En **Settings → API**, copiá el **Project URL** y la **anon public key**.
4. Copiá `.env.example` a `.env` y completá esos dos valores:
   ```
   PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
5. En **Authentication → URL Configuration**, agregá como Redirect URL:
   - `http://localhost:4321/**` (para desarrollo local)
   - `https://tu-dominio-en-vercel.vercel.app/**` (una vez que tengas el deploy)

### Personalizar los correos (bienvenida y recuperación)

En **Authentication → Email Templates** de Supabase están las plantillas que ya disparan los flujos de esta app:

- **Confirm signup** → es el correo de bienvenida que recibe cada corredor al registrarse.
- **Reset password** → es el correo que recibe al pedir "¿Olvidaste tu contraseña?".

Podés editar el asunto y el HTML de cada una para que suene más a "Sprints BMX" en vez del texto genérico de Supabase.

> **Límite del plan gratis:** Supabase usa un SMTP propio para el plan gratuito con un límite bajo de correos por hora (pensado para pruebas). Para uso real con varias familias, conviene configurar un SMTP propio (ej. Resend, gratis hasta 3,000 correos/mes) en **Settings → Auth → SMTP Settings**.

## Cómo agregar los audios de salida (gate)

1. Coloca tus archivos `.mp3`, `.wav`, `.ogg` o `.m4a` en [`src/assets/gate/`](src/assets/gate/).
2. Se detectan automáticamente al hacer build o al correr `npm run dev` — no hay que editar ningún manifiesto ni código.
3. **Importante:** cada audio debe terminar exactamente en el momento del "drop" (el tono/klaxon de salida), sin silencio después. El cronómetro arranca justo cuando el audio termina de reproducirse.
4. Sube varios audios con distintos tiempos de espera para que el corredor no memorice el patrón — así funciona el gate real en pista.

Ver [`src/assets/gate/README.md`](src/assets/gate/README.md) para más detalle.

## Comandos

| Comando           | Acción                                        |
| :---------------- | :--------------------------------------------- |
| `npm install`      | Instala dependencias                          |
| `npm run dev`      | Corre el servidor local en `localhost:4321`   |
| `npm run build`    | Genera el sitio estático en `./dist/`         |
| `npm run preview`  | Sirve el build de producción localmente        |

## Desplegar en Vercel (gratis)

1. Sube este proyecto a un repositorio de GitHub/GitLab/Bitbucket.
2. En [vercel.com](https://vercel.com), "Add New Project" → importa el repositorio.
3. Vercel detecta Astro automáticamente (build command `astro build`, output `dist`).
4. En **Settings → Environment Variables** del proyecto en Vercel, agregá `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` con los mismos valores de tu `.env`.
5. Agregá la URL final de Vercel a los Redirect URLs de Supabase (paso 5 de la configuración de arriba) — si no, el enlace de "recuperar contraseña" no va a funcionar en producción.
6. Cada vez que agregues nuevos audios a `src/assets/gate/` y hagas push, Vercel los incluye en el próximo deploy.

## Estructura del proyecto

```text
src/
├── assets/gate/       # Audios de salida (.mp3/.wav/.ogg/.m4a) — los subes tú
├── components/        # Componentes React (registro, login, recuperar contraseña, sesión, gate timer, historial, export/import)
├── layouts/           # Layout de Astro (importa Tailwind)
├── lib/
│   ├── audio.ts       # Detecta y elige al azar un audio de gate
│   ├── supabase.ts    # Cliente de Supabase (usa las env vars PUBLIC_SUPABASE_*)
│   ├── cuenta.ts       # Registro, login, logout, recuperar/actualizar contraseña (Supabase Auth)
│   ├── db.ts          # Sesiones e intentos (consultas a Supabase Postgres)
│   ├── warmup.ts      # Rutinas de calentamiento por edad (ver NOTICE-ejercicios.md)
│   └── types.ts       # Modelo de datos (Corredor, Sesion, Intento)
└── pages/
    ├── index.astro              # Monta la app (client:only="react")
    └── restablecer-password.astro  # Página a la que redirige el correo de recuperación
supabase/
└── schema.sql         # Tablas, RLS y trigger — correr una vez en el SQL Editor de Supabase
```

## Aviso sobre los datos

Los corredores, sesiones e intentos viven en tu proyecto de Supabase (Postgres), no en el navegador — por eso funcionan desde cualquier dispositivo iniciando sesión con el mismo correo. La cuenta se protege con la autenticación real de Supabase (no es un hash local como en versiones anteriores de este proyecto).

**Sobre eliminar una cuenta:** por ahora no hay botón para borrar completamente una cuenta desde la app (eso requiere la API de administración de Supabase, que usa una clave que nunca debe exponerse en el navegador). Si un corredor quiere borrar su cuenta, se hace manualmente desde el dashboard de Supabase (**Authentication → Users**).
