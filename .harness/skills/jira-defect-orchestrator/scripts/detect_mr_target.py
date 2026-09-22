#!/usr/bin/env python3
"""Detect the MR target branch for a repository or parent submodule."""

from __future__ import annotations

import argparse
import configparser
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


DELIVERY_PREFIXES = ("codex/", "fix/", "bugfix/", "hotfix/")
LONG_LIVED_PREFIXES = ("develop/", "release/")
LONG_LIVED_NAMES = {"develop", "dev", "main", "master", "test"}


def git(repo: Path, *args: str) -> Tuple[int, str]:
    result = subprocess.run(
        ["git", "-C", str(repo), *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    return result.returncode, result.stdout.strip()


def repo_root(repo: Path) -> Path:
    code, output = git(repo, "rev-parse", "--show-toplevel")
    if code != 0 or not output:
        raise ValueError(f"not a Git repository: {repo}")
    return Path(output).resolve()


def current_branch(repo: Path) -> Optional[str]:
    code, output = git(repo, "symbolic-ref", "--quiet", "--short", "HEAD")
    return output if code == 0 and output else None


def read_parent_submodule(repo: Path) -> Optional[Dict[str, str]]:
    for parent in repo.parents:
        modules_file = parent / ".gitmodules"
        if not modules_file.is_file():
            continue
        try:
            relative = repo.relative_to(parent).as_posix()
        except ValueError:
            continue
        parser = configparser.ConfigParser()
        parser.read(modules_file, encoding="utf-8")
        for section in parser.sections():
            if not section.startswith("submodule "):
                continue
            if parser.get(section, "path", fallback="") != relative:
                continue
            return {
                "parent_root": str(parent),
                "submodule_path": relative,
                "configured_branch": parser.get(section, "branch", fallback="").strip(),
                "ignore": parser.get(section, "ignore", fallback="").strip(),
            }
    return None


def normalize_remote_branch(name: str) -> Optional[str]:
    branch = name.strip()
    if not branch or branch.endswith("/HEAD") or " -> " in branch:
        return None
    if branch.startswith("origin/"):
        return branch[len("origin/") :]
    return branch.split("/", 1)[1] if "/" in branch else branch


def is_long_lived(branch: str) -> bool:
    return branch in LONG_LIVED_NAMES or branch.startswith(LONG_LIVED_PREFIXES)


def rank(branch: str) -> Tuple[int, str]:
    if branch.startswith("develop/"):
        return 0, branch
    if branch == "develop":
        return 1, branch
    if branch.startswith("release/"):
        return 2, branch
    if branch in {"main", "master", "dev", "test"}:
        return 3, branch
    return 9, branch


def remote_points_at(repo: Path, revision: str) -> List[str]:
    code, output = git(repo, "branch", "-r", "--points-at", revision, "--format=%(refname:short)")
    if code != 0:
        return []
    branches = {normalize_remote_branch(line) for line in output.splitlines()}
    return sorted((branch for branch in branches if branch and is_long_lived(branch)), key=rank)


def remote_default(repo: Path) -> Optional[str]:
    code, output = git(repo, "symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD")
    if code != 0:
        return None
    return normalize_remote_branch(output)


def detect(repo: Path) -> Dict[str, object]:
    root = repo_root(repo)
    branch = current_branch(root)
    parent = read_parent_submodule(root)
    candidates: List[str] = []

    if parent and parent.get("configured_branch"):
        target = parent["configured_branch"]
        return {
            "repo_root": str(root),
            "repo_name": root.name,
            "current_branch": branch,
            "target_branch": target,
            "source": "parent .gitmodules branch",
            "confidence": "high",
            "candidates": [target],
            "parent_submodule": parent,
        }

    if branch and not branch.startswith(DELIVERY_PREFIXES) and is_long_lived(branch):
        return {
            "repo_root": str(root),
            "repo_name": root.name,
            "current_branch": branch,
            "target_branch": branch,
            "source": "current long-lived branch",
            "confidence": "high",
            "candidates": [branch],
            "parent_submodule": parent,
        }

    candidates.extend(remote_points_at(root, "HEAD"))
    if branch and branch.startswith(DELIVERY_PREFIXES):
        code, parent_commit = git(root, "rev-parse", "HEAD^")
        if code == 0 and parent_commit:
            candidates.extend(remote_points_at(root, parent_commit))

    default = remote_default(root)
    if default and is_long_lived(default):
        candidates.append(default)

    ordered = sorted(set(candidates), key=rank)
    target = ordered[0] if ordered else None
    return {
        "repo_root": str(root),
        "repo_name": root.name,
        "current_branch": branch,
        "target_branch": target,
        "source": "remote branch evidence" if target else "unresolved",
        "confidence": "medium" if target else "none",
        "candidates": ordered,
        "parent_submodule": parent,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", default=".", help="Repository path (default: current directory)")
    args = parser.parse_args()
    try:
        result = detect(Path(args.repo).expanduser().resolve())
    except ValueError as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False, indent=2))
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["target_branch"] else 2


if __name__ == "__main__":
    sys.exit(main())
