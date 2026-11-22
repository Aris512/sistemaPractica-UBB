package com.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.config.PermisosCatalogo;
import com.backend.dto.GuardarPermisosRequest;
import com.backend.dto.PermisoDTO;
import com.backend.dto.RolPermisoConfigDTO;
import com.backend.model.Estudiante;
import com.backend.model.Permiso;
import com.backend.model.Rol;
import com.backend.model.RolPermiso;
import com.backend.model.Usuario;
import com.backend.repository.EstudianteRepository;
import com.backend.repository.PermisoRepository;
import com.backend.repository.RolPermisoRepository;
import com.backend.repository.RolRepository;
import com.backend.repository.UsuarioRepository;
import com.backend.util.RutUtils;

@Service
public class PermisoService {

    private static final Logger logger = LoggerFactory.getLogger(PermisoService.class);

    private final PermisoRepository permisoRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;

    public PermisoService(PermisoRepository permisoRepository,
                          RolPermisoRepository rolPermisoRepository,
                          RolRepository rolRepository,
                          UsuarioRepository usuarioRepository,
                          EstudianteRepository estudianteRepository) {
        this.permisoRepository = permisoRepository;
        this.rolPermisoRepository = rolPermisoRepository;
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
    }

    /**
     * Retorna todo el catálogo de permisos disponibles en el sistema.
     */
    @Transactional(readOnly = true)
    public List<PermisoDTO> obtenerCatalogo() {
        return permisoRepository.findAll().stream()
                .map(p -> new PermisoDTO(p.getIdPermiso(), p.getCodigo(), p.getNombre(), p.getCategoria(), p.getDescripcion()))
                .collect(Collectors.toList());
    }

    /**
     * Permisos configurables de un rol: solo los del catálogo que aplican a ese rol (asignados o no),
     * en el orden del catálogo. Un rol sin permisos aplicables (p. ej. el administrador) recibe una lista vacía.
     */
    @Transactional(readOnly = true)
    public List<RolPermisoConfigDTO> obtenerConfiguracionPorRol(Long idRol) {
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + idRol));

        List<Permiso> todosLosPermisos = permisoRepository.findAll().stream()
                .filter(p -> PermisosCatalogo.aplicaA(p.getCodigo(), rol.getNombre()))
                .sorted(Comparator.comparingInt(p -> PermisosCatalogo.orden(p.getCodigo())))
                .toList();
        List<RolPermiso> asignados = rolPermisoRepository.findByRolIdRol(idRol);

        Map<Long, RolPermiso> asignadosMap = asignados.stream()
                .collect(Collectors.toMap(rp -> rp.getPermiso().getIdPermiso(), rp -> rp, (existing, replace) -> existing));

        List<RolPermisoConfigDTO> resultado = new ArrayList<>();
        for (Permiso p : todosLosPermisos) {
            RolPermiso rp = asignadosMap.get(p.getIdPermiso());
            if (rp != null) {
                resultado.add(new RolPermisoConfigDTO(
                        p.getIdPermiso(),
                        p.getCodigo(),
                        p.getNombre(),
                        p.getCategoria(),
                        p.getDescripcion(),
                        rp.getActivo(),
                        rp.getSemestresPermitidos()
                ));
            } else {
                resultado.add(new RolPermisoConfigDTO(
                        p.getIdPermiso(),
                        p.getCodigo(),
                        p.getNombre(),
                        p.getCategoria(),
                        p.getDescripcion(),
                        false,
                        "ALL"
                ));
            }
        }
        return resultado;
    }

    /**
     * Obtiene la configuración por nombre de rol (ej: ESTUDIANTE, PROFESOR_ASIGNATURA).
     */
    @Transactional(readOnly = true)
    public List<RolPermisoConfigDTO> obtenerConfiguracionPorRolNombre(String nombre) {
        Rol rol = rolRepository.findByNombre(nombre)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con nombre: " + nombre));
        return obtenerConfiguracionPorRol(rol.getIdRol());
    }

    /**
     * Guarda en lote la configuración de permisos para un rol específico.
     */
    @Transactional
    public List<RolPermisoConfigDTO> guardarConfiguracionRol(Long idRol, GuardarPermisosRequest request) {
        Rol rol = rolRepository.findById(idRol)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado con ID: " + idRol));

        if (request == null || request.getPermisos() == null) {
            return obtenerConfiguracionPorRol(idRol);
        }

        for (GuardarPermisosRequest.PermisoItemConfig item : request.getPermisos()) {
            Permiso permiso = null;
            if (item.getIdPermiso() != null) {
                permiso = permisoRepository.findById(item.getIdPermiso()).orElse(null);
            }
            if (permiso == null && item.getCodigo() != null && !item.getCodigo().isBlank()) {
                permiso = permisoRepository.findByCodigo(item.getCodigo().trim()).orElse(null);
            }

            // Un permiso que no aplica al rol no se puede conceder (p. ej. «Asociar prácticas» a un colaborador)
            if (permiso != null && !PermisosCatalogo.aplicaA(permiso.getCodigo(), rol.getNombre())) {
                logger.warn("Se ignora el permiso '{}': no aplica al rol '{}'.", permiso.getCodigo(), rol.getNombre());
                permiso = null;
            }

            if (permiso != null) {
                Optional<RolPermiso> existenteOpt = rolPermisoRepository.findByRolIdRolAndPermisoIdPermiso(idRol, permiso.getIdPermiso());
                RolPermiso rolPermiso;
                if (existenteOpt.isPresent()) {
                    rolPermiso = existenteOpt.get();
                } else {
                    rolPermiso = new RolPermiso();
                    rolPermiso.setRol(rol);
                    rolPermiso.setPermiso(permiso);
                }
                rolPermiso.setActivo(item.getActivo() != null && item.getActivo());
                rolPermiso.setSemestresPermitidos(item.getSemestresPermitidos());
                rolPermisoRepository.save(rolPermiso);
            }
        }

        logger.info("Permisos actualizados para el rol '{}' (ID: {})", rol.getNombre(), idRol);
        return obtenerConfiguracionPorRol(idRol);
    }

    /**
     * Retorna el conjunto de códigos de permisos activos para un rol y un semestre dado.
     */
    @Transactional(readOnly = true)
    public Set<String> obtenerPermisosActivosPorRolYSemestre(String rolNombre, String semestre) {
        Set<String> activos = new HashSet<>();
        if (rolNombre == null || rolNombre.isBlank()) {
            return activos;
        }

        List<RolPermiso> asignados = rolPermisoRepository.findByRolNombre(rolNombre.trim());
        for (RolPermiso rp : asignados) {
            if (rp.getActivo() && rp.permiteSemestre(semestre)) {
                String codigo = rp.getPermiso() != null ? rp.getPermiso().getCodigo() : null;
                // Filas antiguas de permisos que ya no aplican al rol no conceden nada
                if (codigo != null && PermisosCatalogo.aplicaA(codigo, rolNombre)) {
                    activos.add(codigo);
                }
            }
        }
        return activos;
    }

    /**
     * Resuelve los permisos efectivos para un usuario según sus roles y su semestre actual en base de datos.
     */
    @Transactional(readOnly = true)
    public Set<String> obtenerPermisosEfectivosUsuario(String rut) {
        Set<String> resultado = new HashSet<>();
        if (rut == null || rut.isBlank()) {
            return resultado;
        }

        String standardRut = RutUtils.formatStandard(rut);
        Optional<Usuario> usuarioOpt = usuarioRepository.findByRut(standardRut);
        if (usuarioOpt.isEmpty()) {
            usuarioOpt = usuarioRepository.findByRut(RutUtils.clean(rut));
        }
        if (usuarioOpt.isEmpty()) {
            usuarioOpt = usuarioRepository.findByRut(rut);
        }

        if (usuarioOpt.isEmpty()) {
            return resultado;
        }

        Usuario usuario = usuarioOpt.get();
        if (!usuario.isActivo()) {
            return resultado;
        }

        // Si el usuario es un estudiante, obtenemos el semestre que cursa
        String semestreEstudiante = null;
        Optional<Estudiante> estudianteOpt = estudianteRepository.findByUsuario(usuario);
        if (estudianteOpt.isEmpty()) {
            estudianteOpt = estudianteRepository.findByUsuarioRut(usuario.getRut());
        }
        if (estudianteOpt.isPresent()) {
            Estudiante est = estudianteOpt.get();
            if (est.getAsignatura() != null && est.getAsignatura().getSemestre() != null) {
                semestreEstudiante = est.getAsignatura().getSemestre().trim();
            }
        }

        if (usuario.getRoles() != null) {
            for (Rol rol : usuario.getRoles()) {
                if (rol != null && rol.getNombre() != null) {
                    String semestreParaEvaluar = "ESTUDIANTE".equalsIgnoreCase(rol.getNombre()) ? semestreEstudiante : null;
                    resultado.addAll(obtenerPermisosActivosPorRolYSemestre(rol.getNombre(), semestreParaEvaluar));
                }
            }
        }

        return resultado;
    }
}
