import { IconoRayo, IconoReloj, IconoRegla, IconoLlama, IconoGrafico } from './Icono';

interface Props {
  onIniciar: () => void;
}

const CARACTERISTICAS = [
  { Icono: IconoRayo, texto: 'Audios de salida al azar, igual que en una carrera real' },
  { Icono: IconoReloj, texto: 'Cronómetro de precisión desde el "drop" del gate' },
  { Icono: IconoRegla, texto: 'Define la distancia del sprint que quieras entrenar' },
  { Icono: IconoLlama, texto: 'Calentamiento opcional antes de arrancar' },
  { Icono: IconoGrafico, texto: 'Historial de tiempos por corredor y por distancia' }
];

export default function Landing({ onIniciar }: Props) {
  return (
    <div className="mx-auto max-w-md space-y-8 p-6 text-center sm:max-w-lg">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold uppercase text-primary">
          Sprints <span className="text-accent">BMX</span>
        </h1>
        <p className="text-muted-foreground">Cronómetro de gate para entrenamientos de BMX Racing</p>
      </div>

      <div className="card space-y-5 text-left">
        <p className="text-foreground">
          Simula la salida real de una pista de BMX: un audio de gate con espera aleatoria antes del tono de
          salida, para que tu corredor no se anticipe.
        </p>
        <ul className="space-y-3">
          {CARACTERISTICAS.map(({ Icono, texto }) => (
            <li key={texto} className="flex items-start gap-3 text-muted-foreground">
              <Icono className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span>{texto}</span>
            </li>
          ))}
        </ul>
        <p className="border-t border-border pt-3 text-sm text-muted-foreground">
          Todo se guarda en tu cuenta. Cada corredor tiene su propio usuario y contraseña para que varios
          hermanos puedan entrenar desde el mismo teléfono sin mezclar sus datos.
        </p>
      </div>

      <button onClick={onIniciar} className="btn-primary w-full py-4 text-lg">
        Iniciar
      </button>
    </div>
  );
}
