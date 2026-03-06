#!/bin/bash
# =====================================================
# SatisfyCAM - Deploy para Portainer
# =====================================================
# Este script:
#   1. Envia o codigo para o VPS
#   2. Faz build da imagem Docker
#   3. Copia a config do Nginx
#   4. Roda migrations e seed
#
# Depois, basta criar/atualizar o stack no Portainer
# usando o portainer-stack-image.yml
# =====================================================

set -e

VPS_HOST="31.97.162.61"
VPS_USER="root"
BUILD_DIR="/opt/satisfycam-build"
DATA_DIR="/opt/satisfycam-data"
NGINX_DIR="/opt/satisfycam-nginx"
DOMAIN="v2.sensevip.ia.br"

echo "=== SatisfyCAM - Deploy Portainer ==="
echo ""

# 1. Enviar codigo
echo "[1/5] Enviando codigo para o VPS..."
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${BUILD_DIR} ${DATA_DIR}/snapshots ${NGINX_DIR}"

rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'storage/snapshots/*' \
  --exclude 'prisma/dev.db*' \
  --exclude '.env' \
  ./ ${VPS_USER}@${VPS_HOST}:${BUILD_DIR}/

# 2. Build da imagem
echo "[2/5] Fazendo build da imagem Docker..."
ssh ${VPS_USER}@${VPS_HOST} "cd ${BUILD_DIR} && docker build -t satisfycam:latest ."

# 3. Copiar config do Nginx
echo "[3/5] Configurando Nginx..."
scp nginx/nginx.conf ${VPS_USER}@${VPS_HOST}:${NGINX_DIR}/default.conf

# 4. Criar .env para o Portainer (referencia)
echo "[4/5] Verificando variaveis de ambiente..."
ssh ${VPS_USER}@${VPS_HOST} "
  if [ ! -f ${DATA_DIR}/.env ]; then
    JWT=\$(openssl rand -base64 32)
    cat > ${DATA_DIR}/.env << ENVEOF
JWT_SECRET=\${JWT}
STORE_NAME=Barbearia VIP - Centro
ENVEOF
    echo '  .env criado em ${DATA_DIR}/.env'
    echo '  JWT_SECRET gerado automaticamente'
    cat ${DATA_DIR}/.env
  else
    echo '  .env ja existe'
  fi
"

# 5. Rodar migration no container (se ja estiver rodando)
echo "[5/5] Tentando rodar migrations..."
ssh ${VPS_USER}@${VPS_HOST} "
  if docker ps --format '{{.Names}}' | grep -q satisfycam-app; then
    docker exec satisfycam-app npx prisma migrate deploy 2>/dev/null || echo '  Migration sera executada quando o container iniciar'
    docker exec satisfycam-app npx tsx prisma/seed.ts 2>/dev/null || echo '  Seed sera executado quando o container iniciar'
  else
    echo '  Container nao esta rodando ainda. Crie o stack no Portainer.'
  fi
"

echo ""
echo "=== Build concluido! ==="
echo ""
echo "Proximos passos no Portainer (https://${VPS_HOST}:9443):"
echo ""
echo "  1. Va em Stacks > Add Stack"
echo "  2. Nome: satisfycam"
echo "  3. Web Editor: cole o conteudo de portainer-stack-image.yml"
echo "  4. Em 'Environment Variables', adicione:"
echo "     JWT_SECRET = (copie de ${DATA_DIR}/.env no VPS)"
echo "     STORE_NAME = Barbearia VIP - Centro"
echo "  5. Em 'Volumes', mapeie:"
echo "     nginx config: ${NGINX_DIR}/default.conf"
echo "  6. Clique 'Deploy the stack'"
echo ""
echo "Para HTTPS:"
echo "  docker exec satisfycam-certbot certbot certonly --webroot -w /var/lib/letsencrypt -d ${DOMAIN}"
echo "  docker restart satisfycam-nginx"
echo ""
echo "Acesso: http://${VPS_HOST}:3007 | https://${DOMAIN}"
