package com.backend.config;

import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger logger = Logger.getLogger(SecurityConfig.class.getName());

    /**
     * Credenciales del panel admin cargadas desde variables de entorno o archivo .env.
     * Se usa un valor centinela imposible de predecir (__NOT_SET__) para detectar cuándo
     * no se configuraron explícitamente; en ese caso el acceso a /admin queda bloqueado.
     */
    @Value("${admin.basic.username:__NOT_SET__}")
    private String adminUsername;

    @Value("${admin.basic.password:__NOT_SET__}")
    private String adminPassword;

    /** Indica si las credenciales de admin fueron configuradas explícitamente vía .env / variables de entorno */
    private boolean adminCredencialesConfiguradas = false;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Permitir peticiones preflight CORS OPTIONS sin autenticacion
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                // Solamente la ruta /admin y sus subrutas requieren autenticacion con popup nativo
                .requestMatchers("/admin", "/admin/**").authenticated()
                // Todas las demas rutas (/api/**, /, etc.) permanecen publicas
                .anyRequest().permitAll()
            )
            // Activar HTTP Basic Authentication (genera el 401 y header WWW-Authenticate para el popup)
            .httpBasic(basic -> basic.realmName("Admin Area"));

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOriginPatterns(java.util.Collections.singletonList("*"));
        configuration.setAllowedMethods(java.util.Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.Collections.singletonList("*"));
        configuration.setExposedHeaders(java.util.Arrays.asList("Content-Disposition", "Content-Type", "Accept-Ranges"));
        configuration.setAllowCredentials(true);
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        // Verificar si las credenciales fueron configuradas explícitamente (no usan el centinela por defecto)
        boolean usernameOk = adminUsername != null
            && !adminUsername.isBlank()
            && !"__NOT_SET__".equals(adminUsername);
        boolean passwordOk = adminPassword != null
            && !adminPassword.isBlank()
            && !"__NOT_SET__".equals(adminPassword);

        adminCredencialesConfiguradas = usernameOk && passwordOk;

        if (!adminCredencialesConfiguradas) {
            logger.warning(
                "[SecurityConfig] Las credenciales del panel administrador (ADMIN_BASIC_USERNAME / ADMIN_BASIC_PASSWORD) " +
                "NO están configuradas en el archivo .env ni en las variables de entorno del sistema. " +
                "El acceso a /admin permanecerá BLOQUEADO hasta que se configuren correctamente."
            );
            // Crear un usuario con contraseña imposible de adivinar para bloquear toda autenticación
            String impossible = "{bcrypt}" + new BCryptPasswordEncoder().encode(
                java.util.UUID.randomUUID().toString() + System.nanoTime()
            );
            UserDetails bloqueado = User.withUsername("__blocked__")
                .password(impossible)
                .roles("ADMIN")
                .build();
            return new InMemoryUserDetailsManager(bloqueado);
        }

        logger.info("[SecurityConfig] Credenciales del panel administrador cargadas correctamente desde configuración.");
        UserDetails admin = User.builder()
            .username(adminUsername)
            .password(passwordEncoder.encode(adminPassword))
            .roles("ADMIN")
            .build();

        return new InMemoryUserDetailsManager(admin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
