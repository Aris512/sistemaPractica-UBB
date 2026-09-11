export function InstitutionalFooter() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 select-none">
      {/* Panel 1: Universidad del Bío-Bío */}
      <div className="neu-inset-panel px-3 py-2.5 flex items-center gap-3">
        {/* UBB Shield Vector */}
        <div className="w-12 h-14 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 120" className="w-full h-full text-slate-500 opacity-80">
            {/* Outer Shield Outline */}
            <path
              d="M10 10 H90 V65 C90 95 50 115 50 115 C50 115 10 95 10 65 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
            />
            {/* Horizontal Line */}
            <line x1="10" y1="40" x2="90" y2="40" stroke="currentColor" strokeWidth="4" />
            
            {/* Top Section: Alpha and Omega */}
            <text
              x="30"
              y="32"
              textAnchor="middle"
              fontSize="24"
              fontWeight="bold"
              fill="currentColor"
              fontFamily="serif"
            >
              Α
            </text>
            <text
              x="70"
              y="32"
              textAnchor="middle"
              fontSize="24"
              fontWeight="bold"
              fill="currentColor"
              fontFamily="serif"
            >
              Ω
            </text>

            {/* Bottom Section: Sun rays / Open book / Waves */}
            <circle cx="50" cy="58" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M50 48 V42 M50 68 V74 M38 58 H32 M62 58 H68" stroke="currentColor" strokeWidth="3" />
            {/* Stars */}
            <circle cx="30" cy="78" r="3" fill="currentColor" />
            <circle cx="70" cy="78" r="3" fill="currentColor" />
            <circle cx="50" cy="95" r="3.5" fill="currentColor" />
            {/* Waves */}
            <path
              d="M25 88 Q37 84 50 88 T75 88"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col leading-tight">
          <span className="text-xs md:text-sm font-bold tracking-tight text-slate-700 uppercase font-sans">
            UNIVERSIDAD DEL BÍO-BÍO
          </span>
          <span className="text-[10px] md:text-[11px] text-slate-500 font-sans">
            La Universidad de la Región del Biobío
          </span>
        </div>
      </div>

      {/* Panel 2: CNA Acreditación */}
      <div className="neu-inset-panel px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* CNA Mark */}
          <div className="flex flex-col items-center justify-center">
            <svg viewBox="0 0 40 30" className="w-7 h-6 text-slate-700">
              <path
                d="M5 25 L18 5 L23 14 L17 25 Z"
                fill="currentColor"
              />
              <path
                d="M22 25 L28 14 L35 25 Z"
                fill="#475569"
              />
            </svg>
            <span className="text-[7px] text-center font-bold text-slate-600 leading-none">
              Comisión Nacional<br />de Acreditación<br />CNA-Chile
            </span>
          </div>

          {/* 5 Años */}
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-800 leading-none">5</span>
            <div className="text-[10px] leading-tight text-slate-700 font-medium">
              <div>años</div>
              <div className="font-bold">Acreditada</div>
              <div className="text-[8px] text-slate-500">Hasta agosto 2029</div>
            </div>
          </div>
        </div>

        {/* Areas list */}
        <div className="border-l border-slate-300 pl-2 text-[7.5px] leading-tight text-slate-600 font-medium hidden sm:block">
          <div className="font-bold text-slate-800">EN TODAS LAS ÁREAS</div>
          <div>Gestión Institucional</div>
          <div>Docencia de Pregrado</div>
          <div>Docencia de Postgrado</div>
          <div>Investigación</div>
          <div>Vinculación con el Medio</div>
        </div>
      </div>
    </div>
  );
}
