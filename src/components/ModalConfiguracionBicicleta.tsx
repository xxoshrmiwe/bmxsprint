import { useState, useRef } from 'react';
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

  const [nombre, setNombre] = useState(corredor.nombre ?? '');
  const [categoria, setCategoria] = useState(corredor.categoria ?? '');
  const [edad, setEdad] = useState<string>(corredor.edad ? String(corredor.edad) : '');
  const [peso, setPeso] = useState<string>(corredor.pesoKg ? String(corredor.pesoKg) : '');

  const [plato, setPlato] = useState(corredor.dientesPlato ?? 44);
  const [pinon, setPinon] = useState(corredor.dientesPinon ?? 16);
  const [rodado, setRodado] = useState<RodadoRueda>(corredor.rodadoRueda ?? '20x1.75');
  const [tallaCuadro, setTallaCuadro] = useState<TallaCuadro | ''>(corredor.tallaCuadro ?? '');
  const [bielas, setBielas] = useState(corredor.largoBielasMm ?? 175);
  const [estatura, setEstatura] = useState<string>(corredor.estaturaCm ? String(corredor.estaturaCm) : '');
  const [entrepierna, setEntrepierna] = useState<string>(corredor.entrepiernaCm ? String(corredor.entrepiernaCm) : '');
  const [fotoBici, setFotoBici] = useState<string | undefined>(corredor.fotoBiciUrl);
  const [cargando, setCargando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const metricas = calcularMetricasBMX(plato, pinon, rodado);

  function handleFotoBiciChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFotoBici(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      await onGuardar({
        nombre: nombre.trim() || corredor.nombre,
        categoria: categoria.trim() || undefined,
        edad: edad ? Number(edad) : undefined,
        pesoKg: peso ? Number(peso) : undefined,
        fotoBiciUrl: fotoBici,
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
            <span className="text-2xl">⚙️</span>
            <h2 className="font-heading text-xl font-bold uppercase text-slate-900">Perfil, Bicicleta & Biometría</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FOTO DE LA BICICLETA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-600">Foto de tu Bicicleta 🚲</label>
            {fotoBici ? (
              <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
                <img src={fotoBici} alt="Bicicleta" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFotoBici(undefined)}
                  className="absolute top-2 right-2 rounded-full bg-slate-900/80 text-white p-1 text-xs hover:bg-red-600"
                >
                  ✕ Eliminar foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-4 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-1"
              >
                <span className="text-xl">📸</span>
                <span>Subir Foto de tu Bicicleta</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFotoBiciChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* DATOS PERSONALES */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400">Datos del Corredor</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Categoría</label>
                <input
                  type="text"
                  placeholder="ej. 8 Expertos"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Edad</label>
                <input
                  type="number"
                  placeholder="Años"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  placeholder="kg"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Estatura (cm)</label>
                <input
                  type="number"
                  placeholder="cm"
                  value={estatura}
                  onChange={(e) => setEstatura(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* TRANSMISIÓN Y MONTAJE */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-400">Transmisión & Marco BMX</h3>
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
              {cargando ? 'Guardando...' : 'Guardar Perfil & Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
