# Konsupu Foundation 规范备忘

本备忘自 2026-09-09 起持续记录对 `Konsupu_Foundation_规范草案.md` 的补充与修正，作为后续实现和测试的判定依据。与草案表述冲突时，以本备忘为准；未涉及的内容继续遵循草案。本文只记录已经确认的语义，不规定具体 API 名称、索引结构或模块拆分。

## 1. Resolve 的三个阶段

Resolve 明确分为依次进行的三个阶段：

1. **Input 结构扫描与检验。** 在此阶段至少完成对所有 Situation 下变量 resolve 状态的认定，并尽可能识别非法的取值依赖。这里要求语义上等价完成，不要求物理枚举或预先存储每个 Situation 与每个 Variable 的组合，也不要求采用特定扫描次数或数据结构。本阶段不执行领域求值，不把结构上的 resolved 认定当成实际 value 已写入。
2. **变量解析。** 按 Input 中 Query 的顺序执行实际求解；本阶段成功完成时，至少完成所有 resolved 变量所需的实际 value 写入。继承和由 `ref` 得到的项通过其代表的来源访问 value，不要求为每个继承视角复制 effect。
3. **祈使执行。** 在本阶段收集所有祈使候选、判定适用性，取得完整有效祈使集合，然后执行。沿用草案关于联合处理完整祈使集合、完成所有 remaining 后才交付输出的要求。

草案的 Imperative Discovery 与 Imperative Resolution 同属第三阶段。

## 2. Situation 内的结构 resolve 状态

一个 Situation 内，变量的结构 resolve 状态不因 Query 或子 Situation 的声明位置而变化。子 Situation 的声明位置不构成对父 Situation 变量 resolve 状态的截断点。

即使父 Situation 中的变量是在子 Situation 声明之后才被 Query，该变量在子 Situation 中依然是继承可访问的 resolved 变量。不能因父 Query 在线性顺序中较晚，就为子 Query 建立独立本地来源。

以下三项仍须区分：

| 项目 | 含义 |
|---|---|
| 结构 resolve 状态 | 从相应 Situation 看，变量是否具有合法 resolution 来源；由第一阶段认定 |
| 实际 resolution | 相应来源的求解是否已经执行并写入 JS value；由 Variable effect 表示 |
| 显式 Query/export | Situation 自己是否显式 Query 该引用，使其进入该 Situation 的 exports |

结构上的 resolved 不表示执行到任意位置时 value 都已经可读。`undefined` 仍是合法的实际 resolution value，不能用来代替“value 尚未写入”的状态。

**结构 resolve 状态按一次完整 Input 扫描认定，与位置无关。** 一个 Situation 内变量的 structural resolvedness 不因 Query 或子 Situation 的声明位置而变化，祖先 Query 即使在 Input 中较晚出现也照样是后代引用的来源。子 Situation 是对父 Situation 的细化：它继承祖先已有的 resolution，只补上祖先留空的。Query 的执行顺序与实际取值依赖仍受第 3 节约束。

显式 exported 状态同样按整个 Input 认定，不受 Query 位置限制。`ref(sourceSituation, variable)` 要求 source 自己显式 Query 过该引用，但不要求该 Query 出现在 ref 使用点之前。满足其他结构要求时，先使用 ref、后出现 source Query 是合法构造；真正读取 value 时仍须检查实际求解是否完成。

## 3. 继承变量的 Query 与执行顺序

Query 按 Input 顺序执行。子 Query 对继承的、结构上已经 resolved 的变量不进行实际求解，同时登记子 Situation 自己的显式 export。

例如，下列顺序本身不构成提前取值错误：

```text
在父 Situation 中声明变量 v
声明子 Situation
子 Situation Query(v)
父 Situation Query(v)
```

第一阶段认定子内的 `v` 继承父级 resolution 来源。第二阶段执行子 Query 时，不对此变量执行实际操作，只登记 export；随后由父 Query 写入实际 value。子 Query 的登记行为本身不要求读取该 value。

若某个 Query 同时包含继承变量和仍需实际求解的变量，继承项不进入实际求解的 remaining；原始 Query 仍保留完整要求。实际求解其余变量时，如果确实需要读取继承项的 value，则必须满足取值时的执行依赖。

因此，“结构上 resolved”“已显式 export”与“value 已产生”不能混为一件事。仅在认知中引用 Variable，也不等于立即读取其 value。

## 4. 提前取值属于 Input 构造错误

当一个变量在结构上已经 resolved，但提供其 value 的 Query 尚未执行时，实际读取该 value 属于错误的 Input 构造。

第一阶段若能识别这种执行依赖，应当直接报告输入构造错误。第一阶段不要求执行领域算法或分析任意 JavaScript 来预测全部取值行为。

允许在第二或第三阶段才发现并报告此类错误，例如领域代码通过 Query 的 API 实际读取 value 时才触发检查。无论在哪个阶段发现，错误仍然定性为 Input 构造错误，通过 Runtime 的 `InputObjectInvalidError` 交接返回 Input Translation 修复，不因发现较晚而改为交给 Learning 的领域求解异常。

不得通过返回 `undefined` 掩盖尚未写入的 value，也不得为满足这种依赖而擅自改变 Query 的执行顺序。

这一分类针对上述输入构造与取值依赖错误，不把一般领域实现异常一并改为输入错误。返回 Input Translation 时，继续遵循草案和 Runtime 关于恢复持久状态、使用新 Resolve 状态，以及提示输入对象图可能已经被修改的要求。

## 5. 求解视角与 Foundation 访问 API

领域求解入口总是从 Query 或 Imperative 开始，求解视角固定在该入口。Foundation 应当提供足够的 API，支持从这个视角访问 Situation 树、认知关系和变量状态，并处理相应的继承与 `ref` 的来源读取。

底层 state 的物理布局不应要求领域代码自行重新解释 resolution 来源规则。具体通过成员函数、辅助函数或内部状态关联实现，由实现决定；本备忘不增加新的固定领域入口，也不要求给现有入口增加参数。

虽然 JavaScript 技术上允许用多种方式访问变量，认知代码规范应当要求：Query 求解从 `query.variables` 中的要求变量出发，沿这些变量参与的绑定、约束等认知关系展开访问，而不是脱离当前求解要求任意扫描变量并拼凑求解依据。

这种关系访问包括反向查找。例如，命题的数据成员引用了某个 Variable，即使 Variable 自身没有保存反向链接，也应当能够从当前 Query 的该变量出发找到相关命题，再沿命题的其他参数展开访问。

该要求约束认知代码的访问路径，不要求所有关系都物理存放在 Variable 的字段中。实现可以建立反向索引，也可以采用其他语义等价的方法。“绑定关系”不表示新增 Binding Node。

Query 或 Imperative 已经提供求解视角；不要求领域调用者为选择 resolution 来源另外传入任意使用位置。实际 value 是否可读，仍须遵循本备忘关于执行依赖及输入错误的规定。

## 6. ref 的成员读取与转出

本节替代此前“方法返回的对象图中的 Variable 也必须转成 ref”的约定。ref 的元数据是一条扁平记录，不是链：`ref(child, ref(leaf, v))` 在构造时就压平为 `ref(child, v)`，中继路径由沿途 Query 的 export 记录承载，不记录在 ref 上。

从 `ref` 的返回值上读取成员：非 Variable 成员原样返回；成员是裸 Variable 时，当场生成一个同 source 的扁平临时引用（记录它是从哪个 Variable 上读出的），之后读取它会落在该视角下正确的值槽。方法可以调用，`this` 是该返回值本身，结果原样返回；数组、Map、Set 等容器也原样返回。因此嵌在方法结果或容器内部的 Variable 是裸的：值要与来源一起流转时，必须显式写 `ref(source, variable)`，不能用成员访问替代。value 本身是 Node 时，它语义字段里的 Variable 属于该 Node 的声明结构，不算嵌套在值里的裸 Variable（对照第 14 节的顶层禁令），读取时得到裸 Variable，按本节处理；该 Node 所在 Situation 不是读取视角的祖先时的约定见第 15 节。

`ref` 的返回值是只读视图：写入、删除与属性定义一律拒绝，不转发给被引用的 Node，元数据 Symbol 也不例外。

`ref` 的返回值是转出项，不是求解项：把它列入 Query 只登记 export、不实际求解，值始终由 sourceSituation 提供，也不改变 sourceSituation 中原始 Variable 的 effect。没有值来源的 Variable 不可读取，属输入构造错误。

`ref(sourceSituation, variable)` 仍要求 sourceSituation 自己显式 Query 过 variable。从该返回值上读取成员而得到的临时引用不在当前 Situation 的 exports 中，不得出现在 Query 的 variables 中；它们只能作为提及，即便它们本身另有来源。

resolved/exported 均按整个 Input 的结构认定，不受 Query 位置限制。sourceSituation 的 Query 出现较晚并不使转出失效；真正读取 value 时，仍须检查来源的实际求解是否已经完成。

## 7. 本次实现的临时 Runtime 适配与范围

Foundation 以独立目录保存，复制后作为普通认知空间的基础。Runtime 的 `init` 对空目录继续创建骨架；对已有完整认知源码、尚无 Revision 仓库的目录，校验后建立初始 Revision，保留源码。

新增认知空间格式化子命令，格式化后超出复杂度门禁仅报告警告，不因超限拒绝保存或使命令失败；原有 Runtime source gate 保留。

后续临时调整：以独立常量 `EnforceJavaScriptColumnLimit = false` 关闭每行 80 列限制，同时停用 source gate 的列数拒绝和格式化命令的列数警告。改回 `true` 并重新编译即可恢复列数限制。

每文件行数限制由 80 提高到 160，因为格式化器改为按 prettier 重排。prettier 会保留注释，而旧 80 行上限里注释行会挤占认知代码的空间。

空 `Output[]` 暂时绕过 Output Translation，由 Runtime 直接返回占位文本。

本次不实现持久记忆或跨轮记忆能力，测试聚焦单轮、上下文无关问答。Runtime 用单独的常量开关控制“Resolve 必须产生持久变化”的要求，暂时关闭，并以明确代码注释标记。关闭时，无持久变化的成功 Resolve 保留当前 Revision，返回其输出，不创建空 Revision，也不触发 no-persistence Learning；存在持久变化时仍走原有校验和发布流程。

## 8. Node 状态二分与类型层级

所有 Node 只有**语义数据成员**这一种状态，构造 Input 时固定，Resolve 过程中不得修改。只有 `Variable` 额外拥有 Effect State：

```text
{ resolved: boolean, value: JSValue }
```

其他 Node 不允许有 Effect；运行时算法状态只能放在局部变量或闭包中，且领域不得跨调用累积状态（见第 12 节）。

`Node`、`SituatedNode`、`GlobalNode`、`Proposition`、`Imperative`、`Output` 是 abstract semantic category，可以继续派生。concrete semantic class 默认 final，不允许继续继承。`Variable` 是 concrete 且为 final，可直接 `new Variable(...)`。每个 semantic subclass 必须自己声明 `static BRAND`。occurrence 中只有 `Situation` 的 `situated` 可为 null；`GlobalNode` 不进入 Input。

Variable 不是另一种领域值，而是 Situation-relative symbolic reference；其 value 可以是任意 JSValue，包括 Node 与 `ref` 的返回值，但**不能是裸 Variable**。这条禁令把值引用限制成必定带来源的 ref：裸 Variable 作为 value 不携带导入边，读取时必须在它自己的 Situation 与视角所属 Situation 之间二选一，结构扫描也无从检查这条流转；禁止之后值链只能由 ref 构成，链上下一个槽位始终由 `FindSource` 单独判定。要表达"某变量的值是另一个变量"，使用 `ref(source, variable)`：ref 可以正常作为 value，并与其它 ref 连成多节点链条，读取时沿这条链继续读取。赋值点只检查 value 顶层，嵌套在 value 内部的裸 Variable 同样禁止但只作约定（见第 14 节）。在赋值点（`AssignLocalVariable`，也是唯一的写入点）违反此约束属领域实现错误，抛 `TypeError`，不进入输入修复流程。Variable 的 value 只存在于本轮 effect，不改变任何 Node 的 identity；Variable 在 JS 层也不伪装成它的 value。

运行期自建的 ref 与 Input 内 ref 适用同一套结构规则（sourceSituation 在本轮 Input 内、被导入项是 Variable、sourceSituation 自己显式 Query 过它）。差别只在检查时机与错误归类：Input 内 ref 由 `ValidateRefs` 在 Analyze 期检查，违规是输入构造错误；运行期 ref 没有声明位置，由赋值点与读取点用同一规则检查（`RefProblem`），违规是领域错误。嵌套目标未被 source 导出属合法的"导入未知"，两侧都不视为违规。

## 9. Effect 的托管与私有

Variable effect 的生命周期（创建、销毁、重置）由 Foundation 统一管理：每次 Resolve 建立独立存储，随本次 state 丢弃，失败重试使用新 state，不复用旧 effect。

effect 的形状与读写归声明它的类型所有。Foundation 不提供任何第三方访问 effect 的 API，节点只能通过 Foundation 访问自己的 effect；生命周期管理本身不算访问 API。因此不存在通用的 `Effect(node)` 或抽象层上的 `NewState()` 契约。读取变量语义值只能通过第 10 节的 `Value`。effect 的写入只发生在 Query 求解步骤的整步提交；`ResolveImperatives` 与其他 cognition 代码都不得修改 Variable effect。

## 10. 引用、转出边与反查

**ref 不是本体，也不参与身份。** ref 是"在某个 Situation 里提到某个物"的语法：它带 source（在哪个 Situation 里看）与被导入的 Variable（source 显式 Query 过的那个，实现里记为 `meta.target`）。它不占 Input 位置、不建 state slot、不被索引、不要求与任何别的 ref 相等；读取时即使被重建也不影响语义。Foundation 的每个接口在门口主动识别 ref（`RefMeta`），按 ref 规则办事，不让一个 ref 冒充它指向的东西通过检查。属性访问与方法调用属便利层（见第 6 节），不构成身份合并。

Situation 的 exports 记录区分两种角色：variables 中列出裸 Variable 表示该 Situation **可能生产**该变量（是否实际求解按第 13 节的最外层规则判定）；列出 `ref` 的返回值表示**转出**（import）——它只登记 export，不建立本地来源。解析来源时，取祖先链上最外层的显式 Query；若该记录是转出，则沿转出边跟随到值真正来源的 Situation，并排除已被跨越的作用域，使链上更外层的来源不能遮蔽导入目标。

来源是 Query 自己：某 Situation 的 Query 为**该 Situation**建立该变量的本地来源，变量声明在哪个 Situation 不影响这一点。因此按 Input 顺序，第一个使该 Query 成为来源的 Query 实际求解；同一 Situation 内后续 Query 只登记 export。这里不引入“own”概念，也不需要区分。解析始终**在视角所属 Situation 内**进行，所以同一条声明在不同视角下可以对应不同的来源（兄弟 Situation 是同一父的不同细化）。

**提及是结构，只汇报一次。** 每个 Input occurrence 在结构扫描时调用一次 `ReportReferences`，这一次就是它的全部提及；反查索引完全由这些汇报建成，此后不再增加。语义数据成员中引用 `ref` 及其指向的对象只是提及，允许表达和讨论；汇报可递归经过普通 object／Array／Map／Set 等容器，不涉及 Variable Effect、Foundation 内部状态或算法局部状态。从 `ref` 的返回值上读取成员而得到的其他 Variable 不在当前 Situation 的 exports 中，不得出现在 Query 的 variables 中，即便它们本身另有来源；只有 `ref(...)` 本身可以作为转出项出现。

`Bindings(reference)` 的反查对象是 **Node**：输入是 Input 内的 Node 或一个 global 引用，输出是提到它的 Node 列表（声明者，按 Input 顺序，子可见祖先、父不可见子）。反查分两条互不统一的路线：Input Node 走 Node 自己的 identity，global 走它的 BRAND；一条提及若是 `ref` 的返回值，就记在它指向的对象名下。落在非 Node 的成员对象、普通 JSValue 或 Input 之外的 Node 上的提及不建档，反查静默返回空；以普通 JSValue 调用 `Bindings` 属 API 误用，直接抛错。

**Variable 的 value 不参与反查。** 值由求解产生，不是任何认知提到的对象；即使它是 Node，也不会让"提到该变量的声明"变成"提到该值的声明"。反查结果因此不随求解进度变化，也不存在按求解结果登记的第二条路径。Variable 本身不因为 `value = Bob` 而自动成为 Bob 的 binding relation。

提及由类型自己汇报：每个可出现在 Input 中的具体类型实现 `Node.ReportReferences`，声明它提到哪些认知；Foundation 据此做落点判定与反向索引。结构校验不依赖汇报（见第 14 节）。汇报范围是这些语义数据成员，可递归经过普通 object／Array／Map／Set 等容器；不涉及 Variable Effect、Foundation 内部状态或算法局部状态。检索方向为子可见祖先、父不可见子，与 Node 在 Input 中的位置无关：可见方向由祖先链决定，提及关系由汇报决定，两者正交。

**Query 不能列出 global 引用。** `meta.global !== null` 的引用（`SomeGlobal.Ref()` 本身，以及经它到达的成员）在 Input 树外，没有 Situation、也没有可求解的值，它只能作为语义数据成员里的**提及**出现（祈使的 addressee、命题的字段等）。裸 global 引用在 `Query` 构造期就被拒（元素必须是 Variable，而 GlobalNode 实例不携带 Variable brand）；成员若是 Variable 则能过构造校验，因此在 Analyze 登记 Query 时以输入构造错误拒绝（`Query cannot list a global reference`）。"列出 `ref` 只登记 export、永不求解"只适用于 `ref`，不适用于 global 引用。

因此这类引用没有值产生来源：`Value` 报输入构造错误（`Variable has no value-producing source`），`HasResolutionSource` 为 false。例外是成员指向的 Variable 本身也在 Input 中并被该 Situation 显式 Query——这时它可以按该 Situation 的解析正常读取，但仍不能出现在 Query 的 variables 中。

只有指向 global **本体**的提及记在 global 那条路线上（`NamedGlobal`：`GlobalNode.Ref()` 建立的引用本身，不含经它到达的成员）；经 global 到达的成员沿用成员自己的 identity，成员本身是 Input Node 时走 Input Node 路线，所以 `Bindings(Global.Ref().a)` 与 `Bindings(Global.Ref().b)` 互不混入，`Exported` 也不会替兄弟成员作答。

复用 BRAND 作为 global 的名字是**实现选择**，不是 BRAND 的规范职责；BRAND 的规范职责是跨 Context 的 `instanceof`。这条选择的由来：`GlobalNode.Ref()` 是按类单例（`instances` 以类为键），而 `instances` 是模块级的、模块实例按 Context 编译，Input 与 Resolve 又是两个 Context，所以同一个 global 在两侧是两个 instance，唯一共享的标记是 `Symbol.for` 出来的 BRAND。这条选择只活在 global 那条反查路线里（`RefMeta.js` 的 `NamedGlobal`），常规 Node 的身份不受影响。要拆开可以：给 global 名字一个独立标记（`Symbol.keyFor(BRAND)` 或 `static GLOBAL_KEY`），BRAND 严格只给 `instanceof`；或改用 instance 并接受跨 Context 命不中 Input 侧提及、反查静默为空。

命名说明：实现里的 `Bindings.js`、`RecordBinding`、`BindingsOf`、`NamedGlobal`、`plan.bindings`、`plan.globalBindings` 是本实现的内部词汇，不是规范概念——规范里只有「提及」「引用」「反查」「视角」「解析」这些词。不要把这些名字当作规范术语回写进规范文档。

引用元数据是一条扁平记录（source、target、via、global），不存在沿它递归的链，因此不需要 `MaxRefDepth` 一类的次数界；深度上限只保留在第 11 节的值解引用（`MaxValueDepth`）。需要身份集合的是**合法**的容器循环：普通 object／Array／Map／Set 允许循环引用（第 1.1 节），遍历必须去重，不能用次数代替（`WalkReferences`）。

## 11. Query 延迟入口与 Value 解引用

Query Node 之间的执行顺序严格按 Input 顺序，不允许破坏结构的延迟。延迟只发生在同一个 Query Node 所 Query 的若干变量之间。固定入口增加 `Memory/ResolveQueryDefer.js`，与 `ResolveQuery` 同签名：

```text
1. 没有需要 resolve 的变量                              -> 退出
2. ResolveQuery 产出了 0 个变量                          -> 调用 ResolveQueryDefer
3. ResolveQuery 与 ResolveQueryDefer 都产出 0 个变量      -> 失败
```

第 3 条的失败等同于此前的“`ResolveQuery` 返回空 Map”。上述规则按轮理解：`ResolveQueryDefer` 每轮最多调用一次，完成部分变量后进入下一轮，主入口再次返回空 Map 时仍会调用它。`ResolveQueryDefer` 是必需入口，缺失即报错。

`Perspective` 以 `Value(term)` 取代此前的 `Read(variable)`：普通值或 Node 返回自身；resolved Variable 返回其 value，且 value 是 `ref` 的返回值时沿该 `ref` 递归解引用（裸 Variable 不能作为 value，见第 8 节，所以链只能由 ref 构成）；unresolved Variable 不可读取。递归链设深度上限 64，同时兜住环与病态长链，因此 `Value` 侧不再单独做环检测。

## 12. 领域状态与前提声明

领域不得跨调用累积状态，只能用可见结构完成 var query 等求解。若领域认为需要额外前提，应在自己的 Interface 注释中明确记载并自行抛异常；Foundation 不提供声明或检查机制。此项属于约定与评审层面的约束，不是运行时强制。

没有隐藏状态与允许延迟重试合起来，使每次求解入口调用都是无状态的纯函数，失败重试无需重置任何领域状态。

## 13. 多祖先显式 Query 的推导

同一 Situation 树内，当多个祖先都显式 Query 同一变量时，只有最外层那个 Query 实际 resolve，其后代 Situation 的 Query 只登记 export。这不是实现选择，而是由规范原文推出的：草案第 1.3 节规定本地无来源而祖先有来源时继承祖先来源；本备忘第 2 节规定一个 Situation 内的结构 resolve 状态不因 Query 或子 Situation 的声明位置而变化。因此只有最外层显式 Query 把该变量当作本地来源，其余都是继承视角，不再实际求解。此处不存在候选比较或竞争，不应用“胜出”描述。


## 14. 本轮确认（2026-09-28）

**Query 项的重复与歧义。** 同一 Situation 中（同一个或不同的 Query）多次列出同一对象（直接列出、经 `ref` 或两者兼有），若各项解析到同一个值槽 `(situated, variable)`，视为重复，只登记一次；若解析到不同的值槽，属输入构造错误。例如 `v` 与 `ref(child, v)`，或 `ref(a, v)` 与 `ref(b, v)`。判定按“若该项是这一作用域的记录，它代表哪个值槽”进行，与各项先后无关，不再由首个出现的项决定角色。实现为 `PlanQueries.js` 的 `CheckListings`，在 `ValidateRefs` 之后运行。

**值中的裸 Variable 只检查顶层。** 赋值点只拒绝顶层裸 Variable；嵌套在值内部的裸 Variable 同样禁止，但只作约定，不检查，因为逐次遍历整个值图代价过高。例外：value 本身是 Node 时，它语义字段里的 Variable 属于声明结构，不算嵌套裸 Variable，读取时按第 6 节处理（该 Node 所在 Situation 不是读取视角的祖先时的约定见第 15 节）。

**写入只作约定。** Resolve 期间不修改 Declaration（包括其字段中的普通容器）与已写入的 value，是约定而非强制。ref 是只读视图：写入、删除与属性定义一律拒绝，不转发给被引用的 Node（见第 6 节），元数据 Symbol 也不例外。

**结构检验与提及分离。** 结构检验（引用顺序、跨 Situation 引用规则（第 15 节）、ref 合法性）由结构扫描自己遍历每个 occurrence 的全部语义数据成员完成，不依赖 `ReportReferences`。`ReportReferences` 只汇报自身 Declaration 中的直接提及：不经其他 Node 传递，但自身字段中的普通容器仍算自身。提及决定反查索引与“Situation 必须被提及”；汇报的项按同样的结构规则检验。保留“必须实现、漏写报错”：提及是语义声明，应当显式写出。

**取值依赖由领域声明、Input Translation 满足。** Foundation 不分析 Variable 之间的取值依赖，也不调整 Query 顺序。视角提供 `Readable(term)`（`Value` 此刻能否成功，不抛错）与 `RequireValue(term, reason)`（失败时以领域原因报告输入构造错误）。领域在 Interface 注释中声明依赖；互相依赖的 Variable 放入同一个 Query。

**需要假设的变量本来未知。** 子 Situation 是细化，祖先已 Query 的变量在所有后代中都是已知的。假设只针对祖先未 Query 的变量，例如兄弟 Situation 各自细化同一个未知量；对已知值的反事实设想使用新 Variable，它与原变量的关系由认知内容表达。祖先在任意位置 Query 了该变量时，子 Situation 的 Query 只登记 export，子 Situation 对它的约束静默失效；视角的 `ResolutionSituation(variable)` 给出值槽所在的 Situation，供领域发现并报告这种冲突。

**领域类可保持 final。** `Interface/Nodes.js` 导出 `Final`，具体领域类在构造器中调用 `Final(Type, new.target)`。

## 15. 本轮确认（2026-10-02）

**跨 Situation 引用：只有 Situation 相对状态需要 ref。** 此前的结构规则要求一切非 Situation 引用在祖先链之外都使用 ref，而 ref 只能携带 Variable，于是 Variable 以外的 Node 实际上无法被祖先链之外的认知提及。这把“提及”与“信息流”混为一谈。ref 显式表现的信息流是 Situation 相对状态的流动：Variable 的值与求解状态相对于 Situation，跨 Situation 读取必须说清读的是哪个值槽。不含 Variable 的声明与 Situation 无关，从任何 Situation 看都相同，提及它不涉及任何值槽。旧规则的直接后果是：两个互不细化、却要提及同一对象的 Situation（例如叙述的世界与角色的信念），只能人为建立一个共同祖先来存放该对象；Node 放在哪里由谁提到它决定，而不是由它在哪里被引入决定。

规则见草案 1.4，摘要如下：

| 被引用者 | 在其所在 Situation 及后代中 | 在其他位置 |
|---|---|---|
| 裸 Variable | 直接引用 | 必须 `ref`（不变） |
| 声明图到达 Variable 的 Node | 直接引用 | 不得直接引用；对其中的 Variable 使用 `ref` |
| 常量 Node | 直接引用 | 直接引用 |
| Situation | 直接引用 | 直接引用（不变） |

声明图是 Node 的语义数据成员（`situated` 除外）经普通容器与其中的 Node 递归可达的全部对象。其中的 `ref` 返回值算作到达 Variable；指向 global 本身的引用与 Situation 不算。global 的 Variable 成员无论从哪里读取都按读取视角解析，与持有它的 Node 所在的 Situation 无关，因此提及 global 本身的 Node 仍是常量 Node。判据是保守的：精确条件（可达的 Variable 从两边看落在同一值槽）依赖整个 Input 的 Query 分布，不采用。

以下不变：引用顺序与 Situation 必须被提及；ref 的方向规则、export 要求与 Query 列项规则；提及只是提及——被提及对象的 `situated` 不变，提及者不继承该对象所在 Situation 的认知，反查可见性仍按提及者所在 Situation 的祖先链判定（第 10 节）。

**值层面的对应约定。** 值层面今天已经允许跨 Situation 的 Node，并且已经存在同样的问题。实测：根 R 下有兄弟 W、B；Variable `v` 在 R 中；B 中有命题 `P{entity: v}`；B 与 W 各自 Query `v` 并得到不同的值；把 P 作为 W 中某个 Variable 的值，再从 W 读取 `P.entity`，得到 W 的值，不报错。草案 2.4 因此把声明层面的判据写成值层面的约定：声明图到达 Variable 的 Node 作为 value 时，只应在其所在 Situation 及其后代中被读取。与嵌套裸 Variable 一样，只作约定，不检查。

**实现。** `ScanContent.js` 的 `CheckReference`：被引用者不在引用者所在 Situation 的祖先链上时，Variable 以 `Cross-Situation Variable requires ref` 拒绝，声明图到达 Variable 的 Node 以 `Cross-Situation Node must not carry a Variable; ref the Variable instead` 拒绝，其余放行。到达判定 `CarriesVariable` 的结果按 Node 记录在本次分析中（`plan.carriesVariable`）：结构扫描按 Input 顺序进行，每个 Node 引用都指向已经扫描过的更早出现，Node 之间的遍历无环。自检位于 `Test/Crossing.js`。

**Node 级 ref 暂不引入。** 曾考虑把 ref 推广到任意 Node（`ref(situation, node)`），使声明图到达 Variable 的 Node 也能整体跨 Situation。暂不引入，理由：

1. 对常量 Node 没有内容。视角对常量没有意义；导出来自 Query，而 Query 只接受 Variable，“source 显式导出该 Node”无从表达。
2. 视角与身份不可兼得。ref 的返回值是代理：类型判断照常成立，但它不 `===` 它指向的 Node，也不能当作同一个 Set 元素或 Map 键。Node 的身份就是对象身份（草案 2.1），领域代码按身份比较 Node。Variable 的 ref 没有这个问题，因为它由 `Value` 消费，领域比较的是读出的值。对 Node 代理而言，`Value` 若解包，成员 Variable 又按读取视角解析，失去视角；若不解包，则失去身份。
3. 需求可以分解。需要视角的只是其中的 Variable，可以对它们逐个使用 `ref(situation, variable)`。

等出现逐个 ref 不足以表达的具体用例（预计在比较兄弟假设时）再议。届时需要先回答：`Value` 对这种引用返回什么；领域代码以什么判断两个引用指向同一个 Node。

## 16. 本轮确认（2026-10-03）

**领域报告输入构造错误。** 此前领域入口抛出的任何异常都按 Resolve 异常处理，只有 Foundation 自己的访问 API（`Value`、`RequireValue` 与结构扫描）会产生输入构造错误。领域因此无法说"这条 Input 写错了"：Aesop Phase 2 中，题目编码写错时只能降级为"未确立"之类的正常结果，与"故事没有说明"无从区分。

新增 `RequireInput(condition, reason)`，由 `Interface/Nodes.js` 导出，实现位于 `InputStructureError.js`：条件不成立时抛 `InputStructureError`，根 `Resolve.js` 照常转为 `InputObjectInvalidError`。领域代码也可以直接从 `konsupu:input` 抛 `InputObjectInvalidError`，Foundation 不拦截；但统一经 `RequireInput` 使脱离 Runtime 运行的自检与夹具得到同一种错误类型，也使输入错误只有一个来源。`reason` 为空是领域实现错误，抛 `TypeError`。自检 `TestFixtureInputInvalid`；Go 集成测试 `TestFoundationDomainInputErrorRepairsInput` 验证 Runtime 把它分类为输入修复而不是 Resolve 异常。

**原因进入诊断（用户授权修改 Runtime）。** 此前 Runtime 构造输入修复诊断时只用固定文案（`javascript/diagnostic.go` 的 `inputRepairMessage`），丢弃 JS 异常的 message，Input Translation 只得知"需要修正"，不得知哪里错了。现在诊断为固定指引加 `Reason:` 与异常 message：`RequireInput`、`RequireValue` 与结构扫描的原因都经根 `Resolve.js` 成为 `InputObjectInvalidError` 的 message，从而到达 Input Translation。总长受协议上限 1024 个 code point 约束，过长时截断并以 `…` 标记，无效 UTF-8 被替换，空原因只保留固定指引（`inputRepairText`）。测试：`TestNativeInputObjectInvalidIsClassifiedPrecisely` 改为要求原因在场，`TestInputRepairTextBoundsTheReason` 覆盖空、超长与无效 UTF-8，`TestFoundationDomainInputErrorRepairsInput` 验证领域原因端到端到达。v0.9 规范的 InputObjectInvalidError 流程相应写明诊断内容。


## 17. 本轮确认（2026-10-04）：一次性领域语义检查与自检组合

**`ValidateInput`。** 固定领域入口增加第五个：`Memory/ValidateInput.js` 导出 `ValidateInput(input, state)`。`Evaluate` 在 `Analyze` 成功之后、`QueryLoop` 之前恰好调用一次，返回值被忽略（草案 3.2、4.6）。

此前领域只能在 `ResolveQuery` 等入口中检查 Input，有两个问题：入口不得跨调用保存状态，所以每次调用都要对整个 Input 重复检查；Input 中没有 Query、也没有指向 Konsupu 的 Imperative 时，任何领域入口都不会被调用，错误的 Input 无人检查。一次性入口同时解决这两点。Commons 的语义 lint（`Konsupu_Commons_规范草案.md` 第 6.4、11.2、12 节所列的 lint 错误；完整集合见该文第 16 节第 14 项）由此入口执行。

- 它是领域语义检查，不是第二套结构检查；调用时没有任何 Variable 的实际 value，领域不得读取 value。
- 输入错误经第 16 节已有的 `RequireInput(condition, reason)` 报告，原因进入 Runtime 诊断；不另设单参数版本。其他异常仍是普通 Resolve 异常，进入 Learning。
- Foundation 的默认实现什么也不做，所以没有领域语义时 Foundation 自检照常运行。该入口与其余四个一样是必需的固定导出，缺失即报错。
- `operations.ValidateInput` 是 `Evaluate` 的内部测试接缝，与其余四个入口相同。

自检 `Test/Validate.js`：调用恰好一次、先于第一个 `ResolveQuery`、看到完整 Input 与 state；没有 Query 的 Input 同样被检查，拒绝时带出领域原因；非函数的入口抛 `TypeError`。Go 集成测试 `TestFoundationValidateInputRepairsInputWithoutQuery` 验证 Runtime 把这一拒绝分类为输入修复，并带出原因。测试夹具 `Test/Fixtures/ValidateInput.js` 拒绝带 `op: "reject-input"` 的节点，Go 测试把它与其余四个夹具一起写入临时空间。

**自检组合。** Foundation 自检主体移到 `Test/Suite.js`，导出 `FoundationSuite()`；根 `Test.js` 只调用它。Runtime 只调用根 `Test()`，所以建立在 Foundation 之上的认知包（Commons）需要在自己的根 `Test.js` 中同时运行 Foundation 与自己的自检；它从 `Test/Suite.js` 导入 `FoundationSuite`，不必复制 Foundation 的测试清单。纯结构改动，不涉及语义。


## 18. 本轮确认（2026-10-04）：顺序错误的原因写明位置与改法

**问题。** Commons 编码试验中，flash 级模型的 Input 经常违反"引用必须指向更早的 occurrence"：先推入引用者、后推入被引用的 Manner 或言语语境；5 次运行中有 2 次如此。第 16 节之后，结构扫描的原因已经到达 Input Translation，但原先的原因只有 `Node references must point to preceding occurrences` 与 `Situation must precede its member`，不说是哪个节点、哪个字段、指向谁，翻译者无法据此定位。

**改动。** 两条顺序规则的原因保留原有句子作为开头，后面附上位置与改法：

- 引用晚于引用者：`Node references must point to preceding occurrences: <引用者类名> at Input[i] field "<字段>" references <被引用者类名> at Input[j]. Fix: push the <被引用者类名> into Input before the <引用者类名>.`
  - 被引用者不在 Input 中时，写 `references a <类名> that is not in Input`；
  - 只经 `ReportReferences` 汇报、不在任何数据成员中的引用，没有字段，省略 `field` 部分；
  - 字段按数据成员的声明顺序取第一个包含该引用的字段，经普通容器递归。
- 父 Situation 晚于成员：`Situation must precede its member: <类名> at Input[i] is situated in a Situation at Input[j]. Fix: push the Situation into Input before its members.` 父 Situation 不在 Input 中时，写 `in a Situation that is not in Input`。

类名取自构造器名，位置是 Input 数组下标。原因只描述结构，不读取任何领域字段（如 `name`、`title`），所以 Foundation 仍不依赖领域约定。位置信息只在失败路径上计算，不影响成功路径的开销。

原句保留为前缀，既有自检与按子串匹配原因的测试不变。新增自检 `Test/Order.js` 覆盖：晚于引用者、不在 Input 中、容器内的引用带出外层字段、父 Situation 晚于成员与不在 Input 中。
