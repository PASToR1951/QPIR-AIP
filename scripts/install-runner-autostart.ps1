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

function Test-RunnerRoot {
    param([string]$Path)

    if (-not $Path -or -not (Test-Path $Path)) { return $false }
    return (Test-Path (Join-Path $Path "svc.cmd")) -or
        (Test-Path (Join-Path $Path "run.cmd"))
}

function Resolve-RunnerRoot {
    param([string]$RequestedRunnerDir)

    $projectDir = Split-Path -Parent $PSScriptRoot
    $systemsDir = Split-Path -Parent $projectDir
    $candidates = @(
        $RequestedRunnerDir,
        (Join-Path $RequestedRunnerDir "actions-runner"),
        (Join-Path $RequestedRunnerDir "runner"),
        (Join-Path $RequestedRunnerDir "github-runner"),
        (Join-Path $projectDir "actions-runner"),
        (Join-Path $projectDir "autostart"),
        (Join-Path $systemsDir "actions-runner"),
        (Join-Path $systemsDir "autostart")
    ) | Select-Object -Unique

    foreach ($candidate in $candidates) {
        if (Test-RunnerRoot -Path $candidate) {
            return [pscustomobject]@{
                Path = $candidate
                Checked = $candidates
            }
        }
    }

    if (Test-Path $RequestedRunnerDir) {
        $nestedRunCmd = Get-ChildItem -Path $RequestedRunnerDir -Filter "run.cmd" -File -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($nestedRunCmd) {
            return [pscustomobject]@{
                Path = $nestedRunCmd.Directory.FullName
                Checked = $candidates
            }
        }
    }

    return [pscustomobject]@{
        Path = $null
        Checked = $candidates
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

$resolvedRunner = Resolve-RunnerRoot -RequestedRunnerDir $RunnerDir
if (-not $resolvedRunner.Path) {
    Write-Host "[ERROR] Could not find a GitHub Actions runner folder." -ForegroundColor Red
    Write-Host "Checked these paths:"
    foreach ($candidate in $resolvedRunner.Checked) {
        Write-Host "  - $candidate"
    }
    Write-Host ""
    Write-Host "The runner folder must contain svc.cmd or run.cmd."
    Write-Host "If your runner is elsewhere, pass it explicitly:"
    Write-Host '  powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-runner-autostart.ps1 -RunnerDir "C:\path\to\runner"'
    exit 1
}

$RunnerDir = $resolvedRunner.Path
Write-Host "==> Using runner folder: $RunnerDir"

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
