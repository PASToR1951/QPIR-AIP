<#
.SYNOPSIS
    Sends a test email using the same SMTP settings as the health monitor.
.DESCRIPTION
    Uses MONITOR_SMTP_FROM and MONITOR_SMTP_PASSWORD by default, which are set by
    scripts/install-services.ps1 or scripts/install-health-monitor.ps1.
.EXAMPLE
    .\scripts\send-test-email.ps1
.EXAMPLE
    .\scripts\send-test-email.ps1 -Recipients admin@example.com
#>

param(
    [string]$SmtpServer = "smtp.gmail.com",
    [int]$SmtpPort = 587,
    [string]$SmtpFrom = "",
    [string]$SmtpPassword = "",
    [string[]]$Recipients = @("krezcalvski@gmail.com", "dustine.yrad@deped.gov.ph")
)

$ErrorActionPreference = "Stop"

if (-not $SmtpFrom) { $SmtpFrom = $env:MONITOR_SMTP_FROM }
if (-not $SmtpPassword) { $SmtpPassword = $env:MONITOR_SMTP_PASSWORD }

if (-not $SmtpFrom) {
    throw "Missing sender email. Set MONITOR_SMTP_FROM or pass -SmtpFrom."
}

if (-not $SmtpPassword) {
    throw "Missing SMTP password. Set MONITOR_SMTP_PASSWORD or pass -SmtpPassword."
}

if (-not $Recipients -or $Recipients.Count -eq 0) {
    throw "At least one recipient is required."
}

$hostname = $env:COMPUTERNAME
if (-not $hostname) { $hostname = [System.Net.Dns]::GetHostName() }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$subject = "[TEST] QPIR-AIP SMTP Test - $hostname - $timestamp"
$body = @"
<!doctype html>
<html>
<body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
    <h2 style="margin:0 0 12px;color:#2563eb;">QPIR-AIP Test Email</h2>
    <p style="margin:0 0 12px;">SMTP email sending is working.</p>
    <p style="margin:0;color:#64748b;font-size:13px;">
      Host: <strong>$hostname</strong><br>
      Sent: <strong>$timestamp</strong><br>
      From: <strong>$SmtpFrom</strong>
    </p>
  </div>
</body>
</html>
"@

try {
    $securePassword = ConvertTo-SecureString $SmtpPassword -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($SmtpFrom, $securePassword)

    Send-MailMessage `
        -From $SmtpFrom `
        -To $Recipients `
        -Subject $subject `
        -Body $body `
        -BodyAsHtml `
        -SmtpServer $SmtpServer `
        -Port $SmtpPort `
        -UseSsl `
        -Credential $credential

    Write-Host "[OK] Test email sent to: $($Recipients -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Test email failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
