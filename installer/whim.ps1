
param(
    [string]$DownloadUrl = "https://github.com/SaaranshDx/whim/releases/download/v0.0.0/whim.exe"
)

$ErrorActionPreference = "Stop"

$InstallDir = "C:\Whim"
$ExePath = Join-Path $InstallDir "whim.exe"
$AppKey = "HKCU:\Software\Classes\Applications\whim.exe"
$Extensions = @(
    # Video
    ".mp4", ".m4v", ".mkv", ".webm", ".mov",
    ".avi", ".wmv", ".flv", ".f4v", ".mpeg",
    ".mpg", ".m2v", ".m2ts", ".mts", ".ts",
    ".vob", ".ogv", ".3gp", ".3g2", ".asf",
    ".rm", ".rmvb", ".divx", ".y4m", ".mxf",
    ".ivf", ".bik", ".smk", ".amv", ".mjpeg",
    ".mjpg", ".wtv", ".dvr-ms",

    # Images
    ".jpg", ".jpeg", ".jpe", ".jfif", ".pjpeg",
    ".pjp", ".png", ".gif", ".webp", ".avif",
    ".bmp", ".dib", ".svg", ".svgz", ".ico", ".cur",

    # PDF
    ".pdf"
)

# Require elevation for installation into C:\Whim.
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdmin = $principal.IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    $args = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$PSCommandPath`"",
        "-DownloadUrl", "`"$DownloadUrl`""
    )

    Start-Process powershell.exe -Verb RunAs -ArgumentList $args
    exit
}

if (
    $DownloadUrl -eq "REPLACE_WITH_DIRECT_EXE_DOWNLOAD_URL" -or
    $DownloadUrl -notmatch '^https://'
) {
    throw "Set DownloadUrl to your direct HTTPS executable download URL."
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

$tempExe = Join-Path $env:TEMP "whim-download-$PID.exe"

try {
    Write-Host "Downloading Whim..." -ForegroundColor Cyan

    Invoke-WebRequest `
        -Uri $DownloadUrl `
        -OutFile $tempExe `
        -UseBasicParsing

    if (
        -not (Test-Path $tempExe) -or
        (Get-Item $tempExe).Length -lt 1MB
    ) {
        throw "Downloaded file is missing or unexpectedly small."
    }

    # Move the downloaded executable into its permanent location.
    Move-Item -Path $tempExe -Destination $ExePath -Force

    # Register Whim as an available application.
    New-Item -Path $AppKey -Force | Out-Null
    New-ItemProperty -Path $AppKey `
        -Name "FriendlyAppName" `
        -Value "Whim" -PropertyType String -Force | Out-Null

    $openKey = Join-Path $AppKey "shell\open"
    New-Item -Path $openKey -Force | Out-Null

    $commandKey = Join-Path $openKey "command"
    New-Item -Path $commandKey -Force | Out-Null

    # Quote both the executable path and the incoming file path.
    Set-Item -Path $commandKey `
        -Value "`"$ExePath`" `"%1`""

    # Tell Windows which file types Whim supports.
    $typesKey = Join-Path $AppKey "SupportedTypes"
    New-Item -Path $typesKey -Force | Out-Null

    foreach ($ext in $Extensions) {
        New-ItemProperty -Path $typesKey `
            -Name $ext `
            -Value "" `
            -PropertyType String `
            -Force | Out-Null
    }

    Write-Host ""
    Write-Host "Whim installed successfully!" -ForegroundColor Green
    Write-Host "Executable: $ExePath"
    Write-Host "Registered extensions: $($Extensions.Count)"
    Write-Host ""
    Write-Host "Right-click a supported file and select Open with > Whim."
}
finally {
    if (Test-Path $tempExe) {
        Remove-Item $tempExe -Force
    }
}
