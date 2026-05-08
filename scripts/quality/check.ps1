$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$required = @(
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    "package.json",
    "setup",
    "setup.ps1",
    "docs/workflow/WORKFLOW.md",
    "docs/workflow/USER_GUIDE.md",
    "docs/workflow/USAGE.md",
    "docs/workflow/GATES.md",
    "docs/workflow/EPIC_WORKFLOW.md",
    "docs/workflow/STACK_POLICY.md",
    "docs/workflow/LEGACY_ADOPTION.md",
    "docs/workflow/presets/next-fullstack.md",
    "docs/workflow/presets/flutter-fastapi.md",
    "docs/workflow/presets/flutter-express.md",
    "docs/workflow/templates/feature/01-prd.md",
    "docs/workflow/templates/feature/02-ui-spec.md",
    "docs/workflow/templates/feature/03-technical-contract.md",
    "docs/workflow/templates/feature/04-acceptance-criteria.md",
    "docs/workflow/templates/feature/05-readiness-review.md",
    "docs/workflow/templates/feature/06-implementation-plan.md",
    "docs/workflow/templates/feature/07-verification-report.md",
    "docs/workflow/templates/change/change-request.md",
    "docs/workflow/templates/decision/adr.md",
    "docs/workflow/templates/legacy/baseline.md",
    "docs/workflow/templates/legacy/compatibility-contract.md",
    "docs/workflow/templates/legacy/modernization-plan.md",
    "docs/workflow/templates/epic/00-source.md",
    "docs/workflow/templates/epic/01-epic-brief.md",
    "docs/workflow/templates/epic/02-requirement-inventory.md",
    "docs/workflow/templates/epic/03-scope-breakdown.md",
    "docs/workflow/templates/epic/04-risk-map.md",
    "docs/workflow/templates/epic/05-release-plan.md",
    "docs/workflow/templates/epic/06-acceptance-map.md",
    "docs/workflow/templates/epic/07-progress-board.md",
    "docs/workflow/templates/epic/08-retrospective.md",
    "docs/workflow/templates/epic/09-agent-plan.md",
    "scripts/build/build-skills.mjs",
    "scripts/install/setup.mjs",
    "scripts/shared/agent-runner.mjs",
    "scripts/shared/file-utils.mjs",
    "scripts/shared/workflow-context.mjs",
    "scripts/workflow/epic/create-features.mjs",
    "scripts/workflow/epic/gate-epic.ps1",
    "scripts/workflow/epic/hydrate-epic.mjs",
    "scripts/workflow/epic/new-epic.mjs",
    "scripts/workflow/feature/gate-feature.ps1",
    "scripts/workflow/feature/hydrate-feature.mjs",
    "scripts/workflow/feature/new-feature.mjs",
    "scripts/workflow/test/test-gates.ps1",
    "scripts/quality/check.ps1",
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
$userGuide = ReadText "docs/workflow/USER_GUIDE.md"
$usage = ReadText "docs/workflow/USAGE.md"
$gates = ReadText "docs/workflow/GATES.md"
$epicWorkflow = ReadText "docs/workflow/EPIC_WORKFLOW.md"
$stackPolicy = ReadText "docs/workflow/STACK_POLICY.md"
$agents = ReadText "AGENTS.md"
$claude = ReadText "CLAUDE.md"
$skill = ReadText "skills/document-driven-workflow/SKILL.md"
$package = ReadText "package.json"
$buildScript = ReadText "scripts/build/build-skills.mjs"
$epicHydrateScript = ReadText "scripts/workflow/epic/hydrate-epic.mjs"
$featureHydrateScript = ReadText "scripts/workflow/feature/hydrate-feature.mjs"
$epicFeaturesScript = ReadText "scripts/workflow/epic/create-features.mjs"
$templateStatusDocs = @()
$templateStatusDocs += ReadText "docs/workflow/templates/change/change-request.md"
$templateStatusDocs += ReadText "docs/workflow/templates/decision/adr.md"
$templateStatusDocs += ReadText "docs/workflow/templates/epic/01-epic-brief.md"
$templateStatusDocs += ReadText "docs/workflow/templates/epic/02-requirement-inventory.md"
$templateStatusDocs += ReadText "docs/workflow/templates/epic/06-acceptance-map.md"
$templateStatusDocs += ReadText "docs/workflow/templates/epic/07-progress-board.md"
$templateStatusDocs += ReadText "docs/workflow/templates/epic/09-agent-plan.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/01-prd.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/04-acceptance-criteria.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/05-readiness-review.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/06-implementation-plan.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/07-verification-report.md"
$templateStatusDocs += ReadText "docs/workflow/templates/legacy/modernization-plan.md"
$progressBoardTemplate = ReadText "docs/workflow/templates/epic/07-progress-board.md"

$contentChecks = @(
    @{ Name = "WORKFLOW.md mentions gate:dev"; Pass = $workflow -match "gate:dev" },
    @{ Name = "USER_GUIDE.md defines Epic Feature Gate roles"; Pass = $userGuide -match "Epic" -and $userGuide -match "Feature" -and $userGuide -match "Gate" },
    @{ Name = "USER_GUIDE.md defines complexity levels"; Pass = $userGuide -match "Level 0" -and $userGuide -match "Level 4" },
    @{ Name = "USAGE.md documents commands"; Pass = $usage -match "npm run build" -and $usage -match "npm run gate:dev" -and $usage -match "npm run gate:epic" },
    @{ Name = "USAGE.md documents hydrate flow"; Pass = $usage -match "epic:hydrate" -and $usage -match "feature:hydrate" -and $usage -match "HYDRATION.md" },
    @{ Name = "USAGE.md documents hydration allowed values"; Pass = $usage -match "Hydration Status: Reviewed" -and $usage -match "Review Status: Reviewed" -and $usage -match "User Approval: Approved" },
    @{ Name = "Templates document editable status values"; Pass = -not ($templateStatusDocs | Where-Object { $_ -notmatch "Allowed Status Values" }) },
    @{ Name = "Progress board uses ASCII Epic Status"; Pass = $progressBoardTemplate -match "Epic Status:" },
    @{ Name = "USAGE.md documents epic features flow"; Pass = $usage -match "epic:features" -and $usage -match "Feature packages" },
    @{ Name = "USAGE.md documents Skill-owned target execution"; Pass = $usage -match "--target <project-root>" },
    @{ Name = "USAGE.md documents agent plan"; Pass = $usage -match "09-agent-plan.md" },
    @{ Name = "USAGE.md documents legacy and change flow"; Pass = $usage -match "Legacy Baseline" -and $usage -match "Compatibility Contract" -and $usage -match "Change Request" },
    @{ Name = "EPIC_WORKFLOW.md mentions gate:epic"; Pass = $epicWorkflow -match "gate:epic" },
    @{ Name = "GATES.md defines Readiness Ready"; Pass = $gates -match "Readiness: Ready" },
    @{ Name = "STACK_POLICY.md bans Pages Router"; Pass = $stackPolicy -match "Pages Router" -and $stackPolicy -match "App Router" },
    @{ Name = "STACK_POLICY.md defines allowed presets"; Pass = $stackPolicy -match "next-fullstack" -and $stackPolicy -match "flutter-fastapi" -and $stackPolicy -match "legacy-existing" },
    @{ Name = "AGENTS.md mentions gate:dev"; Pass = $agents -match "gate:dev" },
    @{ Name = "CLAUDE.md mentions gate:dev"; Pass = $claude -match "gate:dev" },
    @{ Name = "Skill mentions feature gate"; Pass = $skill -match "feature gate" -or $skill -match "gate" },
    @{ Name = "Skill describes target project adoption"; Pass = $skill -match "Target Project Adoption" -and $skill -match "templates/feature" },
    @{ Name = "Build script generates skill references"; Pass = $buildScript -match "references" -and $buildScript -match "USAGE.md" -and $buildScript -match "workflow" },
    @{ Name = "Build script generates skill templates"; Pass = $buildScript -match "templates" -and $buildScript -match "copyDirectoryRecursive" },
    @{ Name = "Build script generates workflow scripts"; Pass = $buildScript -match "scripts" -and $buildScript -match "workflow" },
    @{ Name = "Hydrate scripts document allowed values"; Pass = $epicHydrateScript -match "Allowed Status Values" -and $featureHydrateScript -match "Allowed Status Values" -and $epicFeaturesScript -match "Allowed Status Values" },
    @{ Name = "package.json exposes epic:new"; Pass = $package -match '"epic:new"' },
    @{ Name = "package.json exposes epic:features"; Pass = $package -match '"epic:features"' },
    @{ Name = "package.json exposes epic:hydrate"; Pass = $package -match '"epic:hydrate"' },
    @{ Name = "package.json exposes gate:epic"; Pass = $package -match '"gate:epic"' },
    @{ Name = "package.json exposes feature:new"; Pass = $package -match '"feature:new"' },
    @{ Name = "package.json exposes feature:hydrate"; Pass = $package -match '"feature:hydrate"' },
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
