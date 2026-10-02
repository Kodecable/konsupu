# 实现与验证定性备忘

本备忘记录对 `Konsupu_v0.9_规范.md` 当前实现与测试工作的解释性定性；除非后续规范修订或显式决策推翻，下列结论应作为实现和测试的判定依据。

## Learning 验证与认知空间合法性

规范规定，在 Learning 验证阶段，Runtime 只调用 `Test()`；并且当前 DEMO 暂缓实现 coverage gate。因此，`Test.js` 未触及的 source 可以不在 Learning `finish` 时被执行验证。这是当前已知限制，见规范“代码覆盖率”一节（`Konsupu_v0.9_规范.md:1242`）。

这项运行时范围限制**不表示** Learning 提交时可以跳过对认知空间合法性的验证。认知空间的结构性和接口性约束仍须在提交时作为独立的硬性门槛验证，不能依赖 `Test()` 是否恰好触及对应 source。

特别地，规范所要求的 `Resolve(input)` 函数属于认知空间合法性的硬性门槛，必须始终验证其存在性与可调用性。不能以“Learning Runtime 只调用 `Test()`”或“coverage gate 暂缓”为由省略该验证。

## JavaScript import 权限的运行时判定

对 cognition JavaScript source 的静态校验负责验证 import 的结构性约束：
只能使用静态 ESM import、普通 cognition module 必须使用相对 `.js` 路径、
目标不得逃出 Cognition Space，且 module graph 必须满足 `Interface/`、
`Memory/`、`Resolve.js`、`Test.js` 与 `Test/` 的静态依赖边界。

Host module 的能力可用性和具体操作权限则主要由实际执行时的 JavaScript
execution / `JSContext` 判定，而不是由声明 import 的 cognition source path
判定。一个合法 entry 加载的全部传递依赖继承该 execution 的 Host capability
与权限；同一 module 因而可以在不同 execution 中拥有不同能力。

特别地，`konsupu:input` 可以由 Resolve module graph 中的任意合法传递依赖
导入，不限于根 `Resolve.js`。它只在 Resolve `JSContext` 中可用；在 Input
Translation、Output Translation 或 Test `JSContext` 中加载仍必须失败。
静态校验不应再以 importer 必须为 `Resolve.js` 为条件拒绝该 import。

同样，`konsupu:json` 始终提供完整 API surface；某次 `Read`、`Write`、
`Create`、`Remove` 或 `Move` 是否允许，应由运行时按当前 execution 的角色
和目标 path 检查。I/O Translation 的 transient `js_eval` module 不能直接
import Host module 的限制，属于其临时 entry/module loader 边界的一部分，仍由
运行时 loader 强制。

## Gap 是规范定义的交互结构

`InputTranslationGap`、`ResolveExceptionGap`、`OutputTranslationGap` 及其
对应的 Learning 循环，是 v0.9 规范所定义的 Interaction 结构，而不是实现相对
规范的偏移。实现与测试应审查这些结构是否按规范完成阶段回退、Learning 和重试；
不得仅因存在 Gap 类型或 Gap 分支，就将其列为规范差异。

## Runtime 生命周期互斥

规范的“单任务单线程”要求 Runtime 在一个 Cognition Space 中只维持一个 active
Interaction / Learning workflow；对外部进程并发修改的锁定方式则留给实现决定。
当前实现将这一要求落实为每个 Cognition Space 同时最多有一个活跃 Application
Session。

该锁是 Cognition Space 根目录的隐藏 Runtime 元数据：`.runtime.lock`。按规范，
点路径不属于 cognition，Runtime 在所有 Agent-facing 文件边界忽略并拒绝访问它。
锁不属于某个 Revision backend 的元数据，因而不依赖 Git 或 `.git` 的存在；所有
Revision backend 都必须把隐藏路径排除在 capture、restore 与 clean 之外。正常
`Session.Close()` 会释放锁；异常退出时，操作系统关闭进程所持文件描述符并释放
advisory file lock。遗留的空锁文件不等同于活跃锁，不需要、也不能通过“删除
stale lock 文件”来恢复运行：删除一个仍被持有的锁文件会令后来进程锁住新的 inode，
形成分裂锁。

## Revision 后端识别标记

当前 Git Revision 后端在 Cognition Space 根目录写入隐藏的 `.konsupu` 文件，
内容包含实现格式版本。该文件是 Runtime 私有元数据，不属于 cognition，也不
进入 Revision。`konsupu test` 只有在同时发现 Git 存储和该标记时才直接使用
现有 Revision；普通 Git 仓库中的 Cognition-like source 会复制到临时目录，
避免在用户的 Git 仓库中创建 Konsupu 元数据。

## Raw 与 Answer 的空白输入

仅由空白字符构成的 Raw 必须被拒绝，并视为调用者错误。

对于仅由空白字符构成的 Answer，当前实现仅作拒绝处理，不额外解释或细分其错误原因；这是有意保留的实现简化，而非对 Raw 输入规则的放宽。
