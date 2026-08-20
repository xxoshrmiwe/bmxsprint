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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 overflow-hidden">
      {/* Banner de foto de la bicicleta si existe */}
      {corredor.fotoBiciUrl && (
        <div className="relative h-40 w-full -mt-4 -mx-4 mb-2 overflow-hidden border-b border-slate-200 bg-slate-900 group">
          <img src={corredor.fotoBiciUrl} alt="Mi Bicicleta BMX" className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-3 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-slate-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
              🚲 Mi Bicicleta BMX
            </span>
          </div>
        </div>
      )}

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
