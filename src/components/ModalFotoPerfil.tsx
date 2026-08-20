import { useState, useRef } from 'react';
import type { Corredor } from '../lib/types';

interface Props {
  corredor: Corredor;
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (datos: { fotoUrl?: string; avatarPreset?: string }) => Promise<void>;
}

export const AVATARES_BMX = [
  { id: 'casco', emoji: '🪖', nombre: 'Casco Full-Face' },
  { id: 'placa1', emoji: '🏷️', nombre: 'Placa #1' },
  { id: 'bici', emoji: '🚴', nombre: 'Corredor Gate' },
  { id: 'trofeo', emoji: '🏆', nombre: 'Trofeo Campeón' },
  { id: 'rayo', emoji: '⚡', nombre: 'Velocidad Rayo' },
  { id: 'fuego', emoji: '🔥', nombre: 'Sprint Fuego' },
  { id: 'meta', emoji: '🏁', nombre: 'Bandera Meta' },
  { id: 'medalla', emoji: '🥇', nombre: 'Medalla de Oro' }
];

export default function ModalFotoPerfil({ corredor, isOpen, onClose, onGuardar }: Props) {
  if (!isOpen) return null;

  const [fotoLocal, setFotoLocal] = useState<string | undefined>(corredor.fotoUrl);
  const [presetSeleccionado, setPresetSeleccionado] = useState<string | undefined>(
    corredor.fotoUrl ? undefined : (corredor.avatarPreset || 'casco')
  );
  const [cargando, setCargando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Redimensionar y comprimir la imagen en canvas a 256x256
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Recorte cuadrado centrado
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFotoLocal(dataUrl);
          setPresetSeleccionado(undefined);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleSeleccionarPreset(presetId: string) {
    setPresetSeleccionado(presetId);
    setFotoLocal(undefined);
  }

  async function handleGuardar() {
    setCargando(true);
    try {
      if (fotoLocal) {
        await onGuardar({ fotoUrl: fotoLocal, avatarPreset: undefined });
      } else {
        await onGuardar({ fotoUrl: undefined, avatarPreset: presetSeleccionado || 'casco' });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }

  const avatarPresetObj = AVATARES_BMX.find((a) => a.id === presetSeleccionado) || AVATARES_BMX[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-heading text-xl font-bold uppercase text-slate-900">📷 Foto de Perfil & Avatar BMX</h2>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
        </div>

        {/* Vista previa del Avatar */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-slate-100 bg-slate-50 shadow-md overflow-hidden ring-2 ring-emerald-400/40">
            {fotoLocal ? (
              <img src={fotoLocal} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-5xl select-none">{avatarPresetObj.emoji}</span>
            )}
          </div>
          <span className="text-xs font-bold text-slate-600">
            {fotoLocal ? 'Foto Personalizada' : avatarPresetObj.nombre}
          </span>
        </div>

        {/* Carga de Foto desde Galería/Cámara */}
        <div className="text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full cursor-pointer rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100/50 transition-colors flex items-center justify-center gap-2"
          >
            <span>📷 Subir Foto desde Galería o Cámara</span>
          </button>
        </div>

        {/* Galería de Avatares BMX */}
        <div className="space-y-2">
          <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            O elige un Avatar BMX
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARES_BMX.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => handleSeleccionarPreset(avatar.id)}
                className={`cursor-pointer flex flex-col items-center justify-center rounded-xl p-2.5 border transition-all ${
                  presetSeleccionado === avatar.id && !fotoLocal
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/40 scale-105'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-2xl mb-1">{avatar.emoji}</span>
                <span className="text-[9px] font-bold text-slate-600 leading-none text-center truncate w-full">
                  {avatar.nombre}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost w-1/2">
            Cancelar
          </button>
          <button type="button" onClick={handleGuardar} disabled={cargando} className="btn-primary w-1/2">
            {cargando ? 'Guardando...' : 'Guardar Foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
