## ADDED Requirements

### Requirement: update 支持指定模板版本
`devkeel update` SHALL 支持用户通过显式模板版本选择 `devkeel-templates` 的下载版本，且默认不改变最新稳定版本更新行为。

#### Scenario: 默认更新最新稳定模板
- **WHEN** 用户执行 `devkeel update`
- **THEN** 系统查询 `devkeel-templates` 的 npm `version` 字段并下载该版本模板

#### Scenario: 使用 option 指定模板版本
- **WHEN** 用户执行 `devkeel update --template-version 1.2.3-beta.1`
- **THEN** 系统下载 `devkeel-templates@1.2.3-beta.1` 并用该模板目录执行后续 update 检测和同步

#### Scenario: 使用位置参数指定模板版本
- **WHEN** 用户执行 `devkeel update 1.2.3`
- **THEN** 系统下载 `devkeel-templates@1.2.3` 并用该模板目录执行后续 update 检测和同步

#### Scenario: 显式版本格式非法
- **WHEN** 用户指定的模板版本不符合 semver 字符串格式
- **THEN** 系统 MUST 在执行 `npm pack` 前失败，并输出 `TemplatesFetchError`

### Requirement: update 支持扫描最新 beta 模板版本
`devkeel update --beta` SHALL 从 `devkeel-templates` 的 npm versions 列表中筛选 beta 预发布版本，并选择 semver 排序最高的版本作为模板下载目标。

#### Scenario: versions 列表存在多个 beta
- **WHEN** npm versions 列表包含 `1.2.3-beta.1`、`1.2.3-beta.2` 和 `1.2.4-alpha.1`
- **THEN** 系统选择 `1.2.3-beta.2`

#### Scenario: 更高基础版本的 beta 存在
- **WHEN** npm versions 列表包含 `1.2.9-beta.9` 和 `1.3.0-beta.1`
- **THEN** 系统选择 `1.3.0-beta.1`

#### Scenario: versions 列表没有 beta
- **WHEN** npm versions 列表只包含稳定版或非 beta 预发布版本
- **THEN** 系统 MUST 输出 `TemplatesFetchError`，说明未找到 beta 模板版本

#### Scenario: beta 与显式模板版本同时传入
- **WHEN** 用户执行 `devkeel update --beta --template-version 1.2.3`
- **THEN** 系统 MUST 拒绝执行并提示 `--beta` 不能与指定模板版本同时使用
