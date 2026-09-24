---
name: "OPSX: Explore"
description: "Enter explore mode - think through ideas, investigate problems, clarify requirements"
category: Workflow
tags: [workflow, explore, experimental, thinking]
---

Load and follow the `brainstorming` skill. Use its conditional reference-loading rules for
`references/openspec-context.md` and `references/living-brainstorm.md`; a raw topic does not load
OpenSpec references by default.

Pass the raw topic, optional explicit change name, and relevant hot context. Let the skill distinguish
topic-only from an already-authorized change-draft. Return current decisions, discussion stage, and
key gap. Ask one next question when a gap remains; otherwise request confirmation of the current
conclusion or snapshot. Never update application code or downstream planning artifacts.
