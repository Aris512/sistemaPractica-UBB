# Guía de uso del Sistema de Prácticas UBB

Manual paso a paso: qué hace cada rol, dónde está cada opción y cómo se usa. Pensado para recorrer la plataforma y probar cada función.

> Las credenciales de esta guía son **solo para el entorno local de pruebas**.

## Contenido

1. [Antes de empezar](#1-antes-de-empezar)
2. [Estudiante regular (4.° a 7.°)](#2-estudiante-regular-4-a-7-semestre)
3. [Estudiante en práctica (8.° y 9.°)](#3-estudiante-en-práctica-8-y-9-semestre)
4. [Profesor de asignatura](#4-profesor-de-asignatura)
5. [Profesor colaborador y tutor](#5-profesor-colaborador-y-tutor-de-práctica)
6. [Coordinador](#6-coordinador)
7. [Administrador](#7-administrador)
8. [Flujos completos entre roles](#8-flujos-completos-entre-roles)
9. [Usuarios de prueba](#9-usuarios-de-prueba)
10. [Preguntas frecuentes](#10-preguntas-frecuentes)

---

## 1. Antes de empezar

### 1.1 Cómo ingresar

1. Abre `http://localhost:5173/`.
2. Escribe tu **RUT sin puntos y con guion** (ej. `23400101-9`) y tu contraseña.
3. Presiona **Ingresar con RUT**.
4. El sistema abre automáticamente la vista de tu rol. Para salir, usa **Cerrar Sesión** abajo a la izquierda.

El panel de administración está en `http://localhost:5173/admin` y usa las credenciales definidas en `.env`.

### 1.2 Partes de la pantalla

- **Menú lateral (izquierda)**: las secciones de tu rol. Solo aparecen las que tus permisos habilitan.
- **Cabecera (arriba)**: fecha y tu nombre. Al hacer clic en tu nombre abres tu **Perfil**.
- **Contenido (centro)**: la sección elegida. Casi todas tienen un botón **Volver al Inicio**.
- **Avisos**: aparecen arriba al centro (verde = éxito, rojo = error).
- Toda acción de eliminar pide confirmación en una ventana.

### 1.3 Semestres y vistas

| Semestre | Asignatura | Vista |
|---|---|---|
| 4.° | Curriculum Educacional | Estudiante regular |
| 5.° | Ambientes de Aprendizaje | Estudiante regular |
| 6.° | Trabajo Colaborativo en Aula | Estudiante regular |
| 7.° | Investigación en Aula | Estudiante regular |
| 8.° | Práctica Pedagógica | Estudiante en práctica |
| 9.° | Práctica Profesional | Estudiante en práctica |

---

## 2. Estudiante regular (4.° a 7.° semestre)

Menú: **Inicio · Portafolio · Evaluaciones · Observaciones · Asistentes de IA**

### 2.1 Ver mi resumen (Inicio)

- Muestra tu asignatura actual, tareas pendientes y tu **avance académico** en la malla curricular.
- Una asignatura aparece como **aprobada** solo cuando el profesor te puso una nota aprobatoria.

### 2.2 Subir una tarea (Portafolio)

1. Entra a **Portafolio**.
2. Verás las **actividades** que creó tu profesor, con su **fecha límite**.
3. En la actividad, presiona el botón para **subir archivo** (o arrastra el archivo).
4. Elige el archivo (PDF, Word, Excel, imágenes o ZIP) y confirma.
5. La entrega queda como **Entregada / En revisión** hasta que el profesor la califique.

Importante:
- Si el **plazo venció**, el sistema no te deja subir.
- Puedes reemplazar o eliminar tu archivo mientras la actividad esté vigente y no esté calificada.
- En tu portafolio **no** aparecen los archivos que sube el profesor.

### 2.3 Ver mi nota (Evaluaciones)

1. Entra a **Evaluaciones**.
2. Cada actividad muestra su estado: **Pendiente**, **En revisión** o **Calificada**, y la **nota** (1,0 a 7,0).
3. Si el profesor adjuntó un archivo de corrección, puedes descargarlo desde ahí.

### 2.4 Dónde llega una observación (Observaciones)

1. Cuando el profesor califica, puede escribir una **observación pedagógica** o dejar una **nota de voz**.
2. Entra a **Observaciones** para leer los comentarios de cada actividad.
3. Si hay nota de voz, puedes **escucharla** y leer su **transcripción**.

### 2.5 Usar el Asistente de IA

1. Entra a **Asistentes de IA**.
2. Escribe tu pregunta y presiona enviar.
3. Tus conversaciones quedan guardadas en el historial; puedes abrir una anterior o borrarla.

### 2.6 Mi Perfil

- Clic en tu nombre (arriba a la derecha).
- Muestra tus datos, la **línea de progreso** de la práctica y el **historial de actividades** completadas.

---

## 3. Estudiante en práctica (8.° y 9.° semestre)

Menú: **Inicio · Portafolio · Planificación · Retroalimentación · Mis Pautas · Asistentes de IA · Equipo de Práctica**

### 3.1 Seguir mi práctica (Inicio – línea de tiempo)

La línea de tiempo avanza sola con datos reales:

| Etapa | Se completa cuando… |
|---|---|
| **Inscripción** | El coordinador te asoció a una práctica. |
| **Inicio** | Tienes centro, tutor y profesor colaborador. Si falta uno, dice "Falta X". |
| **Seguimiento** | Avanza con las evaluaciones: "X de 6 evaluaciones". |
| **Evaluación final** | Están las 6 evaluaciones; muestra tu **promedio**. |

Abajo verás tus **pendientes** (tareas sin entregar y aún en plazo) y la **actividad reciente** (entregas, revisiones y evaluaciones).

### 3.2 Subir una planificación (Planificación)

1. Entra a **Planificación** y presiona **Nueva planificación**.
2. Presiona **Subir archivos**.
3. Elige uno o varios archivos y, para cada uno, selecciona su **categoría**:
   - Planificación (PDF/Word)
   - Presentación (PowerPoint/PDF)
   - Guía de actividades (PDF/Word)
   - Rúbrica de evaluación (PDF/Word/Excel)
   - Material didáctico (varios formatos)
4. Confirma. Puedes subir solo algunos: la planificación queda **INCOMPLETA** y muestra "Pendiente de subir: …".
5. Cuando estén los 5, queda **COMPLETA**.
6. En la tabla puedes **descargar** o **eliminar** cada archivo, y subir uno nuevo para reemplazarlo.

### 3.3 Pedir retroalimentación a la IA (Retroalimentación)

1. Entra a **Retroalimentación** y elige tu planificación.
2. La IA lee los archivos y responde en tres partes: **Qué contiene / Qué falta / Qué hacer**.
3. Para enviar una versión corregida, usa el botón **+**, adjunta el archivo y escribe un mensaje si quieres.
4. Tu profesor de asignatura puede ver esta conversación.

### 3.4 Ver mis evaluaciones de práctica (Mis Pautas)

- Muestra las **pautas finalizadas** por tu profesor colaborador o tutor: puntaje por indicador, nota y observaciones.
- Las pautas en borrador no aparecen hasta que el evaluador las finaliza.

### 3.5 Ver mi equipo (Equipo de Práctica)

- Muestra tu **centro de práctica**, dirección, **tutor** y **profesores colaboradores**, con su correo.

### 3.6 Portafolio y Asistente de IA

Funcionan igual que para el estudiante regular (secciones 2.2 y 2.5).

---

## 4. Profesor de asignatura

Menú: **Inicio · Actividades · Retroalimentación · Evaluaciones · Pautas de práctica · Portafolios**

Solo ves a los estudiantes **de tu asignatura**.

### 4.1 Crear una tarea (Actividades)

1. Entra a **Actividades** y presiona **Nueva actividad**.
2. Completa nombre, descripción y **fecha límite**.
3. Guarda. La actividad aparece en el Portafolio de tus estudiantes.
4. Puedes editarla o eliminarla desde la misma lista.

### 4.2 Calificar una entrega (Evaluaciones)

1. Entra a **Evaluaciones** y busca al estudiante.
2. Abre su evaluación. El modal tiene pestañas:
   - **Archivo del estudiante**: ves el archivo que subió, como una pestaña de navegador.
   - **Evaluación**: donde calificas.
3. Escribe la **nota** (1,0 a 7,0).
4. Escribe la **observación pedagógica** (es lo que el estudiante verá en Observaciones).
5. Opcional: adjunta un **archivo de evaluación** (PDF, Word, Excel, ZIP o imagen, máx. 20 MB).
6. Opcional: graba una **nota de voz**:
   - Presiona **Grabar Voz**, habla y presiona **Detener**.
   - El texto aparece transcrito (en vivo o con Whisper al terminar).
   - **Insertar en Observaciones** copia el texto al campo de observación.
   - **Adjuntar Nota** guarda el audio con la evaluación.
7. Presiona **Guardar**. El estudiante ve la nota y la observación al instante.

Si borras una nota, se borra en todo el sistema (evaluaciones, avance y documentos).

### 4.3 Revisar la retroalimentación de IA (Retroalimentación)

1. Entra a **Retroalimentación**.
2. Elige un estudiante para ver sus planificaciones y la conversación con la IA.
3. Puedes **eliminar** la retroalimentación completa de un alumno (planificación, archivos y chat).

### 4.4 Ver pautas de práctica

- **Pautas de práctica** muestra las pautas **finalizadas** por colaboradores y tutores para los estudiantes de tu asignatura. Solo lectura.

### 4.5 Portafolios

- Revisa el portafolio de cada estudiante y **sube archivos** (que el estudiante no verá en su portafolio).

---

## 5. Profesor colaborador y tutor de práctica

Menú: **Inicio · Pautas**

- El **profesor colaborador** evalúa en Práctica Pedagógica y Profesional.
- El **tutor** evalúa solo en Práctica Profesional.

### 5.1 Ver mis estudiantes (Inicio)

- Tabla con los estudiantes asignados, su estado de observación y de evaluación.
- **Detalles** muestra la información del estudiante y su práctica.

### 5.2 Completar una pauta de evaluación (Pautas)

1. Entra a **Pautas** y elige un **estudiante** (puedes buscar por nombre o RUT).
2. Verás sus pautas y el avance: "X de Y pautas finalizadas".
3. Filtra por **Especialidad** (Especialidad / Orientación) y **Momento** (1ª observación, 2ª observación, Única).
4. Abre una pauta (**Comenzar**, **Continuar** o **Ver resultado**).
5. Lee las **instrucciones** (se despliegan en el encabezado) y la escala:
   2 Insatisfactorio · 3 Básico · 4 Aceptable · 5 Adecuado · 6 Competente · 7 Destacado.
6. En cada indicador, toca el **puntaje**. Los respondidos se marcan con ✓ y cada dimensión muestra "respondidos/total".
7. Escribe las **Observaciones** o díctalas:
   - Despliega **Dictado por voz** → **Grabar Voz** → habla → **Detener**.
   - **Insertar en Observaciones** agrega el texto.
8. Usa la barra inferior:

| Botón | Qué hace |
|---|---|
| **Guardar** | Guarda el borrador. No hay autoguardado: si ves "Cambios sin guardar", guarda antes de salir. |
| **Cancelar** | Sale. Si hay cambios sin guardar, pide confirmar que se descartan. |
| **Limpiar** | Borra todos los puntajes y observaciones (pide confirmación). Se aplica al presionar Guardar. |
| **Finalizar** | Solo se activa con todos los indicadores respondidos. Calcula la nota y **bloquea** la pauta. |

Una pauta finalizada ya no se puede editar; solo el **coordinador** puede reabrirla.

---

## 6. Coordinador

Menú: **Inicio · Asociar · Centros de Práctica · Evaluaciones · Pautas · Documentos · Portafolios**

### 6.1 Ver estudiantes de práctica (Inicio)

- Lista a los estudiantes de **8.° y 9.° semestre** con su estado: **Asociado** (con colaborador y tutor) o **Pendiente de Asociación**.
- Filtra por asignatura o busca por nombre.

### 6.2 Asociar un estudiante a su práctica (Asociar)

1. Desde Inicio presiona **Asociar Docente** en el estudiante (o entra a **Asociar**).
2. Elige la **asignatura**, el **estudiante**, el **centro de práctica**, el **profesor colaborador** y, en Práctica Profesional, el **tutor**.
3. Guarda. Se crea la práctica y el estudiante ve avanzar su línea de tiempo.
4. Puedes **modificar** o **eliminar** la asociación (elimina la práctica y sus registros).

### 6.3 Centros de práctica

- Crea, edita y elimina establecimientos (nombre y dirección).

### 6.4 Evaluaciones

- Consulta todas las evaluaciones registradas en el sistema.

### 6.5 Pautas

**Evaluaciones realizadas**
- Resumen: pautas registradas, finalizadas, en borrador y promedio de notas.
- Filtra por estado y busca por estudiante, RUT, pauta o evaluador.
- Abre una pauta para verla y, si está finalizada, **Reabrir** para que el evaluador la corrija.

**Catálogo de pautas**
1. Presiona **Nueva pauta**. El modal tiene 4 pasos:
   1. **Datos de la pauta**: título, código único, asignatura, tipo, especialidad, momento y quién evalúa.
   2. **Escala y nota**: cálculo (escala con exigencia o promedio), puntaje mínimo y máximo, exigencia %, ponderación, versión e instrucciones.
   3. **Indicadores**: agrega uno a uno, o **Pegar lista** (uno por línea). Puedes ordenarlos y asignarles dimensión.
   4. **Publicación**: activa o inactiva.
2. Arriba ves en vivo: indicadores, puntaje máximo y desde qué puntaje se obtiene un 4,0.
3. Presiona **Crear pauta**.
- En cada pauta: **Editar** (lápiz), **Crear nueva versión** (copiar) y **Activa / Inactiva**.
- Si la pauta ya tiene evaluaciones, solo se editan datos generales; para cambiar indicadores, crea una nueva versión.

### 6.6 Documentos

- Seguimiento de tareas, revisiones y calificaciones por estudiante.
- Descarga los archivos de una tarea o un **ZIP** con los documentos del estudiante.

### 6.7 Portafolios

- Consulta portafolios y sube archivos.

---

## 7. Administrador

Panel en `/admin`.

### 7.1 Crear un usuario

1. **Usuarios** → **Nuevo usuario**.
2. Completa RUT (válido), nombre, apellido, correo, contraseña (mín. 6) y rol.
3. Según el rol:
   - Estudiante o profesor de asignatura: elige la **asignatura**.
   - Profesor colaborador o tutor: elige el **establecimiento**.
   - Coordinador: no lleva asignatura ni establecimiento.

### 7.2 Importar usuarios desde Excel

1. **Usuarios** → **Importar**.
2. Sube un `.xlsx` o `.xls` con las columnas:
   `rut`, `contrasena`, `rol`, `nombre`, `apellido`, `correo` y opcionales `asignatura`, `lugar de practica`.
3. Al terminar verás cuántos se ingresaron y la lista de **omitidos con su motivo** (RUT inválido, repetido, correo repetido, contraseña corta, asignatura o centro inexistente).

### 7.3 Editar o eliminar un usuario

- **Editar**: cambia datos, rol, asignatura o establecimiento.
- **Eliminar**: borra al usuario y todo lo asociado (entregas, planificaciones, chats, prácticas).

### 7.4 Roles y permisos

- Activa o quita permisos por rol. El **Asistente de IA** se habilita por semestre (por defecto de 3.° a 10.°).
- Los cambios se aplican al menú de los usuarios al volver a ingresar.

| Permiso | Qué habilita | Roles por defecto |
|---|---|---|
| `PORTAFOLIO_CONSULTAR` / `PORTAFOLIO_SUBIR` | Ver / subir al portafolio | Estudiante, Prof. asignatura, Coordinador |
| `ACTIVIDADES_GESTIONAR` | Crear actividades | Prof. asignatura |
| `EVALUACIONES_REALIZAR` | Calificar entregas | Prof. asignatura |
| `EVALUACIONES_CONSULTAR` | Ver evaluaciones | Estudiante, Coordinador |
| `OBSERVACIONES_CONSULTAR` | Ver observaciones | Estudiante |
| `PAUTAS_APLICAR` | Completar pautas | Colaborador, Tutor |
| `PAUTAS_CONSULTAR` | Ver resultados de pautas | Estudiante, Prof. asignatura |
| `PAUTAS_GESTIONAR` | Administrar pautas | Coordinador |
| `ESTUDIANTES_CONSULTAR` | Ver estudiantes asignados | Colaborador, Tutor |
| `PRACTICAS_ASOCIAR` | Asociar prácticas | Coordinador |
| `CENTROS_GESTIONAR` | Gestionar centros | Coordinador |
| `DOCUMENTOS_GESTIONAR` | Documentos de práctica | Coordinador |
| `RETROALIMENTACION_REVISAR` | Revisar planificaciones | Prof. asignatura |
| `IA_ACCESO` | Asistentes de IA | Estudiante (3.° a 10.°) |

### 7.5 Asignaturas, centros y documentos

- Gestión de asignaturas (nombre, descripción, semestre), centros de práctica y documentos subidos.

---

## 8. Flujos completos entre roles

### 8.1 Tarea → nota → observación

| Paso | Rol | Dónde |
|---|---|---|
| 1. Crea la tarea con plazo | Profesor de asignatura | Actividades |
| 2. Sube su archivo | Estudiante | Portafolio |
| 3. Abre la entrega, pone nota, observación y nota de voz | Profesor de asignatura | Evaluaciones |
| 4. Ve la nota | Estudiante | Evaluaciones |
| 5. Lee la observación y escucha el audio | Estudiante | Observaciones |
| 6. Ve el avance en la malla | Estudiante | Inicio |

### 8.2 Práctica de 8.° / 9.° semestre

| Paso | Rol | Dónde |
|---|---|---|
| 1. Crea el centro de práctica | Coordinador | Centros de Práctica |
| 2. Asocia estudiante, centro, colaborador y tutor | Coordinador | Asociar |
| 3. Ve su línea de tiempo y su equipo | Estudiante en práctica | Inicio / Equipo de Práctica |
| 4. Sube su planificación y pide retroalimentación a la IA | Estudiante en práctica | Planificación / Retroalimentación |
| 5. Revisa la retroalimentación | Profesor de asignatura | Retroalimentación |
| 6. Completa y finaliza las pautas | Colaborador / Tutor | Pautas |
| 7. Ve sus resultados | Estudiante en práctica | Mis Pautas |
| 8. Revisa todas las pautas y reabre si hace falta | Coordinador | Pautas |

---

## 9. Usuarios de prueba

### 9.1 Importados desde Excel — contraseña `123456`

| Rol | RUT | Detalle |
|---|---|---|
| Coordinador | `9300113-3` | |
| Prof. asignatura | `9300101-K` | Curriculum Educacional (4.°) |
| Prof. asignatura | `9300102-8` | Ambientes de Aprendizaje (5.°) |
| Prof. asignatura | `9300103-6` | Trabajo Colaborativo en Aula (6.°) |
| Prof. asignatura | `9300104-4` | Investigación en Aula (7.°) |
| Tutores | `9300105-2`, `9300106-0`, `9300107-9`, `9300108-7` | Sin establecimiento |
| Prof. colaboradores | `9300109-5`, `9300110-9`, `9300111-7`, `9300112-5` | Sin establecimiento |
| Estudiantes 4.° | `23400101-9` … `23400120-5` | 20 alumnos |
| Estudiantes 5.° | `23400121-3` … `23400140-K` | 20 alumnos |
| Estudiantes 6.° | `23400141-8` … `23400160-4` | 20 alumnos |
| Estudiantes 7.° | `23400161-2` … `23400180-9` | 20 alumnos |

### 9.2 Usuarios previos de la base local

| Rol | RUT | Uso |
|---|---|---|
| Estudiante 8.° (Práctica Pedagógica) | `12345678-5` | Vista de práctica |
| Estudiante | `21576354-4` | Contraseña `admin123` |
| Estudiante 9.° (Práctica Profesional) | `14234567-6` | Sofía Herrera |
| Prof. colaborador | `10000013-K` | Práctica de 8.° |
| Tutor | `18765432-7` | Prácticas sembradas |
| Coordinador | `20123456-5` | |

> Si una contraseña no funciona, cámbiala desde el panel de administración.

---

## 10. Preguntas frecuentes

**No puedo subir mi tarea.** El plazo venció o la actividad ya fue calificada.

**No veo una opción del menú.** Tu rol no tiene ese permiso; el administrador lo activa en Roles y permisos.

**Mi línea de tiempo dice "Falta tutor".** El coordinador aún no completa la asociación de tu práctica.

**No veo la pauta que me hizo el colaborador.** Solo aparece cuando la finaliza.

**Me equivoqué al finalizar una pauta.** Pide al coordinador que la **reabra**.

**La transcripción de voz no aparece.** El navegador debe permitir el micrófono; si la transcripción en vivo falla, se usa Whisper al detener (requiere la clave de IA en el servidor).

**Aprobé pero no pasé al curso siguiente.** Es intencional: el cambio de asignatura lo hace el administrador.
