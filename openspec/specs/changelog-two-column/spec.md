# Changelog 两栏布局设计

## 背景

`web/changelog.html` 当前将所有版本变更（CLI + 模板）混合在单列中。随着 `devkeel-templates` 独立发版，模板更新频率远高于 CLI，需要分开呈现，并突出模板更新。

## 目标

1. 将 changelog 拆分为**模板**和 **CLI** 两个独立版本流
2. 模板栏视觉突出（更新频繁），CLI 栏紧凑（相对稳定）
3. 历史混合条目收入折叠区，两栏只放分离后的新版本
4. 升级 changelog skill，约束两条流各自的记录规范

## 布局结构

```
[Hero] 版本变更日志

[Update Tip] 如何更新 — 双版本号：CLI v0.7.0 · Templates v1.0.2

[两栏区域]
┌──────────────────────────────┬──────────────────────────┐
│  模板资产（左，~58%）          │  CLI（右，~42%）          │
│  主视觉区，突出               │  次视觉区，紧凑           │
│                              │                          │
│  ● v1.0.2  [最新]            │  ● v0.7.0  [最新]        │
│  ● v1.0.1                    │                          │
│  ● v1.0.0                    │                          │
│                              │                          │
└──────────────────────────────┴──────────────────────────┘

[历史存档]（折叠，默认收起）
  v0.6.0 ~ v0.6.1
  v0.5.6 ~ v0.5.9
  ...
  v0.1
  V1→V2 设计变更说明
```

## 两栏视觉差异

| 维度 | 模板栏（左） | CLI 栏（右） |
|------|------------|------------|
| 宽度 | ~58% | ~42% |
| badge 颜色（最新） | 绿色 accent | 青色 cyan |
| badge 颜色（历史） | 紫色 purple | 灰色 text-4 |
| 卡片样式 | 完整 change-group 卡片（有边框） | 紧凑列表（无边框，更密集） |
| 移动端 | 堆叠在上 | 堆叠在下 |

## Update Tip 改造

标题区域显示双版本号：

```
🚀 如何更新   CLI v0.7.0 · Templates v1.0.2
```

## 模板版本内容（从 git 历史提取）

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.0.0 | 2026-06-15 15:48 | 模板独立 npm 包初始发布，skills / rules / schemas / agents 完整资产包 |
| v1.0.1 | 2026-06-15 17:30 | superpowers-lite schema 升级，apply 阶段新增全量代码审查闭环 |
| v1.0.2 | 2026-06-16 15:50 | 移除 domain 模板体系及孤儿资产，新增 systematic-debugging skill，大量模板精简（-2660 行） |

## 历史折叠区

- 将 v0.1 ~ v0.6.1 所有条目移入折叠区
- 使用 `<details>` + `<summary>` 实现，默认收起
- 保留 V1→V2 设计变更说明（migration 区块）
- 折叠区标题：`历史版本存档（v0.1 ~ v0.6.1）`

## CSS 新增类

```css
/* 两栏容器 */
.changelog-columns {
  display: grid;
  grid-template-columns: 58fr 42fr;
  gap: 32px;
  align-items: start;
}

/* 模板栏 - 主视觉 */
.col-templates { }
.col-templates .version-badge-latest { border-color: var(--accent); color: var(--accent) }
.col-templates .version-badge-minor  { border-color: var(--purple); color: var(--purple) }

/* CLI 栏 - 紧凑 */
.col-cli { }
.col-cli .version-badge-latest { border-color: var(--cyan); color: var(--cyan) }
.col-cli .version-badge-minor  { border-color: var(--text-4); color: var(--text-4) }

/* 移动端堆叠 */
@media (max-width: 768px) {
  .changelog-columns { grid-template-columns: 1fr; }
}

/* 历史折叠区 */
.history-archive summary {
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-3);
  padding: 16px 0;
}
```

## Changelog Skill 升级

在现有 skill 基础上新增以下规范：

### 分流规则

```
变更文件在 templates/ 中？
  ├─ 是 → 记录到「模板」栏
  └─ 否 → 变更文件在 src/ / bin/ / web/ / package.json 中？
           ├─ 是 → 记录到「CLI」栏
           └─ 否 → 不记录
```

### 格式要求（两栏差异）

- 模板栏：完整 change-group 卡片，badge 颜色为 accent（最新）/ purple（历史）
- CLI 栏：紧凑列表，badge 颜色为 cyan（最新）/ text-4（历史）
- 两栏各自维护独立的"最新版本"标记
- Update Tip 同时显示两个版本号

### 历史条目处理

- 两栏分离后，旧条目统一移入折叠区
- 折叠区不区分 CLI/模板，按时间顺序排列

## 不涉及

- 不改动 CLI 源码（src/）
- 不改动模板资产（templates/）
- 不改动其他 web 页面
