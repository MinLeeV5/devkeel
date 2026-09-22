## ADDED Requirements

### Requirement: Changelog 页面通过版本 API 渲染双版本流
Changelog 页面 SHALL 在加载时请求 `GET /api/versions`，使用响应中的 CLI 与 Templates entries 渲染现有两个 tab，并用各自 latest 生成 latest badge 和 Update Tip 版本 chip。Templates tab MUST 继续作为无 `?from=` 参数时的默认视图。

#### Scenario: 首次成功加载
- **WHEN** 用户打开 `/changelog.html` 且 API 返回有效 catalog
- **THEN** 页面 SHALL 默认显示 Templates 条目、Templates latest badge，并同时显示 CLI 与 Templates 版本 chip

#### Scenario: 用户切换到 CLI
- **WHEN** 用户点击 CLI tab
- **THEN** 页面 SHALL 使用 React state 切换到 CLI entries，且不得使用 DOM action 脚本

### Requirement: 页面提供明确的数据加载状态
页面 MUST 覆盖 loading、success、error 和 retrying 状态。API 失败时 SHALL 显示可读错误与重试入口，不得静默展示旧 TSX 数据或伪造空 catalog；重试不得产生并发重复请求。

#### Scenario: API 尚未完成
- **WHEN** 页面已挂载但 catalog 请求仍在进行
- **THEN** 页面 SHALL 保留导航、Hero 和更新说明，并在版本区域显示轻量加载占位

#### Scenario: API 请求失败
- **WHEN** `/api/versions` 返回错误或网络失败
- **THEN** 页面 SHALL 显示加载失败信息和“重新加载”按钮，不展示版本正文 fallback

#### Scenario: 用户重试成功
- **WHEN** 用户点击重新加载且下一次请求成功
- **THEN** 页面 SHALL 清除错误并渲染完整版本目录

### Requirement: 历史版本按 archived 标记进入折叠区
页面 SHALL 将 `archived: false` 条目渲染在版本流主列表，将 `archived: true` 条目渲染在默认收起的历史 `<details>` 中。groups 为空的早期版本 MUST 仍显示版本标签、日期和标题。CLI 的 V1 → V2 静态迁移说明 MUST 位于该默认收起的历史 `<details>` 内。

#### Scenario: 查看主版本列表
- **WHEN** catalog 同时包含 archived 与非 archived 条目
- **THEN** 默认视图 SHALL 只展开非 archived 条目，历史条目位于收起区域

#### Scenario: 展开无变更分组的历史版本
- **WHEN** 用户展开历史区且某条 entry 的 groups 为空
- **THEN** 页面 SHALL 显示该条目的版本范围、发布日期和标题，不渲染空变更卡片

#### Scenario: 查看 CLI 迁移说明
- **WHEN** 页面渲染 CLI 版本流
- **THEN** V1 → V2 静态迁移说明 SHALL 保留在默认关闭的历史 `<details>` 内

### Requirement: 合并版本和日期范围保持一致展示
页面 MUST 为 `versions` 中每个值添加 `v` 前缀并以 ` ~ ` 连接，使用最后一个版本生成稳定 section ID；CLI ID 为 `v{version}`，Templates ID 为 `tpl-v{version}`。发布时间 SHALL 从带时区 ISO 值格式化，单时间与时间范围均须可读。

#### Scenario: 渲染合并 CLI 版本
- **WHEN** entry 的 `versions` 为 `["0.8.5", "0.8.6"]`
- **THEN** 页面 SHALL 显示 `v0.8.5 ~ v0.8.6` 且 section ID 为 `v0.8.6`

#### Scenario: 渲染合并 Templates 版本
- **WHEN** entry 的 `versions` 为 `["1.2.2", "1.2.3"]`
- **THEN** 页面 SHALL 显示 `v1.2.2 ~ v1.2.3` 且 section ID 为 `tpl-v1.2.3`

### Requirement: 版本富文本使用受限 Markdown 安全渲染
版本 item 的 name 与 description SHALL 支持文本、强调、行内代码、安全链接和换行，但 MUST 禁用原始 HTML，不得使用 `dangerouslySetInnerHTML`。链接 MUST 只允许相对地址以及 `http`、`https` 协议，危险或未知协议不得生成可点击链接。

#### Scenario: 渲染行内代码与链接
- **WHEN** description 包含反引号代码和相对 Markdown 链接
- **THEN** 页面 SHALL 渲染对应 React code 与 anchor 节点，并保持现有视觉样式

#### Scenario: 阻止脚本内容
- **WHEN** description 包含 `<script>` 或 `javascript:` 链接
- **THEN** 页面 MUST 不执行原始 HTML，且不得生成危险可点击链接

### Requirement: CLI 更新横幅使用 CLI latest 定位
当 URL 包含 `?from=<version>` 时，页面 MUST 在 catalog 加载完成后切换到 CLI tab，显示 `v<from> → v<cli.latest>`，并滚动到最新 CLI section。该行为不得引用 Templates latest。

#### Scenario: 从旧 CLI 打开更新页面
- **WHEN** 用户访问 `/changelog.html?from=0.8.9` 且 API 的 CLI latest 为 `0.8.10`
- **THEN** 页面 SHALL 激活 CLI tab、显示 `v0.8.9 → v0.8.10` 并定位 `#v0.8.10`

### Requirement: 数据驱动改造保持现有页面契约
页面 MUST 保持 `/changelog.html` 路由、现有 `PageFrame`、导航、Hero、tab 视觉差异、响应式布局和 V1 → V2 迁移说明。版本数据改造不得恢复静态 HTML 页面、页面级 DOM 初始化脚本或全局主题重写。

#### Scenario: 桌面与移动端浏览
- **WHEN** 用户在现有桌面或移动断点打开 Changelog
- **THEN** 页面 SHALL 沿用当前间距、badge 配色、内容溢出和 tab 响应式规则

#### Scenario: 检查 React 架构边界
- **WHEN** 执行 React 页面回归测试
- **THEN** Changelog MUST 继续由 React state 和组件渲染，不得出现 legacy HTML、`data-action` 或 `dangerouslySetInnerHTML`
