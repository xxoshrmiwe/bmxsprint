interface Props {
  onExistente: () => void;
  onNuevo: () => void;
}

export default function Acceso({ onExistente, onNuevo }: Props) {
  return (
    <div className="mx-auto max-w-md space-y-6 p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">¿Quién va a entrenar?</h1>
      <p className="text-slate-500">Elige si ya tienes un usuario o si es tu primera vez.</p>

      <div className="space-y-3">
        <button
          onClick={onExistente}
          className="w-full rounded-md bg-slate-900 px-4 py-4 text-lg font-medium text-white hover:bg-slate-700"
        >
          Ya soy un corredor
        </button>
        <button
          onClick={onNuevo}
          className="w-full rounded-md border border-slate-300 px-4 py-4 text-lg font-medium text-slate-700 hover:bg-slate-50"
        >
          Soy un corredor nuevo
        </button>
      </div>
    </div>
  );
}
