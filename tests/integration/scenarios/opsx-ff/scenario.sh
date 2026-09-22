#!/usr/bin/env bash
# Scenario: opsx:ff 在快照已确认后完成 Lite 封闭投影
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../../lib"

source "$LIB_DIR/run-turn.sh"
source "$LIB_DIR/extract.sh"
source "$LIB_DIR/assert.sh"

echo "=== Scenario: opsx-ff ==="

echo "  Turn 1: /opsx:ff with an explicitly confirmed snapshot"
run_turn '/opsx:ff add-verbose-flag。以下是完整且由我明确确认的 D/A 快照，没有开放项：D-01 为 TODO CLI 增加 --verbose flag；D-02 默认行为不变；D-03 开启后把既有详细日志写到 stderr；D-04 通过 CLI 聚焦测试和 typecheck 验证。A-01 允许 Agent 按仓库既有参数解析惯例决定内部函数命名。我确认以上全部快照。默认 lite；只做封闭投影并停止在 Apply 前，不要实现。' "$OUTPUT_DIR/turn-1.json" 30

echo ""
echo "  Assertions:"
assert_bash_called "npx devkeel@latest openspec new change" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "openspec new change.*--schema lite" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "npx devkeel@latest openspec status" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "npx devkeel@latest openspec instructions" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "planning-state.mjs" "$OUTPUT_DIR/turn-1.json"
assert_tool_called "Write" "$OUTPUT_DIR/turn-1.json"

CHANGE_DIR="$FIXTURE_DIR/openspec/changes/add-verbose-flag"
assert_file_exists "$CHANGE_DIR"
assert_file_exists "$CHANGE_DIR/brainstorm.md"
assert_file_exists "$CHANGE_DIR/tasks.md"
assert_file_not_exists "$CHANGE_DIR/design.md"
assert_file_not_exists "$CHANGE_DIR/specs"
assert_file_not_exists "$CHANGE_DIR/verify.md"
assert_file_not_exists "$CHANGE_DIR/retrospective.md"

if grep -q '^schema: lite$' "$CHANGE_DIR/.openspec.yaml"; then
  echo "  ✅ Explicit /opsx:ff selected default lite"
else
  echo "  ❌ FAIL: Explicit /opsx:ff did not select lite"
  FAILURES=$((FAILURES + 1))
fi

if grep -q '^> \*\*状态：\*\* `CONFIRMED`' "$CHANGE_DIR/brainstorm.md" && \
   grep -q '^- \*\*下游状态：\*\* `CURRENT`' "$CHANGE_DIR/brainstorm.md"; then
  echo "  ✅ FF preserved explicit confirmation and completed current projection"
else
  echo "  ❌ FAIL: FF did not produce a confirmed current Living brainstorm"
  FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ PASS: opsx-ff"
else
  echo "  ❌ FAIL: opsx-ff ($FAILURES failures)"
fi
