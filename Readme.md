# ProyectoU

Sistema web Full Stack para la gestión de prácticas de la carrera, construido con
**Spring Boot 4**, **React 19 + TypeScript (Vite)**, **MySQL 8.4** y **Docker**.

Este documento explica, paso a paso, cómo levantar el proyecto **desde cero** en
una máquina nueva. Si sigues las instrucciones en orden deberías poder ejecutar
todo sin preguntar a nadie.

---

## 1. Requisitos previos

Instala las herramientas en las versiones acordadas por el equipo. **Todos los
integrantes deben usar las mismas versiones** para evitar diferencias.

```bash
git --version
java -version
node -v
npm -v
docker --version
docker compose version
```

| Herramienta    | Versión | Dónde queda fijada                                          |
|----------------|---------|-------------------------------------------------------------|
| Java (JDK)     | 21      | `backend/pom.xml` (`<java.version>`)                        |
| Maven          | 3.9.x   | `backend/.mvn/wrapper/maven-wrapper.properties` (wrapper)   |
| MySQL          | 8.4     | `docker-compose.yml` (`image: mysql:8.4`)                   |
| Node.js        | 22      | `frontend/package.json` (`engines`) y `frontend/.nvmrc`     |
| Docker Compose | v2      | `docker-compose.yml`                                        |

> No necesitas instalar Maven ni MySQL a mano: el primero viene con el *wrapper*
> (`mvnw`) y el segundo corre en un contenedor Docker.

### Versiones verificadas por integrante

| Integrante        | `java -version` | `mysql --version` | `node -v` |
|-------------------|-----------------|-------------------|-----------|
| Sebastian Cadiz   |                 |                   |           |
| Pedro Merino      |                 |                   |           |
| Cristobal Muñoz   |                 |                   |           |
| Javier Toro       |                 |                   |           |
| *(completar)*     |                 |                   |           |

---

## 2. Configuración inicial (una sola vez)

### 2.1 Variables de entorno del backend / base de datos

En la **raíz del proyecto** existe una plantilla `.env.example`. Cópiala a `.env`
y completa las contraseñas:

```bash
cp .env.example .env
```

Edita `.env` y define al menos:

```env
DB_URL=jdbc:mysql://localhost:3306/proyecto_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
DB_USER=proyecto_user
DB_PASSWORD=elige_una_password
DB_ROOT_PASSWORD=elige_otra_password

ADMIN_BASIC_USERNAME=tu_usuario_admin
ADMIN_BASIC_PASSWORD=tu_contrasena_segura
```

> El archivo `.env` **nunca** se sube a Git (está en `.gitignore`).
> Solo se versiona `.env.example`, sin valores reales.

### 2.2 Variables de entorno del frontend

```bash
cp frontend/.env.example frontend/.env
```

El valor por defecto (`VITE_API_URL=http://localhost:8080`) sirve para desarrollo
local. Cambia esa URL si el backend corre en otro host/puerto.

---

## 3. Puesta en marcha (paso a paso)

Ejecuta los pasos en este orden. Usa **una terminal para el backend** y **otra
para el frontend**.

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/Aris512/sistemaPractica-UBB.git
cd sistemaPractica-UBB
```

### Paso 2 — Abrir Docker Desktop

Docker debe estar **abierto y en ejecución** antes del siguiente paso.

### Paso 3 — Levantar la base de datos (MySQL)

Desde la raíz del proyecto (donde está `docker-compose.yml`):

```bash
docker compose up -d
```

Esto crea el contenedor `proyecto-mysql` con la base `${DB_NAME:-proyecto_db}`.
Comprueba que quedó arriba:

```bash
docker ps
```

### Paso 4 — Iniciar el backend

```bash
cd backend

# Windows (PowerShell / CMD):
.\mvnw.cmd spring-boot:run

# Linux / macOS:
./mvnw spring-boot:run
```

La primera vez descarga dependencias (puede tardar). El backend queda en
**http://localhost:8080**. Al arrancar, **Flyway aplica las migraciones**
automáticamente (crea el esquema) e Hibernate solo *valida* que coincida.

### Paso 5 — Iniciar el frontend

En otra terminal, desde la raíz:

```bash
cd frontend
npm ci          # instala exactamente lo del package-lock.json (reproducible)
npm run dev
```

El frontend queda en **http://localhost:5173**.

### Paso 6 — Abrir la aplicación

- **Frontend:** http://localhost:5173
- **Backend (API):** http://localhost:8080
- **Panel admin:** http://localhost:5173/admin (usa `ADMIN_BASIC_USERNAME` / `ADMIN_BASIC_PASSWORD`)

---

## 4. Detener el entorno

```bash
# Ctrl + C en las terminales de backend y frontend
docker compose down        # detiene y elimina el contenedor de MySQL
# docker compose down -v    # además borra los datos (¡cuidado!)
```

---

## 5. Estructura del proyecto

```text
sistemaPractica-UBB/
├── backend/
│   ├── .mvn/wrapper/            # wrapper de Maven (no requiere Maven instalado)
│   ├── mvnw / mvnw.cmd
│   ├── src/main/java/           # código Java (Spring Boot)
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/        # migraciones Flyway (V1__esquema_inicial.sql)
│   ├── src/test/                # pruebas JUnit (perfil "test" con H2)
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/          # componentes React
│   │   ├── services/            # llamadas a la API (usan VITE_API_URL)
│   │   └── vite-env.d.ts        # tipos de las variables VITE_*
│   ├── .env.example
│   ├── .nvmrc
│   ├── package.json
│   └── vite.config.ts
│
├── .github/dependabot.yml       # actualizaciones automáticas de dependencias
├── .env.example                 # variables de entorno (plantilla)
├── docker-compose.yml           # MySQL 8.4
└── Readme.md
```

---

## 6. Tecnologías utilizadas

- **Backend:** Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA (Hibernate),
  Spring Security, Flyway, Apache POI, Maven Wrapper.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Base UI, Lucide Icons.
- **Base de datos y contenedores:** MySQL 8.4, Docker, Docker Compose.
- **Pruebas:** JUnit 5 + H2 (perfil `test`, no requiere Docker ni MySQL).

---

## 7. Base de datos y migraciones

MySQL corre en Docker Compose. Las credenciales **no** viven en el código: se leen
del archivo `.env`.

| Variable           | Descripción                              | Valor por defecto |
|--------------------|------------------------------------------|-------------------|
| `DB_URL`           | URL JDBC de conexión                     | `jdbc:mysql://localhost:3306/proyecto_db...` |
| `DB_USER`          | Usuario de la aplicación                 | `proyecto_user`   |
| `DB_PASSWORD`      | Contraseña del usuario                   | *(sin valor)*     |
| `DB_NAME`          | Nombre de la base (docker-compose)       | `proyecto_db`     |
| `DB_ROOT_PASSWORD` | Contraseña `root` del contenedor         | *(sin valor)*     |

Las tablas se crean mediante **Flyway** (`backend/src/main/resources/db/migration/`).
Hibernate está en `ddl-auto=validate`, por lo que **no** modifica el esquema: solo
verifica que las entidades coincidan con las migraciones. Para añadir un cambio de
esquema, crea una nueva migración `V2__descripcion.sql` (nunca edites una ya aplicada).

---

## 8. Perfiles de Spring

El backend tiene 3 perfiles:

| Perfil | Archivo                 | Uso                                             |
|--------|-------------------------|-------------------------------------------------|
| `dev`  | `application-dev.yml`   | Desarrollo local (SQL visible, logs debug). Por defecto. |
| `prod` | `application-prod.yml`  | Producción (exige `DB_URL`/`DB_USER`/`DB_PASSWORD`, sin valores por defecto). |
| `test` | `application-test.yml`  | Pruebas con H2 en memoria.                       |

Para elegir un perfil:

```bash
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## 9. Comandos útiles

### Docker
```bash
docker compose up -d        # iniciar MySQL en segundo plano
docker ps                   # ver contenedores activos
docker compose logs -f      # ver logs de MySQL
docker compose down         # detener servicios
```

### Backend
```bash
cd backend
.\mvnw.cmd spring-boot:run          # servidor de desarrollo
.\mvnw.cmd test                     # ejecutar pruebas (H2, sin Docker)
.\mvnw.cmd clean package            # compilar y empaquetar (genera el .jar)
.\mvnw.cmd dependency:tree          # ver el árbol de dependencias
```

### Frontend
```bash
cd frontend
npm ci                      # instalar dependencias de forma reproducible
npm run dev                 # servidor de desarrollo
npm run build               # compilar para producción
npm run preview             # previsualizar la compilación de producción
npm run lint                # revisar estilo con ESLint
npm audit                   # revisar vulnerabilidades de dependencias
```

---

## 10. Solución de problemas

**`docker compose up` falla porque el puerto 3306 está ocupado.**
Tienes otro MySQL/MariaDB local (por ejemplo XAMPP) usando el 3306. Detén ese
servicio o cambia el mapeo de puertos en `docker-compose.yml`
(`"3307:3306"`) y ajusta el puerto en `DB_URL`.

**El backend no conecta a la base de datos.**
Revisa que el contenedor esté arriba (`docker ps`) y que `DB_PASSWORD`/`DB_USER`
en `.env` coincidan con los de `docker-compose.yml`.

**`npm run dev` o `node -v` dan error de comando no reconocido.**
Agrega Node.js al `PATH`: `Win + R` → `sysdm.cpl` → **Opciones avanzadas** →
**Variables de entorno** → edita **`Path`** y añade `C:\Program Files\nodejs\`.
Reinicia la terminal.

**`.\mvnw.cmd` no se reconoce.**
Asegúrate de estar dentro de `backend/` y de tener Java 21 instalado
(`java -version`). El wrapper no requiere Maven global.

**El frontend no llega al backend.**
Verifica `frontend/.env` (`VITE_API_URL`) y que el backend esté corriendo en el
puerto indicado.

---

## 11. Reglas de desarrollo

1. No desarrollar funcionalidades de negocio sin revisar antes los requerimientos.
2. Mantener separadas las responsabilidades de frontend, backend y base de datos.
3. No poner lógica de negocio en los controladores: usar servicios.
4. Acceder a los datos mediante repositorios.
5. Mantener los componentes de React organizados y reutilizables.
6. Usar TypeScript correctamente y evitar `any`.
7. **No** almacenar contraseñas ni credenciales reales en el repositorio.
8. Probar las funcionalidades antes de darlas por terminadas.
9. Documentar los cambios importantes.
10. No eliminar configuraciones existentes sin verificar de qué dependen.
11. No editar migraciones de Flyway ya aplicadas; añadir una nueva versión.
12. Los cambios de esquema se versionan en `backend/src/main/resources/db/migration/`.
