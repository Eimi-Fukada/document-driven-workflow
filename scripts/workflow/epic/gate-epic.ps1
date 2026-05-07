param(
    [string]$EpicPath = ""
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$epicGateCommand = if ($env:WORKFLOW_EPIC_GATE_COMMAND) { $env:WORKFLOW_EPIC_GATE_COMMAND } else { "npm run gate:epic" }

if ([string]::IsNullOrWhiteSpace($EpicPath)) {
    Write-Host "Epic gate failed: missing -EpicPath." -ForegroundColor Red
    Write-Host "Usage: $epicGateCommand -- -EpicPath docs/epics/<epic-id>"
    exit 1
}

$epicFullPath = if ([System.IO.Path]::IsPathRooted($EpicPath)) {
    $EpicPath
} else {
    Join-Path $root $EpicPath
}

if (-not (Test-Path $epicFullPath)) {
    Write-Host "Epic gate failed: epic path not found." -ForegroundColor Red
    Write-Host " - $EpicPath"
    exit 1
}

$requiredFiles = @(
    "00-source.md",
    "01-epic-brief.md",
    "02-requirement-inventory.md",
    "03-scope-breakdown.md",
    "04-risk-map.md",
    "05-release-plan.md",
    "06-acceptance-map.md",
    "07-progress-board.md"
)

$failures = @()

foreach ($file in $requiredFiles) {
    $full = Join-Path $epicFullPath $file
    if (-not (Test-Path $full)) {
        $failures += "Missing required file: $file"
    }
}

if ($failures.Count -eq 0) {
    $source = Get-Content -LiteralPath (Join-Path $epicFullPath "00-source.md") -Raw -Encoding utf8
    $brief = Get-Content -LiteralPath (Join-Path $epicFullPath "01-epic-brief.md") -Raw -Encoding utf8
    $inventory = Get-Content -LiteralPath (Join-Path $epicFullPath "02-requirement-inventory.md") -Raw -Encoding utf8
    $breakdown = Get-Content -LiteralPath (Join-Path $epicFullPath "03-scope-breakdown.md") -Raw -Encoding utf8
    $risk = Get-Content -LiteralPath (Join-Path $epicFullPath "04-risk-map.md") -Raw -Encoding utf8
    $release = Get-Content -LiteralPath (Join-Path $epicFullPath "05-release-plan.md") -Raw -Encoding utf8
    $acceptance = Get-Content -LiteralPath (Join-Path $epicFullPath "06-acceptance-map.md") -Raw -Encoding utf8

    $hydrationPath = Join-Path $epicFullPath "HYDRATION.md"
    if (Test-Path $hydrationPath) {
        $hydration = Get-Content -LiteralPath $hydrationPath -Raw -Encoding utf8
        if ($hydration -match "(?m)^- Review Status:\s*Draft\s*$") {
            $failures += "Epic hydration draft has not been reviewed."
        }
        if ($hydration -match "(?m)^- User Approval:\s*Pending\s*$") {
            $failures += "Epic hydration draft is pending user approval."
        }
    }

    if ($source -notmatch "原始内容" -and $source.Trim().Length -lt 80) {
        $failures += "Epic source must preserve original product material or source path."
    }

    $statusMatch = [regex]::Match($brief, "(?m)^- Epic Status:\s*(Ready for Breakdown|In Progress|Released)\s*$")
    if (-not $statusMatch.Success) {
        $failures += "Epic brief must declare ASCII machine field '- Epic Status: Ready for Breakdown|In Progress|Released'."
    }

    if ($inventory -notmatch "EREQ-") {
        $failures += "Requirement inventory must include at least one EREQ-* item."
    }

    if ($breakdown -notmatch "Feature ID") {
        $failures += "Scope breakdown must include feature candidates."
    }

    if ($risk -notmatch "RISK-") {
        $failures += "Risk map must include at least one RISK-* item."
    }

    if ($release -notmatch "Batch 1") {
        $failures += "Release plan must include Batch 1."
    }

    if ($acceptance -notmatch "EREQ-") {
        $failures += "Acceptance map must reference EREQ-* items."
    }

    $pendingConfirmation = -join ([char[]](0x5F85, 0x786E, 0x8BA4))
    $unconfirmed = -join ([char[]](0x672A, 0x786E, 0x8BA4))
    $pendingSupplement = -join ([char[]](0x5F85, 0x8865, 0x5145))
    $blockedPatterns = @("TODO", "TBD", "Review Status: Draft", "User Approval: Pending", "Hydration Status: Draft", $pendingConfirmation, $unconfirmed, $pendingSupplement)

    foreach ($file in $requiredFiles) {
        $content = Get-Content -LiteralPath (Join-Path $epicFullPath $file) -Raw -Encoding utf8
        foreach ($pattern in $blockedPatterns) {
            if ($content -match [regex]::Escape($pattern)) {
                $failures += "Unresolved marker '$pattern' found in $file"
            }
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Host "Epic gate failed. Do not create implementation-ready feature work yet." -ForegroundColor Red
    Write-Host ""
    $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Next step: fix the epic documents, then rerun:" -ForegroundColor Yellow
    Write-Host "$epicGateCommand -- -EpicPath $EpicPath"
    exit 1
}

Write-Host "Epic gate passed." -ForegroundColor Green
Write-Host "Feature breakdown may start for: $EpicPath"
