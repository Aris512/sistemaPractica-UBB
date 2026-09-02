# ProyectoU

Sistema web desarrollado como proyecto Full Stack utilizando **Spring Boot**, **React**, **MySQL** y **Docker**.

> **Estado actual:** configuración inicial del proyecto y conexión Backend → MySQL funcionando. El módulo `Usuario` corresponde únicamente a una prueba técnica de conexión y persistencia, por lo que no representa todavía una funcionalidad definitiva del sistema.

---

## 1. Tecnologías utilizadas

### Backend

- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Maven
- MySQL Connector/J

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Base UI
- Lucide Icons

### Base de datos

- MySQL 8.4
- Docker
- Docker Compose
- MySQL Workbench *(opcional, recomendado para visualizar la base de datos)*

---

# 2. Requisitos previos

Antes de ejecutar el proyecto se debe tener instalado:

## Java

Se recomienda:

```text
Java 21
```

Verificar instalación:

```bash
java -version
```

También se puede verificar Maven:

```bash
mvn -version
```

---

## Node.js

Se necesita Node.js para ejecutar el frontend.

Verificar:

```bash
node -v
```

y:

```bash
npm -v
```

Se recomienda utilizar una versión LTS de Node.js.

---

## Docker Desktop

Docker es necesario para ejecutar MySQL mediante Docker Compose.

Verificar:

```bash
docker --version
```

y:

```bash
docker compose version
```

Docker Desktop debe estar iniciado antes de levantar la base de datos.

---

## MySQL Workbench

Es opcional.

Se recomienda utilizarlo para revisar visualmente las tablas, registros y estructura de la base de datos.

---

## Git

Es opcional para trabajar con el repositorio.

Verificar:

```bash
git --version
```

---

# 3. Estructura del proyecto

Actualmente el proyecto tiene la siguiente estructura:

```text
proyectoU/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   │
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

---

# 4. Arquitectura del proyecto

La aplicación está dividida en tres partes principales:

```text
                    ┌─────────────────────┐
                    │      FRONTEND       │
                    │                     │
                    │ React + TypeScript  │
                    │ Vite + Tailwind     │
                    │ shadcn/ui           │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │       BACKEND       │
                    │                     │
                    │    Spring Boot      │
                    │    Spring Web       │
                    │    Spring Data JPA  │
                    └──────────┬──────────┘
                               │
                               │ JDBC / JPA
                               │
                               ▼
                    ┌─────────────────────┐
                    │      DATABASE       │
                    │                     │
                    │      MySQL 8.4      │
                    │      Docker         │
                    └─────────────────────┘
```

---

# 5. Configuración de MySQL

MySQL se ejecuta mediante Docker Compose.

El archivo:

```text
docker-compose.yml
```

contiene actualmente:

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: proyecto-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: proyecto_db
      MYSQL_USER: proyecto_user
      MYSQL_PASSWORD: proyecto_pass
      MYSQL_ROOT_PASSWORD: root_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

## Datos de conexión

```text
Host:       127.0.0.1
Puerto:     3306
Base datos: proyecto_db
Usuario:    proyecto_user
Password:   proyecto_pass
```

---

# 6. Ejecutar MySQL

Desde la carpeta raíz del proyecto:

```bash
docker compose up -d
```

Comprobar que el contenedor está funcionando:

```bash
docker ps
```

Debería aparecer:

```text
proyecto-mysql
```

Para detener MySQL:

```bash
docker compose down
```

Para detenerlo sin eliminar los datos:

```bash
docker compose down
```

Los datos se almacenan en el volumen:

```text
mysql_data
```

---

# 7. Ejecutar el Backend

Entrar a la carpeta:

```bash
cd backend
```

En Windows también se puede utilizar:

```powershell
cd .\backend
```

Ejecutar Spring Boot:

```bash
mvn spring-boot:run
```

El backend estará disponible en:

```text
http://localhost:8080
```

---

## Configuración del Backend

Actualmente la conexión está configurada en:

```text
backend/src/main/resources/application.properties
```

Configuración actual:

```properties
spring.application.name=backend

spring.datasource.url=jdbc:mysql://localhost:3306/proyecto_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=proyecto_user
spring.datasource.password=proyecto_pass
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

> Para un entorno de producción se deberán utilizar variables de entorno o un sistema seguro de configuración de credenciales.

---

# 8. Ejecutar el Frontend

Entrar a:

```bash
cd frontend
```

Instalar las dependencias:

```bash
npm install
```

Ejecutar el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará una dirección similar a:

```text
http://localhost:5173
```

Abrir dicha dirección en el navegador.

---

# 9. Dependencias principales del Frontend

El frontend utiliza:

### React

Framework/librería principal para construir la interfaz.

### Vite

Herramienta utilizada para ejecutar y construir el proyecto frontend.

### TypeScript

Permite utilizar tipado estático en JavaScript.

### Tailwind CSS

Framework utilizado para los estilos.

### shadcn/ui

Sistema de componentes de interfaz cuyos componentes se incorporan directamente al proyecto.

### Base UI

Librería utilizada actualmente como base para los componentes de shadcn/ui.

### Lucide

Librería utilizada para iconos.

---

# 10. Componentes shadcn/ui

Los componentes de shadcn/ui se encuentran en:

```text
frontend/src/components/ui/
```

Por ejemplo:

```text
frontend/src/components/ui/button.tsx
```

Los componentes no se consideran una dependencia completamente cerrada.

El código del componente queda dentro del proyecto y puede ser modificado cuando sea necesario.

Para agregar componentes se utilizará el CLI de shadcn/ui.

Ejemplo:

```bash
npx shadcn@latest add button
```

---

# 11. Utilidad `cn`

El proyecto utiliza:

```text
frontend/src/lib/utils.ts
```

Este archivo contiene la función utilizada para combinar clases de Tailwind:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

# 12. Prueba actual del Backend

Actualmente existe un recurso de prueba:

```text
/api/usuarios
```

Permite comprobar que:

```text
React / Cliente
       ↓
Spring Boot
       ↓
Spring Data JPA
       ↓
Hibernate
       ↓
MySQL
```

El recurso de prueba permite consultar usuarios:

```http
GET http://localhost:8080/api/usuarios
```

Crear un usuario:

```http
POST http://localhost:8080/api/usuarios
```

y eliminarlo mediante:

```http
DELETE http://localhost:8080/api/usuarios/{id}
```

> Este recurso se utiliza solamente para verificar que la conexión entre Spring Boot y MySQL funciona correctamente. No debe considerarse todavía parte de los requerimientos funcionales definitivos.

---

# 13. Orden recomendado para iniciar el proyecto

Cada vez que se quiera trabajar en el proyecto:

### Paso 1 — Iniciar Docker

Abrir Docker Desktop.

### Paso 2 — Iniciar MySQL

Desde la raíz:

```bash
docker compose up -d
```

### Paso 3 — Iniciar Backend

En otra terminal:

```bash
cd backend
mvn spring-boot:run
```

### Paso 4 — Iniciar Frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

### Paso 5 — Abrir el sistema

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8080
```

---

# 14. Puertos utilizados

| Servicio | Puerto |
|---|---:|
| Frontend / Vite | 5173 |
| Backend / Spring Boot | 8080 |
| MySQL | 3306 |

---

# 15. Comandos útiles

## Docker

Iniciar servicios:

```bash
docker compose up -d
```

Ver contenedores:

```bash
docker ps
```

Ver logs:

```bash
docker compose logs
```

Detener servicios:

```bash
docker compose down
```

---

## Backend

Ejecutar:

```bash
mvn spring-boot:run
```

Compilar:

```bash
mvn clean package
```

---

## Frontend

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
npm run dev
```

Compilar para producción:

```bash
npm run build
```

Previsualizar la compilación:

```bash
npm run preview
```

---

# 16. Reglas de desarrollo

1. No desarrollar funcionalidades de negocio sin revisar previamente los requerimientos.
2. Mantener separadas las responsabilidades de frontend, backend y base de datos.
3. Evitar colocar lógica de negocio directamente en los controladores.
4. Utilizar servicios para la lógica de negocio del backend.
5. Utilizar repositorios para el acceso a datos.
6. Mantener los componentes de React organizados y reutilizables.
7. Utilizar TypeScript correctamente y evitar `any` cuando sea posible.
8. No almacenar contraseñas o credenciales reales directamente en el repositorio.
9. Probar las funcionalidades antes de considerarlas terminadas.
10. Documentar cambios importantes.
11. No eliminar configuraciones existentes sin comprobar qué dependencias tienen.
12. Los componentes de prueba deben diferenciarse de las funcionalidades reales del sistema.

---

# 17. Próximos pasos

El proyecto se encuentra actualmente en la etapa de configuración técnica.

Los próximos pasos deberán realizarse en este orden:

1. Definir y revisar los requerimientos funcionales.
2. Definir los requerimientos no funcionales.
3. Identificar las entidades principales del sistema.
4. Diseñar la base de datos definitiva.
5. Definir la arquitectura del backend.
6. Definir los endpoints de la API REST.
7. Definir la estructura definitiva del frontend.
8. Implementar autenticación y autorización si los requerimientos lo necesitan.
9. Implementar las funcionalidades principales.
10. Realizar pruebas.
11. Preparar el proyecto para producción.

---

# 18. Estado del proyecto

| Área | Estado |
|---|---|
| Estructura del proyecto | ✅ Configurada |
| Spring Boot | ✅ Configurado |
| MySQL | ✅ Configurado |
| Docker | ✅ Configurado |
| Conexión Backend → MySQL | ✅ Verificada |
| React | ✅ Configurado |
| Vite | ✅ Configurado |
| TypeScript | ✅ Configurado |
| Tailwind CSS | ✅ Configurado |
| shadcn/ui | ✅ Configurado |
| Base UI | ✅ Configurado |
| API definitiva | ⏳ Pendiente |
| Modelo de datos definitivo | ⏳ Pendiente |
| Interfaz definitiva | ⏳ Pendiente |
| Funcionalidades del sistema | ⏳ Pendiente de requerimientos |
| Pruebas | ⏳ Pendiente |
| Producción | ⏳ Pendiente |

---

## Nota

Este README se actualizará a medida que avance el desarrollo del proyecto.

Las decisiones de arquitectura y las funcionalidades definitivas deben basarse en los requerimientos del proyecto y no en el código de prueba utilizado durante la configuración inicial.