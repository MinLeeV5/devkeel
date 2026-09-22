## ADDED Requirements

### Requirement: V2 遥测链路隔离
Templates V2 CLI 产生的每个遥测事件 MUST 携带 `schemaVersion: 2` 并且只发送到 V2 endpoint；
CLI MUST NOT 将 V2 事件发送到 V1 endpoint，也不得把 V1 endpoint 配置作为 V2 的回退地址。

#### Scenario: 使用默认 V2 endpoint
- **WHEN** 用户运行启用遥测的 Templates V2 CLI 命令且没有配置 endpoint override
- **THEN** CLI 只向 `/api/telemetry/v2` 发送一次 V2 事件

#### Scenario: 覆盖 V2 endpoint
- **WHEN** 用户设置独立的 V2 endpoint 环境变量
- **THEN** CLI 将 V2 事件发送到该地址且不读取 V1 endpoint 环境变量

#### Scenario: 禁止双写
- **WHEN** V2 endpoint 请求成功或失败
- **THEN** CLI 均不得额外请求 V1 endpoint

### Requirement: 上报 OpenSpec change 上下文
CLI SHALL 在 OpenSpec 命令能够可靠关联 change 时上报 change name，并 SHALL 从该 change 的
本地事实源读取当前 schema；当 Full change 包含 Lite→Full promotion 标记时，事件 MUST 将
`lite` 记录为升级来源。

#### Scenario: 上报 Lite change
- **WHEN** OpenSpec 命令关联到 selector 为 `lite` 的 active change
- **THEN** V2 事件包含该 change name 和 `schemaName: "lite"`

#### Scenario: 上报直接创建的 Full change
- **WHEN** OpenSpec 命令关联到 selector 为 `full` 且没有 promotion 标记的 change
- **THEN** V2 事件包含 `schemaName: "full"` 且不包含升级来源

#### Scenario: 上报 Lite 升级 Full change
- **WHEN** OpenSpec 命令关联到 selector 为 `full` 且 brainstorm 含精确 Lite→Full promotion 标记的 change
- **THEN** V2 事件包含 `schemaName: "full"` 和 `promotedFrom: "lite"`

#### Scenario: archive 后读取 change
- **WHEN** archive 命令成功后 active change 已移动到带日期前缀的 archive 目录
- **THEN** CLI 从对应归档 change 读取 schema 和 promotion 标记并上报同一 change name

#### Scenario: change 上下文不可判定
- **WHEN** 命令参数不能唯一确定 change 或其 selector 文件无法读取
- **THEN** CLI 省略无法证明的 change 字段并继续上报通用 V2 事件，且不得改变 OpenSpec 退出结果

## MODIFIED Requirements

### Requirement: Track command execution
CLI SHALL 在每次命令执行完成后异步上报 V2 遥测事件，事件 MUST 包含
`schemaVersion: 2`、projectId、命令名、成功状态、耗时毫秒、CLI 版本、模板版本、数字时间戳
和 Git 信息，并可包含与命令相关的结构化 change 上下文。

#### Scenario: Successful command execution
- **WHEN** 用户运行 `devkeel init` 且命令成功完成
- **THEN** CLI 发送 `command: "init"`、`success: true`、实测耗时和 `schemaVersion: 2` 的事件

#### Scenario: Failed command execution
- **WHEN** 命令以退出码 1 结束
- **THEN** CLI 发送 `success: false` 的 V2 事件

#### Scenario: Network failure
- **WHEN** V2 遥测 endpoint 不可达
- **THEN** 事件被静默丢弃且 CLI 正常按原命令结果退出，不向 V1 重试
