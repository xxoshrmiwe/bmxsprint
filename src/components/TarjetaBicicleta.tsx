import type { Corredor } from '../lib/types';
import { calcularMetricasBMX } from '../lib/bmx';

interface Props {
  corredor: Corredor;
  onEditar: () => void;
}

export default function TarjetaBicicleta({ corredor, onEditar }: Props) {
  const metricas = calcularMetricasBMX(
    corredor.dientesPlato ?? 44,
    corredor.dientesPinon ?? 16,
    corredor.rodadoRueda ?? '20x1.75'
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xl shadow-xs">
            🚲
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 uppercase">Mi Bicicleta & Setup BMX</h3>
            <p className="text-xs text-slate-500">
              {corredor.tallaCuadro ? `Cuadro ${corredor.tallaCuadro}` : 'Configuración de transmisión'}
              {corredor.largoBielasMm ? ` · Bielas ${corredor.largoBielasMm}mm` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={onEditar}
          className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
        >
          Editar Setup
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center border border-slate-100">
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">Transmisión</span>
          <span className="font-heading text-lg font-extrabold text-slate-900">
            {corredor.dientesPlato ?? 44}t / {corredor.dientesPinon ?? 16}t
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">Gear Inches</span>
          <span className="font-heading text-lg font-extrabold text-emerald-600">
            {metricas.gearInches}"
          </span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-slate-400">Roll-out</span>
          <span className="font-heading text-lg font-extrabold text-primary">
            {metricas.rollOutMetros}m
          </span>
        </div>
      </div>
    </div>
  );
}
