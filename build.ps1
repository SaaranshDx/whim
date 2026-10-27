$ErrorActionPreference = "Stop"

$python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = "py"
}

& $python -m PyInstaller --noconfirm --clean (Join-Path $PSScriptRoot "whim.spec")
