---
name: instruction-maintenance
description: >
  精简并校验 AGENTS.md、OpenSpec schema/instruction、OPSX commands、SKILL.md、prompt
  与 artifact 模板。用于审查当前 diff 的话术冗余、事实源重复、过长规则或镜像漂移，
  并在不削弱行为、门禁、权限和恢复语义的前提下改写。
metadata:
  author: "devkeel"
  version: "1.0.0"
---

# 指令维护

目标是减少同时进入上下文的重复信息，不追求机械缩短。保留所有会改变动作、停止条件、
权限、失败处理、兼容或恢复结果的规则。

## 1. 建立审查范围

只审查本次任务涉及或当前 diff 修改的指令资产。先运行只读索引脚本：

```bash
node "<skill-dir>/scripts/audit-instruction-diff.mjs" --base HEAD
```

用户明确指定目录时，用可重复的 `--path` 纳入其中所有指令文件，即使文件不在 diff：

```bash
node "<skill-dir>/scripts/audit-instruction-diff.mjs" --base HEAD \
  --path templates/openspec/schemas
```

脚本列出指令文件、长行、解释性话术候选和模板镜像漂移。候选需要人工判断，不自动删除。

## 2. 确认事实源与加载关系

先判断哪些内容会在同一任务中一起加载：

| 资产 | 只保留 |
|------|--------|
| AGENTS.md | 全局优先级、路由、跨流程门禁；不展开命令或 schema 的内部算法 |
| schema.yaml | artifact 图、schema 专属 instruction、执行与关闭门禁 |
| OPSX command | 参数与入口；加载对应 skill 后不重复其算法 |
| SKILL.md description | 能力与触发场景 |
| SKILL.md body | 可复用流程，以及 schema/command 未提供的兼容和失败处理 |
| artifact template | 输出结构、字段约束和格式硬规则，包括 `templates/openspec/schemas/*/templates/` 及镜像 |
| spec / test | 持久行为与验收证据，不作为运行时提示副本 |

只有独立加载的入口才重复必要不变量。若 command 必定加载 skill、skill 必定读取 schema
instruction，就让下游事实源拥有算法，上游只负责选择和传递上下文。

## 3. 判定删改

优先删除或迁移：

- 架构归属、历史原因、实现背景或“本文件负责什么”等旁白；
- 已由目标 skill description 表达的触发条件；
- 同一次加载链中另一事实源的完整算法、字段说明或负向清单；
- 明确命令、状态或 selector 后再次解释其理由；
- 只证明“没有做某事”、但不改变动作或停止条件的话术。

必须保留：

- 会改变路由、执行动作、权限范围或用户确认时机的规则；
- 数据损失、安全、兼容、迁移、回滚和旧状态恢复门禁；
- 失败后的停止、回滚和恢复动作；
- 格式解析器依赖的精确 marker、关键字、层级和命令参数；
- 独立入口无法从其他已加载事实源获得的关键不变量。

无法确认删改是否改变行为时，先查 spec、测试或实际调用链；证据不足则保留并标记。

## 4. 改写

- 一条规则只表达一个条件或动作，使用“场景/条件：动作”。
- 把命令单独成代码块；参数和失败语义另列。
- description 只写“做什么、何时触发”，行为细节放正文。
- 用类别概括同类反例，但不得压掉有不同后果的例外。
- 删除重复后同步修正只匹配旧文案的测试；测试应验证行为片段或事实源归属。
- 不用同义改写制造表面 diff；无法减少认知负担时不改。

## 5. 同步与验证

1. 同步分发模板和 dogfood 镜像；保留 AGENTS 用户槽位。
2. 只有分发型 skill 才同步模板、版本表和模板测试；项目专属 skill 只保留在
   `.harness/skills/`。
3. 运行审计脚本，解决镜像漂移并复查剩余候选。
4. 运行 skill validator、`git diff --check`、邻近契约测试，再按风险扩大。
5. 汇报删减的重复类型、保留的关键门禁、验证结果和仍需人工决定的项。
