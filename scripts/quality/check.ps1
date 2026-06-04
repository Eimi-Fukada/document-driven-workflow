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
    "docs/workflow/POSITIONING.md",
    "docs/workflow/MAESTRO_INTEGRATION.md",
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
    "docs/workflow/templates/contracts/integration-contract.md",
    "docs/workflow/templates/contracts/project-contract.md",
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
    "scripts/shared/coverage-matrix.mjs",
    "scripts/shared/document-utils.mjs",
    "scripts/shared/file-utils.mjs",
    "scripts/shared/workflow-context.mjs",
    "scripts/workflow/automation/adopt.mjs",
    "scripts/workflow/automation/agent-plan.mjs",
    "scripts/workflow/automation/approval-review.mjs",
    "scripts/workflow/automation/approve.mjs",
    "scripts/workflow/automation/completion-check.mjs",
    "scripts/workflow/automation/continue.mjs",
    "scripts/workflow/automation/context-pack.mjs",
    "scripts/workflow/automation/doctor.mjs",
    "scripts/workflow/automation/finish-feature.mjs",
    "scripts/workflow/automation/handoff-pack.mjs",
    "scripts/workflow/automation/process.mjs",
    "scripts/workflow/automation/route.mjs",
    "scripts/workflow/automation/status.mjs",
    "scripts/workflow/automation/verify.mjs",
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
$positioning = ReadText "docs/workflow/POSITIONING.md"
$maestroIntegration = ReadText "docs/workflow/MAESTRO_INTEGRATION.md"
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
$agentRunnerScript = ReadText "scripts/shared/agent-runner.mjs"
$coverageMatrixScript = ReadText "scripts/shared/coverage-matrix.mjs"
$epicHydrateScript = ReadText "scripts/workflow/epic/hydrate-epic.mjs"
$featureHydrateScript = ReadText "scripts/workflow/feature/hydrate-feature.mjs"
$featureNewScript = ReadText "scripts/workflow/feature/new-feature.mjs"
$featureGateScript = ReadText "scripts/workflow/feature/gate-feature.mjs"
$gateSubjectScript = ReadText "scripts/workflow/gate/gate-subject.mjs"
$epicFeaturesScript = ReadText "scripts/workflow/epic/create-features.mjs"
$routeScript = ReadText "scripts/workflow/automation/route.mjs"
$approvalReviewScript = ReadText "scripts/workflow/automation/approval-review.mjs"
$approveScript = ReadText "scripts/workflow/automation/approve.mjs"
$completionCheckScript = ReadText "scripts/workflow/automation/completion-check.mjs"
$continueScript = ReadText "scripts/workflow/automation/continue.mjs"
$contextPackScript = ReadText "scripts/workflow/automation/context-pack.mjs"
$doctorScript = ReadText "scripts/workflow/automation/doctor.mjs"
$finishFeatureScript = ReadText "scripts/workflow/automation/finish-feature.mjs"
$statusScript = ReadText "scripts/workflow/automation/status.mjs"
$handoffPackScript = ReadText "scripts/workflow/automation/handoff-pack.mjs"
$processScript = ReadText "scripts/workflow/automation/process.mjs"
$agentPlanScript = ReadText "scripts/workflow/automation/agent-plan.mjs"
$verifyScript = ReadText "scripts/workflow/automation/verify.mjs"
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
    @{ Name = "WORKFLOW.md mentions Skill-owned gates"; Pass = $workflow -match "gate-feature.mjs" -and $workflow -match "gate-epic.mjs" },
    @{ Name = "WORKFLOW.md defines product history layer"; Pass = $workflow -match "docs/product" -and $workflow -match "Requirement Ledger" -and $workflow -match "Traceability Matrix" },
    @{ Name = "USER_GUIDE.md defines Epic Feature Gate roles"; Pass = $userGuide -match "Epic" -and $userGuide -match "Feature" -and $userGuide -match "Gate" },
    @{ Name = "USER_GUIDE.md defines complexity levels"; Pass = $userGuide -match "Level 0" -and $userGuide -match "Level 4" },
    @{ Name = "USER_GUIDE.md defines one-time route confirmation"; Pass = $userGuide -match "Mode" -and $userGuide -match "Risk level" -and $userGuide -match "00-workflow.yaml" },
    @{ Name = "MODE_ROUTER.md defines execution modes"; Pass = $modeRouter -match "Light" -and $modeRouter -match "Standard" -and $modeRouter -match "Epic" -and $modeRouter -match "Strict" },
    @{ Name = "MODE_ROUTER.md defines AI draft plus user confirmation"; Pass = $modeRouter -match "route_decision: user_confirmed" -and $modeRouter -match "expected_runtime" -and $modeRouter -match "execution_slicing" },
    @{ Name = "MODE_ROUTER.md limits hard downgrade blockers"; Pass = $modeRouter -match "hard_risk_blockers" -and $modeRouter -match "route_decision" -and $modeRouter -match "user_confirmed" },
    @{ Name = "EXECUTION_PROTOCOL.md defines lightweight execution"; Pass = $executionProtocol -match "Execution Mode" -and $executionProtocol -match "light" -and $executionProtocol -match "standard" -and $executionProtocol -match "strict" },
    @{ Name = "EXECUTION_DISCIPLINE.md defines implementation guardrails"; Pass = $executionDiscipline -match "Scope Lock" -and $executionDiscipline -match "TDD Trigger" -and $executionDiscipline -match "Debugging Trigger" -and $executionDiscipline -match "Self Review" },
    @{ Name = "EXECUTION_DISCIPLINE.md prevents implementation drift"; Pass = $executionDiscipline -match "Feature Execution Contract" -and $executionDiscipline -match "Implementation Deviation Stop Rule" -and $executionDiscipline -match "Build/typecheck alone" },
    @{ Name = "EXECUTION_DISCIPLINE.md defines coverage matrix discipline"; Pass = $executionDiscipline -match "Coverage Matrix" -and $executionDiscipline -match "COV-\\*" -and $executionDiscipline -match "3-5" },
    @{ Name = "EXECUTION_DISCIPLINE.md defines soft Stall Guard"; Pass = $executionDiscipline -match "Stall Guard" -and $executionDiscipline -match "30" -and $executionDiscipline -match "60-90" -and $executionDiscipline -match "finish-feature.mjs" },
    @{ Name = "EXECUTION_DISCIPLINE.md defines maintainability guardrails"; Pass = $executionDiscipline -match "2 or more times" -and $executionDiscipline -match "1000 lines" -and $executionDiscipline -match "Stack Preset" },
    @{ Name = "EXECUTION_DISCIPLINE.md defines performance and closure guardrails"; Pass = $executionDiscipline -match "Performance Discipline" -and $executionDiscipline -match "Option And Closure Advisory" -and $executionDiscipline -match "explain plan" },
    @{ Name = "PRODUCT_TRACEABILITY.md defines product layer"; Pass = $productTraceability -match "requirement-ledger.md" -and $productTraceability -match "traceability.md" -and $productTraceability -match "snapshots" },
    @{ Name = "POSITIONING.md explains audience and Superpowers boundary"; Pass = $positioning -match "Superpowers" -and $positioning -match "document-driven-workflow" -and $positioning -match "Requirement Ledger" },
    @{ Name = "POSITIONING.md explains Maestro boundary"; Pass = $positioning -match "Maestro" -and $positioning -match "doctor --json" -and $positioning -match "handoff-pack --json" },
    @{ Name = "POSITIONING.md explains Maestro layered fit"; Pass = $positioning -match "Codex / Claude Code" -and $positioning -match "handoff-pack.json" -and $positioning -match "finish-feature --json" },
    @{ Name = "MAESTRO_INTEGRATION.md defines orchestration boundary"; Pass = $maestroIntegration -match "Maestro" -and $maestroIntegration -match "document-driven-workflow" -and $maestroIntegration -match "integration_blocker" },
    @{ Name = "MAESTRO_INTEGRATION.md documents machine interfaces"; Pass = $maestroIntegration -match "doctor --json" -and $maestroIntegration -match "status --json" -and $maestroIntegration -match "handoff-pack --json" -and $maestroIntegration -match "finish-feature --json" },
    @{ Name = "MAESTRO_INTEGRATION.md documents parallel dispatch boundaries"; Pass = $maestroIntegration -match "ready_for_implementation" -and $maestroIntegration -match "finish-feature --json" -and $maestroIntegration -match "Integration Contract" },
    @{ Name = "MAESTRO_INTEGRATION.md rejects fake verified status"; Pass = $maestroIntegration -match "manifest_verified_without_proof" -and $maestroIntegration -match "COMPLETION_PROOF.json" },
    @{ Name = "USAGE.md is maintainer-focused"; Pass = $usage -match "USER_GUIDE.md" -and $usage -match "npm run build" -and $usage -match "npm test" -and $usage -match "--target <project-root>" },
    @{ Name = "USAGE.md documents maintainer commands"; Pass = $usage -match "npm run build" -and $usage -match "npm run check" -and $usage -match "npm test" },
    @{ Name = "USAGE.md documents main script entries"; Pass = $usage -match "adopt.mjs" -and $usage -match "process.mjs" -and $usage -match "continue.mjs" -and $usage -match "verify.mjs" -and $usage -match "doctor.mjs" -and $usage -match "completion-check.mjs" -and $usage -match "finish-feature.mjs" },
    @{ Name = "USAGE.md documents Maestro entries"; Pass = $usage -match "status.mjs" -and $usage -match "handoff-pack.mjs" -and $usage -match "--json" },
    @{ Name = "AUTOMATION.md documents approval boundary"; Pass = $automation -match "approve.mjs" -and $automation -match "--user-approved" -and $automation -match "Agent Plan" },
    @{ Name = "AUTOMATION.md documents context pack"; Pass = $automation -match "context-pack.mjs" -and $automation -match "08-context-pack.md" },
    @{ Name = "AUTOMATION.md documents main entries"; Pass = $automation -match "adopt.mjs" -and $automation -match "process.mjs" -and $automation -match "continue.mjs" -and $automation -match "verify.mjs" -and $automation -match "doctor.mjs" -and $automation -match "completion-check.mjs" -and $automation -match "finish-feature.mjs" },
    @{ Name = "AUTOMATION.md documents Maestro machine interfaces"; Pass = $automation -match "status.mjs" -and $automation -match "handoff-pack.mjs" -and $automation -match "Maestro" },
    @{ Name = "USAGE.md documents agent options"; Pass = $usage -match "--agent codex" -and $usage -match "--agent claude" -and $usage -match "--agent none" },
    @{ Name = "Templates do not contain scattered approval fields"; Pass = -not ($templateStatusDocs | Where-Object { $_ -match "User Approval|Review Status|Hydration Status|Implementation Plan Status|Agent Plan Status|approval state|user approval|ready for user approval" }) },
    @{ Name = "Templates avoid workflow-like status fields"; Pass = -not ($templateStatusDocs | Where-Object { $_ -cmatch "Allowed Status Values|Draft / Ready|Proposed / Accepted|Draft / Approved|Draft / Accepted" }) },
    @{ Name = "USAGE.md documents document packages"; Pass = $usage -match "00-source.md" -and $usage -match "01-prd.md" -and $usage -match "01-light-feature.md" },
    @{ Name = "USAGE.md documents Skill-owned target execution"; Pass = $usage -match "--target <project-root>" },
    @{ Name = "USAGE.md documents agent plan"; Pass = $usage -match "09-agent-plan.md" },
    @{ Name = "USAGE.md documents legacy and change flow"; Pass = $usage -match "BASELINE.md" -and $usage -match "COMPATIBILITY_CONTRACT.md" -and $usage -match "CR-0001" },
    @{ Name = "EPIC_WORKFLOW.md mentions Epic gate"; Pass = $epicWorkflow -match "Epic gate" },
    @{ Name = "GATES.md defines unified manifest gate"; Pass = $gates -match "00-workflow.yaml" -and $gates -match "approval: approved" },
    @{ Name = "GATES.md requires user confirmed route"; Pass = $gates -match "route_decision: user_confirmed" -and $gates -match "hard_risk_blockers" },
    @{ Name = "GATES.md requires context pack"; Pass = $gates -match "00-intake-review.md" -and $gates -match "08-context-pack.md" },
    @{ Name = "GATES.md requires execution discipline"; Pass = $gates -match "Scope Lock" -and $gates -match "execution discipline" },
    @{ Name = "GATES.md requires maintainability guardrails"; Pass = $gates -match "reuse threshold" -and $gates -match "1000-line" -and $gates -match "Stack Preset" },
    @{ Name = "GATES.md requires performance and closure guardrails"; Pass = $gates -match "Performance Guardrails" -and $gates -match "Option And Closure Notes" -and $gates -match "Performance Review" },
    @{ Name = "GATES.md documents completion gate"; Pass = $gates -match "Completion Gate" -and $gates -match "completion-check.mjs" -and $gates -match "traceability.md" },
    @{ Name = "GATES.md documents coverage matrix gate"; Pass = $gates -match "Coverage Matrix Gate" -and $gates -match "Expected coverage items" -and $gates -match "COV-\\*" },
    @{ Name = "GATES.md documents fake completion handling"; Pass = $gates -match "status: verified" -and $gates -match "COMPLETION_PROOF.json" -and $gates -match "finish-feature.mjs" },
    @{ Name = "GATES.md documents machine-readable completion gate"; Pass = $gates -match "--json" -and $gates -match "Maestro" },
    @{ Name = "STACK_POLICY.md bans Pages Router"; Pass = $stackPolicy -match "Pages Router" -and $stackPolicy -match "App Router" },
    @{ Name = "STACK_POLICY.md defines built-in and custom stacks"; Pass = $stackPolicy -match "next-fullstack" -and $stackPolicy -match "flutter-fastapi" -and $stackPolicy -match "legacy-existing" -and $stackPolicy -match "custom stack" },
    @{ Name = "AGENTS.md mentions Skill-owned gates"; Pass = $agents -match "gate-feature.mjs" -and $agents -match "gate-epic.mjs" },
    @{ Name = "CLAUDE.md mentions Skill-owned gates"; Pass = $claude -match "gate-feature.mjs" -and $claude -match "gate-epic.mjs" },
    @{ Name = "Skill mentions feature gate"; Pass = $skill -match "feature gate" -or $skill -match "gate" },
    @{ Name = "Skill mentions mode router"; Pass = $skill -match "MODE_ROUTER.md" -and $skill -match "EXECUTION_PROTOCOL.md" },
    @{ Name = "Skill mentions AI draft plus user confirmation"; Pass = $skill -match "route_decision: user_confirmed" -and $skill -match "hard_risk_blockers" },
    @{ Name = "Skill mentions execution discipline"; Pass = $skill -match "EXECUTION_DISCIPLINE.md" -and $skill -match "Scope Lock" },
    @{ Name = "Skill mentions single Feature closure"; Pass = $skill -match "Feature" -and $skill -match "finish-feature.mjs" -and $skill -match "MVP" },
    @{ Name = "Skill mentions maintainability guardrails"; Pass = $skill -match "2 repeated uses" -and $skill -match "1000 lines" -and $skill -match "Stack Preset" },
    @{ Name = "Skill mentions coverage matrix guardrail"; Pass = $skill -match "Coverage Matrix" -and $skill -match "COV-\\*" -and $skill -match "finish-feature.mjs" },
    @{ Name = "Skill mentions soft Stall Guard"; Pass = $skill -match "Stall Guard" -and $skill -match "30" -and $skill -match "15" -and $skill -match "finish-feature.mjs" },
    @{ Name = "Skill mentions performance and closure guardrails"; Pass = $skill -match "Performance" -and $skill -match "Closure" },
    @{ Name = "Skill mentions completion check"; Pass = $skill -match "completion-check.mjs" -and $skill -match "Feature" },
    @{ Name = "Skill mentions Maestro integration"; Pass = $skill -match "Maestro" -and $skill -match "handoff-pack.mjs" -and $skill -match "status.mjs" },
    @{ Name = "Skill describes target project adoption"; Pass = $skill -match "--target <project-root>" -and $skill -match "00-workflow.yaml" },
    @{ Name = "Skill keeps user entry concise"; Pass = $skill -match "references/USER_GUIDE.md" -and $skill -match "references/USAGE.md" -and $skill -match "--target <project-root>" -and -not ($skill -match "process.mjs --source") },
    @{ Name = "Skill mentions product traceability"; Pass = $skill -match "requirement-ledger.md" -and $skill -match "traceability.md" },
    @{ Name = "Build script generates skill references"; Pass = $buildScript -match "references" -and $buildScript -match "USAGE.md" -and $buildScript -match "MAESTRO_INTEGRATION.md" },
    @{ Name = "Build script generates skill templates"; Pass = $buildScript -match "templates" -and $buildScript -match "copyDirectoryRecursive" },
    @{ Name = "Build script generates workflow scripts"; Pass = $buildScript -match "scripts" -and $buildScript -match "workflow" },
    @{ Name = "Hydrate scripts use manifest state"; Pass = $epicHydrateScript -match "00-workflow.yaml" -and $featureHydrateScript -match "00-workflow.yaml" -and $epicFeaturesScript -match "writeManifest" },
    @{ Name = "Hydrate script treats route as review draft"; Pass = $featureHydrateScript -match "AI draft for user review" -and $featureHydrateScript -match "objective hard risks" },
    @{ Name = "Hydrate agent supports Codex and Claude"; Pass = $agentRunnerScript -match "claude" -and $agentRunnerScript -match "codex" -and $agentRunnerScript -match "none" },
    @{ Name = "Coverage matrix helper exists"; Pass = $coverageMatrixScript -match "evaluateCoverageMatrix" -and $coverageMatrixScript -match "readCoverageMatrix" -and $coverageMatrixScript -match "Expected coverage items" },
    @{ Name = "Gate subject does not keep legacy path options"; Pass = -not ($gateSubjectScript -match "FeaturePath|EpicPath") },
    @{ Name = "Feature scripts support light mode"; Pass = $featureNewScript -match "--mode" -and $gateSubjectScript -match "01-light-feature.md" },
    @{ Name = "Automation scripts exist"; Pass = $routeScript -match "Recommended Mode" -and $approvalReviewScript -match "Approval Review" -and $approveScript -match "--user-approved" -and $agentPlanScript -match "Assignment Matrix" -and $doctorScript -match "Workflow Doctor Report" -and $completionCheckScript -match "Completion Check" },
    @{ Name = "Automation scripts enforce one-time route confirmation"; Pass = $approveScript -match "validateRouteDecision" -and $continueScript -match "validateRouteDecision" -and $gateSubjectScript -match "validateRouteDecision" },
    @{ Name = "Automation route scripts avoid uncertainty escalation"; Pass = $routeScript -match "Do not make ordinary API/data/UI/state uncertainty automatically Strict" -and $processScript -match "hardStrictPattern" },
    @{ Name = "Automation scripts check performance and closure risks"; Pass = $completionCheckScript -match "Performance evidence" -and $completionCheckScript -match "Closure risk review" -and $contextPackScript -match "Performance Guardrails" },
    @{ Name = "Automation scripts check coverage matrix"; Pass = $completionCheckScript -match "evaluateCoverageMatrix" -and $coverageMatrixScript -match "Coverage item evidence" -and $handoffPackScript -match "Coverage Matrix" },
    @{ Name = "Handoff pack includes soft Stall Guard"; Pass = $handoffPackScript -match "stall_guard" -and $handoffPackScript -match "hard_gate" -and $handoffPackScript -match "Use Stall Guard only" },
    @{ Name = "Verify script sanitizes markdown commands"; Pass = $verifyScript -match "sanitizeCommand" -and $verifyScript -match "markdown-wrapped command" },
    @{ Name = "Maestro support scripts exist"; Pass = $doctorScript -match "workflow_doctor" -and $completionCheckScript -match "workflow_completion_check" -and $statusScript -match "workflow_status" -and $handoffPackScript -match "workflow_handoff_pack" -and $finishFeatureScript -match "workflow_finish_feature" },
    @{ Name = "Finish feature script is unique completion exit"; Pass = $finishFeatureScript -match "COMPLETION_PROOF.json" -and $finishFeatureScript -match "finish-feature" -and $finishFeatureScript -match "status" -and $finishFeatureScript -match "verified" },
    @{ Name = "Status script rejects manifest-only verified"; Pass = $statusScript -match "manifest_verified_without_proof" -and $statusScript -match "finish-feature completion proof is missing" },
    @{ Name = "Handoff pack prevents worker drift"; Pass = $handoffPackScript -match "exactly one Feature" -and $handoffPackScript -match "Build/typecheck/lint passing is not completion" -and $handoffPackScript -match "finish-feature" },
    @{ Name = "Orchestration scripts exist"; Pass = $processScript -match "Workflow process completed" -and $continueScript -match "Feature gate passed" -and $verifyScript -match "Automated Verification Run" },
    @{ Name = "Script next-step prompts avoid maintainer npm script names"; Pass = -not ($processScript + $continueScript + $featureNewScript + $epicFeaturesScript -match "run epic:features|workflow:continue|npm run epic:|npm run feature:") },
    @{ Name = "Product automation scripts exist"; Pass = $contextPackScript -match "Context Pack" -and $productArtifactsScript -match "requirement-ledger.md" },
    @{ Name = "Maintainer package exposes core maintenance commands"; Pass = $package -match '"build"' -and $package -match '"check"' -and $package -match '"test"' -and $package -match '"setup:codex"' -and $package -match '"setup:claude"' },
    @{ Name = "Workflow scripts live in Skill layer"; Pass = $processScript -match "process.mjs" -or ((Test-Path (Join-Path $root "scripts/workflow/automation/process.mjs")) -and (Test-Path (Join-Path $root "scripts/workflow/feature/gate-feature.mjs")) -and (Test-Path (Join-Path $root "scripts/workflow/epic/gate-epic.mjs"))) },
    @{ Name = "USAGE.md documents UTF-8 terminal note"; Pass = $usage -match "OutputEncoding" -and $usage -match "UTF-8" }
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
Write-Host "Before implementation, run the Skill-owned Feature gate with --target <project-root>." -ForegroundColor Cyan
