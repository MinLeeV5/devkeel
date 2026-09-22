#!/usr/bin/env python3
"""Resolve a Jira destination status to the current transition action, read-only."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


def read_scalar(config_path: Path, key: str) -> str | None:
    if not config_path.is_file():
        return None
    pattern = re.compile(rf"^{re.escape(key)}:\s*(.+?)\s*$")
    for line in config_path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if not match:
            continue
        value = match.group(1).split(" #", 1)[0].strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        return value
    return None


def fail(message: str, *, code: int, details: dict[str, Any] | None = None) -> int:
    payload: dict[str, Any] = {"matched": False, "error": message}
    if details:
        payload.update(details)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return code


def fetch_transitions(server: str, issue_key: str, token: str, timeout: float) -> list[dict[str, Any]]:
    encoded_issue = urllib.parse.quote(issue_key, safe="")
    request = urllib.request.Request(
        f"{server.rstrip('/')}/rest/api/2/issue/{encoded_issue}/transitions",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.load(response)
    transitions = payload.get("transitions", [])
    return transitions if isinstance(transitions, list) else []


def normalize_transitions(items: list[dict[str, Any]]) -> list[dict[str, str | None]]:
    result: list[dict[str, str | None]] = []
    for item in items:
        target = item.get("to") if isinstance(item.get("to"), dict) else {}
        result.append(
            {
                "id": str(item.get("id")) if item.get("id") is not None else None,
                "action": str(item.get("name")) if item.get("name") is not None else None,
                "to_status": str(target.get("name")) if target.get("name") is not None else None,
            }
        )
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("issue_key", help="Jira issue key, for example DSSSYS-24596")
    parser.add_argument("--target-status", required=True, help="Destination Jira status name")
    parser.add_argument("--config", default=".jira.yml", help="Project Jira YAML path")
    parser.add_argument("--server", help="Jira server URL; defaults to .jira.yml server")
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--format", choices=("json", "action"), default="json")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    config_path = Path(args.config).expanduser().resolve()
    server = args.server or read_scalar(config_path, "server")
    if not server:
        return fail("Jira server is missing", code=2, details={"config": str(config_path)})

    auth_type = (read_scalar(config_path, "auth_type") or os.environ.get("JIRA_AUTH_TYPE") or "bearer").lower()
    if auth_type != "bearer":
        return fail(f"Unsupported auth_type: {auth_type}", code=2)

    token = os.environ.get("JIRA_API_TOKEN")
    if not token:
        return fail("JIRA_API_TOKEN is not available", code=2)

    try:
        raw_transitions = fetch_transitions(server, args.issue_key, token, args.timeout)
    except urllib.error.HTTPError as error:
        return fail(
            "Jira transitions API request failed",
            code=2,
            details={"http_status": error.code, "reason": error.reason},
        )
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        return fail("Jira transitions API request failed", code=2, details={"reason": str(error)})

    available = normalize_transitions(raw_transitions)
    target_key = args.target_status.strip().casefold()
    matches = [item for item in available if (item.get("to_status") or "").strip().casefold() == target_key]

    if len(matches) != 1:
        message = "Target status is not currently reachable" if not matches else "Target status is ambiguous"
        return fail(
            message,
            code=3,
            details={
                "issue": args.issue_key,
                "target_status": args.target_status,
                "available_transitions": available,
            },
        )

    match = matches[0]
    action = match.get("action")
    if not action:
        return fail("Matched transition has no action name", code=3, details={"transition": match})

    if args.format == "action":
        print(action)
        return 0

    print(
        json.dumps(
            {
                "matched": True,
                "issue": args.issue_key,
                "target_status": args.target_status,
                "transition_id": match.get("id"),
                "action": action,
                "to_status": match.get("to_status"),
                "available_transitions": available,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
