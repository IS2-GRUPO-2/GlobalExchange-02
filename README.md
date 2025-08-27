# GlobalExchange

## Desarrollo
Levanta el entorno de desarrollo usando el compose de desarrollo.

```bash
docker compose -f docker-compose.desrr.yml up -d --build 
```

Parar y eliminar contenedores del entorno de desarrollo:

```bash
docker compose -f docker-compose.desrr.yml down
```

## Producción
Actualizar imágenes desde el registro y levantar en producción:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Parar y eliminar contenedores del entorno de producción:
```bash
docker compose -f docker-compose.prod.yml down
```


