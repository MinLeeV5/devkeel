## Why

当前 `web/index.html` 是一份 1493 行的单页文档，混合了产品介绍、架构设计、CLI 参考、最佳实践和版本演进等内容。首次访问的开发者需要滚过大量架构细节才能找到"快速开始"，深度用户则要在冗长的首页中定位技术参考。内容按读者角色拆分为三份独立文档，可以让每类读者直达所需内容，同时为后续持续补充（如 Worktree + Setup 模式）提供清晰的放置位置。

## What Changes

**首页内容范围**
- From: 包含 15 个板块的大而全单页（是什么、核心架构、路由、工作流、快速开始、CLI、基线包、领域包、多平台、选型、最佳实践、速查表、设计原则、V1→V2、版本横幅）
- To: 聚焦 4 个板块（Hero + 是什么、快速开始、工作流演示、版本横幅）
- Reason: 首页应回答"是什么 + 怎么用"，架构和参考内容分流到专属文档
- Impact: 非破坏性，内容迁移而非删除

**CSS 架构**
- From: 每个 HTML 文件内联全部 CSS（index.html 约 440 行样式）
- To: 公共样式抽取到 `assets/styles.css`，页面专属样式保留内联
- Reason: 4 个页面共享大量相同样式，内联方式无法保证一致性
- Impact: 非破坏性，changelog.html 也改为引用共享 CSS

**导航结构**
- From: 各页面独立维护导航链接（index 链页内锚点，changelog 链版本号）
- To: 统一四入口导航（首页、架构设计、最佳实践、变更日志），当前页高亮
- Reason: 新增两个页面后需要跨页互通
- Impact: changelog.html 导航需同步更新

**V1→V2 架构演进**
- From: index.html 和 changelog.html 各有一份 V1→V2 对比内容
- To: 仅保留 changelog.html 版本（已是超集），从 index.html 删除
- Reason: 内容重复，且对新用户无首屏价值
- Impact: 非破坏性

## Capabilities

### 新增能力

- `shared-styles`: 从现有 HTML 中抽取公共 CSS 到 `assets/styles.css`，定义公共/专属样式的分界规则，新增导航高亮样式
- `page-split`: 将 index.html 拆分为 3 个页面（index / architecture / best-practices），统一导航栏，删除首页 V1→V2 板块，更新 changelog 导航

### 修改能力

（无已有 spec 需求变更）

## Impact

| 受影响文件 | 变更类型 | 说明 |
|-----------|---------|------|
| `web/assets/styles.css` | 新建 | 共享 CSS |
| `web/index.html` | 大幅修改 | 删除迁移的板块，引用外部 CSS，更新导航 |
| `web/architecture.html` | 新建 | 架构设计页面 |
| `web/best-practices.html` | 新建 | 最佳实践页面 |
| `web/changelog.html` | 小幅修改 | 更新导航栏，改为引用外部 CSS |
| `web/capability-inventory.html` | 不动 | 不在本次范围内 |

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-web-docs
