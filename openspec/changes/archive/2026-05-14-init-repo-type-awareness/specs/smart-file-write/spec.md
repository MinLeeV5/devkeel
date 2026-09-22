## ADDED Requirements

### Requirement: Smart file write SHALL detect user-authored content

系统在写入 CLAUDE.md 或 AGENTS.md 前，SHALL 将现有文件内容与渲染后的模板内容进行对比。去除 HTML 注释占位符（`<!-- ... -->`）后，如果存在实质性差异，则判定文件包含用户自定义内容。

#### Scenario: File does not exist

- **WHEN** 目标路径不存在 CLAUDE.md 或 AGENTS.md
- **THEN** 系统 SHALL 写入完整渲染后的模板内容

#### Scenario: File exists with only template placeholders

- **WHEN** 文件存在且内容（去除注释占位符后）与渲染后的模板一致
- **THEN** 系统 SHALL 覆写为最新渲染后的模板内容

#### Scenario: File exists with user-authored content

- **WHEN** 文件存在且内容（去除注释占位符后）与渲染后的模板存在实质性差异
- **THEN** 系统 SHALL 保留现有内容不做修改

---

### Requirement: Smart file write SHALL ensure @AGENTS.md directive exists

当文件被判定包含用户自定义内容时，系统 SHALL 检查文件顶部是否包含 `@AGENTS.md` 引用指令。

#### Scenario: User content file missing @AGENTS.md directive

- **WHEN** 文件包含用户自定义内容且顶部不包含 `@AGENTS.md`
- **THEN** 系统 SHALL 在文件顶部插入 `@AGENTS.md\n\n`，保留其余内容不变

#### Scenario: User content file already has @AGENTS.md directive

- **WHEN** 文件包含用户自定义内容且顶部已包含 `@AGENTS.md`
- **THEN** 系统 SHALL 不做任何修改

---

### Requirement: Smart file write SHALL apply to both main and domain repos

智能覆写机制 SHALL 同时适用于主仓库和领域子仓库的 CLAUDE.md / AGENTS.md 写入，使用各自对应的模板进行内容对比。

#### Scenario: Main repo init with existing CLAUDE.md

- **WHEN** 在主仓库执行 init 且存在包含用户内容的 CLAUDE.md
- **THEN** 系统 SHALL 使用主仓库模板（`templates/claude-md.md`）进行对比，保留用户内容

#### Scenario: Domain sub-repo init with existing AGENTS.md

- **WHEN** 在领域子仓库执行 init 且存在包含用户内容的 AGENTS.md
- **THEN** 系统 SHALL 使用领域模板（`templates/agents-md-domain.md`）进行对比，保留用户内容
