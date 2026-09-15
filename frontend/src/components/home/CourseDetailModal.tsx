import type { CourseItem, ModalType } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, PenTool, Calendar, GraduationCap, Clock } from "lucide-react";

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseItem | null;
  modalType: ModalType | null;
}

export function CourseDetailModal({
  isOpen,
  onClose,
  course,
  modalType,
}: CourseDetailModalProps) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-white border border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-xl text-white ${
                modalType === "avisos"
                  ? "bg-[#e89100]"
                  : modalType === "actividades"
                  ? "bg-[#2596be]"
                  : modalType === "proximas"
                  ? "bg-[#008b8b]"
                  : "bg-emerald-600"
              }`}
            >
              {modalType === "avisos" && <Mail className="size-5" />}
              {modalType === "actividades" && <PenTool className="size-5" />}
              {modalType === "proximas" && <Calendar className="size-5" />}
              {modalType === "detalle" && <GraduationCap className="size-5" />}
            </div>
            <div>
              <DialogTitle className="text-slate-900 font-bold text-base">
                {modalType === "avisos" && "Avisos Publicados"}
                {modalType === "actividades" && "Actividades del Curso"}
                {modalType === "proximas" && "Actividades Próximas a Vencer"}
                {modalType === "detalle" && "Ficha de la Asignatura"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs truncate max-w-sm">
                {course.nombre} ({course.codigo})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-3 text-xs">
          {modalType === "avisos" && (
            <div className="space-y-2">
              {course.avisos > 0 ? (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">
                      Reunión de coordinación y entrega de pauta
                    </span>
                    <span className="text-[10px] text-amber-700">Publicado hoy</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    Estimados estudiantes, se ha publicado el cronograma correspondiente a la Unidad 2. Favor revisar en la pestaña de documentos.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500">
                  <Mail className="size-6 mx-auto mb-1.5 text-slate-400" />
                  <span>No hay avisos recientes publicados para este curso.</span>
                </div>
              )}
            </div>
          )}

          {modalType === "actividades" && (
            <div className="space-y-2">
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sky-950">Avance de Proyecto - Fase 1</div>
                  <div className="text-[11px] text-sky-700">Ponderación: 20% • Entrega digital</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-200/80 text-sky-900">
                  Disponible
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Foro de Discusión Metodológica</div>
                  <div className="text-[11px] text-slate-500">Participación obligatoria en aula virtual</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Abierto
                </span>
              </div>
            </div>
          )}

          {modalType === "proximas" && (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500">
              <Clock className="size-6 mx-auto mb-1.5 text-slate-400" />
              <span>No hay evaluaciones o entregas inmediatas fijadas para esta semana.</span>
            </div>
          )}

          {modalType === "detalle" && (
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Coordinador</span>
                  <p className="font-semibold text-slate-800">{course.coordinador}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Código de Curso</span>
                  <p className="font-semibold text-slate-800">{course.codigo}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Sede</span>
                  <p className="font-semibold text-slate-800">{course.sede}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Periodo</span>
                  <p className="font-semibold text-slate-800">{course.periodo}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
