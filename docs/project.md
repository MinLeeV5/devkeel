# 项目概览

DevKeel 是项目知识框架 CLI，为项目建立跨平台的 AI 协作执行入口与领域能力。
[CLI 清单](../package.json)定义运行依赖与发布信息，
[模板包](../templates/package.json)独立管理分发资产。

## 资产职责

| 位置 | 维护内容 |
|------|----------|
| AGENTS.md | 执行契约、路由与文档读取条件 |
| docs/ | 当前有效的项目背景、架构、开发与验证说明 |
| .harness/rules/ | 简短执行约束 |
| .harness/skills/、.harness/agents/ | 可复用工作流与角色 |
| templates/ | 分发到真实项目的执行入口、工作流与 OpenSpec 模板 |
| openspec/specs/ | 当前能力规范 |
| openspec/changes/ | 单次变更的讨论、方案、任务与验证记录 |
| web/ | 文档站与版本目录 |

项目专属规则和文档由当前项目维护。分发 skill 在 templates 中维护源文件，仓库自身使用
.harness 副本；维护时同步内容和相应版本。CLI 的平台链接实现见
[createPlatformLinks](../src/lib/templates.ts)及[技能分发](../src/lib/skill-distribution.ts)。
不同平台的加载方式有差异，链接目录本身不保证规则会按需加载。

## 根项目与子项目

根项目维护自身及跨项目知识，子项目维护领域知识，二者使用同样的知识分类和增量维护方式。
OpenSpec 在 DevKeel 根项目集中协调；子项目在自身目录执行代码修改与验证。

`domain-init` 扫描现状并分类维护 docs、rules、skills 和 agents；`verify-init` 补齐已确认的
测试基建。两者复用同一套测试规则与测试说明，不各自生成一套命令或门槛。

旧任务产物按需手动复制归档；当前有效的项目知识继续保留在 docs 中。
CLI 自动识别平台入口和仓库角色，无需维护 `.harness/config.yml`，具体规则见
[README](../README.md#自动识别无需项目配置文件)。
