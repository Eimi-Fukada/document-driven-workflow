$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root
try {
    node scripts/install/setup.mjs @args
}
finally {
    Pop-Location
}
