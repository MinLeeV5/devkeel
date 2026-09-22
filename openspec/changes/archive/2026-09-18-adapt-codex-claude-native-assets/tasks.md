# 实施任务

来源为已确认的 [brainstorm.md](brainstorm.md)，共 11 D / 0 A / 0 O。本轮仅处理 Codex 与 Claude Code 的 skills 及必要分发、保护和验证；`.harness/agents` 与其他资产的独立原生改造不在范围内。

## 交付结果

- [x] **1. 共享技能包可由两端原生读取和调用**
  - **来源：** [D-01](brainstorm.md#d-01)、[D-02](brainstorm.md#d-02)、[D-04](brainstorm.md#d-04)、[D-05](brainstorm.md#d-05)、[D-12](brainstorm.md#d-12)；brainstorm 中的官方文档、现有技能元数据和平台工具名调查。
  - **结果：** 共享流程保留在 `SKILL.md`，必要的 Claude 配置使用 frontmatter、Codex 配置使用技能包内的 `agents/openai.yaml`；确有差异的执行说明拆入按需读取的平台参考文件。现有技能的触发描述和工具使用说明适配实际平台能力，保留手动调用与现有授权边界，不把自定义字段当作平台原生行为，也不批量将自然语言授权改成仅接受手动技能命令。
  - **范围：** `templates/skills/` 及相应 `.harness/skills/` 使用副本中的相关内容、元数据与参考文件；按[版本规范](../../../../.harness/rules/skill-versioning.md)同步受影响的 `templates/versions-yml.yml` 条目，不涉及 `.harness/agents/`。
  - **验证：** 检查所有改动技能的 frontmatter、Codex 元数据和参考链接；运行相关模板及指令一致性用例，核对模板与使用副本、版本记录一致；实际触发与调用由任务 6 验证。

- [x] **2. 两端 skills 目录持续直连共享源，日常维护无需同步**
  - **来源：** [D-02](brainstorm.md#d-02)、[D-06](brainstorm.md#d-06)、[D-12](brainstorm.md#d-12)、[D-14](brainstorm.md#d-14)；[现有平台链接实现](../../../../src/lib/templates.ts)。
  - **结果：** `.claude/skills` 与 `.agents/skills` 指向 `.harness/skills`；完成初始分发后新增或修改源技能，两端路径可直接读取相同内容。相关初始化、同步、更新和修复路径保留此关系，重复执行不破坏既有资产；skills 分发不再依赖删除整个平台目录。技能说明明确区分“无需 Harness 同步”和平台运行中会话的列表刷新行为。
  - **范围：** `src/lib/templates.ts`、`src/commands/init.ts`、`src/commands/sync.ts`、`src/commands/update.ts` 中相关 skills 路径及邻近测试；与任务 3、4 的冲突保护衔接，其他资产不作原生格式改造。
  - **验证：** 在临时项目覆盖新建链接、已有正确链接和重复分发；新增、修改 `.harness/skills` 后不调用同步，从两端入口读取并比对内容；保留其他平台文件作为对照，检查内容和链接目标未被误改。执行相关 `tests/templates.test.ts`、`tests/init.test.ts`、`tests/sync.test.ts`、`tests/update.test.ts` 用例。

- [x] **3. skills 归属可追踪，迁移和默认同步在冲突前停止**
  - **来源：** [D-09](brainstorm.md#d-09)、[D-13](brainstorm.md#d-13)、[D-14](brainstorm.md#d-14)；brainstorm 中关于缺少归属清单和已有链接未验证目标的事实，以及[当前 sync](../../../../src/commands/sync.ts)先写配置再重建平台目录的实现。
  - **结果：** skills 受管清单记录链接目标，实际写入受管文件时记录校验值；后续同步能识别手动修改。旧链接仅在确认指向本项目 `.harness/skills` 时接管；真实目录和归属不明的同名内容作为冲突保留。整批预检通过后才开始同步写入，默认冲突列出具体目标并停止，不留下提前更新的同步配置或部分平台结果。
  - **范围：** skills 分发所需的 `src/lib/` 归属与检查逻辑、相关命令接入和邻近测试；状态仅覆盖本轮 skills 受管产物。
  - **验证：** 覆盖首次接管已知旧链接、后续同步、链接被改向、同名真实目录，以及存在受管文件时的内容修改；在多个目标中设置一个冲突，比较操作前后目录、配置和清单，确认未进行同步写入且冲突信息可定位。

- [x] **4. 显式强制覆盖先完成备份，并保留无关内容**
  - **来源：** [D-09](brainstorm.md#d-09)、[D-10](brainstorm.md#d-10)、[D-11](brainstorm.md#d-11)、[D-14](brainstorm.md#d-14)。
  - **结果：** skills 同步提供显式强制覆盖入口；覆盖冲突目标前自动备份并输出位置，备份失败则停止覆盖。强制选项只处理此次受管目标，不扩大到其他资产，也不清空平台目录；帮助和错误提示准确说明默认保留、强制覆盖及备份结果。
  - **范围：** `src/index.ts`、相关 skills 同步命令及 `src/lib/` 备份逻辑、CLI 帮助和对应测试；保持其他命令已有覆盖语义在本轮范围之外。
  - **验证：** 对同一冲突分别验证默认执行与显式强制执行，检查备份内容和输出位置；注入备份失败，确认冲突原件及其他同步目标未被覆盖；覆盖真实目录、文件和不同目标链接，并核对平台目录内其他资产保持完整。

- [x] **5. 配置检查能识别 skills 入口与技能包的实际问题**
  - **来源：** [D-02](brainstorm.md#d-02)、[D-04](brainstorm.md#d-04)、[D-05](brainstorm.md#d-05)、[D-09](brainstorm.md#d-09)、[D-12](brainstorm.md#d-12)、[D-13](brainstorm.md#d-13)、[D-14](brainstorm.md#d-14)；[当前 doctor 检查](../../../../src/commands/doctor.ts)主要判断目录或链接存在的事实。
  - **结果：** skills 检查区分正确共享链接、断链、错误目标和同名真实目录，并检查技能入口及已使用的原生元数据格式；不再仅因目录存在就宣称适配正常。若执行 skills 修复，遵守整批预检、归属及冲突保护，不覆盖未获显式强制选择的用户内容。
  - **范围：** `src/commands/doctor.ts` 中的 skills 检查及必要共享逻辑、`tests/doctor.test.ts` 与相关分发测试；其他资产检查保留原有职责。
  - **验证：** 用正确包、缺失或不可读的入口、断链、错误链接目标、无效 frontmatter 和无效 Codex 元数据验证诊断可定位；验证修复路径遇到用户冲突时仍保留内容；实际平台发现和调用另由任务 6 证明。

- [x] **6. 两端调用、免同步行为及范围回归有可复查证据**
  - **来源：** [D-02](brainstorm.md#d-02)、[D-04](brainstorm.md#d-04)、[D-05](brainstorm.md#d-05)、[D-06](brainstorm.md#d-06)、[D-12](brainstorm.md#d-12)及 brainstorm 的验证映射；[现有运行验证](../../../../tests/integration/lib/run-turn.sh)仅封装 Claude 的事实。
  - **结果：** 在 Codex 和 Claude Code 的目标版本上，代表性技能的原生显式调用、适用时的隐式触发与不应触发场景均有实际运行证据；记录新增、修改技能后的读取及技能列表刷新条件。平台扩展共存、按需加载与授权边界得到验证，其他资产未因 skills 适配被迁移或改写。
  - **范围：** `tests/integration/` 中适用技能场景与必要执行支持、相关技能使用说明，以及本 change 下的验证记录；复用已有测试基础。
  - **验证：** 在隔离测试项目逐项执行已确认验证映射，记录平台版本、输入、触发路径和结果，覆盖含平台专属配置及平台参考文件的代表性技能；运行改动邻近的 Vitest 用例和 `pnpm lint`，核对最终 diff 仅涉及 skills 及必要分发。未完成的平台实测明确列为未验证，不以目录或静态检查通过替代。
