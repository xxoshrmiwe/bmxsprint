interface Props {
  onExistente: () => void;
  onNuevo: () => void;
}

export default function Acceso({ onExistente, onNuevo }: Props) {
  return (
    <div className="mx-auto max-w-md space-y-6 p-6 text-center">
      <h1 className="text-3xl font-bold text-foreground">¿Quién va a entrenar?</h1>
      <p className="text-muted-foreground">Elige si ya tienes un usuario o si es tu primera vez.</p>

      <div className="space-y-3">
        <button onClick={onExistente} className="btn-primary w-full py-4 text-lg">
          Ya soy un corredor
        </button>
        <button onClick={onNuevo} className="btn-secondary w-full py-4 text-lg">
          Soy un corredor nuevo
        </button>
      </div>
    </div>
  );
}
