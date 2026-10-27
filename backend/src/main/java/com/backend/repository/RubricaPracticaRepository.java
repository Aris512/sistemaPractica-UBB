package com.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.backend.model.RubricaPractica;

public interface RubricaPracticaRepository extends JpaRepository<RubricaPractica, Long> {
    List<RubricaPractica> findByPracticaIdPracticaOrderByIdRubrica(Long idPractica);
}
