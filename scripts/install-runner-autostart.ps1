<#
.SYNOPSIS
    Installs GitHub Actions runner autostart for QPIR-AIP.
.DESCRIPTION
    Run once as Administrator on the Windows server. If the runner folder has
    svc.cmd, this installs the official GitHub Actions Windows service. If the
    runner folder only has run.cmd, this installs a startup Scheduled Task
    fallback so the runner starts after reboot/power loss.
.EXAMPLE
    .\scripts\install-runner-autostart.ps1
.EXAMPLE
    .\scripts\install-runner-autostart.ps1 -RunnerDir "C:\Users\Administrator\Desktop\SYSTEMS\autostart"
#>

param(
    [string]$RunnerDir = "C:\Users\Administrator\Desktop\SYSTEMS\autostart",
    [string]$TaskName = "QPIR-AIP Actions Runner Autostart"
)

$ErrorActionPreference = "Stop"

function Require-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Run this script from an elevated PowerShell window (Run as Administrator)."
    }
}

function Install-RunnerScheduledTask {
    param(
        [string]$RunnerDir,
        [string]$TaskName
    )

    $runCmd = Join-Path $RunnerDir "run.cmd"
    if (-not (Test-Path $runCmd)) {
        throw "run.cmd not found at: $runCmd"
    }

    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "==> Replacing existing runner scheduled task..."
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    $action = New-ScheduledTaskAction `
        -Execute "cmd.exe" `
        -Argument "/c `"$runCmd`"" `
        -WorkingDirectory $RunnerDir

    $startupTrigger = New-ScheduledTaskTrigger -AtStartup
    $startupTrigger.Delay = "PT1M"

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable:$false `
        -RestartCount 5 `
        -RestartInterval (New-TimeSpan -Minutes 3) `
        -ExecutionTimeLimit (New-TimeSpan -Days 30) `
        -Hidden

    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $action `
        -Trigger $startupTrigger `
        -Settings $settings `
        -User "SYSTEM" `
        -RunLevel Highest `
        -Description "Starts the QPIR-AIP GitHub Actions runner from run.cmd after Windows startup." `
        -Force | Out-Null

    Start-ScheduledTask -TaskName $TaskName
    Write-Host "[OK] Runner scheduled task installed and started: $TaskName" -ForegroundColor Green
}

Require-Admin

if (-not (Test-Path $RunnerDir)) {
    throw "Runner folder not found: $RunnerDir"
}

$svcCmd = Join-Path $RunnerDir "svc.cmd"
$runCmd = Join-Path $RunnerDir "run.cmd"

if (Test-Path $svcCmd) {
    $runnerService = Get-Service -Name "actions.runner.*" -ErrorAction SilentlyContinue
    if ($runnerService) {
        Write-Host "[OK] Runner service already installed: $($runnerService.Name)" -ForegroundColor Green
        if ($runnerService.Status -ne "Running") {
            Push-Location $RunnerDir
            & .\svc.cmd start
            Pop-Location
        }
        exit 0
    }

    Push-Location $RunnerDir
    & .\svc.cmd install
    & .\svc.cmd start
    Pop-Location
    Write-Host "[OK] Runner service installed and started." -ForegroundColor Green
    exit 0
}

if (Test-Path $runCmd) {
    Write-Host "[WARN] svc.cmd not found. Installing run.cmd scheduled-task fallback." -ForegroundColor Yellow
    Install-RunnerScheduledTask -RunnerDir $RunnerDir -TaskName $TaskName
    exit 0
}

throw "No svc.cmd or run.cmd found in: $RunnerDir"
