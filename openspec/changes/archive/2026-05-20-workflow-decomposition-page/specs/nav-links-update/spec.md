## ADDED Requirements

### Requirement: 导航栏新增工作流链接

所有 `web/*.html` 页面的 `.nav-links` SHALL 新增一个指向 `./workflow.html` 的链接，文本为"工作流"，插入位置在"首页"和"架构设计"之间。

#### Scenario: 链接位置与文本
- **WHEN** 用户查看任意 web/ 页面的导航栏
- **THEN** 导航链接顺序为：首页 → 工作流 → 架构设计 → 最佳实践 → 变更日志 → GitLab 图标

#### Scenario: 当前页高亮
- **WHEN** 用户访问 workflow.html
- **THEN** 导航栏中"工作流"链接带有 `active` class，其他链接无 `active`

### Requirement: 受影响文件清单

以下 6 个文件的导航栏 MUST 同步更新：index.html、workflow.html、architecture.html、best-practices.html、changelog.html、stats.html。

#### Scenario: 所有页面导航一致
- **WHEN** 依次打开上述 6 个页面
- **THEN** 每个页面的 `.nav-links` 包含相同的 5 个文本链接 + 1 个 GitLab 图标链接

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue workflow-decomposition-page
