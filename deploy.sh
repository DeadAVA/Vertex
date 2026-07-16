#!/bin/bash
set -e

echo "▶ Cargando variables de .env.prod..."
set -a
source .env.prod
set +a

echo "▶ Construyendo imagen Docker..."
docker compose build

echo "▶ Levantando servicios..."
docker compose up -d

echo "▶ Descargando modelos de Ollama (puede tardar varios minutos)..."
sleep 5
docker exec vertex-ollama ollama pull qwen2.5:14b
docker exec vertex-ollama ollama pull moondream

echo ""
echo "✅ Deploy completo. App corriendo en http://localhost:3000"
echo ""
echo "Comandos útiles:"
echo "  docker compose logs -f app     → ver logs de la app"
echo "  docker compose down            → detener todo"
echo "  docker compose restart app     → reiniciar solo la app"
