#!/usr/bin/env bash
# Scenario: full-cycle (new → continue → apply) 多轮验证
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../../lib"

source "$LIB_DIR/run-turn.sh"
source "$LIB_DIR/extract.sh"
source "$LIB_DIR/assert.sh"

CHANGE_NAME="add-full-cycle-marker"

echo "=== Scenario: opsx-full-cycle ==="

assert_no_retired_executor() {
  local output_file="$1"
  if extract_skill_calls "$output_file" | grep -Eq '(^|:)(writing-plans|executing-plans|subagent-driven-development|requesting-code-review|verification-before-completion|finishing-a-development-branch|test-driven-development|using-git-worktrees)$'; then
    echo "  ❌ FAIL: Full apply invoked a retired Superpowers executor"
    FAILURES=$((FAILURES + 1))
  else
    echo "  ✅ Full apply used no retired Superpowers executor"
  fi
}

# Turn 1: /opsx:new
echo "  Turn 1: /opsx:new \"$CHANGE_NAME\" --schema full"
run_turn "/opsx:new \"$CHANGE_NAME\" --schema full；目标是创建 FULL_CYCLE_MARKER.md 并验证其内容，先初始化 Living brainstorm" "$OUTPUT_DIR/turn-1.json" 8

assert_bash_called "npx devkeel@latest openspec new change" "$OUTPUT_DIR/turn-1.json"
assert_file_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME"
if grep -q '^schema: full$' "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/.openspec.yaml"; then
  echo "  ✅ Full cycle is pinned to full"
else
  echo "  ❌ FAIL: Full cycle did not select full"
  FAILURES=$((FAILURES + 1))
fi
echo "  Turn 1: ✓"

# This scenario focuses on projection and lifecycle. The confirmed snapshot is an explicit fixture
# boundary; Brainstorming's interview loop has separate contract coverage.
cat > "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/brainstorm.md" <<'EOF'
# 变更：Full cycle marker

> **状态：** `CONFIRMED` · **确认项：** 4 D / 0 A / 0 O

## 30 秒了解

Create one deterministic marker, verify it, and exercise the Full closure path.

## 当前有效决定

#### D-01

Create `FULL_CYCLE_MARKER.md` with exactly `full-cycle` and a newline.

#### D-02

Limit implementation scope to the marker file.

#### D-03

Verify the exact marker content with a shell assertion.

#### D-04

Use Full so the scenario covers delta spec, final review, verify, retrospective, and archive.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `NONE`
- **阻塞原因：** 等待封闭投影。
EOF

# Turn 2: /opsx:continue (generate first artifact)
echo "  Turn 2: /opsx:continue $CHANGE_NAME"
run_turn "/opsx:continue $CHANGE_NAME" "$OUTPUT_DIR/turn-2.json" 10 "--continue"

assert_bash_called "npx devkeel@latest openspec instructions" "$OUTPUT_DIR/turn-2.json"
echo "  Turn 2: ✓"

# Turn 3: /opsx:continue (may write artifact)
echo "  Turn 3: /opsx:continue $CHANGE_NAME"
run_turn "/opsx:continue $CHANGE_NAME" "$OUTPUT_DIR/turn-3.json" 10 "--continue"

echo "  Turn 3: ✓"

# Continue until tasks exists or max 5 additional turns
TURN=3
MAX_TURNS=8
while [ $TURN -lt $MAX_TURNS ]; do
  if [ -f "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/tasks.md" ]; then
    echo "  Tasks artifact ready at turn $TURN"
    break
  fi
  TURN=$((TURN + 1))
  echo "  Turn $TURN: /opsx:continue $CHANGE_NAME"
  run_turn "/opsx:continue $CHANGE_NAME" "$OUTPUT_DIR/turn-${TURN}.json" 10 "--continue"
done

assert_file_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/tasks.md"

# Make the result task and final verification deterministic.
cat > "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/tasks.md" <<'EOF'
# Implementation Tasks

- [ ] **1. Create the full-cycle marker**
  - **来源：** [D-01](brainstorm.md#d-01)、[D-02](brainstorm.md#d-02)、[D-03](brainstorm.md#d-03)
  - **Result:** `FULL_CYCLE_MARKER.md` contains exactly `full-cycle` and a newline.
  - **Scope:** `FULL_CYCLE_MARKER.md` only.
  - **Local verification:** `test "$(cat FULL_CYCLE_MARKER.md)" = "full-cycle"`

## Final Verification

| Check | Command or operation | Coverage | Necessity |
|-------|----------------------|----------|-----------|
| Marker content | `test "$(cat FULL_CYCLE_MARKER.md)" = "full-cycle"` | Final result | required |
EOF
mkdir -p "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/specs/full-cycle-marker"
cat > "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/specs/full-cycle-marker/spec.md" <<'EOF'
## ADDED Requirements

### Requirement: Full cycle marker
The fixture MUST produce the deterministic full-cycle marker.

**来源**: [D-01](../../brainstorm.md#d-01)

#### Scenario: Marker exists
- **WHEN** Full Apply completes
- **THEN** `FULL_CYCLE_MARKER.md` SHALL contain `full-cycle`
EOF

# Final turn: /opsx:apply
TURN=$((TURN + 1))
echo "  Turn $TURN: /opsx:apply $CHANGE_NAME"
run_turn "/opsx:apply $CHANGE_NAME；由当前 Agent 顺序完成任务、最终 review 并自动 verify，不创建 worktree 或提交" "$OUTPUT_DIR/turn-${TURN}.json" 30 "--continue"

assert_bash_called "npx devkeel@latest openspec instructions apply" "$OUTPUT_DIR/turn-${TURN}.json"
assert_skill_triggered "review-orchestrator" "$OUTPUT_DIR/turn-${TURN}.json"
assert_skill_triggered "openspec-verify-change" "$OUTPUT_DIR/turn-${TURN}.json"
assert_bash_called "openspec instructions verify" "$OUTPUT_DIR/turn-${TURN}.json"
assert_bash_called "test.*cat FULL_CYCLE_MARKER.md" "$OUTPUT_DIR/turn-${TURN}.json"
assert_file_exists "$FIXTURE_DIR/FULL_CYCLE_MARKER.md"
assert_file_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/verify.md"
if grep -Eq '^- \*\*结论：\*\*[[:space:]]*PASS[[:space:]]*$' "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/verify.md"; then
  echo "  ✅ full produced a PASS verification report"
else
  echo "  ❌ FAIL: full did not produce a PASS verification report"
  FAILURES=$((FAILURES + 1))
fi
if grep -Eq '^- \*\*Final Review：\*\*[[:space:]]*P0/P1 CLEAR[[:space:]]*$' "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/verify.md"; then
  echo "  ✅ Verify recorded reviewed closure provenance"
else
  echo "  ❌ FAIL: Verify did not record P0/P1 CLEAR provenance"
  FAILURES=$((FAILURES + 1))
fi
if grep -q '^- \[x\]' "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/tasks.md"; then
  echo "  ✅ full apply advanced its result task"
else
  echo "  ❌ FAIL: full apply did not advance its result task"
  FAILURES=$((FAILURES + 1))
fi
assert_no_retired_executor "$OUTPUT_DIR/turn-${TURN}.json"

# Full keeps its schema-selected dynamic executor and must not take lite archive.
if extract_bash_commands "$OUTPUT_DIR/turn-${TURN}.json" | grep -q 'openspec archive'; then
  echo "  ❌ FAIL: full apply bypassed its full lifecycle"
  FAILURES=$((FAILURES + 1))
else
  echo "  ✅ full apply preserved the full lifecycle"
fi

# A changed implementation fingerprint must make the PASS report stale.
printf 'stale-change\n' > "$FIXTURE_DIR/FULL_CYCLE_MARKER.md"
TURN=$((TURN + 1))
run_turn "/opsx:archive $CHANGE_NAME；实现已在 verify 后变化，必须拒绝旧 PASS，不要 force" "$OUTPUT_DIR/turn-${TURN}.json" 10 "--continue"
assert_file_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME"
if extract_bash_commands "$OUTPUT_DIR/turn-${TURN}.json" | grep -q 'openspec archive'; then
  echo "  ❌ FAIL: Full archive accepted a stale implementation fingerprint"
  FAILURES=$((FAILURES + 1))
elif grep -Eqi 'stale|过期|指纹|重新.*verify' "$OUTPUT_DIR/turn-${TURN}.json"; then
  echo "  ✅ Full archive rejected stale verification"
else
  echo "  ❌ FAIL: Stale verification rejection lacked a clear reason"
  FAILURES=$((FAILURES + 1))
fi
printf 'full-cycle\n' > "$FIXTURE_DIR/FULL_CYCLE_MARKER.md"

# Archive generates retrospective, syncs specs by default, and stops before delivery actions.
TURN=$((TURN + 1))
run_turn "/opsx:archive $CHANGE_NAME；归档后不要 commit、push、创建 PR 或清理" "$OUTPUT_DIR/turn-${TURN}.json" 20 "--continue"
assert_bash_called "openspec archive.*-y" "$OUTPUT_DIR/turn-${TURN}.json"
if extract_bash_commands "$OUTPUT_DIR/turn-${TURN}.json" | grep -q -- '--skip-specs'; then
  echo "  ❌ FAIL: Default Full archive skipped spec sync"
  FAILURES=$((FAILURES + 1))
fi
assert_file_not_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME"
ARCHIVED_FULL=$(find "$FIXTURE_DIR/openspec/changes/archive" -maxdepth 1 -type d -name "*-$CHANGE_NAME" -print -quit)
assert_file_exists "$ARCHIVED_FULL/retrospective.md"
assert_file_exists "$FIXTURE_DIR/openspec/specs/full-cycle-marker/spec.md"
if extract_skill_calls "$OUTPUT_DIR/turn-${TURN}.json" | grep -q 'finishing-a-development-branch'; then
  echo "  ❌ FAIL: Full archive automatically started branch delivery"
  FAILURES=$((FAILURES + 1))
else
  echo "  ✅ Full archive stopped before delivery actions"
fi

# Explicit DevKeel force is recorded and mapped to OpenSpec's supported flags.
FORCE_NAME="force-full-archive"
npx devkeel@latest openspec new change "$FORCE_NAME" --schema full >/dev/null
FORCE_DIR="$FIXTURE_DIR/openspec/changes/$FORCE_NAME"
cat > "$FORCE_DIR/brainstorm.md" <<'EOF'
# 变更：Force archive fixture

> **状态：** `CONFIRMED` · **确认项：** 1 D / 0 A / 0 O

## 当前有效决定

#### D-01

Force behavior is exercised explicitly.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `CURRENT`
- **阻塞原因：** 无。
EOF
cat > "$FORCE_DIR/design.md" <<'EOF'
# Design

No implementation is needed for this force-path fixture.
EOF
mkdir -p "$FORCE_DIR/specs/force-fixture"
cat > "$FORCE_DIR/specs/force-fixture/spec.md" <<'EOF'
## ADDED Requirements

### Requirement: Force fixture
The fixture SHALL remain deterministic.

**来源**: [D-01](../../brainstorm.md#d-01)

#### Scenario: Fixture exists
- **WHEN** the force path is exercised
- **THEN** the fixture SHALL be archived
EOF
cat > "$FORCE_DIR/tasks.md" <<'EOF'
# Implementation Tasks

- [ ] **1. Deliberately incomplete force fixture**
  - **来源：** [D-01](brainstorm.md#d-01)
  - **Result:** This remains incomplete so `--force` has a gate to record.

## Final Verification

| Check | Command or operation | Coverage | Necessity |
|-------|----------------------|----------|-----------|
| Deliberate blocker | unavailable external check | Force risk | required |
EOF

run_turn "/opsx:archive $FORCE_NAME --force；这是显式 DevKeel force，记录所有绕过项，但不要跳过 specs 同步" "$OUTPUT_DIR/force.json" 20
assert_bash_called "openspec archive.*-y.*--no-validate" "$OUTPUT_DIR/force.json"
if extract_bash_commands "$OUTPUT_DIR/force.json" | grep -Eq 'openspec archive.*--force'; then
  echo "  ❌ FAIL: DevKeel force was passed as an unsupported OpenSpec flag"
  FAILURES=$((FAILURES + 1))
else
  echo "  ✅ DevKeel force mapped only to supported OpenSpec flags"
fi
assert_file_not_exists "$FORCE_DIR"
ARCHIVED_FORCE=$(find "$FIXTURE_DIR/openspec/changes/archive" -maxdepth 1 -type d -name "*-$FORCE_NAME" -print -quit)
assert_file_exists "$ARCHIVED_FORCE/retrospective.md"
assert_file_exists "$FIXTURE_DIR/openspec/specs/force-fixture/spec.md"
if extract_bash_commands "$OUTPUT_DIR/force.json" | grep -q -- '--skip-specs'; then
  echo "  ❌ FAIL: Force archive skipped default spec sync"
  FAILURES=$((FAILURES + 1))
fi
FORCE_RETRO_CONTENT=$(grep -v '^[[:space:]]*<!--.*-->[[:space:]]*$' "$ARCHIVED_FORCE/retrospective.md")
if printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eqi '^- 用户选择：[[:space:]]*.*(force|强制)' && \
   printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eq '^- 绕过门禁：.*incomplete-tasks' && \
   printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eq '^- 绕过门禁：.*verify-missing' && \
   printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eq '^- 绕过门禁：.*final-review-missing' && \
   printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eq '^- 绕过门禁：.*openspec-validation' && \
   printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eq '^- 观察证据：[[:space:]]*[^[:space:]].*' && \
   printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eq '^- 剩余风险：[[:space:]]*[^[:space:]].*' && \
   printf '%s\n' "$FORCE_RETRO_CONTENT" | grep -Eq '^- 恢复动作：[[:space:]]*[^[:space:]].*'; then
  echo "  ✅ Force archive recorded every bypassed gate, evidence, risk, and recovery"
else
  echo "  ❌ FAIL: Force archive retrospective lacks the required structured bypass audit"
  FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ PASS: opsx-full-cycle"
else
  echo "  ❌ FAIL: opsx-full-cycle ($FAILURES failures)"
fi
