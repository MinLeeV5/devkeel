#!/usr/bin/env bash

set -euo pipefail

# 从项目根目录 .jira.yml 读取配置，若不存在则使用默认值
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
JIRA_CONFIG_YAML="${PROJECT_ROOT}/.jira.yml"

if [[ -f "${JIRA_CONFIG_YAML}" ]]; then
  SERVER="$(grep -E '^server:' "${JIRA_CONFIG_YAML}" | sed 's/server:[[:space:]]*//')"
  PROJECT="$(grep -E '^project:' "${JIRA_CONFIG_YAML}" | sed 's/project:[[:space:]]*//')"
  COMPONENT="$(grep -E '^component:' "${JIRA_CONFIG_YAML}" | sed 's/component:[[:space:]]*//')"
  AUTH_TYPE="$(grep -E '^auth_type:' "${JIRA_CONFIG_YAML}" | sed 's/auth_type:[[:space:]]*//')"
else
  SERVER="${JIRA_SERVER:-}"
  PROJECT="${JIRA_PROJECT:-}"
  COMPONENT="${JIRA_COMPONENT:-}"
  AUTH_TYPE="${JIRA_AUTH_TYPE:-bearer}"
fi

INSTALLATION="local"
PROFILE_FILE="${HOME}/.bashrc"
CONFIG_FILE="${JIRA_CONFIG_FILE:-${HOME}/.config/.jira/.config.yml}"
SKIP_INIT=false

usage() {
  cat <<'EOF'
Usage: ./.harness/skills/jira-defect-orchestrator/scripts/setup-jira-cli.sh [options]

Options:
  --profile <path>      Write env vars to a custom shell profile path
  --config-file <path>  Initialize jira-cli with a custom config file path
  --skip-init           Only install jira-cli and write env vars, skip jira init
  --help                Show this help

The script reads server/project/component from .jira.yml in the project root.
It will:
  1. Install jira-cli via Homebrew if it is missing
  2. Prompt for a Jira API token
  3. Write JIRA_AUTH_TYPE and JIRA_API_TOKEN to ~/.bashrc by default
  4. Run jira init with the .jira.yml defaults
EOF
}

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

require_prompt_input() {
  [[ -t 0 ]] || fail "当前 shell 不是交互式终端，无法读取输入。请在本地终端直接执行此脚本。"
}

ensure_brew() {
  command -v brew >/dev/null 2>&1 || fail "未检测到 Homebrew，请先安装 brew。"
}

ensure_jira_cli() {
  if command -v jira >/dev/null 2>&1; then
    say "jira-cli 已安装: $(jira version)"
    return
  fi

  ensure_brew
  say "通过 Homebrew 安装 jira-cli..."
  brew tap ankitpokhrel/jira-cli
  brew install jira-cli
  say "jira-cli 安装完成: $(jira version)"
}

prompt_for_token() {
  local token=""

  require_prompt_input

  say "请先访问以下页面获取 Jira API Token："
  say "  ${SERVER}/secure/ViewProfile.jspa"

  while [[ -z "${token}" ]]; do
    read -r -s -p "请输入 Jira API Token: " token
    printf '\n'
    token="$(trim "${token}")"
  done

  JIRA_API_TOKEN_INPUT="${token}"
}

upsert_profile_export() {
  local key="$1"
  local value="$2"
  local escaped=""
  local temp_file=""

  mkdir -p "$(dirname "${PROFILE_FILE}")"
  touch "${PROFILE_FILE}"

  temp_file="$(mktemp)"
  awk -v prefix="export ${key}=" 'index($0, prefix) != 1 { print }' "${PROFILE_FILE}" > "${temp_file}"
  printf -v escaped '%q' "${value}"
  printf 'export %s=%s\n' "${key}" "${escaped}" >> "${temp_file}"
  mv "${temp_file}" "${PROFILE_FILE}"
}

backup_existing_config() {
  local backup_file=""

  [[ -f "${CONFIG_FILE}" ]] || return 0

  backup_file="${CONFIG_FILE}.bak.$(date +%Y%m%d%H%M%S)"
  cp "${CONFIG_FILE}" "${backup_file}"
  say "已备份现有 jira-cli 配置到 ${backup_file}"
}

run_jira_init() {
  mkdir -p "$(dirname "${CONFIG_FILE}")"
  require_prompt_input
  backup_existing_config

  say "执行 jira init..."
  jira -c "${CONFIG_FILE}" init \
    --installation "${INSTALLATION}" \
    --server "${SERVER}" \
    --project "${PROJECT}" \
    --auth-type "${AUTH_TYPE}" \
    --force
}

verify_setup() {
  say "执行最小校验..."
  jira -c "${CONFIG_FILE}" me
  jira -c "${CONFIG_FILE}" serverinfo
  say "提醒：component=${COMPONENT} 不是 jira-cli 全局配置项，查询时仍需显式带 -C ${COMPONENT}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE_FILE="$2"
      shift 2
      ;;
    --config-file)
      CONFIG_FILE="$2"
      shift 2
      ;;
    --skip-init)
      SKIP_INIT=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "未知参数: $1"
      ;;
  esac
done

main() {
  ensure_jira_cli
  prompt_for_token

  upsert_profile_export "JIRA_AUTH_TYPE" "${AUTH_TYPE}"
  upsert_profile_export "JIRA_API_TOKEN" "${JIRA_API_TOKEN_INPUT}"

  export JIRA_AUTH_TYPE="${AUTH_TYPE}"
  export JIRA_API_TOKEN="${JIRA_API_TOKEN_INPUT}"

  say "已将 JIRA_AUTH_TYPE 和 JIRA_API_TOKEN 写入 ${PROFILE_FILE}"

  if [[ "${SKIP_INIT}" == "true" ]]; then
    say "已跳过 jira init。后续可手动执行："
    say "  jira -c ${CONFIG_FILE} init --installation ${INSTALLATION} --server ${SERVER} --project ${PROJECT} --auth-type ${AUTH_TYPE} --force"
    exit 0
  fi

  say "接下来进入 jira-cli 自带的 jira init 交互流程。"
  run_jira_init
  verify_setup

  say "配置完成。新开 shell 后可执行：source ${PROFILE_FILE}"
}

main "$@"
