# Skills 原生适配验证记录

日期：2026-09-18。Change：`adapt-codex-claude-native-assets`，schema：`lite`。
实施基线：`4a2a99955aa03ce38ffb4e6a8845c5b68818edd9`。任务 6/6 完成。

## 实现与范围

- 共享 `SKILL.md` 保留流程与授权门禁；5 个相关技能同步模板、使用副本和 patch 版本，新增按需 Codex UI 元数据。原有调用策略保持原意，非标准 `triggers` 迁入 description；verify-init 的平台工具说明拆成按需参考。
- `.claude/skills`、`.agents/skills` 整目录链接 `.harness/skills`，新增或编辑技能无需重新同步。未生成独立平台技能副本，因此归属清单记录链接目标，没有引入无实际写入对象的文件 hash 管理。
- init、sync、update、doctor 接入 skills 预检。已知旧链接可接管；真实目录、文件、未知链接和被改向的受管链接默认保留并停止。
- init/sync 的显式 `--force` 先备份整批冲突，再替换 skills 入口；备份失败不覆盖。状态和备份路径本地忽略，update 现有自动提交路径排除这两项。
- Codex/Claude 的其他平台文件、目录及断链保持原样；没有修改 `.harness/agents` 或实现两端 agent 格式转换。README 及 CLI 帮助同步说明。

## 自动化验证

| 验证 | 结果 |
|---|---|
| `pnpm exec vitest run` | 451/451 通过，0 skipped |
| `pnpm lint` | 通过 |
| `pnpm build` | ESM 与 DTS 构建通过 |
| 指令 diff 审计、技能 validator | 无模板镜像漂移，5 个变更技能入口有效 |
| `git diff --check` | 通过 |
| init/sync/doctor/update `--help` | 命令 Usage 与选项符合实际语义 |

重点覆盖：源新增与编辑直读、重复同步、已知旧链接接管、整批冲突无写入、错误目标及断链、平台父目录保护、无效清单、强制备份文件/目录/链接、后续备份失败、替换失败回退、部分删除失败定位、无关资产保留、doctor 入口与原生元数据检查、错误配置诊断。

全量测试发现并修正了既有 brainstorming 版本断言漂移：基线模板为 8.0.2，部分测试仍期待 8.0.1。本次未修改 brainstorming 内容或版本；初始化/更新断言改为跟随模板事实源。

## 两端实际运行

可复跑入口：[native-skills.mjs](../../../../tests/integration/native-skills.mjs)。该脚本需已安装并登录平台 CLI，运行会使用平台额度；每个场景限定 120 秒。Codex 使用 read-only sandbox；Claude 仅开放 Read/Skill、dontAsk 权限模式并隔离 MCP。测试项目运行后删除。

```bash
node tests/integration/native-skills.mjs openspec/changes/archive/2026-09-18-adapt-codex-claude-native-assets/native-skills.json
```

结构化结果见 [native-skills.json](native-skills.json)，含版本、输入、退出码、结果摘录及读取判定；不包含认证信息或全量会话提示。

| 场景 | Codex 0.153.4 | Claude Code 2.1.235 |
|---|---|---|
| 原生显式调用 `$skill` / `/skill` | PASS | PASS |
| 描述命中的隐式触发 | PASS | PASS |
| 不相关算术请求不读取或触发技能 | PASS | PASS |
| 修改共享源后免同步调用 | PASS | PASS |
| 新增共享技能后免同步调用 | PASS | PASS |
| 实际 verify-init 按平台读取参考、说明文档不可用降级 | PASS | PASS |

共 12/12 通过。探针技能同时包含 Claude frontmatter、Codex `agents/openai.yaml` 和两份平台参考；随机回执不在用户输入中，必须读取共享正文及对应参考才能返回。轨迹确认只读当前平台的参考文件，未读取另一平台参考。实际 verify-init 使用原样模板，保留只读请求的权限边界；测试没有安装框架或生成项目文件。

每个用例开启新 CLI 会话：新增、修改后无需 Harness sync 已实证；运行中会话的技能菜单热刷新未验证，不承诺无需重开会话。探针验证了平台扩展共存和调用路径，不代表逐项穷举所有平台配置字段或全部技能业务流程。

## 审查与剩余边界

按 review-orchestrator 的 deep 路径由 CLI 专项 reviewer 审查，定向修复后结论 APPROVE，未发现遗留 P0/P1。修复了非 skills 同名文件/断链保护、doctor 错误 targets 类型诊断和修复失败退出状态。

递归删除冲突入口若在中途因权限等原因失败，备份仍完整；命令返回失败、明确报告可能已变化的入口及备份恢复路径，需要手动恢复。一般链接创建/状态写入失败会尝试自动回退，但不保证所有文件系统故障都能自动恢复。

验证环境为 macOS；Windows junction 未在 Windows 实机运行。验证阶段未执行 commit、push 或版本发布。用户随后明确授权归档、提交和 push；本 change 已于 2026-09-18 经普通 OpenSpec archive 归档，没有使用 force 或修改 main specs。
