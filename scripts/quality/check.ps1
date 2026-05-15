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
    "docs/workflow/AUTOMATION.md",
    "docs/workflow/GATES.md",
    "docs/workflow/MODE_ROUTER.md",
    "docs/workflow/EXECUTION_PROTOCOL.md",
    "docs/workflow/EXECUTION_DISCIPLINE.md",
    "docs/workflow/PRODUCT_TRACEABILITY.md",
    "docs/workflow/EPIC_WORKFLOW.md",
    "docs/workflow/STACK_POLICY.md",
    "docs/workflow/LEGACY_ADOPTION.md",
    "docs/workflow/presets/next-fullstack.md",
    "docs/workflow/presets/flutter-fastapi.md",
    "docs/workflow/presets/flutter-express.md",
    "docs/workflow/templates/feature/00-workflow.yaml",
    "docs/workflow/templates/feature/00-intake-review.md",
    "docs/workflow/templates/feature/01-light-feature.md",
    "docs/workflow/templates/feature/01-prd.md",
    "docs/workflow/templates/feature/01-light-feature.md",
    "docs/workflow/templates/feature/02-ui-spec.md",
    "docs/workflow/templates/feature/03-technical-contract.md",
    "docs/workflow/templates/feature/04-acceptance-criteria.md",
    "docs/workflow/templates/feature/05-readiness-review.md",
    "docs/workflow/templates/feature/06-implementation-plan.md",
    "docs/workflow/templates/feature/07-verification-report.md",
    "docs/workflow/templates/feature/08-context-pack.md",
    "docs/workflow/templates/product/requirement-ledger.md",
    "docs/workflow/templates/product/traceability.md",
    "docs/workflow/templates/product/snapshots/README.md",
    "docs/workflow/templates/change/change-request.md",
    "docs/workflow/templates/decision/adr.md",
    "docs/workflow/templates/legacy/baseline.md",
    "docs/workflow/templates/legacy/compatibility-contract.md",
    "docs/workflow/templates/legacy/modernization-plan.md",
    "docs/workflow/templates/epic/00-source.md",
    "docs/workflow/templates/epic/00-workflow.yaml",
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
    "scripts/shared/document-utils.mjs",
    "scripts/shared/file-utils.mjs",
    "scripts/shared/workflow-context.mjs",
    "scripts/workflow/automation/agent-plan.mjs",
    "scripts/workflow/automation/approval-review.mjs",
    "scripts/workflow/automation/approve.mjs",
    "scripts/workflow/automation/context-pack.mjs",
    "scripts/workflow/automation/route.mjs",
    "scripts/workflow/epic/create-features.mjs",
    "scripts/shared/workflow-manifest.mjs",
    "scripts/shared/product-artifacts.mjs",
    "scripts/workflow/gate/gate-subject.mjs",
    "scripts/workflow/product/init-product.mjs",
    "scripts/workflow/epic/gate-epic.mjs",
    "scripts/workflow/epic/hydrate-epic.mjs",
    "scripts/workflow/epic/new-epic.mjs",
    "scripts/workflow/feature/gate-feature.mjs",
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
$automation = ReadText "docs/workflow/AUTOMATION.md"
$gates = ReadText "docs/workflow/GATES.md"
$modeRouter = ReadText "docs/workflow/MODE_ROUTER.md"
$executionProtocol = ReadText "docs/workflow/EXECUTION_PROTOCOL.md"
$executionDiscipline = ReadText "docs/workflow/EXECUTION_DISCIPLINE.md"
$productTraceability = ReadText "docs/workflow/PRODUCT_TRACEABILITY.md"
$epicWorkflow = ReadText "docs/workflow/EPIC_WORKFLOW.md"
$stackPolicy = ReadText "docs/workflow/STACK_POLICY.md"
$agents = ReadText "AGENTS.md"
$claude = ReadText "CLAUDE.md"
$skill = ReadText "skills/document-driven-workflow/SKILL.md"
$package = ReadText "package.json"
$buildScript = ReadText "scripts/build/build-skills.mjs"
$epicHydrateScript = ReadText "scripts/workflow/epic/hydrate-epic.mjs"
$featureHydrateScript = ReadText "scripts/workflow/feature/hydrate-feature.mjs"
$featureNewScript = ReadText "scripts/workflow/feature/new-feature.mjs"
$featureGateScript = ReadText "scripts/workflow/feature/gate-feature.mjs"
$gateSubjectScript = ReadText "scripts/workflow/gate/gate-subject.mjs"
$epicFeaturesScript = ReadText "scripts/workflow/epic/create-features.mjs"
$routeScript = ReadText "scripts/workflow/automation/route.mjs"
$approvalReviewScript = ReadText "scripts/workflow/automation/approval-review.mjs"
$approveScript = ReadText "scripts/workflow/automation/approve.mjs"
$contextPackScript = ReadText "scripts/workflow/automation/context-pack.mjs"
$agentPlanScript = ReadText "scripts/workflow/automation/agent-plan.mjs"
$productArtifactsScript = ReadText "scripts/shared/product-artifacts.mjs"
$templateStatusDocs = @()
$templateStatusDocs += ReadText "docs/workflow/templates/change/change-request.md"
$templateStatusDocs += ReadText "docs/workflow/templates/decision/adr.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/01-light-feature.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/00-intake-review.md"
$templateStatusDocs += ReadText "docs/workflow/templates/feature/08-context-pack.md"
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
    @{ Name = "WORKFLOW.md defines product history layer"; Pass = $workflow -match "docs/product" -and $workflow -match "Requirement Ledger" -and $workflow -match "Traceability Matrix" },
    @{ Name = "USER_GUIDE.md defines Epic Feature Gate roles"; Pass = $userGuide -match "Epic" -and $userGuide -match "Feature" -and $userGuide -match "Gate" },
    @{ Name = "USER_GUIDE.md defines complexity levels"; Pass = $userGuide -match "Level 0" -and $userGuide -match "Level 4" },
    @{ Name = "MODE_ROUTER.md defines execution modes"; Pass = $modeRouter -match "Light" -and $modeRouter -match "Standard" -and $modeRouter -match "Epic" -and $modeRouter -match "Strict" },
    @{ Name = "EXECUTION_PROTOCOL.md defines lightweight execution"; Pass = $executionProtocol -match "Execution Mode" -and $executionProtocol -match "light" -and $executionProtocol -match "standard" -and $executionProtocol -match "strict" },
    @{ Name = "EXECUTION_DISCIPLINE.md defines implementation guardrails"; Pass = $executionDiscipline -match "Scope Lock" -and $executionDiscipline -match "TDD Trigger" -and $executionDiscipline -match "Debugging Trigger" -and $executionDiscipline -match "Self Review" },
    @{ Name = "EXECUTION_DISCIPLINE.md defines maintainability guardrails"; Pass = $executionDiscipline -match "2 or more times" -and $executionDiscipline -match "1000 lines" -and $executionDiscipline -match "Tailwind CSS" },
    @{ Name = "PRODUCT_TRACEABILITY.md defines product layer"; Pass = $productTraceability -match "requirement-ledger.md" -and $productTraceability -match "traceability.md" -and $productTraceability -match "snapshots" },
    @{ Name = "USAGE.md documents commands"; Pass = $usage -match "npm run build" -and $usage -match "npm run gate:dev" -and $usage -match "npm run gate:epic" },
    @{ Name = "AUTOMATION.md documents approval boundary"; Pass = $automation -match "approve.mjs" -and $automation -match "--user-approved" -and $automation -match "Agent Plan" },
    @{ Name = "AUTOMATION.md documents context pack"; Pass = $automation -match "context-pack.mjs" -and $automation -match "08-context-pack.md" },
    @{ Name = "USAGE.md documents hydrate flow"; Pass = $usage -match "epic:hydrate" -and $usage -match "feature:hydrate" -and $usage -match "00-workflow.yaml" },
    @{ Name = "Templates do not contain scattered approval fields"; Pass = -not ($templateStatusDocs | Where-Object { $_ -match "User Approval|Review Status|Hydration Status|Implementation Plan Status|Agent Plan Status|approval state|user approval|ready for user approval" }) },
    @{ Name = "USAGE.md documents epic features flow"; Pass = $usage -match "epic:features" -and $usage -match "Feature packages" },
    @{ Name = "USAGE.md documents Skill-owned target execution"; Pass = $usage -match "--target <project-root>" },
    @{ Name = "USAGE.md documents agent plan"; Pass = $usage -match "09-agent-plan.md" },
    @{ Name = "USAGE.md documents legacy and change flow"; Pass = $usage -match "BASELINE.md" -and $usage -match "COMPATIBILITY_CONTRACT.md" -and $usage -match "CR-0001" },
    @{ Name = "EPIC_WORKFLOW.md mentions gate:epic"; Pass = $epicWorkflow -match "gate:epic" },
    @{ Name = "GATES.md defines unified manifest gate"; Pass = $gates -match "00-workflow.yaml" -and $gates -match "approval: approved" },
    @{ Name = "GATES.md requires context pack"; Pass = $gates -match "00-intake-review.md" -and $gates -match "08-context-pack.md" },
    @{ Name = "GATES.md requires execution discipline"; Pass = $gates -match "Scope Lock" -and $gates -match "execution discipline" },
    @{ Name = "GATES.md requires maintainability guardrails"; Pass = $gates -match "reuse threshold" -and $gates -match "1000-line" -and $gates -match "Tailwind CSS" },
    @{ Name = "STACK_POLICY.md bans Pages Router"; Pass = $stackPolicy -match "Pages Router" -and $stackPolicy -match "App Router" },
    @{ Name = "STACK_POLICY.md defines allowed presets"; Pass = $stackPolicy -match "next-fullstack" -and $stackPolicy -match "flutter-fastapi" -and $stackPolicy -match "legacy-existing" },
    @{ Name = "AGENTS.md mentions gate:dev"; Pass = $agents -match "gate:dev" },
    @{ Name = "CLAUDE.md mentions gate:dev"; Pass = $claude -match "gate:dev" },
    @{ Name = "Skill mentions feature gate"; Pass = $skill -match "feature gate" -or $skill -match "gate" },
    @{ Name = "Skill mentions mode router"; Pass = $skill -match "MODE_ROUTER.md" -and $skill -match "EXECUTION_PROTOCOL.md" },
    @{ Name = "Skill mentions execution discipline"; Pass = $skill -match "EXECUTION_DISCIPLINE.md" -and $skill -match "Scope Lock" },
    @{ Name = "Skill mentions maintainability guardrails"; Pass = $skill -match "2 repeated uses" -and $skill -match "1000 lines" -and $skill -match "Tailwind CSS" },
    @{ Name = "Skill describes target project adoption"; Pass = $skill -match "target project" -and $skill -match "00-workflow.yaml" },
    @{ Name = "Skill mentions product traceability"; Pass = $skill -match "requirement-ledger.md" -and $skill -match "traceability.md" },
    @{ Name = "Build script generates skill references"; Pass = $buildScript -match "references" -and $buildScript -match "USAGE.md" -and $buildScript -match "workflow" },
    @{ Name = "Build script generates skill templates"; Pass = $buildScript -match "templates" -and $buildScript -match "copyDirectoryRecursive" },
    @{ Name = "Build script generates workflow scripts"; Pass = $buildScript -match "scripts" -and $buildScript -match "workflow" },
    @{ Name = "Hydrate scripts use manifest state"; Pass = $epicHydrateScript -match "00-workflow.yaml" -and $featureHydrateScript -match "00-workflow.yaml" -and $epicFeaturesScript -match "writeManifest" },
    @{ Name = "Feature scripts support light mode"; Pass = $featureNewScript -match "--mode" -and $gateSubjectScript -match "01-light-feature.md" },
    @{ Name = "Automation scripts exist"; Pass = $routeScript -match "Recommended Mode" -and $approvalReviewScript -match "Approval Review" -and $approveScript -match "--user-approved" -and $agentPlanScript -match "Assignment Matrix" },
    @{ Name = "Product automation scripts exist"; Pass = $contextPackScript -match "Context Pack" -and $productArtifactsScript -match "requirement-ledger.md" },
    @{ Name = "package.json exposes workflow route"; Pass = $package -match '"workflow:route"' },
    @{ Name = "package.json exposes workflow approval review"; Pass = $package -match '"workflow:approval-review"' },
    @{ Name = "package.json exposes workflow approve"; Pass = $package -match '"workflow:approve"' },
    @{ Name = "package.json exposes workflow context pack"; Pass = $package -match '"workflow:context-pack"' },
    @{ Name = "package.json exposes product init"; Pass = $package -match '"workflow:init-product"' },
    @{ Name = "package.json exposes workflow agent plan"; Pass = $package -match '"workflow:agent-plan"' },
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
