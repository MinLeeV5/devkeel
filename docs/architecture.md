# 架构说明

## CLI

| 入口 | 职责 |
|------|------|
| [bin/devkeel.js](../bin/devkeel.js) | 转发到编译入口 |
| [src/index.ts](../src/index.ts) | Commander 命令注册 |
| [src/commands/](../src/commands/) | 参数、交互与执行编排 |
| [src/lib/](../src/lib/) | 版本、检测、模板、链接、更新与其他实现能力 |
| [templates/](../templates/) | AGENTS、skills、agents、commands 与 OpenSpec 模板 |

[versions.ts](../src/lib/versions.ts)负责资产版本；
[templates.ts](../src/lib/templates.ts)封装模板操作和平台链接；
[templates-dir.ts](../src/lib/templates-dir.ts)解析模板目录；
[agents-md.ts](../src/lib/agents-md.ts)将旧入口的用户内容合并到根或子项目模板。
已知槽位按名称保留，旧 domain 内容合并到 project；L0 默认路由与自定义内容一并保留。
已填槽位落盘时移除边界注释，未填槽位保留占位。更新时通过来源模板的相邻正文恢复边界；
清理前核对可恢复性，未知或无法唯一定位的槽位保留标记。根、子项目转换时，专项路由可通过
独立附录保留。手动改写边界或后续模板改变锚点时，可能需要人工迁移；CLI 无法可靠识别时
会提示，并在用户确认后将原文完整保留到新模板中。
未知槽位或非受管正文会保留到 project 槽位，语义迁移由初始化 skill
在确认范围内完成，CLI 模板更新不自动搬走正文。

[detect.ts](../src/lib/detect.ts)从 Git 子模块关系和 AGENTS 领域标记识别仓库角色；
平台由现有目录和入口文件识别，CLI 不读取或生成 `.harness/config.yml`。
[update.ts](../src/lib/update.ts)维护资产更新和兼容迁移。

约束见 [架构规则](../.harness/rules/architecture-constraints.md)。例如 templates 调用版本读取、
detect 复用模板目录检查能力；模块依赖应保持无环。模板渲染使用 `{{VAR}}` 替换，具体实现以
[renderTemplate](../src/lib/templates.ts)为准。

## Web

Web 是有独立 [package.json](../web/package.json) 的子项目，使用 React、Vite 与 Hono。
CLI 与 Web 的 TypeScript 模块解析方式不同：对应约束见
[编码规则](../.harness/rules/coding-standards.md)和[Web 规则](../.harness/rules/web-frontend.md)。
页面路由、旧 URL 生命周期和静态资源分别由 Web 目录中的实现维护。

CLI 与 Web 的验证入口分别见 [测试说明](testing.md)。构建和分发关系见
[构建与发布说明](building.md)。
