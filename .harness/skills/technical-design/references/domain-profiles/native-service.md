# Native Service Profile

适用于运行在本机的后台服务、daemon、agent、privileged helper，例如 Windows Service、macOS LaunchDaemon、Linux systemd service。它通过 IPC、系统 API、文件系统、注册表、设备或 OS 权限向本机其他进程提供能力。

| 维度 | 策略 | 默认优先级 | 触发条件 | 输出深度 |
|------|------|------------|----------|----------|
| D01 范围、目标与非目标 | 必选 | core | 任意本地系统服务变更 | 说明服务能力、调用方、平台和非目标 |
| D02 架构边界与模块关系 | 条件 | supporting | 服务进程、客户端进程、helper、驱动或插件关系变化 | 写清进程和模块关系 |
| D03 运行边界与职责归属 | 必选 | core | Windows Service、daemon、agent、privileged helper 变更 | 写清服务运行位置、账号/session、调用方和职责边界 |
| D04 流程与失败路径 | 必选 | core | 启动、停止、IPC 调用、系统 API 调用、资源申请 | 覆盖主流程、失败路径和资源清理 |
| D05 契约与接口 | 必选 | core | IPC、命名管道、本地 socket、COM/RPC、协议或错误码变化 | 定义调用契约、超时、错误模型和版本 |
| D06 数据与状态 | 条件 | supporting | 本地配置、缓存、注册表、文件状态、任务状态 | 写清状态归属、生命周期和清理 |
| D07 UI 与交互 | 条件 | skip | 服务自身通常无 UI；有桌面 UI 调用时由 desktop profile 启用 | 不展开或引用调用方 UI 设计 |
| D08 性能与资源 | 条件 | supporting | IPC 并发、阻塞系统 API、句柄、内存、CPU、启动耗时变化 | 使用本机资源和响应指标 |
| D09 可靠性与恢复 | 条件 | core | SCM/systemd 重启、崩溃恢复、调用方断开、部分失败 | 展开恢复、幂等和资源释放 |
| D10 安全与隐私 | 条件 | core | IPC ACL、服务账号、UAC/提权、系统 API、文件/注册表/设备权限 | 使用 native-service lens |
| D11 可观测与诊断 | 条件 | supporting | Event Log、本地日志、dump、IPC trace、诊断包 | 输出诊断信号和脱敏要求 |
| D12 兼容与迁移 | 条件 | supporting | 安装、注册、升级、卸载、回滚、协议升级、旧配置迁移 | 写兼容、迁移和回滚 |
| D13 验证策略 | 必选 | core | 任意本地系统服务变更 | 覆盖单测、IPC 集成、权限、安装/启动/停止验证 |
| D14 风险与决策 | 必选 | core | 任意本地系统服务变更 | 记录权限、兼容、恢复和平台取舍 |
