<#
.SYNOPSIS
    Checks and starts the QPIR-AIP GitHub Actions runner autostart task.
.DESCRIPTION
    Use this on the Windows server when GitHub Actions is stuck in Queued.
    It reports the scheduled task, runner processes, and latest runner logs.
.EXAMPLE
    .\scripts\check-runner-autostart.ps1
#>

param(
    [string]$RunnerDir = "C:\Users\Administrator\Desktop\SYSTEMS\actions-runner",
    [string]$TaskName = "QPIR-AIP Actions Runner Autostart",
    [switch]$Start
)

$ErrorActionPreference = "Continue"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

Write-Step "Scheduled task"
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
    Write-Host "[MISSING] $TaskName" -ForegroundColor Red
    Write-Host "Install it with:"
    Write-Host "  powershell.exe -ExecutionPolicy Bypass -File .\scripts\install-runner-autostart.ps1"
} else {
    $info = Get-ScheduledTaskInfo -TaskName $TaskName
    Write-Host "Task State:      $($task.State)"
    Write-Host "Last Run:        $($info.LastRunTime)"
    Write-Host "Last Result:     $($info.LastTaskResult)"
    Write-Host "Next Run:        $($info.NextRunTime)"

    if ($Start -or $task.State -ne "Running") {
        Write-Host "Starting scheduled task..."
        Start-ScheduledTask -TaskName $TaskName
        Start-Sleep -Seconds 3
        $task = Get-ScheduledTask -TaskName $TaskName
        Write-Host "Task State Now:  $($task.State)"
    }
}

Write-Step "Runner folder"
if (Test-Path $RunnerDir) {
    Write-Host "RunnerDir:       $RunnerDir"
    Write-Host "run.cmd:         $(Test-Path (Join-Path $RunnerDir 'run.cmd'))"
    Write-Host "svc.cmd:         $(Test-Path (Join-Path $RunnerDir 'svc.cmd'))"
    Write-Host ".runner:         $(Test-Path (Join-Path $RunnerDir '.runner'))"
    Write-Host ".credentials:    $(Test-Path (Join-Path $RunnerDir '.credentials'))"
} else {
    Write-Host "[MISSING] Runner folder not found: $RunnerDir" -ForegroundColor Red
}

Write-Step "Runner processes"
$processes = Get-Process -Name "Runner.Listener", "Runner.Worker", "RunnerService" -ErrorAction SilentlyContinue
if ($processes) {
    $processes | Format-Table -AutoSize Id, ProcessName, StartTime

    Write-Host ""
    Write-Host "Process ownership:"
    $processIds = $processes | ForEach-Object { $_.Id }
    Get-CimInstance Win32_Process |
        Where-Object { $processIds -contains $_.ProcessId } |
        Select-Object ProcessId, ParentProcessId, CommandLine |
        Format-List
} else {
    Write-Host "[WARN] No runner processes found." -ForegroundColor Yellow
    Write-Host "If the workflow is queued, start the task:"
    Write-Host "  powershell.exe -ExecutionPolicy Bypass -File .\scripts\check-runner-autostart.ps1 -Start"
}

Write-Step "Latest runner diagnostics"
$diagDir = Join-Path $RunnerDir "_diag"
if (Test-Path $diagDir) {
    Get-ChildItem $diagDir -Filter "Runner_*.log" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 3 |
        Format-Table -AutoSize LastWriteTime, Name, Length

    $latest = Get-ChildItem $diagDir -Filter "Runner_*.log" -File |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if ($latest) {
        Write-Host ""
        Write-Host "Last 20 lines from $($latest.Name):"
        Get-Content $latest.FullName -Tail 20
    }
} else {
    Write-Host "[WARN] Diagnostics folder not found: $diagDir" -ForegroundColor Yellow
}
