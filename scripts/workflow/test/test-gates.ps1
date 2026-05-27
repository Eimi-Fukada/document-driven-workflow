param()

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$featuresRoot = Join-Path $root "docs\features"
$epicsRoot = Join-Path $root "docs\epics"
$tmpPaths = @(
    (Join-Path $featuresRoot "__tmp_gate_fail"),
    (Join-Path $featuresRoot "__tmp_gate_pass"),
    (Join-Path $featuresRoot "__tmp_feature_hydrated"),
    (Join-Path $featuresRoot "__tmp_light_feature_pass"),
    (Join-Path $featuresRoot "__tmp_light_feature_fail"),
    (Join-Path $featuresRoot "__tmp_light_feature_legacy"),
    (Join-Path $featuresRoot "__tmp_approval_feature"),
    (Join-Path $featuresRoot "__tmp_gate_pages_router"),
    (Join-Path $featuresRoot "__tmp_performance_feature"),
    (Join-Path $featuresRoot "__tmp_coverage_feature"),
    (Join-Path $featuresRoot "__tmp_fake_verified"),
    (Join-Path $featuresRoot "tmp-new-feature-docs"),
    (Join-Path $featuresRoot "tmp-process-feature"),
    (Join-Path $featuresRoot "tmp-epic-feature-one"),
    (Join-Path $featuresRoot "tmp-epic-feature-two"),
    (Join-Path $epicsRoot "__tmp_epic_fail"),
    (Join-Path $epicsRoot "__tmp_epic_pass"),
    (Join-Path $epicsRoot "__tmp_epic_hydrated"),
    (Join-Path $root "docs\__tmp_route_source.md"),
    (Join-Path $root "docs\__tmp_process_source.md"),
    (Join-Path $root "docs\workflow\ROUTING_REVIEW.md"),
    (Join-Path $root "docs\workflow\__tmp_routing_review.md"),
    (Join-Path $root "docs\workflow\DOCTOR_REPORT.md"),
    (Join-Path $root "docs\workflow\STATUS_REPORT.md"),
    (Join-Path $root "docs\product")
)

function RemoveIfExists($path) {
    if (Test-Path $path) {
        Remove-Item -LiteralPath $path -Recurse -Force
    }
}

function WriteUtf8($path, $lines) {
    $parent = Split-Path -Parent $path
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    $lines | Set-Content -LiteralPath $path -Encoding utf8
}

function WriteManifest($dir, $type, $mode, $id, $stack = "next-fullstack", $approval = "approved") {
    $readiness = if ($approval -eq "pending") { "not_ready" } else { "ready" }
    $assumptions = if ($approval -eq "pending") { "false" } else { "true" }
    $routeDecision = if ($approval -eq "pending") { "ai_draft" } else { "user_confirmed" }
    $riskLevel = if ($mode -eq "light") { "low" } elseif ($mode -eq "strict") { "high" } else { "medium" }
    $expectedRuntime = if ($mode -eq "light") { "under_30m" } elseif ($mode -eq "epic") { "over_90m" } else { "30_90m" }
    $executionSlicing = if ($mode -eq "epic") { "required" } elseif ($mode -eq "strict") { "recommended" } else { "not_required" }
    WriteUtf8 (Join-Path $dir "00-workflow.yaml") @(
        "# Workflow Control",
        "schema_version: 1",
        "type: $type",
        "mode: $mode",
        "id: $id",
        "epic_id: none",
        "approval: $approval",
        "approval_source: none",
        "route_decision: $routeDecision",
        "risk_level: $riskLevel",
        "hard_risk_blockers: none",
        "expected_runtime: $expectedRuntime",
        "execution_slicing: $executionSlicing",
        "readiness: $readiness",
        "status: draft",
        "stack_preset: $stack",
        "unresolved_questions: 0",
        "blocking_issues: 0",
        "assumptions_accepted: $assumptions",
        "approved_by: user",
        "approved_at: test",
        "source_path: none"
    )
}

function ConvertJsonOutput($raw, $label) {
    $text = if ($raw -is [array]) { ($raw -join [Environment]::NewLine) } else { [string]$raw }
    $text = $text.Trim()
    if (-not $text.StartsWith("{")) {
        Write-Host "Gate regression failed: $label did not emit JSON as the first output." -ForegroundColor Red
        Write-Host $text -ForegroundColor Red
        exit 1
    }
    return $text | ConvertFrom-Json
}

function RunJsonNode($scriptRelativePath, $arguments, $label) {
    $raw = & node (Join-Path $root $scriptRelativePath) @arguments
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Gate regression failed: $label command exited with code $LASTEXITCODE." -ForegroundColor Red
        $raw | ForEach-Object { Write-Host $_ -ForegroundColor Red }
        exit 1
    }
    return ConvertJsonOutput $raw $label
}

function RunFeatureGate($featurePath) {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = & node (Join-Path $root "scripts\workflow\feature\gate-feature.mjs") $featurePath --target $root 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    $output | ForEach-Object { Write-Host $_ }
    return $code
}

function RunEpicGate($epicPath) {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = & node (Join-Path $root "scripts\workflow\epic\gate-epic.mjs") $epicPath --target $root 2>&1
    $code = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    $output | ForEach-Object { Write-Host $_ }
    return $code
}

function WriteReadyFeature($dir, $id, $stack = "next-fullstack", $pagesRouter = "no") {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    WriteManifest $dir "feature" "standard" $id $stack "approved"
    WriteUtf8 (Join-Path $dir "00-intake-review.md") @("# Requirement Intake Review", "", "## Clear Items", "", "- REQ-DEMO-001 is clear.", "", "## User Questions", "", "- none")
    WriteUtf8 (Join-Path $dir "01-prd.md") @("# PRD", "", "REQ-DEMO-001 Demo ready requirement")
    WriteUtf8 (Join-Path $dir "02-ui-spec.md") @("# UI Spec", "", "UI-DEMO-001 Demo UI")
    WriteUtf8 (Join-Path $dir "03-technical-contract.md") @(
        "# Technical Contract",
        "",
        "- Stack Preset: $stack",
        "- Project Mode: greenfield",
        "- Exception Reason: demo exception when needed",
        "- Legacy Baseline: none",
        "- Compatibility Contract: none",
        "",
        "- Next.js App Router: yes",
        "- Next.js Pages Router: $pagesRouter",
        "",
        "API-DEMO-001 Demo API"
    )
    WriteUtf8 (Join-Path $dir "04-acceptance-criteria.md") @("# Acceptance", "", "AC-DEMO-001 covers REQ-DEMO-001")
    WriteUtf8 (Join-Path $dir "05-readiness-review.md") @("# Readiness Review", "", "Ready for user-approved development.")
    WriteUtf8 (Join-Path $dir "06-implementation-plan.md") @(
        "# Implementation Plan",
        "",
        "Demo plan",
        "",
        "## Scope Lock",
        "",
        "- Approved requirement IDs: REQ-DEMO-001",
        "- Approved acceptance IDs: AC-DEMO-001",
        "",
        "## TDD / Debugging Triggers",
        "",
        "- TDD required: no",
        "- Debugging required: no",
        "",
        "## Option Decision",
        "",
        "- Selected option: direct implementation",
        "- User decision recorded: not-applicable",
        "- ADR required: no",
        "",
        "## Performance Plan",
        "",
        "- Performance risk: not-applicable",
        "- Risk trigger: none",
        "- Verification command or manual check: smoke",
        "",
        "## Closure Advisory",
        "",
        "- Closure risk: no",
        "- User warning: none",
        "- Required document update: none",
        "",
        "## Maintainability Plan",
        "",
        "- Reuse check: if any structure or logic appears 2 or more times, consider extraction.",
        "",
        "## Stack Preset Implementation Rules",
        "",
        "- Stack Preset: $stack",
        "- Preset reference: docs/workflow/presets/$stack.md",
        "- Framework-specific constraints: use the selected preset",
        "- Styling / UI rules: follow the selected preset",
        "- API / data access rules: follow the selected preset",
        "- Client state / effect rules: avoid unnecessary state and effect loops",
        "- Backend query rules: use bounded queries and pagination",
        "- Rendering / cache strategy: use request-safe defaults",
        "- Form / mutation / auth boundary: validate on the server",
        "- Library choices: use existing project libraries; no new dependency",
        "- Bundle / client JS impact: no meaningful increase",
        "- Test rules: follow the selected preset",
        "- Exception reason: none",
        "",
        "## Self Review Checklist",
        "",
        "- Requirement coverage: yes"
    )
    WriteUtf8 (Join-Path $dir "08-context-pack.md") @(
        "# Context Pack",
        "",
        "## Requirement IDs",
        "",
        "- REQ-DEMO-001",
        "",
        "## Acceptance IDs",
        "",
        "- AC-DEMO-001",
        "",
        "## Scope Lock",
        "",
        "- Approved requirement IDs: REQ-DEMO-001",
        "- Approved acceptance IDs: AC-DEMO-001",
        "",
        "## Execution Discipline",
        "",
        "- TDD required: no",
        "- Debugging required: no",
        "- Self review required: yes",
        "",
        "## Maintainability Guardrails",
        "",
        "- Reuse threshold: consider extraction when structure or logic appears 2 or more times",
        "- Max single-file size: 1000 lines",
        "",
        "## Stack Preset Guardrails",
        "",
        "- Stack Preset: $stack",
        "- Preset reference: docs/workflow/presets/$stack.md",
        "- Framework-specific constraints: use the selected preset",
        "- Styling / UI rules: follow Tailwind CSS and App Router rules when next-fullstack",
        "- API / data access rules: follow the selected preset",
        "- Client state / effect rules: avoid unnecessary state and effect loops",
        "- Backend query rules: use bounded queries and pagination",
        "- Rendering / cache strategy: use request-safe defaults",
        "- Form / mutation / auth boundary: validate on the server",
        "- Library choices: use existing project libraries; no new dependency",
        "- Bundle / client JS impact: no meaningful increase",
        "- Test rules: follow the selected preset",
        "- Exception reason: none",
        "",
        "## Performance Guardrails",
        "",
        "- Performance risk: not-applicable",
        "- Risk trigger: none",
        "- Required mitigation: none",
        "- Verification required: smoke",
        "",
        "## Option And Closure Notes",
        "",
        "- Selected option: direct implementation",
        "- Option tradeoff: none",
        "- Closure risk: no",
        "- User warning: none",
        "- Required document update: none",
        "",
        "## Test Commands",
        "",
        "- Typecheck: npm run typecheck"
    )
}

function WriteReadyEpic($dir, $id, $approval = "approved") {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    WriteManifest $dir "epic" "epic" $id "none" $approval
    WriteUtf8 (Join-Path $dir "00-source.md") @("# Source", "", "Original product iteration material preserved here with enough detail for breakdown and regression testing.")
    WriteUtf8 (Join-Path $dir "01-epic-brief.md") @("# Epic Brief", "", "Goal is clear.")
    WriteUtf8 (Join-Path $dir "02-requirement-inventory.md") @("# Requirement Inventory", "", "| Epic Req ID | Title | Module | Risk | Suggested Feature | Status |", "| --- | --- | --- | --- | --- | --- |", "| EREQ-001 | Demo | UI | Low | demo-feature | Ready |")
    WriteUtf8 (Join-Path $dir "03-scope-breakdown.md") @("# Scope Breakdown", "", "| Feature ID | Source Requirement | Goal | Risk | Dependency |", "| --- | --- | --- | --- | --- |", "| demo-feature | EREQ-001 | Demo | Low | none |")
    WriteUtf8 (Join-Path $dir "04-risk-map.md") @("# Risk Map", "", "| Risk ID | Requirement | Level | Cause | Mitigation |", "| --- | --- | --- | --- | --- |", "| RISK-001 | EREQ-001 | Low | UI only | Smoke test |")
    WriteUtf8 (Join-Path $dir "05-release-plan.md") @("# Release Plan", "", "## Batch 1", "", "- demo-feature")
    WriteUtf8 (Join-Path $dir "06-acceptance-map.md") @("# Acceptance Map", "", "| Epic Req ID | Feature ID | Feature Acceptance File | Verification Status |", "| --- | --- | --- | --- |", "| EREQ-001 | demo-feature | docs/features/demo-feature/04-acceptance-criteria.md | Ready |")
    WriteUtf8 (Join-Path $dir "07-progress-board.md") @("# Progress Board", "", "| Feature ID | Batch | Status | Gate | Verification |", "| --- | --- | --- | --- | --- |", "| demo-feature | Batch 1 | Ready | Pending | Pending |")
}

$tmpPaths | ForEach-Object { RemoveIfExists $_ }

try {
    & node (Join-Path $root "scripts\workflow\product\init-product.mjs") --target $root | Out-Host
    if (-not (Test-Path (Join-Path $root "docs\product\requirement-ledger.md")) -or -not (Test-Path (Join-Path $root "docs\product\traceability.md"))) {
        Write-Host "Gate regression failed: product init did not create product traceability files." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\feature\new-feature.mjs") "tmp-new-feature-docs" --target $root --stack next-fullstack | Out-Host
    foreach ($expectedFile in @("00-workflow.yaml", "00-intake-review.md", "01-prd.md", "08-context-pack.md")) {
        if (-not (Test-Path (Join-Path $featuresRoot "tmp-new-feature-docs\$expectedFile"))) {
            Write-Host "Gate regression failed: feature:new did not create $expectedFile." -ForegroundColor Red
            exit 1
        }
    }
    $ledgerAfterNewFeature = Get-Content -LiteralPath (Join-Path $root "docs\product\requirement-ledger.md") -Raw -Encoding utf8
    if ($ledgerAfterNewFeature -notmatch "tmp-new-feature-docs") {
        Write-Host "Gate regression failed: feature:new did not register product ledger." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path (Join-Path $epicsRoot "__tmp_epic_fail") | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "docs\workflow\templates\epic\00-source.md") -Destination (Join-Path $epicsRoot "__tmp_epic_fail\00-source.md")
    if ((RunEpicGate "docs/epics/__tmp_epic_fail") -eq 0) {
        Write-Host "Gate regression failed: incomplete epic package passed." -ForegroundColor Red
        exit 1
    }

    $passEpic = Join-Path $epicsRoot "__tmp_epic_pass"
    WriteReadyEpic $passEpic "__tmp_epic_pass" "approved"
    if ((RunEpicGate "docs/epics/__tmp_epic_pass") -ne 0) {
        Write-Host "Gate regression failed: ready epic package did not pass." -ForegroundColor Red
        exit 1
    }

    $hydratedEpic = Join-Path $epicsRoot "__tmp_epic_hydrated"
    New-Item -ItemType Directory -Force -Path $hydratedEpic | Out-Null
    WriteUtf8 (Join-Path $hydratedEpic "00-source.md") @("# Source", "", "Original product iteration material preserved here with enough detail for hydrate regression testing.")
    & node (Join-Path $root "scripts\workflow\epic\hydrate-epic.mjs") "docs/epics/__tmp_epic_hydrated" --target $root --agent none | Out-Host
    if ((RunEpicGate "docs/epics/__tmp_epic_hydrated") -eq 0) {
        Write-Host "Gate regression failed: hydrated draft epic package passed before approval." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\epic\create-features.mjs") "docs/epics/__tmp_epic_pass" --target $root --features tmp-epic-feature-one,tmp-epic-feature-two --stack next-fullstack --agent none | Out-Host
    foreach ($generatedFeature in @("tmp-epic-feature-one", "tmp-epic-feature-two")) {
        $generatedPath = Join-Path $featuresRoot $generatedFeature
        $expectedFiles = @("00-workflow.yaml", "00-source.md", "00-intake-review.md", "01-prd.md", "02-ui-spec.md", "03-technical-contract.md", "04-acceptance-criteria.md", "05-readiness-review.md", "06-implementation-plan.md", "08-context-pack.md")
        foreach ($expectedFile in $expectedFiles) {
            if (-not (Test-Path (Join-Path $generatedPath $expectedFile))) {
                Write-Host "Gate regression failed: epic:features did not create $generatedFeature/$expectedFile." -ForegroundColor Red
                exit 1
            }
        }
        if ((RunFeatureGate "docs/features/$generatedFeature") -eq 0) {
            Write-Host "Gate regression failed: generated template feature passed before concrete REQ/AC hydration." -ForegroundColor Red
            exit 1
        }
        WriteUtf8 (Join-Path $generatedPath "01-prd.md") @("# PRD", "", "REQ-GENERATED-001 Demo ready requirement")
        WriteUtf8 (Join-Path $generatedPath "04-acceptance-criteria.md") @("# Acceptance", "", "AC-GENERATED-001 covers REQ-GENERATED-001")
        WriteUtf8 (Join-Path $generatedPath "06-implementation-plan.md") @(
            "# Implementation Plan",
            "",
            "## Scope Lock",
            "",
            "- Approved requirement IDs: REQ-GENERATED-001",
            "- Approved acceptance IDs: AC-GENERATED-001",
            "",
            "## TDD / Debugging Triggers",
            "",
            "- TDD required: no",
            "- Debugging required: no",
            "",
            "## Option Decision",
            "",
            "- Selected option: direct implementation",
            "- User decision recorded: not-applicable",
            "- ADR required: no",
            "",
            "## Performance Plan",
            "",
            "- Performance risk: not-applicable",
            "- Risk trigger: none",
            "- Verification command or manual check: smoke",
            "",
            "## Closure Advisory",
            "",
            "- Closure risk: no",
            "- User warning: none",
            "- Required document update: none",
            "",
            "## Maintainability Plan",
            "",
            "- Reuse check: if any structure or logic appears 2 or more times, consider extraction.",
            "",
            "## Stack Preset Implementation Rules",
            "",
            "- Stack Preset: next-fullstack",
            "- Preset reference: docs/workflow/presets/next-fullstack.md",
            "- Framework-specific constraints: use App Router",
            "- Styling / UI rules: use Tailwind CSS unless an exception is documented",
            "- API / data access rules: follow the selected preset",
            "- Client state / effect rules: avoid unnecessary state and effect loops",
            "- Backend query rules: use bounded queries and pagination",
            "- Rendering / cache strategy: use request-safe defaults",
            "- Form / mutation / auth boundary: validate on the server",
            "- Library choices: use existing project libraries; no new dependency",
            "- Bundle / client JS impact: no meaningful increase",
            "- Test rules: follow the selected preset",
            "- Exception reason: none",
            "",
            "## Self Review Checklist",
            "",
            "- Requirement coverage: yes"
        )
        WriteUtf8 (Join-Path $generatedPath "08-context-pack.md") @(
            "# Context Pack",
            "",
            "## Requirement IDs",
            "",
            "- REQ-GENERATED-001",
            "",
            "## Acceptance IDs",
            "",
            "- AC-GENERATED-001",
            "",
            "## Scope Lock",
            "",
            "- Approved requirement IDs: REQ-GENERATED-001",
            "- Approved acceptance IDs: AC-GENERATED-001",
            "",
            "## Execution Discipline",
            "",
            "- TDD required: no",
            "- Debugging required: no",
            "- Self review required: yes",
            "",
            "## Maintainability Guardrails",
            "",
            "- Reuse threshold: consider extraction when structure or logic appears 2 or more times",
            "- Max single-file size: 1000 lines",
            "",
            "## Stack Preset Guardrails",
            "",
            "- Stack Preset: next-fullstack",
            "- Preset reference: docs/workflow/presets/next-fullstack.md",
            "- Framework-specific constraints: use App Router",
            "- Styling / UI rules: use Tailwind CSS unless an exception is documented",
            "- API / data access rules: follow the selected preset",
            "- Client state / effect rules: avoid unnecessary state and effect loops",
            "- Backend query rules: use bounded queries and pagination",
            "- Rendering / cache strategy: use request-safe defaults",
            "- Form / mutation / auth boundary: validate on the server",
            "- Library choices: use existing project libraries; no new dependency",
            "- Bundle / client JS impact: no meaningful increase",
            "- Test rules: follow the selected preset",
            "- Exception reason: none",
            "",
            "## Performance Guardrails",
            "",
            "- Performance risk: not-applicable",
            "- Risk trigger: none",
            "- Required mitigation: none",
            "- Verification required: smoke",
            "",
            "## Option And Closure Notes",
            "",
            "- Selected option: direct implementation",
            "- Option tradeoff: none",
            "- Closure risk: no",
            "- User warning: none",
            "- Required document update: none",
            "",
            "## Test Commands",
            "",
            "- Typecheck: npm run typecheck"
        )
        $generatedManifestPath = Join-Path $generatedPath "00-workflow.yaml"
        $generatedManifest = Get-Content -LiteralPath $generatedManifestPath -Raw -Encoding utf8
        if ($generatedManifest -notmatch "approval: inherited" -or $generatedManifest -notmatch "route_decision: ai_draft") {
            Write-Host "Gate regression failed: generated Feature should inherit Epic approval but still require user route confirmation." -ForegroundColor Red
            exit 1
        }
        if ((RunFeatureGate "docs/features/$generatedFeature") -eq 0) {
            Write-Host "Gate regression failed: generated Feature passed before user route confirmation." -ForegroundColor Red
            exit 1
        }
        $generatedManifest = $generatedManifest -replace "route_decision: ai_draft", "route_decision: user_confirmed"
        Set-Content -LiteralPath $generatedManifestPath -Value $generatedManifest -Encoding utf8
        if ((RunFeatureGate "docs/features/$generatedFeature") -ne 0) {
            Write-Host "Gate regression failed: generated feature with inherited Epic approval did not pass after concrete REQ/AC hydration." -ForegroundColor Red
            exit 1
        }
    }
    $traceAfterGeneratedFeatures = Get-Content -LiteralPath (Join-Path $root "docs\product\traceability.md") -Raw -Encoding utf8
    if ($traceAfterGeneratedFeatures -notmatch "tmp-epic-feature-one" -or $traceAfterGeneratedFeatures -notmatch "tmp-epic-feature-two") {
        Write-Host "Gate regression failed: epic:features did not register generated Features in traceability." -ForegroundColor Red
        exit 1
    }

    $failFeature = Join-Path $featuresRoot "__tmp_gate_fail"
    New-Item -ItemType Directory -Force -Path $failFeature | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "docs\workflow\templates\feature\01-prd.md") -Destination (Join-Path $failFeature "01-prd.md")
    if ((RunFeatureGate "docs/features/__tmp_gate_fail") -eq 0) {
        Write-Host "Gate regression failed: incomplete feature package passed." -ForegroundColor Red
        exit 1
    }

    $passFeature = Join-Path $featuresRoot "__tmp_gate_pass"
    WriteReadyFeature $passFeature "__tmp_gate_pass"
    if ((RunFeatureGate "docs/features/__tmp_gate_pass") -ne 0) {
        Write-Host "Gate regression failed: ready feature package did not pass." -ForegroundColor Red
        exit 1
    }

    $hydratedFeature = Join-Path $featuresRoot "__tmp_feature_hydrated"
    New-Item -ItemType Directory -Force -Path $hydratedFeature | Out-Null
    WriteUtf8 (Join-Path $hydratedFeature "00-source.md") @("# Source", "", "Feature source material with enough detail for hydrate regression testing.")
    & node (Join-Path $root "scripts\workflow\feature\hydrate-feature.mjs") "docs/features/__tmp_feature_hydrated" --target $root --agent none | Out-Host
    if ((RunFeatureGate "docs/features/__tmp_feature_hydrated") -eq 0) {
        Write-Host "Gate regression failed: hydrated draft feature package passed before approval." -ForegroundColor Red
        exit 1
    }

    $lightPassFeature = Join-Path $featuresRoot "__tmp_light_feature_pass"
    New-Item -ItemType Directory -Force -Path $lightPassFeature | Out-Null
    WriteManifest $lightPassFeature "feature" "light" "__tmp_light_feature_pass" "next-fullstack" "approved"
    WriteUtf8 (Join-Path $lightPassFeature "01-light-feature.md") @(
        "# Light Feature Brief",
        "",
        "- Feature ID: __tmp_light_feature_pass",
        "- Stack Preset: next-fullstack",
        "",
        "REQ-LIGHT-001 Demo light requirement",
        "AC-LIGHT-001 covers REQ-LIGHT-001",
        "",
        "- Next.js App Router: yes",
        "- Next.js Pages Router: no"
    )
    if ((RunFeatureGate "docs/features/__tmp_light_feature_pass") -ne 0) {
        Write-Host "Gate regression failed: ready light feature did not pass." -ForegroundColor Red
        exit 1
    }

    $lightFailFeature = Join-Path $featuresRoot "__tmp_light_feature_fail"
    New-Item -ItemType Directory -Force -Path $lightFailFeature | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "docs\workflow\templates\feature\01-light-feature.md") -Destination (Join-Path $lightFailFeature "01-light-feature.md")
    if ((RunFeatureGate "docs/features/__tmp_light_feature_fail") -eq 0) {
        Write-Host "Gate regression failed: draft light feature passed." -ForegroundColor Red
        exit 1
    }

    $lightLegacyFeature = Join-Path $featuresRoot "__tmp_light_feature_legacy"
    New-Item -ItemType Directory -Force -Path $lightLegacyFeature | Out-Null
    WriteManifest $lightLegacyFeature "feature" "light" "__tmp_light_feature_legacy" "legacy-existing" "approved"
    WriteUtf8 (Join-Path $lightLegacyFeature "01-light-feature.md") @("# Light Feature Brief", "", "REQ-LIGHT-001 Demo", "AC-LIGHT-001 covers REQ-LIGHT-001")
    if ((RunFeatureGate "docs/features/__tmp_light_feature_legacy") -eq 0) {
        Write-Host "Gate regression failed: legacy light feature passed." -ForegroundColor Red
        exit 1
    }

    WriteUtf8 (Join-Path $root "docs\__tmp_route_source.md") @("# Requirement", "", "Change the button copy on one screen. No API, auth, payment, database, or deployment impact.")
    & node (Join-Path $root "scripts\workflow\automation\route.mjs") --source "docs/__tmp_route_source.md" --target $root --output "docs/workflow/__tmp_routing_review.md" --agent none | Out-Host
    if (-not (Test-Path (Join-Path $root "docs\workflow\__tmp_routing_review.md"))) {
        Write-Host "Gate regression failed: workflow:route did not create routing review." -ForegroundColor Red
        exit 1
    }

    $approvalFeature = Join-Path $featuresRoot "__tmp_approval_feature"
    New-Item -ItemType Directory -Force -Path $approvalFeature | Out-Null
    WriteManifest $approvalFeature "feature" "light" "__tmp_approval_feature" "next-fullstack" "pending"
    WriteUtf8 (Join-Path $approvalFeature "01-light-feature.md") @("# Light Feature Brief", "", "REQ-LIGHT-001 Demo", "AC-LIGHT-001 covers REQ-LIGHT-001", "- Next.js App Router: yes", "- Next.js Pages Router: no")
    & node (Join-Path $root "scripts\workflow\automation\approval-review.mjs") "docs/features/__tmp_approval_feature" --target $root | Out-Host
    if (-not (Test-Path (Join-Path $approvalFeature "APPROVAL_REVIEW.md"))) {
        Write-Host "Gate regression failed: approval review was not created." -ForegroundColor Red
        exit 1
    }

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & node (Join-Path $root "scripts\workflow\automation\approve.mjs") "docs/features/__tmp_approval_feature" --target $root *> $null
    $approveWithoutUserCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    if ($approveWithoutUserCode -eq 0) {
        Write-Host "Gate regression failed: approve passed without --user-approved." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\automation\approve.mjs") "docs/features/__tmp_approval_feature" --target $root --user-approved | Out-Host
    $approvedManifest = Get-Content -LiteralPath (Join-Path $approvalFeature "00-workflow.yaml") -Raw -Encoding utf8
    if ($approvedManifest -notmatch "approval:\s*approved" -or $approvedManifest -notmatch "readiness:\s*ready") {
        Write-Host "Gate regression failed: approve did not update the manifest." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\automation\context-pack.mjs") "docs/features/__tmp_gate_pass" --target $root --force | Out-Host
    $contextPack = Get-Content -LiteralPath (Join-Path $passFeature "08-context-pack.md") -Raw -Encoding utf8
    if ($contextPack -notmatch "REQ-DEMO-001" -or $contextPack -notmatch "Test Commands" -or $contextPack -notmatch "Execution Discipline" -or $contextPack -notmatch "Maintainability Guardrails" -or $contextPack -notmatch "Performance Guardrails" -or $contextPack -notmatch "Option And Closure Notes") {
        Write-Host "Gate regression failed: context-pack did not include requirements, execution discipline, maintainability, performance, and closure guardrails." -ForegroundColor Red
        exit 1
    }

    WriteUtf8 (Join-Path $root "docs\__tmp_process_source.md") @("# Requirement", "", "Add a clear low risk copy update to one button. No auth, payment, database, deployment, or migration impact.")
    & node (Join-Path $root "scripts\workflow\automation\process.mjs") --source "docs/__tmp_process_source.md" --target $root --id "tmp-process-feature" --mode standard --stack next-fullstack --agent none | Out-Host
    $processFeature = Join-Path $featuresRoot "tmp-process-feature"
    foreach ($expectedFile in @("00-workflow.yaml", "00-source.md", "00-intake-review.md", "01-prd.md", "08-context-pack.md", "APPROVAL_REVIEW.md")) {
        if (-not (Test-Path (Join-Path $processFeature $expectedFile))) {
            Write-Host "Gate regression failed: workflow:process did not create tmp-process-feature/$expectedFile." -ForegroundColor Red
            exit 1
        }
    }

    WriteReadyFeature $processFeature "tmp-process-feature"
    & node (Join-Path $root "scripts\workflow\automation\continue.mjs") "docs/features/tmp-process-feature" --target $root --user-approved | Out-Host
    $continuedManifest = Get-Content -LiteralPath (Join-Path $processFeature "00-workflow.yaml") -Raw -Encoding utf8
    if ($continuedManifest -notmatch "approval:\s*approved" -or $continuedManifest -notmatch "readiness:\s*ready") {
        Write-Host "Gate regression failed: continue.mjs did not approve the Feature manifest." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\automation\verify.mjs") "docs/features/tmp-process-feature" --target $root --command "cmd /c echo workflow verify ok" | Out-Host
    $verificationReport = Get-Content -LiteralPath (Join-Path $processFeature "07-verification-report.md") -Raw -Encoding utf8
    if ($verificationReport -notmatch "Automated Verification Run" -or $verificationReport -notmatch "workflow verify ok") {
        Write-Host "Gate regression failed: workflow:verify did not append command evidence." -ForegroundColor Red
        exit 1
    }
    & node (Join-Path $root "scripts\workflow\automation\verify.mjs") "docs/features/tmp-process-feature" --target $root --command '`cmd /c echo workflow verify sanitized ok`' | Out-Host
    $verificationReport = Get-Content -LiteralPath (Join-Path $processFeature "07-verification-report.md") -Raw -Encoding utf8
    if ($verificationReport -notmatch "workflow verify sanitized ok" -or $verificationReport -notmatch "Sanitized from markdown-wrapped command") {
        Write-Host "Gate regression failed: workflow:verify did not sanitize markdown-wrapped command evidence." -ForegroundColor Red
        exit 1
    }
    WriteUtf8 (Join-Path $processFeature "07-verification-report.md") @(
        "# Verification Report",
        "",
        "## Basic Info",
        "",
        "- Result: Passed",
        "",
        "## Requirement Trace",
        "",
        "| Requirement ID | Acceptance ID | Implementation Evidence | Test Evidence | Result |",
        "| --- | --- | --- | --- | --- |",
        "| REQ-DEMO-001 | AC-DEMO-001 | src/demo.ts | workflow verify ok | Passed |",
        "",
        "## Scope Lock Review",
        "",
        "- Approved scope followed: yes",
        "- Forbidden scope untouched: yes",
        "- Allowed files / modules followed: yes",
        "- Non-goals preserved: yes",
        "- Compatibility constraints preserved: yes",
        "",
        "## Changed Files",
        "",
        "| File | Purpose | Requirement IDs |",
        "| --- | --- | --- |",
        "| src/demo.ts | Demo implementation | REQ-DEMO-001 |",
        "",
        "## Commands Run",
        "",
        '```bash',
        "cmd /c echo workflow verify ok",
        '```',
        "",
        "## Verification Results",
        "",
        "- Unit: Passed for AC-DEMO-001",
        "",
        "## Product Traceability Update",
        "",
        '- Updated `docs/product/traceability.md`: not-applicable',
        "- Snapshot created: not-applicable",
        "",
        "## Self Review",
        "",
        "- Requirement coverage checked: yes",
        "- Acceptance coverage checked: yes",
        "- Changed files mapped to requirements: yes",
        "- No unrelated refactor: yes",
        "- Forbidden scope untouched: yes",
        "- Allowed scope followed: yes",
        "- Maintainability guardrails checked: yes",
        "- Performance risk handled or marked not-applicable: yes",
        "- Option decision recorded when needed: yes",
        "- Closure risk reviewed: yes",
        "- Fresh verification evidence recorded: yes",
        "",
        "## Conclusion",
        "",
        "Ready to release: yes"
    )
    & node (Join-Path $root "scripts\workflow\automation\completion-check.mjs") "docs/features/tmp-process-feature" --target $root --changed-files "src/demo.ts" | Out-Host
    $completionReport = Get-Content -LiteralPath (Join-Path $processFeature "COMPLETION_CHECK.md") -Raw -Encoding utf8
    if ($completionReport -notmatch "Completion Check" -or $completionReport -notmatch "Result: PASS") {
        Write-Host "Gate regression failed: workflow:completion-check did not pass a fully evidenced feature." -ForegroundColor Red
        exit 1
    }
    $completionJson = RunJsonNode "scripts\workflow\automation\completion-check.mjs" @("docs/features/tmp-process-feature", "--target", $root, "--changed-files", "src/demo.ts", "--json") "workflow:completion-check --json"
    if ($completionJson.kind -ne "workflow_completion_check" -or $completionJson.result -ne "PASS" -or $completionJson.summary.checks -lt 1) {
        Write-Host "Gate regression failed: workflow:completion-check --json did not emit a passing machine-readable payload." -ForegroundColor Red
        exit 1
    }
    $manifestAfterCompletionCheck = Get-Content -LiteralPath (Join-Path $processFeature "00-workflow.yaml") -Raw -Encoding utf8
    if ($manifestAfterCompletionCheck -match "status: verified") {
        Write-Host "Gate regression failed: workflow:completion-check wrote verified status directly." -ForegroundColor Red
        exit 1
    }
    $finishJson = RunJsonNode "scripts\workflow\automation\finish-feature.mjs" @("docs/features/tmp-process-feature", "--target", $root, "--changed-files", "src/demo.ts", "--skip-verify", "--json") "workflow:finish-feature --json"
    if ($finishJson.kind -ne "workflow_finish_feature" -or $finishJson.result -ne "PASS" -or -not (Test-Path (Join-Path $processFeature "COMPLETION_PROOF.json"))) {
        Write-Host "Gate regression failed: workflow:finish-feature did not create completion proof." -ForegroundColor Red
        exit 1
    }
    $completionProof = Get-Content -LiteralPath (Join-Path $processFeature "COMPLETION_PROOF.json") -Raw -Encoding utf8 | ConvertFrom-Json
    if ($completionProof.kind -ne "workflow_completion_proof" -or $completionProof.result -ne "PASS") {
        Write-Host "Gate regression failed: workflow:finish-feature wrote invalid completion proof." -ForegroundColor Red
        exit 1
    }
    $manifestAfterFinish = Get-Content -LiteralPath (Join-Path $processFeature "00-workflow.yaml") -Raw -Encoding utf8
    if ($manifestAfterFinish -notmatch "status: verified") {
        Write-Host "Gate regression failed: workflow:finish-feature did not write verified status." -ForegroundColor Red
        exit 1
    }

    $performanceFeature = Join-Path $featuresRoot "__tmp_performance_feature"
    WriteReadyFeature $performanceFeature "__tmp_performance_feature"
    WriteUtf8 (Join-Path $performanceFeature "01-prd.md") @("# PRD", "", "REQ-DEMO-001 Demo ready requirement with large table pagination and long list rendering risk.")
    WriteUtf8 (Join-Path $performanceFeature "07-verification-report.md") @(
        "# Verification Report",
        "",
        "## Basic Info",
        "",
        "- Result: Passed",
        "",
        "## Requirement Trace",
        "",
        "| Requirement ID | Acceptance ID | Implementation Evidence | Test Evidence | Result |",
        "| --- | --- | --- | --- | --- |",
        "| REQ-DEMO-001 | AC-DEMO-001 | src/perf-demo.ts | workflow verify ok | Passed |",
        "",
        "## Changed Files",
        "",
        "| File | Purpose | Requirement IDs |",
        "| --- | --- | --- |",
        "| src/perf-demo.ts | Demo implementation | REQ-DEMO-001 |",
        "",
        "## Commands Run",
        "",
        '```bash',
        "cmd /c echo workflow verify ok",
        '```',
        "",
        "## Product Traceability Update",
        "",
        '- Updated `docs/product/traceability.md`: not-applicable',
        "",
        "## Self Review",
        "",
        "- Requirement coverage checked: yes",
        "- Acceptance coverage checked: yes",
        "- Changed files mapped to requirements: yes",
        "- No unrelated refactor: yes",
        "- Maintainability guardrails checked: yes",
        "- Performance risk handled or marked not-applicable: yes",
        "- Option decision recorded when needed: yes",
        "- Closure risk reviewed: yes",
        "- Fresh verification evidence recorded: yes",
        "",
        "## Conclusion",
        "",
        "Ready to release: yes"
    )
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & node (Join-Path $root "scripts\workflow\automation\completion-check.mjs") "docs/features/__tmp_performance_feature" --target $root --changed-files "src/perf-demo.ts" *> $null
    $performanceCheckCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    if ($performanceCheckCode -eq 0) {
        Write-Host "Gate regression failed: performance-risk feature passed without performance evidence." -ForegroundColor Red
        exit 1
    }

    $coverageFeature = Join-Path $featuresRoot "__tmp_coverage_feature"
    WriteReadyFeature $coverageFeature "__tmp_coverage_feature"
    WriteUtf8 (Join-Path $coverageFeature "04-acceptance-criteria.md") @(
        "# Acceptance",
        "",
        "AC-DEMO-001 covers REQ-DEMO-001",
        "",
        "## Coverage Matrix",
        "",
        "- Coverage required: yes",
        "- Expected coverage items: 2",
        "- Execution pass recommendation: 3-5 coverage items when Expected coverage items is greater than 5",
        "",
        "| Coverage ID | Module / Item | Requirement ID | Acceptance ID | Notes |",
        "| --- | --- | --- | --- | --- |",
        "| COV-DEMO-001 | Module A | REQ-DEMO-001 | AC-DEMO-001 | state recovery |",
        "| COV-DEMO-002 | Module B | REQ-DEMO-001 | AC-DEMO-001 | state recovery |"
    )
    WriteUtf8 (Join-Path $coverageFeature "07-verification-report.md") @(
        "# Verification Report",
        "",
        "## Basic Info",
        "",
        "- Result: Passed",
        "",
        "## Requirement Trace",
        "",
        "| Requirement ID | Acceptance ID | Implementation Evidence | Test Evidence | Result |",
        "| --- | --- | --- | --- | --- |",
        "| REQ-DEMO-001 | AC-DEMO-001 | src/cov-a.ts, src/cov-b.ts | workflow verify ok | Passed |",
        "",
        "## Coverage Matrix Verification",
        "",
        "- Coverage required: yes",
        "- Expected coverage items: 2",
        "",
        "| Coverage ID | Module / Item | Requirement ID | Acceptance ID | Implementation Evidence | Verification Evidence | Status |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| COV-DEMO-001 | Module A | REQ-DEMO-001 | AC-DEMO-001 | src/cov-a.ts | workflow verify ok | Passed |",
        "",
        "## Changed Files",
        "",
        "| File | Purpose | Requirement IDs |",
        "| --- | --- | --- |",
        "| src/cov-a.ts | Module A implementation | REQ-DEMO-001 |",
        "| src/cov-b.ts | Module B implementation | REQ-DEMO-001 |",
        "",
        "## Commands Run",
        "",
        '```bash',
        "cmd /c echo workflow verify ok",
        '```',
        "",
        "## Product Traceability Update",
        "",
        '- Updated `docs/product/traceability.md`: not-applicable',
        "",
        "## Self Review",
        "",
        "- Requirement coverage checked: yes",
        "- Acceptance coverage checked: yes",
        "- Changed files mapped to requirements: yes",
        "- No unrelated refactor: yes",
        "- Maintainability guardrails checked: yes",
        "- Performance risk handled or marked not-applicable: yes",
        "- Option decision recorded when needed: yes",
        "- Closure risk reviewed: yes",
        "- Fresh verification evidence recorded: yes",
        "",
        "## Conclusion",
        "",
        "Ready to release: yes"
    )
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & node (Join-Path $root "scripts\workflow\automation\completion-check.mjs") "docs/features/__tmp_coverage_feature" --target $root --changed-files "src/cov-a.ts,src/cov-b.ts" *> $null
    $coverageCheckCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    if ($coverageCheckCode -eq 0) {
        Write-Host "Gate regression failed: coverage feature passed with a missing coverage row." -ForegroundColor Red
        exit 1
    }
    WriteUtf8 (Join-Path $coverageFeature "07-verification-report.md") @(
        "# Verification Report",
        "",
        "## Basic Info",
        "",
        "- Result: Passed",
        "",
        "## Requirement Trace",
        "",
        "| Requirement ID | Acceptance ID | Implementation Evidence | Test Evidence | Result |",
        "| --- | --- | --- | --- | --- |",
        "| REQ-DEMO-001 | AC-DEMO-001 | src/cov-a.ts, src/cov-b.ts | workflow verify ok | Passed |",
        "",
        "## Coverage Matrix Verification",
        "",
        "- Coverage required: yes",
        "- Expected coverage items: 2",
        "",
        "| Coverage ID | Module / Item | Requirement ID | Acceptance ID | Implementation Evidence | Verification Evidence | Status |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| COV-DEMO-001 | Module A | REQ-DEMO-001 | AC-DEMO-001 | src/cov-a.ts | workflow verify ok | Passed |",
        "| COV-DEMO-002 | Module B | REQ-DEMO-001 | AC-DEMO-001 | src/cov-b.ts | workflow verify ok | Passed |",
        "",
        "## Changed Files",
        "",
        "| File | Purpose | Requirement IDs |",
        "| --- | --- | --- |",
        "| src/cov-a.ts | Module A implementation | REQ-DEMO-001 |",
        "| src/cov-b.ts | Module B implementation | REQ-DEMO-001 |",
        "",
        "## Commands Run",
        "",
        '```bash',
        "cmd /c echo workflow verify ok",
        '```',
        "",
        "## Product Traceability Update",
        "",
        '- Updated `docs/product/traceability.md`: not-applicable',
        "",
        "## Self Review",
        "",
        "- Requirement coverage checked: yes",
        "- Acceptance coverage checked: yes",
        "- Changed files mapped to requirements: yes",
        "- No unrelated refactor: yes",
        "- Maintainability guardrails checked: yes",
        "- Performance risk handled or marked not-applicable: yes",
        "- Option decision recorded when needed: yes",
        "- Closure risk reviewed: yes",
        "- Fresh verification evidence recorded: yes",
        "",
        "## Conclusion",
        "",
        "Ready to release: yes"
    )
    $coverageJson = RunJsonNode "scripts\workflow\automation\completion-check.mjs" @("docs/features/__tmp_coverage_feature", "--target", $root, "--changed-files", "src/cov-a.ts,src/cov-b.ts", "--json") "workflow:completion-check coverage --json"
    if ($coverageJson.result -ne "PASS" -or $coverageJson.coverage.required -ne $true -or $coverageJson.coverage.expected_count -ne 2 -or $coverageJson.coverage.verified_count -ne 2) {
        Write-Host "Gate regression failed: coverage feature did not pass with full coverage evidence." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\automation\doctor.mjs") --target $root --host all --skip-install-check --skip-cli-check | Out-Host
    $doctorReport = Get-Content -LiteralPath (Join-Path $root "docs\workflow\DOCTOR_REPORT.md") -Raw -Encoding utf8
    if ($doctorReport -notmatch "Workflow Doctor Report" -or $doctorReport -notmatch "Result: PASS") {
        Write-Host "Gate regression failed: workflow:doctor did not generate a passing local report when install and CLI checks are skipped." -ForegroundColor Red
        exit 1
    }
    $doctorJson = RunJsonNode "scripts\workflow\automation\doctor.mjs" @("--target", $root, "--host", "all", "--skip-install-check", "--skip-cli-check", "--json") "workflow:doctor --json"
    if ($doctorJson.kind -ne "workflow_doctor" -or $doctorJson.result -ne "PASS" -or $doctorJson.summary.checks -lt 1) {
        Write-Host "Gate regression failed: workflow:doctor --json did not emit a passing machine-readable payload." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\automation\status.mjs") --target $root | Out-Host
    $statusReport = Get-Content -LiteralPath (Join-Path $root "docs\workflow\STATUS_REPORT.md") -Raw -Encoding utf8
    if ($statusReport -notmatch "Workflow Status Report" -or $statusReport -notmatch "tmp-process-feature") {
        Write-Host "Gate regression failed: workflow:status did not generate a useful status report." -ForegroundColor Red
        exit 1
    }
    $statusJson = RunJsonNode "scripts\workflow\automation\status.mjs" @("--target", $root, "--json") "workflow:status --json"
    if ($statusJson.kind -ne "workflow_status" -or $statusJson.result -ne "PASS" -or $statusJson.summary.features_total -lt 1) {
        Write-Host "Gate regression failed: workflow:status --json did not emit a machine-readable payload." -ForegroundColor Red
        exit 1
    }

    $fakeVerifiedFeature = Join-Path $featuresRoot "__tmp_fake_verified"
    WriteReadyFeature $fakeVerifiedFeature "__tmp_fake_verified"
    $fakeManifestPath = Join-Path $fakeVerifiedFeature "00-workflow.yaml"
    $fakeManifest = Get-Content -LiteralPath $fakeManifestPath -Raw -Encoding utf8
    $fakeManifest = $fakeManifest -replace "status: draft", "status: verified"
    Set-Content -LiteralPath $fakeManifestPath -Value $fakeManifest -Encoding utf8
    $statusJson = RunJsonNode "scripts\workflow\automation\status.mjs" @("--target", $root, "--json") "workflow:status fake verified --json"
    $fakeStatus = $statusJson.features | Where-Object { $_.id -eq "__tmp_fake_verified" } | Select-Object -First 1
    if (-not $fakeStatus -or $fakeStatus.verified -ne $false -or $fakeStatus.manifest_verified_without_proof -ne $true -or $fakeStatus.completion_proof_result -ne "missing") {
        Write-Host "Gate regression failed: workflow:status trusted manifest-only verified status." -ForegroundColor Red
        exit 1
    }

    $handoffJson = RunJsonNode "scripts\workflow\automation\handoff-pack.mjs" @("docs/features/tmp-process-feature", "--target", $root, "--json") "workflow:handoff-pack --json"
    if ($handoffJson.kind -ne "workflow_handoff_pack" -or $handoffJson.feature.id -ne "tmp-process-feature" -or -not (Test-Path (Join-Path $processFeature "HANDOFF_PACK.md")) -or -not (Test-Path (Join-Path $processFeature "handoff-pack.json"))) {
        Write-Host "Gate regression failed: workflow:handoff-pack did not generate handoff artifacts." -ForegroundColor Red
        exit 1
    }
    if (-not ($handoffJson.requirement_ids -contains "REQ-DEMO-001") -or -not ($handoffJson.acceptance_ids -contains "AC-DEMO-001")) {
        Write-Host "Gate regression failed: workflow:handoff-pack did not include requirement and acceptance IDs." -ForegroundColor Red
        exit 1
    }
    if ($handoffJson.codex_prompt -notmatch "exactly one Feature" -or $handoffJson.codex_prompt -notmatch "Build/typecheck/lint passing is not completion" -or $handoffJson.codex_prompt -notmatch "finish-feature" -or $handoffJson.codex_prompt -notmatch "Coverage Matrix" -or $handoffJson.codex_prompt -notmatch "Stall Guard") {
        Write-Host "Gate regression failed: workflow:handoff-pack did not include anti-drift worker guardrails." -ForegroundColor Red
        exit 1
    }
    if (-not $handoffJson.stall_guard -or $handoffJson.stall_guard.stall_threshold_minutes -ne 15 -or -not ($handoffJson.stall_guard.required_progress_fields -contains "current_req_ac_cov")) {
        Write-Host "Gate regression failed: workflow:handoff-pack did not include machine-readable Stall Guard." -ForegroundColor Red
        exit 1
    }
    if ($handoffJson.stall_guard.hard_gate -ne $false -or -not ($handoffJson.stall_guard.applies_to -contains "expected_feature_runtime_over_30_minutes")) {
        Write-Host "Gate regression failed: workflow:handoff-pack treated Stall Guard as a hard gate or missed trigger boundaries." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\automation\agent-plan.mjs") "docs/epics/__tmp_epic_pass" --target $root --features tmp-epic-feature-one,tmp-epic-feature-two --force | Out-Host
    $agentPlan = Get-Content -LiteralPath (Join-Path $passEpic "09-agent-plan.md") -Raw -Encoding utf8
    if ($agentPlan -notmatch "tmp-epic-feature-one" -or $agentPlan -notmatch "Assignment Matrix") {
        Write-Host "Gate regression failed: agent-plan did not include generated features." -ForegroundColor Red
        exit 1
    }

    $pagesFeature = Join-Path $featuresRoot "__tmp_gate_pages_router"
    WriteReadyFeature $pagesFeature "__tmp_gate_pages_router" "next-fullstack" "yes"
    if ((RunFeatureGate "docs/features/__tmp_gate_pages_router") -eq 0) {
        Write-Host "Gate regression failed: next-fullstack Pages Router package passed." -ForegroundColor Red
        exit 1
    }

    Write-Host "Gate regression tests passed." -ForegroundColor Green
}
finally {
    $tmpPaths | ForEach-Object { RemoveIfExists $_ }
}

exit 0
