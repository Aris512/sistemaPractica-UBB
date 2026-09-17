interface SemestreSelectorProps {
  value: string; // "ALL" o "3,4,5,6,7,8,9,10"
  onChange: (newValue: string) => void;
}

const TODOS_SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getSemestresLabel(value: string, isAll: boolean): string {
  if (isAll) return "Todos los semestres";
  if (!value || value === "NONE") return "Sin semestres";

  const nums = value
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (nums.length === 0) return "Sin semestres";
  if (nums.length === TODOS_SEMESTRES.length) return "Todos los semestres";

  // Verificar si es un rango continuo (ej. 3 al 10)
  const isConsecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  if (isConsecutive && nums.length > 2) {
    return `${nums[0]}° al ${nums[nums.length - 1]}° semestre`;
  }

  return `Sem. ${nums.join(", ")}`;
}

export function SemestreSelector({ value, onChange }: SemestreSelectorProps) {
  const isAll = !value || value.trim().toUpperCase() === "ALL";

  // Parsear semestres activos
  const selectedSemestres: number[] = isAll
    ? TODOS_SEMESTRES
    : value
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

  const handleToggleAll = () => {
    onChange("ALL");
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

  return (
    <div className="pt-2 pl-7 space-y-1.5 select-none">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">
          Seleccionar semestres:
        </span>
        {!isAll && (
          <span className="text-[11px] text-slate-400 font-normal">
            ({getSemestresLabel(value, isAll)})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Contenedor segmentado unificado que no se rompe */}
        <div className="inline-flex items-center rounded-lg bg-slate-100/90 p-1 border border-slate-200/80 gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleAll}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              isAll
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
            title="Permitir para todos los semestres"
          >
            Todos
          </button>

          <div className="w-px h-4 bg-slate-300/70 mx-0.5" />

          <div className="flex items-center gap-0.5">
            {TODOS_SEMESTRES.map((sem) => {
              const isSelected = selectedSemestres.includes(sem);
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => handleToggleSemestre(sem)}
                  className={`size-6 rounded-md text-[11px] font-medium transition-all flex items-center justify-center cursor-pointer ${
                    !isAll && isSelected
                      ? "bg-slate-900 text-white shadow-2xs font-semibold"
                      : isAll
                      ? "bg-white text-slate-800 shadow-2xs hover:bg-slate-50"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                  }`}
                  title={`Semestre ${sem}`}
                >
                  {sem}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
