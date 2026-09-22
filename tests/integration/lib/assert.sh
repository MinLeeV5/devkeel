#!/usr/bin/env bash
# 断言函数库

FAILURES=0

assert_bash_called() {
  local pattern="$1" json_file="$2"
  if source "$(dirname "${BASH_SOURCE[0]}")/extract.sh" && extract_bash_commands "$json_file" | grep -q "$pattern"; then
    echo "  ✅ Bash: \"$pattern\" called"
  else
    echo "  ❌ FAIL: Bash \"$pattern\" NOT called"
    FAILURES=$((FAILURES + 1))
  fi
}

assert_skill_triggered() {
  local skill="$1" json_file="$2"
  if source "$(dirname "${BASH_SOURCE[0]}")/extract.sh" && extract_skill_calls "$json_file" | grep -qE "(^|:)${skill}$"; then
    echo "  ✅ Skill \"$skill\" triggered"
  else
    echo "  ❌ FAIL: Skill \"$skill\" NOT triggered"
    FAILURES=$((FAILURES + 1))
  fi
}

assert_tool_called() {
  local tool="$1" json_file="$2"
  if source "$(dirname "${BASH_SOURCE[0]}")/extract.sh" && extract_tool_calls "$json_file" | grep -q "^${tool}:"; then
    echo "  ✅ Tool \"$tool\" called"
  else
    echo "  ❌ FAIL: Tool \"$tool\" NOT called"
    FAILURES=$((FAILURES + 1))
  fi
}

assert_not_called() {
  local tool="$1" json_file="$2"
  if source "$(dirname "${BASH_SOURCE[0]}")/extract.sh" && ! extract_tool_calls "$json_file" | grep -q "^${tool}:"; then
    echo "  ✅ No \"$tool\" calls (as expected)"
  else
    echo "  ❌ FAIL: \"$tool\" was called unexpectedly"
    FAILURES=$((FAILURES + 1))
  fi
}

assert_sequence() {
  local json_file="$1"
  shift
  local events=("$@")

  source "$(dirname "${BASH_SOURCE[0]}")/extract.sh"
  local all_calls
  all_calls=$(extract_tool_calls "$json_file")

  local last_pos=0
  local all_found=true

  for event in "${events[@]}"; do
    local tool="${event%%:*}"
    local pattern="${event#*:}"

    local found=false
    local pos=0
    while IFS= read -r line; do
      pos=$((pos + 1))
      if [ $pos -le $last_pos ]; then continue; fi
      if echo "$line" | grep -q "^${tool}:" && echo "$line" | grep -q "$pattern"; then
        last_pos=$pos
        found=true
        break
      fi
    done <<< "$all_calls"

    if [ "$found" = "false" ]; then
      echo "  ❌ FAIL: Sequence broken at \"$event\" (not found after position $last_pos)"
      FAILURES=$((FAILURES + 1))
      all_found=false
      break
    fi
  done

  if [ "$all_found" = "true" ]; then
    echo "  ✅ Event sequence verified (${#events[@]} events in order)"
  fi
}

assert_file_exists() {
  local filepath="$1"
  if [ -e "$filepath" ]; then
    echo "  ✅ File exists: $filepath"
  else
    echo "  ❌ FAIL: File missing: $filepath"
    FAILURES=$((FAILURES + 1))
  fi
}

assert_file_not_exists() {
  local filepath="$1"
  if [ ! -e "$filepath" ]; then
    echo "  ✅ File absent (as expected): $filepath"
  else
    echo "  ❌ FAIL: File unexpectedly exists: $filepath"
    FAILURES=$((FAILURES + 1))
  fi
}
