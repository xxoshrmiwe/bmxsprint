export interface ClipGate {
  id: string;
  url: string;
  nombre: string;
  categoria: 'uci' | 'espanol' | 'standard';
}

const modulos = import.meta.glob('/src/assets/gate/*.{mp3,wav,ogg,m4a}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

export function listarClipsGate(): ClipGate[] {
  return Object.entries(modulos).map(([ruta, item]) => {
    const nombre = ruta.split('/').pop() ?? ruta;
    const url = typeof item === 'string' ? item : (item as any)?.src || (item as any)?.default || String(item);
    const lower = nombre.toLowerCase();
    let categoria: 'uci' | 'espanol' | 'standard' = 'standard';
    if (lower.includes('uci') || lower.includes('english') || lower.includes('watch')) {
      categoria = 'uci';
    } else if (lower.includes('espanol') || lower.includes('atentos')) {
      categoria = 'espanol';
    }
    return { id: nombre, url, nombre, categoria };
  });
}

export function elegirClipAleatorio(modo?: string): ClipGate {
  const clips = listarClipsGate();
  if (clips.length === 0) {
    throw new Error(
      'No hay audios de salida en src/assets/gate. Agrega al menos un archivo .mp3/.wav/.ogg antes de iniciar un sprint.'
    );
  }

  if (modo && modo !== 'aleatorio') {
    const filtrados = clips.filter((c) => c.categoria === modo || c.id.toLowerCase().includes(modo.toLowerCase()));
    if (filtrados.length > 0) {
      const idx = Math.floor(Math.random() * filtrados.length);
      return filtrados[idx];
    }
  }

  const indice = Math.floor(Math.random() * clips.length);
  return clips[indice];
}
