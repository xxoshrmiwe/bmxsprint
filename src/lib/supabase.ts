import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan las variables de entorno PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY. Revisa el archivo .env (ver README).'
  );
}

export const supabase = createClient(url, anonKey);
