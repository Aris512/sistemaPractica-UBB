-- ==========================================================
-- V1: Esquema inicial del sistema de práctica
-- Generado a partir de las entidades JPA (Hibernate).
-- Ejecutar en orden: Flyway aplica este script una sola vez
-- por base de datos y lo registra en flyway_schema_history.
-- NO modificar este archivo una vez aplicado: usa V2, V3, ...
-- ==========================================================

create table actividad (fecha_creacion datetime(6), fecha_limite datetime(6), id_actividad bigint not null auto_increment, id_asignatura bigint, id_profesor bigint not null, descripcion varchar(2000), estado varchar(255), titulo varchar(255) not null, primary key (id_actividad)) engine=InnoDB;
create table asignatura (id_asignatura bigint not null auto_increment, descripcion varchar(255), nombre varchar(255), semestre varchar(255), primary key (id_asignatura)) engine=InnoDB;
create table centro_practica (id_centro bigint not null auto_increment, direccion varchar(255), nombre varchar(255), primary key (id_centro)) engine=InnoDB;
create table documento (fecha_carga datetime(6), id_asignatura bigint, id_documento bigint not null auto_increment, tamanio_bytes bigint, rut_usuario varchar(12), nombre varchar(255), rut_estudiante varchar(255), tipo varchar(255), ubicacion varchar(255), primary key (id_documento)) engine=InnoDB;
create table documento_planificacion (id_documento bigint not null, id_planificacion bigint not null, primary key (id_documento, id_planificacion)) engine=InnoDB;
create table documento_practica (fecha_carga datetime(6), id_asignatura bigint not null, id_documento_practica bigint not null auto_increment, tamanio_bytes bigint, rut_estudiante varchar(12) not null, rut_usuario varchar(12) not null, estado varchar(50), tipo_documento varchar(50) not null, nombre_archivo varchar(500) not null, ubicacion varchar(1000) not null, nombre_documento varchar(255), primary key (id_documento_practica)) engine=InnoDB;
create table encuesta (fecha_inicio datetime(6), fecha_termino datetime(6), id_encuesta bigint not null auto_increment, id_practica bigint, descripcion varchar(255), nombre varchar(255), primary key (id_encuesta)) engine=InnoDB;
create table estudiante (id_asignatura bigint, id_estudiante bigint not null auto_increment, rut_usuario varchar(12), estado varchar(255), primary key (id_estudiante)) engine=InnoDB;
create table evaluacion (puntaje_maximo float(53), puntaje_minimo float(53), fecha datetime(6), fecha_limite datetime(6), id_evaluacion bigint not null auto_increment, id_evaluador bigint, id_practica bigint, observacion varchar(255), tipo_evaluacion varchar(255), tipo_evaluador varchar(255), primary key (id_evaluacion)) engine=InnoDB;
create table evidencia (calificacion float(53), fecha_entrega datetime(6), fecha_revision datetime(6), id_actividad bigint not null, id_estudiante bigint not null, id_evidencia bigint not null auto_increment, id_profesor_revisor bigint, archivo_url varchar(1000), comentario_estudiante varchar(2000), retroalimentacion varchar(2000), estado varchar(255), nombre_archivo varchar(255), primary key (id_evidencia)) engine=InnoDB;
create table nota (puntaje_obtenido float(53), id_estudiante bigint, id_evaluacion bigint, id_nota bigint not null auto_increment, rut_evaluador varchar(255), primary key (id_nota)) engine=InnoDB;
create table nota_de_voz (fecha_grabacion datetime(6), id_audio bigint not null auto_increment, id_evaluacion bigint, duracion varchar(255), ubicacion_archivo varchar(255), primary key (id_audio)) engine=InnoDB;
create table observacion_evaluacion (fecha datetime(6), id_evaluacion bigint, id_observacion bigint not null auto_increment, texto varchar(255), primary key (id_observacion)) engine=InnoDB;
create table observacion_practica (id bigint not null auto_increment, resumen varchar(2000), autor_rut varchar(255), centro_practica varchar(255), estado varchar(255), estudiante varchar(255) not null, fecha varchar(255), foco_observacion varchar(255), rut varchar(255) not null, primary key (id)) engine=InnoDB;
create table pauta (criterios_count integer, id bigint not null auto_increment, descripcion varchar(1000), asignatura varchar(255), codigo varchar(255) not null, ponderacion varchar(255), tipo varchar(255), titulo varchar(255) not null, version varchar(255), primary key (id)) engine=InnoDB;
create table permiso (id_permiso bigint not null auto_increment, categoria varchar(80) not null, codigo varchar(100) not null, nombre varchar(150) not null, descripcion varchar(300), primary key (id_permiso)) engine=InnoDB;
create table planificacion (version_autoincremental integer, fecha_creacion datetime(6), id_asignatura bigint, id_estudiante bigint, id_planificacion bigint not null auto_increment, id_practica bigint, estado varchar(255), objetivo varchar(255), titulo varchar(255), primary key (id_planificacion)) engine=InnoDB;
create table practica (asignatura_id bigint, id_centro_de_practica bigint, id_estudiante bigint, id_practica bigint not null auto_increment, id_tutor_practica bigint, estado_aprobacion varchar(255), primary key (id_practica)) engine=InnoDB;
create table pregunta_diagnostica (id_pregunta bigint not null auto_increment, id_retroalimentacion bigint, pregunta varchar(255), primary key (id_pregunta)) engine=InnoDB;
create table pregunta_encuesta (id_encuesta bigint, id_pregunta_encuesta bigint not null auto_increment, pregunta varchar(255), primary key (id_pregunta_encuesta)) engine=InnoDB;
create table profesor (id_asignatura bigint, id_profesor bigint not null auto_increment, rut_usuario varchar(12), primary key (id_profesor)) engine=InnoDB;
create table profesor_asignatura (id_asignatura bigint not null, id_profesor bigint not null, primary key (id_asignatura, id_profesor)) engine=InnoDB;
create table profesor_colaborador (id_centro bigint, id_colaborador bigint not null auto_increment, rut_usuario varchar(12), especialidad varchar(255), primary key (id_colaborador)) engine=InnoDB;
create table profesor_colaborador_practica (id_colaborador bigint not null, id_practica bigint not null, primary key (id_colaborador, id_practica)) engine=InnoDB;
create table proyecto_intervencion (fecha_entrega datetime(6), id_documento bigint, id_practica bigint, id_proyecto bigint not null auto_increment, descripcion varchar(255), estado varchar(255), titulo varchar(255), primary key (id_proyecto)) engine=InnoDB;
create table respuesta_encuesta (fecha_respuesta datetime(6), id_estudiante bigint, id_pregunta_encuesta bigint, id_respuesta bigint not null auto_increment, respuesta varchar(255), primary key (id_respuesta)) engine=InnoDB;
create table respuesta_pregunta (fecha_respuesta datetime(6), id_estudiante bigint, id_pregunta bigint, id_respuesta bigint not null auto_increment, respuesta varchar(255), primary key (id_respuesta)) engine=InnoDB;
create table retroalimentacion_ia (fecha datetime(6), id_planificacion bigint, id_retroalimentacion bigint not null auto_increment, estado varchar(255), observacion_general varchar(255), resultado_general varchar(255), primary key (id_retroalimentacion)) engine=InnoDB;
create table rol_permiso (activo bit not null, id bigint not null auto_increment, id_permiso bigint not null, id_rol bigint not null, semestres_permitidos varchar(150), primary key (id)) engine=InnoDB;
create table roles (id_rol bigint not null auto_increment, descripcion varchar(255), nombre varchar(255), primary key (id_rol)) engine=InnoDB;
create table tutor_practica (id_tutor bigint not null auto_increment, rut_usuario varchar(12), nombre varchar(255), primary key (id_tutor)) engine=InnoDB;
create table usuario (fecha_creacion datetime(6), rut varchar(12) not null, estado varchar(20) not null, apellido varchar(255), contrasena_encriptada varchar(255), correo varchar(255), nombre varchar(255), primary key (rut)) engine=InnoDB;
create table usuario_rol (id_rol bigint not null, rut_usuario varchar(12) not null, primary key (id_rol, rut_usuario)) engine=InnoDB;

alter table pauta add constraint uk_pauta_codigo unique (codigo);
alter table permiso add constraint uk_permiso_codigo unique (codigo);

alter table actividad add constraint fk_actividad_asignatura foreign key (id_asignatura) references asignatura (id_asignatura);
alter table actividad add constraint fk_actividad_profesor foreign key (id_profesor) references profesor (id_profesor);
alter table documento add constraint fk_documento_asignatura foreign key (id_asignatura) references asignatura (id_asignatura);
alter table documento add constraint fk_documento_usuario foreign key (rut_usuario) references usuario (rut);
alter table documento_planificacion add constraint fk_doc_plan_planificacion foreign key (id_planificacion) references planificacion (id_planificacion);
alter table documento_planificacion add constraint fk_doc_plan_documento foreign key (id_documento) references documento (id_documento);
alter table documento_practica add constraint fk_docprac_asignatura foreign key (id_asignatura) references asignatura (id_asignatura);
alter table documento_practica add constraint fk_docprac_estudiante foreign key (rut_estudiante) references usuario (rut);
alter table documento_practica add constraint fk_docprac_usuario foreign key (rut_usuario) references usuario (rut);
alter table encuesta add constraint fk_encuesta_practica foreign key (id_practica) references practica (id_practica);
alter table estudiante add constraint fk_estudiante_asignatura foreign key (id_asignatura) references asignatura (id_asignatura);
alter table estudiante add constraint fk_estudiante_usuario foreign key (rut_usuario) references usuario (rut);
alter table evaluacion add constraint fk_evaluacion_practica foreign key (id_practica) references practica (id_practica);
alter table evidencia add constraint fk_evidencia_actividad foreign key (id_actividad) references actividad (id_actividad);
alter table evidencia add constraint fk_evidencia_estudiante foreign key (id_estudiante) references estudiante (id_estudiante);
alter table evidencia add constraint fk_evidencia_profesor foreign key (id_profesor_revisor) references profesor (id_profesor);
alter table nota add constraint fk_nota_estudiante foreign key (id_estudiante) references estudiante (id_estudiante);
alter table nota add constraint fk_nota_evaluacion foreign key (id_evaluacion) references evaluacion (id_evaluacion);
alter table nota_de_voz add constraint fk_notavoz_evaluacion foreign key (id_evaluacion) references evaluacion (id_evaluacion);
alter table observacion_evaluacion add constraint fk_obseval_evaluacion foreign key (id_evaluacion) references evaluacion (id_evaluacion);
alter table planificacion add constraint fk_planificacion_asignatura foreign key (id_asignatura) references asignatura (id_asignatura);
alter table planificacion add constraint fk_planificacion_estudiante foreign key (id_estudiante) references estudiante (id_estudiante);
alter table planificacion add constraint fk_planificacion_practica foreign key (id_practica) references practica (id_practica);
alter table practica add constraint fk_practica_asignatura foreign key (asignatura_id) references asignatura (id_asignatura);
alter table practica add constraint fk_practica_centro foreign key (id_centro_de_practica) references centro_practica (id_centro);
alter table practica add constraint fk_practica_estudiante foreign key (id_estudiante) references estudiante (id_estudiante) on delete set null;
alter table practica add constraint fk_practica_tutor foreign key (id_tutor_practica) references tutor_practica (id_tutor) on delete set null;
alter table pregunta_diagnostica add constraint fk_prediag_retro foreign key (id_retroalimentacion) references retroalimentacion_ia (id_retroalimentacion);
alter table pregunta_encuesta add constraint fk_preencuesta_encuesta foreign key (id_encuesta) references encuesta (id_encuesta);
alter table profesor add constraint fk_profesor_asignatura foreign key (id_asignatura) references asignatura (id_asignatura);
alter table profesor add constraint fk_profesor_usuario foreign key (rut_usuario) references usuario (rut);
alter table profesor_asignatura add constraint fk_profasig_asignatura foreign key (id_asignatura) references asignatura (id_asignatura);
alter table profesor_asignatura add constraint fk_profasig_profesor foreign key (id_profesor) references profesor (id_profesor);
alter table profesor_colaborador add constraint fk_profcol_centro foreign key (id_centro) references centro_practica (id_centro);
alter table profesor_colaborador add constraint fk_profcol_usuario foreign key (rut_usuario) references usuario (rut);
alter table profesor_colaborador_practica add constraint fk_profcolprac_practica foreign key (id_practica) references practica (id_practica);
alter table profesor_colaborador_practica add constraint fk_profcolprac_colaborador foreign key (id_colaborador) references profesor_colaborador (id_colaborador);
alter table proyecto_intervencion add constraint fk_proyecto_documento foreign key (id_documento) references documento (id_documento);
alter table proyecto_intervencion add constraint fk_proyecto_practica foreign key (id_practica) references practica (id_practica);
alter table respuesta_encuesta add constraint fk_respenc_estudiante foreign key (id_estudiante) references estudiante (id_estudiante);
alter table respuesta_encuesta add constraint fk_respenc_pregunta foreign key (id_pregunta_encuesta) references pregunta_encuesta (id_pregunta_encuesta);
alter table respuesta_pregunta add constraint fk_resppreg_estudiante foreign key (id_estudiante) references estudiante (id_estudiante);
alter table respuesta_pregunta add constraint fk_resppreg_pregunta foreign key (id_pregunta) references pregunta_diagnostica (id_pregunta);
alter table retroalimentacion_ia add constraint fk_retro_planificacion foreign key (id_planificacion) references planificacion (id_planificacion);
alter table rol_permiso add constraint fk_rolpermiso_permiso foreign key (id_permiso) references permiso (id_permiso);
alter table rol_permiso add constraint fk_rolpermiso_rol foreign key (id_rol) references roles (id_rol);
alter table tutor_practica add constraint fk_tutor_usuario foreign key (rut_usuario) references usuario (rut);
alter table usuario_rol add constraint fk_usuariorol_rol foreign key (id_rol) references roles (id_rol);
alter table usuario_rol add constraint fk_usuariorol_usuario foreign key (rut_usuario) references usuario (rut);
