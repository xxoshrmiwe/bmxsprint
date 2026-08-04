export interface SampleCrudo {
  t: number;             // performance.now()
  ax: number; ay: number; az: number;     // e.acceleration (fused 3D linear)
  gx: number; gy: number; gz: number;     // e.accelerationIncludingGravity
  rx: number; ry: number; rz: number;     // e.rotationRate (gyroscope)
  interval: number;      // e.interval (hardware sample interval in ms)
  src: 'fused' | 'lowpass';
}

export interface GpsSampleCrudo {
  t: number;             // performance.now() al recibir
  tFix: number;          // pos.timestamp del chip GNSS
  speed: number | null;  // coords.speed en m/s (Doppler)
  accuracy: number;      // coords.accuracy en metros
  lat: number;
  lon: number;
}

export interface RunCrudo {
  id: string;
  corredorId: string;
  distanciaMetros: number;
  fecha: number;
  muestras: SampleCrudo[];
  gps: GpsSampleCrudo[];
}

const DB_NAME = 'gateright_telemetry_db';
const DB_VERSION = 1;
const STORE_NAME = 'raw_runs';

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no soportado en este entorno'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function guardarRunCrudo(run: RunCrudo): Promise<void> {
  try {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(run);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error guardando telemetría cruda en IndexedDB:', err);
  }
}

export async function obtenerRunCrudo(id: string): Promise<RunCrudo | null> {
  try {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error leyendo telemetría cruda de IndexedDB:', err);
    return null;
  }
}

export function convertirRunACSV(run: RunCrudo): string {
  const lineas: string[] = [];
  // Cabecera CSV
  lineas.push(
    't_ms,ax,ay,az,gx,gy,gz,rx,ry,rz,interval_ms,src,gps_tFix,gps_speed_ms,gps_accuracy_m,gps_lat,gps_lon'
  );

  const total = Math.max(run.muestras.length, run.gps.length);
  for (let i = 0; i < total; i++) {
    const m = run.muestras[i] || {};
    const g = run.gps[i] || {};

    const fila = [
      m.t !== undefined ? m.t.toFixed(1) : '',
      m.ax !== undefined ? m.ax.toFixed(3) : '',
      m.ay !== undefined ? m.ay.toFixed(3) : '',
      m.az !== undefined ? m.az.toFixed(3) : '',
      m.gx !== undefined ? m.gx.toFixed(3) : '',
      m.gy !== undefined ? m.gy.toFixed(3) : '',
      m.gz !== undefined ? m.gz.toFixed(3) : '',
      m.rx !== undefined ? m.rx.toFixed(3) : '',
      m.ry !== undefined ? m.ry.toFixed(3) : '',
      m.rz !== undefined ? m.rz.toFixed(3) : '',
      m.interval !== undefined ? m.interval.toFixed(1) : '',
      m.src || '',
      g.tFix !== undefined ? g.tFix : '',
      g.speed !== undefined && g.speed !== null ? g.speed.toFixed(3) : '',
      g.accuracy !== undefined ? g.accuracy.toFixed(1) : '',
      g.lat !== undefined ? g.lat.toFixed(6) : '',
      g.lon !== undefined ? g.lon.toFixed(6) : ''
    ];

    lineas.push(fila.join(','));
  }

  return lineas.join('\n');
}

export async function exportarRunCSV(run: RunCrudo): Promise<void> {
  const csvText = convertirRunACSV(run);
  const fileName = `bmx_sprint_${run.distanciaMetros}m_${new Date(run.fecha).toISOString().slice(0, 19).replace(/[:T]/g, '_')}.csv`;
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const file = new File([blob], fileName, { type: 'text/csv' });

  // Web Share API (Safari iOS PWA Standalone y navegadores móviles)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Telemetría BMX Sprint ${run.distanciaMetros}m`,
        text: `Datos crudos de telemetría capturados a 60Hz el ${new Date(run.fecha).toLocaleString()}`,
        files: [file]
      });
      return;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('Error al compartir con Web Share API, reintentando con descarga directa:', err);
      } else {
        return;
      }
    }
  }

  // Fallback tradicional <a download>
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
