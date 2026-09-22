#!/usr/bin/env python3
"""Render a structured Jira comment for the defect workflow."""

from __future__ import annotations

import argparse
from pathlib import Path


COMPACT_TITLE_BY_STAGE = {
    "intake": "缺陷信息",
    "triage": "分诊结论",
    "investigation": "根因分析",
    "e2e-repro": "E2E 复现",
    "fix-plan": "方案设计",
    "implementation": "实现说明",
    "verification": "已验证",
    "closure": "关闭结论",
    "gate-pass-sync": "关键信息",
}


def read_items(inline_values: list[str], file_paths: list[str]) -> list[str]:
    items = [value.strip() for value in inline_values if value.strip()]
    for file_path in file_paths:
        content = Path(file_path).read_text(encoding="utf-8").strip()
        if content:
            items.append(content)
    return items


def format_bullets(items: list[str]) -> str:
    lines: list[str] = []
    for item in items:
        normalized = item.rstrip().splitlines()
        if not normalized:
            continue
        lines.append(f"- {normalized[0]}")
        lines.extend(f"  {line}" for line in normalized[1:])
    return "\n".join(lines)


def add_section(lines: list[str], title: str, items: list[str]) -> None:
    body = format_bullets(items)
    if body:
        lines.extend([f"## {title}", body, ""])


def collapse_blank_lines(lines: list[str]) -> list[str]:
    collapsed: list[str] = []
    for line in lines:
        if line == "" and collapsed and collapsed[-1] == "":
            continue
        collapsed.append(line)
    while collapsed and collapsed[-1] == "":
        collapsed.pop()
    return collapsed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", required=True, help="Defect workflow stage")
    parser.add_argument("--fact", action="append", default=[], help="Confirmed fact bullet")
    parser.add_argument("--fact-file", action="append", default=[], help="File containing confirmed facts")
    parser.add_argument("--hypothesis", action="append", default=[], help="Hypothesis bullet")
    parser.add_argument("--hypothesis-file", action="append", default=[], help="File containing hypotheses")
    parser.add_argument("--unknown", action="append", default=[], help="Unknown or missing-evidence bullet")
    parser.add_argument("--unknown-file", action="append", default=[], help="File containing unknowns")
    parser.add_argument("--next-action", action="append", default=[], help="Recommended next-action bullet")
    parser.add_argument("--next-action-file", action="append", default=[], help="File containing next actions")
    parser.add_argument("--compact-title", help="Title for a compact Jira update")
    parser.add_argument("--compact", action="store_true", help="Render only a title and confirmed facts")
    parser.add_argument("--output", help="Output file; defaults to stdout")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    facts = read_items(args.fact, args.fact_file)
    hypotheses = read_items(args.hypothesis, args.hypothesis_file)
    unknowns = read_items(args.unknown, args.unknown_file)
    next_actions = read_items(args.next_action, args.next_action_file)

    lines: list[str] = []
    if args.compact:
        title = args.compact_title or COMPACT_TITLE_BY_STAGE.get(args.stage, "关键信息")
        add_section(lines, title, facts)
    else:
        lines.extend(["## 阶段", args.stage, ""])
        add_section(lines, "已确认事实", facts)
        add_section(lines, "假设", hypotheses)
        add_section(lines, "未知项 / 缺失证据", unknowns)
        add_section(lines, "建议下一步", next_actions)

    rendered = "\n".join(collapse_blank_lines(lines)).rstrip() + "\n"
    if args.output:
        Path(args.output).write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
