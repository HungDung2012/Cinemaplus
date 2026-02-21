# azure-setup.ps1
# Chạy 1 lần duy nhất để tạo toàn bộ hạ tầng Azure cho dự án Cinema
# Yêu cầu: Azure CLI đã cài & đã đăng nhập (az login)
#
# Cách dùng:
#   $env:TMDB_API_TOKEN = "eyJhbGci..."   # paste token của bạn
#   .\azure-setup.ps1
# ---------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

# ── CẤU HÌNH — CHỈNH SỬA ĐỂ PHÙ HỢP ──────────────────────────────────────
$RESOURCE_GROUP   = "cinema-rg"
$LOCATION         = "southeastasia"          # Singapore — gần VN nhất
$RANDOM_SUFFIX    = Get-Random -Minimum 1000 -Maximum 9999
$ACR_NAME         = "cinemaacr$RANDOM_SUFFIX"
$MYSQL_SERVER     = "cinema-mysql-$RANDOM_SUFFIX"
$MYSQL_ADMIN      = "cinemadmin"
$MYSQL_PASSWORD   = "Cinema@Pass$RANDOM_SUFFIX!"
$MYSQL_DB         = "cinema"
# DB_URL don gian, khong dung & de tranh loi shell
$DB_SSL_PARAMS    = "useSSL=true"
$CONTAINER_ENV    = "cinema-env"
$BACKEND_APP      = "cinema-backend"
$FRONTEND_APP     = "cinema-frontend"
$TMDB_TOKEN       = $env:TMDB_API_TOKEN
$JWT_SECRET       = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
# ──────────────────────────────────────────────────────────────────────────

if (-not $TMDB_TOKEN) {
    Write-Error "Bạn chưa set TMDB_API_TOKEN. Chạy: `$env:TMDB_API_TOKEN = 'your_token'"
    exit 1
}

Write-Host "`n=== 1/8  Tạo Resource Group ===" -ForegroundColor Cyan
az group create --name $RESOURCE_GROUP --location $LOCATION | Out-Null
Write-Host "OK: $RESOURCE_GROUP" -ForegroundColor Green

Write-Host "`n=== 2/8  Tạo Azure Container Registry (ACR) ===" -ForegroundColor Cyan
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true | Out-Null
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer -o tsv
$ACR_USERNAME     = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD     = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv
Write-Host "OK: $ACR_LOGIN_SERVER" -ForegroundColor Green

Write-Host "`n=== 3/8  Tạo MySQL Flexible Server (mất ~5 phút) ===" -ForegroundColor Cyan
az mysql flexible-server create `
  --resource-group $RESOURCE_GROUP `
  --name $MYSQL_SERVER `
  --location $LOCATION `
  --admin-user $MYSQL_ADMIN `
  --admin-password $MYSQL_PASSWORD `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --storage-size 20 `
  --version 8.0 `
  --yes | Out-Null

az mysql flexible-server db create `
  --resource-group $RESOURCE_GROUP `
  --server-name $MYSQL_SERVER `
  --database-name $MYSQL_DB | Out-Null

az mysql flexible-server firewall-rule create `
  --resource-group $RESOURCE_GROUP `
  --name $MYSQL_SERVER `
  --rule-name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0 | Out-Null

$MYSQL_HOST = "$MYSQL_SERVER.mysql.database.azure.com"
$DB_URL = "jdbc:mysql://${MYSQL_HOST}:3306/${MYSQL_DB}?$DB_SSL_PARAMS"
Write-Host "OK: $MYSQL_HOST" -ForegroundColor Green

Write-Host "`n=== 4/8  Tạo Container Apps Environment ===" -ForegroundColor Cyan
az containerapp env create `
  --name $CONTAINER_ENV `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION | Out-Null
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== 5/8  Build & Push Backend image (mất vài phút) ===" -ForegroundColor Cyan
az acr build `
  --registry $ACR_NAME `
  --image "cinema-backend:latest" `
  --file "./backend/Dockerfile" `
  ./backend
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== 6/8  Deploy Backend Container App ===" -ForegroundColor Cyan
az containerapp create `
  --name $BACKEND_APP `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_ENV `
  --image "${ACR_LOGIN_SERVER}/cinema-backend:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 8080 `
  --ingress external `
  --min-replicas 1 --max-replicas 3 `
  --cpu 0.5 --memory 1Gi `
  --env-vars `
    SPRING_PROFILES_ACTIVE=prod `
    "DB_URL=$DB_URL" `
    "DB_USERNAME=$MYSQL_ADMIN" `
    "DB_PASSWORD=$MYSQL_PASSWORD" `
    "JWT_SECRET=$JWT_SECRET" `
    "TMDB_API_TOKEN=$TMDB_TOKEN" `
    CORS_ALLOWED_ORIGINS=PLACEHOLDER `
    FRONTEND_URL=PLACEHOLDER | Out-Null

$BACKEND_FQDN = az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv
$BACKEND_URL  = "https://$BACKEND_FQDN"
Write-Host "OK: $BACKEND_URL" -ForegroundColor Green

Write-Host "`n=== 7/8  Build & Push Frontend image ===" -ForegroundColor Cyan
# Xoa node_modules truoc khi upload de giam kich thuoc context
if (Test-Path ".\frontend\node_modules") {
    Write-Host "  Removing node_modules to reduce upload size..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".\frontend\node_modules"
}
az acr build `
  --registry $ACR_NAME `
  --image "cinema-frontend:latest" `
  --file "./frontend/Dockerfile" `
  --build-arg "NEXT_PUBLIC_API_URL=$BACKEND_URL" `
  ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build THAT BAI. Chay lai: az acr build --registry $ACR_NAME --image cinema-frontend:latest --file ./frontend/Dockerfile ./frontend" -ForegroundColor Red
    exit 1
}
Write-Host "OK" -ForegroundColor Green

Write-Host "`n=== 8/8  Deploy Frontend Container App ===" -ForegroundColor Cyan
az containerapp create `
  --name $FRONTEND_APP `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_ENV `
  --image "${ACR_LOGIN_SERVER}/cinema-frontend:latest" `
  --registry-server $ACR_LOGIN_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 3000 `
  --ingress external `
  --min-replicas 1 --max-replicas 3 `
  --cpu 0.5 --memory 1Gi `
  --env-vars `
    NODE_ENV=production `
    "API_URL=$BACKEND_URL/api" `
    "BACKEND_INTERNAL_URL=$BACKEND_URL" `
    "NEXT_PUBLIC_API_URL=$BACKEND_URL" | Out-Null

$FRONTEND_FQDN = az containerapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv
$FRONTEND_URL  = "https://$FRONTEND_FQDN"
Write-Host "OK: $FRONTEND_URL" -ForegroundColor Green

Write-Host "`nCập nhật CORS backend với URL frontend thật..." -ForegroundColor Yellow
az containerapp update `
  --name $BACKEND_APP `
  --resource-group $RESOURCE_GROUP `
  --replace-env-vars `
    SPRING_PROFILES_ACTIVE=prod `
    "DB_URL=$DB_URL" `
    "DB_USERNAME=$MYSQL_ADMIN" `
    "DB_PASSWORD=$MYSQL_PASSWORD" `
    "JWT_SECRET=$JWT_SECRET" `
    "TMDB_API_TOKEN=$TMDB_TOKEN" `
    "CORS_ALLOWED_ORIGINS=$FRONTEND_URL" `
    "FRONTEND_URL=$FRONTEND_URL" | Out-Null

# Lưu thông tin vào file để dùng cho GitHub Secrets
$lines = @(
    "# Dan cac gia tri nay vao GitHub Secrets: Settings -> Secrets -> Actions",
    "ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER",
    "ACR_USERNAME=$ACR_USERNAME",
    "ACR_PASSWORD=$ACR_PASSWORD",
    "DB_URL=$DB_URL",
    "DB_USERNAME=$MYSQL_ADMIN",
    "DB_PASSWORD=$MYSQL_PASSWORD",
    "JWT_SECRET=$JWT_SECRET",
    "TMDB_API_TOKEN=$TMDB_TOKEN",
    "BACKEND_URL=$BACKEND_URL",
    "FRONTEND_URL=$FRONTEND_URL",
    "NEXT_PUBLIC_API_URL=$BACKEND_URL",
    "CORS_ALLOWED_ORIGINS=$FRONTEND_URL"
)
$lines | Out-File -FilePath ".\azure-secrets.txt" -Encoding UTF8

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "  DEPLOY THANH CONG!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend : $FRONTEND_URL" -ForegroundColor Yellow
Write-Host "  Backend  : $BACKEND_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Thong tin da luu vao: azure-secrets.txt" -ForegroundColor Cyan
Write-Host "  (Them vao GitHub Secrets de CI/CD hoat dong)" -ForegroundColor Cyan
Write-Host ""

# Tạo lệnh AZURE_CREDENTIALS cho GitHub Actions
$SUB_ID = az account show --query id -o tsv
Write-Host "  Chay lenh sau de lay AZURE_CREDENTIALS cho GitHub Actions:" -ForegroundColor Magenta
Write-Host ("  az ad sp create-for-rbac --name cinema-github-actions --role contributor " +
    "--scopes /subscriptions/$SUB_ID/resourceGroups/$RESOURCE_GROUP --json-auth") -ForegroundColor White
