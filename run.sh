#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"

usage() {
  cat <<USAGE
Usage: ./run.sh [local|docker]

Starts the AIP-PIR system automatically.

Commands:
  local   - Runs the application locally (Deno/Node locally, DB in Docker).
            Calls ./start.sh underneath.
  docker  - Runs the entire application stack in Docker Compose.
            Automatically configures .env and seeds the database.
USAGE
  exit 1
}

if [ "$MODE" = "local" ]; then
  echo "==> Starting local development environment..."
  if [ ! -x "./start.sh" ]; then
    chmod +x ./start.sh
  fi
  exec ./start.sh

elif [ "$MODE" = "docker" ]; then
  echo "==> Starting Docker Compose environment..."
  
  if [ ! -f ".env" ]; then
    echo "==> Creating .env from .env.docker.example..."
    cp .env.docker.example .env
    
    # Generate random secrets for a truly automatic start
    if command -v openssl >/dev/null 2>&1; then
      JWT=$(openssl rand -hex 32)
      EMAIL=$(openssl rand -hex 32)
      BACKUP=$(openssl rand -hex 32)
      DB_PASS=$(openssl rand -hex 16)
      BACKUP_PASS=$(openssl rand -hex 16)
      
      # macOS uses sed -i '', Linux uses sed -i
      if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/change-me-postgres-password/$DB_PASS/" .env
        sed -i '' "s/change-me-jwt-secret/$JWT/" .env
        sed -i '' "s/change-me-email-config-secret/$EMAIL/" .env
        sed -i '' "s/change-me-64-hex-character-backup-key/$BACKUP/" .env
        sed -i '' "s/change-me-backup-db-password/$BACKUP_PASS/" .env
      else
        sed -i "s/change-me-postgres-password/$DB_PASS/" .env
        sed -i "s/change-me-jwt-secret/$JWT/" .env
        sed -i "s/change-me-email-config-secret/$EMAIL/" .env
        sed -i "s/change-me-64-hex-character-backup-key/$BACKUP/" .env
        sed -i "s/change-me-backup-db-password/$BACKUP_PASS/" .env
      fi
      echo "==> Auto-generated random secrets in .env"
    else
      echo "==> Note: Please update the default secrets in .env for production use."
    fi
  fi
  
  docker compose up -d --build
  
  echo "==> Waiting for backend container..."
  sleep 10
  
  echo "==> Running database migrations and seed..."
  # The frontend and backend containers restart unless-stopped, 
  # so if the backend crashes because DB wasn't fully ready, it might restart.
  # We try to run the migration/seed commands gracefully.
  if docker compose ps | grep -q "backend"; then
    docker compose exec backend deno task prisma:deploy || true
    docker compose exec backend deno task prisma:generate || true
    docker compose exec backend deno task seed || true
  else
    echo "==> Backend container not found. You may need to run migrations manually."
  fi
  
  echo ""
  echo "=========================================================="
  echo "==> System is running via Docker Compose!"
  echo "    Frontend: http://localhost"
  echo "    Backend:  http://localhost:3001"
  echo ""
  echo "    To stop the system, run: docker compose down"
  echo "=========================================================="

else
  usage
fi
