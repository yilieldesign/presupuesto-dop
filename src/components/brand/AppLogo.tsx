interface AppLogoProps {
  size?: number;
  className?: string;
}

/** Logo en pantalla (misma marca que el icono PWA). */
export function AppLogo({ size = 56, className = "" }: AppLogoProps) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#007aff] via-[#0056d6] to-[#0040a8] shadow-sm ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="44"
          y="88"
          width="168"
          height="128"
          rx="28"
          fill="white"
          fillOpacity="0.96"
        />
        <path
          d="M44 108c0-11 9-20 20-20h128c11 0 20 9 20 20v12H44V108z"
          fill="white"
          fillOpacity="0.82"
        />
        <circle cx="188" cy="152" r="14" fill="#007aff" />
        <circle cx="188" cy="152" r="6" fill="white" fillOpacity="0.9" />
        <rect x="72" y="168" width="28" height="36" rx="8" fill="#ff9500" />
        <rect x="108" y="148" width="28" height="56" rx="8" fill="#34c759" />
        <rect x="144" y="128" width="28" height="76" rx="8" fill="#007aff" />
        <path
          d="M68 132l36 18 32-28 44 36"
          stroke="#007aff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
        />
      </svg>
    </div>
  );
}
