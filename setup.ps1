$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root
try {
    node scripts/setup.mjs @args
}
finally {
    Pop-Location
}

