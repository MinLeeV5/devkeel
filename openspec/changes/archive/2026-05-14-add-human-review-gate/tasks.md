## 1. Schema 定义更新

- [x] 1.1 在 `templates/openspec/schemas/superpowers-bridge/schema.yaml` 的 artifacts 列表中，在 `plan` 之后新增 `human-review` artifact 定义（id、generates、description、template、instruction、requires）
- [x] 1.2 将 `apply.requires` 从 `[plan]` 修改为 `[human-review]`
- [x] 1.3 更新 schema.yaml 顶部 description 中的流程说明，加入 human-review 环节

## 2. 模板文件创建

- [x] 2.1 创建 `templates/openspec/schemas/superpowers-bridge/templates/human-review.md` 模板文件，包含 HTML 生成的 scaffold 结构

## 3. HTML 生成逻辑（写在 artifact instruction 中）

- [x] 3.1 在 human-review artifact 的 instruction 中编写 HTML 生成指令：读取所有已完成的规划 artifact，提取关键信息
- [x] 3.2 定义 HTML 文档结构：内联 CSS、目录导航、各 artifact 对应的 section
- [x] 3.3 定义 agent 提示语：生成完成后展示文件路径，指引用户在浏览器中打开并审阅
- [x] 3.4 定义会话切换提示：告知用户验收完成后运行 `/new` 开新会话，再执行 `/opsx:apply`

## 4. 验证

- [x] 4.1 运行 `openspec validate --all` 确认 schema 修改后仍有效
- [x] 4.2 创建一个测试 change 验证 `openspec status --json` 输出包含 `human-review` artifact 且 `applyRequires` 包含 `human-review`
- [x] 4.3 验证 artifact 依赖链正确：plan → human-review → apply
