export function AdeccaLogo() {
  return (
    <div className="flex items-center gap-3 select-none">
      <div>
        <div className="flex items-baseline">
          <span className="text-4xl md:text-[42px] font-medium tracking-tight text-slate-700 font-sans">
            Adecca
          </span>
        </div>
        <p className="text-xs italic text-slate-800 -mt-1 font-sans">
          Plataforma de educación en línea
        </p>
      </div>

      {/* Orbiting Satellite Dots Icon */}
      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          {/* Central Ring */}
          <circle
            cx="50"
            cy="50"
            r="19"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="4"
            className="filter drop-shadow"
          />
          <circle
            cx="50"
            cy="50"
            r="13"
            fill="#cbd5e1"
            className="opacity-80"
          />

          {/* Spokes to satellites */}
          <line x1="50" y1="50" x2="50" y2="17" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="50" y1="50" x2="80" y2="28" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="50" y1="50" x2="82" y2="65" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="50" y1="50" x2="50" y2="84" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="50" y1="50" x2="21" y2="68" stroke="#94a3b8" strokeWidth="2.5" />
          <line x1="50" y1="50" x2="22" y2="32" stroke="#94a3b8" strokeWidth="2.5" />

          {/* Orbiting Spherical Nodes (3D gradient balls) */}
          {/* Top cyan */}
          <circle cx="50" cy="16" r="6" fill="#0284c7" />
          <circle cx="48" cy="14" r="2" fill="#bae6fd" />

          {/* Top-Right magenta */}
          <circle cx="80" cy="28" r="6.5" fill="#9d174d" />
          <circle cx="78" cy="26" r="2" fill="#fbcfe8" />

          {/* Right pink/rose */}
          <circle cx="82" cy="65" r="7" fill="#e11d48" />
          <circle cx="80" cy="63" r="2.5" fill="#fecdd3" />

          {/* Bottom green */}
          <circle cx="50" cy="84" r="6" fill="#10b981" />
          <circle cx="48" cy="82" r="2" fill="#a7f3d0" />

          {/* Bottom-left orange */}
          <circle cx="21" cy="68" r="6.5" fill="#ea580c" />
          <circle cx="19" cy="66" r="2" fill="#ffedd5" />

          {/* Top-left silver/purple */}
          <circle cx="22" cy="32" r="5.5" fill="#8b5cf6" />
          <circle cx="20" cy="30" r="1.8" fill="#ddd6fe" />
        </svg>
      </div>
    </div>
  );
}
