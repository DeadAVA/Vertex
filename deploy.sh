#!/bin/bash
set -e

echo "▶ Cargando variables de .env.prod..."
set -a
source .env.prod
set +a

echo "▶ Construyendo imagen Docker..."
docker compose build

echo "▶ Levantando servicios..."
docker compose up -d --remove-orphans

echo ""
echo "✅ Deploy completo. App corriendo en http://localhost:3000"
echo ""
echo "Comandos útiles:"
echo "  docker compose logs -f app     → ver logs de la app"
echo "  docker compose down            → detener todo"
echo "  docker compose restart app     → reiniciar solo la app"
