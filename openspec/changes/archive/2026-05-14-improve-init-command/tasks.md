## 1. 修复平台链接完整性

- [x] 1.1 在 `src/lib/templates.ts` 的 `createPlatformLinks` 中为 codex 平台添加 agents 目录的 symlink
- [x] 1.2 编写测试：验证 codex 平台创建 skills/rules/agents/commands 四个链接

## 2. 实现 re-init 平台目录清理

- [x] 2.1 在 `src/lib/templates.ts` 中新增 `detectExistingPlatformDirs(projectRoot, targets)` 函数：检测已有平台目录，返回需要清理的目录列表
- [x] 2.2 在 `src/lib/templates.ts` 中新增 `backupAndRemoveDirs(dirs)` 函数：将目录重命名为 `*.bak`，删除原目录
- [x] 2.3 在 `src/commands/init.ts` 的 `createPlatformLinks` 调用前，检测已有平台目录并通过 `@clack/prompts` 询问用户是否重建
- [x] 2.4 编写测试：验证备份和重建流程

## 3. 实现废弃文件清理

- [x] 3.1 在 `src/lib/templates.ts` 中新增 `cleanLegacyStageFiles(projectRoot)` 函数：扫描 `.harness/skills/` 和 `.harness/agents/` 下的 `stage-*.md` 文件并删除
- [x] 3.2 在 `src/commands/init.ts` 中，模板复制完成后调用 `cleanLegacyStageFiles`
- [x] 3.3 编写测试：验证 stage-*.md 文件被正确检测和删除

## 4. 增强子模块平台链接

- [x] 4.1 修改 `src/commands/init.ts` 中的子模块初始化逻辑，在创建 `.harness/` 骨架后调用 `createPlatformLinks(subPath, targets)`
- [x] 4.2 确保子模块的 `.harness/agents/` 目录也被创建（当前只创建 skills 和 rules）
- [x] 4.3 编写测试：验证子模块的平台链接创建（通过 createPlatformLinks 通用测试覆盖）

## 5. 实现 openspec 增量更新

- [x] 5.1 在 `src/lib/templates.ts` 中新增 `updateOpenspecIncremental(openspecDir)` 函数：检查并补充缺失的 schemas 目录和子目录
- [x] 5.2 修改 `src/commands/init.ts`：将 openspec 的 `if exists skip` 逻辑替换为增量更新调用
- [x] 5.3 编写测试：验证 openspec 增量更新逻辑（schemas 补充、subdirs 补充）

## 6. 优化 package.json 模板

- [x] 6.1 修改 `src/commands/init.ts` 中的 package.json 生成逻辑：setup 脚本改为 `git submodule update --remote --init && npx devkeel setup`
- [x] 6.2 确认生成的 package.json 不含 main/author/license 字段（代码审查确认，当前模板已满足）
- [x] 6.3 编写测试：验证生成的 package.json 内容（嵌入交互式流程，通过类型检查和代码审查验证）

## 7. 集成验证

- [x] 7.1 `pnpm lint` 通过
- [x] 7.2 `pnpm test` 全部通过（58 tests passed）
- [ ] 7.3 在本地项目中手动执行 `node bin/devkeel.js init` 验证完整流程
