## 调查范围

聚焦 3 个 opsx skill 的预期行为流程，提取可断言的事件序列。

## 关键代码路径

### opsx:new (`templates/skills/openspec-new-change/SKILL.md`)

```
用户输入 → Skill("opsx:new")
  → [可选] AskUserQuestion（无输入时）
  → Bash: openspec new change "<name>"
  → Bash: openspec status --change "<name>"
  → Bash: openspec instructions <first-artifact> --change "<name>"
  → STOP（不创建 artifact，不调用 Write/Edit）
```

**可断言事件**：
1. `Skill` tool, skill 参数含 `openspec-new-change` 或 `opsx:new`
2. `Bash` 含 `openspec new change`
3. `Bash` 含 `openspec status`
4. `Bash` 含 `openspec instructions`
5. 无 `Write` / `Edit` tool 调用（guardrail）

### opsx:propose (`templates/skills/openspec-propose/SKILL.md`)

```
用户输入 → Skill("opsx:propose")
  → Bash: openspec new change "<name>"
  → Bash: openspec status --change "<name>" --json
  → Loop:
      → Bash: openspec instructions <artifact-id> --change "<name>" --json
      → Write: 创建 artifact 文件
      → Bash: openspec status --change "<name>" --json（检查进度）
  → 直到 applyRequires 全部完成
```

**可断言事件**：
1. `Skill` tool, skill 参数含 `openspec-propose` 或 `opsx:propose`
2. `Bash` 含 `openspec new change`
3. `Bash` 含 `openspec status`（至少 2 次）
4. `Write` tool 被调用（创建 artifact 文件）
5. 最终产出含 tasks artifact

### opsx:apply (`templates/skills/openspec-apply-change/SKILL.md`)

```
用户输入 → Skill("opsx:apply")
  → Bash: openspec status --change "<name>" --json
  → Bash: openspec instructions apply --change "<name>" --json
  → Read: 读取 contextFiles 中的文件
  → 执行器路由（由 instruction 字段动态决定）
    → 可能调用 omc ralph / omx ralph / subagent-driven-development
  → 实现 tasks → 标记完成
```

**可断言事件**：
1. `Skill` tool, skill 参数含 `openspec-apply-change` 或 `opsx:apply`
2. `Bash` 含 `openspec instructions apply`
3. `Read` tool 读取 context 文件
4. 执行器调用（`Bash` 含 `omc ralph` 或 `Skill` 含执行器 skill）

注意：apply 的执行器路由是动态的，取决于 `openspec instructions apply --json` 返回的 `instruction` 字段。测试时需确认该字段内容以确定期望的执行器。

## 测试覆盖

现有 `tests/` 目录全部是 vitest 单元测试，覆盖 lib 层函数。无集成测试、无 E2E 测试。`tests/integration/` 目录不存在。

## 风险与约束

| 风险 | 影响 | 缓解 |
|------|------|------|
| LLM 输出不确定性 | 同一 prompt 可能产生不同工具调用顺序 | 断言用"包含"而非"严格有序"；核心步骤用有序断言 |
| `--continue` 跨轮上下文丢失 | 长对话可能触发 context compaction | 控制每轮 max-turns，减少单轮复杂度 |
| openspec CLI 版本差异 | 命令输出格式可能变化 | 断言命令调用本身，不断言 CLI 输出内容 |
| token 消耗 | full-cycle 4+ 轮，每轮 opus 级别 | 提供 `--smoke` 模式只跑 opsx:new 单场景 |

---

## 下一步

在新会话中粘贴以下命令：

/opsx:continue integration-test-opsx-workflow
