export interface ClipGate {
  id: string;
  url: string;
  nombre: string;
}

const modulos = import.meta.glob('/src/assets/gate/*.{mp3,wav,ogg,m4a}', {
  eager: true,
  import: 'default'
}) as Record<string, string>;

export function listarClipsGate(): ClipGate[] {
  return Object.entries(modulos).map(([ruta, url]) => {
    const nombre = ruta.split('/').pop() ?? ruta;
    return { id: nombre, url, nombre };
  });
}

export function elegirClipAleatorio(): ClipGate {
  const clips = listarClipsGate();
  if (clips.length === 0) {
    throw new Error(
      'No hay audios de salida en src/assets/gate. Agrega al menos un archivo .mp3/.wav/.ogg antes de iniciar un sprint.'
    );
  }
  const indice = Math.floor(Math.random() * clips.length);
  return clips[indice];
}
