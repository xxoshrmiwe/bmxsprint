import {
  IconoRayo,
  IconoReloj,
  IconoGrafico,
  IconoUsuario,
  IconoTelefono,
  IconoFlechaDerecha
} from './Icono';

interface Props {
  onIniciar: () => void;
}

const CARACTERISTICAS = [
  {
    Icono: IconoRayo,
    titulo: 'Audio Real de Gate',
    texto: 'Audios oficiales con secuencia de voces y esperas aleatorias no anticipables.',
    badge: 'Reflejos Puros',
    colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    Icono: IconoReloj,
    titulo: 'Cronometraje al "Drop"',
    texto: 'Inicio automático de precisión en milisegundos en cuanto cae la grilla de salida.',
    badge: 'Milisegundos',
    colorBadge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    Icono: IconoTelefono,
    titulo: 'Modo Solo o Asistido',
    texto: 'Corre con el celular en el bolsillo (freno por acelerómetro) o con un entrenador.',
    badge: 'Acelerómetro',
    colorBadge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    Icono: IconoUsuario,
    titulo: 'Perfil Multicorredor',
    texto: 'Cuentas individuales para compartir el celular entre hermanos sin mezclar marcas.',
    badge: 'Familia / Equipo',
    colorBadge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    Icono: IconoGrafico,
    titulo: 'Métricas & Progresión',
    texto: 'Historial por distancia, metas de velocidad por metros y promedio de 30 días.',
    badge: 'Estadísticas',
    colorBadge: 'bg-slate-100 text-slate-700 border-slate-200'
  }
];

export default function Landing({ onIniciar }: Props) {
  return (
    <div className="mx-auto max-w-xl space-y-8 p-4 py-6 sm:p-8">
      {/* Hero Header */}
      <div className="space-y-4 text-center">
        {/* Pill Tag & BMX Gate Light signal visual */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="border-l border-slate-300 pl-2">BMX Racing Timing</span>
        </div>

        {/* Logo & Main Title */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-md ring-4 ring-slate-100">
            <img
              src="/logo-gateright-256.png"
              alt="GATERIGHT BMX"
              className="h-full w-full object-contain"
              width={256}
              height={256}
            />
          </div>
          <div>
            <h1 className="font-heading text-4xl font-extrabold uppercase tracking-tight text-primary sm:text-5xl">
              Gate<span className="text-emerald-500">right</span> BMX
            </h1>
            <p className="mt-1 font-heading text-lg font-bold uppercase tracking-wider text-slate-600 sm:text-xl">
              Entrena el arranque. Domina el gate.
            </p>
          </div>
        </div>

        <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
          Recrea la sensación real de la pista con audios de partidor oficial, esperas al azar no anticipables
          y detección automática por sensores o freno asistido.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-center font-heading text-xs font-bold uppercase tracking-widest text-slate-400">
          ¿Qué puedes hacer con GateRight?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CARACTERISTICAS.map(({ Icono, titulo, texto, badge, colorBadge }, index) => (
            <div
              key={titulo}
              className={`group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md ${
                index === 0 ? 'sm:col-span-2 sm:flex-row sm:items-center sm:gap-4' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-primary transition-colors group-hover:bg-slate-900 group-hover:text-emerald-400">
                  <Icono className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-slate-900">{titulo}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">{texto}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end sm:mt-0">
                <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colorBadge}`}>
                  {badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center shadow-xs">
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-bold uppercase text-slate-900">
            ¿Listo para medir tus salidas?
          </h3>
          <p className="text-xs text-slate-500">
            Guarda tus mejores marcas por distancia y entrena de forma autónoma.
          </p>
        </div>

        <button
          onClick={onIniciar}
          className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg font-bold shadow-lg transition-transform active:scale-[0.99]"
        >
          <span>Iniciar Entrenamiento</span>
          <IconoFlechaDerecha className="h-5 w-5 text-emerald-400" />
        </button>

        <p className="text-[11px] text-slate-400">
          Compatible con cualquier navegador móvil en iOS y Android. Se puede instalar como PWA.
        </p>
      </div>
    </div>
  );
}

