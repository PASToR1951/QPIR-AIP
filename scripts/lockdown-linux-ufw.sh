#!/usr/bin/env bash
set -euo pipefail

# Locks down a Linux server/VM with UFW.
#
# Dry-run by default. Pass --apply to actually change the firewall.
# Public ports allowed by default: 80/tcp and 443/tcp.
# Admin SSH is allowed only when --admin-cidr is supplied, unless --no-ssh is used.
#
# Examples:
#   bash scripts/lockdown-linux-ufw.sh
#   bash scripts/lockdown-linux-ufw.sh --apply --admin-cidr 203.0.113.10/32
#   bash scripts/lockdown-linux-ufw.sh --apply --admin-cidr 203.0.113.10/32 --ssh-port 2222
#   bash scripts/lockdown-linux-ufw.sh --apply --admin-cidr 203.0.113.10/32 --public-port 80 --public-port 3001
#   bash scripts/lockdown-linux-ufw.sh --apply --no-ssh

APPLY=false
ADMIN_CIDR=""
SSH_PORT="22"
ALLOW_SSH=true
PUBLIC_PORTS=("80" "443")
PUBLIC_PORTS_CUSTOM=false

usage() {
  sed -n '1,14p' "$0"
}

run_cmd() {
  if [ "$APPLY" = true ]; then
    printf '+ %q ' "$@"
    printf '\n'
    "$@"
  else
    printf '[dry-run] '
    printf '%q ' "$@"
    printf '\n'
  fi
}

validate_port() {
  local value="$1"
  if ! [[ "$value" =~ ^[0-9]+$ ]] || [ "$value" -lt 1 ] || [ "$value" -gt 65535 ]; then
    echo "Invalid TCP port: $value" >&2
    exit 2
  fi
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --apply)
      APPLY=true
      shift
      ;;
    --admin-cidr)
      ADMIN_CIDR="${2:-}"
      if [ -z "$ADMIN_CIDR" ]; then
        echo "Missing value for --admin-cidr" >&2
        exit 2
      fi
      shift 2
      ;;
    --ssh-port)
      SSH_PORT="${2:-}"
      if [ -z "$SSH_PORT" ]; then
        echo "Missing value for --ssh-port" >&2
        exit 2
      fi
      validate_port "$SSH_PORT"
      shift 2
      ;;
    --public-port)
      public_port="${2:-}"
      if [ -z "$public_port" ]; then
        echo "Missing value for --public-port" >&2
        exit 2
      fi
      validate_port "$public_port"
      if [ "$PUBLIC_PORTS_CUSTOM" = false ]; then
        PUBLIC_PORTS=()
        PUBLIC_PORTS_CUSTOM=true
      fi
      PUBLIC_PORTS+=("$public_port")
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
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if ! command -v ufw >/dev/null 2>&1; then
  echo "ufw is not installed. Install it first, for example: sudo apt-get install ufw" >&2
  exit 1
fi

if [ "$ALLOW_SSH" = true ] && [ -z "$ADMIN_CIDR" ] && [ "$APPLY" = true ]; then
  cat >&2 <<'EOF'
Refusing to continue without --admin-cidr.

If you are connected through SSH, use your public admin IP/CIDR, for example:
  bash scripts/lockdown-linux-ufw.sh --apply --admin-cidr 203.0.113.10/32

If you have console access and intentionally do not want SSH open:
  bash scripts/lockdown-linux-ufw.sh --apply --no-ssh
EOF
  exit 2
fi

echo "==> UFW default policy"
run_cmd sudo ufw default deny incoming
run_cmd sudo ufw default allow outgoing

echo
echo "==> Public web ports"
for port in "${PUBLIC_PORTS[@]}"; do
  run_cmd sudo ufw allow "${port}/tcp" comment "AIP-PIR public TCP ${port}"
done

echo
echo "==> Management access"
if [ "$ALLOW_SSH" = true ]; then
  if [ -n "$ADMIN_CIDR" ]; then
    run_cmd sudo ufw allow from "$ADMIN_CIDR" to any port "$SSH_PORT" proto tcp comment "AIP-PIR admin SSH"
  else
    echo "[dry-run] SSH would require --admin-cidr before applying."
  fi
else
  echo "No SSH rule requested."
fi

echo
echo "==> Enable firewall"
run_cmd sudo ufw --force enable

echo
echo "==> UFW status"
if [ "$APPLY" = true ]; then
  sudo ufw status verbose
else
  echo "[dry-run] sudo ufw status verbose"
fi

echo
echo "==> Docker published ports audit"
if command -v docker >/dev/null 2>&1; then
  docker ps --format 'table {{.Names}}\t{{.Ports}}' || true
  cat <<'EOF'

Note: Docker can publish ports through iptables. Keep sensitive Compose services
bound to 127.0.0.1, and only publish the reverse proxy on 80/443.
EOF
else
  echo "Docker CLI not found."
fi

if [ "$APPLY" = false ]; then
  echo
  echo "Dry-run only. Rerun with --apply after checking admin access."
fi
