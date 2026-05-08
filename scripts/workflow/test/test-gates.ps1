param()

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$featuresRoot = Join-Path $root "docs\features"
$epicsRoot = Join-Path $root "docs\epics"
$failFeature = Join-Path $featuresRoot "__tmp_gate_fail"
$passFeature = Join-Path $featuresRoot "__tmp_gate_pass"
$failEpic = Join-Path $epicsRoot "__tmp_epic_fail"
$passEpic = Join-Path $epicsRoot "__tmp_epic_pass"
$hydratedEpic = Join-Path $epicsRoot "__tmp_epic_hydrated"
$localizedStatusEpic = Join-Path $epicsRoot "__tmp_epic_localized_status"
$hydratedFeature = Join-Path $featuresRoot "__tmp_feature_hydrated"
$epicFeatureOne = Join-Path $featuresRoot "tmp-epic-feature-one"
$epicFeatureTwo = Join-Path $featuresRoot "tmp-epic-feature-two"

function RemoveIfExists($path) {
    if (Test-Path $path) {
        Remove-Item -LiteralPath $path -Recurse -Force
    }
}

function WriteUtf8($path, $lines) {
    $lines | Set-Content -LiteralPath $path -Encoding utf8
}

function RunGate($featurePath) {
    $output = & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\workflow\feature\gate-feature.ps1") -FeaturePath $featurePath -TargetRoot $root 2>&1
    $code = $LASTEXITCODE
    $output | ForEach-Object { Write-Host $_ }
    return $code
}

function RunEpicGate($epicPath) {
    $output = & powershell -ExecutionPolicy Bypass -File (Join-Path $root "scripts\workflow\epic\gate-epic.ps1") -EpicPath $epicPath -TargetRoot $root 2>&1
    $code = $LASTEXITCODE
    $output | ForEach-Object { Write-Host $_ }
    return $code
}

RemoveIfExists $failFeature
RemoveIfExists $passFeature
RemoveIfExists $failEpic
RemoveIfExists $passEpic
RemoveIfExists $hydratedEpic
RemoveIfExists $localizedStatusEpic
RemoveIfExists $hydratedFeature
RemoveIfExists $epicFeatureOne
RemoveIfExists $epicFeatureTwo

try {
    New-Item -ItemType Directory -Force -Path $failEpic | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "docs\workflow\templates\epic\00-source.md") -Destination (Join-Path $failEpic "00-source.md")

    $failEpicCode = RunEpicGate "docs/epics/__tmp_epic_fail"
    if ($failEpicCode -eq 0) {
        Write-Host "Gate regression failed: incomplete epic package passed." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path $passEpic | Out-Null
    WriteUtf8 (Join-Path $passEpic "00-source.md") @("# Source", "", "Original product iteration material preserved here with enough detail for breakdown.")
    WriteUtf8 (Join-Path $passEpic "01-epic-brief.md") @("# Epic Brief", "", "- 状态：Ready for Breakdown", "- Epic Status: Ready for Breakdown", "", "Goal is clear.")
    WriteUtf8 (Join-Path $passEpic "02-requirement-inventory.md") @("# Requirement Inventory", "", "| Epic Req ID | 标题 | 模块 | 风险 | 建议 Feature | 状态 |", "| --- | --- | --- | --- | --- | --- |", "| EREQ-001 | Demo | UI | Low | demo-feature | Ready |")
    WriteUtf8 (Join-Path $passEpic "03-scope-breakdown.md") @("# Scope Breakdown", "", "| Feature ID | 来源需求 | 目标 | 风险 | 依赖 |", "| --- | --- | --- | --- | --- |", "| demo-feature | EREQ-001 | Demo | Low | none |")
    WriteUtf8 (Join-Path $passEpic "04-risk-map.md") @("# Risk Map", "", "| 风险 ID | 需求 | 风险等级 | 风险原因 | 缓解方式 |", "| --- | --- | --- | --- | --- |", "| RISK-001 | EREQ-001 | Low | UI only | Smoke test |")
    WriteUtf8 (Join-Path $passEpic "05-release-plan.md") @("# Release Plan", "", "## Batch 1", "", "- demo-feature")
    WriteUtf8 (Join-Path $passEpic "06-acceptance-map.md") @("# Acceptance Map", "", "| Epic Req ID | Feature ID | Feature 验收文件 | 验证状态 |", "| --- | --- | --- | --- |", "| EREQ-001 | demo-feature | docs/features/demo-feature/04-acceptance-criteria.md | Ready |")
    WriteUtf8 (Join-Path $passEpic "07-progress-board.md") @("# Progress Board", "", "| Feature ID | 批次 | 状态 | Gate | Verification |", "| --- | --- | --- | --- | --- |", "| demo-feature | Batch 1 | Ready | Pending | Pending |")

    $passEpicCode = RunEpicGate "docs/epics/__tmp_epic_pass"
    if ($passEpicCode -ne 0) {
        Write-Host "Gate regression failed: ready epic package did not pass." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path $hydratedEpic | Out-Null
    WriteUtf8 (Join-Path $hydratedEpic "00-source.md") @("# Source", "", "Original product iteration material preserved here with enough detail for hydrate regression testing. It includes multiple modules, risk, UI changes, and release sequencing.")
    & node (Join-Path $root "scripts\workflow\epic\hydrate-epic.mjs") "docs/epics/__tmp_epic_hydrated" --target $root --agent none | Out-Host
    WriteUtf8 (Join-Path $hydratedEpic "01-epic-brief.md") @("# Epic Brief", "", "- 状态：Ready for Breakdown", "- Epic Status: Ready for Breakdown", "", "Goal is clear.")
    WriteUtf8 (Join-Path $hydratedEpic "02-requirement-inventory.md") @("# Requirement Inventory", "", "| Epic Req ID | 鏍囬 | 妯″潡 | 椋庨櫓 | 寤鸿 Feature | 鐘舵€?|", "| --- | --- | --- | --- | --- | --- |", "| EREQ-001 | Demo | UI | Low | demo-feature | Ready |")
    WriteUtf8 (Join-Path $hydratedEpic "03-scope-breakdown.md") @("# Scope Breakdown", "", "| Feature ID | 鏉ユ簮闇€姹?| 鐩爣 | 椋庨櫓 | 渚濊禆 |", "| --- | --- | --- | --- | --- |", "| demo-feature | EREQ-001 | Demo | Low | none |")
    WriteUtf8 (Join-Path $hydratedEpic "04-risk-map.md") @("# Risk Map", "", "| 椋庨櫓 ID | 闇€姹?| 椋庨櫓绛夌骇 | 椋庨櫓鍘熷洜 | 缂撹В鏂瑰紡 |", "| --- | --- | --- | --- | --- |", "| RISK-001 | EREQ-001 | Low | UI only | Smoke test |")
    WriteUtf8 (Join-Path $hydratedEpic "05-release-plan.md") @("# Release Plan", "", "## Batch 1", "", "- demo-feature")
    WriteUtf8 (Join-Path $hydratedEpic "06-acceptance-map.md") @("# Acceptance Map", "", "| Epic Req ID | Feature ID | Feature 楠屾敹鏂囦欢 | 楠岃瘉鐘舵€?|", "| --- | --- | --- | --- |", "| EREQ-001 | demo-feature | docs/features/demo-feature/04-acceptance-criteria.md | Ready |")
    WriteUtf8 (Join-Path $hydratedEpic "07-progress-board.md") @("# Progress Board", "", "| Feature ID | 鎵规 | 鐘舵€?| Gate | Verification |", "| --- | --- | --- | --- | --- |", "| demo-feature | Batch 1 | Ready | Pending | Pending |")
    $hydratedEpicCode = RunEpicGate "docs/epics/__tmp_epic_hydrated"
    if ($hydratedEpicCode -eq 0) {
        Write-Host "Gate regression failed: hydrated draft epic package passed before review." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path $localizedStatusEpic | Out-Null
    WriteUtf8 (Join-Path $localizedStatusEpic "00-source.md") @("# Source", "", "Original product iteration material preserved here with enough detail for localized status regression testing.")
    WriteUtf8 (Join-Path $localizedStatusEpic "01-epic-brief.md") @("# Epic Brief", "", "- 状态：Ready for Breakdown", "", "Goal is clear.")
    WriteUtf8 (Join-Path $localizedStatusEpic "02-requirement-inventory.md") @("# Requirement Inventory", "", "| Epic Req ID | 标题 | 模块 | 风险 | 建议 Feature | 状态 |", "| --- | --- | --- | --- | --- | --- |", "| EREQ-001 | Demo | UI | Low | demo-feature | Ready |")
    WriteUtf8 (Join-Path $localizedStatusEpic "03-scope-breakdown.md") @("# Scope Breakdown", "", "| Feature ID | 来源需求 | 目标 | 风险 | 依赖 |", "| --- | --- | --- | --- | --- |", "| demo-feature | EREQ-001 | Demo | Low | none |")
    WriteUtf8 (Join-Path $localizedStatusEpic "04-risk-map.md") @("# Risk Map", "", "| 风险 ID | 需求 | 风险等级 | 风险原因 | 缓解方式 |", "| --- | --- | --- | --- | --- |", "| RISK-001 | EREQ-001 | Low | UI only | Smoke test |")
    WriteUtf8 (Join-Path $localizedStatusEpic "05-release-plan.md") @("# Release Plan", "", "## Batch 1", "", "- demo-feature")
    WriteUtf8 (Join-Path $localizedStatusEpic "06-acceptance-map.md") @("# Acceptance Map", "", "| Epic Req ID | Feature ID | Feature 验收文件 | 验证状态 |", "| --- | --- | --- | --- |", "| EREQ-001 | demo-feature | docs/features/demo-feature/04-acceptance-criteria.md | Ready |")
    WriteUtf8 (Join-Path $localizedStatusEpic "07-progress-board.md") @("# Progress Board", "", "| Feature ID | 批次 | 状态 | Gate | Verification |", "| --- | --- | --- | --- | --- |", "| demo-feature | Batch 1 | Ready | Pending | Pending |")
    $localizedStatusCode = RunEpicGate "docs/epics/__tmp_epic_localized_status"
    if ($localizedStatusCode -eq 0) {
        Write-Host "Gate regression failed: localized-only epic status passed without ASCII machine field." -ForegroundColor Red
        exit 1
    }

    & node (Join-Path $root "scripts\workflow\epic\create-features.mjs") "docs/epics/__tmp_epic_pass" --target $root --features tmp-epic-feature-one,tmp-epic-feature-two --stack next-fullstack --agent none | Out-Host
    foreach ($generatedFeature in @("tmp-epic-feature-one", "tmp-epic-feature-two")) {
        $generatedPath = Join-Path $featuresRoot $generatedFeature
        $expectedFiles = @("00-source.md", "01-prd.md", "02-ui-spec.md", "03-technical-contract.md", "04-acceptance-criteria.md", "05-readiness-review.md", "06-implementation-plan.md", "HYDRATION.md")
        foreach ($expectedFile in $expectedFiles) {
            if (-not (Test-Path (Join-Path $generatedPath $expectedFile))) {
                Write-Host "Gate regression failed: epic:features did not create $generatedFeature/$expectedFile." -ForegroundColor Red
                exit 1
            }
        }

        $generatedCode = RunGate "docs/features/$generatedFeature"
        if ($generatedCode -eq 0) {
            Write-Host "Gate regression failed: generated epic Feature draft passed before review." -ForegroundColor Red
            exit 1
        }
    }

    if (-not (Test-Path (Join-Path $passEpic "09-agent-plan.md"))) {
        Write-Host "Gate regression failed: epic:features did not create 09-agent-plan.md." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path $failFeature | Out-Null
    Copy-Item -LiteralPath (Join-Path $root "docs\workflow\templates\feature\01-prd.md") -Destination (Join-Path $failFeature "01-prd.md")

    $failCode = RunGate "docs/features/__tmp_gate_fail"
    if ($failCode -eq 0) {
        Write-Host "Gate regression failed: incomplete feature package passed." -ForegroundColor Red
        exit 1
    }

    New-Item -ItemType Directory -Force -Path $passFeature | Out-Null
    WriteUtf8 (Join-Path $passFeature "01-prd.md") @("# PRD", "", "REQ-DEMO-001 Demo ready requirement")
    WriteUtf8 (Join-Path $passFeature "02-ui-spec.md") @("# UI Spec", "", "UI-DEMO-001 Demo UI")
    WriteUtf8 (Join-Path $passFeature "03-technical-contract.md") @(
        "# Technical Contract",
        "",
        "- Stack Preset: next-fullstack",
        "- Project Mode: greenfield",
        "- Exception Reason: none",
        "- Legacy Baseline: none",
        "- Compatibility Contract: none",
        "",
        "- Next.js App Router: yes",
        "- Next.js Pages Router: no",
        "",
        "API-DEMO-001 Demo API"
    )
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

    New-Item -ItemType Directory -Force -Path $hydratedFeature | Out-Null
    WriteUtf8 (Join-Path $hydratedFeature "00-source.md") @("# Source", "", "Feature source material with enough detail for hydrate regression testing. It includes user goal, UI behavior, API boundary, and acceptance direction.")
    & node (Join-Path $root "scripts\workflow\feature\hydrate-feature.mjs") "docs/features/__tmp_feature_hydrated" --target $root --agent none | Out-Host
    WriteUtf8 (Join-Path $hydratedFeature "01-prd.md") @("# PRD", "", "REQ-DEMO-001 Demo ready requirement")
    WriteUtf8 (Join-Path $hydratedFeature "02-ui-spec.md") @("# UI Spec", "", "UI-DEMO-001 Demo UI")
    WriteUtf8 (Join-Path $hydratedFeature "03-technical-contract.md") @(
        "# Technical Contract",
        "",
        "- Stack Preset: next-fullstack",
        "- Project Mode: greenfield",
        "- Exception Reason: none",
        "- Legacy Baseline: none",
        "- Compatibility Contract: none",
        "",
        "- Next.js App Router: yes",
        "- Next.js Pages Router: no",
        "",
        "API-DEMO-001 Demo API"
    )
    WriteUtf8 (Join-Path $hydratedFeature "04-acceptance-criteria.md") @("# Acceptance", "", "AC-DEMO-001 covers REQ-DEMO-001")
    WriteUtf8 (Join-Path $hydratedFeature "05-readiness-review.md") @(
        "# Readiness Review",
        "",
        "- Readiness: Ready",
        "- Unresolved Questions: 0",
        "- Blocking Issues: 0",
        "- Assumptions Accepted: yes",
        "- User Approval: Approved",
        "- Implementation Plan Status: Approved"
    )
    WriteUtf8 (Join-Path $hydratedFeature "06-implementation-plan.md") @("# Implementation Plan", "", "Approved demo plan")
    $hydratedFeatureCode = RunGate "docs/features/__tmp_feature_hydrated"
    if ($hydratedFeatureCode -eq 0) {
        Write-Host "Gate regression failed: hydrated draft feature package passed before review." -ForegroundColor Red
        exit 1
    }

    $pagesFeature = Join-Path $featuresRoot "__tmp_gate_pages_router"
    RemoveIfExists $pagesFeature
    New-Item -ItemType Directory -Force -Path $pagesFeature | Out-Null
    WriteUtf8 (Join-Path $pagesFeature "01-prd.md") @("# PRD", "", "REQ-DEMO-001 Demo ready requirement")
    WriteUtf8 (Join-Path $pagesFeature "02-ui-spec.md") @("# UI Spec", "", "UI-DEMO-001 Demo UI")
    WriteUtf8 (Join-Path $pagesFeature "03-technical-contract.md") @(
        "# Technical Contract",
        "",
        "- Stack Preset: next-fullstack",
        "- Project Mode: greenfield",
        "- Exception Reason: none",
        "- Legacy Baseline: none",
        "- Compatibility Contract: none",
        "",
        "- Next.js App Router: no",
        "- Next.js Pages Router: yes",
        "",
        "API-DEMO-001 Demo API"
    )
    WriteUtf8 (Join-Path $pagesFeature "04-acceptance-criteria.md") @("# Acceptance", "", "AC-DEMO-001 covers REQ-DEMO-001")
    WriteUtf8 (Join-Path $pagesFeature "05-readiness-review.md") @(
        "# Readiness Review",
        "",
        "- Readiness: Ready",
        "- Unresolved Questions: 0",
        "- Blocking Issues: 0",
        "- Assumptions Accepted: yes",
        "- User Approval: Approved",
        "- Implementation Plan Status: Approved"
    )
    WriteUtf8 (Join-Path $pagesFeature "06-implementation-plan.md") @("# Implementation Plan", "", "Approved demo plan")

    $pagesCode = RunGate "docs/features/__tmp_gate_pages_router"
    if ($pagesCode -eq 0) {
        Write-Host "Gate regression failed: next-fullstack Pages Router package passed." -ForegroundColor Red
        exit 1
    }

    Write-Host "Gate regression tests passed." -ForegroundColor Green
}
finally {
    RemoveIfExists $failFeature
    RemoveIfExists $passFeature
    RemoveIfExists (Join-Path $featuresRoot "__tmp_gate_pages_router")
    RemoveIfExists $hydratedFeature
    RemoveIfExists $failEpic
    RemoveIfExists $passEpic
    RemoveIfExists $hydratedEpic
    RemoveIfExists $localizedStatusEpic
    RemoveIfExists $epicFeatureOne
    RemoveIfExists $epicFeatureTwo
}

exit 0
