import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Check, Layers } from "lucide-react";

interface SemestreSelectorProps {
  value: string; // "ALL" o "3,4,5,6,7,8,9,10"
  onChange: (newValue: string) => void;
}

const TODOS_SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function SemestreSelector({ value, onChange }: SemestreSelectorProps) {
  const isAll = !value || value.trim().toUpperCase() === "ALL";

  // Parsear semestres activos
  const selectedSemestres: number[] = isAll
    ? TODOS_SEMESTRES
    : value
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

  const [isOpen, setIsOpen] = useState(false);

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      onChange("ALL");
    } else {
      // Por defecto sugerir del 3 al 10 como caso de uso típico de IA
      onChange("3,4,5,6,7,8,9,10");
    }
  };

  const handleToggleSemestre = (sem: number) => {
    let nextList: number[];
    if (isAll) {
      // Si estaba en ALL y se desmarca uno, la lista es todos menos ese
      nextList = TODOS_SEMESTRES.filter((s) => s !== sem);
    } else {
      if (selectedSemestres.includes(sem)) {
        nextList = selectedSemestres.filter((s) => s !== sem);
      } else {
        nextList = [...selectedSemestres, sem].sort((a, b) => a - b);
      }
    }

    if (nextList.length === TODOS_SEMESTRES.length) {
      onChange("ALL");
    } else if (nextList.length === 0) {
      onChange("NONE");
    } else {
      onChange(nextList.join(","));
    }
  };

  const applyPreset = (presetList: number[]) => {
    if (presetList.length === TODOS_SEMESTRES.length) {
      onChange("ALL");
    } else {
      onChange(presetList.join(","));
    }
  };

  return (
    <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-sky-600" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Regla de semestres cursados:
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              isAll
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isAll ? "Todos los semestres" : `Semestres: ${value}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs text-sky-700 hover:text-sky-900 hover:bg-sky-50 h-7 px-2 cursor-pointer"
          >
            {isOpen ? "Ocultar selector" : "Personalizar semestres"}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200/80 space-y-3">
          {/* Switch Todos los Semestres */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Habilitar para todos los semestres
              </span>
              <p className="text-[11px] text-muted-foreground">
                Si está activo, cualquier estudiante cursando cualquier semestre tendrá acceso.
              </p>
            </div>
            <Switch
              checked={isAll}
              onCheckedChange={handleToggleAll}
              aria-label="Habilitar para todos los semestres"
            />
          </div>

          {/* Selector individual por semestre */}
          {!isAll && (
            <div className="space-y-2 pt-1 border-t border-slate-200/60">
              <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600 font-medium">
                <span>Selecciona los semestres que tendrán acceso:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPreset([3, 4, 5, 6, 7, 8, 9, 10])}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    3° al 10°
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([8, 9])}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    8° y 9° (Prácticas)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(TODOS_SEMESTRES)}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    Todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                {TODOS_SEMESTRES.map((sem) => {
                  const active = selectedSemestres.includes(sem);
                  return (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => handleToggleSemestre(sem)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-[10px] font-normal opacity-80">Sem</span>
                      <span className="text-sm font-bold leading-none">{sem}</span>
                      {active ? (
                        <Check className="size-3 mt-1" />
                      ) : (
                        <span className="size-3 mt-1 block" />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                <Sparkles className="size-3 text-amber-500 shrink-0" />
                Los estudiantes en semestres no seleccionados tendrán esta funcionalidad oculta automáticamente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
