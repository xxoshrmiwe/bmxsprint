import { useState } from 'react';

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  required?: boolean;
  autoComplete?: string;
}

export default function CampoPassword({ id, value, onChange, autoFocus, required, autoComplete }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 focus:border-slate-500 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6 0-10-6-10-8a13.16 13.16 0 0 1 3.06-4.06M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 6 10 8a13.35 13.35 0 0 1-1.67 2.68M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
