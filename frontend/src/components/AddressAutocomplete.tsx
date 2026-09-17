import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, X } from "lucide-react";

export interface DireccionSugerida {
  direccion: string;
  calle?: string;
  numero?: string;
  ciudad?: string;
  region?: string;
  pais?: string;
  latitud?: number;
  longitud?: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (direccion: DireccionSugerida) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Escribe la dirección (ej. Av. Ecuador 123, Chillán)...",
  disabled = false,
  className = "",
}: AddressAutocompleteProps) {
  const [sugerencias, setSugerencias] = useState<DireccionSugerida[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar lista al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce para consultar /api/direcciones?q=...
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setSugerencias([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/direcciones?q=${encodeURIComponent(trimmed)}&limit=5`);
        if (!res.ok) {
          throw new Error("No se pudieron cargar sugerencias");
        }
        const data: DireccionSugerida[] = await res.json();
        setSugerencias(data);
        setIsOpen(data.length > 0);
      } catch (err: any) {
        console.error("Error al buscar direcciones:", err);
        setError("Error de conexión al buscar direcciones");
        setSugerencias([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [value]);

  const handleSelect = (item: DireccionSugerida) => {
    onChange(item.direccion);
    onSelect?.(item);
    setIsOpen(false);
    setSugerencias([]);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (sugerencias.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-8 h-9 text-sm bg-white"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 className="size-3.5 animate-spin text-slate-400" />}
          {value && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSugerencias([]);
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Menú flotante de sugerencias */}
      {isOpen && sugerencias.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg max-h-56 overflow-y-auto">
          {sugerencias.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="flex items-start gap-2.5 px-3 py-2 rounded-md text-xs hover:bg-slate-100 cursor-pointer transition-colors text-slate-700 hover:text-slate-900"
            >
              <MapPin className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex flex-col text-left">
                <span className="font-semibold text-slate-800">{item.direccion}</span>
                {(item.ciudad || item.region) && (
                  <span className="text-[11px] text-slate-500">
                    {[item.ciudad, item.region, item.pais].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && !loading && isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700 shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
}
