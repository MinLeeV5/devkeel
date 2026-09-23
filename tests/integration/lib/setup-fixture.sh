#!/usr/bin/env bash
# 创建临时 React TODO fixture 项目并执行 devkeel init
set -e

_FIXTURE_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$_FIXTURE_LIB_DIR/../../.." && pwd)"

setup_fixture() {
  local tmpdir
  tmpdir=$(mktemp -d "${TMPDIR:-/tmp}/harness-integration-XXXXXX")

  cat > "$tmpdir/package.json" <<'PKGJSON'
{
  "name": "todo-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
PKGJSON

  mkdir -p "$tmpdir/src"
  cat > "$tmpdir/src/App.tsx" <<'TSX'
import { useState } from 'react'

export default function App() {
  const [todos, setTodos] = useState<string[]>([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input.trim()])
      setInput('')
    }
  }

  return (
    <div>
      <h1>TODO App</h1>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>{todos.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  )
}
TSX

  cat > "$tmpdir/index.html" <<'HTML'
<!DOCTYPE html>
<html><head><title>TODO</title></head>
<body><div id="root"></div><script type="module" src="/src/App.tsx"></script></body>
</html>
HTML

  # Initialize git repo (needed for claude -p)
  git -C "$tmpdir" init -q
  git -C "$tmpdir" add -A
  git -C "$tmpdir" commit -q -m "init"

  # Create .harness structure manually (avoid TTY dependency from clack/prompts)
  local harness_dir="$tmpdir/.harness"
  mkdir -p "$harness_dir"

  # Copy skills, commands, and openspec from templates
  cp -r "$REPO_ROOT/templates/skills" "$harness_dir/"
  cp -r "$REPO_ROOT/templates/commands" "$harness_dir/"
  cp -r "$REPO_ROOT/templates/openspec" "$tmpdir/openspec"

  # Install the distributable routing contract with the fixture's empty scope.
  sed 's/{{SUBMODULE_SECTION}}/<!-- no subprojects -->/' \
    "$REPO_ROOT/templates/agents-md.md" > "$tmpdir/AGENTS.md"

  # Create CLAUDE.md for claude-code target
  cat > "$tmpdir/CLAUDE.md" <<'MD'
@AGENTS.md

# CLAUDE.md

## Project
todo-app — React TODO 应用

## Commands
npm run dev
npm run build
MD

  # Create .claude directory with symlinks (as devkeel init would)
  mkdir -p "$tmpdir/.claude"
  ln -sf "../.harness/skills" "$tmpdir/.claude/skills"
  ln -sf "../.harness/commands" "$tmpdir/.claude/commands"

  echo "$tmpdir"
}

cleanup_fixture() {
  local dir="$1"
  if [ -n "$dir" ] && [ -d "$dir" ]; then
    rm -rf "$dir"
  fi
}
