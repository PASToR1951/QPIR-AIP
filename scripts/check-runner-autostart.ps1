<#
.SYNOPSIS
    Checks, starts, and restarts the QPIR-AIP GitHub Actions runner.
.DESCRIPTION
    Use this on the Windows server when GitHub Actions is stuck in Queued.
    It resolves the runner folder, reports the official runner service or
    scheduled-task fallback, starts/restarts the runner when requested, and
    shows recent runner diagnostics.
.EXAMPLE
    .\scripts\check-runner-autostart.ps1
.EXAMPLE
    .\scripts\check-runner-autostart.ps1 -Start
.EXAMPLE
    .\scripts\check-runner-autostart.ps1 -Restart
#>

param(
    [string]$RunnerDir = "C:\Users\Administrator\Desktop\SYSTEMS\actions-runner",
    [string]$TaskName = "QPIR-AIP Actions Runner Autostart",
    [switch]$Start,
    [switch]$Restart
)

$ErrorActionPreference = "Continue"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
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
    $candidates = @()

    if ($RequestedRunnerDir) {
        $candidates += $RequestedRunnerDir
        $candidates += (Join-Path $RequestedRunnerDir "actions-runner")
        $candidates += (Join-Path $RequestedRunnerDir "runner")
        $candidates += (Join-Path $RequestedRunnerDir "github-runner")
    }

    $candidates += (Join-Path $projectDir "actions-runner")
    $candidates += (Join-Path $projectDir "autostart")
    $candidates += (Join-Path $systemsDir "actions-runner")
    $candidates += (Join-Path $systemsDir "autostart")
    $candidates = $candidates | Where-Object { $_ } | Select-Object -Unique

    foreach ($candidate in $candidates) {
        if (Test-RunnerRoot -Path $candidate) {
            return [pscustomobject]@{
                Path = $candidate
                Checked = $candidates
            }
        }
    }

    $searchRoots = @($RequestedRunnerDir, $projectDir, $systemsDir) |
        Where-Object { $_ -and (Test-Path $_) } |
        Select-Object -Unique

    foreach ($searchRoot in $searchRoots) {
        $nestedRunCmd = Get-ChildItem -Path $searchRoot -Filter "run.cmd" -File -Recurse -ErrorAction SilentlyContinue |
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

function Get-RunnerServices {
    param([string]$Path)

    $services = @(Get-CimInstance Win32_Service -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like "actions.runner.*" })

    if ($Path) {
        $runnerPath = $Path.TrimEnd([char[]]"\/")
        $matchingServices = @($services | Where-Object {
            $_.PathName -and $_.PathName.IndexOf($runnerPath, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
        })

        if ($matchingServices.Count -gt 0) {
            return $matchingServices
        }
    }

    return $services
}

function Get-RunnerProcesses {
    param([string]$Path)

    $runnerProcessNames = @("Runner.Listener.exe", "Runner.Worker.exe", "RunnerService.exe")
    $processes = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object { $runnerProcessNames -contains $_.Name })

    if ($Path) {
        $runnerPath = $Path.TrimEnd([char[]]"\/")
        $matchingProcesses = @($processes | Where-Object {
            ($_.ExecutablePath -and $_.ExecutablePath.IndexOf($runnerPath, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) -or
            ($_.CommandLine -and $_.CommandLine.IndexOf($runnerPath, [System.StringComparison]::OrdinalIgnoreCase) -ge 0)
        })

        if ($matchingProcesses.Count -gt 0) {
            return $matchingProcesses
        }
    }

    return $processes
}

function Format-TaskResult {
    param($Code)

    switch ($Code) {
        0 { return "0 (success)" }
        267009 { return "267009 (currently running)" }
        267011 { return "267011 (has not run yet)" }
        default { return "$Code" }
    }
}

function Start-OrRestartService {
    param(
        [Parameter(Mandatory=$true)]$Service,
        [switch]$Restart
    )

    try {
        if ($Service.StartMode -eq "Disabled") {
            Set-Service -Name $Service.Name -StartupType Automatic -ErrorAction Stop
        }

        if ($Restart) {
            Write-Host ("Restarting service: {0}" -f $Service.Name)
            Restart-Service -Name $Service.Name -Force -ErrorAction Stop
        } else {
            Write-Host ("Starting service: {0}" -f $Service.Name)
            Start-Service -Name $Service.Name -ErrorAction Stop
        }

        Write-Host ("[OK] Service is active: {0}" -f $Service.Name) -ForegroundColor Green
    } catch {
        Write-Host ("[ERROR] Could not start service {0}: {1}" -f $Service.Name, $_.Exception.Message) -ForegroundColor Red
    }
}

function Stop-RunnerService {
    param([Parameter(Mandatory=$true)]$Service)

    try {
        if ($Service.State -eq "Running") {
            Write-Host ("Stopping service: {0}" -f $Service.Name)
            Stop-Service -Name $Service.Name -Force -ErrorAction Stop
        }
    } catch {
        Write-Host ("[WARN] Could not stop service {0}: {1}" -f $Service.Name, $_.Exception.Message) -ForegroundColor Yellow
    }
}

function Start-OrRestartTask {
    param(
        [Parameter(Mandatory=$true)]$Task,
        [string]$TaskName,
        [switch]$Restart
    )

    try {
        Enable-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue | Out-Null

        if ($Restart -and $Task.State -eq "Running") {
            Write-Host "Stopping scheduled task..."
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }

        Write-Host "Starting scheduled task..."
        Start-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        Write-Host ("[OK] Scheduled task started: {0}" -f $TaskName) -ForegroundColor Green
    } catch {
        Write-Host ("[ERROR] Could not start scheduled task {0}: {1}" -f $TaskName, $_.Exception.Message) -ForegroundColor Red
    }
}

function Stop-RunnerTask {
    param([string]$TaskName)

    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($task -and $task.State -eq "Running") {
            Write-Host "Stopping scheduled task..."
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        }
    } catch {
        Write-Host ("[WARN] Could not stop scheduled task {0}: {1}" -f $TaskName, $_.Exception.Message) -ForegroundColor Yellow
    }
}

function Disable-RunnerTask {
    param([string]$TaskName)

    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($task) {
            Disable-ScheduledTask -TaskName $TaskName -ErrorAction Stop | Out-Null
            Write-Host ("[OK] Disabled scheduled task fallback: {0}" -f $TaskName) -ForegroundColor Green
        }
    } catch {
        Write-Host ("[WARN] Could not disable scheduled task {0}: {1}" -f $TaskName, $_.Exception.Message) -ForegroundColor Yellow
    }
}

function Stop-RunnerProcesses {
    param([string]$Path)

    $processes = @(Get-RunnerProcesses -Path $Path)
    foreach ($process in $processes) {
        try {
            Write-Host ("Stopping leftover runner process: {0} ({1})" -f $process.Name, $process.ProcessId)
            Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
        } catch {
            Write-Host ("[WARN] Could not stop process {0}: {1}" -f $process.ProcessId, $_.Exception.Message) -ForegroundColor Yellow
        }
    }
}

function Test-GitHubNetwork {
    if (-not (Get-Command Test-NetConnection -ErrorAction SilentlyContinue)) {
        Write-Host "[SKIP] Test-NetConnection is not available on this host." -ForegroundColor Yellow
        return
    }

    foreach ($hostName in @("github.com", "api.github.com")) {
        $connected = Test-NetConnection -ComputerName $hostName -Port 443 -InformationLevel Quiet
        if ($connected) {
            Write-Host ("[OK] HTTPS reachable: {0}:443" -f $hostName) -ForegroundColor Green
        } else {
            Write-Host ("[ERROR] HTTPS not reachable: {0}:443" -f $hostName) -ForegroundColor Red
        }
    }
}

$isAdmin = Test-IsAdmin
if (($Start -or $Restart) -and -not $isAdmin) {
    Write-Host "[ERROR] Start/Restart needs an elevated PowerShell window (Run as Administrator)." -ForegroundColor Red
    exit 1
}

Write-Step "Runner folder"
$resolvedRunner = Resolve-RunnerRoot -RequestedRunnerDir $RunnerDir
if ($resolvedRunner.Path) {
    $RunnerDir = $resolvedRunner.Path
    Write-Host "RunnerDir:       $RunnerDir"
    Write-Host "run.cmd:         $(Test-Path (Join-Path $RunnerDir 'run.cmd'))"
    Write-Host "svc.cmd:         $(Test-Path (Join-Path $RunnerDir 'svc.cmd'))"
    Write-Host ".runner:         $(Test-Path (Join-Path $RunnerDir '.runner'))"
    Write-Host ".credentials:    $(Test-Path (Join-Path $RunnerDir '.credentials'))"
} else {
    Write-Host "[ERROR] Could not find a GitHub Actions runner folder." -ForegroundColor Red
    Write-Host "Checked these paths:"
    foreach ($candidate in $resolvedRunner.Checked) {
        Write-Host "  - $candidate"
    }
    Write-Host ""
    Write-Host "Install or point to the runner folder, then rerun this script:"
    Write-Host '  powershell.exe -ExecutionPolicy Bypass -File .\scripts\check-runner-autostart.ps1 -RunnerDir "C:\path\to\runner" -Start'

    if ($Start -or $Restart) {
        exit 1
    }
}

Write-Step "Runner service"
$services = @(Get-RunnerServices -Path $RunnerDir)
if ($services.Count -gt 0) {
    $services |
        Select-Object Name, State, StartMode, StartName, PathName |
        Format-Table -AutoSize

    if ($Restart) {
        foreach ($service in $services) {
            Stop-RunnerService -Service $service
        }
    }

    foreach ($service in $services) {
        if ($Restart) {
            continue
        } elseif ($Start -or $service.State -ne "Running") {
            Start-OrRestartService -Service $service
        }
    }
} else {
    Write-Host "[WARN] No official GitHub Actions runner service found." -ForegroundColor Yellow
}

Write-Step "Scheduled task fallback"
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
    Write-Host "[MISSING] $TaskName" -ForegroundColor Yellow
    Write-Host "Install it with:"
    Write-Host "  powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-runner-autostart.ps1"
} else {
    $info = Get-ScheduledTaskInfo -TaskName $TaskName
    Write-Host "Task State:      $($task.State)"
    Write-Host "Last Run:        $($info.LastRunTime)"
    Write-Host "Last Result:     $(Format-TaskResult $info.LastTaskResult)"
    Write-Host "Next Run:        $($info.NextRunTime)"

    if ($services.Count -gt 0) {
        Write-Host "[WARN] Service and scheduled task both exist. Prefer the service to avoid duplicate runner sessions." -ForegroundColor Yellow
        if ($Start -or $Restart) {
            Stop-RunnerTask -TaskName $TaskName
            Disable-RunnerTask -TaskName $TaskName
        }
    } elseif ($Restart) {
        Stop-RunnerTask -TaskName $TaskName
    } elseif ($Start -or $task.State -ne "Running") {
        Start-OrRestartTask -Task $task -TaskName $TaskName
    }
}

if ($Restart) {
    Write-Step "Clearing duplicate runner sessions"
    Stop-RunnerProcesses -Path $RunnerDir
    Start-Sleep -Seconds 5

    if ($services.Count -gt 0) {
        Write-Step "Starting runner service"
        foreach ($service in $services) {
            Start-OrRestartService -Service $service
        }
    } elseif ($task) {
        Write-Step "Starting scheduled task fallback"
        Start-OrRestartTask -Task $task -TaskName $TaskName
    }
}

if ($Start -or $Restart) {
    Start-Sleep -Seconds 5
}

Write-Step "Runner processes"
$processes = @(Get-RunnerProcesses -Path $RunnerDir)
if ($processes.Count -gt 0) {
    $processes |
        Select-Object ProcessId, Name, ParentProcessId, CreationDate, CommandLine |
        Format-List
} else {
    Write-Host "[WARN] No runner processes found." -ForegroundColor Yellow
    Write-Host "Try:"
    Write-Host "  powershell.exe -ExecutionPolicy Bypass -File .\scripts\check-runner-autostart.ps1 -Restart"
}

Write-Step "GitHub network"
Test-GitHubNetwork

Write-Step "Latest runner diagnostics"
$diagDir = Join-Path $RunnerDir "_diag"
if (Test-Path $diagDir) {
    $latestLogs = @(Get-ChildItem $diagDir -Include "Runner_*.log", "Worker_*.log" -File -Recurse -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 5)

    if ($latestLogs.Count -gt 0) {
        $latestLogs | Format-Table -AutoSize LastWriteTime, Name, Length

        $latest = $latestLogs | Select-Object -First 1
        Write-Host ""
        Write-Host "Last 30 lines from $($latest.Name):"
        Get-Content $latest.FullName -Tail 30
    } else {
        Write-Host "[WARN] No runner diagnostic logs found in: $diagDir" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] Diagnostics folder not found: $diagDir" -ForegroundColor Yellow
}

$activeListener = @($processes | Where-Object { $_.Name -eq "Runner.Listener.exe" })
if ($activeListener.Count -eq 0) {
    Write-Host ""
    Write-Host "[ERROR] Runner listener is not active. GitHub Actions jobs will remain queued." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Runner listener is active. Queued GitHub Actions jobs should be picked up shortly." -ForegroundColor Green
