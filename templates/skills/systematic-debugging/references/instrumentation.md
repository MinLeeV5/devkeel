# 定向 HTTP 插桩

只有主 `SKILL.md` 的插桩升级门禁全部满足后读取本文件。

## 会话计划

1. 生成短 session，例如 `7kx2`。
2. 写出每个探针要区分的假设和预期事件，不添加无预测的探针。
3. 选择运行时 adapter：Browser、Node.js 和 Electron 读取 `references/javascript-http.md`；
   Java 8+ 读取 `references/java8-http.md`。
4. 启动 collector 后先发送一条 smoke 事件，确认目标运行时可达，再修改更多位置。
5. 创建临时 manifest，记录 project root、session、触及文件和新增 helper。

默认 manifest：

```json
{
  "session": "7kx2",
  "root": "/absolute/project",
  "files": ["src/save.ts"],
  "helpers": ["src/hdbg.js"]
}
```

## 标识与探针预算

单行探针使用：

```js
/*HDBG:7kx2*/ __hdbg("save:before", { id });
```

多行 helper 使用：

```text
/*HDBG:7kx2:B*/
... helper ...
/*HDBG:7kx2:E*/
```

标识必须带本次 session。先在组件边界和坏状态首次出现位置两侧放置少量探针；一次运行后根据证据
移动或删除，不不断累加。不要记录秘密、凭证、完整请求体或无界对象。

## HTTP 协议

collector 统一接收：

```text
POST /log?s=<session>&r=<runtime>&e=<event>
```

- `application/json` 可以发送结构化 envelope 或直接 data；
- JSON envelope 使用显式 `data` 字段；没有 `data` 字段的 JSON 值作为直接 data 原样保留；
- `text/plain` 用于无 JSON 依赖的运行时；
- collector 负责补齐顺序和服务端时间；客户端可以提供 file、function、line、correlation 等元数据；
- emitter 必须短超时、失败不影响业务控制流，并允许覆盖 endpoint。

启动和查询：

```bash
node <skill-path>/scripts/bootstrap.js
curl "http://127.0.0.1:9876/logs/7kx2"
```

## 证据分析

按事件顺序回答：

- 预期路径是否执行；
- 数据在哪个边界首次偏离；
- 时序、线程、进程或 correlation 是否符合预测；
- 哪些假设被证实或否定；
- 探针是否改变复现率或控制流。

日志只用于验证假设；结论必须指向根因路径，而不是把最后一条事件当作根因。

## 清理

成功、失败、中断和放弃假设都执行：

```bash
node <skill-path>/scripts/cleanup.js --session 7kx2 --root <project-root>
node <skill-path>/scripts/cleanup.js --session 7kx2 --root <project-root> --check
```

cleanup 只能处理指定 session。确认探针、helper 和 manifest 已移除，collector 已关闭，原始反馈信号
仍可运行。清理失败时停止后续修改，报告残留文件和精确 session。
