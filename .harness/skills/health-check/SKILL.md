---
name: health-check
description: 一键检查项目代码健康度指标
metadata:
  version: "1.0.0"
  author: "devkeel"
  domain: cli-node
triggers:
  - 健康检查
  - health check
  - 代码质量
  - code quality
---

# 代码健康度检查

## 何时使用

- 定期检查项目质量基线
- PR 前快速自检
- 接手项目时了解质量现状

## 检查项

### 1. 类型安全

```bash
pnpm lint  # tsc --noEmit
```

期望：零错误、零警告。

### 2. 测试通过率

```bash
pnpm test
```

期望：全部通过。

### 3. 构建成功

```bash
pnpm build
```

期望：零错误，dist/ 产出完整。

### 4. 测试覆盖度（结构检查）

对比 `src/lib/*.ts` 与 `tests/*.test.ts`，识别缺少对应测试的模块。

```bash
ls src/lib/*.ts | sed 's|src/lib/||;s|.ts||' | sort > /tmp/src-modules
ls tests/*.test.ts | sed 's|tests/||;s|.test.ts||' | sort > /tmp/test-modules
comm -23 /tmp/src-modules /tmp/test-modules
```

### 5. 依赖审计

```bash
pnpm audit --prod
```

### 6. 架构合规

检查 lib 层无 `@clack/prompts` 引入：

```bash
grep -r "@clack/prompts" src/lib/
```

期望：无输出。

## 输出格式

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 类型安全 | pass/fail | 错误数 |
| 测试 | pass/fail | 通过/失败数 |
| 构建 | pass/fail | |
| 覆盖度 | warn/pass | 缺失模块列表 |
| 依赖安全 | pass/warn | 漏洞数 |
| 架构合规 | pass/fail | 违规文件 |
