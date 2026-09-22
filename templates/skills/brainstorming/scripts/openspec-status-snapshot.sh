#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ] || [ -z "$1" ]; then
  echo "usage: openspec-status-snapshot.sh <change-name>" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "openspec-status-snapshot.sh: jq is required" >&2
  exit 127
fi

npx devkeel@latest openspec status --change "$1" --json |
  jq -c --arg changeName "$1" '{
    changeName: $changeName,
    schemaName,
    isPlanningComplete: (.isPlanningComplete // .isComplete // false),
    applyRequires: (.applyRequires // []),
    artifacts: [(.artifacts // [])[] | {
      id,
      status,
      requires: (.requires // [])
    }],
    planningHome,
    changeRoot,
    existingArtifacts: (
      (.artifactPaths // {})
      | with_entries(.value = (.value.existingOutputPaths // []))
    ),
    actionContext: {
      mode: .actionContext.mode,
      sourceOfTruth: .actionContext.sourceOfTruth,
      planningArtifacts: .actionContext.planningArtifacts,
      linkedContext: .actionContext.linkedContext,
      requiresAffectedAreaSelection: .actionContext.requiresAffectedAreaSelection,
      constraints: .actionContext.constraints
    }
  }'
