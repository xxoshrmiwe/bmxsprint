import { useEffect, useRef } from 'react';

// Evita que el teléfono se bloquee o apague la pantalla mientras el corredor
// está en calentamiento o corriendo el gate (momentos en los que no está
// tocando la pantalla). El navegador libera el wake lock automáticamente al
// pasar la pestaña a segundo plano, por eso se vuelve a pedir al recuperar
// visibilidad. Sin soporte (navegador viejo/exótico) no hace nada — no rompe.
export function useMantenerPantallaActiva(activo: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return;

    let cancelado = false;

    async function pedir() {
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelado) {
          sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        // Algunos navegadores rechazan el pedido si la pestaña no está
        // visible o el usuario no interactuó todavía; no es un error fatal.
      }
    }

    pedir();

    function handleVisibility() {
      if (document.visibilityState === 'visible') pedir();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelado = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [activo]);
}
