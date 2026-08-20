import { useState } from 'react';
import { cerrarSesion, actualizarDatosCorredor } from '../lib/cuenta';
import type { Corredor } from '../lib/types';
import { IconoRayo, IconoGrafico, IconoDescarga } from './Icono';
import DashboardCorredor from './DashboardCorredor';
import InstallPrompt from './InstallPrompt';
import TarjetaBicicleta from './TarjetaBicicleta';
import ModalConfiguracionBicicleta from './ModalConfiguracionBicicleta';
import ModalFotoPerfil, { AVATARES_BMX } from './ModalFotoPerfil';

interface Props {
  corredor: Corredor;
  onNuevaSesion: () => void;
  onHistorial: () => void;
  onExportarImportar: () => void;
  onIrAClub?: () => void;
  onCerrarSesion: () => void;
}

export default function PanelCorredor({
  corredor: corredorInicial,
  onNuevaSesion,
  onHistorial,
  onExportarImportar,
  onIrAClub,
  onCerrarSesion
}: Props) {
  const [corredor, setCorredor] = useState<Corredor>(corredorInicial);
  const [modalBiciAbierto, setModalBiciAbierto] = useState(false);
  const [modalFotoAbierto, setModalFotoAbierto] = useState(false);

  async function handleCerrarSesion() {
    await cerrarSesion();
    onCerrarSesion();
  }

  async function handleGuardarBici(datosActualizados: Partial<Corredor>) {
    await actualizarDatosCorredor(datosActualizados);
    setCorredor((prev) => ({ ...prev, ...datosActualizados }));
  }

  async function handleGuardarFoto(datosFoto: { fotoUrl?: string; avatarPreset?: string }) {
    await actualizarDatosCorredor(datosFoto);
    setCorredor((prev) => ({ ...prev, ...datosFoto }));
  }

  const avatarObj = AVATARES_BMX.find((a) => a.id === corredor.avatarPreset) || AVATARES_BMX[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <button onClick={handleCerrarSesion} className="btn-ghost">
          ← Cerrar sesión
        </button>
        {onIrAClub && (
          <button
            onClick={onIrAClub}
            className="cursor-pointer text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            🏆 Ir a mi Club BMX
          </button>
        )}
      </div>

      <InstallPrompt />

      {/* CABECERA CON AVATAR Y DATOS DEL CORREDOR */}
      <div className="flex items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => setModalFotoAbierto(true)}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100 shadow-md overflow-hidden ring-2 ring-emerald-400/50">
            {corredor.fotoUrl ? (
              <img src={corredor.fotoUrl} alt={corredor.nombre} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl select-none">{avatarObj.emoji}</span>
            )}
          </div>
          <button
            type="button"
            title="Cambiar foto de perfil"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs shadow-md border border-white hover:bg-emerald-500 transition-colors"
          >
            📷
          </button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{corredor.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {corredor.categoria && (
              <span className="inline-block rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {corredor.categoria}
              </span>
            )}
            {corredor.edad && (
              <span className="text-xs text-slate-500 font-medium">
                {corredor.edad} años
              </span>
            )}
            {corredor.pesoKg && (
              <span className="text-xs text-slate-500 font-medium border-l border-slate-200 pl-2">
                ⚖️ {corredor.pesoKg} kg
              </span>
            )}
            {corredor.estaturaCm && (
              <span className="text-xs text-slate-500 font-medium border-l border-slate-200 pl-2">
                📏 {corredor.estaturaCm} cm
              </span>
            )}
          </div>
        </div>
      </div>

      <TarjetaBicicleta corredor={corredor} onEditar={() => setModalBiciAbierto(true)} />

      <DashboardCorredor corredor={corredor} />

      <div className="mx-auto max-w-md space-y-3">
        <button onClick={onNuevaSesion} className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg">
          <IconoRayo className="h-5 w-5" />
          Nuevo entrenamiento
        </button>

        <button
          onClick={onHistorial}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 font-semibold text-foreground transition-colors duration-200 hover:bg-surface"
        >
          <IconoGrafico className="h-5 w-5 text-muted-foreground" />
          Ver historial
        </button>
        <button
          onClick={onExportarImportar}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 font-semibold text-foreground transition-colors duration-200 hover:bg-surface"
        >
          <IconoDescarga className="h-5 w-5 text-muted-foreground" />
          Exportar / Importar
        </button>
      </div>

      <ModalConfiguracionBicicleta
        corredor={corredor}
        isOpen={modalBiciAbierto}
        onClose={() => setModalBiciAbierto(false)}
        onGuardar={handleGuardarBici}
      />

      <ModalFotoPerfil
        corredor={corredor}
        isOpen={modalFotoAbierto}
        onClose={() => setModalFotoAbierto(false)}
        onGuardar={handleGuardarFoto}
      />
    </div>
  );
}


