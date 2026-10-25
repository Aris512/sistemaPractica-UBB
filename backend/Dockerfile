# Backend Spring Boot (Java 21). Imagen en dos etapas: se compila con Maven y solo el .jar
# pasa a la imagen final, que lleva únicamente el JRE.

FROM docker.io/library/maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
# Las dependencias se descargan en una capa aparte para reutilizarlas si solo cambia el código.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM docker.io/library/eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 --home-dir /app springboot \
    && mkdir -p /app/uploads \
    && chown -R springboot /app
COPY --from=build /build/target/backend-*.jar /app/app.jar
USER springboot
# Los archivos subidos se guardan en /app/uploads (ruta relativa "uploads" del código); en
# docker-compose.prod.yml se monta un volumen ahí para que sobrevivan a los reinicios.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
