<#
.SYNOPSIS
    Fayol - Inicialização do HashiCorp Vault
#>

$VaultAddr = if ($env:VAULT_ADDR) { $env:VAULT_ADDR } else { "http://localhost:8200" }
$VaultToken = if ($env:VAULT_ROOT_TOKEN) { $env:VAULT_ROOT_TOKEN } else { "fayol-dev-root-token" }

function Write-Color($Text, $Color) { Write-Host $Text -ForegroundColor $Color }

Write-Color "🔐 Inicializando Vault em $VaultAddr..." "Yellow"

$WaitSeconds = 0
do {
    try {
        $Response = Invoke-WebRequest -Uri "$VaultAddr/v1/sys/health" -Method Get -ErrorAction Stop
        if ($Response.StatusCode -eq 200) { break }
    } catch {
        Write-Host "   Aguardando Vault... ($WaitSeconds s)"
        Start-Sleep -Seconds 2
        $WaitSeconds += 2
    }
} while ($WaitSeconds -lt 60)

$env:VAULT_TOKEN = $VaultToken
$env:VAULT_ADDR = $VaultAddr

Write-Host ""
Write-Color "📝 Criando secrets engines..." "Cyan"

# Habilita KV
try {
    vault secrets enable -version=2 -path=fayol kv 2>$null
} catch {
    Write-Host "   (Engine pode já existir)"
}

Write-Host ""
Write-Color "🔑 Armazenando secrets..." "Cyan"

# Helper para evitar repetição
function Put-Secret ($Path, $KeyValues) {
    $Args = @("kv", "put", $Path) + $KeyValues
    vault @Args
}

# Postgres Defaults
$PgDb = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "fayol_db" }
$PgUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "fayol_admin" }
$PgPass = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "fayol_secure_password_123!" }

Put-Secret "fayol/database" @(
    "host=postgres", 
    "port=5432", 
    "database=$PgDb", 
    "username=$PgUser", 
    "password=$PgPass",
    "url=postgresql://$($PgUser):$($PgPass)@postgres:5432/$($PgDb)?schema=public"
)

# Redis
$RedisPass = if ($env:REDIS_PASSWORD) { $env:REDIS_PASSWORD } else { "redis_secure_pass_123!" }
Put-Secret "fayol/redis" @("host=redis", "port=6379", "password=$RedisPass")

Write-Color "✅ Secrets armazenados com sucesso!" "Green"