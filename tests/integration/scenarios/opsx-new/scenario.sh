#!/usr/bin/env bash
# Scenario: opsx:new 工作流验证
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../../lib"

source "$LIB_DIR/run-turn.sh"
source "$LIB_DIR/extract.sh"
source "$LIB_DIR/assert.sh"

echo "=== Scenario: opsx-new ==="

# Turn 1: /opsx:new
echo "  Turn 1: /opsx:new \"add-user-auth\""
run_turn '/opsx:new "add-user-auth"' "$OUTPUT_DIR/turn-1.json" 8

echo ""
echo "  Assertions:"
assert_bash_called "npx devkeel@latest openspec new change" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "openspec new change.*--schema lite" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "npx devkeel@latest openspec status" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "npx devkeel@latest openspec instructions" "$OUTPUT_DIR/turn-1.json"
assert_tool_called "Write" "$OUTPUT_DIR/turn-1.json"
assert_tool_called "AskUserQuestion" "$OUTPUT_DIR/turn-1.json"

# Verify file system
assert_file_exists "$FIXTURE_DIR/openspec/changes/add-user-auth"
assert_file_exists "$FIXTURE_DIR/openspec/changes/add-user-auth/brainstorm.md"
assert_file_not_exists "$FIXTURE_DIR/openspec/changes/add-user-auth/design.md"
assert_file_not_exists "$FIXTURE_DIR/openspec/changes/add-user-auth/tasks.md"
if grep -q '^> \*\*状态：\*\* `DRAFT`' "$FIXTURE_DIR/openspec/changes/add-user-auth/brainstorm.md"; then
  echo "  ✅ New initialized a Draft Living brainstorm"
else
  echo "  ❌ FAIL: New did not initialize a Draft Living brainstorm"
  FAILURES=$((FAILURES + 1))
fi
if grep -q '^schema: lite$' "$FIXTURE_DIR/openspec/changes/add-user-auth/.openspec.yaml"; then
  echo "  ✅ No-context /opsx:new selected lite"
else
  echo "  ❌ FAIL: No-context /opsx:new did not select lite"
  FAILURES=$((FAILURES + 1))
fi

# Turn 2: an explicit schema overrides the no-context lite fallback.
echo ""
echo "  Turn 2: /opsx:new \"explicit-full\" --schema full"
run_turn '/opsx:new "explicit-full" --schema full' "$OUTPUT_DIR/turn-2.json" 8
assert_bash_called "openspec new change.*--schema full" "$OUTPUT_DIR/turn-2.json"
assert_file_exists "$FIXTURE_DIR/openspec/changes/explicit-full"
if grep -q '^schema: full$' "$FIXTURE_DIR/openspec/changes/explicit-full/.openspec.yaml"; then
  echo "  ✅ Explicit schema override selected full"
else
  echo "  ❌ FAIL: Explicit schema override was not honored"
  FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ PASS: opsx-new"
else
  echo "  ❌ FAIL: opsx-new ($FAILURES failures)"
fi
