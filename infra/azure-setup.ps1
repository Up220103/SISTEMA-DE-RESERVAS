<#
.SYNOPSIS
    Crea en Azure toda la infraestructura del Sistema de Reservas UPA.

.DESCRIPTION
    Se corre UNA SOLA VEZ, desde tu maquina, con Azure CLI instalado y sesion
    iniciada (az login). Crea dentro del grupo de recursos:

      · Azure Container Registry (guarda las imagenes Docker)
      · App Service Plan Linux
      · Web App del API      (contenedor backend)
      · Web App del frontend (contenedor nginx)
      · MySQL Flexible Server + reglas de firewall

    Al terminar imprime los valores exactos que hay que pegar en
    GitHub -> Settings -> Secrets and variables -> Actions.

    El pipeline (.github/workflows/deploy.yml) NO crea recursos: solo despliega
    sobre los que este script deja listos.

.EXAMPLE
    az login
    ./infra/azure-setup.ps1

.EXAMPLE
    # Crear todo y ademas cargar el esquema de la BD (CUIDADO: borra reservas_upa)
    ./infra/azure-setup.ps1 -CargarEsquema
#>

[CmdletBinding()]
param(
    [string] $SubscriptionId  = '06716e92-c8ce-4a45-afea-51079bc64ab0',
    [string] $ResourceGroup   = 'rg-sistemadereserva',
    [string] $Location        = 'centralus',

    # Nombres. ACR y las Web Apps deben ser UNICOS EN TODO AZURE: si el script
    # falla diciendo que el nombre ya existe, cambia el sufijo.
    [string] $AcrName         = 'acrsistemareservasupa',
    [string] $PlanName        = 'plan-sistema-reservas',
    [string] $BackendWebApp   = 'sistema-reservas-api-upa',
    [string] $FrontendWebApp  = 'sistema-reservas-web-upa',
    [string] $MySqlServer     = 'mysql-sistema-reservas-upa',

    [string] $DbName          = 'reservas_upa',
    [string] $DbAdminUser     = 'upaadmin',

    # Carga database/sistema_reservas_upa.sql en el servidor MySQL.
    # OJO: ese script empieza con DROP DATABASE IF EXISTS reservas_upa.
    [switch] $CargarEsquema
)

$ErrorActionPreference = 'Stop'

function Paso($texto) {
    Write-Host ""
    Write-Host "==> $texto" -ForegroundColor Cyan
}

# -----------------------------------------------------------------------------
# 0. Comprobaciones previas
# -----------------------------------------------------------------------------
Paso "Comprobando Azure CLI y sesion"

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI no esta instalado. Descargalo de https://aka.ms/installazurecliwindows"
}

$cuenta = az account show 2>$null | ConvertFrom-Json
if (-not $cuenta) {
    throw "No hay sesion de Azure. Corre 'az login' y vuelve a intentar."
}

az account set --subscription $SubscriptionId
Write-Host "Suscripcion: $($cuenta.name)" -ForegroundColor Green

# La contrasena del admin de MySQL se pide aqui: nunca se guarda en el repo.
$dbPassSecure = Read-Host "Contrasena para el admin de MySQL ($DbAdminUser)" -AsSecureString
$DbAdminPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassSecure))

if ($DbAdminPassword.Length -lt 8) {
    throw "La contrasena debe tener al menos 8 caracteres (Azure exige mayuscula, minuscula y numero)."
}

# Secreto para firmar los JWT: se genera aleatorio, no se inventa a mano.
$JwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

# -----------------------------------------------------------------------------
# 1. Grupo de recursos
# -----------------------------------------------------------------------------
Paso "Grupo de recursos: $ResourceGroup"

$rgExiste = az group exists --name $ResourceGroup | ConvertFrom-Json
if (-not $rgExiste) {
    az group create --name $ResourceGroup --location $Location --output none
    Write-Host "Creado." -ForegroundColor Green
} else {
    $Location = (az group show --name $ResourceGroup --query location -o tsv)
    Write-Host "Ya existe (region: $Location)." -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# 2. Azure Container Registry
# -----------------------------------------------------------------------------
Paso "Container Registry: $AcrName"

az acr create `
    --resource-group $ResourceGroup `
    --name $AcrName `
    --sku Basic `
    --admin-enabled true `
    --location $Location `
    --output none

$acrServer = az acr show --name $AcrName --query loginServer -o tsv
$acrUser   = az acr credential show --name $AcrName --query username -o tsv
$acrPass   = az acr credential show --name $AcrName --query "passwords[0].value" -o tsv
Write-Host "Registry: $acrServer" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 3. App Service Plan (Linux)
# -----------------------------------------------------------------------------
Paso "App Service Plan: $PlanName (B1 Linux)"

az appservice plan create `
    --resource-group $ResourceGroup `
    --name $PlanName `
    --location $Location `
    --is-linux `
    --sku B1 `
    --output none

# -----------------------------------------------------------------------------
# 4. MySQL Flexible Server
# -----------------------------------------------------------------------------
Paso "MySQL Flexible Server: $MySqlServer (tarda ~5 min)"

# --public-access 0.0.0.0 crea la regla que deja entrar a los servicios de Azure
# (necesaria para que las Web Apps alcancen la BD).
az mysql flexible-server create `
    --resource-group $ResourceGroup `
    --name $MySqlServer `
    --location $Location `
    --admin-user $DbAdminUser `
    --admin-password $DbAdminPassword `
    --sku-name Standard_B1ms `
    --tier Burstable `
    --storage-size 20 `
    --version 8.0.21 `
    --public-access 0.0.0.0 `
    --yes `
    --output none

$mysqlFqdn = az mysql flexible-server show `
    --resource-group $ResourceGroup --name $MySqlServer `
    --query fullyQualifiedDomainName -o tsv
Write-Host "Servidor MySQL: $mysqlFqdn" -ForegroundColor Green

# Tu IP publica, para poder conectarte con Workbench o cargar el esquema.
Paso "Abriendo el firewall para tu IP actual"
$miIp = (Invoke-RestMethod -Uri 'https://api.ipify.org?format=json').ip
az mysql flexible-server firewall-rule create `
    --resource-group $ResourceGroup `
    --name $MySqlServer `
    --rule-name 'equipo-desarrollo' `
    --start-ip-address $miIp `
    --end-ip-address $miIp `
    --output none
Write-Host "IP autorizada: $miIp" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 5. Web App del backend
# -----------------------------------------------------------------------------
Paso "Web App del API: $BackendWebApp"

# Arranca con una imagen placeholder; el pipeline la reemplaza en el primer deploy.
az webapp create `
    --resource-group $ResourceGroup `
    --plan $PlanName `
    --name $BackendWebApp `
    --container-image-name 'mcr.microsoft.com/appsvc/staticsite:latest' `
    --output none

az webapp config appsettings set `
    --resource-group $ResourceGroup --name $BackendWebApp `
    --settings `
        NODE_ENV=production `
        WEBSITES_PORT=4000 `
        DB_HOST=$mysqlFqdn `
        DB_PORT=3306 `
        DB_NAME=$DbName `
        DB_USER=$DbAdminUser `
        DB_PASSWORD=$DbAdminPassword `
        DB_SSL=true `
        JWT_SECRET=$JwtSecret `
        JWT_EXPIRES_IN=8h `
        CORS_ORIGIN="https://$FrontendWebApp.azurewebsites.net" `
        DOCKER_REGISTRY_SERVER_URL="https://$acrServer" `
        DOCKER_REGISTRY_SERVER_USERNAME=$acrUser `
        DOCKER_REGISTRY_SERVER_PASSWORD=$acrPass `
    --output none

# -----------------------------------------------------------------------------
# 6. Web App del frontend
# -----------------------------------------------------------------------------
Paso "Web App del frontend: $FrontendWebApp"

az webapp create `
    --resource-group $ResourceGroup `
    --plan $PlanName `
    --name $FrontendWebApp `
    --container-image-name 'mcr.microsoft.com/appsvc/staticsite:latest' `
    --output none

az webapp config appsettings set `
    --resource-group $ResourceGroup --name $FrontendWebApp `
    --settings `
        WEBSITES_PORT=80 `
        DOCKER_REGISTRY_SERVER_URL="https://$acrServer" `
        DOCKER_REGISTRY_SERVER_USERNAME=$acrUser `
        DOCKER_REGISTRY_SERVER_PASSWORD=$acrPass `
    --output none

# -----------------------------------------------------------------------------
# 7. Esquema de la base de datos (opcional)
# -----------------------------------------------------------------------------
if ($CargarEsquema) {
    Paso "Cargando database/sistema_reservas_upa.sql"
    Write-Host "AVISO: el script empieza con DROP DATABASE IF EXISTS reservas_upa." -ForegroundColor Yellow

    $sqlPath = Join-Path $PSScriptRoot '..\database\sistema_reservas_upa.sql' | Resolve-Path
    az mysql flexible-server execute `
        --name $MySqlServer `
        --admin-user $DbAdminUser `
        --admin-password $DbAdminPassword `
        --file-path $sqlPath `
        --output none
    Write-Host "Esquema cargado." -ForegroundColor Green
} else {
    Paso "Esquema de la BD: NO cargado"
    Write-Host "Para cargarlo despues:" -ForegroundColor Yellow
    Write-Host "  ./infra/azure-setup.ps1 -CargarEsquema" -ForegroundColor Yellow
    Write-Host "  (o con MySQL Workbench conectando a $mysqlFqdn)" -ForegroundColor Yellow
}

# -----------------------------------------------------------------------------
# 8. Resumen
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "=============================================================" -ForegroundColor Green
Write-Host " LISTO. Recursos creados en $ResourceGroup" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs (funcionaran despues del primer deploy):"
Write-Host "  Frontend : https://$FrontendWebApp.azurewebsites.net"
Write-Host "  API      : https://$BackendWebApp.azurewebsites.net"
Write-Host "  Health   : https://$BackendWebApp.azurewebsites.net/health"
Write-Host ""
Write-Host "-------------------------------------------------------------"
Write-Host " 1) Revisa que el bloque env: de deploy.yml coincida:" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------"
Write-Host "  RESOURCE_GROUP   : $ResourceGroup"
Write-Host "  ACR_NAME         : $AcrName"
Write-Host "  ACR_LOGIN_SERVER : $acrServer"
Write-Host "  BACKEND_WEBAPP   : $BackendWebApp"
Write-Host "  FRONTEND_WEBAPP  : $FrontendWebApp"
Write-Host ""
Write-Host "-------------------------------------------------------------"
Write-Host " 2) Crea el service principal y copia el JSON completo:" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------"
Write-Host "  az ad sp create-for-rbac --name sp-sistema-reservas ``"
Write-Host "    --role contributor ``"
Write-Host "    --scopes /subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup ``"
Write-Host "    --json-auth"
Write-Host ""
Write-Host "  Ese JSON va completo en el secret AZURE_CREDENTIALS."
Write-Host ""
Write-Host "-------------------------------------------------------------"
Write-Host " 3) GitHub -> Settings -> Secrets and variables -> Actions:" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------"
Write-Host "  AZURE_CREDENTIALS : (el JSON del paso 2)"
Write-Host "  DB_HOST           : $mysqlFqdn"
Write-Host "  DB_NAME           : $DbName"
Write-Host "  DB_USER           : $DbAdminUser"
Write-Host "  DB_PASSWORD       : (la que acabas de escribir)"
Write-Host "  JWT_SECRET        : $JwtSecret"
Write-Host "  CORS_ORIGIN       : https://$FrontendWebApp.azurewebsites.net"
Write-Host "  VITE_API_URL      : https://$BackendWebApp.azurewebsites.net/api"
Write-Host ""
Write-Host "Guarda JWT_SECRET ahora: no se vuelve a mostrar." -ForegroundColor Yellow
Write-Host ""
