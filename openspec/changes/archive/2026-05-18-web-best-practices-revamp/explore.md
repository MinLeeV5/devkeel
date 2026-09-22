## TL;DR

现状分析：`web/best-practices.html` 包含三个 section，其中"实践指南"待删除，"Worktree + Setup"为占位符待重写。Paseo 官网文档已提供完整的 worktree + setup 技术细节可供引用。

## 现有文件结构

### web/best-practices.html 当前结构

```
Nav
Hero（标题 "最佳实践"，描述 "实战指南与场景速查"）
Section 1: 场景速查（table，9 行场景矩阵）         ← 保留
Section 2: 实践指南（4 个 pillar cards，2×2 grid）  ← 删除
Section 3: Worktree + Setup（占位符 "即将推出"）    ← 重写
Footer
```

### 页面使用的 CSS class 和布局模式

- `.section-alt` — 交替背景色 section
- `.container` — 内容容器
- `.tag` — 章节标签（小字）
- `.stitle` / `.sdesc` — 章节标题/描述
- `.pillars` + `.pillar` — 卡片网格布局（当前用 `grid-template-columns:1fr 1fr`）
- `<table>` — 场景矩阵表格
- 外部样式在 `./assets/styles.css`

### Hero 描述调整

删除"实践指南"后，Hero 描述 "实战指南与场景速查" 可能需要调整为更贴合剩余内容的文案。

## Paseo 官网调研结果

### 核心定位

Paseo 是 coding agent 的运行时管理平台，让你从任何设备（桌面、移动、Web、CLI）驱动本机上的 coding agent。

### 支持的 Provider（Native）

| Provider | 描述 |
|----------|------|
| Claude Code | Anthropic 的 coding agent，支持 MCP、streaming、deep reasoning |
| Codex CLI | OpenAI 的 workspace agent，sandbox 控制 |
| OpenCode | 开源 coding assistant，多 provider 支持 |
| pi | 极简终端 coding agent，多 LLM provider |

### ACP Catalog（扩展）

fast-agent、Gemini CLI、GitHub Copilot、VT Code 等通过 ACP 协议接入。

### Worktree + Setup 机制

**核心概念**：每个 agent 运行在独立的 git worktree 中（独立目录、独立分支），并行 agent 互不干扰。

**paseo.json 配置示例**：

```json
{
  "worktree": {
    "setup": "npm ci",
    "teardown": "rm -rf .cache"
  },
  "scripts": {
    "test": { "command": "npm test" },
    "web": { "command": "npm run dev", "type": "service", "port": 3000 }
  }
}
```

**工作流**：
1. 创建 worktree → 自动运行 setup hook
2. 启动 agent → 创建/分配分支
3. 审查 diff（支持移动端）
4. 合并或归档（归档时运行 teardown）

**Setup hook** 支持：
- 安装依赖 (`npm ci`)
- 复制环境配置 (`cp "$PASEO_SOURCE_CHECKOUT_PATH/.env" .env`)
- 数据库迁移 (`npm run db:migrate`)

**Services**：
- 可声明长运行服务（dev server 等）
- 自动分配端口 + 反向代理
- 服务间通过环境变量互相发现

**CLI 命令**：
```bash
paseo run --worktree feature-auth --base main "implement auth"
paseo worktree ls
paseo worktree archive feature-auth
```

### 移动端能力

- 桌面 App 启动后扫描 QR code 连接手机
- CLI 模式也支持打印 QR code 让移动端连接
- 移动端可以：发起任务、审查 diff、操作 agent

### 可用图片资源

- 官网 OG image: `https://paseo.sh/og-image.png`
- Logo SVG: `https://paseo.sh/logo.svg`
- 需要从官网截取移动端界面截图（或使用产品 demo 图）

## 对页面改动的影响分析

| 改动 | 影响范围 | 风险 |
|------|----------|------|
| 删除实践指南 section | 仅删除 HTML 节点，无外部引用 | 低 |
| 重写 Worktree + Setup section | 替换占位符内容 | 低 |
| 引用外部图片（paseo.sh） | 依赖外部服务可用性 | 中低 — 图片无法加载时不影响文字内容 |
| 不改动 CSS | 复用现有 class 即可 | 无 |

## 技术约束

- 页面为纯静态 HTML，无构建步骤
- 样式复用 `./assets/styles.css`，不新增 CSS
- 所有外链使用 `target="_blank" rel="noopener"`
- 保持与其他页面一致的 nav/footer 结构

---

## 下一步

在新会话中粘贴以下命令：

/opsx:continue web-best-practices-revamp
