## 一句话描述

在用户执行 `devkeel inject-review` 或 `doctor` 命令时，自动检测模板更新并通过 CLI 提示 + 浏览器更新页通知用户，确保用户及时感知并执行 `devkeel update`。

## 需求背景

**业务场景**：用户使用 `devkeel init` 初始化项目后，模板资产（skills、agents、rules、schemas）会随 `devkeel-templates` npm 包持续迭代。但用户缺乏主动感知更新的能力，导致长期停留在旧版本，无法享受新特性和修复。

**触发原因**：
- 用户执行 `devkeel inject-review` 频率最高（openspec 工作流中生成 human-review.html 后自动调用）
- 用户执行 `devkeel doctor` 时本身就在进行健康检查

**当前痛点**：
- 用户必须主动执行 `devkeel update` 才能知道是否有更新
- 缺乏被动提醒机制，更新感知延迟长
- 用户可能长期 unaware 新版本的存在

## 项目现状与架构分析

**受影响区域**：
- `src/commands/inject-review.ts`：高频命令，需要集成更新检查
- `src/commands/doctor.ts`：健康检查命令，自然延伸更新提醒
- `src/lib/`：需要新增 `update-notifier.ts` 模块封装更新检查逻辑

**关键模块及职责**：
```
src/lib/templates-cache.ts
  ├─ ensureTemplatesCache()  # 拉取最新模板包，返回 { cacheDir, version }
  └─ npmViewVersion()        # 调用 npm view 获取最新版本号

src/lib/config.ts
  ├─ readVersions()          # 读取 .harness/versions.yml（当前版本）
  └─ getBuiltinVersions()    # 读取内置版本（最新版本）

src/lib/update.ts
  └─ detectUpdates()         # 比对版本差异，返回 UpdateItem[]
```

**核心调用链**：
```
用户执行 devkeel inject-review <html-path>
    ↓
runInjectReview()
    ├─ injectReview(htmlPath)  # 核心逻辑
    └─ checkAndNotify()        # 新增：更新检查与提示
        ├─ 读取缓存 ~/.harness/cache/update-check.json
        ├─ 缓存过期？→ 异步拉取最新版本（不阻塞）
        ├─ 比对版本，有更新？→ 输出 CLI 提示
        └─ 首次发现？→ 打开浏览器更新页
```

**数据流**：
```
当前版本：.harness/versions.yml → readVersions()
最新版本：npm view devkeel-templates → ensureTemplatesCache()
缓存状态：~/.harness/cache/update-check.json → { lastCheck, latestVersion, notifiedVersion }
```

## 风险与约束

**技术约束**：
- 网络请求（npm view）耗时 2-5 秒，不能阻塞命令执行
- 跨平台打开浏览器命令不同（macOS: `open`, Linux: `xdg-open`, Windows: `start`）
- 缓存文件可能损坏或权限问题，需要防御式处理

**潜在破坏点**：
- 缓存文件读写失败 → 静默降级，不影响主命令执行
- 网络请求超时或失败 → 跳过更新检查，不报错
- 浏览器打开失败 → 仅 CLI 提示，不中断流程

**向后兼容性**：
- 新增缓存文件 `~/.harness/cache/update-check.json`，不影响现有 `.harness/` 结构
- 新增 `src/lib/update-notifier.ts` 模块，不修改现有逻辑
- 命令层显式调用 `checkAndNotify()`，不影响未集成的命令

**现有测试覆盖**：
- `tests/templates-cache.test.ts`：覆盖缓存拉取逻辑
- `tests/config.test.ts`：覆盖版本读写逻辑
- 新增 `tests/update-notifier.test.ts`：覆盖更新检查、提示、浏览器打开逻辑

## 目标用户与角色

**Who**：使用 `devkeel` CLI 的开发者

**角色关注点**：
- **日常使用者**：执行 `inject-review` 生成 human-review.html 时，希望及时知道有新版本
- **项目维护者**：执行 `doctor` 检查项目健康度时，希望确认模板是否最新
- **CI/CD 环境**：无头环境无法打开浏览器，只需 CLI 提示（自动降级）

## 核心功能用例

### UC1：首次发现更新
**触发条件**：
- 用户执行 `devkeel inject-review` 或 `doctor`
- 本地缓存不存在或已过期（>24h）
- 检测到新版本可用

**预期行为**：
1. 命令正常执行完毕
2. 在输出末尾显示黄色醒目提示：
   ```
   ┌─────────────────────────────────────────────────┐
   │ 💡 harness 有新版本可用（1.0.0 → 1.1.0）         │
   │    运行 devkeel update 更新                      │
   └─────────────────────────────────────────────────┘
   ```
3. 自动打开浏览器，访问 `https://github.com/MinLeeV5/devkeel/tree/HEAD/web/public/versions?from=1.0.0`
4. 更新页头部醒目显示："你有更新的版本（1.0.0 → 1.1.0）"
5. 记录已通知版本到缓存，避免重复打开浏览器

### UC2：同一版本后续提醒
**触发条件**：
- 用户再次执行 `inject-review` 或 `doctor`
- 已通知过该版本（缓存中 `notifiedVersion` 匹配）

**预期行为**：
1. 命令正常执行完毕
2. 仅显示 CLI 提示（不再打开浏览器）
3. 提示文案同 UC1

### UC3：缓存过期，无更新
**触发条件**：
- 缓存过期（>24h）
- 拉取最新版本后发现无更新

**预期行为**：
1. 命令正常执行完毕
2. 不显示任何更新提示
3. 更新缓存的 `lastCheck` 和 `latestVersion`

### UC4：网络请求失败
**触发条件**：
- 缓存过期，触发网络请求
- npm view 超时或失败

**预期行为**：
1. 命令正常执行完毕
2. 不显示更新提示（静默降级）
3. 不更新缓存，下次命令继续尝试

### UC5：无头环境（CI/CD）
**触发条件**：
- 用户在 SSH、容器、无头环境中执行命令
- 检测到更新，尝试打开浏览器失败

**预期行为**：
1. 命令正常执行完毕
2. 显示 CLI 提示
3. 浏览器打开失败时静默降级，不报错
4. 记录已通知版本

## 需求边界

**In Scope:**
- 在 `inject-review` 和 `doctor` 命令中集成更新检查
- 本地缓存管理（`~/.harness/cache/update-check.json`）
- 版本比对逻辑（复用现有 `detectUpdates()`）
- CLI 醒目提示（黄色边框）
- 自动打开浏览器（跨平台支持）
- 更新页 URL 生成（带 `from` 参数）
- 频率控制（每天最多打开一次浏览器）
- 缓存过期策略（24 小时）
- 防御式错误处理（静默降级）
- 新增 `src/lib/update-notifier.ts` 模块
- 新增 `tests/update-notifier.test.ts` 测试

**Out of Scope:**
- 修改 `web/changelog.html` 页面逻辑（由前端团队负责）
- 提供禁用更新检查的配置选项（所有用户统一行为）
- 区分 major/minor/patch 版本类型（统一提示策略）
- 后台定时检查进程（只在命令执行时检查）
- 强制更新机制（不阻塞用户操作）
- 集成到其他命令（如 `init`、`update` 本身）

## 探索过的替代方向

### 方向 1：每次命令都调用 npm view
**取舍**：性能问题严重（每次 2-5 秒），用户体验差，放弃

### 方向 2：只在 `doctor` 命令中检查
**取舍**：覆盖率太低，用户可能很少执行 `doctor`，无法达到"快速感知"目的，放弃

### 方向 3：后台定时检查进程
**取舍**：实现复杂度高（进程管理、资源占用、权限问题），违背 YAGNI 原则，放弃

### 方向 4：交互式提示（询问是否立即更新）
**取舍**：会打断用户当前的 openspec 工作流，用户体验差，放弃

### 方向 5：本地 HTML 更新页
**取舍**：需要打包 HTML 文件，增加发布复杂度，且无法动态展示最新 changelog，选择远程 URL 更灵活

## 待确认项

（无，所有关键点已确认）
