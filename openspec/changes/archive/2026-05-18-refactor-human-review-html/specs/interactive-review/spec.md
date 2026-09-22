## ADDED Requirements

### Requirement: Sections SHALL be collapsible with state persistence

human-review.html 中的章节（01 需求与设计、02 实现任务）SHALL 支持点击标题折叠/展开，折叠状态通过 localStorage 持久化。

#### Scenario: 默认展开状态

- **WHEN** 评审者首次打开 human-review.html
- **THEN** Dashboard 和所有章节 SHALL 默认展开

#### Scenario: 折叠后刷新保持状态

- **WHEN** 评审者折叠了某章节后刷新页面
- **THEN** 该章节 SHALL 保持折叠状态（从 localStorage 恢复）

#### Scenario: 折叠视觉效果

- **WHEN** 章节被折叠
- **THEN** 章节内容 SHALL 隐藏，仅显示标题行，标题行包含折叠指示器（箭头方向变化）

### Requirement: Artifact viewer SHALL render markdown on-demand via marked.js

human-review.html SHALL 在页面底部包含 Artifact 原文查看器，以标签页形式展示所有 planning artifact 的 .md 原文。

#### Scenario: Markdown 内嵌方式

- **WHEN** 生成 human-review.html
- **THEN** 每个 artifact 的 .md 原文 SHALL 以 `<script type="text/markdown" data-artifact="<name>">` 标签内嵌

#### Scenario: 内嵌由 inject-review 脚本完成

- **WHEN** agent 生成 human-review.html
- **THEN** agent SHALL 在 artifact 查看器位置输出 `<!-- INJECT:artifacts -->` 占位符，由 `inject-review` 脚本扫描同目录 .md 文件并注入

#### Scenario: 标签页切换渲染

- **WHEN** 评审者点击某个 artifact 标签
- **THEN** SHALL 使用 marked.js 将对应 `<script>` 标签内容解析为 HTML 并显示在 panel 中

#### Scenario: marked.js 加载失败降级

- **WHEN** marked.js CDN 加载失败
- **THEN** artifact viewer SHALL 以 `<pre>` 标签显示 .md 原始文本

### Requirement: inject-review script SHALL handle fixed content injection

`devkeel inject-review <html-path>` 子命令 SHALL 负责注入所有固定内容（.md 原文 + 通用 CSS），Agent 只负责生成可变内容（Dashboard SVG、章节渲染、标题日期）。

逻辑层：`src/lib/inject-review.ts`（纯函数）
命令层：`src/commands/inject-review.ts`（Commander 注册）

#### Scenario: 注入 artifact .md 原文

- **WHEN** 执行 `devkeel inject-review openspec/changes/<name>/human-review.html`
- **THEN** SHALL 扫描同目录下所有 .md 文件，将每个文件内容注入到 `<!-- INJECT:artifacts -->` 占位符处，格式为 `<script type="text/markdown" data-artifact="<filename-without-ext>">`

#### Scenario: 注入通用 CSS

- **WHEN** HTML 中包含 `<!-- INJECT:css -->` 占位符
- **THEN** SHALL 读取 `devkeel` 发布包内置的 `web/human-review.css` 内容并以 `<style>` 标签替换占位符

#### Scenario: specs 目录处理

- **WHEN** change 目录下存在 `specs/` 子目录
- **THEN** SHALL 将所有 `specs/*/spec.md` 合并为一个 `<script type="text/markdown" data-artifact="specs">` 标签

#### Scenario: 扫描同目录全部 markdown 文件

- **WHEN** change 目录下存在额外的 `.md` 文件（如 `plan.md`、`verify.md`）
- **THEN** SHALL 一并扫描并注入为对应的 `<script type="text/markdown" data-artifact="<filename-without-ext>">`

#### Scenario: 缺失资源时失败

- **WHEN** 页面包含 `<!-- INJECT:css -->` 或 `<!-- INJECT:js -->` 占位符，但包内置资源不存在
- **THEN** SHALL 报错并以退出码 1 退出，不静默输出缺失资源的降级 HTML

#### Scenario: 脚本幂等

- **WHEN** 对同一 HTML 多次运行 `devkeel inject-review`
- **THEN** SHALL 产出相同结果（先清除 `<!-- BEGIN:artifacts -->...<!-- END:artifacts -->` 和 `<!-- BEGIN:css -->...<!-- END:css -->` 区块再重新注入）

### Requirement: inject-review SHALL be auto-invoked via npx after HTML generation

schema.yaml 的 human-review instruction SHALL 指引 agent 在生成 HTML 后立即通过 npx 调用 inject-review，对用户透明。

#### Scenario: 自动调用

- **WHEN** agent 生成完 human-review.html（含占位符）
- **THEN** agent SHALL 立即执行 `npx devkeel@latest inject-review <html-path>`

#### Scenario: registry 未配置时自动配置

- **WHEN** 执行 npx 前检测到 `.npmrc` 中缺少 `registry` 配置
- **THEN** SHALL 先执行 `npm config set registry https://registry.npmjs.org/` 再重试

#### Scenario: 调用失败处理

- **WHEN** npx 调用返回非 0 退出码
- **THEN** agent SHALL 报告错误信息并提示用户手动检查，不继续后续步骤

注入完成后 SHALL 自动校验 HTML 结构完整性，发现问题时报错退出。

#### Scenario: 校验通过

- **WHEN** 注入完成且 HTML 结构正确
- **THEN** SHALL 以退出码 0 退出，输出成功信息

#### Scenario: script 标签未正确闭合

- **WHEN** 注入后存在未闭合的 `<script>` 标签
- **THEN** SHALL 报告错误并以退出码 1 退出，不输出损坏的 HTML

#### Scenario: .md 内容含 script 闭合标签

- **WHEN** .md 文件中包含 `</script>` 文本
- **THEN** SHALL 转义为 `<\/script>` 后再注入，确保不破坏 HTML 结构

#### Scenario: 必要结构标记缺失

- **WHEN** 注入后 HTML 缺少 `<!DOCTYPE html>` 或 `</html>` 闭合标签
- **THEN** SHALL 报告错误并以退出码 1 退出

#### Scenario: 空目录无 .md 文件

- **WHEN** change 目录下无 .md 文件
- **THEN** SHALL 在 `<!-- BEGIN:artifacts --><!-- END:artifacts -->` 中注入空内容，不破坏 HTML 结构

### Requirement: Diff blocks SHALL use GitHub-style coloring

human-review.html 中的 diff 代码块 SHALL 使用 GitHub PR 风格的行级着色。

#### Scenario: 增加行样式

- **WHEN** diff 代码行以 `+` 开头
- **THEN** 该行 SHALL 使用浅绿色背景（浅色模式 `#dcfce7`，深色模式 `rgba(34,197,94,0.15)`）

#### Scenario: 删除行样式

- **WHEN** diff 代码行以 `-` 开头
- **THEN** 该行 SHALL 使用浅红色背景（浅色模式 `#fee2e2`，深色模式 `rgba(239,68,68,0.15)`）
