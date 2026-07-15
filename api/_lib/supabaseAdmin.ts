import { createClient } from '@supabase/supabase-js';

let cliente: ReturnType<typeof createClient> | null = null;

export function obtenerClienteAdmin() {
  if (cliente) return cliente;

  const url = process.env.PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor.');
  }

  cliente = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return cliente;
}
