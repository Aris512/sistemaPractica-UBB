import { useState } from "react";
import escudoImg from "./logo/escudo.png";
import vEscudoImg from "./logo/v-escudo-color-gradiente.png";

export function UbbLogoBadge() {
  const [isHovered, setIsHovered] = useState(false);

  // Exact subpixel calibration:
  // Shield is 196w x 301h in both source files.
  // Displayed shield: 38px height, 24.74px width.
  // Vertically and horizontally centered within the 52px badge:
  // Badge height: 52px -> Shield top offset: 7px
  // Collapsed badge width: 52px -> Shield left offset: 13.6px
  // escudo.png: 242x324 -> h: 40.9px, w: 30.55px, top: -1.01px, left: -2.40px
  // v-escudo-color-gradiente.png: 1441x403 -> h: 50.88px, w: 181.9px, top: -6.44px, left: -11.61px

  return (
    <a
      href="https://www.ubiobio.cl"
      target="_blank"
      rel="noopener noreferrer"
      title="Universidad del Bío-Bío - ubiobio.cl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center h-[52px] rounded-2xl bg-white/95 backdrop-blur-xs transition-all duration-350 ease-out select-none cursor-pointer overflow-hidden border border-slate-200/80 shadow-[4px_4px_10px_rgba(160,175,192,0.32),-3px_-3px_8px_rgba(255,255,255,0.95)] hover:shadow-[6px_6px_14px_rgba(160,175,192,0.42),-4px_-4px_10px_rgba(255,255,255,1)] ${
        isHovered ? "w-[214px]" : "w-[52px]"
      }`}
      aria-label="Universidad del Bío-Bío"
    >
      <div className="relative w-full h-[52px]">
        {/* Shield Container: Positioned identically for both images */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: "7px",
            left: "13.6px",
            width: "25px",
            height: "38px",
          }}
        >
          {/* Default Escudo Image */}
          <img
            src={escudoImg}
            alt="Escudo Universidad del Bío-Bío"
            className={`absolute transition-opacity duration-300 ease-out pointer-events-none ${
              isHovered ? "opacity-0" : "opacity-100"
            }`}
            style={{
              height: "40.9px",
              width: "30.55px",
              maxWidth: "none",
              top: "-1.01px",
              left: "-2.40px",
            }}
          />
        </div>

        {/* Hovered Expanded Full Logo: Shield + Text */}
        <div
          className={`absolute overflow-hidden transition-opacity duration-300 ease-out pointer-events-none ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: "7px",
            left: "13.6px",
            width: "185px",
            height: "38px",
          }}
        >
          <img
            src={vEscudoImg}
            alt="Universidad del Bío-Bío"
            className="absolute pointer-events-none"
            style={{
              height: "50.88px",
              width: "181.9px",
              maxWidth: "none",
              top: "-6.44px",
              left: "-11.61px",
            }}
          />
        </div>
      </div>
    </a>
  );
}
