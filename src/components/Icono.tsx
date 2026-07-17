interface Props {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function IconoRayo({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

export function IconoReloj({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6M12 2v2" />
    </svg>
  );
}

export function IconoRegla({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="8" width="18" height="8" rx="1.5" transform="rotate(-8 12 12)" />
      <path d="M7 9.5 6.6 12M11 9 10.5 12.3M15 8.6 14.6 12" transform="rotate(-8 12 12)" />
    </svg>
  );
}

export function IconoLlama({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 22c4 0 6-2.7 6-6 0-3-2-5-3-7 0 2-1.3 3-2.2 2.3.6-2.3-.3-4.6-2.3-6.3-.3 2.3-1.2 3.7-2.7 5.2C6.3 11.6 6 13 6 15c0 3.5 2.5 7 6 7Z" />
    </svg>
  );
}

export function IconoGrafico({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

export function IconoCerrar({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function IconoDescarga({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function IconoSubida({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21V9m0 0 4 4m-4-4-4 4M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function IconoAlerta({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

export function IconoCheck({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function IconoBuscar({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconoObjetivo({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconoFlechaArriba({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

export function IconoFlechaAbajo({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

export function IconoX({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconoBombilla({ className }: Props) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0 0 12 2Z" />
    </svg>
  );
}
