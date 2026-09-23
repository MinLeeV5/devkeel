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

## Web 与 GitHub Pages

Web 发布产物只有 `web/dist/`，包含 HTML、脚本、样式、图片、安装指南和版本 JSON。
Node.js 与 pnpm 只用于构建；旧 Hono 服务、`dev:server`、`start`、`package:app` 及运行时压缩包
流程已移除。本地操作见 [开发指南](development.md#web-开发入口)。

[Pages 工作流](../.github/workflows/pages.yml)在 `master` 上的相关文件更新后执行测试和构建，
发布到 GitHub Pages；PR 只验证和上传构建产物。也可从默认分支手动触发工作流。
工作流固定使用 `/devkeel/` 前缀，目标地址为 `https://minleev5.github.io/devkeel/`。
首次启用时，在仓库 **Settings → Pages → Build and deployment → Source** 选择
**GitHub Actions**；工作流配置本身不代表站点已经上线。

页面路径以 `web/src/routes.ts` 为准。构建生成真实的 `.html` 文件，因此主站、变更日志和
V1 页面都支持直接访问与刷新；V1 保留旧 URL，但主站导航、页脚和对比区没有入口。
旧章节页生成 HTML 跳转页，未知及已退场页面由静态托管返回 404；不再依赖服务端 302/410。

版本正文仍只维护 `web/public/versions/{cli,templates}/*.json`。
构建校验完整目录并生成 `dist/versions/index.json`，无效条目会使构建失败。
修改版本数据后需要重新构建发布，不直接编辑汇总文件或 `dist/`。

迁移到自定义域名或其他路径时，同步修改工作流中的 `WEB_BASE_PATH`；根路径使用 `/`。
部署设置依据 [GitHub Pages 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
