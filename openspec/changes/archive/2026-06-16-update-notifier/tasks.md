# update-notifier 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用
> subagent-driven-development 逐任务实现本计划。

**目标：** 在 `inject-review` 和 `doctor` 命令中集成更新检查模块，通过本地缓存 + 异步网络请求实现低延迟版本检测，首次发现更新时打开浏览器更新页 + CLI 提示，后续仅 CLI 提示。

**架构：** 创建独立的 `src/lib/update-notifier.ts` 模块，封装更新检查、缓存管理、浏览器打开逻辑。命令层仅在命令末尾调用 `checkAndNotify()`，不含检查逻辑。缓存存储在 `~/.harness/cache/update-check.json`，24h TTL，过期异步拉取最新版本。

**技术栈：** TypeScript, Node.js (fs, child_process), @clack/prompts, vitest

---

## 1. 缓存管理模块

- [x] **1.1 缓存数据结构与读写**
  1. 写测试：`tests/update-notifier.test.ts` — 验证缓存读取、写入、过期判断场景
     - 缓存文件不存在时返回 null
     - 缓存文件损坏时返回 null
     - 缓存未过期（<24h）时返回缓存数据
     - 缓存已过期（>24h）时返回过期标记
     - 缓存 round-trip 读写正确性
  2. 实现：`src/lib/update-notifier.ts` — 添加缓存管理函数
     ```typescript
     interface UpdateCache {
       lastCheck: number
       latestVersion: string
       notifiedVersion?: string
     }
     
     function readUpdateCache(): UpdateCache | null
     function isCacheExpired(cache: UpdateCache): boolean
     function writeUpdateCache(cache: UpdateCache): void
     ```
  3. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: feat(update-notifier): 实现缓存数据结构与读写逻辑

- [x] **1.2 版本号比对逻辑**
  1. 写测试：`tests/update-notifier.test.ts` — 验证版本比对场景
     - 版本号相同时返回 false（无更新）
     - 版本号不同时返回 true（有更新）
     - 当前版本缺失时返回 true
  2. 实现：`src/lib/update-notifier.ts` — 添加版本比对函数
     ```typescript
     function compareVersions(current: string, latest: string): boolean
     ```
  3. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: feat(update-notifier): 实现版本号比对逻辑

## 2. 网络请求与版本拉取

- [x] **2.1 异步拉取最新版本**
  1. 写测试：`tests/update-notifier.test.ts` — 验证网络请求场景
     - 复用 `ensureTemplatesCache()` 拉取最新版本
     - 网络请求失败时返回 null（静默降级）
     - 超时控制（3s）
  2. 实现：`src/lib/update-notifier.ts` — 添加网络请求函数
     ```typescript
     async function fetchLatestVersion(): Promise<string | null>
     ```
  3. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: feat(update-notifier): 实现异步拉取最新版本逻辑

## 3. CLI 提示与浏览器打开

- [x] **3.1 CLI 提示格式化**
  1. 写测试：`tests/update-notifier.test.ts` — 验证提示格式化场景
     - 生成黄色边框提示框
     - 包含当前版本和最新版本
     - 包含 `devkeel update` 命令提示
  2. 实现：`src/lib/update-notifier.ts` — 添加提示格式化函数
     ```typescript
     function formatUpdatePrompt(from: string, to: string): string
     ```
  3. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: feat(update-notifier): 实现 CLI 提示格式化

- [x] **3.2 跨平台浏览器打开**
  1. 写测试：`tests/update-notifier.test.ts` — 验证浏览器打开场景
     - macOS 使用 `open` 命令
     - Linux 使用 `xdg-open` 命令
     - Windows 使用 `start` 命令
     - URL 参数 encodeURIComponent 编码
     - 打开失败时静默降级（不报错）
  2. 实现：`src/lib/update-notifier.ts` — 添加浏览器打开函数
     ```typescript
     function openBrowser(url: string): void
     ```
  3. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: feat(update-notifier): 实现跨平台浏览器打开

- [x] **3.3 浏览器打开频率控制**
  1. 写测试：`tests/update-notifier.test.ts` — 验证频率控制场景
     - 首次发现版本时返回 true（需要打开浏览器）
     - 已通知过该版本时返回 false（不再打开）
     - 缓存不存在时返回 true
  2. 实现：`src/lib/update-notifier.ts` — 添加频率控制函数
     ```typescript
     function shouldOpenBrowser(cache: UpdateCache | null, latestVersion: string): boolean
     ```
  3. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: feat(update-notifier): 实现浏览器打开频率控制

## 4. 主入口与命令层集成

- [x] **4.1 主入口函数 checkAndNotify**
  1. 写测试：`tests/update-notifier.test.ts` — 验证主入口场景
     - 未初始化项目（无 versions.yml）时静默跳过
     - 缓存未过期时使用缓存版本
     - 缓存过期时触发网络请求
     - 有更新时输出 CLI 提示
     - 首次发现版本时打开浏览器
     - 已通知过该版本时不再打开浏览器
     - 任何异常时静默降级（不影响主命令）
  2. 实现：`src/lib/update-notifier.ts` — 添加主入口函数
     ```typescript
     export async function checkAndNotify(): Promise<void>
     ```
  3. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: feat(update-notifier): 实现主入口函数 checkAndNotify

- [x] **4.2 集成到 inject-review 命令**
  1. 修改：`src/commands/inject-review.ts` — 在命令末尾调用 `checkAndNotify()`
     ```typescript
     import { checkAndNotify } from '../lib/update-notifier.js'
     
     export async function runInjectReview(htmlPath: string): Promise<void> {
       // ... 现有逻辑
       log.outro('完成')
       
       // 新增：更新检查
       await checkAndNotify()
     }
     ```
  2. 验证：手动执行 `node bin/devkeel.js inject-review <html-path>`，观察是否有更新提示
  > commit: feat(inject-review): 集成更新检查与通知

- [x] **4.3 集成到 doctor 命令**
  1. 修改：`src/commands/doctor.ts` — 在命令末尾调用 `checkAndNotify()`
     ```typescript
     import { checkAndNotify } from '../lib/update-notifier.js'
     
     export async function runDoctor(opts?: { fix?: boolean }): Promise<void> {
       // ... 现有逻辑
       log.outro('完成')
       
       // 新增：更新检查
       await checkAndNotify()
     }
     ```
  2. 验证：手动执行 `node bin/devkeel.js doctor`，观察是否有更新提示
  > commit: feat(doctor): 集成更新检查与通知

## 5. 测试覆盖与质量保障

- [x] **5.1 补充边界场景测试**
  1. 写测试：`tests/update-notifier.test.ts` — 补充边界场景
     - 缓存文件权限问题（只读）
     - 网络请求超时（>3s）
     - npm registry 返回异常数据
     - 无头环境（浏览器打开失败）
  2. 验证：`pnpm vitest run tests/update-notifier.test.ts`
  > commit: test(update-notifier): 补充边界场景测试覆盖

- [x] **5.2 完整测试套件运行**
  1. 运行：`pnpm test` — 确保所有测试通过
  2. 运行：`pnpm lint` — 确保类型检查通过
  3. 运行：`pnpm build` — 确保构建成功
  4. 验证：所有命令输出无错误
  > commit: test(update-notifier): 完整测试套件验证通过

## 6. 文档与收尾

- [x] **6.1 更新 web/changelog.html**
  1. 修改：`web/changelog.html` — 添加更新页头部提示逻辑
     - 检测 URL 参数 `from`
     - 若存在 `from` 参数，头部醒目显示："你有更新的版本（<from> → <current>）"
     - 提供 `devkeel update` 命令提示
  2. 验证：浏览器访问 `web/changelog.html?from=1.0.0`，观察头部提示
  > commit: feat(web): changelog.html 支持版本更新提示

- [x] **6.2 收尾验证**
  1. 运行：`pnpm lint && pnpm test && pnpm build`
  2. 手动测试：执行 `devkeel inject-review` 和 `devkeel doctor`，观察更新提示
  3. 验证：缓存文件 `~/.harness/cache/update-check.json` 正确生成
  4. 验证：浏览器正确打开（首次）或仅 CLI 提示（后续）
  > commit: chore: 收尾验证与质量检查
