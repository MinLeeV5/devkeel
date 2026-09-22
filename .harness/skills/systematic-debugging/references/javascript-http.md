# JavaScript 与 Electron HTTP emitter

仅在插桩升级门禁通过且目标运行时属于 Browser、Node.js 或 Electron 时读取。

## 选择模板

| 运行时 | 模板 | 默认通道 |
|---|---|---|
| Browser | `assets/hdbg-web.js` | `fetch` |
| Node.js | `assets/hdbg-node.cjs` | `http.request` |
| Electron main | `assets/hdbg-node.cjs` | `http.request` |
| Electron renderer | `assets/hdbg-web.js` | `fetch` |
| Electron preload | `assets/hdbg-web.js` | `fetch` |

TypeScript 不使用单独 emitter：先按实际运行时选择上表模板。Browser、renderer 与 preload
探针可调用 `(globalThis as any).__hdbg(event, data)`，或增加一个随 session 清理的最薄全局类型
声明；Node.js 与 Electron main 按项目现有 ESM/CJS 规则导入 `hdbg-node.cjs`，必要时增加临时
`.d.ts` 或 typed wrapper。适配层只解决编译期类型和模块互操作，不复制 HTTP 发送逻辑。

复制模板到目标项目的临时 helper，替换 `__HDBG_ENDPOINT__`、`__HDBG_SESSION__` 和
`__HDBG_RUNTIME__`，并把 helper 路径登记到 session manifest。业务代码只保留单行调用：

```js
/*HDBG:7kx2*/ __hdbg("save:before", { id, state });
```

先发送 `smoke` 事件并在 collector 中确认 runtime/session，再添加其他探针。helper 返回的请求可以
被测试等待，但业务路径不得 `await` 它。

## Electron

main 直接使用 Node 模板；renderer 与 preload 优先使用 Web 模板直连 collector。不要因为临时
调试关闭 `webSecurity`、sandbox、context isolation 或放宽生产 CSP。

只有 direct HTTP 已被 CSP、sandbox、mixed-content 或应用网络策略实证阻止时，才使用窄转发：

```text
renderer/preload --IPC(debug-event)--> main --HTTP--> collector
```

IPC payload 只允许 session、event 和有界 data；main 校验来源与 session 后调用 Node helper。
不要把 `ipcRenderer` 或任意 HTTP 能力整体暴露给页面。collector 协议和查询方式保持不变。

## 低扰动要求

- endpoint 必须可覆盖；容器或远程目标不能假设 `127.0.0.1` 指向宿主 collector；
- 序列化、CSP、连接和超时错误必须在 helper 内收敛，不能改变业务异常路径；
- 不发送大对象、循环对象、凭证或完整请求体；
- 探针影响竞态复现率时立即撤销，并改用更靠近边界的少量事件。
