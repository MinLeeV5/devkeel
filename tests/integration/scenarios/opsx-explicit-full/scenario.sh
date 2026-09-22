#!/usr/bin/env bash
# Scenario: explicit full selection wins, then Living brainstorm asks one next question.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../../lib"

source "$LIB_DIR/run-turn.sh"
source "$LIB_DIR/extract.sh"
source "$LIB_DIR/assert.sh"

CHANGE_NAME="explicit-full"

echo "=== Scenario: opsx-explicit-full ==="
run_turn "/opsx:new $CHANGE_NAME --schema full" "$OUTPUT_DIR/turn-1.json" 8

assert_bash_called "openspec new change.*--schema full" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "npx devkeel@latest openspec status" "$OUTPUT_DIR/turn-1.json"
assert_bash_called "npx devkeel@latest openspec instructions" "$OUTPUT_DIR/turn-1.json"
assert_tool_called "AskUserQuestion" "$OUTPUT_DIR/turn-1.json"
assert_file_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME"
assert_file_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/brainstorm.md"
assert_file_not_exists "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/design.md"

if grep -q '^schema: full$' "$FIXTURE_DIR/openspec/changes/$CHANGE_NAME/.openspec.yaml"; then
  echo "  ✅ Explicit full selection was preserved"
else
  echo "  ❌ FAIL: Explicit full selection was not preserved"
  FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "  ✅ PASS: opsx-explicit-full"
else
  echo "  ❌ FAIL: opsx-explicit-full ($FAILURES failures)"
fi
