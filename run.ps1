param(
    [Parameter(Position=0)]
    [string]$Mode
)

if ($Mode -notmatch '^(local|docker)$') {
    Write-Host "Usage: .\run.ps1 [local|docker]"
    Write-Host ""
    Write-Host "Starts the AIP-PIR system automatically."
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  local   - Runs the application locally (Note: relies on start.sh which needs WSL/Git Bash)."
    Write-Host "  docker  - Runs the entire application stack in Docker Compose."
    Write-Host "            Automatically configures .env and seeds the database."
    exit 1
}

if ($Mode -eq "local") {
    Write-Host "==> Starting local development environment..."
    Write-Host "Note: Local mode relies on start.sh which is a bash script."
    Write-Host "If you are on Windows, please run this inside WSL (Windows Subsystem for Linux) or Git Bash."
    if (Get-Command bash -ErrorAction SilentlyContinue) {
        bash ./start.sh
    } else {
        Write-Host "bash is not installed or not in PATH."
    }
}
elseif ($Mode -eq "docker") {
    Write-Host "==> Starting Docker Compose environment..."
    
    if (-not (Test-Path ".env")) {
        Write-Host "==> Creating .env from .env.docker.example..."
        Copy-Item ".env.docker.example" ".env"
        
        # Generate random secrets
        $JWT = [guid]::NewGuid().ToString().Replace("-", "") + [guid]::NewGuid().ToString().Replace("-", "")
        $EMAIL = [guid]::NewGuid().ToString().Replace("-", "") + [guid]::NewGuid().ToString().Replace("-", "")
        $BACKUP = [guid]::NewGuid().ToString().Replace("-", "") + [guid]::NewGuid().ToString().Replace("-", "")
        $DB_PASS = [guid]::NewGuid().ToString().Replace("-", "")
        $BACKUP_PASS = [guid]::NewGuid().ToString().Replace("-", "")
        
        $envContent = Get-Content ".env"
        $envContent = $envContent -replace 'change-me-postgres-password', $DB_PASS
        $envContent = $envContent -replace 'change-me-jwt-secret', $JWT
        $envContent = $envContent -replace 'change-me-email-config-secret', $EMAIL
        $envContent = $envContent -replace 'change-me-64-hex-character-backup-key', $BACKUP
        $envContent = $envContent -replace 'change-me-backup-db-password', $BACKUP_PASS
        
        Set-Content ".env" $envContent -Encoding UTF8
        Write-Host "==> Auto-generated random secrets in .env"
    }
    
    docker compose up -d --build
    
    Write-Host "==> Waiting for backend container..."
    Start-Sleep -Seconds 10
    
    Write-Host "==> Running database migrations and seed..."
    # We attempt to run the migrations directly
    # Errors will be shown in the console if they fail, but won't crash the script
    try {
        docker compose exec backend deno task prisma:deploy
        docker compose exec backend deno task prisma:generate
        docker compose exec backend deno task seed
    } catch {
        Write-Host "==> Notice: A seed command had an issue, or containers aren't ready yet."
    }
    
    Write-Host ""
    Write-Host "=========================================================="
    Write-Host "==> System is running via Docker Compose!"
    Write-Host "    Frontend: http://localhost"
    Write-Host "    Backend:  http://localhost:3001"
    Write-Host ""
    Write-Host "    To stop the system, run: docker compose down"
    Write-Host "=========================================================="
}
