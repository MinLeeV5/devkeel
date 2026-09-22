#!/usr/bin/env bash
# Scenario: lite apply failure, successful apply, and all_done recovery.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../../lib"

source "$LIB_DIR/run-turn.sh"
source "$LIB_DIR/extract.sh"
source "$LIB_DIR/assert.sh"

echo "=== Scenario: opsx-lite-cycle ==="

create_lite_change() {
  local name="$1"
  npx devkeel@latest openspec new change "$name" --schema lite >/dev/null
}

assert_no_heavy_lite_flow() {
  local output_file="$1"
  if extract_skill_calls "$output_file" | grep -Eq '(^|:)(writing-plans|executing-plans|subagent-driven-development|requesting-code-review|verification-before-completion|finishing-a-development-branch|test-driven-development|using-git-worktrees|review-orchestrator)$'; then
    echo "  ❌ FAIL: ordinary lite apply invoked a heavy skill"
    FAILURES=$((FAILURES + 1))
  else
    echo "  ✅ Ordinary lite apply invoked no heavy skill"
  fi

  if extract_tool_calls "$output_file" | grep -Eq '^(Task|Agent):'; then
    echo "  ❌ FAIL: ordinary lite apply dispatched a subagent"
    FAILURES=$((FAILURES + 1))
  else
    echo "  ✅ Ordinary lite apply stayed with the current Agent"
  fi

  if extract_bash_commands "$output_file" | grep -Eq 'git (worktree|commit)|omc ralph'; then
    echo "  ❌ FAIL: ordinary lite apply used worktree, commit, or heavy executor"
    FAILURES=$((FAILURES + 1))
  else
    echo "  ✅ Ordinary lite apply added no worktree, commit, or heavy executor"
  fi
}

# 1. Failed verification keeps the task unchecked and the change active.
FAIL_NAME="lite-validation-failure"
create_lite_change "$FAIL_NAME"
cat > "$FIXTURE_DIR/openspec/changes/$FAIL_NAME/brainstorm.md" <<'EOF'
# 变更：验证失败恢复

> **状态：** `CONFIRMED` · **确认项：** 1 D / 0 A / 0 O

## 当前有效决定

#### D-01

Exercise the failure recovery contract. The external verifier is unavailable;
do not change project files or alter the verification command.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `CURRENT`
- **阻塞原因：** 无。
EOF
cat > "$FIXTURE_DIR/openspec/changes/$FAIL_NAME/tasks.md" <<'EOF'
# Tasks

- [ ] **Observe the unavailable verifier**
  - **来源：** [D-01](brainstorm.md#d-01)
  - **Result:** Run the verifier once and pause with evidence when it fails.
  - **Scope:** Do not modify project files or this verification command.
  - **Verify:** `node -e "process.exit(23)"`
EOF

run_turn "/opsx:apply $FAIL_NAME" "$OUTPUT_DIR/failure.json" 10
assert_bash_called "npx devkeel@latest openspec instructions apply" "$OUTPUT_DIR/failure.json"
assert_bash_called "node -e.*process.exit(23)" "$OUTPUT_DIR/failure.json"
assert_file_exists "$FIXTURE_DIR/openspec/changes/$FAIL_NAME"
if grep -q '^- \[ \]' "$FIXTURE_DIR/openspec/changes/$FAIL_NAME/tasks.md"; then
  echo "  ✅ Failed verification left the task unchecked"
else
  echo "  ❌ FAIL: Failed verification changed the task checkbox"
  FAILURES=$((FAILURES + 1))
fi
if extract_bash_commands "$OUTPUT_DIR/failure.json" | grep -q 'openspec archive'; then
  echo "  ❌ FAIL: Failed lite apply attempted archive"
  FAILURES=$((FAILURES + 1))
else
  echo "  ✅ Failed lite apply kept the change active"
fi
assert_no_heavy_lite_flow "$OUTPUT_DIR/failure.json"

# 2. A verified task is checked and automatically archived.
SUCCESS_NAME="lite-success"
create_lite_change "$SUCCESS_NAME"
cat > "$FIXTURE_DIR/openspec/changes/$SUCCESS_NAME/brainstorm.md" <<'EOF'
# 变更：创建 Lite marker

> **状态：** `CONFIRMED` · **确认项：** 1 D / 0 A / 0 O

## 当前有效决定

#### D-01

Create a small marker file and verify its exact content. This is a local,
low-risk change with no reason to use heavy workflow tools.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `CURRENT`
- **阻塞原因：** 无。
EOF
cat > "$FIXTURE_DIR/openspec/changes/$SUCCESS_NAME/tasks.md" <<'EOF'
# Tasks

- [ ] **Create the lite marker**
  - **来源：** [D-01](brainstorm.md#d-01)
  - **Result:** `LITE_MARKER.md` contains exactly `lite-ready` and a newline.
  - **Scope:** `LITE_MARKER.md` only.
  - **Verify:** `test "$(cat LITE_MARKER.md)" = "lite-ready"`
EOF

run_turn "/opsx:apply $SUCCESS_NAME" "$OUTPUT_DIR/success.json" 20
assert_bash_called "npx devkeel@latest openspec instructions apply" "$OUTPUT_DIR/success.json"
assert_bash_called "test.*cat LITE_MARKER.md" "$OUTPUT_DIR/success.json"
assert_bash_called "openspec archive.* -y" "$OUTPUT_DIR/success.json"
assert_file_exists "$FIXTURE_DIR/LITE_MARKER.md"
assert_file_not_exists "$FIXTURE_DIR/openspec/changes/$SUCCESS_NAME"
if find "$FIXTURE_DIR/openspec/changes/archive" -maxdepth 1 -type d -name "*-$SUCCESS_NAME" -print -quit | grep -q .; then
  echo "  ✅ Successful lite apply archived the change"
else
  echo "  ❌ FAIL: Successful lite archive directory not found"
  FAILURES=$((FAILURES + 1))
fi
assert_no_heavy_lite_flow "$OUTPUT_DIR/success.json"

# 3. A resumed all_done change still takes the AGENTS-level archive branch.
DONE_NAME="lite-all-done"
create_lite_change "$DONE_NAME"
cat > "$FIXTURE_DIR/openspec/changes/$DONE_NAME/brainstorm.md" <<'EOF'
# 变更：恢复已完成 Lite change

> **状态：** `CONFIRMED` · **确认项：** 1 D / 0 A / 0 O

## 当前有效决定

#### D-01

All implementation work was already verified before this resumed apply.

## Agent 自主范围

无。

## 开放问题

无。

## Planning 状态

- **下游状态：** `CURRENT`
- **阻塞原因：** 无。
EOF
cat > "$FIXTURE_DIR/openspec/changes/$DONE_NAME/tasks.md" <<'EOF'
# Tasks

- [x] **Already verified result**
  - **来源：** [D-01](brainstorm.md#d-01)
  - **Result:** Existing work is complete.
  - **Verify:** Previously passed.
EOF

run_turn "/opsx:apply $DONE_NAME" "$OUTPUT_DIR/all-done.json" 10
assert_bash_called "npx devkeel@latest openspec instructions apply" "$OUTPUT_DIR/all-done.json"
assert_bash_called "openspec archive.* -y" "$OUTPUT_DIR/all-done.json"
assert_file_not_exists "$FIXTURE_DIR/openspec/changes/$DONE_NAME"
if find "$FIXTURE_DIR/openspec/changes/archive" -maxdepth 1 -type d -name "*-$DONE_NAME" -print -quit | grep -q .; then
  echo "  ✅ all_done recovery archived the change"
else
  echo "  ❌ FAIL: all_done recovery archive directory not found"
  FAILURES=$((FAILURES + 1))
fi
assert_no_heavy_lite_flow "$OUTPUT_DIR/all-done.json"

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ PASS: opsx-lite-cycle"
else
  echo "  ❌ FAIL: opsx-lite-cycle ($FAILURES failures)"
fi
