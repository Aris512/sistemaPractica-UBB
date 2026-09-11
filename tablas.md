TABLA: USUARIO
- id_usuario
- nombre
- apellido
- correo
- contraseña_encriptada
- fecha_creacion


TABLA: ROLES
- id_rol
- nombre
- descripcion


TABLA: USUARIO_ROL
- id_usuario
- id_rol


TABLA: ESTUDIANTE
- id_estudiante
- id_usuario
- semestre
- estado


TABLA: PROFESOR
- id_profesor
- id_usuario
- ramo


TABLA: CENTRO_PRACTICA
- id_centro
- nombre
- direccion


TABLA: PROFESOR_COLABORADOR
- id_colaborador
- id_usuario
- id_centro
- especialidad


TABLA: TUTOR_PRACTICA
- id_tutor
- nombre
- id_usuario


TABLA: ASIGNATURA
- id_asignatura
- nombre
- descripcion
- semestre


TABLA: PRACTICA
- id_practica
- id_estudiante
- id tutor_practica
-id_centro_de_practica
- asignatura_id
- estado_aprobacion


TABLA: PROFESOR_ASIGNATURA
- id_profesor
- id_asignatura



TABLA: PROFESOR_COLABORADOR_PRACTICA
- id_colaborador
- id_practica


TABLA: PLANIFICACION
- id_planificacion
- id_practica
- id_estudiante
- id_asignatura
- titulo
- objetivo
- estado
- fecha_creacion
- version_autoincremental


TABLA: DOCUMENTO
- id_documento
- nombre
- tipo
- ubicacion
- fecha_carga
- id_usuario


TABLA: DOCUMENTO_PLANIFICACION
- id_documento
- id_planificacion


TABLA: RETROALIMENTACION_IA
- id_retroalimentacion
- id_planificacion
- fecha
- estado
- resultado_general
- observacion_general


TABLA: PREGUNTA_DIAGNOSTICA
- id_pregunta
- id_retroalimentacion
- pregunta


TABLA: RESPUESTA_PREGUNTA
- id_respuesta
- id_pregunta
- id_estudiante
- respuesta
- fecha_respuesta


TABLA: EVALUACION
- id_evaluacion
- id_practica
- id_evaluador
- tipo_evaluador
- fecha
- tipo_evaluacion
- puntaje_minimo
- puntaje_maximo
- observacion


TABLA: OBSERVACION_EVALUACION
- id_observacion
- id_evaluacion
- texto
- fecha


TABLA: NOTA_DE_VOZ
- id_audio
- id_evaluacion
- ubicacion_archivo
- duracion
- fecha_grabacion


TABLA: ENCUESTA
- id_encuesta
- id_practica
- nombre
- descripcion
- fecha_inicio
- fecha_termino


TABLA: PREGUNTA_ENCUESTA
- id_pregunta_encuesta
- id_encuesta
- pregunta


TABLA: RESPUESTA_ENCUESTA
- id_respuesta
- id_pregunta_encuesta
- id_estudiante
- respuesta
- fecha_respuesta


TABLA: PROYECTO_INTERVENCION
- id_proyecto
- id_practica
- titulo
- descripcion
- fecha_entrega
- estado
- id_documento

