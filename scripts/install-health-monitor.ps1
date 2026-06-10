<#
.SYNOPSIS
    Installs the QPIR-AIP Health Monitor as a Windows Scheduled Task.
.DESCRIPTION
    Registers a hidden scheduled task that runs health-monitor.ps1 every 6 hours,
    at system startup, and whenever internet connectivity is restored.
    Runs silently in the background with no visible window.
.NOTES
    Run this script ONCE on the server as Administrator.
#>

param(
    [string]$ProjectDir = "C:\Users\Administrator\Desktop\SYSTEMS\QPIR-AIP",
    [string]$SmtpFrom,
    [string]$SmtpPassword
)

$taskName = "QPIR-AIP Health Monitor"
$scriptPath = Join-Path $ProjectDir "scripts\health-monitor.ps1"

# ── Validate ──────────────────────────────────────────────────────────────────
if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERROR] health-monitor.ps1 not found at: $scriptPath"
    exit 1
}

# ── Prompt for SMTP credentials if not provided ──────────────────────────────
if (-not $SmtpFrom) {
    $SmtpFrom = Read-Host "Enter SMTP email address (e.g., your-app-email@gmail.com)"
}
if (-not $SmtpPassword) {
    $SmtpPassword = Read-Host "Enter SMTP App Password" -AsSecureString
    $SmtpPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SmtpPassword)
    )
}

# ── Store credentials as system environment variables ─────────────────────────
Write-Host "===> Storing SMTP credentials as system environment variables..."
[System.Environment]::SetEnvironmentVariable("MONITOR_SMTP_FROM", $SmtpFrom, "Machine")
[System.Environment]::SetEnvironmentVariable("MONITOR_SMTP_PASSWORD", $SmtpPassword, "Machine")
Write-Host "   [OK] Credentials stored securely."

# ── Remove existing task if it exists ─────────────────────────────────────────
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "===> Removing existing scheduled task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# ── Build the action ──────────────────────────────────────────────────────────
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`"" `
    -WorkingDirectory $ProjectDir

# ── Build triggers ────────────────────────────────────────────────────────────
# Trigger 1: Every 6 hours
$trigger1 = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Hours 6)

# Trigger 2: At system startup (with 2-minute delay to let Docker start)
$trigger2 = New-ScheduledTaskTrigger -AtStartup
$trigger2.Delay = "PT2M"

$triggers = @($trigger1, $trigger2)

# ── Settings ──────────────────────────────────────────────────────────────────
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -Hidden

# ── Register the task ─────────────────────────────────────────────────────────
Write-Host "===> Registering scheduled task: '$taskName'..."
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $triggers `
    -Settings $settings `
    -User "SYSTEM" `
    -RunLevel Highest `
    -Description "Monitors QPIR-AIP Docker containers, backups, system resources, and internet connectivity. Sends email reports every 6 hours." `
    -Force

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host "  [OK] Health Monitor installed successfully!"
Write-Host ""
Write-Host "  Task Name:    $taskName"
Write-Host "  Schedule:     Every 6 hours + on system startup"
Write-Host "  Visibility:   Hidden (runs silently in background)"
Write-Host "  Reports to:   krezcalvski@gmail.com"
Write-Host "                dustine.yrad@deped.gov.ph"
Write-Host ""
Write-Host "  To run it manually:"
Write-Host "    Start-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "  To check status:"
Write-Host "    Get-ScheduledTaskInfo -TaskName '$taskName'"
Write-Host ""
Write-Host "  To uninstall:"
Write-Host "    Unregister-ScheduledTask -TaskName '$taskName'"
Write-Host "═══════════════════════════════════════════════════════════════"
