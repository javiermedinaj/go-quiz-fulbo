# Usar la imagen oficial de Go
FROM golang:1.24-alpine AS builder

# Instalar git (necesario para algunas dependencias)
RUN apk add --no-cache git

# Establecer directorio de trabajo
WORKDIR /app

# Copiar go.mod (go.sum se genera automáticamente)
COPY go.mod ./
RUN go mod download

# Copiar el código fuente del backend
COPY . ./

# Construir la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Imagen final más pequeña
FROM alpine:latest

# Instalar certificados SSL
RUN apk --no-cache add ca-certificates

# Crear directorio de trabajo
WORKDIR /root/

# Copiar el binario compilado
COPY --from=builder /app/main .

# Copiar los archivos JSON de datos
COPY --from=builder /app/cmd/ ./cmd/

# Exponer el puerto
EXPOSE 8080

# Variables de entorno para producción
ENV GIN_MODE=release
ENV PORT=8080
ENV CORS_ORIGIN=*

# Comando para ejecutar la aplicación
CMD ["./main"]
