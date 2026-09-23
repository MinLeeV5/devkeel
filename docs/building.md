# 构建与发布说明

CLI 的 [tsup 配置](../tsup.config.ts)使用单入口 ESM，生成类型声明和 sourcemap，产物输出到
`dist/`。运行目标、Node 要求和发布文件集合分别以 tsup、[package.json](../package.json)
的 `engines`、`files` 为准；依赖保持 external，不在文档中复制一套清单。

[templates/package.json](../templates/package.json)定义独立模板包及发布脚本；
[templates/versions-yml.yml](../templates/versions-yml.yml)是分发资产版本的事实源。
仓库自用记录位于 [.harness/versions.yml](../.harness/versions.yml)。

`prepublishOnly` 会执行构建，但不能替代发布前 lint/test。执行门禁见
[部署与 CI 规则](../.harness/rules/deployment-ci.md)，具体发布操作使用
[release-workflow](../.harness/skills/release-workflow/SKILL.md)，版本说明使用
[changelog](../.harness/skills/changelog/SKILL.md)。发布动作需相应授权。

本项目依赖与发布使用公共 npm registry，安装后的 CLI 遵循目标项目自己的 npm 设置。
CLI 初始化不负责改写用户的 registry；依据见
[初始化契约测试](../tests/init-agents.test.ts)。
