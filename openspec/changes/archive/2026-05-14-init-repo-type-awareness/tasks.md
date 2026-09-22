## 1. 数据模型扩展

- [x] 1.1 在 `src/lib/config.ts` 的 `HarnessConfig` 接口中新增 `project.repoType: 'main' | 'domain'` 字段（可选，向后兼容）
- [x] 1.2 在 `src/lib/config.ts` 的 `HarnessConfig` 接口中新增 `project.domainType?: string` 字段（领域子仓库专用）
- [x] 1.3 确保 `buildConfig()` 和 `writeConfig()` 正确处理新字段的序列化/反序列化

## 2. 仓库类型检测

- [x] 2.1 在 `src/lib/detect.ts` 新增 `detectRepoType(projectRoot): 'main' | 'domain'` 函数，基于 `.gitmodules` 存在性和内容判断
- [x] 2.2 处理边界情况：`.gitmodules` 存在但为空或无有效子模块条目时返回 `domain`

## 3. 智能文件覆写

- [x] 3.1 在 `src/lib/templates.ts` 新增 `hasUserContent(filePath, renderedTemplate): boolean` — 对比现有文件与渲染后模板，去除 HTML 注释后判断是否有实质差异
- [x] 3.2 在 `src/lib/templates.ts` 新增 `writeSmartFile(filePath, renderedContent, directive?)` — 文件不存在则写入，无用户内容则覆写，有用户内容则只确保顶部 directive 存在
- [x] 3.3 修改 `src/commands/init.ts` 中 CLAUDE.md 写入逻辑，从 `fs.writeFileSync` 改为调用 `writeSmartFile`
- [x] 3.4 修改 `src/commands/init.ts` 中 AGENTS.md 写入逻辑，从 `fs.writeFileSync` 改为调用 `writeSmartFile`
- [x] 3.5 修改 `src/commands/init.ts` 中 GEMINI.md 写入逻辑，同样使用 `writeSmartFile`

## 4. 领域模板文件

- [x] 4.1 创建 `templates/agents-md-domain.md` — 领域子仓库 AGENTS.md 模板，精简版执行契约（不含 openspec 路由、子模块处理），支持 `{{PROJECT_NAME}}` 和 `{{DOMAIN_TYPE}}` 变量
- [x] 4.2 创建 `templates/claude-md-domain.md` — 领域子仓库 CLAUDE.md 模板，含 `@AGENTS.md` 引用和 `{{PROJECT_NAME}}` 变量

## 5. init 流程重构

- [x] 5.1 在 `src/commands/init.ts` 交互提示阶段新增仓库类型检测 + 确认步骤（调用 `detectRepoType` → `p.select` 确认）
- [x] 5.2 当 repoType 为 `domain` 时，新增领域类型选择提示（backend/frontend/other）
- [x] 5.3 抽取领域子仓库 init 逻辑为独立函数 `runDomainInit(projectRoot, domainType, targets, templateVars)`，只执行：复制领域模板 → 智能写入领域版 AGENTS.md/CLAUDE.md → 创建平台 symlink → 写入 config.yml
- [x] 5.4 主仓库流程保持现有逻辑，将 CLAUDE.md/AGENTS.md 写入改为 `writeSmartFile`
- [x] 5.5 在 `src/lib/templates.ts` 中新增 `copyDomainTemplateAsRoot(domainType, targetDir)` — 将领域模板复制到 `.harness/` 顶层（区别于现有的 `copyDomainTemplate` 放到 `domain/` 子目录）

## 6. 子模块批量 init 优化

- [x] 6.1 修改主仓库 init 的子模块处理：选择子模块后为每个子模块增加领域类型选择提示
- [x] 6.2 将子模块 init 从创建 `.gitkeep` 存根改为调用 `runDomainInit()` 逻辑
- [x] 6.3 更新子模块 config 信息写入（含 repoType 和 domainType）

## 7. 测试

- [x] 7.1 为 `detectRepoType()` 编写单元测试（有 .gitmodules → main，无 → domain，空 → domain）
- [x] 7.2 为 `hasUserContent()` 编写单元测试（无文件、模板内容、用户内容三种场景）
- [x] 7.3 为 `writeSmartFile()` 编写单元测试（新建、覆写、保留 + 确保 directive 四种场景）
- [x] 7.4 为领域子仓库 init 流程编写集成测试（验证 .harness/ 目录结构、config.yml 内容、平台 symlink）
- [x] 7.5 为主仓库 init 的智能覆写编写集成测试（验证已有 CLAUDE.md 不被覆写）
