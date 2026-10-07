# Foundation 的结构与使用

`src/foundation/` 保存 Foundation 的认知源码及其仓库内使用说明。真正的
认知空间根目录不允许包含本说明；复制时只复制其中的五项认知源码 entry，
再通过 `konsupu init` 建立副本自己的初始 Revision。后续 Learning 修改
副本。Foundation 不内嵌到 Go/C Runtime，不依赖 Node.js 或 npm。

语义依据为仓库 `doc/` 目录中的
[`Konsupu_Foundation_规范草案.md`](Konsupu_Foundation_规范草案.md)
和
[`Konsupu_Foundation_规范备忘.md`](Konsupu_Foundation_规范备忘.md)，
冲突处以备忘为准。

## 目录与职责

```text
src/foundation/
├── Foundation_使用说明.md         仓库文档；不复制进认知空间
├── Memory/
│   ├── Foundation/                类型、ref、结构分析、访问与求解组织
│   ├── ValidateInput.js           默认领域语义检查入口（不做任何检查）
│   ├── ResolveQuery.js            默认领域 Query 入口
│   ├── ResolveQueryDefer.js       默认领域 Query 延迟入口
│   ├── IsKonsupuImperativeApplicable.js
│   └── ResolveImperatives.js      默认领域祈使入口
├── Interface/
│   ├── Nodes.js                   公开类型与 Input 约定
│   └── Outputs.js                 Output 类型与文本解释接口
├── Test/                          可在 Runtime Test Context 执行的自检；Suite.js 导出 FoundationSuite
├── Resolve.js                     Runtime 入口与输入错误交接
└── Test.js                        自检总入口，只调用 FoundationSuite
```

测试领域入口位于 `Test/Fixtures/`，由 `Test.js` 或 Go 集成测试显式加载；它们不再放在
隐藏目录，也不会增加非法根 entry。

`Memory/` 下有五个领域入口。默认 `ValidateInput` 不做任何检查；其余四个
目前明确抛出“领域认知尚未实现”的异常。它们是供领域实现或 Learning 替换
的接点，Foundation 不猜测领域事实、祈使适用性或
回答内容。没有实际待求解变量、没有适用祈使候选的合法 Input 可以直接得到
空输出。`Test/Fixtures/` 只提供 Foundation 自检和 Go 集成测试所需的确定性
替身，不是生产领域实现。
本次未实现持久记忆、跨轮记忆、对象图序列化或通用问答知识库。

## 复制与初始化

以下命令从仓库根目录执行。`run/foundation-space` 可以不存在；命令只复制
认知空间允许的五项根 entry，不会把本说明复制进去：

```sh
./xmake.agents build
mkdir -p run/foundation-space
cp -a src/foundation/Memory src/foundation/Interface src/foundation/Test \
  src/foundation/Resolve.js src/foundation/Test.js run/foundation-space/
./xmake.agents run konsupurt -- format run/foundation-space
./xmake.agents run konsupurt -- init run/foundation-space
```

`init` 对空目录创建原有骨架；对已有认知源码执行结构、格式和静态依赖等
source 校验，然后建立初始 Revision，保留源码。已有 Revision 仓库的目录
不能再次初始化。打开 Session 时继续执行 Runtime 的 Resolve 可调用性检查。

格式化或测试操作可能短暂创建 `.runtime.lock`。它是隐藏运行时元数据，不进入
初始或后续认知 Revision；文件存在本身不表示锁被持有。它不是 Foundation
源码的一部分，复制 Cognition Space 时不会复制它。

## 格式化命令

```sh
konsupu format <space>
```

命令格式化 `Resolve.js`、`Test.js` 和三个认知目录内的 `.js` / `.json`。
它跳过隐藏元数据，不跟随符号链接，并与同一空间的活跃 Runtime Session
互斥。开发中的不完整 import 不阻止格式化。

JavaScript 以格式化后的源码检查尺寸。每文件限制 160 行；每行 80 列限制
暂时关闭：`src/konsupurt/internal/cognitivespace/contentfmt/contentfmt.go`
中的 `EnforceJavaScriptColumnLimit = false` 同时关闭源码校验的列数拒绝和
格式化的列数警告；改为 `true` 并重新编译即可恢复。行数限制始终生效。
超限警告输出到
stderr，包含文件与实际尺寸；仍保存格式化结果，继续处理其他
文件，单纯超限的退出码为 0。行数超限是整个文件的性质，没有单一的
“超长行位置”，因此只有列数超限警告才附带行号。语法或 I/O 错误使退出码为 1，出错文件不被
替换，其他可处理文件继续格式化。文件权限保留，单文件替换采用原子写入。

JavaScript formatter 是 prettier 3.9.8（meriyah parser + estree printer），
以打包后的单文件形式提交在
`src/konsupurt/internal/cognitivespace/contentfmt/prettier.bundle.js`，
因此 npm 不是构建依赖。它在 konsupujs 提供的独立 QuickJS runtime 中运行：
该 runtime 不加载认知源码、不暴露 Host 回调，与“Konsupu 执行是同步的”
约束互不影响。bundle 在 Runtime 首次格式化时编译一次并被后续文件复用。
prettier 与旧 esbuild formatter 的排版不同，注释会被保留。

格式化不会发布 Revision。它也不会放宽 Runtime 打开空间、Resolve 发布
或 Learning 提交时的 source gate。格式化已经发布的空间会留下普通源码
修改，需按原有 Revision 工作流发布后才能开始新的 Interaction。

## 测试命令

运行 Foundation 的 `Test.js` 自检使用 `test` 命令：

```sh
konsupu test --space <space> --config <config.json>
```

`--space` 可以指向复制出来的 `run/foundation-space`，也可以**直接指向
`src/foundation`**：该命令只读源码，不建立 Revision，也不修改源码树，
适合开发中的快速回归。`--config` 是必需的 Runtime 配置，`Test.js` 不使用
LLM，因此一个占位配置即可（token 限制必须通过 `config` 的校验，所以
`context_window_tokens` 要大于 `max_output_tokens`）：

```json
{
  "llm": {
    "driver": "openai-completion",
    "model": "test-model",
    "context_window_tokens": 98304,
    "max_output_tokens": 32768,
    "openai_completion": {
      "base_url": "https://example.invalid/v1",
      "api_key": "",
      "headers": {}
    }
  },
  "javascript": {
    "memory_limit_bytes": 67108864,
    "stack_limit_bytes": 1048576,
    "interrupt_budget": 1000000,
    "timeout_milliseconds": 5000
  }
}
```

`llm.openai_completion.body` 是可选的对象，其中每一项作为顶层字段合并进每个
请求，用来控制温度和各家 provider 自己的思考开关或档位，值原样发送：

```json
"body": {"temperature": 0.2, "thinking": {"type": "enabled"}, "reasoning_effort": "high"}
```

具体字段名取决于 provider。`model`、`messages`、`tools`、`tool_choice`、
`max_tokens`、`stream` 由 Runtime 管理，写进 `body` 会使配置校验失败。

`llm.openai_completion.debug_http` 设为 `true` 时，每次请求把方法、URL、请求头、
请求体，以及响应的状态和响应头写到 stderr，用来排查 provider 返回的错误。
Authorization 以及名字含 `auth`、`key`、`token`、`secret`、`cookie` 的头的值显示为 `***`，
请求体里的提示词则原样输出，不要把输出贴到公开的地方。

全部断言通过时输出 `passed` 并以退出码 0 结束；任一断言失败则退出码非 0。

Foundation 自检主体位于 `Test/Suite.js` 的 `FoundationSuite()`，根 `Test.js`
只调用它；建立在 Foundation 之上的认知包可以在自己的根 `Test.js` 中同时调用
`FoundationSuite()` 与自己的自检，因为 Runtime 只调用根 `Test()`。

注意 `Test.js` 只导出 `Test()`，没有顶层调用，因此 **`node Test.js` 什么
都不会运行、永远成功**，不能用来验证。`./xmake.agents test` 会同时运行
原生 C 测试与 Go 测试，其中 Go 侧会调用 `Test()`，因此它也是有效验证；
`konsupu test` 是只跑 Foundation 自检的更快路径。

`Test()` 通过后，`konsupu test` 还会以样例 request 求值空间中存在的
`Interface/Prompt/*.js`，并校验返回形状（见 v0.9 规范 Interface/Prompt 一节）。

## 调试单个 Agent

`konsupu debug` 单独运行一个 Agent（或到它为止的前序阶段），观察工具调用轨迹与结果。
三个子命令共用同一组保证和选项：

- **需要真实 LLM 配置**：它们会调用模型。
- **不改动空间**：Resolve 总是 dry run，改动随后还原，不发布 Revision，Gap 也
  不会触发 Learning（`debug learning` 是例外，见下）。运行结束后空间回到起始
  Revision。
- **输出**：轨迹实时写到 stderr，多个 Agent 的阶段之间有 `== 阶段名 ==` 分隔行；
  结果写到 stdout；`--json` 在结束时把 `{events, result}` 一次写到 stdout。

### input-translate

```sh
konsupu debug input-translate --space <space> --config <config.json> -- "<raw>"
echo "<raw>" | konsupu debug input-translate --space <space> --config <config.json>
```

`finish()` 照常运行 Resolve，所以输入错误的返修反馈会回到 Agent。

### output-translate

对 Resolve 返回的 Output 运行一次 Output Translation。Input 的来源二选一：

```sh
# 先由 Input Translation Agent 翻译 raw，再翻译输出
konsupu debug output-translate --space <space> --config <config.json> -- "<raw>"
# 直接给一个 JS 模块，跳过 Input Translation（省一次模型调用，便于反复调输出提示词）
konsupu debug output-translate --space <space> --config <config.json> --input input.js
```

`--input` 的模块与 Agent 在 `js_eval` 里写的相同：可以 import 空间中的模块，并给
`globalThis.StructuredInput` 赋值（Node[]）。Resolve 拒绝该 Input 时报错并说明原因。

结果是答案，或 Output Translation Gap；如果前序阶段先停下（Input Translation
Gap、Resolve 异常），则报告那一个。Resolve 的 Output 为空数组时，答案是占位文本
`（无输出）`，不会调用 Agent，结果中会注明。

### learning

在一个 Gap 上运行 Learning Agent，但 `finish()` 只校验和 Test、不发布：

```sh
# 直接给出 Gap：{"kind": "...", "gap": {...}}，即 Learning Agent 收到的载荷
konsupu debug learning --space <space> --config <config.json> --gap gap.json
# 或者让 raw / --input 走完 Input 和 Output Translation，取它们遇到的第一个 Gap
konsupu debug learning --space <space> --config <config.json> -- "<raw>"
```

`kind` 取 `input_translation_gap`、`output_translation_gap`、
`resolve_exception_gap`、`resolve_no_persistence_gap` 之一；`gap` 按协议校验，
未知字段会被拒绝。用 raw 找 Gap 时，如果输入没有产生任何 Gap（Output
Translation 已经给出答案）则报错。

结果列出 Agent 对空间做的每个文件改动（added / modified / removed）及其 diff，
并说明 `finish()` 是否通过了发布前的全部检查（即真实运行会不会发布这些改动）。
这些改动随后被丢弃；即使 Agent 没跑到 `finish()`，也能看到它写到一半的草稿。

## Foundation 的求值组织

`Memory/Foundation/Evaluate.js` 按三个阶段组织一次求值：

1. `Analyze` 验证 Node occurrence、线性结构引用、Situation 森林及语义提及，
   收集整个 Input 的 Query/export，验证 ref 方向与来源，规划实际求解项。
   成功后恰好调用一次领域入口 `ValidateInput(input, state)`，对完整 Input
   做领域语义检查；Input 中没有 Query 或 Imperative 时同样调用。此时没有
   任何 Variable 的实际 value，该入口不得读取 value。
2. `QueryLoop` 按 Input 顺序调用固定领域入口；主入口无进展时调用
   `ResolveQueryDefer`（每轮最多一次），两者同轮都无进展则失败。每一步
   整体校验后统一赋值。
   继承或已求解的导入引用不重复求值。
3. `ImperativeLoop` 收集指向 KonsupuIdentity 的全部候选，判断适用性，再把
   完整有效集合交给领域入口联合处理；全部完成后才返回无序 `Output[]`。

每次求值新建 effect state。分析记录与 Variable effect 分离，Situation
关系保存在本次分析中，不在执行中重新按被修改的父字段选择来源。

resolved/exported 按整个 Input 判断，与 Query 的出现位置无关。value 是否
已经写入则取决于执行进度。读尚未产生的 value 会抛出 Foundation 的
`InputStructureError`，根 `Resolve.js` 将其转换为 Runtime 的
`InputObjectInvalidError`，返回 Input Translation 修复。

领域入口抛异常、返回非法结果或不取得进展，属于普通 Resolve 异常，继续
走 Learning 流程，不会被一概归类为输入错误。领域确认 Input 本身写错时，
调用 `RequireInput(condition, reason)` 报告输入构造错误，同样经根
`Resolve.js` 转为 `InputObjectInvalidError`。

Runtime 的输入修复诊断由固定修复指引与 `Reason:` 后的原因组成：
`RequireInput`、`RequireValue` 与结构扫描给出的原因都会到达 Input
Translation，原因应写成能指导修正的句子（见备忘第 16 节）。顺序错误的
原因会写明引用者、字段、被引用者在 Input 中的下标，以及应先推入哪个节点
（备忘第 18 节）。

## Foundation API 总结

### 类型、构造与输出

Input 侧统一从 `Interface/Nodes.js` 导入类型和 `ref`；Output 侧从
`Interface/Outputs.js` 导入。以下路径均相对认知空间根目录。

| API | 用途与约束 |
|---|---|
| `new Situation(parent = null)` | 根或子情境；`parent` 是 Situation 或 null。Situation 单父、无环、可多根 |
| `Node` | 抽象基础认知节点；不能直接构造，具体类型必须继承并声明 BRAND |
| `new SituatedNode(situated, fields = {})` | 抽象；必须归属某个 Situation 的节点类别 |
| `new Variable(situated, fields = {})` | 待求解变量；具体类且不可继承；值保存在本轮 effect 中，不写入变量本体 |
| `Proposition` | 抽象命题节点；领域类型必须继承并声明 BRAND |
| `new Query(situated, variables)` | 要求变量并登记 export；`variables` 为 Variable 数组，约束由独立认知表达；global 引用与从 `ref` 的返回值上读取成员而得到的 Variable 只能作为提及，不能列入；重复项忽略，但同一 Situation 中经不同来源指向同一对象的项（例如同时列出 `v` 与 `ref(child, v)`）属输入构造错误 |
| `Imperative` | 抽象祈使命题，继承 Proposition；具体类以数据成员 `addressee` 保存被要求者，其余字段由领域定义；未写 `addressee` 的不成为候选 |
| `KonsupuIdentity.Ref()` | 指向当前 Konsupu 的全局引用，常作为 addressee |
| `ConcreteGlobalNode.Ref()` | 自定义 GlobalNode 子类的全局引用；不能直接构造全局节点 |
| `ref(sourceSituation, variable)` | 从允许的来源导入变量；sourceSituation 必须自己显式 Query 过 variable，使它进入自己的 exports |
| `Brand(stableName)` | 声明自定义语义类自己的 `static BRAND`，支持跨 Context 类型判断 |
| `Final(Type, new.target)` | 在具体领域类的构造器中调用，使该类不可再继承 |
| `RequireInput(condition, reason)` | 领域报告 Input 构造错误：条件不成立时抛输入构造错误，交回 Input Translation 修正；`reason` 必须是非空字符串。认知无法确定答案时应返回结构化值，不用它 |
| `Output` | 抽象结构化输出基类；具体输出类型必须同时提供 Interface 解释能力 |
| `new TextOutput(text)` | 已由认知确定内容的字符串输出；具体类且不可继承 |
| `Texts(outputs)` | 把纯 TextOutput 数组转换成字符串数组；遇到其他 Output 类型报错 |

`InputContract` 和 `OutputContract` 是对应 Interface 导出的约定说明对象，
不是求解函数。自定义 Node／Output 子类应声明自己的 BRAND；语义字段应为
自有数据属性，不用 getter 承载结构关系。构造器安装的字段不可直接赋值，
但保留 configurable，供明确的结构修复使用。

能出现在 Input 中的具体类型必须实现 `Node.ReportReferences(visit)`，汇报它
自身 Declaration 中的直接提及：不经其他 Node 传递，但自身字段里的普通
object／Array／Map／Set 容器仍算自身。基类实现是抽象的，漏写会在 `Analyze`
期直接报错。`ReportDataMembers`（全部自有数据成员）与 `WalkReferences`
（指定字段）是两个现成助手；`situated` 是父链接，不参与汇报。

汇报只决定提及：反查索引与「Situation 必须被提及」只看汇报。结构检验
（引用顺序、跨 Situation 引用规则、ref 合法性）由 `Analyze` 自己遍历每个
occurrence 的全部数据成员完成，不依赖汇报；汇报的项也按同样规则检验。
因此少报只会让反查漏掉该提及，不会让非法结构通过。

具体领域类可在构造器中调用 `Final(Type, new.target)` 保持 final。

具体语义类默认 final：`Situation`、`Variable`、`Query`、`TextOutput`、
`KonsupuIdentity` 不可再继承；抽象类别 `Node`、`SituatedNode`、`GlobalNode`、
`Proposition`、`Imperative`、`Output` 可以继续派生。occurrence 中只有
`Situation` 的 `situated` 可为 null。

### 五个领域实现入口

这些是固定文件导出，不需要注册回调。目前正式 Foundation 中都是显式
抛错的待实现入口；以下是实现它们必须遵守的同步协议，不接受 Promise。

| 文件与函数 | 返回协议 |
|---|---|
| `Memory/ValidateInput.js`：`ValidateInput(input, state)` | 正常返回表示通过，返回值被忽略；Analyze 成功后、任何求值之前恰好调用一次；领域输入错误用 `RequireInput` 报告 |
| `Memory/ResolveQuery.js`：`ResolveQuery(input, query, remaining, state)` | `Map<Variable, value>`；键必须来自本次 remaining，允许只完成部分变量，也允许返回空 Map |
| `Memory/ResolveQueryDefer.js`：`ResolveQueryDefer(input, query, remaining, state)` | 同签名；仅当主入口返回空 Map 时调用，每轮最多一次 |
| `Memory/IsKonsupuImperativeApplicable.js`：`IsKonsupuImperativeApplicable(input, imperative, state)` | 严格的 boolean；判断候选祈使是否适用 |
| `Memory/ResolveImperatives.js`：`ResolveImperatives(input, imperatives, remaining, state)` | `{ resolved: Set<Imperative>, outputs: Output[] }`；resolved 为 remaining 的非空子集 |

`input` 是本轮完整输入，`state` 由 Foundation 为本轮创建并在调用间共享。
不要另建 state 或直接给 Variable effect 赋值；Query 返回值经整步校验后由
Foundation 写入，`undefined` 也算合法的已完成值。

求解入口返回的 value 可以是任意 JSValue，包括 Node 与 `ref` 的返回值，但**不能是
裸 Variable**：裸 Variable 作为 value 不携带导入边，读取时无法在它自己的
Situation 与视角所属 Situation 之间判定来源，结构扫描也检查不到这条流转；
禁止之后值链只能由 ref 构成。ref 可以正常作为 value，并与其它 ref 连成
多节点链条，读取时沿这条链继续读取（`Value`）。违反
此约束在写入点即抛 `TypeError`，属领域实现错误，不走输入修复流程。

运行期自建的 ref（`ref(...)` 的返回值，Input 中不出现，`ValidateRefs` 看不到）
在写入点按**与 Input 内 ref 相同的结构规则**校验：sourceSituation 必须是本轮 Input 内的 Situation、被导入项必须是 Variable、sourceSituation 必须自己显式 Query 过它。任一条
不满足说明这个 ref 永远无法解析，抛 `TypeError`（领域实现错误），而不是等到
读取时再报成输入构造错误。嵌套目标未被 source 导出仍属合法的"导入未知"，
不在此列：它按 ref 边界一节的规则处理。

Query 入口按 Input 顺序严格执行，延迟只发生在同一个 Query 内部的若干变量
之间：主入口返回空 Map 表示本轮放弃，此时调用 `ResolveQueryDefer`，每轮最
多一次；两者同轮都未完成任何变量时 Resolve 失败。领域不保留跨调用的私有状
态，只能用
可见结构完成求解；需要额外前提时在自己的 Interface 注释中写明并自行抛
异常，Foundation 不提供声明机制。

`imperatives` 始终包含完整有效集合，供联合判定冲突；`remaining` 才随进展
缩小。outputs 可为空、可重复，数组位置不表示输出顺序；所有祈使完成前
不交付部分输出。没有实际求解项时，不调用对应求解入口。

### 从求解入口访问认知

领域入口可导入 `Memory/Foundation/Perspective.js`，以原始 Query 或
Imperative 和本次 state 构造视角：

```js
const view = new Perspective(query, state);
for (const variable of query.variables) {
  const relations = view.Bindings(variable);
  // 从要求变量及其绑定关系展开领域推理。
}
```

构造 Perspective 的锚点（anchor）是 Foundation 的内部概念，不是对外 API：
它是本轮 Input 中真实存在的 Query 或 Imperative，决定视角所属 Situation。
每次 Resolve 都新建分析，跨轮复用锚点会失败。

| API | 行为 |
|---|---|
| `Value(term)` | 解引用：普通值/Node 返回自身；resolved Variable 返回其 value；值或引用继续指向 Variable 时沿这条链继续读取；unresolved 抛出输入构造错误。链深上限 64 |
| `Readable(term)` | `Value(term)` 此刻是否能成功；没有来源或来源 Query 尚未执行时返回 false，不抛错 |
| `RequireValue(term, reason)` | 同 `Value`，但读取失败时抛出带领域自身原因的输入构造错误，告诉 Input Translation 哪个依赖被 Input 顺序破坏；`reason` 必须是非空字符串 |
| `HasResolutionSource(variable)` | 检查变量是否存在结构上的值来源；不表示该来源已经产生值 |
| `ResolutionSituation(variable)` | 返回值槽所在的 Situation，没有来源时为 null。来源是祖先时，本 Situation 对它的约束不会生效，领域可据此报告冲突 |
| `Exported(variable, situation)` | 检查指定 Situation 的显式 Query/export；默认当前视角。传入 `ref` 的返回值时，判断的是它导入的那个 Variable |
| `Bindings(reference)` | 反查：输入是 Input 内的 Node 或一个 global 引用，返回当前视角下提到它的 Node 列表。Input Node 与 global 分两条路线建档；提及若是 `ref` 的返回值，登记对象是它指向的对象，指向普通值或 Input 之外的 Node 时不登记、静默不返回。传入普通 JSValue 直接报错 |
| `Nodes(situation)` | 访问指定 Situation 的成员；默认当前 Situation |
| `Ancestors()` | 返回当前 Situation 及其祖先 |
| `Children(situation)` | 返回直接子 Situation；默认当前 Situation |
| `Roots()` | 返回 Input 中的根 Situation |

`HasResolutionSource(variable)` 只检查 Variable 是否具有结构上的值产生来源。
它不表示来源已经产生值；`Value(term)` 仍会在返回值前检查本轮 Variable
effect 的 resolved 状态。Foundation 内部的 `IsResolved` 辅助函数也已统一改名
为 `HasResolutionSource`。

`Bindings` 的索引只由每个 Node 在结构扫描时汇报的那一次提及建成（可递归
经过普通 object／Array／Map／Set），不遍历 Variable effect、Foundation 内部
状态或算法局部状态。检索方向为子可见祖先、父不可见子，且与 Node 在 Input
中的位置无关：一个 Situation 内，Query 可以使用任意位置的认知作为约束。
Input Node 走 Node 自己的 identity，global 走它的 BRAND，两条路线互不统一；
提及若是 `ref` 的返回值，登记对象是它指向的对象；指向的既不是 Input Node 也不是 global 时不建档，
查询静默返回空。**Variable 的 value 不参与反查**：值由求解产生，不是被提到的
对象，因此反查结果不随求解进度变化。

Variable effect 由 Foundation 统一创建、销毁与重置，但其内容归 Variable
类型私有：没有第三方访问入口，领域代码只能通过 `Value` 读取变量的语义值。

`Bindings` 和 `Nodes` 都不引入位置截断。认知代码应从 `query.variables`
及其关系展开访问；上述 API 不构成权限隔离机制。
读取变量的语义值使用 `Value`，不以直接读取 effect.value 代替可用性检查。

领域 `ResolveQuery` 返回 remaining 的子集构成的 Map；空 Map 表示本轮无进展，
交由 `ResolveQueryDefer`。即使 value 是 `undefined`，也表示一次完整赋值。

Foundation 不分析 Variable 之间的取值依赖，也不为满足依赖调整 Query 顺序。
领域在自己的 Interface 注释中声明依赖，读取时用 `Readable` 或 `RequireValue`
报告；Input Translation 负责给出满足依赖的 Input 顺序，互相依赖的变量放进同一
个 Query 联合求解。Foundation 完整校验一步结果后再应用。
五个固定领域入口的签名保持草案约定，不提供 resolver 注册机制。

领域代码主要使用上述类型、五个入口和 Perspective。`Analyze`、求解循环、
ref 元数据和 effect 赋值函数是 Foundation 的内部组织模块，不应被领域代码
用来绕过访问检查。普通领域失败抛出 Error；提前读取 value 等输入错误由
访问 API 抛出 `InputStructureError`，领域自己发现的输入错误经 `RequireInput`
抛出同一类型，最终由根 Resolve 转交 Runtime 修复输入。
访问 API 的参数或 state 误用属于领域实现错误，抛出普通 `TypeError`，不走
输入修复流程。

## ref 边界

`ref` 的返回值是 lazy Proxy，元数据为一条扁平记录（source、target、via、
global），通过共享 Symbol 保存，不是链：`ref(child, ref(leaf, v))` 在构造时
即压平为 `ref(child, v)`，中继路径由沿途 Query 的 export 记录承载。
跨 Context 的类型判断使用各 semantic class 的 own BRAND。

读取成员：非 Variable 成员原样返回；裸 Variable 成员返回一个同 source 的
扁平临时引用（记录经由哪个 Variable 读出，不能出现在 Query 的 variables
中）。方法可以调用，`this` 是该返回值本身，结果原样返回；数组、Map、Set
等容器原样返回，嵌在其中的 Variable 是裸的，需要来源时必须显式 `ref`。
写入、删除与 defineProperty 一律拒绝，抛出 `TypeError`，不转发到被引用的
Node，元数据 Symbol 也不例外；Resolve 期间不修改 Declaration（包括其字段
中的普通容器）与已写入的 value，是约定而非强制。
不承诺任意第三方反射、回调或 private-field 操作完全透明。

`ref` 的返回值是转出项，不是求解项：把它列入 Query 只登记 export，值始终由 sourceSituation 提供，不会为它求值，也不改变 sourceSituation 中原始 Variable 的 effect。

从 `ref` 的返回值上读取成员而得到的其他 Variable 不在当前 Situation 的 exports 中，不得出现在 variables 中；它们只能作为提及，即便它们本身另有来源。没有值来源的 Variable 不可读取，属输入构造错误。

### 哪些引用需要 ref

只有带 Situation 相对状态的引用需要 ref（草案 1.4、备忘第 15 节）：

| 被引用者 | 在其所在 Situation 及后代中 | 在其他位置 |
|---|---|---|
| 裸 Variable | 直接引用 | 必须 `ref`，否则 `Cross-Situation Variable requires ref` |
| 声明图到达 Variable 的 Node | 直接引用 | 不得直接引用，否则 `Cross-Situation Node must not carry a Variable`；对其中的 Variable 使用 `ref` |
| 常量 Node（声明图不到达 Variable） | 直接引用 | 直接引用 |
| Situation | 直接引用 | 直接引用 |

声明图是 `situated` 以外的语义数据成员经普通容器与其中的 Node 递归可达的
全部对象；其中的 `ref` 返回值算作到达 Variable，指向 global 本身的引用与
Situation 不算。所有引用仍须指向更早的 occurrence。

因此，两个互不细化的 Situation（例如叙述的世界与角色的信念）可以直接提及
同一个常量对象，不需要为它另建共同祖先。直接提及只是提及：对象的
`situated` 不变，提及者不继承对象所在 Situation 的认知，`Bindings` 的可见性
仍按提及者所在 Situation 的祖先链判定。

值层面有对应的约定：声明图到达 Variable 的 Node 作为 value 时，只应在其所在
Situation 及其后代中被读取。从其他 Situation 读取其中的 Variable，会静默落在
读取视角的值槽。这一约定不检查。

## 临时 Runtime 适配

- `internal/interaction/resolve.go` 的 `requireResolvePersistence` 常量
  当前为 `false`，并有明确的临时用途注释。无持久变化的成功求值保留原
  Revision，返回输出，不创建空 Revision、不触发 no-persistence Learning。
  改回 `true` 即恢复 v0.9 的持久变化要求。有持久变化时仍执行原有发布流程。
- Resolve 返回空数组时，Runtime 跳过 Output Translation，暂时返回
  `（无输出）`。非空输出继续走原有翻译流程和非空 Answer 校验。

## 验证与单轮问答夹具

`Test/Suite.js` 自检覆盖类型、字段、结构与顺序错误的原因、跨 Situation 引用、来源、ref 与信息流、Query 项的重复与歧义、提及与结构检验的分离、值读取与可读性探测、反查与 global 身份、`ValidateInput` 的调用时机与拒绝、领域输入错误、
unresolved 导入限制、多层转出、进展校验与空输出。它调用普通认知模块；
不直接导入使用 `konsupu:input` 的根 `Resolve.js`，因为 Test Context
不提供该 Host 能力。

Go 集成测试直接使用实际 QuickJS Runtime，验证 Input → Resolve → Output
Context 传递、原生输入修复错误、重试状态、部分联合求解、完整祈使集合、
失败不交付部分输出，以及完整 Interaction 的单轮问答与 Revision 行为。

`Test/Fixtures/` 中的五个 `.js` 文件是测试专用领域入口。Foundation 的
`Test.js` 通过普通 ESM import 使用它们；需要替换领域实现的 Go 集成测试会
把同一夹具显式写入临时空间的 `Memory/`，不修改源码树。夹具以简单算术约束
验证协议，也包含刻意触发错误的分支；不作为生产认知库交付，不进行记忆写入。
测试使用确定性的翻译替身，不需要 LLM 服务或网络。Foundation 源码位于 Go
模块之外，测试使用 `-count=1` 禁用测试结果缓存，保证重新读取实际 JS 文件；
编译缓存仍然可以复用；根目录的 Xmake 测试 target 已采用这一设置。

完整构建与测试从仓库根目录通过 Xmake 执行：

```sh
./xmake.agents build
./xmake.agents test
```

`xmake test` 同时运行独立的原生 C 测试二进制和 Go 测试；它将 QuickJS 与
`libkonsupujs.a` 静态链接进 Go 测试/可执行文件，无须设置动态库搜索路径。
