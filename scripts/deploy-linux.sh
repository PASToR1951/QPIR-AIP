#!/usr/bin/env bash
set -euo pipefail

# Deploys the AIP-PIR Docker Compose stack from a Linux shell.
# The script creates or updates .env, generates missing secrets, prepares
# runtime folders, starts Compose profiles, and optionally runs the seed.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

FRONTEND_URL="http://localhost"
API_URL="http://localhost:3001"
FRONTEND_PORT="80"
DOMAIN="aip-pir.depedguihulngan.ph"
ENV_FILE=".env"
ENABLE_SSL=false
ENABLE_BACKUP=false
RUN_SEED=false
SKIP_BUILD=false
SKIP_HEALTH_CHECK=false
PREPARE_ONLY=false
CONFIGURE_FIREWALL=false
EXPOSE_BACKEND_PORT=false
ALLOW_SSH=true
ADMIN_CIDR=""
SSH_PORT="22"

FRONTEND_URL_SET=false
API_URL_SET=false
FRONTEND_PORT_SET=false

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-linux.sh [options]

Options:
  --frontend-url URL       Browser URL for the React app.
  --api-url URL            Browser URL for the backend API.
  --frontend-port PORT     Host port binding for the frontend service.
                           Use 127.0.0.1:8080 when --enable-ssl is used.
  --domain DOMAIN          Domain used by the Caddy SSL profile.
  --env-file PATH          Env file to create/use. Default: .env
  --enable-ssl             Start the Caddy profile and use https://DOMAIN defaults.
  --enable-backup          Start the backup profile.
  --seed                   Run the idempotent database seed after startup.
  --expose-backend-port    Bind backend to 0.0.0.0 instead of 127.0.0.1.
  --configure-firewall     Apply UFW rules after preparing .env.
  --admin-cidr CIDR        Admin SSH CIDR for firewall lockdown.
  --ssh-port PORT          SSH port for firewall lockdown. Default: 22
  --no-ssh                 Do not add an SSH allow rule when configuring UFW.
  --skip-build             Run docker compose up without --build.
  --skip-health-check      Do not poll /api/health after startup.
  --prepare-only           Write .env and runtime folders, then stop.
  -h, --help               Show this help.

Examples:
  scripts/deploy-linux.sh --frontend-url http://203.0.113.10 --api-url http://203.0.113.10:3001 --expose-backend-port
  scripts/deploy-linux.sh --enable-ssl --domain aip-pir.example.edu --enable-backup --seed
  scripts/deploy-linux.sh --configure-firewall --admin-cidr 203.0.113.10/32 --enable-ssl
USAGE
}

step() {
  printf '\n==> %s\n' "$1"
}

warn() {
  printf 'WARN: %s\n' "$1" >&2
}

die() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_value() {
  local option="$1"
  local value="${2:-}"
  [ -n "${value}" ] || die "${option} requires a value"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --frontend-url)
      require_value "$1" "${2:-}"
      FRONTEND_URL="$2"
      FRONTEND_URL_SET=true
      shift 2
      ;;
    --api-url)
      require_value "$1" "${2:-}"
      API_URL="$2"
      API_URL_SET=true
      shift 2
      ;;
    --frontend-port)
      require_value "$1" "${2:-}"
      FRONTEND_PORT="$2"
      FRONTEND_PORT_SET=true
      shift 2
      ;;
    --domain)
      require_value "$1" "${2:-}"
      DOMAIN="$2"
      shift 2
      ;;
    --env-file)
      require_value "$1" "${2:-}"
      ENV_FILE="$2"
      shift 2
      ;;
    --enable-ssl)
      ENABLE_SSL=true
      shift
      ;;
    --enable-backup)
      ENABLE_BACKUP=true
      shift
      ;;
    --seed)
      RUN_SEED=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-health-check)
      SKIP_HEALTH_CHECK=true
      shift
      ;;
    --prepare-only)
      PREPARE_ONLY=true
      shift
      ;;
    --configure-firewall)
      CONFIGURE_FIREWALL=true
      shift
      ;;
    --expose-backend-port)
      EXPOSE_BACKEND_PORT=true
      shift
      ;;
    --admin-cidr)
      require_value "$1" "${2:-}"
      ADMIN_CIDR="$2"
      shift 2
      ;;
    --ssh-port)
      require_value "$1" "${2:-}"
      SSH_PORT="$2"
      shift 2
      ;;
    --no-ssh)
      ALLOW_SSH=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

if [ "${ENABLE_SSL}" = true ]; then
  [ "${FRONTEND_URL_SET}" = true ] || FRONTEND_URL="https://${DOMAIN}"
  [ "${API_URL_SET}" = true ] || API_URL="https://${DOMAIN}"
  [ "${FRONTEND_PORT_SET}" = true ] || FRONTEND_PORT="127.0.0.1:8080"
fi

normalize_origin() {
  local value="$1"
  case "${value}" in
    http://*|https://*) ;;
    *) die "URL must start with http:// or https://: ${value}" ;;
  esac

  local scheme="${value%%://*}"
  local rest="${value#*://}"
  local authority="${rest%%/*}"
  authority="${authority%%\?*}"
  authority="${authority%%#*}"
  [ -n "${authority}" ] || die "URL is missing a host: ${value}"

  printf '%s://%s\n' "${scheme}" "${authority}"
}

origin_host() {
  local origin="$1"
  local authority="${origin#*://}"

  if [[ "${authority}" == \[*\]* ]]; then
    authority="${authority%%]*}"
    authority="${authority#\[}"
    printf '%s\n' "${authority}"
    return
  fi

  printf '%s\n' "${authority%%:*}"
}

origin_port() {
  local origin="$1"
  local scheme="${origin%%://*}"
  local authority="${origin#*://}"

  if [[ "${authority}" =~ ^\[[^]]+\]:([0-9]+)$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return
  fi

  if [[ "${authority}" =~ :([0-9]+)$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    return
  fi

  if [ "${scheme}" = "https" ]; then
    printf '443\n'
  else
    printf '80\n'
  fi
}

port_from_binding() {
  local binding="$1"
  printf '%s\n' "${binding##*:}"
}

is_loopback_host() {
  case "$(origin_host "$1")" in
    localhost|127.0.0.1|::1)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

validate_port() {
  local value="$1"
  [[ "${value}" =~ ^[0-9]+$ ]] || die "Invalid port: ${value}"
  [ "${value}" -ge 1 ] && [ "${value}" -le 65535 ] || die "Port out of range: ${value}"
}

hex_secret() {
  local bytes="${1:-32}"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "${bytes}"
    return
  fi

  if command -v od >/dev/null 2>&1; then
    local raw
    raw="$(od -An -N "${bytes}" -tx1 /dev/urandom)"
    printf '%s' "${raw}" | tr -d ' \n'
    return
  fi

  die "openssl or od is required to generate secrets"
}

is_placeholder() {
  local value="${1:-}"
  case "${value}" in
    ""|change-me*|CHANGE_ME*|your-*|\<*\>)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

case "${ENV_FILE}" in
  /*) ENV_PATH="${ENV_FILE}" ;;
  *) ENV_PATH="${REPO_ROOT}/${ENV_FILE}" ;;
esac
ENV_DIR="$(dirname "${ENV_PATH}")"

get_env_entry() {
  local key="$1"
  [ -f "${ENV_PATH}" ] || return 0
  awk -v key="${key}" '
    BEGIN { pattern = "^[[:space:]]*" key "=" }
    $0 ~ pattern {
      sub(/^[[:space:]]*[^=]*=/, "")
      print
      exit
    }
  ' "${ENV_PATH}"
}

set_env_entry() {
  local key="$1"
  local value="$2"
  local overwrite="${3:-true}"
  local current
  current="$(get_env_entry "${key}")"

  if [ "${overwrite}" != "true" ] && ! is_placeholder "${current}"; then
    return
  fi

  mkdir -p "${ENV_DIR}"
  if [ ! -f "${ENV_PATH}" ]; then
    {
      printf '# AIP-PIR production environment\n'
      printf '# Generated by scripts/deploy-linux.sh\n\n'
    } > "${ENV_PATH}"
  fi

  local tmp
  tmp="$(mktemp)"
  awk -v key="${key}" -v value="${value}" '
    BEGIN { pattern = "^[[:space:]]*" key "="; done = 0 }
    $0 ~ pattern {
      print key "=" value
      done = 1
      next
    }
    { print }
    END {
      if (done == 0) print key "=" value
    }
  ' "${ENV_PATH}" > "${tmp}"
  mv "${tmp}" "${ENV_PATH}"
  chmod 600 "${ENV_PATH}" 2>/dev/null || true
}

require_command() {
  local name="$1"
  command -v "${name}" >/dev/null 2>&1 || die "${name} was not found in PATH"
}

FRONTEND_ORIGIN="$(normalize_origin "${FRONTEND_URL}")"
API_ORIGIN="$(normalize_origin "${API_URL}")"
API_PORT="$(origin_port "${API_ORIGIN}")"
validate_port "${API_PORT}"

FRONTEND_PUBLISHED_PORT="$(port_from_binding "${FRONTEND_PORT}")"
validate_port "${FRONTEND_PUBLISHED_PORT}"
validate_port "${SSH_PORT}"

BACKEND_HOST_PORT="${API_PORT}"
if [ "${API_PORT}" = "80" ] || [ "${API_PORT}" = "443" ]; then
  BACKEND_HOST_PORT="3001"
fi

BACKEND_BIND_ADDRESS="127.0.0.1"
if [ "${EXPOSE_BACKEND_PORT}" = true ]; then
  BACKEND_BIND_ADDRESS="0.0.0.0"
fi

if [ "${ENABLE_SSL}" = false ] && ! is_loopback_host "${API_ORIGIN}" && [ "${EXPOSE_BACKEND_PORT}" = false ]; then
  die "Remote direct-HTTP API URLs need --expose-backend-port, or use --enable-ssl."
fi

TRUST_PROXY="false"
TRUSTED_PROXY_CIDRS=""
if [ "${ENABLE_SSL}" = true ] || [[ "${API_ORIGIN}" == https://* ]]; then
  TRUST_PROXY="true"
  TRUSTED_PROXY_CIDRS="10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
fi

step "Preparing environment file"
set_env_entry "POSTGRES_USER" "qpir_admin" "false"
set_env_entry "POSTGRES_PASSWORD" "$(hex_secret 24)" "false"
set_env_entry "POSTGRES_DB" "pir_system" "false"
set_env_entry "POSTGRES_BIND_ADDRESS" "127.0.0.1" "false"
set_env_entry "POSTGRES_PORT" "5432" "false"

set_env_entry "BACKEND_BIND_ADDRESS" "${BACKEND_BIND_ADDRESS}" "true"
set_env_entry "BACKEND_PORT" "${BACKEND_HOST_PORT}" "true"
set_env_entry "FRONTEND_PORT" "${FRONTEND_PORT}" "true"

set_env_entry "JWT_SECRET" "$(hex_secret 32)" "false"
set_env_entry "EMAIL_CONFIG_SECRET" "$(hex_secret 32)" "false"
set_env_entry "ALLOWED_ORIGIN" "${FRONTEND_ORIGIN}" "true"
set_env_entry "VITE_API_URL" "${API_ORIGIN}" "true"
set_env_entry "NODE_ENV" "production" "true"

set_env_entry "OAUTH_REDIRECT_BASE_URL" "${API_ORIGIN}" "true"
set_env_entry "OAUTH_STATE_SECRET" "$(hex_secret 32)" "false"
set_env_entry "GOOGLE_CLIENT_ID" "" "false"
set_env_entry "GOOGLE_CLIENT_SECRET" "" "false"
set_env_entry "RECAPTCHA_SECRET_KEY" "" "false"
set_env_entry "VITE_RECAPTCHA_SITE_KEY" "" "false"
set_env_entry "RECAPTCHA_BYPASS_PRIVATE_IPS" "false" "false"

set_env_entry "TRUST_PROXY" "${TRUST_PROXY}" "true"
set_env_entry "TRUSTED_PROXY_CIDRS" "${TRUSTED_PROXY_CIDRS}" "true"
set_env_entry "APP_DOMAIN" "${DOMAIN}" "true"
set_env_entry "HTTP_BIND_ADDRESS" "0.0.0.0" "false"
set_env_entry "HTTPS_BIND_ADDRESS" "0.0.0.0" "false"

set_env_entry "SEED_ADMIN_EMAIL" "admin@qpir.local" "false"
set_env_entry "SEED_ADMIN_PASSWORD" "$(hex_secret 18)" "false"
set_env_entry "SEED_ADMIN_MUST_CHANGE_PASSWORD" "true" "false"

set_env_entry "BACKUP_DB_USER" "backup_reader" "false"
set_env_entry "BACKUP_DB_PASSWORD" "$(hex_secret 24)" "false"
set_env_entry "BACKUP_ENCRYPTION_KEY" "$(hex_secret 32)" "false"
set_env_entry "BACKUP_RETENTION_DAYS" "14" "false"
set_env_entry "BACKUP_CLOUD_ENABLED" "false" "false"
set_env_entry "BACKUP_RCLONE_REMOTE" "my_remote" "false"
set_env_entry "BACKUP_RCLONE_PATH" "/AIP-PIR-Backups" "false"
set_env_entry "RCLONE_CONFIG_DIR" "./.docker/rclone" "false"
printf 'Environment ready: %s\n' "${ENV_FILE}"

step "Preparing runtime folders"
mkdir -p backups/hourly backups/daily backups/triggers
if [ "${ENABLE_BACKUP}" = true ]; then
  mkdir -p .docker/rclone
fi

if [ "${CONFIGURE_FIREWALL}" = true ]; then
  step "Configuring UFW"
  firewall_args=(--apply --ssh-port "${SSH_PORT}")

  if [ "${ALLOW_SSH}" = true ]; then
    [ -n "${ADMIN_CIDR}" ] || die "--configure-firewall requires --admin-cidr, unless --no-ssh is used"
    firewall_args+=(--admin-cidr "${ADMIN_CIDR}")
  else
    firewall_args+=(--no-ssh)
  fi

  if [ "${ENABLE_SSL}" = true ]; then
    firewall_args+=(--public-port 80 --public-port 443)
  else
    firewall_args+=(--public-port "${FRONTEND_PUBLISHED_PORT}")
    if [ "${EXPOSE_BACKEND_PORT}" = true ]; then
      firewall_args+=(--public-port "${BACKEND_HOST_PORT}")
    fi
  fi

  bash scripts/lockdown-linux-ufw.sh "${firewall_args[@]}"
fi

if [ "${PREPARE_ONLY}" = true ]; then
  step "Prepare-only mode complete"
  printf 'Review %s, then rerun without --prepare-only to start Docker.\n' "${ENV_FILE}"
  exit 0
fi

step "Checking Docker"
require_command docker
docker version >/dev/null
docker compose version >/dev/null

step "Starting Docker Compose stack"
compose_args=(compose --env-file "${ENV_FILE}")
if [ "${ENABLE_SSL}" = true ]; then
  compose_args+=(--profile ssl)
fi
if [ "${ENABLE_BACKUP}" = true ]; then
  compose_args+=(--profile backup)
fi
compose_args+=(up -d)
if [ "${SKIP_BUILD}" = false ]; then
  compose_args+=(--build)
fi

docker "${compose_args[@]}"
docker compose --env-file "${ENV_FILE}" ps

if [ "${SKIP_HEALTH_CHECK}" = false ]; then
  step "Checking backend health"
  if command -v curl >/dev/null 2>&1; then
    healthy=false
    for _ in $(seq 1 30); do
      if curl -fsS --max-time 5 "${API_ORIGIN}/api/health" >/dev/null; then
        healthy=true
        break
      fi
      sleep 3
    done

    if [ "${healthy}" = true ]; then
      printf 'Backend health check passed: %s/api/health\n' "${API_ORIGIN}"
    else
      warn "Backend health did not pass yet. Check: docker compose --env-file ${ENV_FILE} logs backend --tail=100"
    fi
  else
    warn "curl not found; skipping health check."
  fi
fi

if [ "${RUN_SEED}" = true ]; then
  step "Running database seed"
  docker compose --env-file "${ENV_FILE}" exec -T backend deno run -A scripts/seed.ts
  printf 'Seed complete. Bootstrap admin email is stored in %s as SEED_ADMIN_EMAIL.\n' "${ENV_FILE}"
  printf 'Bootstrap admin password is stored in %s as SEED_ADMIN_PASSWORD.\n' "${ENV_FILE}"
fi

step "Deployment complete"
printf 'Frontend: %s\n' "${FRONTEND_ORIGIN}"
printf 'Backend:  %s\n' "${API_ORIGIN}"
printf '\nUseful commands:\n'
printf '  docker compose --env-file %s ps\n' "${ENV_FILE}"
printf '  docker compose --env-file %s logs backend --tail=100\n' "${ENV_FILE}"
printf '  docker compose --env-file %s logs frontend --tail=100\n' "${ENV_FILE}"
if [ "${ENABLE_SSL}" = true ]; then
  printf '  docker compose --env-file %s --profile ssl logs caddy --tail=100\n' "${ENV_FILE}"
fi
if [ "${ENABLE_BACKUP}" = true ]; then
  printf '  docker compose --env-file %s --profile backup logs backup --tail=100\n' "${ENV_FILE}"
fi
