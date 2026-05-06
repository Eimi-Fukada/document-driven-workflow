param()

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$featuresRoot = Join-Path $root "docs\features"
$failFeature = Join-Path $featuresRoot "__tmp_gate_fail"
$passFeature = Join-Path $featuresRoot "__tmp_gate_pass"

function RemoveIfExists($path) {
    if (Test-Path $path) {
        Remove-Item -LiteralPath $path -Recurse -Force
    }
}

function WriteUtf8($path, $lines) {
    $lines | Set-Content -LiteralPath $path -Encoding utf8
}

function RunGate($featurePath) {
    $output = & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\gate-dev.ps1") -FeaturePath $featurePath 2>&1
    $code = $LASTEXITCODE
    $output | ForEach-Object { Write-Host $_ }
    return $code
}

RemoveIfExists $failFeature
RemoveIfExists $passFeature

try {
    New-Item -ItemType Directory -Force -Path $failFeature | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "docs\workflow\templates\prd.md") -Destination (Join-Path $failFeature "01-prd.md")

    $failCode = RunGate "docs/features/__tmp_gate_fail"
    if ($failCode -eq 0) {
        Write-Host "Gate regression failed: incomplete feature package passed." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path $passFeature | Out-Null
    WriteUtf8 (Join-Path $passFeature "01-prd.md") @("# PRD", "", "REQ-DEMO-001 Demo ready requirement")
    WriteUtf8 (Join-Path $passFeature "02-ui-spec.md") @("# UI Spec", "", "UI-DEMO-001 Demo UI")
    WriteUtf8 (Join-Path $passFeature "03-technical-contract.md") @("# Technical Contract", "", "API-DEMO-001 Demo API")
    WriteUtf8 (Join-Path $passFeature "04-acceptance-criteria.md") @("# Acceptance", "", "AC-DEMO-001 covers REQ-DEMO-001")
    WriteUtf8 (Join-Path $passFeature "05-readiness-review.md") @(
        "# Readiness Review",
        "",
        "- Readiness: Ready",
        "- Unresolved Questions: 0",
        "- Blocking Issues: 0",
        "- Assumptions Accepted: yes",
        "- User Approval: Approved",
        "- Implementation Plan Status: Approved"
    )
    WriteUtf8 (Join-Path $passFeature "06-implementation-plan.md") @("# Implementation Plan", "", "Approved demo plan")

    $passCode = RunGate "docs/features/__tmp_gate_pass"
    if ($passCode -ne 0) {
        Write-Host "Gate regression failed: ready feature package did not pass." -ForegroundColor Red
        exit 1
    }

    Write-Host "Gate regression tests passed." -ForegroundColor Green
}
finally {
    RemoveIfExists $failFeature
    RemoveIfExists $passFeature
}
