## ADDED Requirements

### Requirement: 双版本流 JSON 是版本正文唯一来源
系统 SHALL 将 CLI 与 Templates 版本正文分别保存在 `web/public/versions/cli/*.json` 和 `web/public/versions/templates/*.json`，并且每个文件描述一个单版本或合并版本条目。文件名 MUST 等于 `versions` 数组最后一个版本加 `.json`，React/TSX 不得保留版本正文 fallback。

#### Scenario: 新增单个 CLI 版本
- **WHEN** 维护者新增 `web/public/versions/cli/0.8.11.json`，其 `versions` 为 `["0.8.11"]`
- **THEN** 该文件成为 CLI `0.8.11` 版本正文的唯一来源，维护者无需修改 Changelog TSX

#### Scenario: 保存合并历史版本
- **WHEN** 一个历史条目覆盖 `0.8.5` 与 `0.8.6`
- **THEN** 系统 MUST 允许在 `0.8.6.json` 中按旧到新声明 `versions: ["0.8.5", "0.8.6"]`，且不得要求拆分现有文案

### Requirement: 版本文件使用统一可验证契约
每个版本文件 MUST 包含非空 `versions`、带时区的 `releasedAt.from`、可选且不早于 from 的 `releasedAt.to`、非空 `title`、布尔 `archived` 和 `groups`。数字时区偏移 MUST 不超过 ISO 8601 的 `±14:00`。版本号 MUST 为至少两段的纯数字点分形式；合并条目 MUST 按数值语义严格从旧到新声明，补零后相等的版本不得相邻。group type MUST 属于 `feat`、`fix`、`breaking`、`refactor`、`docs`，每个 group 与 item 的必填文本不得为空。

#### Scenario: 合法版本文件通过校验
- **WHEN** 文件名、版本数组、发布时间、标题、归档标记和变更分组全部满足契约
- **THEN** loader SHALL 接受该文件并将其纳入对应版本流

#### Scenario: 时间范围倒置
- **WHEN** `releasedAt.to` 早于 `releasedAt.from`
- **THEN** loader MUST 报告该文件的时间范围错误并拒绝生成 catalog

#### Scenario: 时区偏移超过 ISO 8601 上限
- **WHEN** `releasedAt.from` 使用 `+14:01`、`-14:01` 或更大的数字时区偏移
- **THEN** loader MUST 报告时间字段错误并拒绝该文件；`+14:00` MUST 通过校验

#### Scenario: 不支持的变更类型
- **WHEN** 任一 group 的 type 不在白名单中
- **THEN** loader MUST 报告字段路径与非法值

#### Scenario: 合并版本顺序倒置
- **WHEN** `versions` 为 `['0.8.6', '0.8.5']` 或 `['0.2', '0.1']`
- **THEN** loader MUST 报告后一个版本未严格按旧到新声明并拒绝该文件

### Requirement: Loader 汇总错误并阻止部分数据上线
Version Catalog Loader MUST 扫描两个固定子目录中的 JSON 普通文件，校验文件名和内容，检测同一版本流内的重复版本，并在发现错误时一次性汇总所有文件错误。存在任一错误或任一版本流为空时，服务 MUST 不得以空列表或部分 catalog 启动。

#### Scenario: 多文件同时损坏
- **WHEN** CLI 文件存在版本重复且 Templates 文件存在损坏 JSON
- **THEN** loader MUST 在同一个异常中列出两个文件路径及各自错误

#### Scenario: 文件名与末版本不一致
- **WHEN** 文件名为 `0.8.10.json`，但 `versions` 最后一个值为 `0.8.9`
- **THEN** loader MUST 拒绝该文件并指出预期文件名

#### Scenario: 版本流没有数据
- **WHEN** CLI 或 Templates 目录不存在任何合法 JSON
- **THEN** 服务 MUST 阻止启动并指出为空的版本流

#### Scenario: 一个版本流目录读取失败
- **WHEN** CLI 目录无法 stat 或 readdir，同时 Templates 文件也存在校验错误
- **THEN** loader MUST 继续扫描 Templates，并在同一个异常中汇总两个版本流的诊断

### Requirement: 两条版本流独立排序并计算 latest
系统 SHALL 按 `releasedAt.to ?? releasedAt.from` 对 CLI 与 Templates 分别倒序排列，且每条流的 latest MUST 取排序后第一条记录的最后一个版本。排序后的第一条记录 MUST 为 `archived: false`，否则 loader MUST 拒绝生成 catalog。系统不得跨版本流合并、去重或比较版本号。

#### Scenario: CLI 与 Templates 发布日期不同
- **WHEN** CLI 最新记录和 Templates 最新记录具有不同日期与版本号
- **THEN** API SHALL 分别返回各自 latest，互不影响

#### Scenario: 历史版本号不是三段式
- **WHEN** catalog 包含历史版本 `0.1`
- **THEN** 系统 SHALL 依据发布时间正常排序，不得因非三段式版本号拒绝该记录

#### Scenario: 最新记录被归档
- **WHEN** 任一版本流按发布时间排序后的第一条记录为 `archived: true`
- **THEN** loader MUST 报告该版本流的 latest 归档错误并阻止服务启动

### Requirement: 后台启动时加载并提供版本 API
Hono 应用 SHALL 在创建时加载完整 Version Catalog 并保存在内存中，`GET /api/versions` MUST 返回 `{ cli: { latest, entries }, templates: { latest, entries } }`，响应 MUST 使用 JSON content type 和 `Cache-Control: no-store`。API 请求不得重新扫描文件系统。

#### Scenario: 获取版本目录
- **WHEN** 客户端请求 `GET /api/versions`
- **THEN** 服务 SHALL 返回两个独立版本流、各自 latest 和排序后的完整 entries

#### Scenario: 请求后磁盘文件变化
- **WHEN** 应用已创建且底层版本文件随后被修改
- **THEN** 后续 API 响应 SHALL 继续返回启动时缓存，直到服务重启

#### Scenario: 测试或自定义部署目录
- **WHEN** 调用方通过 `ServerOptions.versionsDir` 指定版本目录
- **THEN** loader MUST 使用该目录而不是默认路径

#### Scenario: 生产构建目录缺失
- **WHEN** 未指定 `versionsDir` 且 `staticRoot/versions` 不存在
- **THEN** 服务 MUST 启动失败，不得静默读取 `web/public/versions`

### Requirement: 版本 JSON 随 Web 构建产物发布
Vite 构建 MUST 将 `web/public/versions/` 原样复制到 `web/dist/versions/`，生产环境 SHALL 从构建产物目录读取，开发与测试环境 MAY 显式使用源码或临时目录。

#### Scenario: 完成生产构建
- **WHEN** 执行 `pnpm --dir web build`
- **THEN** `dist/versions/cli` 与 `dist/versions/templates` MUST 存在，且构建内置校验 MUST 确认文件集合与逐文件内容均和 public 源目录一致

### Requirement: 全量历史迁移保持内容完整
首次迁移 MUST 覆盖当前 Changelog 中全部 CLI、Templates 单版本与合并版本条目，并保持版本集合、latest、标题、group 标签、item 顺序、链接和行内代码语义。V1 → V2 迁移说明 SHALL 继续作为非版本 React 静态内容存在。

#### Scenario: 比较迁移前后目录
- **WHEN** 运行迁移完整性验证
- **THEN** 38 条历史 JSON 的全部字段、group type/label、item 顺序与内容 MUST 与独立批准基线一致；额外的后续合法 JSON 和更高 latest 不得导致基线失败

历史 CLI `0.8.5 ~ 0.8.6` 的性能分组 SHALL 有意规范化为 `type: refactor` 并保留 label `优化`；公共 schema MUST NOT 为该迁移例外新增 `perf`。

#### Scenario: 检查 React 源码
- **WHEN** 全量迁移完成
- **THEN** `changelog.tsx` MUST 不再包含具体版本 section 正文，但仍保留 V1 → V2 迁移说明

### Requirement: Changelog skill 使用 JSON 发版流程
项目的 `changelog` skill MUST 升级为以版本 JSON 为唯一编辑入口的流程，并将 metadata major 版本升级至 `3.0.0`。skill 与 documentation rule SHALL 指向 `web/public/versions/**/*.json`，说明双版本流、schema、文件名、构建与验证要求，且不得再要求维护者手工编辑 TSX、latest badge 或 Update Tip。

#### Scenario: 发布新的 Templates 版本
- **WHEN** 维护者按 changelog skill 记录 Templates 新版本
- **THEN** 流程 SHALL 只要求创建对应 Templates JSON、运行校验与构建，不要求修改 Changelog React 组件
