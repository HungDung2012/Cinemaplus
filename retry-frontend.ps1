# retry-frontend.ps1
# Chay script nay neu buoc 7/8 (frontend) bi loi, backend da OK roi
# ---------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

$RESOURCE_GROUP = "cinema-rg"
$ACR_NAME       = "" # <-- dien ten ACR cua ban, xem trong azure-secrets.txt (ACR_LOGIN_SERVER bo phan .azurecr.io)
$BACKEND_APP    = "cinema-backend"
$FRONTEND_APP   = "cinema-frontend"
$CONTAINER_ENV  = "cinema-env"

if (-not $ACR_NAME) {
    # Tu dong lay ACR dau tien trong resource group
    $ACR_NAME = az acr list --resource-group $RESOURCE_GROUP --query "[0].name" -o tsv
    Write-Host "Tim thay ACR: $ACR_NAME" -ForegroundColor Cyan
}

$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer -o tsv
$ACR_USERNAME     = az acr credential show --name $ACR_NAME --query username -o tsv
$ACR_PASSWORD     = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

# Lay Backend URL
$BACKEND_FQDN = az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv
$BACKEND_URL  = "https://$BACKEND_FQDN"
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan

# Xoa node_modules neu co de giam kich thuoc upload
if (Test-Path ".\frontend\node_modules") {
    Write-Host "Xoa node_modules de giam kich thuoc..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".\frontend\node_modules"
}

Write-Host "`n[1/3] Build & Push Frontend image len ACR..." -ForegroundColor Cyan
az acr build `
  --registry $ACR_NAME `
  --image "cinema-frontend:latest" `
  --file "./frontend/Dockerfile" `
  --build-arg "NEXT_PUBLIC_API_URL=$BACKEND_URL" `
  ./frontend

if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD THAT BAI!" -ForegroundColor Red
    exit 1
}
Write-Host "Build thanh cong" -ForegroundColor Green

Write-Host "`n[2/3] Deploy Frontend Container App..." -ForegroundColor Cyan
# Thu xoa container app cu truoc (neu ton tai)
$existing = az containerapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP 2>$null
if ($existing) {
    Write-Host "Cap nhat container app hien co..." -ForegroundColor Yellow
    az containerapp update `
      --name $FRONTEND_APP `
      --resource-group $RESOURCE_GROUP `
      --image "${ACR_LOGIN_SERVER}/cinema-frontend:latest" `
      --replace-env-vars `
        NODE_ENV=production `
        "API_URL=$BACKEND_URL/api" `
        "BACKEND_INTERNAL_URL=$BACKEND_URL" `
        "NEXT_PUBLIC_API_URL=$BACKEND_URL"
} else {
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
        "NEXT_PUBLIC_API_URL=$BACKEND_URL"
}

$FRONTEND_FQDN = az containerapp show --name $FRONTEND_APP --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv
$FRONTEND_URL  = "https://$FRONTEND_FQDN"
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Green

Write-Host "`n[3/3] Cap nhat CORS cua Backend..." -ForegroundColor Cyan
az containerapp update `
  --name $BACKEND_APP `
  --resource-group $RESOURCE_GROUP `
  --set-env-vars `
    "CORS_ALLOWED_ORIGINS=$FRONTEND_URL" `
    "FRONTEND_URL=$FRONTEND_URL" | Out-Null
Write-Host "CORS updated" -ForegroundColor Green

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "  HOAN THANH!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "  Frontend : $FRONTEND_URL" -ForegroundColor Yellow
Write-Host "  Backend  : $BACKEND_URL" -ForegroundColor Yellow
