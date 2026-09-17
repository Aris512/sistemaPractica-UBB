package com.backend.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.backend.dto.DireccionDTO;

@Service
public class DireccionService {

    private final RestClient restClient;
    private static final String PHOTON_BASE_URL = "https://photon.komoot.io/api";

    // Coordenadas de referencia en Chillán, Chile para priorizar resultados locales
    private static final double CHILLAN_LAT = -36.6067;
    private static final double CHILLAN_LON = -72.1034;

    public DireccionService() {
        this.restClient = RestClient.builder()
                .baseUrl(PHOTON_BASE_URL)
                .build();
    }

    @SuppressWarnings("unchecked")
    public List<DireccionDTO> buscarDirecciones(String query, Integer limit) {
        if (query == null || query.trim().length() < 3) {
            return Collections.emptyList();
        }

        int maxLimit = (limit != null && limit > 0 && limit <= 15) ? limit : 5;

        try {
            Map<String, Object> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("q", query.trim())
                            .queryParam("limit", maxLimit)
                            .queryParam("lat", CHILLAN_LAT)
                            .queryParam("lon", CHILLAN_LON)
                            .build())
                    .retrieve()
                    .body(Map.class);

            if (response == null || !response.containsKey("features")) {
                return Collections.emptyList();
            }

            List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");
            List<DireccionDTO> resultados = new ArrayList<>();

            for (Map<String, Object> feature : features) {
                Map<String, Object> properties = (Map<String, Object>) feature.get("properties");
                Map<String, Object> geometry = (Map<String, Object>) feature.get("geometry");

                if (properties == null) continue;

                String countryCode = (String) properties.get("countrycode");
                // Priorizar / filtrar por Chile cuando esté disponible
                if (countryCode != null && !countryCode.equalsIgnoreCase("CL")) {
                    continue;
                }

                String name = (String) properties.get("name");
                String street = (String) properties.get("street");
                String housenumber = (String) properties.get("housenumber");
                String city = (String) properties.get("city");
                if (city == null) {
                    city = (String) properties.get("locality");
                }
                String state = (String) properties.get("state");
                String country = (String) properties.get("country");

                // Coordenadas [longitud, latitud] en GeoJSON
                Double lat = null;
                Double lon = null;
                if (geometry != null && geometry.containsKey("coordinates")) {
                    List<Number> coords = (List<Number>) geometry.get("coordinates");
                    if (coords != null && coords.size() >= 2) {
                        lon = coords.get(0).doubleValue();
                        lat = coords.get(1).doubleValue();
                    }
                }

                // Construcción de la dirección formateada
                StringBuilder dirBuilder = new StringBuilder();
                String mainStreet = street != null ? street : name;
                if (mainStreet != null) {
                    dirBuilder.append(mainStreet);
                }
                if (housenumber != null && !housenumber.isBlank()) {
                    dirBuilder.append(" ").append(housenumber);
                }
                if (city != null && !city.isBlank()) {
                    if (dirBuilder.length() > 0) dirBuilder.append(", ");
                    dirBuilder.append(city);
                }
                if (state != null && !state.isBlank()) {
                    if (dirBuilder.length() > 0) dirBuilder.append(", ");
                    dirBuilder.append(state);
                }

                DireccionDTO dto = new DireccionDTO(
                        dirBuilder.toString(),
                        mainStreet,
                        housenumber,
                        city,
                        state,
                        country != null ? country : "Chile",
                        lat,
                        lon
                );

                resultados.add(dto);
            }

            return resultados;
        } catch (Exception e) {
            System.err.println("Error al consultar Photon API: " + e.getMessage());
            return Collections.emptyList();
        }
    }
}
