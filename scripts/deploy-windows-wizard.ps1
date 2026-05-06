<#
.SYNOPSIS
MASTER deploy script for AIP-PIR on Windows Server. Call only this one.

.DESCRIPTION
End-to-end orchestrator. You do not need to call deploy-windows.ps1 or
lockdown-windows-firewall.ps1 directly -- this wizard delegates to them.

Stages (each pauses for confirmation):
  1. Pre-flight (Docker, ports, disk, public IP detection)
  2. Plan & confirm
  3. Prepare .env + runtime folders
  4. HTTP smoke test (LAN access via static IP)
  5. Seed database (clusters/programs/schools + default admin)
  6. HTTPS via Caddy + Let's Encrypt           (optional)
  7a. Scheduled backups                         (optional)
  7b. Windows Firewall lockdown                 (optional, requires Admin)

State is checkpointed to .deploy-state.json. Re-run with -Resume after a
reboot or interruption to skip stages already completed.

.EXAMPLE
.\scripts\deploy-windows-wizard.ps1

.EXAMPLE
.\scripts\deploy-windows-wizard.ps1 -Domain aip-pir.depedguihulngan.ph -PublicIp 222.127.76.11

.EXAMPLE
.\scripts\deploy-windows-wizard.ps1 -Resume
#>

[CmdletBinding()]
param(
  [string]$Domain      = "aip-pir.depedguihulngan.ph",
  [string]$PublicIp    = "222.127.76.11",
  [string]$EnvFile     = ".env",
  [switch]$Resume,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --------------------------------------------------------------------------
# Layout
# --------------------------------------------------------------------------
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = (Resolve-Path (Join-Path $scriptDir "..")).Path
Set-Location $repoRoot

$deployScript = Join-Path $scriptDir "deploy-windows.ps1"
$lockdownScript = Join-Path $scriptDir "lockdown-windows-firewall.ps1"
$composeFile  = Join-Path $repoRoot "docker-compose.yml"
$caddyfile    = Join-Path $repoRoot "deploy\Caddyfile"
$stateFile    = Join-Path $repoRoot ".deploy-state.json"

# --------------------------------------------------------------------------
# UI helpers
# --------------------------------------------------------------------------
function Write-Banner {
  param([string]$Text)
  $bar = "=" * 72
  Write-Host ""
  Write-Host $bar -ForegroundColor DarkCyan
  Write-Host $Text -ForegroundColor Cyan
  Write-Host $bar -ForegroundColor DarkCyan
}

function Write-Step  { param([string]$m) Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Write-Ok    { param([string]$m) Write-Host "  [OK]   $m" -ForegroundColor Green }
function Write-Warn2 { param([string]$m) Write-Host "  [WARN] $m" -ForegroundColor Yellow }
function Write-Bad   { param([string]$m) Write-Host "  [FAIL] $m" -ForegroundColor Red }
function Write-Info  { param([string]$m) Write-Host "  [..]   $m" -ForegroundColor Gray }

function Confirm-Step {
  param(
    [string]$Question,
    [string]$Default = "Y"
  )
  $hint = if ($Default -eq "Y") { "[Y/n]" } else { "[y/N]" }
  while ($true) {
    $reply = Read-Host "$Question $hint"
    if ([string]::IsNullOrWhiteSpace($reply)) { $reply = $Default }
    switch ($reply.Trim().ToUpperInvariant()) {
      "Y"   { return $true }
      "YES" { return $true }
      "N"   { return $false }
      "NO"  { return $false }
      default { Write-Host "Please answer y or n." -ForegroundColor Yellow }
    }
  }
}

function Require-TypedYes {
  param([string]$Phrase = "yes")
  $reply = Read-Host "Type '$Phrase' to confirm"
  if ($reply -ne $Phrase) {
    throw "Confirmation phrase did not match. Aborting."
  }
}

function Stop-Wizard {
  param([string]$Reason)
  Write-Host ""
  Write-Bad $Reason
  Write-Host "Aborting. No further changes will be made." -ForegroundColor Red
  exit 1
}

# --------------------------------------------------------------------------
# Checkpoint state (so -Resume can skip done stages)
# --------------------------------------------------------------------------
function New-DefaultState {
  return [pscustomobject]@{
    preflight = $false
    prepared  = $false
    httpUp    = $false
    seeded    = $false
    sslUp     = $false
    backupUp  = $false
    firewall  = $false
  }
}

function Load-State {
  $defaults = New-DefaultState
  if (-not (Test-Path $stateFile)) { return $defaults }
  try {
    $loaded = Get-Content -Raw $stateFile | ConvertFrom-Json
  } catch { return $defaults }

  # Merge: any missing property falls back to default (StrictMode-safe).
  foreach ($prop in $defaults.PSObject.Properties.Name) {
    if (-not ($loaded.PSObject.Properties.Name -contains $prop)) {
      $loaded | Add-Member -NotePropertyName $prop -NotePropertyValue $defaults.$prop -Force
    }
  }
  return $loaded
}

function Save-State {
  param($State)
  if ($DryRun) { return }
  $State | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
}

$state = Load-State
if (-not $Resume) { $state = New-DefaultState }

# --------------------------------------------------------------------------
# Pre-flight checks
# --------------------------------------------------------------------------
function Test-Admin {
  $id = [System.Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object System.Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-PortFree {
  param([int]$Port)
  try {
    $hits = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    return ($hits.Count -eq 0)
  } catch {
    return $true  # nothing listening
  }
}

function Test-DiskSpace {
  param([int]$MinGB = 10)
  $drive = (Get-Item $repoRoot).PSDrive
  $freeGB = [Math]::Round($drive.Free / 1GB, 1)
  return @{ FreeGB = $freeGB; Ok = ($freeGB -ge $MinGB) }
}

function Get-DetectedPublicIp {
  # Best-effort: ask a public service what our outbound IP looks like.
  # If the server is behind a NAT, this returns the NAT's WAN IP -- which is
  # what DNS should point at, and what Let's Encrypt will hit.
  $endpoints = @(
    "https://api.ipify.org",
    "https://ifconfig.me/ip",
    "https://checkip.amazonaws.com"
  )
  foreach ($url in $endpoints) {
    try {
      $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
      $ip = $resp.Content.Trim()
      if ($ip -match '^\d{1,3}(\.\d{1,3}){3}$') { return $ip }
    } catch { continue }
  }
  return $null
}

function Get-CurrentRdpClient {
  # Returns the IP of any active RDP (3389) inbound session, if available.
  # Useful for warning the operator if they're about to firewall it off.
  try {
    $conn = Get-NetTCPConnection -LocalPort 3389 -State Established -ErrorAction Stop |
            Select-Object -First 1
    if ($conn) { return $conn.RemoteAddress }
  } catch { }
  return $null
}

function Open-FirewallPorts {
  # Idempotently opens inbound TCP ports on Windows Firewall. Requires Admin.
  # If not elevated, prints the manual command and returns false.
  param(
    [int[]]$Ports,
    [string]$Tag = "AIP-PIR"
  )

  if (-not (Test-Admin)) {
    Write-Warn2 "Not elevated -- cannot open firewall ports automatically."
    Write-Info  "Run these as Administrator before continuing:"
    foreach ($p in $Ports) {
      Write-Host  "    New-NetFirewallRule -DisplayName '$Tag TCP $p' -Direction Inbound -Protocol TCP -LocalPort $p -Action Allow -Profile Any"
    }
    return $false
  }

  if (-not (Get-Command New-NetFirewallRule -ErrorAction SilentlyContinue)) {
    Write-Warn2 "Windows Firewall cmdlets not available. Open ports manually: $($Ports -join ', ')"
    return $false
  }

  foreach ($p in $Ports) {
    $name = "$Tag TCP $p"
    $existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
    if ($existing) {
      Write-Info "Firewall rule already exists: $name"
    } else {
      try {
        New-NetFirewallRule -DisplayName $name -Direction Inbound `
          -Protocol TCP -LocalPort $p -Action Allow -Profile Any | Out-Null
        Write-Ok "Opened inbound TCP $p ($name)"
      } catch {
        Write-Warn2 "Failed to open port $p`: $($_.Exception.Message)"
      }
    }
  }
  return $true
}

function Wait-ForCaddyAcme {
  # Polls 'docker compose logs caddy' for the ACME success signal.
  # Returns @{ Success = $bool; Detail = $string }.
  param(
    [string]$EnvFilePath,
    [int]$TimeoutSec = 120
  )

  $needles = @(
    'certificate obtained successfully',
    'obtained certificate',
    'ready to serve'
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSec)

  while ((Get-Date) -lt $deadline) {
    try {
      $logs = & docker compose --env-file $EnvFilePath --profile ssl logs caddy --tail=400 2>&1 |
              Out-String
    } catch { $logs = "" }

    foreach ($n in $needles) {
      if ($logs -match [Regex]::Escape($n)) {
        return @{ Success = $true; Detail = $n }
      }
    }
    if ($logs -match 'no such (host|domain)|connection refused|unable to authorize|ACME error') {
      return @{ Success = $false; Detail = "Caddy reported an ACME error -- check the log." }
    }
    Start-Sleep -Seconds 4
  }
  return @{ Success = $false; Detail = "Timed out after $TimeoutSec sec without seeing ACME success." }
}

function Invoke-Preflight {
  Write-Banner "STAGE 1 of 7 -- Pre-flight checks"
  $fatal = $false

  Write-Step "Repository layout"
  foreach ($p in @($composeFile, $deployScript, $caddyfile)) {
    if (Test-Path $p) { Write-Ok "Found: $p" }
    else { Write-Bad "Missing: $p"; $fatal = $true }
  }

  Write-Step "PowerShell"
  Write-Ok "Version: $($PSVersionTable.PSVersion)"
  if (-not (Test-Admin)) {
    Write-Warn2 "This session is NOT elevated. Firewall changes will fail."
    Write-Info  "Re-launch PowerShell as Administrator if you want -ConfigureFirewall."
  } else {
    Write-Ok "Running as Administrator"
  }

  Write-Step "Disk space"
  $disk = Test-DiskSpace -MinGB 10
  if ($disk.Ok) { Write-Ok "Free space on $repoRoot drive: $($disk.FreeGB) GB" }
  else { Write-Bad "Only $($disk.FreeGB) GB free. Need at least 10 GB."; $fatal = $true }

  Write-Step "Docker"
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Bad "docker not found in PATH. Install Docker Desktop for Windows (Linux containers mode)."
    $fatal = $true
  } else {
    try {
      $null = & docker version --format '{{.Server.Version}}' 2>$null
      if ($LASTEXITCODE -ne 0) { throw "daemon not responding" }
      Write-Ok "Docker daemon is running"
    } catch {
      Write-Bad "Docker is installed but the daemon is not responding. Start Docker Desktop."
      $fatal = $true
    }
    try {
      $null = & docker compose version 2>$null
      if ($LASTEXITCODE -ne 0) { throw "compose v2 missing" }
      Write-Ok "docker compose v2 available"
    } catch {
      Write-Bad "'docker compose' (v2) not found. Update Docker Desktop."
      $fatal = $true
    }
  }

  Write-Step "Ports"
  foreach ($p in 80, 443, 3001) {
    if (Test-PortFree -Port $p) { Write-Ok "Port $p is free" }
    else { Write-Warn2 "Port $p is in use. Stop the conflicting service before deploy." }
  }

  Write-Step "Public IP detection"
  $detected = Get-DetectedPublicIp
  if (-not $detected) {
    Write-Warn2 "Could not detect public IP (no internet, or all probes failed)."
    Write-Info  "If you plan to enable HTTPS, verify manually that DNS for $Domain points to a reachable public IP."
  } elseif ($detected -eq $PublicIp) {
    Write-Ok "Server outbound IP is $detected (matches -PublicIp)."
  } else {
    Write-Warn2 "Server outbound IP is $detected, but -PublicIp is $PublicIp."
    Write-Info  "If your server is behind a router/NAT, the DNS A record for $Domain must point to the"
    Write-Info  "router's WAN IP, and the router must port-forward 80/443 to this server's LAN IP."
    Write-Info  "Without that, Let's Encrypt cannot reach the server during the SSL stage."
  }

  Write-Step "Existing deployment artifacts"
  $envExists = Test-Path (Join-Path $repoRoot $EnvFile)
  if ($envExists) {
    Write-Warn2 "$EnvFile already exists. Existing secrets will be PRESERVED (not regenerated)."
  } else {
    Write-Info "$EnvFile not found yet -- will be created in the prepare stage."
  }

  try {
    $vols = & docker volume ls --format '{{.Name}}' 2>$null
    if ($vols -match 'qpir-aip[_-]db_data|.*db_data') {
      Write-Warn2 "A 'db_data' Docker volume already exists. Existing database will be REUSED."
      Write-Info  "If POSTGRES_PASSWORD in .env does not match the one used to create the volume,"
      Write-Info  "the backend will fail to connect. Either keep the old password or recreate the volume."
    }
  } catch { }

  if ($fatal) {
    Stop-Wizard "One or more pre-flight checks failed. Fix the items above and re-run."
  }

  Write-Host ""
  if (-not (Confirm-Step "Pre-flight passed. Continue to planning?")) {
    Stop-Wizard "User aborted at pre-flight."
  }
  $state.preflight = $true
  Save-State $state
}

# --------------------------------------------------------------------------
# Plan
# --------------------------------------------------------------------------
function Show-Plan {
  Write-Banner "STAGE 2 of 7 -- Plan & confirm"
  Write-Host "Repo root      : $repoRoot"
  Write-Host "Env file       : $EnvFile"
  Write-Host "Public IP      : $PublicIp  (from -PublicIp)"
  Write-Host "Domain (SSL)   : $Domain    (from -Domain)"
  Write-Host ""
  Write-Host "Plan:"
  Write-Host "  1. Pre-flight                              [done]"
  Write-Host "  2. Plan & confirm                          [you are here]"
  Write-Host "  3. Prepare .env + runtime folders"
  Write-Host "  4. HTTP smoke test on http://$PublicIp     (db + backend + frontend)"
  Write-Host "  5. Seed database + default admin user"
  Write-Host "  6. (Optional) Enable HTTPS via Caddy on https://$Domain"
  Write-Host "  7a.(Optional) Enable scheduled backups"
  Write-Host "  7b.(Optional) Apply Windows Firewall lockdown"
  Write-Host ""
  Write-Warn2 "Each stage pauses for confirmation. Stages 4 onwards make real changes."

  if (-not (Confirm-Step "Proceed with this plan?")) {
    Stop-Wizard "User aborted at plan review."
  }
}

# --------------------------------------------------------------------------
# Stage 3: prepare
# --------------------------------------------------------------------------
function Invoke-Prepare {
  Write-Banner "STAGE 3 of 7 -- Prepare environment"
  $frontendUrl = "http://$PublicIp"
  $apiUrl      = "http://${PublicIp}:3001"

  Write-Info "Will call: deploy-windows.ps1 -PrepareOnly -FrontendUrl $frontendUrl -ApiUrl $apiUrl"
  if (-not (Confirm-Step "Generate .env and runtime folders now?")) {
    Stop-Wizard "User aborted at prepare."
  }

  if ($DryRun) { Write-Warn2 "[DryRun] skipping actual prepare."; $state.prepared = $true; Save-State $state; return }

  & $deployScript -PrepareOnly -FrontendUrl $frontendUrl -ApiUrl $apiUrl -Domain $Domain -EnvFile $EnvFile
  if ($LASTEXITCODE -ne 0) { Stop-Wizard "Prepare stage failed." }

  Write-Host ""
  Write-Warn2 "Open $EnvFile and review:"
  Write-Host  "  - VITE_API_URL and ALLOWED_ORIGIN match the URL users will type."
  Write-Host  "  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (if Google login is needed)."
  Write-Host  "  - RECAPTCHA_SECRET_KEY / VITE_RECAPTCHA_SITE_KEY (if reCAPTCHA is on)."
  Write-Host  "  - All POSTGRES_*, JWT_SECRET, EMAIL_CONFIG_SECRET have non-empty values."
  Write-Host ""
  if (-not (Confirm-Step "Have you reviewed and saved $EnvFile?" -Default "N")) {
    Stop-Wizard "Review .env, then re-run with -Resume."
  }
  $state.prepared = $true
  Save-State $state
}

# --------------------------------------------------------------------------
# Stage 4: HTTP smoke
# --------------------------------------------------------------------------
function Invoke-HttpSmoke {
  Write-Banner "STAGE 4 of 7 -- HTTP smoke test"
  Write-Warn2 "This will BUILD images and START containers. First build can take 5-15 min."
  if (-not (Confirm-Step "Proceed with docker compose up (HTTP only)?" -Default "N")) {
    Stop-Wizard "User aborted before docker compose up."
  }

  if ($DryRun) { Write-Warn2 "[DryRun] skipping actual stack start."; $state.httpUp = $true; Save-State $state; return }

  Write-Step "Opening firewall for LAN smoke test (ports 80, 3001)"
  $null = Open-FirewallPorts -Ports @(80, 3001) -Tag "AIP-PIR Smoke"

  $frontendUrl = "http://$PublicIp"
  $apiUrl      = "http://${PublicIp}:3001"
  & $deployScript -FrontendUrl $frontendUrl -ApiUrl $apiUrl -Domain $Domain -EnvFile $EnvFile -ExposeBackendPort
  if ($LASTEXITCODE -ne 0) {
    Write-Bad "deploy-windows.ps1 returned non-zero. Check 'docker compose logs'."
    Stop-Wizard "HTTP smoke failed."
  }

  Write-Host ""
  Write-Ok "Stack is up. Test these from another machine on the LAN:"
  Write-Host "    Frontend : http://$PublicIp"
  Write-Host "    Backend  : http://${PublicIp}:3001/api/health"
  Write-Host ""
  if (-not (Confirm-Step "Did the frontend load and the health endpoint return 200?" -Default "N")) {
    Write-Warn2 "Inspect logs:"
    Write-Host  "    docker compose --env-file $EnvFile logs backend  --tail=200"
    Write-Host  "    docker compose --env-file $EnvFile logs frontend --tail=200"
    Stop-Wizard "Smoke test not confirmed."
  }
  $state.httpUp = $true
  Save-State $state
}

# --------------------------------------------------------------------------
# Stage 5: seed database
# --------------------------------------------------------------------------
function Invoke-Seed {
  Write-Banner "STAGE 5 of 7 -- Seed database"
  Write-Info "Seeds clusters, programs, schools (from data/*.csv) and creates the default admin."
  Write-Info "Idempotent: safe to skip or re-run."
  if (-not (Confirm-Step "Run the seed now?" -Default "Y")) {
    Write-Warn2 "Skipping seed. The system will have no users -- you must seed before login works."
    return
  }
  if ($DryRun) { Write-Warn2 "[DryRun] skipping actual seed."; $state.seeded = $true; Save-State $state; return }

  & docker compose --env-file $EnvFile exec -T backend deno run -A scripts/seed.ts
  if ($LASTEXITCODE -ne 0) {
    Write-Bad "Seed command failed. Check that the backend container is running:"
    Write-Host "    docker compose --env-file $EnvFile ps"
    Write-Host "    docker compose --env-file $EnvFile logs backend --tail=200"
    Stop-Wizard "Seed failed."
  }

  Write-Host ""
  Write-Ok "Seed complete. Default admin credentials:"
  Write-Host "    email    : admin@qpir.local"
  Write-Host "    password : admin123"
  Write-Host ""
  Write-Warn2 "CHANGE THE ADMIN PASSWORD BEFORE EXPOSING THE SYSTEM."
  Write-Info  "Per project rule: Admin cannot approve/return PIRs -- also create a CES or"
  Write-Info  "Cluster Head account before user testing."
  Write-Host ""
  if (-not (Confirm-Step "Acknowledged. Continue?" -Default "Y")) {
    Stop-Wizard "User paused after seed. Re-run with -Resume when ready."
  }
  $state.seeded = $true
  Save-State $state
}

# --------------------------------------------------------------------------
# Stage 6: SSL
# --------------------------------------------------------------------------
function Test-DnsForSsl {
  param([string]$Hostname, [string]$ExpectedIp)
  try {
    $records = Resolve-DnsName -Type A -Name $Hostname -ErrorAction Stop
    $ips = ($records | Where-Object { $_.IPAddress } | Select-Object -ExpandProperty IPAddress) -join ", "
    if (-not $ips) { return @{ Ok = $false; Msg = "No A record found for $Hostname" } }
    if ($ips -split ", " -contains $ExpectedIp) {
      return @{ Ok = $true; Msg = "$Hostname -> $ips (matches $ExpectedIp)" }
    }
    return @{ Ok = $false; Msg = "$Hostname -> $ips (expected $ExpectedIp)" }
  } catch {
    return @{ Ok = $false; Msg = "DNS lookup failed: $_" }
  }
}

function Invoke-SslUpgrade {
  Write-Banner "STAGE 6 of 7 -- HTTPS via Caddy (optional)"
  if (-not (Confirm-Step "Enable HTTPS now?" -Default "N")) {
    Write-Info "Skipping SSL. You can re-run with -Resume later."
    return
  }

  Write-Step "DNS check"
  $dns = Test-DnsForSsl -Hostname $Domain -ExpectedIp $PublicIp
  if ($dns.Ok) { Write-Ok $dns.Msg }
  else {
    Write-Bad $dns.Msg
    Write-Warn2 "Caddy will fail to obtain a Let's Encrypt cert without correct DNS."
    Write-Warn2 "Fix the A record, wait for propagation, then re-run with -Resume."
    if (-not (Confirm-Step "Continue anyway? (NOT RECOMMENDED)" -Default "N")) {
      return
    }
    Require-TypedYes -Phrase "ssl-anyway"
  }

  if ($DryRun) { Write-Warn2 "[DryRun] skipping actual SSL up."; $state.sslUp = $true; Save-State $state; return }

  Write-Step "Opening firewall for HTTPS (ports 80, 443)"
  $null = Open-FirewallPorts -Ports @(80, 443) -Tag "AIP-PIR Web"

  $frontendUrl = "https://$Domain"
  $apiUrl      = "https://$Domain"
  & $deployScript -EnableSsl -Domain $Domain -FrontendUrl $frontendUrl -ApiUrl $apiUrl -EnvFile $EnvFile -SkipBuild
  if ($LASTEXITCODE -ne 0) { Stop-Wizard "SSL upgrade failed." }

  Write-Host ""
  Write-Step "Waiting for Caddy to obtain Let's Encrypt cert (up to 120s)"
  $acme = Wait-ForCaddyAcme -EnvFilePath $EnvFile -TimeoutSec 120
  if ($acme.Success) {
    Write-Ok "Caddy issued cert. Match: '$($acme.Detail)'."
  } else {
    Write-Warn2 "Could not auto-confirm cert issuance: $($acme.Detail)"
    Write-Info  "Inspect manually:"
    Write-Host  "    docker compose --env-file $EnvFile --profile ssl logs caddy --tail=200"
  }

  if (-not (Confirm-Step "Did https://$Domain load with a valid cert?" -Default $(if ($acme.Success) { "Y" } else { "N" }))) {
    Stop-Wizard "SSL not confirmed."
  }
  $state.sslUp = $true
  Save-State $state
}

# --------------------------------------------------------------------------
# Stage 6a: backups
# --------------------------------------------------------------------------
function Invoke-BackupEnable {
  Write-Banner "STAGE 7a of 7 -- Scheduled backups (optional)"
  if (-not (Confirm-Step "Enable the backup container now?" -Default "Y")) {
    Write-Info "Skipping backups. You can enable later with: deploy-windows.ps1 -EnableBackup"
    return
  }
  if ($DryRun) { Write-Warn2 "[DryRun] skipping actual backup up."; $state.backupUp = $true; Save-State $state; return }

  $argList = @("-EnableBackup", "-EnvFile", $EnvFile, "-SkipBuild")
  if ($state.sslUp) { $argList += @("-EnableSsl", "-Domain", $Domain) }
  & $deployScript @argList
  if ($LASTEXITCODE -ne 0) { Stop-Wizard "Backup enable failed." }

  Write-Ok "Backup container is up."
  Write-Info "Trigger a manual backup to verify:"
  Write-Host  '    New-Item -ItemType File backups\triggers\manual-$(Get-Date -Format yyyyMMdd-HHmmss).trigger'
  Write-Host  "    docker compose --env-file $EnvFile --profile backup logs backup --tail=100"
  $state.backupUp = $true
  Save-State $state
}

# --------------------------------------------------------------------------
# Stage 6b: firewall
# --------------------------------------------------------------------------
function Invoke-FirewallLockdown {
  Write-Banner "STAGE 7b of 7 -- Windows Firewall lockdown (optional)"
  if (-not (Test-Admin)) {
    Write-Warn2 "Not elevated. Skipping firewall stage. Re-run as Administrator to apply."
    return
  }
  if (-not (Test-Path $lockdownScript)) {
    Write-Warn2 "$lockdownScript not found. Skipping."
    return
  }

  Write-Warn2 "Lockdown will BLOCK all inbound traffic except 80/443 and (optionally) RDP from a CIDR you specify."
  Write-Warn2 "Get this wrong and you can lock yourself out of the server."
  if (-not (Confirm-Step "Run firewall lockdown now?" -Default "N")) {
    Write-Info "Skipped. You can run it manually later: scripts\lockdown-windows-firewall.ps1 -Apply"
    return
  }

  # Help the operator avoid locking out their own RDP session.
  $detectedRdp = Get-CurrentRdpClient
  if ($detectedRdp) {
    Write-Info "Detected active RDP session from: $detectedRdp"
    Write-Info "Suggested management CIDR: $detectedRdp/32"
  }

  $cidr = Read-Host "Enter management CIDR for RDP access (e.g. 1.2.3.4/32, or blank to BLOCK all RDP)"
  $cidr = $cidr.Trim()

  $lockArgs = @("-Apply")
  if ($cidr -ne "") {
    if ($cidr -notmatch '^\d{1,3}(\.\d{1,3}){3}/\d{1,2}$') {
      Stop-Wizard "Invalid CIDR format: '$cidr'. Expected like 1.2.3.4/32."
    }
    $lockArgs += @("-AllowRdp", "-ManagementCidr", $cidr)
    Write-Warn2 "RDP will be allowed only from $cidr. All other RDP traffic will be blocked."
  } else {
    $lockArgs += "-NoAdminAccess"
    Write-Warn2 "No CIDR provided. RDP will be BLOCKED from everywhere. Make sure you have console access."
  }

  Write-Host ""
  Write-Host "About to run: scripts\lockdown-windows-firewall.ps1 $($lockArgs -join ' ')"
  Require-TypedYes -Phrase "lockdown"

  if ($DryRun) { Write-Warn2 "[DryRun] skipping actual lockdown."; $state.firewall = $true; Save-State $state; return }

  & $lockdownScript @lockArgs
  if ($LASTEXITCODE -ne 0) { Write-Warn2 "Lockdown script returned non-zero. Inspect manually." }
  $state.firewall = $true
  Save-State $state
}

# --------------------------------------------------------------------------
# Final handover
# --------------------------------------------------------------------------
function Show-Handover {
  Write-Banner "DEPLOYMENT COMPLETE -- Handover"
  $envPath = Join-Path $repoRoot $EnvFile

  Write-Host "Endpoints:"
  if ($state.sslUp) {
    Write-Host "  Frontend : https://$Domain"
    Write-Host "  Backend  : https://$Domain/api/health"
  } else {
    Write-Host "  Frontend : http://$PublicIp"
    Write-Host "  Backend  : http://${PublicIp}:3001/api/health"
  }

  Write-Host ""
  Write-Host "Stack status:"
  & docker compose --env-file $EnvFile ps

  Write-Host ""
  Write-Warn2 "BEFORE LEAVING THE SERVER:"
  Write-Host  "  1. Copy $envPath to a password manager (it contains all secrets)."
  if ($state.seeded) {
    Write-Host  "  2. Log in as admin@qpir.local / admin123 and CHANGE the password immediately."
  } else {
    Write-Host  "  2. Run the seed when ready: docker compose --env-file $EnvFile exec backend deno run -A scripts/seed.ts"
  }
  Write-Host  "  3. Per project rule: also create a CES or Cluster Head -- Admins cannot"
  Write-Host  "     approve or return PIRs."
  Write-Host  "  4. Verify Division Logo displays (served from /Division_Logo.webp)."
  Write-Host  "  5. Reboot the server once and confirm services come back via 'restart: unless-stopped'."
  Write-Host ""
  Write-Host "Rollback:"
  Write-Host "  docker compose --env-file $EnvFile down            # stop containers"
  Write-Host "  docker compose --env-file $EnvFile down -v         # also wipe DB volume (DESTRUCTIVE)"
  Write-Host ""
  Write-Host "Logs:"
  Write-Host "  docker compose --env-file $EnvFile logs backend  --tail=200 -f"
  Write-Host "  docker compose --env-file $EnvFile logs frontend --tail=200 -f"
  if ($state.sslUp)    { Write-Host "  docker compose --env-file $EnvFile --profile ssl    logs caddy  --tail=200 -f" }
  if ($state.backupUp) { Write-Host "  docker compose --env-file $EnvFile --profile backup logs backup --tail=200 -f" }
}

# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------
Write-Banner "AIP-PIR Deployment Wizard (master script)"
if ($DryRun) { Write-Warn2 "DRY RUN: no real changes will be made." }
if ($Resume) { Write-Info  "Resuming from: $($state | ConvertTo-Json -Compress)" }

try {
  if (-not $state.preflight) { Invoke-Preflight }   else { Write-Info "Skip stage 1 (already done)." }
  Show-Plan
  if (-not $state.prepared)  { Invoke-Prepare }     else { Write-Info "Skip stage 3 (already done)." }
  if (-not $state.httpUp)    { Invoke-HttpSmoke }   else { Write-Info "Skip stage 4 (already done)." }
  if (-not $state.seeded)    { Invoke-Seed }        else { Write-Info "Skip stage 5 (already done)." }
  if (-not $state.sslUp)     { Invoke-SslUpgrade }
  if (-not $state.backupUp)  { Invoke-BackupEnable }
  if (-not $state.firewall)  { Invoke-FirewallLockdown }
  Show-Handover
} catch {
  Write-Host ""
  Write-Bad  "Wizard halted: $($_.Exception.Message)"
  Write-Info "State saved to $stateFile. Re-run with -Resume to continue."
  exit 1
}
