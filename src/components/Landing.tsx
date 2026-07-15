interface Props {
  onIniciar: () => void;
}

export default function Landing({ onIniciar }: Props) {
  return (
    <div className="mx-auto max-w-md space-y-8 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Sprints BMX</h1>
        <p className="text-slate-500">Cronómetro de gate para entrenamientos de BMX Racing</p>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 text-left">
        <p className="text-slate-700">
          Simula la salida real de una pista de BMX: un audio de gate con espera aleatoria antes del tono de
          salida, para que tu corredor no se anticipe.
        </p>
        <ul className="space-y-2 text-slate-600">
          <li>🚦 Audios de salida al azar, igual que en una carrera real</li>
          <li>⏱️ Cronómetro de precisión desde el "drop" del gate</li>
          <li>📏 Define la distancia del sprint que quieras entrenar</li>
          <li>🔥 Calentamiento opcional antes de arrancar</li>
          <li>📈 Historial de tiempos por corredor y por distancia</li>
        </ul>
        <p className="text-sm text-slate-400">
          Todo se guarda en este dispositivo. Cada corredor tiene su propio usuario y contraseña para que varios
          hermanos puedan entrenar desde el mismo teléfono sin mezclar sus datos.
        </p>
      </div>

      <button
        onClick={onIniciar}
        className="w-full rounded-md bg-slate-900 px-4 py-4 text-lg font-medium text-white hover:bg-slate-700"
      >
        Iniciar
      </button>
    </div>
  );
}
