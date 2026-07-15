import { useEffect, useState } from 'react';
import type { Corredor, Sesion } from '../lib/types';
import { obtenerCorredorActual } from '../lib/cuenta';
import Landing from './Landing';
import Acceso from './Acceso';
import IniciarSesion from './IniciarSesion';
import Registro from './Registro';
import OlvideContrasena from './OlvideContrasena';
import PanelCorredor from './PanelCorredor';
import NuevaSesion from './NuevaSesion';
import Calentamiento from './Calentamiento';
import GateTimer from './GateTimer';
import Historial from './Historial';
import ExportarImportar from './ExportarImportar';

type Vista =
  | { tipo: 'cargando' }
  | { tipo: 'landing' }
  | { tipo: 'acceso' }
  | { tipo: 'login' }
  | { tipo: 'registro' }
  | { tipo: 'registro-exitoso'; email: string }
  | { tipo: 'olvide-password' }
  | { tipo: 'panel'; corredor: Corredor }
  | { tipo: 'nueva-sesion'; corredor: Corredor }
  | { tipo: 'calentamiento'; corredor: Corredor; sesion: Sesion }
  | { tipo: 'gate'; corredor: Corredor; sesion: Sesion }
  | { tipo: 'historial'; corredor: Corredor }
  | { tipo: 'exportar-importar'; corredor: Corredor };

export default function SprintApp() {
  const [vista, setVista] = useState<Vista>({ tipo: 'cargando' });

  useEffect(() => {
    obtenerCorredorActual().then((corredor) => {
      setVista(corredor ? { tipo: 'panel', corredor } : { tipo: 'landing' });
    });
  }, []);

  async function irAlPanel() {
    const corredor = await obtenerCorredorActual();
    setVista(corredor ? { tipo: 'panel', corredor } : { tipo: 'acceso' });
  }

  switch (vista.tipo) {
    case 'cargando':
      return <p className="p-6 text-center text-slate-400">Cargando...</p>;

    case 'landing':
      return <Landing onIniciar={() => setVista({ tipo: 'acceso' })} />;

    case 'acceso':
      return (
        <Acceso
          onExistente={() => setVista({ tipo: 'login' })}
          onNuevo={() => setVista({ tipo: 'registro' })}
        />
      );

    case 'login':
      return (
        <IniciarSesion
          onAcceso={irAlPanel}
          onVolver={() => setVista({ tipo: 'acceso' })}
          onIrARegistro={() => setVista({ tipo: 'registro' })}
          onOlvideContrasena={() => setVista({ tipo: 'olvide-password' })}
        />
      );

    case 'registro':
      return (
        <Registro
          onRegistrado={({ sesionActiva, email }) => {
            if (sesionActiva) {
              irAlPanel();
            } else {
              setVista({ tipo: 'registro-exitoso', email });
            }
          }}
          onVolver={() => setVista({ tipo: 'acceso' })}
          onIrALogin={() => setVista({ tipo: 'login' })}
        />
      );

    case 'registro-exitoso':
      return (
        <div className="mx-auto max-w-md space-y-4 p-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">¡Ya casi!</h1>
          <p className="text-slate-500">
            Te mandamos un correo de bienvenida a <strong>{vista.email}</strong> para confirmar tu cuenta. Ábrelo
            y confirma para poder iniciar sesión.
          </p>
          <button
            onClick={() => setVista({ tipo: 'login' })}
            className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
          >
            Ir a iniciar sesión
          </button>
        </div>
      );

    case 'olvide-password':
      return <OlvideContrasena onVolver={() => setVista({ tipo: 'login' })} />;

    case 'panel':
      return (
        <PanelCorredor
          corredor={vista.corredor}
          onNuevaSesion={() => setVista({ tipo: 'nueva-sesion', corredor: vista.corredor })}
          onHistorial={() => setVista({ tipo: 'historial', corredor: vista.corredor })}
          onExportarImportar={() => setVista({ tipo: 'exportar-importar', corredor: vista.corredor })}
          onCerrarSesion={() => setVista({ tipo: 'acceso' })}
        />
      );

    case 'nueva-sesion':
      return (
        <NuevaSesion
          corredor={vista.corredor}
          onVolver={() => setVista({ tipo: 'panel', corredor: vista.corredor })}
          onSesionCreada={(sesion) =>
            setVista(
              sesion.calentamientoRealizado
                ? { tipo: 'calentamiento', corredor: vista.corredor, sesion }
                : { tipo: 'gate', corredor: vista.corredor, sesion }
            )
          }
        />
      );

    case 'calentamiento':
      return (
        <Calentamiento
          edad={vista.corredor.edad}
          onListo={() => setVista({ tipo: 'gate', corredor: vista.corredor, sesion: vista.sesion })}
        />
      );

    case 'gate':
      return (
        <GateTimer
          sesion={vista.sesion}
          onFinalizarSesion={() => setVista({ tipo: 'historial', corredor: vista.corredor })}
        />
      );

    case 'historial':
      return <Historial corredor={vista.corredor} onVolver={() => setVista({ tipo: 'panel', corredor: vista.corredor })} />;

    case 'exportar-importar':
      return (
        <ExportarImportar
          corredor={vista.corredor}
          onVolver={() => setVista({ tipo: 'panel', corredor: vista.corredor })}
        />
      );
  }
}
