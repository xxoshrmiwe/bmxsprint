import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan las variables de entorno PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY. Revisa el archivo .env (ver README).'
  );
}

const CLAVE_RECORDAR = 'sprints-recordar';

/**
 * Antes de iniciar sesión, llamar a establecerRecordar(bool) para decidir si el
 * token de sesión se guarda en localStorage (sobrevive a cerrar el navegador)
 * o en sessionStorage (se pierde al cerrar la pestaña).
 */
export function establecerRecordar(recordar: boolean) {
  localStorage.setItem(CLAVE_RECORDAR, recordar ? 'true' : 'false');
}

const almacenamiento = {
  getItem(clave: string) {
    return localStorage.getItem(clave) ?? sessionStorage.getItem(clave);
  },
  setItem(clave: string, valor: string) {
    const recordar = localStorage.getItem(CLAVE_RECORDAR) !== 'false';
    if (recordar) {
      sessionStorage.removeItem(clave);
      localStorage.setItem(clave, valor);
    } else {
      localStorage.removeItem(clave);
      sessionStorage.setItem(clave, valor);
    }
  },
  removeItem(clave: string) {
    localStorage.removeItem(clave);
    sessionStorage.removeItem(clave);
  }
};

export const supabase = createClient(url, anonKey, {
  auth: { storage: almacenamiento }
});
