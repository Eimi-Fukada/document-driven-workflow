param(
    [string]$FeaturePath = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($FeaturePath)) {
    Write-Host "Development gate failed: missing -FeaturePath." -ForegroundColor Red
    Write-Host "Usage: npm run gate:dev -- -FeaturePath docs/features/<feature-id>"
    exit 1
}

$featureFullPath = if ([System.IO.Path]::IsPathRooted($FeaturePath)) {
    $FeaturePath
} else {
    Join-Path $root $FeaturePath
}

if (-not (Test-Path $featureFullPath)) {
    Write-Host "Development gate failed: feature path not found." -ForegroundColor Red
    Write-Host " - $FeaturePath"
    exit 1
}

$requiredFiles = @(
    "01-prd.md",
    "02-ui-spec.md",
    "03-technical-contract.md",
    "04-acceptance-criteria.md",
    "05-readiness-review.md",
    "06-implementation-plan.md"
)

$failures = @()

foreach ($file in $requiredFiles) {
    $full = Join-Path $featureFullPath $file
    if (-not (Test-Path $full)) {
        $failures += "Missing required file: $file"
    }
}

if ($failures.Count -eq 0) {
    $readinessPath = Join-Path $featureFullPath "05-readiness-review.md"
    $acceptancePath = Join-Path $featureFullPath "04-acceptance-criteria.md"

    $readiness = Get-Content -LiteralPath $readinessPath -Raw -Encoding utf8
    $acceptance = Get-Content -LiteralPath $acceptancePath -Raw -Encoding utf8

    $requiredGateLines = @(
        "- Readiness: Ready",
        "- Unresolved Questions: 0",
        "- Blocking Issues: 0",
        "- Assumptions Accepted: yes",
        "- User Approval: Approved",
        "- Implementation Plan Status: Approved"
    )

    foreach ($line in $requiredGateLines) {
        if ($readiness -notmatch [regex]::Escape($line)) {
            $failures += "Readiness gate not satisfied: $line"
        }
    }

    if ($acceptance -notmatch "REQ-") {
        $failures += "Acceptance criteria must reference at least one REQ-* requirement."
    }

    if ($acceptance -notmatch "AC-") {
        $failures += "Acceptance criteria must include at least one AC-* acceptance case."
    }

    $pendingConfirmation = -join ([char[]](0x5F85, 0x786E, 0x8BA4))
    $unconfirmed = -join ([char[]](0x672A, 0x786E, 0x8BA4))
    $pendingSupplement = -join ([char[]](0x5F85, 0x8865, 0x5145))
    $blockedPatterns = @("TODO", "TBD", $pendingConfirmation, $unconfirmed, $pendingSupplement)
    foreach ($file in $requiredFiles) {
        $full = Join-Path $featureFullPath $file
        $content = Get-Content -LiteralPath $full -Raw -Encoding utf8
        foreach ($pattern in $blockedPatterns) {
            if ($content -match [regex]::Escape($pattern)) {
                $failures += "Unresolved marker '$pattern' found in $file"
            }
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Host "Development gate failed. Do not start implementation." -ForegroundColor Red
    Write-Host ""
    $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Next step: fix the feature documents, then rerun:" -ForegroundColor Yellow
    Write-Host "npm run gate:dev -- -FeaturePath $FeaturePath"
    exit 1
}

Write-Host "Development gate passed." -ForegroundColor Green
Write-Host "Implementation may start for: $FeaturePath"
