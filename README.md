#  GlobalExchange

#### Construir y levantar los contenedores (backend/frontend/db)
```bash
docker compose up --build -d
```

#### Ver logs del backend
```bash
docker compose logs -f backend
```

#### Ver logs del frontend
```bash
docker compose logs -f frontend
```


#### Acceder a la terminal del backend
```bash
docker compose exec backend sh
```

#### Acceder a la terminal del frontend
```bash
docker compose exec frontend sh
```

#### Detener los contenedores
```bash
docker compose stop
```
#### Eliminar los contenedores con todos los datos
```bash
docker compose down -v
```


#### Limpieza del sistema (solo si algo falla)

```bash
docker system prune -a --volumes
```
