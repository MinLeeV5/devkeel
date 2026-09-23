---
name: changelog
description: Use when 编辑 changelog、发布 CLI 或模板版本、或判断某项用户可见变更是否需要进入版本记录。
metadata:
  author: "devkeel"
  version: "3.0.0"
triggers: ["changelog", "变更日志", "发版", "release", "版本记录"]
globs:
  - web/public/versions/cli/*.json
  - web/public/versions/templates/*.json
  - web/src/lib/version-catalog.ts
  - web/version-catalog.ts
  - web/server.ts
  - web/src/pages/changelog.tsx
  - web/src/pages/changelog/**/*.tsx
---

# changelog — 双版本流发布说明

本 skill 是 **rigid** 类型。每次发版只在对应版本流新增一个 JSON；版本正文不得写回 React、构建产物或根目录 CHANGELOG.md。

## 选择版本流

| 版本流 | 用户可见变更来源 | 权威版本号 | 新文件目录 |
|---|---|---|---|
| CLI | `src/`、`bin/`、`web/`、根 `package.json` | `package.json` 的 `version` | `web/public/versions/cli/` |
| Templates | `templates/` | `templates/package.json` 的 `version` | `web/public/versions/templates/` |

两条流独立发布、排序和计算 latest。一次发布同时涉及两条流时，分别新增 JSON，不合并版本号或文件。

以下内容不记录：`.harness/` dogfooding、`openspec/`、测试、CI 和无用户感知的内部重构。

## 单文件契约

文件名是 `versions` 最后一个值加 `.json`，不带 `v`。单版本示例：

```json
{
  "versions": ["0.8.11"],
  "releasedAt": { "from": "2026-07-13T18:00:00+08:00" },
  "title": "一句话概括主要变化",
  "archived": false,
  "groups": [
    {
      "type": "feat",
      "label": "新功能",
      "items": [
        {
          "name": "功能名",
          "description": "从用户视角说明变化，可使用 `行内代码`。"
        }
      ]
    }
  ]
}
```

约束：

- `versions` 非空、无重复，按旧到新排列；合并发布仍只用一个文件。
- `releasedAt.from/to` 使用带时区的 ISO 8601；`to` 不早于 `from`。
- 发布时间取对应 package 版本变更 commit 的 author date，不用当前时间代替历史时间。
- `type` 只能是 `feat`、`fix`、`breaking`、`refactor`、`docs`。
- `archived: false` 进入主列表，`true` 进入历史折叠区；没有分组的早期版本使用 `groups: []`。
- 每条版本流按发布时间排序后的最新条目必须使用 `archived: false`；最新版本不得藏入历史折叠区。
- `title`、group label、item name/description 均不得为空。

## 描述与 Markdown

- 只写用户通过 `devkeel init`、`devkeel update`、CLI 命令或公开 Web 页面能感知的变化。
- 标题不超过 30 字；item name 是短功能名，description 是一句用户收益或行为变化。
- 允许强调、行内代码、相对或 HTTP(S) 链接和换行。
- 禁止原始 HTML、fenced code、`javascript:`、`data:`、`mailto:` 和未知协议。
- 已发布能力的纯内部实现变化不重复记录；用户可感知的修复使用 `fix`。

## 发布流程

1. 读取两个 package 的当前版本，确定本次只发布 CLI、Templates 或两者分别发布。
2. 用对应 package 的前一版本 bump 到当前版本 bump 确定 Git 范围，只提炼已进入当前版本的用户可见变化。
3. 在对应目录新增一个 `<version>.json`；合并版本以末版本命名，`versions` 保留完整范围。
4. 不修改 `web/src/pages/changelog.tsx` 的版本正文、latest badge 或 Update Tip。Hono 启动时读取目录，React 从 `/api/versions` 自动展示 latest 和条目。
5. 运行定向校验，再运行生产构建；失败时修正 JSON，不以部分目录或 TSX fallback 降级。

```bash
pnpm --dir web exec vitest run tests/version-catalog.test.ts tests/changelog-data.test.ts
pnpm --dir web build
```

## 完成检查

- 新文件位于正确版本流，文件名等于 `versions` 末值。
- 版本号等于对应 package 当前版本，Git author timestamp 带时区。
- 对应版本流的最新条目为 `archived: false`。
- 内容属于当前发布范围，变化已按用户感知正确归类。
- JSON 不含原始 HTML，Markdown 链接协议符合白名单。
- 定向校验和 `pnpm --dir web build` 均以退出码 0 完成。
- `web/dist/versions/` 随构建生成但不提交；`web/src/pages/changelog.tsx` 未因发版改写版本正文。
