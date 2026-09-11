# ProyectoU

Sistema web desarrollado como proyecto Full Stack utilizando **Spring Boot**, **React**, **MySQL** y **Docker**.

---

## 1. Pasos de ejecución del proyecto

Para levantar el entorno de desarrollo completo:

### Paso 1 — Iniciar Docker
Asegurarse de tener **Docker Desktop** abierto y en ejecución.

### Paso 2 — Iniciar la Base de Datos (MySQL)
Desde la raíz del proyecto:
```bash
docker compose up -d
```

### Paso 3 — Iniciar el Backend
En una terminal:
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
*(O `mvn spring-boot:run` si cuentas con Maven instalado globalmente).*

### Paso 4 — Iniciar el Frontend
En otra terminal:
```bash
cd frontend
npm run dev
```

### Paso 5 — Abrir la aplicación
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend (API):** [http://localhost:8080](http://localhost:8080)

### En caso de que PowerShell no reconozca los comandos

1. **Verificar herramientas instaladas:**
   ```bash
   git --version
   java -version
   node -v
   npm -v
   docker --version
   docker compose version
   ```

2. **Si algún comando da error de comando no reconocido**, agregarlo al `PATH` de Windows:
   - Presionar `Win + R`, escribir `sysdm.cpl` y presionar **Enter**.
   - Ir a **Opciones avanzadas** → **Variables de entorno...**
   - En la sección de variables (de usuario o del sistema), seleccionar **`Path`** y pulsar **Editar**.
   - Hacer clic en **Nuevo** y añadir la ruta que corresponda:
     - **Git:** `C:\Program Files\Git\cmd`
     - **Node.js:** `C:\Program Files\nodejs\`
     - **npm:** `%AppData%\npm`
   - Aceptar en todas las ventanas y **reiniciar la terminal** (PowerShell) para aplicar los cambios.

---

## 2. Requisitos previos

Antes de ejecutar el proyecto, verificar las instalaciones necesarias:

- **Java 21** y **Maven** (`java -version`, `mvn -version`)
- **Node.js (versión LTS)** y **npm** (`node -v`, `npm -v`)
- **Docker Desktop** y **Docker Compose** (`docker --version`, `docker compose version`)
- **Git** (`git --version`)
- **MySQL Workbench** *(opcional, para visualizar la base de datos)*

---

## 3. Tecnologías utilizadas

- **Backend:** Java 21, Spring Boot, Spring Web, Spring Data JPA, Hibernate, Maven, MySQL Connector/J.
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Base UI, Lucide Icons.
- **Base de Datos & Contenedores:** MySQL 8.4, Docker, Docker Compose.

---

## 4. Estructura del proyecto

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

## 5. Configuración de MySQL

MySQL se ejecuta mediante Docker Compose con los siguientes parámetros de conexión:

- **Host:** `127.0.0.1`
- **Puerto:** `3306`
- **Base de datos:** `proyecto_db`
- **Usuario:** `proyecto_user`
- **Contraseña:** `proyecto_pass`
- **Root Password:** `root_pass`
- **Volumen de datos:** `mysql_data`

---

## 6. Componentes del Frontend (shadcn/ui)

Los componentes de interfaz residen en `frontend/src/components/ui/`.

Para añadir nuevos componentes mediante el CLI de shadcn/ui, ejecutar desde la carpeta `frontend`:
```bash
npx shadcn@latest add [componente]
```
*Ejemplo:*
```bash
npx shadcn@latest add button
```

---

## 7. Comandos útiles

### Docker
```bash
docker compose up -d    # Iniciar servicios en segundo plano
docker ps               # Ver contenedores activos
docker compose logs     # Ver logs de los servicios
docker compose down     # Detener servicios
```

### Backend
```bash
cd backend
mvn spring-boot:run     # Ejecutar servidor de desarrollo
mvn clean package       # Compilar y empaquetar el proyecto
```

### Frontend
```bash
cd frontend
npm install             # Instalar dependencias
npm run dev             # Iniciar servidor de desarrollo
npm run build           # Compilar para producción
npm run preview         # Previsualizar compilación de producción
```

---

## 8. Reglas de desarrollo

1. No desarrollar funcionalidades de negocio sin revisar previamente los requerimientos.
2. Mantener separadas las responsabilidades de frontend, backend y base de datos.
3. Evitar colocar lógica de negocio directamente en los controladores; utilizar servicios.
4. Utilizar repositorios para el acceso a datos.
5. Mantener los componentes de React organizados y reutilizables.
6. Utilizar TypeScript correctamente y evitar el uso de `any`.
7. No almacenar contraseñas o credenciales reales en el repositorio.
8. Probar las funcionalidades antes de considerarlas terminadas.
9. Documentar cambios importantes.
10. No eliminar configuraciones existentes sin verificar sus dependencias.