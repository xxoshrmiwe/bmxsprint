import { supabase, establecerRecordar } from './supabase';
import type { Corredor } from './types';

export interface DatosRegistro {
  nombre: string;
  categoria?: string;
  edad?: number;
  email: string;
  password: string;
}

export function guardarCorredorLocal(corredor: Corredor): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('bmx_local_corredor', JSON.stringify(corredor));
  }
}

export function obtenerCorredorLocal(): Corredor | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('bmx_local_corredor');
  return raw ? JSON.parse(raw) : null;
}

export function crearCorredorOffline(nombre: string = 'Corredor BMX'): Corredor {
  const offlineRider: Corredor = {
    id: `local_${Date.now()}`,
    nombre: nombre || 'Corredor BMX',
    email: 'local@gateright.app',
    creadoEn: Date.now(),
    dientesPlato: 44,
    dientesPinon: 16,
    rodadoRueda: '20x1.75',
    largoBielasMm: 175
  };
  guardarCorredorLocal(offlineRider);
  return offlineRider;
}

export async function construirCorredorDesdeUser(user: any): Promise<Corredor> {
  const metadata = user.user_metadata || {};
  let dbData: any = null;

  try {
    const { data } = await supabase.from('corredores').select('*').eq('id', user.id).maybeSingle();
    dbData = data;
  } catch (e) {
    // Si la tabla no existe o falla la consulta, los metadatos garantizan la continuidad
  }

  const corredor: Corredor = {
    id: user.id,
    nombre: metadata.nombre ?? dbData?.nombre ?? user.email?.split('@')[0] ?? 'Corredor',
    categoria: metadata.categoria ?? dbData?.categoria ?? undefined,
    edad: metadata.edad ? Number(metadata.edad) : (dbData?.edad ?? undefined),
    email: user.email ?? '',
    creadoEn: dbData?.creado_en ? new Date(dbData.creado_en).getTime() : Date.now(),
    fotoUrl: metadata.fotoUrl ?? undefined,
    avatarPreset: metadata.avatarPreset ?? undefined,
    fotoBiciUrl: metadata.fotoBiciUrl ?? undefined,
    pesoKg: metadata.pesoKg ? Number(metadata.pesoKg) : undefined,
    estaturaCm: dbData?.estatura_cm ?? metadata.estaturaCm ?? undefined,
    entrepiernaCm: dbData?.entrepierna_cm ?? metadata.entrepiernaCm ?? undefined,
    dientesPlato: dbData?.dientes_plato ?? metadata.dientesPlato ?? 44,
    dientesPinon: dbData?.dientes_pinon ?? metadata.dientesPinon ?? 16,
    rodadoRueda: dbData?.rodado_rueda ?? metadata.rodadoRueda ?? '20x1.75',
    tallaCuadro: dbData?.talla_cuadro ?? metadata.tallaCuadro ?? undefined,
    largoBielasMm: dbData?.largo_bielas_mm ?? metadata.largoBielasMm ?? 175,
    tipoPedales: dbData?.tipo_pedales ?? metadata.tipoPedales ?? undefined
  };

  guardarCorredorLocal(corredor);
  return corredor;
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

export async function iniciarSesion(email: string, password: string, recordar = true): Promise<Corredor> {
  establecerRecordar(recordar);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('No se pudo autenticar el usuario.');

  return await construirCorredorDesdeUser(data.user);
}

export async function cerrarSesion(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bmx_local_corredor');
  }
  try {
    await supabase.auth.signOut();
  } catch (e) {}
}

export async function obtenerCorredorActual(): Promise<Corredor | null> {
  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.user) return obtenerCorredorLocal();
      return await construirCorredorDesdeUser(session.user);
    }

    return await construirCorredorDesdeUser(user);
  } catch (err) {
    console.warn('Conexión con servidor interrumpida, cargando perfil local:', err);
    return obtenerCorredorLocal();
  }
}

export async function actualizarDatosCorredor(datos: Partial<Corredor>): Promise<void> {
  const corredorLocal = obtenerCorredorLocal();
  if (corredorLocal) {
    guardarCorredorLocal({ ...corredorLocal, ...datos });
  }

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.auth.updateUser({
      data: { ...user.user_metadata, ...datos }
    });

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
    // Si no hay red o la tabla no tiene las columnas adicionales, no bloquea la persistencia local
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
