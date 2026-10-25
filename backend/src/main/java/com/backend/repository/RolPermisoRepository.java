package com.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.backend.model.Permiso;
import com.backend.model.Rol;
import com.backend.model.RolPermiso;

@Repository
public interface RolPermisoRepository extends JpaRepository<RolPermiso, Long> {
    List<RolPermiso> findByRol(Rol rol);
    List<RolPermiso> findByRolIdRol(Long idRol);
    List<RolPermiso> findByRolNombre(String nombre);
    Optional<RolPermiso> findByRolAndPermiso(Rol rol, Permiso permiso);
    Optional<RolPermiso> findByRolIdRolAndPermisoIdPermiso(Long idRol, Long idPermiso);
    void deleteByRol(Rol rol);
}
