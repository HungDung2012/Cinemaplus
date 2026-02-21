#!/usr/bin/env bash
# azure-setup.sh
# One-time script to provision all Azure resources for the Cinema project.
# Run this ONCE from your local machine (az CLI must be logged in).
#
# Usage:
#   chmod +x azure-setup.sh
#   ./azure-setup.sh
# ---------------------------------------------------------------------------

set -euo pipefail

# ── EDIT THESE ─────────────────────────────────────────────────────────────
RESOURCE_GROUP="cinema-rg"
LOCATION="southeastasia"          # closest Azure region (Singapore)
ACR_NAME="cinemaacr$RANDOM"       # must be globally unique
MYSQL_SERVER="cinema-mysql-$RANDOM"
MYSQL_ADMIN="cinemadmin"
MYSQL_PASSWORD="Cinema@$(date +%s)"   # auto-generated, copy it to .env
MYSQL_DB="cinema"
CONTAINER_ENV="cinema-env"
BACKEND_APP="cinema-backend"
FRONTEND_APP="cinema-frontend"

# Paste your TMDB token here
TMDB_API_TOKEN="${TMDB_API_TOKEN:-YOUR_TMDB_TOKEN}"
JWT_SECRET="$(openssl rand -base64 48)"
# ────────────────────────────────────────────────────────────────────────────

echo "📦 Creating Resource Group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

echo "🐳 Creating Azure Container Registry (ACR)..."
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true

ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

echo "🗄️ Creating Azure Database for MySQL Flexible Server..."
az mysql flexible-server create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$MYSQL_SERVER" \
  --location "$LOCATION" \
  --admin-user "$MYSQL_ADMIN" \
  --admin-password "$MYSQL_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 20 \
  --version 8.0 \
  --yes

echo "📂 Creating database..."
az mysql flexible-server db create \
  --resource-group "$RESOURCE_GROUP" \
  --server-name "$MYSQL_SERVER" \
  --database-name "$MYSQL_DB"

echo "🔓 Allowing Azure services to connect..."
az mysql flexible-server firewall-rule create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$MYSQL_SERVER" \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

MYSQL_HOST="${MYSQL_SERVER}.mysql.database.azure.com"
DB_URL="jdbc:mysql://${MYSQL_HOST}:3306/${MYSQL_DB}?useSSL=true&requireSSL=true&serverTimezone=Asia/Ho_Chi_Minh"

echo "🌐 Creating Container Apps Environment..."
az containerapp env create \
  --name "$CONTAINER_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"

echo "🔧 Building and pushing Docker images..."
az acr build \
  --registry "$ACR_NAME" \
  --image cinema-backend:latest \
  ./backend

az acr build \
  --registry "$ACR_NAME" \
  --image cinema-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL="__PLACEHOLDER__" \
  ./frontend

echo "🚀 Deploying Backend Container App..."
az containerapp create \
  --name "$BACKEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_LOGIN_SERVER}/cinema-backend:latest" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8080 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    SPRING_PROFILES_ACTIVE=prod \
    "DB_URL=${DB_URL}" \
    "DB_USERNAME=${MYSQL_ADMIN}" \
    "DB_PASSWORD=${MYSQL_PASSWORD}" \
    "JWT_SECRET=${JWT_SECRET}" \
    "TMDB_API_TOKEN=${TMDB_API_TOKEN}" \
    CORS_ALLOWED_ORIGINS=PLACEHOLDER \
    FRONTEND_URL=PLACEHOLDER

BACKEND_URL=$(az containerapp show \
  --name "$BACKEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" -o tsv)
BACKEND_URL="https://${BACKEND_URL}"

echo "🔄 Updating backend CORS with real frontend URL (we'll fix after frontend deploy)..."

echo "🚀 Deploying Frontend Container App..."
az containerapp create \
  --name "$FRONTEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_ENV" \
  --image "${ACR_LOGIN_SERVER}/cinema-frontend:latest" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    NODE_ENV=production \
    "API_URL=${BACKEND_URL}/api" \
    "BACKEND_INTERNAL_URL=${BACKEND_URL}" \
    "NEXT_PUBLIC_API_URL=${BACKEND_URL}"

FRONTEND_URL=$(az containerapp show \
  --name "$FRONTEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" -o tsv)
FRONTEND_URL="https://${FRONTEND_URL}"

echo "🔄 Updating backend CORS with real frontend URL..."
az containerapp update \
  --name "$BACKEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --replace-env-vars \
    SPRING_PROFILES_ACTIVE=prod \
    "DB_URL=${DB_URL}" \
    "DB_USERNAME=${MYSQL_ADMIN}" \
    "DB_PASSWORD=${MYSQL_PASSWORD}" \
    "JWT_SECRET=${JWT_SECRET}" \
    "TMDB_API_TOKEN=${TMDB_API_TOKEN}" \
    "CORS_ALLOWED_ORIGINS=${FRONTEND_URL}" \
    "FRONTEND_URL=${FRONTEND_URL}"

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅  DEPLOYMENT COMPLETE"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  Frontend URL : ${FRONTEND_URL}"
echo "  Backend URL  : ${BACKEND_URL}"
echo "  ACR          : ${ACR_LOGIN_SERVER}"
echo "  MySQL Host   : ${MYSQL_HOST}"
echo "  MySQL User   : ${MYSQL_ADMIN}"
echo "  MySQL Pass   : ${MYSQL_PASSWORD}"
echo "  JWT Secret   : ${JWT_SECRET}"
echo ""
echo "  ➜ Copy the values above into GitHub Secrets for CI/CD:"
echo "    ACR_LOGIN_SERVER, ACR_USERNAME, ACR_PASSWORD"
echo "    DB_URL, DB_USERNAME, DB_PASSWORD"
echo "    JWT_SECRET, TMDB_API_TOKEN"
echo "    BACKEND_URL, FRONTEND_URL, NEXT_PUBLIC_API_URL"
echo ""
echo "  ➜ Run this to get AZURE_CREDENTIALS secret for GitHub Actions:"
echo "    az ad sp create-for-rbac --name cinema-github-actions \\"
echo "      --role contributor \\"
echo "      --scopes /subscriptions/\$(az account show --query id -o tsv)/resourceGroups/${RESOURCE_GROUP} \\"
echo "      --json-auth"
echo ""
