import { supabase, establecerRecordar } from './supabase';
import type { Corredor } from './types';

export interface DatosRegistro {
  nombre: string;
  categoria?: string;
  edad?: number;
  email: string;
  password: string;
}

export async function registrarCorredor(datos: DatosRegistro): Promise<{ sesionActiva: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        nombre: datos.nombre,
        categoria: datos.categoria ?? null,
        edad: datos.edad ?? null
      }
    }
  });

  if (error) throw error;

  return { sesionActiva: data.session !== null };
}

export async function iniciarSesion(email: string, password: string, recordar = true): Promise<void> {
  establecerRecordar(recordar);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function cerrarSesion(): Promise<void> {
  await supabase.auth.signOut();
}

export async function obtenerCorredorActual(): Promise<Corredor | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const metadata = user.user_metadata || {};
  const { data } = await supabase.from('corredores').select('*').eq('id', user.id).single();

  return {
    id: user.id,
    nombre: metadata.nombre ?? data?.nombre ?? 'Corredor',
    categoria: metadata.categoria ?? data?.categoria ?? undefined,
    edad: metadata.edad ?? data?.edad ?? undefined,
    email: user.email ?? '',
    creadoEn: data?.creado_en ? new Date(data.creado_en).getTime() : Date.now(),
    fotoUrl: metadata.fotoUrl ?? undefined,
    avatarPreset: metadata.avatarPreset ?? undefined,
    fotoBiciUrl: metadata.fotoBiciUrl ?? undefined,
    pesoKg: metadata.pesoKg ?? undefined,
    estaturaCm: data?.estatura_cm ?? metadata.estaturaCm ?? undefined,
    entrepiernaCm: data?.entrepierna_cm ?? metadata.entrepiernaCm ?? undefined,
    dientesPlato: data?.dientes_plato ?? metadata.dientesPlato ?? 44,
    dientesPinon: data?.dientes_pinon ?? metadata.dientesPinon ?? 16,
    rodadoRueda: data?.rodado_rueda ?? metadata.rodadoRueda ?? '20x1.75',
    tallaCuadro: data?.talla_cuadro ?? metadata.tallaCuadro ?? undefined,
    largoBielasMm: data?.largo_bielas_mm ?? metadata.largoBielasMm ?? 175,
    tipoPedales: data?.tipo_pedales ?? metadata.tipoPedales ?? undefined
  };
}

export async function actualizarDatosCorredor(datos: Partial<Corredor>): Promise<void> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return;

  // Actualizar metadatos de usuario (persistencia universal garantizada)
  await supabase.auth.updateUser({
    data: { ...user.user_metadata, ...datos }
  });

  // Intentar actualizar también la tabla Supabase si los campos existen
  try {
    await supabase
      .from('corredores')
      .update({
        dientes_plato: datos.dientesPlato,
        dientes_pinon: datos.dientesPinon,
        rodado_rueda: datos.rodadoRueda,
        talla_cuadro: datos.tallaCuadro,
        largo_bielas_mm: datos.largoBielasMm,
        estatura_cm: datos.estaturaCm,
        entrepierna_cm: datos.entrepiernaCm
      })
      .eq('id', user.id);
  } catch (e) {
    // Si la tabla no tiene las columnas adicionales, no bloquea el guardado
  }
}

export async function solicitarRecuperacion(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/restablecer-password`
  });
  if (error) throw error;
}

export async function actualizarPassword(nuevaPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
  if (error) throw error;
}
