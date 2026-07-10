# Deploy para Cloudflare com valores de producao
# Usa .env.production (pasta pai) em vez de .env.local durante o build

$envLocal = ".env.local"
$envLocalBak = ".env.local.bak"
$envProd = "../.env.production"

# Guarda o .env.local atual
if (Test-Path $envLocal) {
    Rename-Item $envLocal $envLocalBak
}

# Copia o .env.production como .env.local para o build o usar
Copy-Item $envProd $envLocal

try {
    npm run deploy
} finally {
    # Restaura o .env.local original (sempre, mesmo se der erro)
    Remove-Item $envLocal -ErrorAction SilentlyContinue
    if (Test-Path $envLocalBak) {
        Rename-Item $envLocalBak $envLocal
    }
}
