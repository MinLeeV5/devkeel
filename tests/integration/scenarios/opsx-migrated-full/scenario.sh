#!/usr/bin/env bash
# Scenario: an active legacy full change keeps status/continue/apply semantics after selector migration.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../../lib"

source "$LIB_DIR/run-turn.sh"
source "$LIB_DIR/extract.sh"
source "$LIB_DIR/assert.sh"

CHANGE_NAME="migrated-full"
OPEN_SPEC="$FIXTURE_DIR/openspec"
CHANGE_DIR="$OPEN_SPEC/changes/$CHANGE_NAME"

echo "=== Scenario: opsx-migrated-full ==="

# Build the legacy identity, create an active change, and make it apply-ready.
cp -R "$OPEN_SPEC/schemas/full" "$OPEN_SPEC/schemas/superpowers-lite"
sed -i.bak 's/^name: full$/name: superpowers-lite/' "$OPEN_SPEC/schemas/superpowers-lite/schema.yaml"
rm -f "$OPEN_SPEC/schemas/superpowers-lite/schema.yaml.bak"
npx devkeel@latest openspec new change "$CHANGE_NAME" --schema superpowers-lite >/dev/null

cat > "$CHANGE_DIR/brainstorm.md" <<'EOF'
# Brainstorm

Scope and acceptance are confirmed.
EOF
cat > "$CHANGE_DIR/design.md" <<'EOF'
# Design

The implementation contract is stable.
EOF
mkdir -p "$CHANGE_DIR/specs/demo"
cat > "$CHANGE_DIR/specs/demo/spec.md" <<'EOF'
## ADDED Requirements

### Requirement: Demo
The demo SHALL work.

#### Scenario: Works
- **WHEN** invoked
- **THEN** the demo SHALL work
EOF
cat > "$CHANGE_DIR/tasks.md" <<'EOF'
# Migrated Full Plan

## 1. Compatibility marker

> mode: inline

- [ ] **Create migrated marker**
  1. Create `MIGRATED_FULL.md` with the content `migrated-full`.
  > test: test -f MIGRATED_FULL.md
  > commit: test(integration): verify migrated full executor
EOF

npx devkeel@latest openspec status --change "$CHANGE_NAME" --json \
  | jq '[.artifacts[] | {id, status}]' > "$OUTPUT_DIR/status-before.json"
npx devkeel@latest openspec instructions apply --change "$CHANGE_NAME" --json \
  | jq '{state, progress, tasks, contextFiles}' > "$OUTPUT_DIR/apply-before.json"

# Simulate the deterministic selector migration and hard removal of the old identity.
sed 's/^schema: superpowers-lite$/schema: full/' "$CHANGE_DIR/.openspec.yaml" \
  > "$CHANGE_DIR/.openspec.yaml.next"
mv "$CHANGE_DIR/.openspec.yaml.next" "$CHANGE_DIR/.openspec.yaml"
rm -rf "$OPEN_SPEC/schemas/superpowers-lite"

npx devkeel@latest openspec status --change "$CHANGE_NAME" --json \
  | jq '[.artifacts[] | {id, status}]' > "$OUTPUT_DIR/status-after.json"
npx devkeel@latest openspec instructions apply --change "$CHANGE_NAME" --json \
  | jq '{state, progress, tasks, contextFiles}' > "$OUTPUT_DIR/apply-after.json"

if diff -u "$OUTPUT_DIR/status-before.json" "$OUTPUT_DIR/status-after.json" >/dev/null && \
   diff -u "$OUTPUT_DIR/apply-before.json" "$OUTPUT_DIR/apply-after.json" >/dev/null; then
  echo "  ✅ Legacy full status remained equivalent after migration"
else
  echo "  ❌ FAIL: Legacy full status/apply progress changed after migration"
  FAILURES=$((FAILURES + 1))
fi

run_turn "/opsx:continue $CHANGE_NAME；这是没有 Living 状态行的旧 Full change。已有 artifacts 表达的完整候选快照是：D-01 范围和验收已确认；D-02 保持现有实现契约；D-03 创建 MIGRATED_FULL.md 并用 test -f 验证；没有 A 或 O。我明确确认这份完整快照，请完成延迟迁移；若下游忠实覆盖则标记 CURRENT，本轮不要实现。" "$OUTPUT_DIR/continue.json" 10
assert_bash_called "npx devkeel@latest openspec status" "$OUTPUT_DIR/continue.json"
assert_bash_called "planning-state.mjs" "$OUTPUT_DIR/continue.json"
if grep -q '^> \*\*状态：\*\* `CONFIRMED`' "$CHANGE_DIR/brainstorm.md" && \
   grep -q '^- \*\*下游状态：\*\* `CURRENT`' "$CHANGE_DIR/brainstorm.md"; then
  echo "  ✅ Legacy Full was lazily migrated to a confirmed Living brainstorm"
else
  echo "  ❌ FAIL: Legacy Full did not complete Living brainstorm migration"
  FAILURES=$((FAILURES + 1))
fi

run_turn "/opsx:apply $CHANGE_NAME；这是已有 tasks 的旧 Full change，保留内容但使用新的当前 Agent 执行器，不回填或调用旧 mode/commit 流程" "$OUTPUT_DIR/apply.json" 30
assert_bash_called "npx devkeel@latest openspec instructions apply" "$OUTPUT_DIR/apply.json"
assert_skill_triggered "review-orchestrator" "$OUTPUT_DIR/apply.json"
assert_skill_triggered "openspec-verify-change" "$OUTPUT_DIR/apply.json"
assert_bash_called "test -f MIGRATED_FULL.md" "$OUTPUT_DIR/apply.json"
assert_file_exists "$FIXTURE_DIR/MIGRATED_FULL.md"
assert_file_exists "$CHANGE_DIR/verify.md"
if extract_skill_calls "$OUTPUT_DIR/apply.json" | grep -Eq '(^|:)(writing-plans|executing-plans|subagent-driven-development|requesting-code-review|verification-before-completion|finishing-a-development-branch|test-driven-development|using-git-worktrees)$'; then
  echo "  ❌ FAIL: Migrated Full reactivated a legacy executor"
  FAILURES=$((FAILURES + 1))
else
  echo "  ✅ Migrated Full ignored legacy mode and commit directives"
fi
if grep -q '^- \[x\]' "$CHANGE_DIR/tasks.md"; then
  echo "  ✅ Migrated full advanced its task"
else
  echo "  ❌ FAIL: Migrated full did not advance its task"
  FAILURES=$((FAILURES + 1))
fi
if extract_bash_commands "$OUTPUT_DIR/apply.json" | grep -q 'openspec archive'; then
  echo "  ❌ FAIL: Migrated full bypassed its full lifecycle"
  FAILURES=$((FAILURES + 1))
else
  echo "  ✅ Migrated full preserved the full lifecycle"
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ PASS: opsx-migrated-full"
else
  echo "  ❌ FAIL: opsx-migrated-full ($FAILURES failures)"
fi
