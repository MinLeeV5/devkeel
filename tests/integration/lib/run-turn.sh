#!/usr/bin/env bash
# 封装 claude -p 单轮执行
# Usage: source this file, then call run_turn

CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude 2>/dev/null || echo "$HOME/.local/bin/claude")}"

run_turn() {
  local prompt="$1"
  local output_file="$2"
  local max_turns="${3:-5}"
  local continue_flag="${4:-}"

  local args=(
    -p "$prompt"
    --verbose
    --output-format stream-json
    --dangerously-skip-permissions
    --max-turns "$max_turns"
  )

  if [ "$continue_flag" = "--continue" ]; then
    args+=(--continue)
  fi

  # macOS: use gtimeout if available, otherwise run without timeout
  local timeout_cmd=""
  if command -v gtimeout &>/dev/null; then
    timeout_cmd="gtimeout 300"
  elif command -v timeout &>/dev/null; then
    timeout_cmd="timeout 300"
  fi

  $timeout_cmd "$CLAUDE_BIN" "${args[@]}" < /dev/null > "$output_file" 2>&1 || true
}
