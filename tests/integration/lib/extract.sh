#!/usr/bin/env bash
# 从 stream-json 提取工具调用事件

extract_tool_calls() {
  local json_file="$1"
  jq -r 'select(.type == "assistant")
    | .message.content[]?
    | select(.type == "tool_use")
    | "\(.name):\(.input | tostring)"' "$json_file" 2>/dev/null
}

extract_bash_commands() {
  local json_file="$1"
  jq -r 'select(.type == "assistant")
    | .message.content[]?
    | select(.type == "tool_use" and .name == "Bash")
    | .input.command' "$json_file" 2>/dev/null
}

extract_skill_calls() {
  local json_file="$1"
  jq -r 'select(.type == "assistant")
    | .message.content[]?
    | select(.type == "tool_use" and .name == "Skill")
    | .input.skill' "$json_file" 2>/dev/null
}
