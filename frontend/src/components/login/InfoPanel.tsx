function CurvedArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`w-5 h-5 shrink-0 ${className ?? ""}`}
      aria-hidden="true"
    >
      <path d="M14 4v4H7a5 5 0 0 0-5 5v5h3v-5a2 2 0 0 1 2-2h7v4l6-6-6-6z" />
    </svg>
  );
}

export function InfoPanel() {
  return (
    <div className="flex flex-col justify-center space-y-5 text-sm leading-relaxed select-text">
      <h1 className="text-3xl sm:text-4xl font-light text-[#c2185b] tracking-tight mb-2 pr-12 sm:pr-16">
        Bienvenid@ a la Plataforma de Practicas
      </h1>

      <div className="space-y-4 text-[13.5px] sm:text-[14px]">
        {/* Item 1: Verde */}
        <div className="flex items-start gap-3 text-slate-700">
          <CurvedArrow className="text-[#2e7d32] mt-0.5" />
          <p>
            El sistema de practica es una <strong className="font-semibold text-slate-900">Plataforma Educativa</strong> que tiene por finalidad prestar{" "}
            <strong className="font-semibold text-slate-900">servicios de apoyo a la docencia de Pregrado</strong>{" "}
            de la Universidad del Bío-Bío, favoreciendo la utilización de estrategias activas  para potenciar ambientes de trabajo durante sus practicas.
          </p>
        </div>

        {/* Item 2: Naranja */}
        <div className="flex items-start gap-3 text-slate-700">
          <CurvedArrow className="text-[#f57c00] mt-0.5" />
          <p>
            El diseño del sistema de practicas permite que estudiantes y profesores la utilicen fácilmente, dado que sus funcionalidades han sido configuradas en función de las{" "}
            <strong className="font-semibold text-slate-900">necesidades de estudiantes y profesores</strong>.
          </p>
        </div>

        {/* Item 3: Terracota / Rojizo */}
        <div className="flex items-start gap-3 text-slate-700">
          <CurvedArrow className="text-[#c62828] mt-0.5" />
          <p>
            El sistema de practicas es una plataforma en constante desarrollo, diseñada y{" "}
            <strong className="font-semibold text-slate-900">construida por Estudiantes de la Universidad del Bío-Bío</strong>
          </p>
        </div>


        {/* Item 5: Azul */}
        <div className="flex items-start gap-3 text-[#0288d1]">
          <CurvedArrow className="text-[#0288d1] mt-0.5" />
          <p>
            Para consultas o problemas con el sistema de practicas, contactenos al correo{" "}
            <a
              href="mailto:adecca@ubiobio.cl"
              className="font-bold underline hover:text-[#01579b] transition-colors"
            >
              correo@ubiobio.cl
            </a>{" "}
          </p>
        </div>
      </div>
    </div>
  );
}
