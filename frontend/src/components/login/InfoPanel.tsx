interface CurvedArrowProps {
  color: string;
}

function CurvedArrow({ color }: CurvedArrowProps) {
  return (
    <div className="shrink-0 mt-0.5">
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 18c0-5 3-9 9-9h7" />
        <polyline points="16 5 20 9 16 13" fill={color} />
      </svg>
    </div>
  );
}

export function InfoPanel() {
  return (
    <div className="flex flex-col justify-between h-full py-1 text-slate-700 text-xs md:text-[13px] leading-relaxed">
      <div>
        {/* Main Welcome Heading */}
        <h2 className="text-2xl md:text-[28px] font-medium tracking-tight text-[#b8144c] mb-4">
          Bienvenid@ a la Plataforma Adecca
        </h2>

        {/* Feature List with Colored Curved Arrows */}
        <div className="space-y-3 text-slate-700">
          {/* Point 1: Green */}
          <div className="flex items-start gap-2">
            <CurvedArrow color="#16a34a" />
            <p>
              <strong className="font-semibold text-slate-800">Adecca</strong> es una Plataforma Educativa que tiene por finalidad prestar servicios de apoyo a la docencia de Pregrado y Postgrado de la Universidad del Bío-Bío, favoreciendo la utilización de estrategias activas de enseñanza, para potenciar ambientes de trabajo colaborativos.
            </p>
          </div>

          {/* Point 2: Orange */}
          <div className="flex items-start gap-2">
            <CurvedArrow color="#ea580c" />
            <p>
              El diseño de Adecca permite que estudiantes y profesores la utilicen fácilmente, dado que sus funcionalidades han sido configuradas en función de las necesidades de estudiantes y profesores.
            </p>
          </div>

          {/* Point 3: Red */}
          <div className="flex items-start gap-2">
            <CurvedArrow color="#dc2626" />
            <p>
              Adecca es una plataforma en constante diseño, construida en la Universidad del Bío-Bío, por lo cual invitamos a estudiantes y profesores a enviar comentarios y sugerencias, a objeto de continuar ofreciéndoles un servicio de calidad.
            </p>
          </div>

          {/* Point 4: Magenta highlight */}
          <div className="flex items-start gap-2 text-[#b8144c] font-medium">
            <CurvedArrow color="#b8144c" />
            <p>
              Se recomienda el uso de navegadores estándares, como Google Chrome y Mozilla Firefox para un correcto funcionamiento. Por favor evite el uso de navegadores obsoletos.
            </p>
          </div>

          {/* Point 5: Cyan/Blue */}
          <div className="flex items-start gap-2">
            <CurvedArrow color="#0284c7" />
            <p>
              Para consultas o problemas con la Plataforma Adecca, por favor escríbanos al correo{" "}
              <a
                href="mailto:adecca@ubiobio.cl"
                className="text-sky-700 hover:text-sky-800 underline font-medium"
              >
                adecca@ubiobio.cl
              </a>{" "}
              o contáctenos al teléfono <span className="font-medium text-slate-800">(56-42)2463300</span> (Mesa de Ayuda).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
