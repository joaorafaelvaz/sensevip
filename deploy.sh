#!/bin/bash
# ===========================================
# SatisfyCAM - Deploy Script para VPS
# ===========================================
# Uso: bash deploy.sh
#
# Pre-requisitos no VPS (31.97.162.61):
#   - Docker e Docker Compose instalados
#   - DNS apontando v2.sensevip.ia.br -> 31.97.162.61
# ===========================================

set -e

VPS_HOST="31.97.162.61"
VPS_USER="root"
REMOTE_DIR="/opt/satisfycam"
DOMAIN="v2.sensevip.ia.br"

echo "=== SatisfyCAM Deploy ==="
echo ""

# 1. Criar diretorio remoto
echo "[1/5] Preparando diretorio no VPS..."
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${REMOTE_DIR}"

# 2. Enviar arquivos
echo "[2/5] Enviando arquivos para o VPS..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'storage/snapshots/*' \
  --exclude 'prisma/dev.db*' \
  --exclude '.env' \
  ./ ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/

# 3. Criar .env no servidor (se nao existir)
echo "[3/5] Configurando variaveis de ambiente..."
ssh ${VPS_USER}@${VPS_HOST} "
  if [ ! -f ${REMOTE_DIR}/.env ]; then
    cat > ${REMOTE_DIR}/.env << 'ENVEOF'
JWT_SECRET=$(openssl rand -base64 32)
STORE_NAME=Barbearia VIP - Centro
ENVEOF
    echo '  .env criado com JWT_SECRET aleatorio'
  else
    echo '  .env ja existe, mantendo configuracao atual'
  fi
"

# 4. Build e start dos containers
echo "[4/5] Fazendo build e iniciando containers..."
ssh ${VPS_USER}@${VPS_HOST} "
  cd ${REMOTE_DIR} && \
  docker compose down 2>/dev/null || true && \
  docker compose build --no-cache && \
  docker compose up -d app
"

# 5. Rodar migration e seed
echo "[5/5] Executando migrations e seed..."
ssh ${VPS_USER}@${VPS_HOST} "
  cd ${REMOTE_DIR} && \
  docker compose exec app npx prisma migrate deploy && \
  docker compose exec app npx tsx prisma/seed.ts 2>/dev/null || true
"

echo ""
echo "=== Deploy concluido! ==="
echo ""
echo "Proximos passos para HTTPS:"
echo "  1. Aponte o DNS: ${DOMAIN} -> ${VPS_HOST}"
echo "  2. Inicie o nginx: ssh ${VPS_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && docker compose up -d nginx'"
echo "  3. Gere o certificado SSL:"
echo "     ssh ${VPS_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && docker compose run certbot certonly --webroot -w /var/lib/letsencrypt -d ${DOMAIN}'"
echo "  4. Reinicie o nginx: ssh ${VPS_USER}@${VPS_HOST} 'cd ${REMOTE_DIR} && docker compose restart nginx'"
echo ""
echo "Acesso direto (sem SSL): http://${VPS_HOST}:3007"
echo "Acesso com dominio (apos SSL): https://${DOMAIN}"
