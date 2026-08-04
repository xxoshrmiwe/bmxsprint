import React, { createContext, useContext, useEffect, useState } from 'react';

const CATORCE_DIAS_MS = 14 * 24 * 60 * 60 * 1000;
const CLAVE_DESCARTE = 'pwa-install-dismissed-v1';

interface InstallPwaContextType {
  puedenInstalar: boolean;
  esIos: boolean;
  esStandalone: boolean;
  instalarNativo: () => Promise<boolean>;
  descartarPrompt: () => void;
}

const InstallPwaContext = createContext<InstallPwaContextType>({
  puedenInstalar: false,
  esIos: false,
  esStandalone: false,
  instalarNativo: async () => false,
  descartarPrompt: () => {}
});

export const useInstallPwa = () => useContext(InstallPwaContext);

export function InstallPwaProvider({ children }: { children: React.ReactNode }) {
  const [promptEvento, setPromptEvento] = useState<any>(null);
  const [esIos, setEsIos] = useState(false);
  const [esStandalone, setEsStandalone] = useState(false);
  const [descartado, setDescartado] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detectar si ya está en modo standalone (instalada)
    const standaloneMatch =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setEsStandalone(standaloneMatch);

    if (standaloneMatch) return;

    // 2. Verificar descarte previo de 14 días
    const descarteGuardado = localStorage.getItem(CLAVE_DESCARTE);
    if (descarteGuardado) {
      const timestamp = Number(descarteGuardado);
      if (Date.now() - timestamp < CATORCE_DIAS_MS) {
        setDescartado(true);
      } else {
        localStorage.removeItem(CLAVE_DESCARTE);
      }
    }

    // 3. Detectar si es iOS (userAgent + soporte touch)
    const ua = navigator.userAgent.toLowerCase();
    const iosDetected =
      /ipad|iphone|ipod/.test(ua) &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setEsIos(iosDetected);

    // 4. Capturar evento nativo antes de montaje o diferido
    if ((window as any).deferredInstallPrompt) {
      setPromptEvento((window as any).deferredInstallPrompt);
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setPromptEvento(e);
    }

    function handleAppInstalled() {
      setPromptEvento(null);
      (window as any).deferredInstallPrompt = null;
      setEsStandalone(true);
    }

    function handlePwaInstallable() {
      if ((window as any).deferredInstallPrompt) {
        setPromptEvento((window as any).deferredInstallPrompt);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installable', handlePwaInstallable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installable', handlePwaInstallable);
    };
  }, []);

  function descartarPrompt() {
    setDescartado(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLAVE_DESCARTE, Date.now().toString());
    }
  }

  async function instalarNativo(): Promise<boolean> {
    if (!promptEvento) return false;
    try {
      await promptEvento.prompt();
      const choiceResult = await promptEvento.userChoice;
      setPromptEvento(null);
      (window as any).deferredInstallPrompt = null;
      if (choiceResult.outcome === 'accepted') {
        setEsStandalone(true);
        return true;
      } else {
        descartarPrompt();
        return false;
      }
    } catch (err) {
      console.error('Error al ejecutar prompt de PWA:', err);
      return false;
    }
  }

  // Pueden instalar si no está instalada, no fue descartada, y (hay evento nativo OR es iOS)
  const puedenInstalar = !esStandalone && !descartado && (Boolean(promptEvento) || esIos);

  return (
    <InstallPwaContext.Provider
      value={{
        puedenInstalar,
        esIos,
        esStandalone,
        instalarNativo,
        descartarPrompt
      }}
    >
      {children}
    </InstallPwaContext.Provider>
  );
}
