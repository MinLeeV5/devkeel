#!/usr/bin/env bash
# 批量执行所有集成测试场景
# Usage: ./run-all.sh [--smoke]
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SMOKE=false
if [ "${1:-}" = "--smoke" ]; then
  SMOKE=true
fi

if [ "$SMOKE" = "true" ]; then
  SCENARIOS=("opsx-new")
else
  SCENARIOS=(
    "workflow-routing"
    "opsx-new"
    "opsx-ff"
    "opsx-lite-cycle"
    "opsx-explicit-full"
    "opsx-migrated-full"
    "opsx-full-cycle"
  )
fi

echo "=== Integration Tests ==="
echo "Mode: $([ "$SMOKE" = "true" ] && echo "smoke" || echo "full")"
echo "Scenarios: ${SCENARIOS[*]}"
echo ""

PASSED=0
FAILED=0
RESULTS=()

for scenario in "${SCENARIOS[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if "$SCRIPT_DIR/run-scenario.sh" "$scenario"; then
    PASSED=$((PASSED + 1))
    RESULTS+=("✅ $scenario")
  else
    FAILED=$((FAILED + 1))
    RESULTS+=("❌ $scenario")
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "=== Summary ==="
for result in "${RESULTS[@]}"; do
  echo "  $result"
done
echo ""
echo "Passed: $PASSED / Failed: $FAILED / Total: $((PASSED + FAILED))"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
