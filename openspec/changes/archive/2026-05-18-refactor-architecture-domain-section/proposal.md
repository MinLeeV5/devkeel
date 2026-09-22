## Why

当前 architecture.html 的「领域包」章节以静态的前端/后端示例列表为主，给读者留下"预置模板"的印象。但 harness 已具备 `domain-init` skill，能对任意项目自动扫描并生成专属领域能力。架构页面需要准确反映这一核心差异化能力，帮助用户理解 harness 不只是分发模板，而是智能生成定制规范。

## What Changes

**领域包章节内容**
- From: 以"前端领域包"和"后端领域包"两个固定示例列表为核心展示
- To: 以 domain-init 四阶段流程为核心，前端/后端示例降级为"产出样本"
- Reason: 突出产品核心能力——智能扫描生成
- Impact: 非破坏性，仅影响文档展示页面

## Capabilities

### 新增能力

- `web-architecture-page`: architecture.html 领域包章节展示 domain-init 流程

### 修改能力

无

## Impact

- `web/architecture.html` — 领域包章节 HTML 内容重写
- 可能新增少量 `<style>` 块中的 CSS（流程图样式）
