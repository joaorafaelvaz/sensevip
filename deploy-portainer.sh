#!/bin/bash
# =====================================================
# SatisfyCAM - Deploy para Portainer (execucao local no VPS)
# =====================================================
# Execute este script diretamente no VPS, na raiz do projeto.
#
# Uso: bash deploy-portainer.sh
#
# Este script:
#   1. Faz build da imagem Docker
#   2. Configura o Nginx
#   3. Gera variaveis de ambiente
#   4. Roda migrations e seed (se container ativo)
# =====================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="/opt/satisfycam-data"
NGINX_DIR="/opt/satisfycam-nginx"
DOMAIN="v2.sensevip.ia.br"

echo "=== SatisfyCAM - Deploy Portainer ==="
echo ""
echo "Diretorio do projeto: ${PROJECT_DIR}"
echo ""

# 1. Build da imagem
echo "[1/4] Fazendo build da imagem Docker..."
cd "${PROJECT_DIR}"
docker build -t satisfycam:latest .

# 2. Configurar Nginx
echo "[2/4] Configurando Nginx..."
mkdir -p ${NGINX_DIR}
cp nginx/nginx.conf ${NGINX_DIR}/default.conf
echo "  Config copiada para ${NGINX_DIR}/default.conf"

# 3. Criar .env
echo "[3/4] Verificando variaveis de ambiente..."
mkdir -p ${DATA_DIR}/snapshots
if [ ! -f ${DATA_DIR}/.env ]; then
  JWT=$(openssl rand -base64 32)
  cat > ${DATA_DIR}/.env << ENVEOF
JWT_SECRET=${JWT}
STORE_NAME=Barbearia VIP - Centro
ENVEOF
  echo "  .env criado em ${DATA_DIR}/.env"
  echo "  JWT_SECRET gerado automaticamente"
  cat ${DATA_DIR}/.env
else
  echo "  .env ja existe, mantendo configuracao atual"
fi

# 4. Rodar migration (se container ja estiver rodando)
echo "[4/4] Tentando rodar migrations..."
if docker ps --format '{{.Names}}' | grep -q satisfycam-app; then
  docker exec satisfycam-app npx prisma migrate deploy 2>/dev/null || echo "  Migration sera executada ao reiniciar"
  docker exec satisfycam-app npx tsx prisma/seed.ts 2>/dev/null || echo "  Seed sera executado ao reiniciar"
else
  echo "  Container nao esta rodando ainda. Crie o stack no Portainer."
fi

echo ""
echo "=== Build concluido! ==="
echo ""
echo "Proximos passos no Portainer:"
echo ""
echo "  1. Stacks > Add Stack"
echo "  2. Nome: satisfycam"
echo "  3. Web Editor: cole o conteudo de portainer-stack-image.yml"
echo "  4. Em 'Environment Variables', adicione:"
echo "     JWT_SECRET = (copie de ${DATA_DIR}/.env)"
echo "     STORE_NAME = Barbearia VIP - Centro"
echo "  5. Clique 'Deploy the stack'"
echo ""
echo "Para HTTPS:"
echo "  docker exec satisfycam-certbot certbot certonly --webroot -w /var/lib/letsencrypt -d ${DOMAIN}"
echo "  docker restart satisfycam-nginx"
echo ""
echo "Acesso: http://$(hostname -I | awk '{print $1}'):3007 | https://${DOMAIN}"
