#!/usr/bin/env bash
# 执行单个集成测试场景
# Usage: ./run-scenario.sh <scenario-name>
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure claude is in PATH
export PATH="$HOME/.local/bin:$PATH"

source "$SCRIPT_DIR/lib/setup-fixture.sh"

SCENARIO_NAME="${1:?Usage: $0 <scenario-name>}"
SCENARIO_DIR="$SCRIPT_DIR/scenarios/$SCENARIO_NAME"

if [ ! -f "$SCENARIO_DIR/scenario.sh" ]; then
  echo "❌ Scenario not found: $SCENARIO_NAME"
  echo "Available scenarios:"
  ls "$SCRIPT_DIR/scenarios/" 2>/dev/null || echo "  (none)"
  exit 1
fi

echo "Setting up fixture project..."
FIXTURE_DIR=$(setup_fixture)
export FIXTURE_DIR

# Keep agent transcripts outside the Git worktree so fingerprint checks only see
# implementation and planning files. The fixture cleanup removes this directory.
OUTPUT_DIR="$FIXTURE_DIR/.git/harness-test-output"
mkdir -p "$OUTPUT_DIR"
export OUTPUT_DIR

echo "Fixture: $FIXTURE_DIR"
echo ""

# Run scenario in fixture directory
cd "$FIXTURE_DIR"
source "$SCENARIO_DIR/scenario.sh"

RESULT=$FAILURES

# Cleanup
echo ""
echo "Cleaning up fixture..."
cleanup_fixture "$FIXTURE_DIR"

exit "$RESULT"
