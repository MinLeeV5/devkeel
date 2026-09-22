# Retrospective: improve-init-command

## §0 Evidence

| Metric | Value |
|--------|-------|
| Commits | ~10 (e770386..900ef27) |
| Files changed | ~15 |
| Lines added | ~1100+ |
| Lines removed | ~300+ |
| Task completion | 20/21 (95%) |
| Test coverage signal | 58 tests passed (task 7.2) |
| OpenSpec validate | ✅ change valid |
| Deferred tasks | 1 (7.3 手动验证) |
| New dependencies | 0 |
| Post-merge bugs | 0 observed |

**Commit chain:**
```
e770386 feat(init): 增量更新 openspec、平台目录备份重建、legacy 文件清理
ab2707a test(init): 新增 templates 工具函数测试
88344b7 refactor(update): 使用通用废弃产物检测替代 stage-* 硬编码模式
06d3094 fix(openspec): 增量更新补充根配置文件和动态 schema 发现
e3fef4f fix(openspec): 增量更新时补充已有 schema 目录内缺失的文件
4838a86 refactor(init): 移除平台目录 .bak 备份机制，改为直接重建
73617fa fix(init): 简化 setup 脚本并跳过空子模块
900ef27 feat(init): 区分主仓库和领域子仓库，智能覆写 CLAUDE.md/AGENTS.md
```

## §1 Wins

- 增量更新策略（e770386）正确解决了"重复 init 不覆盖用户已有配置"的核心需求，避免破坏性重写
- 备份机制先引入后移除（4838a86）说明设计在实践中被快速验证为过度设计，果断删除是好决策
- 测试先行（ab2707a）为后续重构提供了安全网，后续 refactor 未引入回归
- 主仓库/子仓库区分（900ef27）是需求分析阶段识别的核心用例，实现完整

## §2 Misses

- 🟡 openspec 增量更新逻辑经历了 3 次修复（e770386 → 06d3094 → e3fef4f），说明初始设计未充分考虑边界情况（已有 schema 目录但文件不完整、根配置文件缺失）
- 📌 task 7.3 手动验证未执行，手动冒烟测试无等价自动化覆盖

## §3 Plan Deviation

| Task | Plan | Actual | Why |
|------|------|--------|-----|
| 2.x 备份机制 | 引入 .bak 备份 | 引入后移除，改为直接重建 | 实践中 .bak 文件增加复杂度无收益 |
| 5.x openspec 增量 | 一次实现 | 3 次迭代修复 | 边界情况（部分存在的 schema 目录）未在 spec 中覆盖 |

## §4 Skill/Workflow Compliance

| Skill | Used? | Notes |
|-------|-------|-------|
| superpowers:using-git-worktrees | ✗ | 直接在 master 开发 |
| superpowers:test-driven-development | ✓ | ab2707a 先写测试 |
| superpowers:requesting-code-review | ✗ | 未调用 code review |
| superpowers:finishing-a-development-branch | ✗ | 无独立分支 |

### Deliberately Skipped Skills

**superpowers:using-git-worktrees**
- **Skipped what**: git worktree isolation
- **Why this round**: 本次变更在 openspec schema 引入 superpowers-bridge 之前开始实现，当时工作流尚未强制 worktree
- **Prevention**: 现在 schema 已包含 apply instruction 强制 worktree，后续变更自动触发

**superpowers:requesting-code-review**
- **Skipped what**: 每个任务完成后的 code review
- **Why this round**: 同上，变更开始时 schema 未强制
- **Prevention**: 同上，apply instruction 已覆盖

**superpowers:finishing-a-development-branch**
- **Skipped what**: 独立分支 + PR 流程
- **Why this round**: 直接在 master 开发，无独立 feature branch
- **Prevention**: apply instruction 中 worktree 自动创建独立分支

## §5 Surprises

- openspec 增量更新的"已有但不完整"状态比预期复杂 — 用户可能手动删除了部分文件，或从旧版本升级时目录结构变化
- 子仓库场景下 CLAUDE.md 需要完全不同的模板（domain 模板），这在 brainstorm 阶段未预见，900ef27 中后期追加

## §6 Promotion Candidates → Long-term Learning

- [ ] 🟡 openspec 增量更新需要防御性编程
  → **Promote to** memory (feedback)
  > **Why**: 3 次修复暴露了"存在性检查 ≠ 完整性检查"
  > **How to apply**: 写文件系统操作时，区分"目录存在"和"目录内容完整"

- [ ] 📌 手动验证任务需要等价自动化测试
  → **Promote to** schema (verify §7 已覆盖此规则)
  > **Why**: task 7.3 是唯一未完成项，无自动化替代
  > **How to apply**: 在 tasks 阶段为每个手动验证任务标注等价 e2e 测试

- [x] 🟡 apply 阶段缺少 worktree/TDD/code-review 强制
  → **Promote to** schema (已完成 — superpowers-bridge v3 apply instruction)
  > **Why**: 本轮跳过了 3 个 skill
  > **How to apply**: apply instruction 已在 v3 中强制
