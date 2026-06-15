<#
.SYNOPSIS
    Installs a Windows Scheduled Task that starts the QPIR-AIP Docker stack at boot.
.DESCRIPTION
    Run once as Administrator on the deployment server. The task runs `docker compose up -d`
    after startup so the app comes back after a power cut without opening a terminal.

    The compose file already uses `restart: unless-stopped`; this task is the extra nudge
    Windows needs to make sure the compose project is started after Docker becomes available.
.EXAMPLE
    .\scripts\install-docker-autostart.ps1
.EXAMPLE
    .\scripts\install-docker-autostart.ps1 -ProjectDir "C:\Users\Administrator\Desktop\SYSTEMS\QPIR-AIP" -EnableSsl -EnableBackup
#>

param(
    [string]$ProjectDir = "C:\Users\Administrator\Desktop\SYSTEMS\QPIR-AIP",
    [string]$EnvFile = ".env",
    [string]$TaskName = "QPIR-AIP Docker Autostart",
    [switch]$EnableSsl,
    [switch]$EnableBackup,
    [int]$StartupDelayMinutes = 2
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Run this script from an elevated PowerShell window (Run as Administrator)."
    }
}

Require-Admin

if (-not (Test-Path $ProjectDir)) {
    throw "Project directory not found: $ProjectDir"
}

$composeFile = Join-Path $ProjectDir "docker-compose.yml"
if (-not (Test-Path $composeFile)) {
    throw "docker-compose.yml not found at: $composeFile"
}

$envPath = if ([IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $ProjectDir $EnvFile }
if (-not (Test-Path $envPath)) {
    throw "Environment file not found: $envPath"
}

$profileArgs = @()
if ($EnableSsl) { $profileArgs += "--profile ssl" }
if ($EnableBackup) { $profileArgs += "--profile backup" }
$profiles = if ($profileArgs.Count -gt 0) { ($profileArgs -join " ") + " " } else { "" }

$taskScript = @"
`$ErrorActionPreference = "Continue"
Set-Location "$ProjectDir"

for (`$i = 1; `$i -le 30; `$i++) {
    docker version *>`$null
    if (`$LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 10
}

docker compose --env-file "$envPath" ${profiles}up -d
"@

$taskScriptPath = Join-Path $ProjectDir ".docker-autostart.ps1"
Set-Content -Path $taskScriptPath -Value $taskScript -Encoding UTF8

Write-Step "Registering scheduled task"
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$taskScriptPath`"" `
    -WorkingDirectory $ProjectDir

$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$startupTrigger.Delay = "PT$StartupDelayMinutes`M"

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 3) `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 20)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $startupTrigger `
    -Settings $settings `
    -User "SYSTEM" `
    -RunLevel Highest `
    -Description "Starts the QPIR-AIP Docker Compose stack after Windows startup." `
    -Force | Out-Null

Write-Step "Starting task once now"
Start-ScheduledTask -TaskName $TaskName

Write-Host ""
Write-Host "[OK] Docker autostart installed." -ForegroundColor Green
Write-Host "Task: $TaskName"
Write-Host "Script: $taskScriptPath"
Write-Host ""
Write-Host "Check status with:"
Write-Host "  Get-ScheduledTask -TaskName `"$TaskName`""
Write-Host "  docker compose --env-file `"$envPath`" ps"
