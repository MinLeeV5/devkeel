#!/usr/bin/env bash
# Scenario: direct/lite/full routing, decision gates, and direct-to-lite upgrade.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../../lib"

source "$LIB_DIR/run-turn.sh"
source "$LIB_DIR/extract.sh"
source "$LIB_DIR/assert.sh"

echo "=== Scenario: workflow-routing ==="

change_count() {
  find "$FIXTURE_DIR/openspec/changes" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' '
}

assert_no_change_created() {
  local output_file="$1" expected_count="$2" label="$3"
  if extract_bash_commands "$output_file" | grep -q 'openspec new change'; then
    echo "  ❌ FAIL: $label unexpectedly created a change"
    FAILURES=$((FAILURES + 1))
  elif [ "$(change_count)" != "$expected_count" ]; then
    echo "  ❌ FAIL: $label changed the active change count"
    FAILURES=$((FAILURES + 1))
  else
    echo "  ✅ $label created no change"
  fi
}

# 1. Obvious current-session work stays direct.
DIRECT_BEFORE=$(change_count)
run_turn '把 src/App.tsx 中的标题 TODO App 改成 Tasks，并用 rg 验证结果；这是可在当前会话闭环的局部修改。' "$OUTPUT_DIR/direct.json" 8
if grep -q '<h1>Tasks</h1>' "$FIXTURE_DIR/src/App.tsx"; then
  echo "  ✅ Obvious local edit completed directly"
else
  echo "  ❌ FAIL: Direct edit was not completed"
  FAILURES=$((FAILURES + 1))
fi
assert_no_change_created "$OUTPUT_DIR/direct.json" "$DIRECT_BEFORE" "Direct work"

# 2. Auto-routed lite waits for material decisions, then creates a lite change.
DISCUSS_BEFORE=$(change_count)
run_turn '我要给 TODO 应用增加批量导出，但导出范围和格式都未决定并会改变验收。先讨论关键问题；我确认前不要创建 change。' "$OUTPUT_DIR/discuss-1.json" 5
assert_tool_called "AskUserQuestion" "$OUTPUT_DIR/discuss-1.json"
assert_no_change_created "$OUTPUT_DIR/discuss-1.json" "$DISCUSS_BEFORE" "Unconfirmed lite discussion"

run_turn '确认：只导出当前可见的 todo，JSON 数组格式，下载文件名 todos.json。现在按契约继续，并使用 change 名 export-visible-todos。' "$OUTPUT_DIR/discuss-2.json" 10 "--continue"
assert_bash_called "openspec new change.*--schema lite" "$OUTPUT_DIR/discuss-2.json"
assert_file_exists "$FIXTURE_DIR/openspec/changes/export-visible-todos"
if grep -q '^schema: lite$' "$FIXTURE_DIR/openspec/changes/export-visible-todos/.openspec.yaml"; then
  echo "  ✅ Confirmed discussion materialized as lite"
else
  echo "  ❌ FAIL: Confirmed discussion did not create lite"
  FAILURES=$((FAILURES + 1))
fi

# 3. A direct investigation asks before upgrading and preserves only verified progress.
UPGRADE_BEFORE=$(change_count)
run_turn '只调查当前主题样式相关代码并汇报，不修改文件、不创建 change；后续如果范围扩大再决定是否升级。' "$OUTPUT_DIR/upgrade-1.json" 6
assert_no_change_created "$OUTPUT_DIR/upgrade-1.json" "$UPGRADE_BEFORE" "Direct investigation"

run_turn '现在补充：需要跨组件协调、迁移旧偏好并分多步验证，已需要持久化协调。按契约先问我是否升级到 lite；本轮尚未授权创建 change。' "$OUTPUT_DIR/upgrade-2.json" 4 "--continue"
assert_tool_called "AskUserQuestion" "$OUTPUT_DIR/upgrade-2.json"
assert_no_change_created "$OUTPUT_DIR/upgrade-2.json" "$UPGRADE_BEFORE" "Unconfirmed direct upgrade"

run_turn '同意升级到 lite，change 名为 coordinate-theme-rollout。保留已完成调查，但不得把没有验证的实现任务预先勾选。' "$OUTPUT_DIR/upgrade-3.json" 10 "--continue"
assert_bash_called "openspec new change.*--schema lite" "$OUTPUT_DIR/upgrade-3.json"
assert_file_exists "$FIXTURE_DIR/openspec/changes/coordinate-theme-rollout"
if [ -f "$FIXTURE_DIR/openspec/changes/coordinate-theme-rollout/tasks.md" ] && \
   grep -q '^- \[x\]' "$FIXTURE_DIR/openspec/changes/coordinate-theme-rollout/tasks.md"; then
  echo "  ❌ FAIL: Direct upgrade pre-checked unverified implementation work"
  FAILURES=$((FAILURES + 1))
else
  echo "  ✅ Direct upgrade preserved context without pre-checking work"
fi

# 4. A brainstorm-only lite change can promote early without a second change.
EARLY_NAME="early-contract-promotion"
npx devkeel@latest openspec new change "$EARLY_NAME" --schema lite >/dev/null
cat > "$FIXTURE_DIR/openspec/changes/$EARLY_NAME/brainstorm.md" <<'EOF'
# 变更：Early contract promotion

> **状态：** `CONFIRMED` · **确认项：** 1 D / 0 A / 0 O

## 当前有效决定

#### D-01

Preserve this confirmed goal while promoting the workflow.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `NONE`
- **阻塞原因：** 等待流程选择与投影。
EOF
EARLY_BEFORE=$(change_count)
run_turn '确认将 early-contract-promotion 原地升级为 full：它新增了外部消费者契约、可观察字段变化和协同迁移回滚风险。当前只有 brainstorm；保留它并写入 <!-- harness:lite-to-full-promotion -->，不创建新 change，并在切换 selector 后运行 status 校验。' "$OUTPUT_DIR/early-promotion.json" 8
assert_no_change_created "$OUTPUT_DIR/early-promotion.json" "$EARLY_BEFORE" "Early in-place lite-to-full promotion"
if grep -q '^schema: full$' "$FIXTURE_DIR/openspec/changes/$EARLY_NAME/.openspec.yaml" && \
   grep -q 'Preserve this confirmed goal' "$FIXTURE_DIR/openspec/changes/$EARLY_NAME/brainstorm.md" && \
   grep -q '<!-- harness:lite-to-full-promotion -->' "$FIXTURE_DIR/openspec/changes/$EARLY_NAME/brainstorm.md"; then
  echo "  ✅ Early promotion preserved brainstorm in the same change"
else
  echo "  ❌ FAIL: Early promotion lost its selector or brainstorm"
  FAILURES=$((FAILURES + 1))
fi

# Complete the planning dependencies, then prove Continue creates absent Full tasks instead of
# treating the promotion marker as a permanent reconciliation loop.
EARLY_DIR="$FIXTURE_DIR/openspec/changes/$EARLY_NAME"
cat > "$EARLY_DIR/design.md" <<'EOF'
# Design

Use the reviewed partner contract design.
EOF
mkdir -p "$EARLY_DIR/specs/early-contract"
cat > "$EARLY_DIR/specs/early-contract/spec.md" <<'EOF'
## ADDED Requirements

### Requirement: Early contract
The system SHALL implement the promoted contract.

#### Scenario: Planned implementation
- **WHEN** Full planning completes
- **THEN** tasks SHALL be derived from its design and specification
EOF
EARLY_TASKS_BEFORE=$(change_count)
run_turn '/opsx:continue early-contract-promotion；promotion marker 已存在，design/specs 已完成但 tasks 尚不存在。按 Full tasks instruction 创建 tasks：至少保留一个实现 promoted contract 的 [ ] 结果任务和 Final Verification，并保留 <!-- harness:full-tasks-reconciled -->，然后停止在 Apply 前。' "$OUTPUT_DIR/early-promotion-tasks.json" 10
assert_no_change_created "$OUTPUT_DIR/early-promotion-tasks.json" "$EARLY_TASKS_BEFORE" "Early promotion tasks recovery"
if grep -q '^schema: full$' "$EARLY_DIR/.openspec.yaml" && \
   grep -q 'Preserve this confirmed goal' "$EARLY_DIR/brainstorm.md" && \
   grep -q '<!-- harness:lite-to-full-promotion -->' "$EARLY_DIR/brainstorm.md" && \
   [ -f "$EARLY_DIR/design.md" ] && \
   find "$EARLY_DIR/specs" -type f -name '*.md' -print -quit | grep -q . && \
   [ -f "$EARLY_DIR/tasks.md" ] && \
   grep -q '<!-- harness:full-tasks-reconciled -->' "$EARLY_DIR/tasks.md" && \
   grep -Eqi '^- \[ \].*(promoted contract|early contract)' "$EARLY_DIR/tasks.md" && \
   grep -q '^## Final Verification' "$EARLY_DIR/tasks.md"; then
  echo "  ✅ Early promotion preserved Full planning and created actionable reconciled tasks"
else
  echo "  ❌ FAIL: Continue produced incomplete tasks or damaged early-promotion Full planning"
  FAILURES=$((FAILURES + 1))
fi

# 5. Current-contract native Full cannot lose mandatory planning and masquerade as old Full.
CURRENT_FULL_NAME="current-full-planning-recovery"
npx devkeel@latest openspec new change "$CURRENT_FULL_NAME" --schema full >/dev/null
CURRENT_FULL_DIR="$FIXTURE_DIR/openspec/changes/$CURRENT_FULL_NAME"
cat > "$CURRENT_FULL_DIR/brainstorm.md" <<'EOF'
# 变更：Current Full planning recovery

> **状态：** `CONFIRMED` · **确认项：** 1 D / 0 A / 0 O

## 当前有效决定

#### D-01

Implement the current Full contract without losing mandatory planning.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `STALE`
- **阻塞原因：** Full design/specs 缺失。
EOF
cat > "$CURRENT_FULL_DIR/tasks.md" <<'EOF'
# Tasks

<!-- harness:full-tasks-reconciled -->

- [ ] **1. Create current Full marker**
  - **Result:** CURRENT_FULL_SHOULD_NOT_APPLY.md exists only after planning is restored.

## Final Verification

| Check | Command or operation | Coverage | Necessity |
|-------|----------------------|----------|-----------|
| Marker | `test -f CURRENT_FULL_SHOULD_NOT_APPLY.md` | Current Full result | required |
EOF
CURRENT_FULL_BEFORE=$(change_count)
run_turn '/opsx:continue current-full-planning-recovery；这是当前契约创建的原生 Full，tasks 有 <!-- harness:full-tasks-reconciled -->，但 design/specs 丢失。即使 status 将 tasks 视为 done，也先恢复下一项强制 planning artifact，本轮不要 Apply。' "$OUTPUT_DIR/current-full-continue.json" 8
assert_no_change_created "$OUTPUT_DIR/current-full-continue.json" "$CURRENT_FULL_BEFORE" "Current Full planning recovery"
if grep -q '^schema: full$' "$CURRENT_FULL_DIR/.openspec.yaml" && \
   [ -f "$CURRENT_FULL_DIR/design.md" ] && \
   ! find "$CURRENT_FULL_DIR/specs" -type f -name '*.md' -print -quit 2>/dev/null | grep -q . && \
   grep -q '<!-- harness:full-tasks-reconciled -->' "$CURRENT_FULL_DIR/tasks.md" && \
   [ ! -f "$FIXTURE_DIR/CURRENT_FULL_SHOULD_NOT_APPLY.md" ]; then
  echo "  ✅ Current Full marker forced recovery of missing mandatory planning"
else
  echo "  ❌ FAIL: Current Full was misclassified as old no-backfill Full"
  FAILURES=$((FAILURES + 1))
fi

run_turn '/opsx:apply current-full-planning-recovery；specs 仍缺失，必须回到 planning，不能执行 tasks 或创建 CURRENT_FULL_SHOULD_NOT_APPLY.md。' "$OUTPUT_DIR/current-full-apply.json" 8
assert_bash_called "openspec instructions apply.*--change.*current-full-planning-recovery" "$OUTPUT_DIR/current-full-apply.json"
CURRENT_FULL_APPLY_TEXT=$(jq -r 'select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text' "$OUTPUT_DIR/current-full-apply.json" 2>/dev/null)
if [ ! -f "$FIXTURE_DIR/CURRENT_FULL_SHOULD_NOT_APPLY.md" ] && \
   ! find "$CURRENT_FULL_DIR/specs" -type f -name '*.md' -print -quit 2>/dev/null | grep -q . && \
   grep -q '^- \[ \].*Create current Full marker' "$CURRENT_FULL_DIR/tasks.md" && \
   printf '%s\n' "$CURRENT_FULL_APPLY_TEXT" | grep -q 'current-full-planning-recovery' && \
   printf '%s\n' "$CURRENT_FULL_APPLY_TEXT" | grep -Eqi '(/opsx:continue|missing[^[:cntrl:]]*spec|spec[^[:cntrl:]]*missing|缺少[^[:cntrl:]]*spec|spec[^[:cntrl:]]*缺失)'; then
  echo "  ✅ Apply refused current Full with incomplete mandatory planning"
else
  echo "  ❌ FAIL: Apply bypassed current Full mandatory planning"
  FAILURES=$((FAILURES + 1))
fi

# 6. A tasks-stage lite change upgrades to full in place only after confirmation.
PROMOTION_DIR="$FIXTURE_DIR/openspec/changes/coordinate-theme-rollout"
cat > "$PROMOTION_DIR/brainstorm.md" <<'EOF'
# 变更：Coordinate theme rollout

> **状态：** `CONFIRMED` · **确认项：** 2 D / 0 A / 0 O

## 当前有效决定

#### D-01

Coordinate the verified theme rollout.

#### D-02

The change currently uses lite.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `CURRENT`
- **阻塞原因：** 无。
EOF
cat > "$PROMOTION_DIR/tasks.md" <<'EOF'
# Tasks

- [x] **1. Preserve verified investigation**
  - **来源：** [D-01](brainstorm.md#d-01)
  - **Result:** Existing theme investigation is confirmed and already verified.
  - **Verification:** `test -f src/App.tsx`
- [ ] **2. Implement the coordinated rollout**
  - **来源：** [D-01](brainstorm.md#d-01)
  - **Result:** Partner contract rollout is implemented.
  - **Verification:** Defined after Full design/specs are completed.
EOF
PROMOTION_BEFORE=$(change_count)
run_turn '继续 coordinate-theme-rollout：现在确认它还会改变外部客户端读取的主题偏好字段，客户端由合作方控制，双方需要版本协商、迁移和回滚。先建议是否升级 full 并征求确认；本轮不得修改 selector 或创建 change。' "$OUTPUT_DIR/promotion-1.json" 5 "--continue"
assert_tool_called "AskUserQuestion" "$OUTPUT_DIR/promotion-1.json"
assert_no_change_created "$OUTPUT_DIR/promotion-1.json" "$PROMOTION_BEFORE" "Unconfirmed lite-to-full promotion"
if grep -q '^schema: lite$' "$FIXTURE_DIR/openspec/changes/coordinate-theme-rollout/.openspec.yaml"; then
  echo "  ✅ Unconfirmed promotion preserved the lite selector"
else
  echo "  ❌ FAIL: Unconfirmed promotion mutated the lite selector"
  FAILURES=$((FAILURES + 1))
fi

run_turn '确认把 coordinate-theme-rollout 原地升级为 full：在 brainstorm 记录流程选择和 <!-- harness:lite-to-full-promotion -->，切换同一个 change 的 selector，补齐强制 design/specs 后重审 tasks，完成后写入 <!-- harness:full-tasks-reconciled --> 并校验 status；不要创建第二个 change，保留已有代码，只有已有验证证据的任务可以保持勾选。' "$OUTPUT_DIR/promotion-2.json" 14 "--continue"
assert_no_change_created "$OUTPUT_DIR/promotion-2.json" "$PROMOTION_BEFORE" "Confirmed in-place lite-to-full promotion"
if grep -q '^schema: full$' "$PROMOTION_DIR/.openspec.yaml" && \
   [ -f "$PROMOTION_DIR/design.md" ] && \
   find "$PROMOTION_DIR/specs" -type f -name '*.md' -print -quit | grep -q . && \
   grep -q 'Coordinate the verified theme rollout' "$PROMOTION_DIR/brainstorm.md" && \
   grep -q 'full' "$PROMOTION_DIR/brainstorm.md" && \
   grep -q '<!-- harness:lite-to-full-promotion -->' "$PROMOTION_DIR/brainstorm.md" && \
   grep -q '<!-- harness:full-tasks-reconciled -->' "$PROMOTION_DIR/tasks.md" && \
   grep -q '^- \[x\].*Preserve verified investigation' "$PROMOTION_DIR/tasks.md" && \
   grep -q '^- \[ \].*Implement the coordinated rollout' "$PROMOTION_DIR/tasks.md"; then
  echo "  ✅ Promotion backfilled Full planning and preserved brainstorm plus checked/unchecked task scope"
else
  echo "  ❌ FAIL: Confirmed promotion lost mandatory artifacts, workflow choice, or existing task scope"
  FAILURES=$((FAILURES + 1))
fi

# 7. Continue repairs an interrupted promotion even when OpenSpec sees tasks as apply-ready.
RECOVERY_NAME="interrupted-task-promotion"
npx devkeel@latest openspec new change "$RECOVERY_NAME" --schema lite >/dev/null
RECOVERY_DIR="$FIXTURE_DIR/openspec/changes/$RECOVERY_NAME"
sed 's/^schema: lite$/schema: full/' "$RECOVERY_DIR/.openspec.yaml" \
  > "$RECOVERY_DIR/.openspec.yaml.next"
mv "$RECOVERY_DIR/.openspec.yaml.next" "$RECOVERY_DIR/.openspec.yaml"
cat > "$RECOVERY_DIR/brainstorm.md" <<'EOF'
# 变更：Interrupted task promotion

> **状态：** `CONFIRMED` · **确认项：** 2 D / 0 A / 0 O

## 当前有效决定

#### D-01

Preserve the interrupted promotion scope.

#### D-02

Confirmed Lite to Full promotion.
<!-- harness:lite-to-full-promotion -->

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `CURRENT`
- **阻塞原因：** tasks 等待 Full reconciliation。
EOF
cat > "$RECOVERY_DIR/design.md" <<'EOF'
# Design

Coordinate the partner rollout before implementation.
EOF
mkdir -p "$RECOVERY_DIR/specs/partner-rollout"
cat > "$RECOVERY_DIR/specs/partner-rollout/spec.md" <<'EOF'
## ADDED Requirements

### Requirement: Partner rollout
The system SHALL preserve the coordinated rollout contract.

#### Scenario: Coordinated implementation
- **WHEN** implementation starts
- **THEN** it SHALL follow the reviewed Full plan
EOF
cat > "$RECOVERY_DIR/tasks.md" <<'EOF'
# Tasks

- [x] **1. Preserve verified investigation**
  - **来源：** [D-01](brainstorm.md#d-01)
  - **Result:** Existing investigation remains verified.
- [ ] **2. Implement partner rollout**
  - **来源：** [D-02](brainstorm.md#d-02)
  - **Result:** The coordinated rollout is implemented.
EOF
RECOVERY_BEFORE=$(change_count)
run_turn '/opsx:continue interrupted-task-promotion；这是已确认但中断的 tasks-stage Lite→Full 升级。design/specs 已补齐，但 tasks 还没有 <!-- harness:full-tasks-reconciled -->。即使 status 显示 apply ready，也先按 Full 设计重审原 tasks，保留有证据的 [x] 和原 [ ] 范围，写入 marker 后停止。' "$OUTPUT_DIR/promotion-recovery.json" 10
assert_no_change_created "$OUTPUT_DIR/promotion-recovery.json" "$RECOVERY_BEFORE" "Interrupted promotion recovery"
if grep -q '^schema: full$' "$RECOVERY_DIR/.openspec.yaml" && \
   [ -f "$RECOVERY_DIR/design.md" ] && \
   find "$RECOVERY_DIR/specs" -type f -name '*.md' -print -quit | grep -q . && \
   grep -q '<!-- harness:full-tasks-reconciled -->' "$RECOVERY_DIR/tasks.md" && \
   grep -q '^- \[x\].*Preserve verified investigation' "$RECOVERY_DIR/tasks.md" && \
   grep -q '^- \[ \].*Implement partner rollout' "$RECOVERY_DIR/tasks.md"; then
  echo "  ✅ Interrupted promotion preserved Full planning and reconciled tasks before Apply"
else
  echo "  ❌ FAIL: Continue bypassed or lost interrupted promotion task reconciliation"
  FAILURES=$((FAILURES + 1))
fi

# 8. A user may refuse a full recommendation and keep using lite.
REFUSAL_BEFORE=$(change_count)
run_turn '重新查看 export-visible-todos：新增信息是导出格式将被外部合作方客户端消费，字段形状会变化并需要双方迁移和回滚。先说明 full 风险并问我是否升级，本轮不要修改文件。' "$OUTPUT_DIR/full-refusal-1.json" 5
assert_tool_called "AskUserQuestion" "$OUTPUT_DIR/full-refusal-1.json"
assert_no_change_created "$OUTPUT_DIR/full-refusal-1.json" "$REFUSAL_BEFORE" "Unconfirmed full recommendation for existing lite"

run_turn '我拒绝升级 full，接受该风险并继续使用现有 lite change；不要创建新 change，也不要修改 selector，只说明下一项 lite 工作。' "$OUTPUT_DIR/full-refusal-2.json" 4 "--continue"
assert_no_change_created "$OUTPUT_DIR/full-refusal-2.json" "$REFUSAL_BEFORE" "Refused full recommendation"
if grep -q '^schema: lite$' "$FIXTURE_DIR/openspec/changes/export-visible-todos/.openspec.yaml"; then
  echo "  ✅ Refused full recommendation remained on lite"
else
  echo "  ❌ FAIL: Refusing full changed the existing lite selector"
  FAILURES=$((FAILURES + 1))
fi

# 9. All three external-contract conditions trigger a full recommendation and confirmation.
FULL_BEFORE=$(change_count)
run_turn '规划 partner-contract-v2：外部合作方控制客户端；我们要改变其可观察 JSON 字段形状；双方需要版本协商、迁移和回滚。先说明流程建议并征求确认，本轮不要创建 change。' "$OUTPUT_DIR/full-risk-1.json" 5
assert_tool_called "AskUserQuestion" "$OUTPUT_DIR/full-risk-1.json"
if grep -q 'full' "$OUTPUT_DIR/full-risk-1.json"; then
  echo "  ✅ External contract risk recommended full"
else
  echo "  ❌ FAIL: External contract risk did not recommend full"
  FAILURES=$((FAILURES + 1))
fi
assert_no_change_created "$OUTPUT_DIR/full-risk-1.json" "$FULL_BEFORE" "Unconfirmed full recommendation"

run_turn '确认使用 full，change 名 partner-contract-v2；现在创建脚手架。' "$OUTPUT_DIR/full-risk-2.json" 8 "--continue"
assert_bash_called "openspec new change.*--schema full" "$OUTPUT_DIR/full-risk-2.json"
assert_file_exists "$FIXTURE_DIR/openspec/changes/partner-contract-v2"
if grep -q '^schema: full$' "$FIXTURE_DIR/openspec/changes/partner-contract-v2/.openspec.yaml"; then
  echo "  ✅ Confirmed external contract risk created full"
else
  echo "  ❌ FAIL: Confirmed external contract risk did not create full"
  FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ PASS: workflow-routing"
else
  echo "  ❌ FAIL: workflow-routing ($FAILURES failures)"
fi
