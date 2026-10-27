import { Fragment, type ReactNode } from "react";

/**
 * Renderizador de Markdown acotado para las respuestas de la IA: títulos, párrafos, listas,
 * citas, bloques de código, tablas, negrita, cursiva, código en línea y enlaces http(s).
 * Construye elementos React (nunca HTML crudo), por lo que el contenido no puede inyectar marcado.
 */
export function MarkdownTexto({ texto }: { texto: string }) {
  return <div className="space-y-3 text-sm leading-relaxed break-words">{renderBloques(texto)}</div>;
}

const RE_LISTA_ORDENADA = /^\s*(\d+)[.)]\s+(.*)$/;
const RE_LISTA = /^\s*[-*+]\s+(.*)$/;
const RE_TITULO = /^(#{1,6})\s+(.*)$/;
const RE_FILA_SEPARADORA = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function renderBloques(texto: string): ReactNode[] {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const bloques: ReactNode[] = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    if (linea.trim() === "") {
      i++;
      continue;
    }

    // Bloque de código ```lang
    if (linea.trim().startsWith("```")) {
      const codigo: string[] = [];
      i++;
      while (i < lineas.length && !lineas[i].trim().startsWith("```")) {
        codigo.push(lineas[i]);
        i++;
      }
      i++;
      bloques.push(
        <pre key={bloques.length} className="overflow-x-auto rounded-lg bg-slate-900 text-slate-100 p-3 text-xs leading-relaxed">
          <code>{codigo.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const titulo = RE_TITULO.exec(linea);
    if (titulo) {
      const nivel = titulo[1].length;
      const clase = nivel <= 2 ? "text-base font-bold text-slate-900" : "text-sm font-bold text-slate-900";
      bloques.push(
        <p key={bloques.length} className={clase} role="heading" aria-level={nivel}>
          {renderEnLinea(titulo[2])}
        </p>
      );
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(linea)) {
      bloques.push(<hr key={bloques.length} className="border-slate-200" />);
      i++;
      continue;
    }

    // Tabla: fila de cabecera seguida de una fila separadora |---|---|
    if (linea.includes("|") && i + 1 < lineas.length && RE_FILA_SEPARADORA.test(lineas[i + 1])) {
      const cabecera = celdas(linea);
      const filas: string[][] = [];
      i += 2;
      while (i < lineas.length && lineas[i].includes("|") && lineas[i].trim() !== "") {
        filas.push(celdas(lineas[i]));
        i++;
      }
      bloques.push(
        <div key={bloques.length} className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                {cabecera.map((c, k) => (
                  <th key={k} className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">
                    {renderEnLinea(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, f) => (
                <tr key={f} className="border-b border-slate-100 last:border-0">
                  {fila.map((c, k) => (
                    <td key={k} className="px-3 py-2 align-top text-slate-700">
                      {renderEnLinea(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (RE_LISTA.test(linea) || RE_LISTA_ORDENADA.test(linea)) {
      const ordenada = RE_LISTA_ORDENADA.test(linea);
      const items: string[] = [];
      while (i < lineas.length) {
        const actual = lineas[i];
        const m = ordenada ? RE_LISTA_ORDENADA.exec(actual) : RE_LISTA.exec(actual);
        if (m) {
          items.push(ordenada ? m[2] : m[1]);
        } else if (actual.trim() !== "" && /^\s{2,}/.test(actual) && items.length > 0) {
          // Continuación indentada del ítem anterior
          items[items.length - 1] += "\n" + actual.trim();
        } else {
          break;
        }
        i++;
      }
      const Lista = ordenada ? "ol" : "ul";
      bloques.push(
        <Lista key={bloques.length} className={`${ordenada ? "list-decimal" : "list-disc"} pl-5 space-y-1`}>
          {items.map((item, k) => (
            <li key={k} className="whitespace-pre-line">{renderEnLinea(item)}</li>
          ))}
        </Lista>
      );
      continue;
    }

    if (linea.trimStart().startsWith(">")) {
      const cita: string[] = [];
      while (i < lineas.length && lineas[i].trimStart().startsWith(">")) {
        cita.push(lineas[i].trimStart().replace(/^>\s?/, ""));
        i++;
      }
      bloques.push(
        <blockquote key={bloques.length} className="border-l-3 border-sky-200 pl-3 text-slate-600 whitespace-pre-line">
          {renderEnLinea(cita.join("\n"))}
        </blockquote>
      );
      continue;
    }

    // Párrafo: líneas consecutivas hasta una línea vacía o el inicio de otro bloque
    const parrafo: string[] = [];
    while (
      i < lineas.length &&
      lineas[i].trim() !== "" &&
      !lineas[i].trim().startsWith("```") &&
      !RE_TITULO.test(lineas[i]) &&
      !RE_LISTA.test(lineas[i]) &&
      !RE_LISTA_ORDENADA.test(lineas[i])
    ) {
      parrafo.push(lineas[i]);
      i++;
    }
    bloques.push(
      <p key={bloques.length} className="whitespace-pre-line">
        {renderEnLinea(parrafo.join("\n"))}
      </p>
    );
  }

  return bloques;
}

function celdas(fila: string): string[] {
  return fila.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

const RE_EN_LINEA = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))|(<br\s*\/?>)/g;

function renderEnLinea(texto: string): ReactNode {
  const partes: ReactNode[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null;
  RE_EN_LINEA.lastIndex = 0;

  while ((m = RE_EN_LINEA.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    const token = m[0];
    const key = partes.length;

    if (m[1]) {
      partes.push(
        <code key={key} className="rounded bg-slate-100 px-1 py-0.5 text-[0.8em] font-mono text-slate-800">
          {token.slice(1, -1)}
        </code>
      );
    } else if (m[2] || m[3]) {
      partes.push(<strong key={key} className="font-semibold text-slate-900">{token.slice(2, -2)}</strong>);
    } else if (m[4]) {
      partes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (m[5]) {
      const enlace = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(token);
      partes.push(
        enlace ? (
          <a key={key} href={enlace[2]} target="_blank" rel="noopener noreferrer" className="text-sky-700 underline underline-offset-2">
            {enlace[1]}
          </a>
        ) : (
          token
        )
      );
    } else {
      partes.push("\n");
    }
    ultimo = m.index + token.length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));

  return partes.map((p, k) => <Fragment key={k}>{p}</Fragment>);
}
