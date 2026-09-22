package com.backend.config;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.logging.Logger;

/**
 * Carga variables de entorno desde un archivo .env si existe.
 * Busca tanto en el directorio actual de ejecución como en el directorio raíz padre (../.env).
 * Las variables se inyectan en System.properties para que Spring Boot y application.properties
 * puedan acceder a ellas de forma natural mediante ${NOMBRE_VARIABLE:default}.
 */
public class DotenvLoader {

    private static final Logger logger = Logger.getLogger(DotenvLoader.class.getName());

    public static void load() {
        File[] candidateFiles = new File[] {
            new File(".env"),
            new File("../.env"),
            new File(System.getProperty("user.dir"), ".env"),
            new File(System.getProperty("user.dir"), "../.env")
        };

        File envFile = null;
        for (File candidate : candidateFiles) {
            if (candidate.exists() && candidate.isFile()) {
                envFile = candidate;
                break;
            }
        }

        if (envFile == null) {
            logger.info("DotenvLoader: No se encontró archivo .env local. Se utilizarán variables de entorno del sistema o valores por defecto.");
            return;
        }

        logger.info("DotenvLoader: Cargando variables desde " + envFile.getAbsolutePath());
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }

                int separatorIndex = line.indexOf('=');
                if (separatorIndex > 0) {
                    String key = line.substring(0, separatorIndex).trim();
                    String value = line.substring(separatorIndex + 1).trim();

                    // Quitar comillas si las tuviese
                    if ((value.startsWith("\"") && value.endsWith("\"")) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length() - 1);
                    }

                    // Solo establecer si no existe previamente como variable de entorno del SO o del sistema
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, value);
                    }
                }
            }
        } catch (IOException e) {
            logger.warning("DotenvLoader: Error al leer archivo .env: " + e.getMessage());
        }
    }
}
