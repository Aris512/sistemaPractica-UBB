# Frontend React + TypeScript. Node solo se usa para compilar: `npm run build` genera la carpeta
# dist/ (HTML, JS y CSS estáticos), que Nginx sirve en la imagen final junto con el proxy al backend.

FROM docker.io/library/node:24-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM docker.io/library/nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 80
