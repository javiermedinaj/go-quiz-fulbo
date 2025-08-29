# Usar la imagen oficial de Go
FROM golang:1.24-alpine AS builder

# Instalar git (necesario para algunas dependencias)
RUN apk add --no-cache git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar go.mod y go.sum (si existe)
COPY go.mod ./
COPY go.su[m] ./
RUN go mod download

# Copiar el código fuente del backend
COPY . ./

# Verificar estructura de archivos y construir la aplicación
RUN ls -la ./
RUN ls -la ./cmd/
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -v -o main ./cmd/api

# Imagen final más pequeña
FROM alpine:latest

# Instalar certificados SSL
RUN apk --no-cache add ca-certificates

# Crear directorio de trabajo
WORKDIR /root/

# Copiar el binario compilado
COPY --from=builder /app/main .

# Crear estructura de directorios para los archivos JSON
RUN mkdir -p cmd/scrape_bundesliga cmd/scrape_laliga cmd/scrape_ligue1 cmd/scrape_premier cmd/scrape_seriea

# Copiar los archivos JSON de datos
COPY --from=builder /app/*.json ./
COPY --from=builder /app/cmd/scrape_bundesliga/*.json ./cmd/scrape_bundesliga/
COPY --from=builder /app/cmd/scrape_laliga/*.json ./cmd/scrape_laliga/
COPY --from=builder /app/cmd/scrape_ligue1/*.json ./cmd/scrape_ligue1/
COPY --from=builder /app/cmd/scrape_premier/*.json ./cmd/scrape_premier/
COPY --from=builder /app/cmd/scrape_seriea/*.json ./cmd/scrape_seriea/

# Exponer el puerto
EXPOSE 8080

# Variables de entorno para producción
ENV GIN_MODE=release
ENV PORT=8080
ENV CORS_ORIGIN=*

# Comando para ejecutar la aplicación
CMD ["./main"]
