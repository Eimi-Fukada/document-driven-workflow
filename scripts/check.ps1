$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

$required = @(
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    "package.json",
    "setup",
    "setup.ps1",
    "docs/workflow/WORKFLOW.md",
    "docs/workflow/GATES.md",
    "docs/workflow/STACK_POLICY.md",
    "docs/workflow/LEGACY_ADOPTION.md",
    "docs/workflow/presets/next-fullstack.md",
    "docs/workflow/presets/flutter-fastapi.md",
    "docs/workflow/presets/flutter-express.md",
    "docs/workflow/templates/prd.md",
    "docs/workflow/templates/ui-spec.md",
    "docs/workflow/templates/technical-contract.md",
    "docs/workflow/templates/acceptance.md",
    "docs/workflow/templates/readiness-review.md",
    "docs/workflow/templates/implementation-plan.md",
    "docs/workflow/templates/change-request.md",
    "docs/workflow/templates/verification-report.md",
    "docs/workflow/templates/legacy-baseline.md",
    "docs/workflow/templates/compatibility-contract.md",
    "docs/workflow/templates/modernization-plan.md",
    "scripts/check.ps1",
    "scripts/gate-dev.ps1",
    "scripts/new-feature.mjs",
    "scripts/test-gates.ps1",
    "scripts/build-skills.mjs",
    "scripts/setup.mjs",
    "scripts/file-utils.mjs",
    "skills/document-driven-workflow/SKILL.md"
)

$missing = @()
foreach ($item in $required) {
    $full = Join-Path $root $item
    if (-not (Test-Path $full)) {
        $missing += $item
    }
}

function ReadText($relativePath) {
    $full = Join-Path $root $relativePath
    if (-not (Test-Path $full)) {
        return ""
    }
    return Get-Content -LiteralPath $full -Raw -Encoding utf8
}

$workflow = ReadText "docs/workflow/WORKFLOW.md"
$gates = ReadText "docs/workflow/GATES.md"
$stackPolicy = ReadText "docs/workflow/STACK_POLICY.md"
$agents = ReadText "AGENTS.md"
$claude = ReadText "CLAUDE.md"
$skill = ReadText "skills/document-driven-workflow/SKILL.md"
$package = ReadText "package.json"

$contentChecks = @(
    @{ Name = "WORKFLOW.md mentions gate:dev"; Pass = $workflow -match "gate:dev" },
    @{ Name = "GATES.md defines Readiness Ready"; Pass = $gates -match "Readiness: Ready" },
    @{ Name = "STACK_POLICY.md bans Pages Router"; Pass = $stackPolicy -match "Pages Router" -and $stackPolicy -match "App Router" },
    @{ Name = "STACK_POLICY.md defines allowed presets"; Pass = $stackPolicy -match "next-fullstack" -and $stackPolicy -match "flutter-fastapi" -and $stackPolicy -match "legacy-existing" },
    @{ Name = "AGENTS.md mentions gate:dev"; Pass = $agents -match "gate:dev" },
    @{ Name = "CLAUDE.md mentions gate:dev"; Pass = $claude -match "gate:dev" },
    @{ Name = "Skill mentions gate:dev"; Pass = $skill -match "gate:dev" },
    @{ Name = "package.json exposes feature:new"; Pass = $package -match '"feature:new"' },
    @{ Name = "package.json exposes gate:dev"; Pass = $package -match '"gate:dev"' },
    @{ Name = "package.json exposes test:gates"; Pass = $package -match '"test:gates"' },
    @{ Name = "package.json exposes setup:codex"; Pass = $package -match '"setup:codex"' },
    @{ Name = "package.json exposes setup:claude"; Pass = $package -match '"setup:claude"' }
)

foreach ($check in $contentChecks) {
    if (-not $check.Pass) {
        $missing += $check.Name
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Workflow check failed:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "Workflow structure check passed." -ForegroundColor Green
Write-Host ""
Write-Host "Before implementation, run:" -ForegroundColor Cyan
Write-Host "npm run gate:dev -- -FeaturePath docs/features/<feature-id>"
