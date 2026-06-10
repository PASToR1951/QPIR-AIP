<#
.SYNOPSIS
    QPIR-AIP System Health Monitor
.DESCRIPTION
    Checks internet connectivity, Docker container health, backup status,
    and system resources. Sends a styled HTML email report.
    Caches alerts when offline and sends them when connectivity is restored.
.NOTES
    Designed to run as a Windows Scheduled Task every 6 hours.
#>

param(
    [string]$ProjectDir = "C:\Users\Administrator\Desktop\SYSTEMS\QPIR-AIP",
    [string]$SmtpServer = "smtp.gmail.com",
    [int]$SmtpPort = 587,
    [string]$SmtpFrom = "",       # Set via MONITOR_SMTP_FROM env var or parameter
    [string]$SmtpPassword = "",   # Set via MONITOR_SMTP_PASSWORD env var or parameter
    [string[]]$Recipients = @("krezcalvski@gmail.com", "dustine.yrad@deped.gov.ph")
)

# ── Configuration ─────────────────────────────────────────────────────────────
$ErrorActionPreference = "Continue"
$COMPOSE_PROJECT = "qpir-aip"
$ALERT_CACHE_FILE = Join-Path $ProjectDir "backups\offline_alerts.json"
$BACKUP_STATUS_FILE = Join-Path $ProjectDir "backups\status.json"
$BACKUP_DIR = Join-Path $ProjectDir "backups"

# Allow env vars to override parameters
if (-not $SmtpFrom)     { $SmtpFrom     = $env:MONITOR_SMTP_FROM }
if (-not $SmtpPassword) { $SmtpPassword = $env:MONITOR_SMTP_PASSWORD }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$hostname  = $env:COMPUTERNAME

# ── Helper: Severity Badge ────────────────────────────────────────────────────
function Get-Badge {
    param([string]$Level)
    switch ($Level.ToLower()) {
        "healthy"  { return '<span style="background:#10b981;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">✅ HEALTHY</span>' }
        "warning"  { return '<span style="background:#f59e0b;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">⚠️ WARNING</span>' }
        "critical" { return '<span style="background:#ef4444;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">🚨 CRITICAL</span>' }
        "offline"  { return '<span style="background:#6b7280;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">📡 OFFLINE</span>' }
        default    { return '<span style="background:#3b82f6;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">ℹ️ INFO</span>' }
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# 1. INTERNET CONNECTIVITY CHECK
# ══════════════════════════════════════════════════════════════════════════════
$internetStatus = "Connected"
$internetBadge  = Get-Badge "healthy"
$internetDetails = ""

try {
    $ping1 = Test-Connection -ComputerName "8.8.8.8" -Count 2 -Quiet -ErrorAction Stop
    $ping2 = Test-Connection -ComputerName "1.1.1.1" -Count 2 -Quiet -ErrorAction Stop
    $dns   = Resolve-DnsName "google.com" -ErrorAction Stop

    if (-not $ping1 -and -not $ping2) {
        $internetStatus = "No Internet"
        $internetBadge  = Get-Badge "critical"
        $internetDetails = "Cannot reach Google DNS (8.8.8.8) or Cloudflare DNS (1.1.1.1)."
    } elseif (-not $dns) {
        $internetStatus = "DNS Failure"
        $internetBadge  = Get-Badge "warning"
        $internetDetails = "Pings succeed but DNS resolution is failing."
    } else {
        $latency = (Test-Connection -ComputerName "8.8.8.8" -Count 3 -ErrorAction Stop | Measure-Object -Property Latency -Average).Average
        $internetDetails = "Latency to 8.8.8.8: $([math]::Round($latency, 1)) ms"
    }
} catch {
    $internetStatus = "No Internet"
    $internetBadge  = Get-Badge "critical"
    $internetDetails = "Network test failed: $($_.Exception.Message)"
}

# ══════════════════════════════════════════════════════════════════════════════
# 2. DOCKER CONTAINER HEALTH
# ══════════════════════════════════════════════════════════════════════════════
$containerRows = ""
$containerOverall = "healthy"

try {
    $containers = docker compose -p $COMPOSE_PROJECT ps --format json 2>$null | ForEach-Object { $_ | ConvertFrom-Json }

    if (-not $containers -or $containers.Count -eq 0) {
        $containerRows = '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:12px;">No containers found! Docker Compose may not be running.</td></tr>'
        $containerOverall = "critical"
    } else {
        foreach ($c in $containers) {
            $name   = $c.Name
            $state  = $c.State
            $health = if ($c.Health) { $c.Health } else { $state }
            $uptime = $c.Status

            if ($state -ne "running") {
                $rowColor = "#fef2f2"
                $statusBadge = Get-Badge "critical"
                $containerOverall = "critical"
            } elseif ($health -eq "unhealthy") {
                $rowColor = "#fffbeb"
                $statusBadge = Get-Badge "warning"
                if ($containerOverall -ne "critical") { $containerOverall = "warning" }
            } else {
                $rowColor = "#f0fdf4"
                $statusBadge = Get-Badge "healthy"
            }

            $containerRows += "<tr style='background:$rowColor;'><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>$name</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>$statusBadge</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>$state</td><td style='padding:8px 12px;border-bottom:1px solid #e5e7eb;'>$uptime</td></tr>"
        }
    }
} catch {
    $containerRows = "<tr><td colspan='4' style='text-align:center;color:#ef4444;padding:12px;'>Error querying Docker: $($_.Exception.Message)</td></tr>"
    $containerOverall = "critical"
}

$containerBadge = Get-Badge $containerOverall

# ══════════════════════════════════════════════════════════════════════════════
# 3. BACKUP STATUS
# ══════════════════════════════════════════════════════════════════════════════
$backupOverall = "healthy"
$backupDetails = ""

try {
    if (Test-Path $BACKUP_STATUS_FILE) {
        $backupJson = Get-Content $BACKUP_STATUS_FILE -Raw | ConvertFrom-Json

        $bStatus       = $backupJson.status
        $lastHourly    = $backupJson.last_hourly_backup
        $lastDaily     = $backupJson.last_daily_backup
        $hourlyCount   = $backupJson.hourly_count
        $dailyCount    = $backupJson.daily_count
        $hourlyAgeMins = $backupJson.hourly_age_minutes
        $cloudSync     = $backupJson.cloud_sync_status
        $alertLevel    = $backupJson.alert_level

        $backupOverall = if ($alertLevel) { $alertLevel } else { $bStatus }

        # Format age into human-readable
        $hourlyAgeStr = if ($hourlyAgeMins -and $hourlyAgeMins -lt 9999) {
            $days  = [math]::Floor($hourlyAgeMins / 1440)
            $hours = [math]::Floor(($hourlyAgeMins % 1440) / 60)
            if ($days -gt 0) { "${days}d ${hours}h ago" } else { "${hours}h ago" }
        } else { "Never" }

        $dailyAgeStr = if ($lastDaily) { $lastDaily } else { "Never" }

        $backupDetails = @"
        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
            <tr><td style="padding:6px 12px;color:#6b7280;width:200px;">Status</td><td style="padding:6px 12px;font-weight:600;">$(Get-Badge $backupOverall)</td></tr>
            <tr><td style="padding:6px 12px;color:#6b7280;">Last Hourly Backup</td><td style="padding:6px 12px;">$lastHourly ($hourlyAgeStr)</td></tr>
            <tr><td style="padding:6px 12px;color:#6b7280;">Last Daily Backup</td><td style="padding:6px 12px;">$dailyAgeStr</td></tr>
            <tr><td style="padding:6px 12px;color:#6b7280;">Hourly Backups Count</td><td style="padding:6px 12px;">$hourlyCount</td></tr>
            <tr><td style="padding:6px 12px;color:#6b7280;">Daily Backups Count</td><td style="padding:6px 12px;">$dailyCount</td></tr>
            <tr><td style="padding:6px 12px;color:#6b7280;">Cloud Sync</td><td style="padding:6px 12px;">$cloudSync</td></tr>
        </table>
"@
    } else {
        $backupOverall = "warning"
        $backupDetails = '<p style="color:#f59e0b;padding:8px;">⚠️ Backup status file not found. The backup service may not be running.</p>'
    }

    # Check backup directory sizes
    $hourlyDir = Join-Path $BACKUP_DIR "hourly"
    $dailyDir  = Join-Path $BACKUP_DIR "daily"
    $hourlyFiles = if (Test-Path $hourlyDir) { (Get-ChildItem $hourlyDir -File -ErrorAction SilentlyContinue).Count } else { 0 }
    $dailyFiles  = if (Test-Path $dailyDir)  { (Get-ChildItem $dailyDir -File -ErrorAction SilentlyContinue).Count  } else { 0 }
    $totalBackupSize = 0
    if (Test-Path $BACKUP_DIR) {
        $totalBackupSize = (Get-ChildItem $BACKUP_DIR -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    }
    $backupSizeMB = [math]::Round($totalBackupSize / 1MB, 2)

    $backupDetails += @"
    <table style="width:100%;border-collapse:collapse;margin-top:8px;border-top:1px solid #e5e7eb;">
        <tr><td style="padding:6px 12px;color:#6b7280;width:200px;">Hourly Backup Files</td><td style="padding:6px 12px;">$hourlyFiles files</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Daily Backup Files</td><td style="padding:6px 12px;">$dailyFiles files</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Total Backup Size</td><td style="padding:6px 12px;">$backupSizeMB MB</td></tr>
    </table>
"@

} catch {
    $backupOverall = "warning"
    $backupDetails = "<p style='color:#ef4444;padding:8px;'>Error reading backup status: $($_.Exception.Message)</p>"
}

$backupBadge = Get-Badge $backupOverall

# ══════════════════════════════════════════════════════════════════════════════
# 4. SYSTEM RESOURCES
# ══════════════════════════════════════════════════════════════════════════════
$resourceOverall = "healthy"

try {
    # CPU
    $cpuLoad = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average, 1)
    if ($cpuLoad -gt 90) { $cpuBadge = Get-Badge "critical"; $resourceOverall = "critical" }
    elseif ($cpuLoad -gt 70) { $cpuBadge = Get-Badge "warning"; if ($resourceOverall -ne "critical") { $resourceOverall = "warning" } }
    else { $cpuBadge = Get-Badge "healthy" }

    # Memory
    $os = Get-CimInstance Win32_OperatingSystem
    $totalRAM  = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeRAM   = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $usedRAM   = [math]::Round($totalRAM - $freeRAM, 2)
    $ramPercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)
    if ($ramPercent -gt 90) { $ramBadge = Get-Badge "critical"; $resourceOverall = "critical" }
    elseif ($ramPercent -gt 75) { $ramBadge = Get-Badge "warning"; if ($resourceOverall -ne "critical") { $resourceOverall = "warning" } }
    else { $ramBadge = Get-Badge "healthy" }

    # Disk
    $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
    $totalDisk  = [math]::Round($disk.Size / 1GB, 2)
    $freeDisk   = [math]::Round($disk.FreeSpace / 1GB, 2)
    $usedDisk   = [math]::Round($totalDisk - $freeDisk, 2)
    $diskPercent = [math]::Round(($usedDisk / $totalDisk) * 100, 1)
    if ($diskPercent -gt 90) { $diskBadge = Get-Badge "critical"; $resourceOverall = "critical" }
    elseif ($diskPercent -gt 75) { $diskBadge = Get-Badge "warning"; if ($resourceOverall -ne "critical") { $resourceOverall = "warning" } }
    else { $diskBadge = Get-Badge "healthy" }

    # Uptime
    $uptime = (Get-Date) - $os.LastBootUpTime
    $uptimeStr = "$($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"

    $resourceDetails = @"
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 12px;color:#6b7280;width:200px;">CPU Usage</td><td style="padding:6px 12px;">$cpuBadge &nbsp; ${cpuLoad}%</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">RAM Usage</td><td style="padding:6px 12px;">$ramBadge &nbsp; ${usedRAM} GB / ${totalRAM} GB (${ramPercent}%)</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Disk Usage (C:)</td><td style="padding:6px 12px;">$diskBadge &nbsp; ${usedDisk} GB / ${totalDisk} GB (${diskPercent}%)</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280;">Server Uptime</td><td style="padding:6px 12px;">$uptimeStr</td></tr>
    </table>
"@
} catch {
    $resourceOverall = "warning"
    $resourceDetails = "<p style='color:#ef4444;'>Error reading system resources: $($_.Exception.Message)</p>"
}

$resourceBadge = Get-Badge $resourceOverall

# ══════════════════════════════════════════════════════════════════════════════
# 5. DOCKER RESOURCE USAGE
# ══════════════════════════════════════════════════════════════════════════════
$dockerStatsRows = ""
try {
    $statsRaw = docker stats --no-stream --format "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}|{{.BlockIO}}" 2>$null
    if ($statsRaw) {
        foreach ($line in $statsRaw) {
            $parts = $line -split '\|'
            if ($parts.Count -ge 5 -and $parts[0] -match $COMPOSE_PROJECT) {
                $dockerStatsRows += "<tr><td style='padding:6px 12px;border-bottom:1px solid #e5e7eb;'>$($parts[0])</td><td style='padding:6px 12px;border-bottom:1px solid #e5e7eb;'>$($parts[1])</td><td style='padding:6px 12px;border-bottom:1px solid #e5e7eb;'>$($parts[2])</td><td style='padding:6px 12px;border-bottom:1px solid #e5e7eb;'>$($parts[3])</td><td style='padding:6px 12px;border-bottom:1px solid #e5e7eb;'>$($parts[4])</td></tr>"
            }
        }
    }
} catch { }

if (-not $dockerStatsRows) {
    $dockerStatsRows = '<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:12px;">No Docker stats available.</td></tr>'
}

# ══════════════════════════════════════════════════════════════════════════════
# 6. DETERMINE OVERALL SEVERITY
# ══════════════════════════════════════════════════════════════════════════════
$overallSeverity = "healthy"
$isOffline = $internetStatus -ne "Connected"

if ($isOffline) { $overallSeverity = "offline" }
foreach ($s in @($containerOverall, $backupOverall, $resourceOverall)) {
    if ($s -eq "critical") { $overallSeverity = "critical"; break }
    if ($s -eq "warning" -and $overallSeverity -notin @("critical","offline")) { $overallSeverity = "warning" }
}

$overallBadge = Get-Badge $overallSeverity
$subjectPrefix = switch ($overallSeverity) {
    "critical" { "🚨 CRITICAL" }
    "warning"  { "⚠️ WARNING" }
    "offline"  { "📡 OFFLINE" }
    default    { "✅ HEALTHY" }
}

# ══════════════════════════════════════════════════════════════════════════════
# 7. BUILD HTML EMAIL
# ══════════════════════════════════════════════════════════════════════════════
$offlineAlert = ""
if ($isOffline) {
    $offlineAlert = @"
    <div style="background:#1f2937;border:2px solid #ef4444;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
        <span style="font-size:36px;">📡</span>
        <h2 style="color:#ef4444;margin:8px 0 4px;">SERVER IS OFFLINE</h2>
        <p style="color:#d1d5db;margin:0;">$internetDetails</p>
        <p style="color:#9ca3af;margin:8px 0 0;font-size:12px;">This alert was cached and will be sent when connectivity is restored.</p>
    </div>
"@
}

$htmlBody = @"
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<div style="max-width:680px;margin:0 auto;padding:24px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:16px 16px 0 0;padding:32px;text-align:center;border-bottom:3px solid #3b82f6;">
        <h1 style="color:#f8fafc;margin:0;font-size:22px;letter-spacing:1px;">QPIR-AIP System Health Report</h1>
        <p style="color:#94a3b8;margin:8px 0 16px;font-size:13px;">$hostname &bull; $timestamp</p>
        <div>$overallBadge</div>
    </div>

    <!-- Body -->
    <div style="background:#1e293b;padding:24px;border-radius:0 0 16px 16px;">

        $offlineAlert

        <!-- Internet Connectivity -->
        <div style="background:#0f172a;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h3 style="color:#f8fafc;margin:0 0 8px;">🌐 Internet Connectivity &nbsp; $internetBadge</h3>
            <p style="color:#cbd5e1;margin:0;font-size:13px;">$internetDetails</p>
        </div>

        <!-- Container Health -->
        <div style="background:#0f172a;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h3 style="color:#f8fafc;margin:0 0 12px;">🐳 Docker Containers &nbsp; $containerBadge</h3>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#1e293b;">
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">Container</th>
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">Health</th>
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">State</th>
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">Uptime</th>
                    </tr>
                </thead>
                <tbody style="color:#e2e8f0;font-size:13px;">
                    $containerRows
                </tbody>
            </table>
        </div>

        <!-- Docker Resource Usage -->
        <div style="background:#0f172a;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h3 style="color:#f8fafc;margin:0 0 12px;">📊 Container Resource Usage</h3>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#1e293b;">
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">Container</th>
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">CPU</th>
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">Memory</th>
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">Net I/O</th>
                        <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;text-transform:uppercase;border-bottom:2px solid #334155;">Disk I/O</th>
                    </tr>
                </thead>
                <tbody style="color:#e2e8f0;font-size:13px;">
                    $dockerStatsRows
                </tbody>
            </table>
        </div>

        <!-- Backup Status -->
        <div style="background:#0f172a;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h3 style="color:#f8fafc;margin:0 0 8px;">💾 Backup Status &nbsp; $backupBadge</h3>
            <div style="color:#cbd5e1;font-size:13px;">
                $backupDetails
            </div>
        </div>

        <!-- System Resources -->
        <div style="background:#0f172a;border-radius:12px;padding:16px;margin-bottom:16px;">
            <h3 style="color:#f8fafc;margin:0 0 8px;">🖥️ System Resources &nbsp; $resourceBadge</h3>
            <div style="color:#cbd5e1;font-size:13px;">
                $resourceDetails
            </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:16px 0 0;border-top:1px solid #334155;margin-top:8px;">
            <p style="color:#64748b;font-size:11px;margin:0;">Automated report from QPIR-AIP Health Monitor</p>
            <p style="color:#475569;font-size:11px;margin:4px 0 0;">Server: $hostname &bull; IP: 222.127.76.11</p>
        </div>
    </div>
</div>
</body>
</html>
"@

# ══════════════════════════════════════════════════════════════════════════════
# 8. SEND OR CACHE THE EMAIL
# ══════════════════════════════════════════════════════════════════════════════
$subject = "[$subjectPrefix] QPIR-AIP Health — $hostname — $(Get-Date -Format 'MMM dd HH:mm')"

function Send-Report {
    param([string]$Subject, [string]$Body)

    if (-not $SmtpFrom -or -not $SmtpPassword) {
        Write-Host "⚠️ SMTP credentials not configured. Set MONITOR_SMTP_FROM and MONITOR_SMTP_PASSWORD environment variables."
        Write-Host "   Saving report to local HTML file instead..."
        $reportFile = Join-Path $ProjectDir "backups\health-report-$(Get-Date -Format 'yyyy-MM-dd-HHmm').html"
        $Body | Out-File -FilePath $reportFile -Encoding UTF8
        Write-Host "   Report saved to: $reportFile"
        return $false
    }

    try {
        $secPass = ConvertTo-SecureString $SmtpPassword -AsPlainText -Force
        $cred    = New-Object System.Management.Automation.PSCredential($SmtpFrom, $secPass)

        $mailParams = @{
            From       = $SmtpFrom
            To         = $Recipients
            Subject    = $Subject
            Body       = $Body
            BodyAsHtml = $true
            SmtpServer = $SmtpServer
            Port       = $SmtpPort
            UseSsl     = $true
            Credential = $cred
        }

        Send-MailMessage @mailParams
        Write-Host "✅ Health report sent to: $($Recipients -join ', ')"
        return $true
    } catch {
        Write-Host "❌ Failed to send email: $($_.Exception.Message)"
        return $false
    }
}

if ($isOffline) {
    # Cache the alert for later delivery
    Write-Host "📡 System is offline. Caching alert for later delivery..."
    $cachedAlert = @{
        timestamp = $timestamp
        subject   = $subject
        body      = $htmlBody
    }

    $existingAlerts = @()
    if (Test-Path $ALERT_CACHE_FILE) {
        try { $existingAlerts = Get-Content $ALERT_CACHE_FILE -Raw | ConvertFrom-Json } catch { $existingAlerts = @() }
    }
    $allAlerts = @($existingAlerts) + @($cachedAlert)
    $allAlerts | ConvertTo-Json -Depth 5 | Out-File -FilePath $ALERT_CACHE_FILE -Encoding UTF8
    Write-Host "   Cached. Total pending alerts: $($allAlerts.Count)"
} else {
    # Send any cached offline alerts first
    if (Test-Path $ALERT_CACHE_FILE) {
        try {
            $cached = Get-Content $ALERT_CACHE_FILE -Raw | ConvertFrom-Json
            if ($cached -and $cached.Count -gt 0) {
                Write-Host "📬 Found $($cached.Count) cached offline alert(s). Sending..."
                foreach ($alert in $cached) {
                    Send-Report -Subject "[📡 RECOVERED] $($alert.subject)" -Body $alert.body | Out-Null
                }
                Remove-Item $ALERT_CACHE_FILE -Force
                Write-Host "   All cached alerts delivered and cleared."
            }
        } catch {
            Write-Host "⚠️ Error processing cached alerts: $($_.Exception.Message)"
        }
    }

    # Send the current report
    Send-Report -Subject $subject -Body $htmlBody | Out-Null
}

Write-Host ""
Write-Host "══════════════════════════════════════════════"
Write-Host "  Health check complete at $timestamp"
Write-Host "  Overall: $overallSeverity"
Write-Host "══════════════════════════════════════════════"
