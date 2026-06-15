<#
.SYNOPSIS
    QPIR-AIP Server Setup — Installs all background services in one go.
.DESCRIPTION
    Run this ONCE on the Windows Server as Administrator. It will:
      1. Install the GitHub Actions Runner as a Windows Service (auto-deploy)
      2. Install Docker Compose autostart as a hidden Scheduled Task
      3. Install the Health Monitor as a hidden Scheduled Task (email reports)
    These run silently in the background and survive reboots.
.NOTES
    Run from: C:\Users\Administrator\Desktop\SYSTEMS
#>

param(
    [string]$ProjectDir = "C:\Users\Administrator\Desktop\SYSTEMS\QPIR-AIP",
    [string]$RunnerDir  = "C:\Users\Administrator\Desktop\SYSTEMS\autostart",
    [switch]$EnableSsl,
    [switch]$EnableBackup
)

$ErrorActionPreference = "Continue"

function Install-RunnerScheduledTask {
    param(
        [string]$RunnerDir,
        [string]$TaskName = "QPIR-AIP Actions Runner Autostart"
    )

    $runCmd = Join-Path $RunnerDir "run.cmd"
    if (-not (Test-Path $runCmd)) {
        Write-Host "  [WARN]  run.cmd not found at: $runCmd" -ForegroundColor Yellow
        return $false
    }

    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "  ===> Replacing existing runner scheduled task..." -ForegroundColor White
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
    Write-Host "  [OK] Runner scheduled task installed and started: $TaskName" -ForegroundColor Green
    return $true
}

function Install-ActionsRunnerAutostart {
    param([string]$RunnerDir)

    $svcCmd = Join-Path $RunnerDir "svc.cmd"
    $runCmd = Join-Path $RunnerDir "run.cmd"

    if (-not (Test-Path $RunnerDir)) {
        Write-Host "  [WARN]  GitHub Actions Runner folder not found at: $RunnerDir" -ForegroundColor Yellow
        Write-Host "     Skipping runner autostart installation." -ForegroundColor Yellow
        return
    }

    if (Test-Path $svcCmd) {
        $runnerService = Get-Service -Name "actions.runner.*" -ErrorAction SilentlyContinue
        if ($runnerService) {
            Write-Host "  [OK] Runner service is already installed: $($runnerService.Name)" -ForegroundColor Green
            if ($runnerService.Status -ne "Running") {
                Write-Host "  ===> Starting runner service..." -ForegroundColor White
                Push-Location $RunnerDir
                & .\svc.cmd start
                Pop-Location
            }
            Write-Host "  [OK] Runner service is running." -ForegroundColor Green
            return
        }

        Write-Host "  ===> Installing GitHub Actions Runner as a Windows Service..." -ForegroundColor White
        Push-Location $RunnerDir
        & .\svc.cmd install
        Write-Host "  ===> Starting runner service..." -ForegroundColor White
        & .\svc.cmd start
        Pop-Location
        Write-Host "  [OK] Runner service installed and started." -ForegroundColor Green
        return
    }

    if (Test-Path $runCmd) {
        Write-Host "  [WARN]  svc.cmd not found, but run.cmd exists." -ForegroundColor Yellow
        Write-Host "     Installing a scheduled-task fallback for this newly fetched runner." -ForegroundColor Yellow
        Install-RunnerScheduledTask -RunnerDir $RunnerDir | Out-Null
        return
    }

    Write-Host "  [WARN]  No svc.cmd or run.cmd found in: $RunnerDir" -ForegroundColor Yellow
    Write-Host "     Please configure the GitHub Actions runner first, then re-run this script." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  QPIR-AIP Background Services Installer" -ForegroundColor Cyan
Write-Host "  This will install background services to run silently forever." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ══════════════════════════════════════════════════════════════════════════════
# SERVICE 1: GitHub Actions Runner (Auto-Deploy)
# ══════════════════════════════════════════════════════════════════════════════
Write-Host "──────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  [1/3] GitHub Actions Runner (Auto-Deploy)" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

Install-ActionsRunnerAutostart -RunnerDir $RunnerDir

Write-Host ""

# ══════════════════════════════════════════════════════════════════════════════
# SERVICE 2: Docker Compose Autostart
# ══════════════════════════════════════════════════════════════════════════════
Write-Host "──────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  [2/3] Docker Compose Autostart" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$dockerAutostartScript = Join-Path $ProjectDir "scripts\install-docker-autostart.ps1"
if (-not (Test-Path $dockerAutostartScript)) {
    Write-Host "  [ERROR] install-docker-autostart.ps1 not found at: $dockerAutostartScript" -ForegroundColor Red
    Write-Host "     Please make sure you have pulled the latest code." -ForegroundColor Red
} else {
    $dockerArgs = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $dockerAutostartScript,
        "-ProjectDir", $ProjectDir
    )
    if ($EnableSsl) { $dockerArgs += "-EnableSsl" }
    if ($EnableBackup) { $dockerArgs += "-EnableBackup" }

    Write-Host "  ===> Installing Docker boot autostart task..." -ForegroundColor White
    & powershell.exe @dockerArgs
}

Write-Host ""

# ══════════════════════════════════════════════════════════════════════════════
# SERVICE 3: Health Monitor (Email Reports)
# ══════════════════════════════════════════════════════════════════════════════
Write-Host "──────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  [3/3] Health Monitor (Email Reports)" -ForegroundColor Yellow
Write-Host "──────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$monitorScript = Join-Path $ProjectDir "scripts\health-monitor.ps1"
$taskName = "QPIR-AIP Health Monitor"

if (-not (Test-Path $monitorScript)) {
    Write-Host "  [ERROR] health-monitor.ps1 not found at: $monitorScript" -ForegroundColor Red
    Write-Host "     Please make sure you have pulled the latest code." -ForegroundColor Red
} else {
    # Prompt for SMTP credentials
    Write-Host ""
    Write-Host "  To send email reports, we need an email account to send FROM." -ForegroundColor White
    Write-Host "  (Use a Gmail address with an App Password, NOT your real password)" -ForegroundColor DarkGray
    Write-Host ""

    $SmtpFrom = Read-Host "  Enter sender email address (e.g., myapp@gmail.com)"
    $SmtpPassSecure = Read-Host "  Enter App Password for that email" -AsSecureString
    $SmtpPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SmtpPassSecure)
    )

    # Store credentials as system environment variables (persist across reboots)
    Write-Host "  ===> Storing SMTP credentials securely..." -ForegroundColor White
    [System.Environment]::SetEnvironmentVariable("MONITOR_SMTP_FROM", $SmtpFrom, "Machine")
    [System.Environment]::SetEnvironmentVariable("MONITOR_SMTP_PASSWORD", $SmtpPassword, "Machine")

    # Remove existing task if present
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Write-Host "  ===> Removing existing scheduled task..." -ForegroundColor White
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    # Build the action
    $action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$monitorScript`"" `
        -WorkingDirectory $ProjectDir

    # Trigger 1: Every 6 hours
    $trigger1 = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Hours 6)

    # Trigger 2: At system startup (with 2-minute delay for Docker to boot)
    $trigger2 = New-ScheduledTaskTrigger -AtStartup
    $trigger2.Delay = "PT2M"

    # Settings: hidden, no UI, survives reboots
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable:$false `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 5) `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
        -Hidden

    # Register the task
    Write-Host "  ===> Registering health monitor as a hidden background task..." -ForegroundColor White
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger @($trigger1, $trigger2) `
        -Settings $settings `
        -User "SYSTEM" `
        -RunLevel Highest `
        -Description "QPIR-AIP: Monitors Docker containers, backups, system health, and internet connectivity. Sends email reports every 6 hours." `
        -Force | Out-Null

    Write-Host "  [OK] Health Monitor installed and hidden." -ForegroundColor Green

    # Run it immediately so the user gets their first report right away
    Write-Host "  ===> Sending your first health report now..." -ForegroundColor White
    Start-ScheduledTask -TaskName $taskName
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  [OK] ALL BACKGROUND SERVICES INSTALLED!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  [AUTO] Auto-Deploy:     GitHub Actions Runner (service or startup task)" -ForegroundColor White
Write-Host "     -> Listens for pushes and auto-deploys your code." -ForegroundColor DarkGray
Write-Host "" -ForegroundColor Green
Write-Host "  [BOOT] Docker Autostart: Scheduled Task (on startup)" -ForegroundColor White
Write-Host "     -> Starts Docker Compose after power loss/reboot." -ForegroundColor DarkGray
Write-Host "" -ForegroundColor Green
Write-Host "  [STATS] Health Monitor:  Scheduled Task (every 6h + on startup)" -ForegroundColor White
Write-Host "     -> Sends reports to:" -ForegroundColor DarkGray
Write-Host "       krezcalvski@gmail.com" -ForegroundColor DarkGray
Write-Host "       dustine.yrad@deped.gov.ph" -ForegroundColor DarkGray
Write-Host "" -ForegroundColor Green
Write-Host "  You can safely close this window. Everything runs silently." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
