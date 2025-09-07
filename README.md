# GlobalExchange

## Desarrollo
Levanta el entorno de desarrollo usando el compose de desarrollo.

```bash
docker compose up -d --build  # Construye imagenes y levanta contenedores
docker compose up -d          # Levanta el contenedor de la ultima imagen creada
```

Parar y eliminar contenedores del entorno de desarrollo:

```bash
docker compose down # Añadir "-v" para eliminar los volumenes
```

Comando para limpiar imagenes
```bash
docker image prune  # Elimina imagenes huerfanas
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


