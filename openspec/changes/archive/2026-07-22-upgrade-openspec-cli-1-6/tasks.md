# 实施任务

- [x] **1. OpenSpec 1.6.0 成为 Harness 的受支持运行时**
  - **结果：** Harness 精确安装并报告 OpenSpec 1.6.0，Node 声明与依赖实际要求一致，现有 CLI wrapper 无需兼容分支即可透传受支持命令。
  - **范围：** `package.json`、`pnpm-lock.yaml`、适用的运行环境文档与 OpenSpec wrapper 测试。
  - **验证：** `pnpm install --frozen-lockfile && pnpm build && node bin/devkeel.js openspec --version`

- [x] **2. 现有 11 个 OPSX workflow 与 1.6.0 上游基线保持可审计一致**
  - **结果：** 每个本地化 skill 都准确记录 1.6.0 provenance/compatibility，适用的官方语义已移植，Store 与 Harness 门禁差异被保留为显式本地不变量，dogfood、分发模板和版本表同步。
  - **范围：** `templates/skills/openspec-*`、`.harness/skills/openspec-*`、两份 `versions.yml`、OPSX delta spec、`tests/openspec-skills-upstream.test.ts`、模板一致性测试。
  - **验证：** `pnpm exec vitest run tests/openspec-skills-upstream.test.ts tests/templates.test.ts tests/config.test.ts`

- [x] **3. Harness 直接依赖的 1.6 校验与归档安全行为有回归保护**
  - **结果：** 测试覆盖无 `proposal.md` 的自定义 change、嵌套及 Lite 可选 delta spec、失败 archive 非零退出、过期 MODIFIED Scenario 防丢失，并保持 Lite/Full new/status/instructions 行为。
  - **范围：** `tests/openspec.test.ts` 及必要的测试 fixture/helper。
  - **验证：** `pnpm exec vitest run tests/openspec.test.ts`

- [x] **4. 升级达到发布质量且用户可见变化有记录**
  - **结果：** 聚焦测试、全量测试、lint 和最终 diff 审查通过；适用 changelog 准确说明升级收益与边界，未混入 Stores、`/opsx:update` 或既有用户修改的回退。
  - **范围：** 最终受影响文件与 OpenSpec change 状态；本 change 不发版，版本 JSON 延后到实际 release。
  - **验证：** `pnpm test && pnpm run lint && git diff --check`
