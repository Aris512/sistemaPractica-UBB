import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Contenedor principal de tabla unificada.
 * Proporciona un marco limpio con fondo blanco, bordes sutiles y scroll horizontal automático.
 */
export function UnifiedTableContainer({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full bg-white rounded-xl border border-slate-200/85 shadow-2xs overflow-hidden flex flex-col justify-between transition-all",
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
}

/**
 * Elemento table principal con espaciado consistente y ancho completo.
 */
export function UnifiedTable({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full text-left border-collapse", className)}
      {...props}
    />
  );
}

/**
 * Cabecera de la tabla.
 * Fondo blanco/limpio sin fondos grises pesados, delimitada por un borde inferior sutil.
 */
export function UnifiedTableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-slate-200 bg-white select-none", className)}
      {...props}
    />
  );
}

/**
 * Celda de encabezado de tabla.
 * Tipografía en Sentence Case, peso semi-bold nítido, color neutral suave.
 */
export function UnifiedTableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "py-3.5 px-4 sm:px-5 text-sm font-semibold text-slate-700 tracking-normal align-middle whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

/**
 * Cuerpo de la tabla con separadores sutiles entre filas.
 */
export function UnifiedTableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("divide-y divide-slate-100/90", className)}
      {...props}
    />
  );
}

/**
 * Fila de la tabla con espaciado vertical cómodo y efecto hover suave.
 */
export function UnifiedTableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "group transition-colors duration-150 hover:bg-slate-50/70 border-b border-slate-100/80 last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

/**
 * Celda de datos de la tabla.
 * Padding vertical cómodo (py-3.5 / py-4), alineación vertical centrada.
 */
export function UnifiedTableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "py-3.5 sm:py-4 px-4 sm:px-5 text-sm text-slate-800 align-middle",
        className
      )}
      {...props}
    />
  );
}
