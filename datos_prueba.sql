-- =========================================================================
-- DATOS DE PRUEBA INTEGRALES - SISTEMA DE PRÁCTICAS UBB
-- Contraseña universal para todos los usuarios: 123456
-- Hash BCrypt: $2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS
-- =========================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Limpieza de tablas previas (para inserción limpia)
DELETE FROM observacion_evaluacion;
DELETE FROM nota;
DELETE FROM evaluacion;
DELETE FROM observacion_practica;
DELETE FROM evidencia;
DELETE FROM actividad;
DELETE FROM documento_practica;
DELETE FROM planificacion;
DELETE FROM documento_planificacion;
DELETE FROM documento;
DELETE FROM cursos_aprobados;
DELETE FROM profesor_colaborador_practica;
DELETE FROM practica;
DELETE FROM profesor_colaborador;
DELETE FROM tutor_practica;
DELETE FROM profesor;
DELETE FROM estudiante;
DELETE FROM centro_practica;
DELETE FROM usuario_rol;
DELETE FROM usuario;

-- =========================================================================
-- 2. USUARIOS (Password: 123456)
-- =========================================================================
INSERT INTO usuario (rut, nombre, apellido, correo, contrasena_encriptada, estado, fecha_creacion) VALUES
-- Administrador y Coordinador
('22222222-2', 'Administrador', 'General', 'administrador@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('20123456-5', 'Coordinador', 'General', 'coordinador@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),

-- Docentes de Asignatura (Semestre 8, Semestre 9 y Semestre 4)
('11111111-1', 'Profesor', 'Asignatura (8°)', 'profesor@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('13876543-1', 'Andrés', 'Muñoz (9°)', 'andres.munoz@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('10987654-2', 'Patricia', 'Navarro (4°)', 'patricia.navarro@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),

-- Tutor de Práctica Institucional y Profesor Colaborador en Centro
('18765432-7', 'Tutor', 'Práctica UBB', 'tutor@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('10000013-K', 'Profesor', 'Colaborador Centro', 'colaborador@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),

-- Estudiantes
('12345678-5', 'Juan', 'Pérez (Estudiante 8°)', 'estudiante@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('14234567-6', 'Sofía', 'Herrera (Estudiante 9°)', 'sofia.herrera@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('15432109-8', 'Camila', 'Valenzuela (Estudiante 4°)', 'camila.valenzuela@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('16543210-K', 'Matías', 'Morales (Estudiante 5°)', 'matias.morales@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('17654321-3', 'Valentina', 'Rojas (Estudiante 6°)', 'valentina.rojas@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW()),
('19876543-0', 'Diego', 'Castro (Estudiante 7°)', 'diego.castro@test.com', '$2a$10$ezhtRD1lNXnT8z3Ds7G2qOYnGztHc2/sFiT0zOKeCZlZghk0phZjS', 'activo', NOW());

-- =========================================================================
-- 3. ASIGNACIÓN DE ROLES
-- Roles: 1=ESTUDIANTE, 2=PROFESOR_ASIGNATURA, 3=PROFESOR_COLABORADOR, 4=TUTOR_PRACTICA, 5=COORDINADOR, 6=ADMINISTRADOR
-- =========================================================================
INSERT INTO usuario_rol (rut_usuario, id_rol) VALUES
('22222222-2', 6), -- Admin
('20123456-5', 5), -- Coordinador
('11111111-1', 2), -- Docente Asignatura 8°
('13876543-1', 2), -- Docente Asignatura 9°
('10987654-2', 2), -- Docente Asignatura 4°
('18765432-7', 4), -- Tutor Práctica
('10000013-K', 3), -- Profesor Colaborador
('12345678-5', 1), -- Estudiante 8°
('14234567-6', 1), -- Estudiante 9°
('15432109-8', 1), -- Estudiante 4°
('16543210-K', 1), -- Estudiante 5°
('17654321-3', 1), -- Estudiante 6°
('19876543-0', 1); -- Estudiante 7°

-- =========================================================================
-- 4. CENTROS DE PRÁCTICA
-- =========================================================================
INSERT INTO centro_practica (id_centro, nombre, direccion) VALUES
(1, 'Colegio Concepción San Pedro', 'Av. Los Manantiales 123, San Pedro de la Paz'),
(2, 'Liceo Bicentenario San Nicolás', 'Av. Bernardo O''Higgins 450, San Nicolás'),
(3, 'Colegio San Agustín Concepción', 'Collao 1200, Concepción'),
(4, 'The Wessex School Chillán', 'Paul Harris 980, Chillán');

-- =========================================================================
-- 5. PROFESORES DE ASIGNATURA
-- Asignaturas: 1=Curriculum (4°), 3=Colaborativo (6°), 5=Práctica Pedagógica (8°), 6=Práctica Profesional (9°)
-- =========================================================================
INSERT INTO profesor (id_profesor, rut_usuario, id_asignatura) VALUES
(1, '11111111-1', 5), -- Práctica Pedagógica (8° Semestre)
(2, '13876543-1', 6), -- Práctica Profesional (9° Semestre)
(3, '10987654-2', 1); -- Curriculum Educacional (4° Semestre)

-- =========================================================================
-- 6. TUTOR DE PRÁCTICA Y PROFESOR COLABORADOR
-- =========================================================================
INSERT INTO tutor_practica (id_tutor, nombre, rut_usuario) VALUES
(1, 'Tutor de Práctica UBB', '18765432-7');

INSERT INTO profesor_colaborador (id_colaborador, rut_usuario, id_centro, especialidad) VALUES
(1, '10000013-K', 1, 'Pedagogía y Gestión de Aula');

-- =========================================================================
-- 7. ESTUDIANTES
-- =========================================================================
INSERT INTO estudiante (id_estudiante, rut_usuario, id_asignatura, estado) VALUES
(1, '12345678-5', 5, 'ACTIVO'), -- 8° Semestre (Práctica Pedagógica)
(2, '14234567-6', 6, 'ACTIVO'), -- 9° Semestre (Práctica Profesional)
(3, '15432109-8', 1, 'ACTIVO'), -- 4° Semestre (Curriculum Educacional)
(4, '16543210-K', 2, 'ACTIVO'), -- 5° Semestre (Ambientes de Aprendizaje)
(5, '17654321-3', 3, 'ACTIVO'), -- 6° Semestre (Trabajo Colaborativo en Aula)
(6, '19876543-0', 4, 'ACTIVO'); -- 7° Semestre (Investigación en Aula)

-- =========================================================================
-- 8. PRÁCTICAS ACTIVAS (Vinculación Coordinador / Tutor / Colaborador)
-- =========================================================================
INSERT INTO practica (id_practica, id_estudiante, id_tutor_practica, id_centro_de_practica, asignatura_id, estado_aprobacion) VALUES
(1, 1, 1, 1, 5, 'EN_CURSO'), -- Juan Pérez en Colegio Concepción con Tutor 1 y Asig 5
(2, 2, 1, 2, 6, 'EN_CURSO'); -- Sofía Herrera en Liceo San Nicolás con Tutor 1 y Asig 6

-- Vinculación de Colaborador a las prácticas
INSERT INTO profesor_colaborador_practica (id_colaborador, id_practica) VALUES
(1, 1),
(1, 2);

-- =========================================================================
-- 9. CURSOS APROBADOS (Para cálculo real de avance académico en portafolio)
-- =========================================================================
INSERT INTO cursos_aprobados (id, id_estudiante, id_asignatura, promedio, estado, fecha_actualizacion) VALUES
-- Juan Pérez (Semestre 8) tiene aprobadas asignaturas 1, 2, 3 y 4
(1, 1, 1, 6.2, 'APROBADO', NOW()),
(2, 1, 2, 5.8, 'APROBADO', NOW()),
(3, 1, 3, 6.5, 'APROBADO', NOW()),
(4, 1, 4, 6.0, 'APROBADO', NOW()),

-- Sofía Herrera (Semestre 9) tiene aprobadas asignaturas 1, 2, 3, 4 y 5
(5, 2, 1, 6.5, 'APROBADO', NOW()),
(6, 2, 2, 6.3, 'APROBADO', NOW()),
(7, 2, 3, 6.8, 'APROBADO', NOW()),
(8, 2, 4, 6.4, 'APROBADO', NOW()),
(9, 2, 5, 6.7, 'APROBADO', NOW());

-- =========================================================================
-- 10. ACTIVIDADES Y TAREAS DEL PROFESOR
-- =========================================================================
INSERT INTO actividad (id_actividad, titulo, descripcion, fecha_creacion, fecha_limite, estado, id_asignatura, id_profesor) VALUES
(1, 'Evidencia 1: Planificación de Clase y Recursos Didácticos', 'Subir la planificación de la clase grabada acompañada de la pauta de evaluación y el material didáctico utilizado.', NOW() - INTERVAL 10 DAY, NOW() + INTERVAL 20 DAY, 'ACTIVA', 5, 1),
(2, 'Evidencia 2: Registro Reflexivo de Observación de Aula', 'Elaborar un informe reflexivo en torno a las dimensiones del clima de aula y estrategias de participación.', NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 25 DAY, 'ACTIVA', 5, 1),
(3, 'Informe de Diagnóstico Institucional y Proyecto', 'Presentación del informe diagnóstico del centro de práctica y propuesta inicial de intervención.', NOW() - INTERVAL 8 DAY, NOW() + INTERVAL 15 DAY, 'ACTIVA', 6, 2);

-- =========================================================================
-- 11. EVIDENCIAS / ENTREGAS DE ESTUDIANTES
-- =========================================================================
INSERT INTO evidencia (id_evidencia, id_actividad, id_estudiante, id_asignatura, estado, fecha_entrega, fecha_revision, comentario_estudiante, retroalimentacion, nombre_archivo, nombre_archivo_revision, archivo_url, archivo_revision_url, id_nota, id_profesor_revisor) VALUES
(1, 1, 1, 5, 'REVISADO', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 1 DAY, 'Adjunto la planificación corregida según las indicaciones de la reunión.', 'Excelente coherencia entre los objetivos de aprendizaje y las actividades planteadas. Felicitaciones.', 'Planificacion_Clase_JuanPerez.pdf', 'Revision_Docente_Planificacion.pdf', '/admin/documentos/archivo/evid_1.pdf', '/admin/documentos/archivo/rev_1.pdf', NULL, 1),
(2, 2, 1, 5, 'ENTREGADO', NOW() - INTERVAL 1 DAY, NULL, 'Envío del informe reflexivo sobre observación de aula.', NULL, 'Registro_Reflexivo_JuanPerez.pdf', NULL, '/admin/documentos/archivo/evid_2.pdf', NULL, NULL, NULL);

-- =========================================================================
-- 12. DOCUMENTOS DE PRÁCTICA (Expediente y Portafolio del Estudiante)
-- =========================================================================
INSERT INTO documento_practica (id_documento_practica, rut_estudiante, rut_usuario, id_asignatura, tipo_documento, nombre_documento, nombre_archivo, ubicacion, tamanio_bytes, estado, fecha_carga) VALUES
(1, '12345678-5', '12345678-5', 5, 'ESTUDIANTE', 'Informe de Práctica y Autoevaluación', 'Informe_Practica_Juan_Perez.pdf', 'uploads/documentos/informe_juan.pdf', 245120, 'ENTREGADO', NOW() - INTERVAL 3 DAY),
(2, '12345678-5', '11111111-1', 5, 'PROFESOR', 'Pauta de Evaluación Final del Profesor', 'Pauta_Final_Docente_JuanPerez.pdf', 'uploads/documentos/pauta_juan.pdf', 184320, 'ENTREGADO', NOW() - INTERVAL 1 DAY),
(3, '14234567-6', '14234567-6', 6, 'ESTUDIANTE', 'Informe de Práctica y Autoevaluación', 'Informe_Practica_Sofia_Herrera.pdf', 'uploads/documentos/informe_sofia.pdf', 312450, 'ENTREGADO', NOW() - INTERVAL 2 DAY);

-- =========================================================================
-- 13. EVALUACIONES, NOTAS Y OBSERVACIONES (Línea de tiempo del perfil)
-- Fase 1: Diagnóstico / Inicial
-- Fase 2: Observación / Intermedia
-- Fase 3: Evaluación Final
-- =========================================================================
INSERT INTO evaluacion (id_evaluacion, id_practica, tipo_evaluacion, tipo_evaluador, nombre_evaluador, rut_evaluador, puntaje_maximo, puntaje_minimo, observacion, fecha, fecha_limite) VALUES
-- Evaluaciones para Juan Pérez (Práctica Pedagógica - Semestre 8)
(1, 1, 'DIAGNOSTICA', 'PROFESOR', 'Profesor Asignatura', '11111111-1', 7.0, 1.0, 'Evaluación de diagnóstico inicial completada con éxito. Demuestra adecuado dominio conceptual.', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 18 DAY),
(2, 1, 'INTERMEDIA', 'PROFESOR', 'Profesor Asignatura', '11111111-1', 7.0, 1.0, 'Evaluación intermedia de progreso didáctico y desempeño formativo en aula.', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 2 DAY),

-- Evaluaciones para Sofía Herrera (Práctica Profesional - Semestre 9)
(3, 2, 'DIAGNOSTICA', 'TUTOR', 'Tutor de Práctica UBB', '18765432-7', 7.0, 1.0, 'Diagnóstico de inserción en el centro educativo superado.', NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 28 DAY),
(4, 2, 'INTERMEDIA', 'COLABORADOR', 'Profesor Colaborador Centro', '10000013-K', 7.0, 1.0, 'Evaluación intermedia de desempeño en aula escolar.', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 12 DAY),
(5, 2, 'FINAL', 'TUTOR', 'Tutor de Práctica UBB', '18765432-7', 7.0, 1.0, 'Evaluación final consolidada de la práctica profesional.', NOW() - INTERVAL 2 DAY, NOW());

-- Notas asociadas a las evaluaciones
INSERT INTO nota (id_nota, id_estudiante, id_evaluacion, puntaje_obtenido, rut_evaluador) VALUES
(1, 1, 1, 6.3, '11111111-1'),
(2, 1, 2, 6.7, '11111111-1'),
(3, 2, 3, 6.0, '18765432-7'),
(4, 2, 4, 6.8, '10000013-K'),
(5, 2, 5, 6.9, '18765432-7');

-- Observaciones detalladas en las evaluaciones
INSERT INTO observacion_evaluacion (id_observacion, id_evaluacion, texto, fecha) VALUES
(1, 1, 'Muy buen planteamiento de preguntas iniciales para activar conocimientos previos.', NOW() - INTERVAL 20 DAY),
(2, 2, 'Destaca en la gestión del tiempo y la mediación de conflictos en el aula.', NOW() - INTERVAL 5 DAY),
(3, 5, 'Cumplimiento excepcional de las metas pedagógicas e integración comunitaria.', NOW() - INTERVAL 2 DAY);

-- Observaciones de campo / bitácora de práctica
INSERT INTO observacion_practica (id, estudiante, rut, centro_practica, foco_observacion, resumen, estado, fecha, autor_rut) VALUES
(1, 'Juan Pérez (Estudiante 8°)', '12345678-5', 'Colegio Concepción San Pedro', 'Clima de Aula y Convivencia', 'Se observó una clase de 45 minutos. Buen manejo del tono de voz y respeto hacia las normas de convivencia acordadas.', 'COMPLETADA', '2026-10-20', '18765432-7'),
(2, 'Sofía Herrera (Estudiante 9°)', '14234567-6', 'Liceo Bicentenario San Nicolás', 'Uso de Material Didáctico', 'Uso de recursos tecnológicos y guías de trabajo adaptadas a la diversidad del grupo curso.', 'COMPLETADA', '2026-10-22', '10000013-K');

-- =========================================================================
-- 14. DOCUMENTOS Y PLANIFICACIÓN DE CLASE (5 archivos obligatorios)
-- =========================================================================
INSERT INTO documento (id_documento, nombre, rut_estudiante, rut_usuario, tamanio_bytes, tipo, ubicacion, fecha_carga, id_asignatura) VALUES
(1, 'Planificacion_Curricular_Unidad2.pdf', '12345678-5', '12345678-5', 184500, 'PLANIFICACION', 'uploads/planificaciones/plan_1.pdf', NOW() - INTERVAL 6 DAY, 5),
(2, 'Diapositivas_Presentacion_Clase.pptx', '12345678-5', '12345678-5', 2450000, 'PRESENTACION', 'uploads/planificaciones/pres_1.pptx', NOW() - INTERVAL 6 DAY, 5),
(3, 'Guia_Ejercicios_Practicos.pdf', '12345678-5', '12345678-5', 120400, 'GUIA_ACTIVIDADES', 'uploads/planificaciones/guia_1.pdf', NOW() - INTERVAL 6 DAY, 5),
(4, 'Rubrica_Evaluacion_Formativa.pdf', '12345678-5', '12345678-5', 98000, 'RUBRICA_EVALUACION', 'uploads/planificaciones/rubrica_1.pdf', NOW() - INTERVAL 6 DAY, 5),
(5, 'Material_Concreto_Recursos.pdf', '12345678-5', '12345678-5', 450120, 'MATERIAL_DIDACTICO', 'uploads/planificaciones/mat_1.pdf', NOW() - INTERVAL 6 DAY, 5);

INSERT INTO documento_planificacion (id_documento_planificacion, id_planificacion_archivo, id_presentacion, id_guia_actividades, id_rubrica_evaluacion, id_material_didactico) VALUES
(1, 1, 2, 3, 4, 5);

INSERT INTO planificacion (id_planificacion, id_practica, id_estudiante, id_asignatura, id_documento_planificacion, fecha_creacion) VALUES
(1, 1, 1, 5, 1, NOW() - INTERVAL 6 DAY);

SET FOREIGN_KEY_CHECKS = 1;
