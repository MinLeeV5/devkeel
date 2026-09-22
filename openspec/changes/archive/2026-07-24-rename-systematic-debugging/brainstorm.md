# 变更 Brainstorm

## 目标

将受管 Debug skill 从容易诱导“默认自动插桩”的 `automated-instrumented-debugging` 更名为
`systematic-debugging`，同时明确 TypeScript 直接复用对应 JavaScript 运行时 emitter；升级后
由新名称承担唯一的受管 Debug 路由，旧受管目录仅在新 skill 已成功安装时移除。

## 现状与问题

- 当前 skill 的实际流程已经是“证据优先、复杂问题才定向插桩”，但标识仍突出 automated /
  instrumented，名称与默认行为相反。
- Browser、Node.js 与 Electron emitter 按运行时工作，TypeScript 无需新 collector 或新协议，
  但现有 reference 没有说明编译期类型和 ESM/CJS 接入边界。
- `systematic-debugging` 目前仍在旧 Superpowers 退休列表中；直接改目录会被 legacy migration
  当成待删除资产。
- 普通更新必须先成功安装新名称，才能移除版本表中登记的旧受管目录；用户跳过新 skill 时不能
  先删旧 skill，未登记的同名自定义目录也不能按受管迁移删除。

## 核心用例

| 角色/调用方 | 触发场景 | 预期结果 | 关键边界 |
|---|---|---|---|
| 新项目 | `devkeel init` | 只安装 `systematic-debugging` 并通过 AGENTS 路由 | 不再生成旧目录或旧版本键 |
| 已安装用户 | `devkeel update` 接受新 skill | 安装新目录后移除版本表登记的旧受管目录与版本键 | 新目录安装成功前不得删除旧目录 |
| 已安装用户 | 逐项更新时跳过新 skill | 保留旧 skill 和旧版本记录 | 不留下“旧已删、新未装”的空窗 |
| 自定义用户 | 存在未登记的旧同名目录 | 不作为受管资产静默删除 | 可以报告残留，但保留用户内容 |
| TypeScript 项目 | Browser/Node/Electron 中插桩 | 复用对应 JS emitter，只增加最薄类型/模块适配 | 不复制 collector、协议或运行时实现 |

## 范围与验收

| 范围 | 内容 |
|---|---|
| In Scope | skill 目录/frontmatter/路由/版本键重命名；TS reference；旧受管名称的有序迁移；init/update/config/template/runtime 测试 |
| Out of Scope | collector 协议重构；新增 TypeScript emitter 副本；发布、commit、push；修改范围外 release 脚本 |

- 模板与 dogfood 只存在一个 `systematic-debugging`，内容字节一致。
- TypeScript 文档按运行时映射到 `hdbg-web.js` 或 `hdbg-node.cjs`，并说明类型与模块适配。
- 新安装不包含旧 skill；已登记旧 skill 在新 skill 成功安装后移除并清除旧版本键。
- 跳过新 skill 或旧目录未登记时，不删除旧目录。
- Debug 路由、专项运行时测试、init/update 迁移测试、lint 与 build 通过。

## 架构与影响概览

| 区域/模块 | 当前职责或行为 | 本次影响 |
|---|---|---|
| `templates/skills/`、`.harness/skills/` | 分发与 dogfood Debug skill | 目录和 metadata 改为 `systematic-debugging`，资产实现不分叉 |
| AGENTS 与版本清单 | 路由并标记受管版本 | 路由/版本键使用新名称，旧键退出 |
| update legacy migration | 删除退休受管资产 | 新名称退出退休列表；旧名称仅在替代 skill 已安装且版本表登记时移除 |
| 测试 | 校验退休资产与 Debug 多运行时能力 | 更新名称并增加成功迁移、跳过和自定义保留场景 |

## 方案方向与取舍

- 使用 `systematic-debugging` 作为公开 ID，标题继续保持 Evidence/Systematic Debugging；插桩仍是
  reference 中的升级能力。
- TypeScript 归属于运行时而非独立 transport：Browser/renderer/preload 复用 Web helper，
  Node/main 复用 CJS helper；只记录 `(globalThis as any)`、项目模块制式导入或临时声明等适配。
- 不保留旧 alias skill，避免同一 Debug 请求同时触发两个 skill。
- 迁移采用“先安装、后移除”：新 skill 更新成功后才允许 legacy migration 删除已登记旧目录；
  自定义未登记目录保留。

## 约束、风险与决策

| 类型 | 约束或风险 | 决策或应对 |
|---|---|---|
| 兼容 | 新名称曾属于退休 Superpowers skill | 从退休集合移出，以当前模板版本表作为受管身份来源 |
| 数据安全 | 旧名称可能被用户自定义复用 | 只有 `.harness/versions.yml` 登记旧键且新目录存在时才移除 |
| 更新原子性 | 用户可逐项跳过新 skill | 删除条件绑定新目录实际存在；版本键只在新 skill 更新成功后替换 |
| TypeScript | ESM/CJS 与全局类型策略因项目而异 | 复用运行时 helper，允许最薄项目适配，不增加重复 emitter |
| 发布 | 本轮未提升 Templates package 版本 | 不生成 changelog JSON，不执行发布 |

## 流程选择

选择 Harness Lite：该变更需要记录标识迁移、版本表和 update 兼容关系，但没有 Full 级数据、
合规或外部系统协调风险。用户已明确授权直接实施。
