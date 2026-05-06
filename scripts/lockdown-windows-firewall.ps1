<#
.SYNOPSIS
Locks down a Windows Server host so only intended public ports are allowed.

.DESCRIPTION
For end-to-end deployment, prefer the master wizard:
  scripts\deploy-windows-wizard.ps1
That wizard prompts for a management CIDR and calls this script with -Apply.
You can also run this script standalone (defaults to dry-run).

Dry-run by default. With -Apply, enables Windows Firewall, sets inbound traffic
to block by default, allows HTTP/HTTPS publicly, and optionally allows RDP/SSH
only from a management IP/CIDR.

This script does not delete existing rules created by Windows, Docker, or other
systems. It prints broad inbound allow rules so you can review anything that may
still expose ports. Use this together with Docker Compose bindings that publish
sensitive services only to 127.0.0.1.

.EXAMPLE
.\scripts\lockdown-windows-firewall.ps1

.EXAMPLE
.\scripts\lockdown-windows-firewall.ps1 -Apply -AllowRdp -ManagementCidr 203.0.113.10/32

.EXAMPLE
.\scripts\lockdown-windows-firewall.ps1 -Apply -NoAdminAccess
#>

[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$AllowRdp,
  [switch]$AllowSsh,
  [switch]$NoAdminAccess,
  [string]$ManagementCidr = "",
  [int]$RdpPort = 3389,
  [int]$SshPort = 22,
  [int[]]$PublicPorts = @(80, 443)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Plan {
  param(
    [string]$Description,
    [scriptblock]$Action
  )

  if ($Apply) {
    Write-Host $Description -ForegroundColor Green
    & $Action
  } else {
    Write-Host "[dry-run] $Description" -ForegroundColor Yellow
  }
}

function Upsert-AllowRule {
  param(
    [string]$Name,
    [int]$Port,
    [string]$RemoteAddress = "Any"
  )

  Invoke-Plan "Allow inbound TCP $Port ($Name) from $RemoteAddress" {
    $existing = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
    if ($existing) {
      Remove-NetFirewallRule -DisplayName $Name
    }

    New-NetFirewallRule `
      -DisplayName $Name `
      -Direction Inbound `
      -Action Allow `
      -Protocol TCP `
      -LocalPort $Port `
      -RemoteAddress $RemoteAddress `
      -Profile Any | Out-Null
  }
}

if (-not (Get-Command Get-NetFirewallRule -ErrorAction SilentlyContinue)) {
  throw "Windows Firewall PowerShell cmdlets are not available on this machine."
}

if ($Apply -and -not $NoAdminAccess -and -not $AllowRdp -and -not $AllowSsh) {
  throw "Refusing to apply without admin access. Add -AllowRdp or -AllowSsh with -ManagementCidr, or pass -NoAdminAccess if you have console access."
}

if (($AllowRdp -or $AllowSsh) -and [string]::IsNullOrWhiteSpace($ManagementCidr)) {
  throw "Set -ManagementCidr when allowing RDP or SSH, for example: -ManagementCidr 203.0.113.10/32"
}

Write-Step "Firewall default policy"
Invoke-Plan "Enable Windows Firewall and block inbound traffic by default" {
  Set-NetFirewallProfile -Profile Domain,Private,Public `
    -Enabled True `
    -DefaultInboundAction Block `
    -DefaultOutboundAction Allow
}

Write-Step "Public web ports"
foreach ($port in $PublicPorts) {
  Upsert-AllowRule -Name "AIP-PIR Public TCP $port" -Port $port
}

Write-Step "Management access"
if ($AllowRdp) {
  Upsert-AllowRule -Name "AIP-PIR Admin RDP TCP $RdpPort" -Port $RdpPort -RemoteAddress $ManagementCidr
}
if ($AllowSsh) {
  Upsert-AllowRule -Name "AIP-PIR Admin SSH TCP $SshPort" -Port $SshPort -RemoteAddress $ManagementCidr
}
if (-not $AllowRdp -and -not $AllowSsh) {
  Write-Host "No RDP/SSH rule requested."
}

Write-Step "Broad inbound allow rules to review"
$broadRules = Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow |
  Where-Object { $_.DisplayName -notlike "AIP-PIR *" } |
  Select-Object -First 80

if ($broadRules) {
  $broadRules | Format-Table -AutoSize DisplayName, Profile, Direction, Action
  Write-Warning "Review existing broad allow rules above. This script does not disable unrelated systems automatically."
} else {
  Write-Host "No non-AIP-PIR inbound allow rules found in the first scan."
}

Write-Step "Docker published ports audit"
if (Get-Command docker -ErrorAction SilentlyContinue) {
  try {
    docker ps --format "table {{.Names}}\t{{.Ports}}"
  } catch {
    Write-Warning "Docker is installed but did not respond."
  }
} else {
  Write-Host "Docker CLI not found."
}

if (-not $Apply) {
  Write-Host ""
  Write-Host "Dry-run only. Rerun with -Apply after checking management access."
}
