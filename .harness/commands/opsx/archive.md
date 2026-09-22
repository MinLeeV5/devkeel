---
name: "OPSX: Archive"
description: Archive an OpenSpec change with schema-aware closure gates
category: Workflow
tags: [workflow, archive, experimental]
---

Load and follow the `openspec-archive-change` skill.

Pass the optional change name, explicit `--force` or `--skip-specs` flags, and relevant hot context.
Return the archive result, spec-sync status, bypassed gates or blockers, and any separately available
delivery actions.
