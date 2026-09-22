# Java 8+ HTTP emitter

仅在插桩升级门禁通过且目标为 Java 时读取。

复制 `assets/Hdbg.java` 到目标代码的相同 package，按项目需要在 BEGIN/END 标识之间补 package 声明，替换
`__HDBG_SESSION__`，并在 manifest 中把该文件登记为 helper。模板只使用 Java 8 语法和标准库：

- `HttpURLConnection` 发送 `text/plain`；
- 有界单线程 daemon executor 避免阻塞业务线程和阻止 JVM 退出；
- 短连接/读取超时与丢弃策略限制调试开销；
- 所有发送异常在 helper 内收敛。

调用保持单行：

```java
/*HDBG:7kx2*/ Hdbg.log("save:before", "id=" + id + ",state=" + state);
```

通过 system property 或环境变量覆盖配置：

| 配置 | System property | Environment |
|---|---|---|
| Collector endpoint | `hdbg.endpoint` | `HDBG_ENDPOINT` |
| Session | `hdbg.session` | `HDBG_SESSION` |
| Runtime | `hdbg.runtime` | `HDBG_RUNTIME` |

项目已有 Jackson/Gson 时可以自行把 data 序列化成 JSON 字符串，但不得为了临时调试增加生产依赖。
测试或进程受控退出前可以调用 `Hdbg.flush(timeoutMillis)`；正常业务探针不调用、不等待。

兼容验证：

```bash
javac -source 8 -target 8 Hdbg.java
```

在 JDK 9+ 上使用 `javac --release 8`，并至少用 JDK 8 与一个现代 LTS JVM 运行 smoke 事件。
