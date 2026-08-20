import { useState } from 'react';
import type { Corredor, RodadoRueda, TallaCuadro } from '../lib/types';
import { calcularMetricasBMX, TABLA_RODADOS } from '../lib/bmx';

interface Props {
  corredor: Corredor;
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (datosActualizados: Partial<Corredor>) => Promise<void>;
}

export default function ModalConfiguracionBicicleta({ corredor, isOpen, onClose, onGuardar }: Props) {
  if (!isOpen) return null;

  const [plato, setPlato] = useState(corredor.dientesPlato ?? 44);
  const [pinon, setPinon] = useState(corredor.dientesPinon ?? 16);
  const [rodado, setRodado] = useState<RodadoRueda>(corredor.rodadoRueda ?? '20x1.75');
  const [tallaCuadro, setTallaCuadro] = useState<TallaCuadro | ''>(corredor.tallaCuadro ?? '');
  const [bielas, setBielas] = useState(corredor.largoBielasMm ?? 175);
  const [estatura, setEstatura] = useState<string>(corredor.estaturaCm ? String(corredor.estaturaCm) : '');
  const [entrepierna, setEntrepierna] = useState<string>(corredor.entrepiernaCm ? String(corredor.entrepiernaCm) : '');
  const [cargando, setCargando] = useState(false);

  const metricas = calcularMetricasBMX(plato, pinon, rodado);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      await onGuardar({
        dientesPlato: Number(plato),
        dientesPinon: Number(pinon),
        rodadoRueda: rodado,
        tallaCuadro: tallaCuadro || undefined,
        largoBielasMm: Number(bielas),
        estaturaCm: estatura ? Number(estatura) : undefined,
        entrepiernaCm: entrepierna ? Number(entrepierna) : undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚲</span>
            <h2 className="font-heading text-xl font-bold uppercase text-slate-900">Ajuste de Bicicleta & Biometría</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Dientes Plato</label>
              <input
                type="number"
                min="30"
                max="60"
                value={plato}
                onChange={(e) => setPlato(Number(e.target.value))}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Dientes Piñón</label>
              <input
                type="number"
                min="10"
                max="24"
                value={pinon}
                onChange={(e) => setPinon(Number(e.target.value))}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rodado de Rueda</label>
            <select value={rodado} onChange={(e) => setRodado(e.target.value as RodadoRueda)} className="input">
              {Object.entries(TABLA_RODADOS).map(([key, val]) => (
                <option key={key} value={key}>{val.nombre}</option>
              ))}
            </select>
          </div>

          {/* Dynamic calculations preview */}
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-950 text-xs flex justify-between items-center">
            <div>
              <span className="font-bold">Desarrollo Calculado:</span>
              <p>{metricas.gearInches}" Gear Inches ({metricas.rollOutMetros}m por pedaleada)</p>
            </div>
            <span className="font-heading text-lg font-bold bg-white px-2 py-1 rounded border border-emerald-200 text-emerald-800">{metricas.gearRatio}x</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Talla Cuadro</label>
              <select value={tallaCuadro} onChange={(e) => setTallaCuadro(e.target.value as TallaCuadro)} className="input">
                <option value="">Seleccionar Talla</option>
                <option value="Micro">Micro</option>
                <option value="Mini">Mini</option>
                <option value="Junior">Junior</option>
                <option value="Expert">Expert</option>
                <option value="Expert XL">Expert XL</option>
                <option value="Pro">Pro</option>
                <option value="Pro XL">Pro XL</option>
                <option value="Pro XXL">Pro XXL</option>
                <option value="Pro XXXL">Pro XXXL</option>
                <option value="Cruiser 24&quot;">Cruiser 24"</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Bielas (mm)</label>
              <input
                type="number"
                step="2.5"
                value={bielas}
                onChange={(e) => setBielas(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Estatura Corredor (cm)</label>
              <input
                type="number"
                placeholder="ej. 165"
                value={estatura}
                onChange={(e) => setEstatura(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Altura Entrepierna (cm)</label>
              <input
                type="number"
                placeholder="ej. 72"
                value={entrepierna}
                onChange={(e) => setEntrepierna(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button type="button" onClick={onClose} className="btn-ghost w-1/2">Cancelar</button>
            <button type="submit" disabled={cargando} className="btn-primary w-1/2">
              {cargando ? 'Guardando...' : 'Guardar Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
