# Konsupu Foundation 规范草案

Foundation 是普通 JavaScript 认知库，定义结构、节点、求值流程与固定认知入口。领域知识和领域算法由其他认知代码实现。

本文汇总截至 Variable effect 定义的协商结果。配套代码提供基类、`ref` 的返回值、effect 存储与求解流程的实际实现，覆盖结构扫描、来源判定、值读取与提及反查；默认 `ValidateInput` 不做任何检查，其余四个领域入口仍是显式抛错的待实现入口。

## 1. 结构

### 1.1 Input

Input 就是 `Node[]`，不另设 wrapper。数组顺序是全局认知线性顺序；同一个 Node object 不得重复出现。该线性顺序约束结构引用与执行顺序，不约束认知可见性。

Node 的结构引用只能指向此前出现的 Node。自然语言词序不要求等于 Input 顺序。普通 JavaScript 数据容器可以存在循环引用。

`GlobalNode.Ref()` 引用预定义的全局对象，不要求其代表实例出现在 Input 中；`ref` 的返回值也不作为独立 occurrence 加入 Input。

### 1.2 situated

所有 Node 均具有 `situated` 字段：

| 类型 | situated |
|---|---|
| SituatedNode 及其派生类 | 所属 Situation，不得为 null |
| Situation | 父 Situation；根为 null |
| GlobalNode 及其派生类 | 恒为 null |

Situation 的父关系直接使用 `situated`，不另设 `parent` 字段。Situation 形成单父、无环的森林，允许多个没有共同祖先的根。

除 Input 的初始 Situation 外，每个 Situation 必须被其他 Node 的语义内容显式引用；该引用本身就是其存在理由。不增加引入来源字段、引入节点类型或引入时刻规则。

Situation 之间的对话、引用、假设等意义由认知内容表达，不由 `situated` 暗示。

### 1.3 Resolution

Variable 的 resolution 相对于 Situation。相同 Variable 在不同 Situation 中可以具有不同值。

Variable 在某 Situation 中的来源，是该 Situation 的祖先链（含自身）上最外层显式 Query 它的 Situation。祖先已有来源时继承，不得覆写；祖先都没有 Query 它时，当前 Situation 的 Query 才建立本地来源。

上述判定只依据结构（Node 的语义数据成员与 Query/export 记录），不依据引用所在位置，也不依据 Query 出现的先后：**一个 Situation 内 Query 查询位置无关**。子 Situation 是对父 Situation 的细化，因此祖先已有的 resolution 被继承而不被覆写，祖先留空的才由细化补上。后续读取必须沿用结构分析为相应引用确定的来源，而不是仅凭最终状态重新搜索祖先。

因此，需要假设的变量本来就应当是未知的：子 Situation 可以对祖先未 Query 的 Variable 作不同细化（例如兄弟 Situation 各自假设一种情况），但不能假设一个祖先已经 Query 的 Variable。对已知值作反事实设想时，使用新的 Variable，它与原变量的关系由认知内容表达。祖先在 Input 任意位置 Query 了该变量，子 Situation 的 Query 就只登记 export，子 Situation 对它的约束不生效。

以下三项分别保存，不混为一个标志：

| 项目 | 含义 | 归属 |
|---|---|---|
| Structural resolvedness | 该引用在完整 Input 的结构分析中有合法 resolution source | Resolve 的结构分析状态 |
| 实际 resolution | 来源已产生 JS value | Variable effect |
| Explicit query/export | Situation 自己 Query 过该引用 | Resolve 的 Query/export 记录 |

Situation 的 exports 记录它显式 Query 的项。这些项分两类：直接列出的 Variable，以及 `ref(sourceSituation, variable)` 的返回值。前者是否由该 Situation 实际求解，按上述最外层规则判定，与 Variable 声明在哪个 Situation 无关；后者不建立本地来源，它的值由 sourceSituation 提供。

`resolved` 不表示已知、真实、可信或递归 ground。结构化的无法确定原因可以是正常结果；结果可以继续引用 unresolved cognition。

### 1.4 ref 与信息流

公开入口为 `ref(sourceSituation, variable)`。ref 的语义是把 sourceSituation 的 exports 中的 variable 提供给持有该返回值的认知。因此 sourceSituation 必须显式 Query 过 variable，使它进入自己的 exports；只在 sourceSituation 继承得到、而没有在其中显式 Query 的 Variable 不在它的 exports 中，不能由它提供。

持有 `ref` 返回值的认知可以从自己的直接子 Situation、或与自己没有共同祖先的 Situation 取值。同一树的兄弟、堂兄弟和非直接子代之间必须逐层 `ref`。子 Situation 可以直接使用祖先认知，不需要 ref。

ref 用于显式表现信息流，即 Situation 相对状态的流动；它不是隔离、授权或 ACL。

**哪些引用需要 ref。** 只有带 Situation 相对状态的引用需要 ref。Variable 的 value 与求解状态相对于 Situation（1.3）：从不同 Situation 读取同一个 Variable，可能落在不同值槽，所以跨 Situation 使用它必须显式表现来源。一个 Node 的声明图若能到达 Variable，它就同样带有这种状态：从不同 Situation 读取其中的 Variable，结果可能不同。声明图到达不了任何 Variable 的 Node（下称常量 Node）则从任何 Situation 看都是同一个对象、具有同一组语义字段，提及它不构成信息流。因此：

- 裸 Variable 只能被它所在 Situation 及其后代中的认知直接引用；在其他位置使用必须通过 `ref`。
- 声明图到达 Variable 的 Node 同样只能被它所在 Situation 及其后代中的认知直接引用；在其他位置需要其中的值时，对相应 Variable 使用 `ref`，不整体提及该 Node。
- 常量 Node 可以被任何 Situation 中的认知直接引用，只受 1.1 的引用顺序约束。
- Situation 本身可以被任何认知引用，同样受引用顺序约束；这是提及其他 Situation 的通道。

声明图指 Node 的语义数据成员（`situated` 除外）经普通 object／Array／Map／Set 容器与其中的 Node 递归可达的全部对象。其中的 `ref` 返回值算作到达 Variable；指向 global 本身的引用与 Situation 不算，它们从任何 Situation 看都相同。该判据是保守的：即使可达的 Variable 从两边看恰好落在同一值槽，也按到达 Variable 处理，因为精确判定依赖整个 Input 的 Query 分布。

跨 Situation 直接提及常量 Node 只是提及：被提及对象的 `situated` 不变，提及者不因此继承该对象所在 Situation 的认知，反查的可见性仍按提及者所在 Situation 判定。

`ref` 的返回值不具有独立语义身份、Input 位置或 effect；两次 ref 不要求 `===`。它提供属性读取与方法调用，但访问只是便利手段：Foundation 的类型判断、结构检查、来源判定、值读取与反查都单独识别 ref，不通过该返回值与它指向对象之间的访问行为来实现。读取成员时，非 Variable 成员原样返回；成员是裸 Variable 时，返回一个同 source 的扁平临时引用，使后续读取落在正确的值槽。方法结果与容器原样返回，嵌在其中的 Variable 是裸的，需要来源时必须显式使用 `ref`。ref 是只读视图：写入、删除与属性定义一律拒绝，不转发给目标对象，元数据 Symbol 也不例外。

Situation 显式 Query 某个 Variable，该 Variable 及它所能到达的整个对象图即属于该 Situation 的 exports。通过该对象图到达的对象可以正常访问和引用，不增加逐属性限制；哪些对象可以出现在 variables 中由 2.6 节规定。

`ref` 得到的项不是求解项。认知 Query 它时，当前 Situation 不为它求解：列入 exports 即完成，值始终由 sourceSituation 提供。这样做不改变 sourceSituation 中原始 Variable 的 effect。

`GlobalNode.Ref()` 使用相同的返回值机制暴露全局对象，不公开 `ref(null, ...)`。

#### 实现

`ref` 的返回值使用 lazy JavaScript Proxy；来源信息采用跨 Context 可读的 `foundation:ref-meta:v1` Symbol。它是内部表示约定，不是秘密或授权凭据，也不是身份。

完整实现位于配套的 `Ref.js`、`MakeRef.js`、`RefMeta.js`。元数据是一条扁平记录（source、target、via、global），不是链；`ref(child, ref(leaf, v))` 在构造时即压平为 `ref(child, v)`，中继路径由沿途 Query 的 export 记录承载。Proxy 的 target 是独立的空对象，因此报告的描述符一律标为 configurable，以满足 JS Proxy invariant；变更类 trap 一律拒绝。

`ref` 的返回值不作为新的 state key；state key 只接受真实的 Situation 与 Variable。内部 key 不持久化，也不是 Node ID。

反查不按 ref 的返回值识别对象，而分两类：Input 内的 Node 按对象自身识别，global 按它的 BRAND 识别；语义数据成员中提到的若是 `ref` 的返回值，登记对象是该返回值指向的对象，它指向普通值或 Input 之外的 Node 时不登记，反查也不报错。求解结果不进入反查，因此反查内容不随求解进度变化。

本实现支持 Foundation 使用的属性访问、类型判断、数组与 Map/Set 访问和迭代。不承诺任意第三方反射、回调或 private-field 操作都透明；不通过增加权限层来补偿这一限制。

## 2. 节点

本节按类型给出必须满足的约束；实现位于 `Memory/Foundation/`，不再内嵌可运行代码。

### 2.1 Node

Node 是具有独立语义身份的抽象基础对象，identity 直接使用 JavaScript object identity。不得直接实例化 Node；认知必须使用具体 Node subclass。

每个 semantic subclass 必须自己声明 `static BRAND`，包括只转发父类构造器的 subclass。BRAND 是该类型自己的完整 key，例如 `foundation:Variable:v1`；不设置库级统一版本前缀。其他认知库使用自己的命名空间。

基类统一安装继承链的 brands，并继承提供 `Symbol.hasInstance`。构造和类型判断均检查 concrete class 自己的 BRAND，避免未声明 brand 的 subclass 被误判为父类型。

Node 自身只负责共同存储。situated 的具体约束由下述 SituatedNode、Situation、GlobalNode 实现。

语义字段采用 `writable: false, configurable: true` 防止普通误赋值，并保留修复能力。不 freeze、seal 或 preventExtensions Input 对象；不承诺深不可变。Resolve 期间不修改 Declaration（包括语义字段中的普通容器）是约定，不由 Foundation 强制。对其它认知的引用应当出现在明确的数据成员中，供结构分析读取。

约束：

- 抽象，不得直接实例化。
- 每个 semantic subclass 必须自己声明 BRAND；继承链上出现重复 BRAND 即报错。
- `situated` 是数据成员，构造时固定；只有 Situation 的 `situated` 可以为 null。
- 语义字段不可直接赋值，但保持 configurable，供明确的结构修复使用。
- 必须实现提及的声明（见 2.12）；漏写在结构扫描期直接报错。

实现：`Memory/Foundation/Brand.js`、`Fields.js`、`Node.js`。类型判断检查对象自身是否存在该类型的 BRAND 描述符且值为 true；brands 按继承链收集并逐个定义。

### 2.2 SituatedNode

SituatedNode 表示必须归属于 Situation 的认知。Variable、Proposition、Query 均从它派生；Imperative 是 Proposition 的抽象子类。

约束：抽象，不得直接实例化；构造要求 `situated` 是 Situation。

实现：`Memory/Foundation/SituatedNode.js`。

### 2.3 Situation

Situation 是 Node，`situated` 就是父 Situation。构造后的非法重定义或环由结构检查发现。

约束：concrete 且 final，不允许继续继承；`situated` 为父 Situation 或 null；不声明任何提及。

实现：`Memory/Foundation/Situation.js`。

### 2.4 Variable

Variable 是符号未知量，不在自身保存唯一 value。不另设 FreeVariable、OutputVariable 或 Binding Node。

Variable 的 effect 固定为：

```text
VariableEffect {
    resolved: boolean
    value: JSValue
}
```

value 可以是任意 JSValue，包括 Node 与 `ref` 的返回值，但不能是裸 Variable。赋值点只检查 value 顶层：顶层是裸 Variable 时抛 `TypeError`，属领域实现错误，不是输入构造错误。嵌套在 value 内部的裸 Variable 同样禁止，但只作为约定，不检查，因为逐次遍历整个值图代价过高。value 是声明图到达 Variable 的 Node 时，其中的 Variable 按读取视角解析（3.7）；若该 Node 所在 Situation 不是读取视角的祖先（含自身），读取会静默落在读取视角的值槽，而不是该 Node 所在 Situation 的值槽。因此这样的 Node 作为 value 时，只应在其所在 Situation 及其后代中被读取，需要跨 Situation 传递其中的值时，对相应 Variable 使用 `ref`（与 1.4 的结构规则对应）；这同样是约定，不检查。运行期自建的 ref 在赋值点检查：sourceSituation 在本轮 Input 内、被导入项是 Variable、sourceSituation 自己显式 Query 过它；违反同样是领域错误。

该 effect 只表示实际求值结果，不包含 structural resolvedness、source、inherited 或 explicit-export 字段。

约束：concrete 且 final；必须声明提及，范围是它自己的语义数据成员。

实现：`Memory/Foundation/Variable.js`；effect 的形状与存储在 `EffectStore.js`，值的检查与唯一写入点在 `VariableEffect.js`。

### 2.5 Proposition

Proposition 是抽象 Node。其具体领域 subclass 的存在与其是否为真等性质无关，仅提供一个可以被讨论的客观对象；不得直接实例化 Proposition。

领域命题直接继承 Proposition，以普通命名字段保存参数角色，无需再包装一个 Proposition。未知角色可以直接使用 Variable；Variable 自身不冒充它未来结果的领域类型。

约束：抽象；每个领域 concrete subclass 必须自己声明 BRAND 并声明提及。领域 concrete subclass 同样默认 final，在构造器中调用 `Interface` 导出的 `Final(Type, new.target)` 实现。

实现：`Memory/Foundation/Proposition.js`。

### 2.6 Query

认知只能 Query Variable，Query 不携带 Proposition 或 query body。约束变量的认知已经位于 Situation 中。

领域实现应尽量联合、配对地求解同一次 Query 中的多个 Variable；完成结果可以是普通值，也可以是结构化的无法确定原因。硬失败抛异常，不能静默留下未完成的 Variable。

认知 Query already-resolved、inherited 和 `ref` 的返回值时，这些项不重新实际求值；无论是否实际求值，它们都列入当前 Situation 的 exports。

variables 中的每一项都是当前 Situation 的 exports，因此只能是两类对象：直接列出的 Variable，以及 `ref(sourceSituation, variable)` 的返回值。从该返回值上读取成员而得到的其他 Variable 不在当前 Situation 的 exports 中，不得出现在 variables 中；它们只能作为提及。

global 不属于任何 Situation，任何 Situation 都无法把它列入 exports，因此它只能作为提及出现在语义数据成员中，不能出现在 variables 中。

认知 Query Proposition 的真实性时，先把该性质关联到明确 Variable，再 Query 该 Variable。同一 Situation 中（同一个或不同的 Query）多次列出同一对象，若各项解析到同一个值槽，就不构成新的语义：只列入 exports 一次，多余项忽略；若各项解析到不同的值槽（例如同时列出 `v` 与 `ref(child, v)`，或 `ref(a, v)` 与 `ref(b, v)`），则属输入构造错误。判定不依赖各项出现的先后。

约束：concrete 且 final；variables 必须是 Variable 数组；构造期拒绝非 Variable 元素，global、从 `ref` 返回值上读取成员而得到的 Variable 以及解析到不同值槽的重复项在结构扫描期拒绝。

实现：`Memory/Foundation/Query.js`、`PlanQueries.js`。

### 2.7 GlobalNode

GlobalNode 是抽象基类，concrete type 表示全局语义单例。使用继承的静态 `Ref()` 取得返回值，不提供直接构造方式。

各 JSContext 可以各有代表实例，因此跨 Context 判断「是不是同一个 global」依据 concrete class 的 BRAND，而不是对象相等。全局代表不进入 Input，不分配 Resolve effect，也不声明提及。

约束：抽象；`Ref()` 只能由 concrete subclass 使用；同一个 concrete class 在同一个 Context 内只有一个代表实例。

实现：`Memory/Foundation/GlobalNode.js`。反查以 BRAND 作为 global 的名字，是实现选择。

### 2.8 KonsupuIdentity

KonsupuIdentity 表示使用当前认知的 Konsupu 本身，使用 `KonsupuIdentity.Ref()` 引用。它不指自然语言中的“我”、当前说话者、LLM Agent 或 resolver。

该身份跨 Context、知识库及技能导入导出保持一致。它不是 Input occurrence，不属于 Situation，也没有 Resolve effect。

约束：concrete 且 final。

实现：`Memory/Foundation/KonsupuIdentity.js`。

### 2.9 Imperative

Imperative 是抽象 Proposition，表示“要求 addressee 做某事”这一认知。它与其他 Proposition 一样只提供一个可以被讨论的对象：出现在 Input 中不等于要求成立，也不说明要求以何种方式提出。

具体 subclass 以数据成员 `addressee` 保存被要求者；要求的内容及其他角色由领域定义。未写 `addressee` 的 Imperative 不成为候选（3.4）。

合法 Input 可以没有 Imperative。不在本草案中推测隐含祈使或规定聆听时必须回应。

约束：抽象；`addressee` 若写出，必须是数据成员。具体领域 subclass 与 Proposition 的相同：必须自己声明 BRAND 并声明提及，默认 final。

实现：`Memory/Foundation/Imperative.js`。

### 2.10 Output

Output 是 outward result 的抽象共同基类，不是 Node，也不属于 Input 或 Situation。所有返回的产出必须继承 Output，并遵守同样的 own BRAND 约定；不得直接实例化 Output。

约束：抽象；每个 concrete subclass 必须自己声明 BRAND。

实现：`Memory/Foundation/Output.js`。

### 2.11 TextOutput

DEMO 的文本产出使用 TextOutput；text 已经是认知决定要说出的程序化文本。

约束：concrete 且 final；`text` 必须是字符串。

实现：`Memory/Foundation/TextOutput.js`。

Output Translation 可以组合、润色和调整格式，不补做事实推理或改变实质内容。语言、语气和格式要求必须来自获准读取的认知或产出，不能重新访问 Raw。

未来要求精确机器控制的输出，通过新的 Output subclass 与结构化通道直接对接；DEMO 不实现。

### 2.12 提及的声明

能出现在 Input 中的每个具体类型必须自己声明它提到的认知。结构扫描对每个 occurrence 调用一次该声明；范围是该类型自身 Declaration 中的直接提及：不经其他 Node 传递，但自身字段中的普通 object／Array／Map／Set 容器仍算自身。`situated` 是父链接，不属于提及。漏写声明在结构扫描期直接报错。

提及只是提及：它不表示求解请求，也不建立来源。提及决定反查内容与「Situation 必须被提及」；结构检验不依赖提及，由 Resolve 的结构扫描自行遍历每个 occurrence 的全部语义数据成员完成（见 3.2）。汇报的项按同样的结构规则检验，因此少报只会让反查漏掉该提及，不会让非法结构通过。

## 3. Resolve 流程

### 3.1 状态与生命周期

每次 Resolve 创建独立的：

```text
Map<Situation, Map<Variable, VariableEffect>>
```

第一层为 Situation，第二层以真实 Variable 的 identity 为 key。只有 Variable 拥有 effect，其他 Node 不允许有 Effect；通用访问入口不对第三方开放，节点只能通过 Foundation 访问自己的 effect。`ref` 的返回值不建立 state slot；读取先由结构分析确定来源，再访问对应槽。

结构分析的来源选择、显式 Query/export 记录属于本次 Resolve 的内部信息，不塞入 Variable effect。读 effect 前先确定来源的实际 Situation 和 Variable，再读取对应槽。

失败重试使用新状态，不复用旧 effect。JavaScript heap 不回滚；返回 Input Translation 修正时，必须提示其对象图可能已被执行代码修改。

成功后产出必须能继续交给 Output Translation；DEMO 的 TextOutput 已携带实际文本，不依赖重新执行 Query。状态不跨 Interaction 持久化，也不代替 Memory JSON。

本地 Variable 的 effect 只有一个槽位 `(situated, variable) -> { resolved, value }`，只接受真实的 Situation 与 Variable；`ref` 的返回值不能作为 key。生命周期由 Foundation 统一管理。

写入只有一个入口，并先整步校验：值合法、变量本轮尚未写入。同一求解步的若干变量先全部校验，再全部写入；任一项不合法则整步不写入，不留部分赋值。

```text
写入一个 value 到 (situated, variable)：
    变量本轮已写入                -> 报错
    value 顶层是裸 Variable       -> 报错（领域实现错误）
    value 是 `ref` 的返回值       -> 校验 source 在 Input 内、导入 Variable、source 显式 Query 过它，违规即领域错误
    否则                          -> 写入 { resolved: true, value }
```

已写入的 value 在 Resolve 期间不再原地修改，是约定，不由 Foundation 强制。

实现：存储在 `Memory/Foundation/EffectStore.js`，写入与校验在 `VariableEffect.js`。

### 3.2 Structural Pass

按 Input 线性顺序建立本次 Resolve 的结构状态，检查 Node 唯一性与引用顺序、跨 Situation 引用（1.4）、Situation 森林及显式提及、Query 声明（global 不得出现、从 `ref` 的返回值上读取成员而得到的 Variable 不得出现）、Query 重复项（解析到同一值槽的多余项忽略，解析到不同值槽即报错）、继承来源、ref 流向（sourceSituation 的 exports 含 variable、方向合法、使用点在其后），并建立提及索引（Input Node 与 global 两类）。引用顺序、跨 Situation 引用规则（裸 Variable 与声明图到达 Variable 的 Node 在其所在 Situation 及后代之外必须使用 ref）以及 ref 流向这些结构规则，作用于每个 occurrence 全部语义数据成员中的引用，不依赖类型的提及声明；提及索引与 Situation 的显式提及只由提及声明建立。

本 pass 不执行领域求值。它以一次完整 Input 扫描确定每个引用的 structural resolvedness，该判定与引用所在位置无关：结构分析本身是全量的，不存在把最终状态「反套」到此前位置的问题。受执行顺序约束的只有实际 value 的写入。

Variable effect 不因这一步而变成 `resolved: true`。实际来源只有在后续求值赋值后才完成。需要 resolved 变量的语义操作必须区分二者：structural resolvedness 按结构分析的全量结果判定；实际 value 是否可读按 Variable effect 的完成状态判定。

Structural Pass 全部成功后、任何 Query Resolution 与 Imperative Discovery 之前，Foundation 恰好调用一次领域入口 `ValidateInput(input, state)`（4.6）。它让领域对完整 Input 做语义检查；Input 中没有 Query、也没有指向 Konsupu 的 Imperative 时同样调用。它不是第二套结构检查：此时没有任何 Variable 的实际 value，领域不得读取 value。

### 3.3 Query Resolution

按 Input 中 Query 的顺序执行。对每个 Query，先移除结构分析确定为本地已有、继承或由 `ref` 得到的变量，得到 remaining。

remaining 非空时调用固定 `ResolveQuery` 入口。一次可返回一个或多个变量的 resolution；完成这些赋值并移除相应 remaining 后，重新调用同一入口。

Query Node 之间的执行顺序严格按 Input 顺序，不允许破坏结构的延迟。延迟只发生在同一个 Query 所 Query 的若干变量之间：`ResolveQuery` 返回空 Map 表示本轮放弃，此时调用 `ResolveQueryDefer`，每轮最多一次；两者同轮都未完成任何变量时 Resolve 失败。返回无效 key 或抛异常同样使 Resolve 失败。一步结果完整校验后再应用。Map 中的 undefined 是合法赋值，不表示 skip。

Foundation 不分析 Variable 之间的取值依赖，也不为满足依赖调整 Query 顺序。领域在自己的 Interface 注释中声明依赖，读取前可探测 value 是否可读（见 3.7），并以输入构造错误报告被 Input 顺序破坏的依赖；Input Translation 负责构造满足依赖的 Input 顺序，互相依赖的 Variable 放入同一个 Query 联合求解。

领域实现不得跨调用累积状态，只能用可见结构完成求解；需要额外前提时在自己的 Interface 注释中记载并自行抛异常，Foundation 不提供声明机制。领域实现可以借助原始 Query、Input 和 state 维护配对约束。它负责自己的尝试顺序；Foundation 不注册、排序或扫描领域 resolver。

领域发现 Input 本身构造错误（而不是认知不足以回答）时，调用 Interface 导出的 `RequireInput(condition, reason)`：条件不成立即抛输入构造错误，由根 `Resolve.js` 转为 Runtime 的 `InputObjectInvalidError`，交回 Input Translation 修正；`reason` 进入 Runtime 的输入修复诊断（备忘第 16 节）。`reason` 必须是非空字符串。它可以在任何领域入口中使用，整个 Input 的语义检查通常放在 `ValidateInput`（4.6）。三类失败由此分开：Input 写错走 `RequireInput`；认知无法确定答案时返回结构化值；领域实现自身的错误抛普通异常，走 Learning。

完整循环实现位于 `QueryLoop.js`、`Progress.js`。所有 Query 完成后才进入祈使处理。

### 3.4 Imperative Discovery

按 Input 顺序收集 addressee 为 `KonsupuIdentity` 的候选 Imperative，再逐个调用 `IsKonsupuImperativeApplicable`。候选只按 Input occurrence 与 addressee 的类型收集，不看它是否被断言或位于哪个 Situation。

该入口只判断候选是否在当前 Situation 关系下真正构成对 Konsupu 的祈使，不代替稳定身份，也不猜测未明确指向 Konsupu 的意图。

### 3.5 Imperative Resolution

得到完整有效祈使集合后，反复调用 `ResolveImperatives`。完整 imperatives 不缩小，remaining 表示尚未完成的部分。

一次必须完成 remaining 的非空子集，可以联合处理前提、禁止、冲突、mask 等要求，并产生任意数量 Output。Foundation 不定义这些领域结果类型。

认知实现必须在产生 outward 内容前检查相关要求，发现冲突并反馈；不能依靠先处理一条祈使来忽略后面的约束。完成所有 remaining 后才返回整次结果；中途失败不交付部分输出。

完整循环实现位于 `ImperativeLoop.js`、`Progress.js`。

### 3.6 StructuredOutput

返回值为 `Output[]`。数组语义无序，不建立元素与 Imperative 的对应关系，不按对象 identity 自动去重。一次完成若干祈使可以产生零个、一个或多个 Output。

Output Translation 自由组织文本。不得依赖数组下标表达步骤、前后关系或机器控制。无有效祈使时返回空数组，不由 Foundation 补造回应。

认知空间仍须履行 Runtime 的逐轮记忆要求。记忆写入由 cognition 的 Resolve 组织，不由 Variable effect 或 Output 数组代替。

与 Runtime 的错误交接由根 `Resolve.js` 完成；本文不改变 Input 修复和 Learning 重试流程。

### 3.7 视角与读取

领域实现从 Query 或 Imperative 取得视角，可以读取 Variable 的语义值、判断某 Variable 是否具有结构上的值来源、判断某 Situation 是否显式 Query 过某 Variable，以及反查提及。

读取值：普通值与 Node 就是它自己；Variable 取其本轮 effect 的 value；取到的值若仍是 Variable（只能由 `ref` 表示），继续读取，深度上限 64。没有值来源的 Variable，或来源 Query 尚未执行的 Variable，不可读取，属输入构造错误。

视角还提供：不抛错地探测 value 此刻是否可读；读取失败时以领域给出的原因报告输入构造错误；给出 Variable 的值来源所在的 Situation。后者使领域能发现值来自祖先、本 Situation 对它的约束因而不生效的情况（见 1.3）。

## 4. 认知入口

### 4.1 文件与调用约定

固定入口位于认知空间的 `Memory/` 下：

| 文件 | named export |
|---|---|
| Memory/ValidateInput.js | ValidateInput |
| Memory/ResolveQuery.js | ResolveQuery |
| Memory/ResolveQueryDefer.js | ResolveQueryDefer |
| Memory/IsKonsupuImperativeApplicable.js | IsKonsupuImperativeApplicable |
| Memory/ResolveImperatives.js | ResolveImperatives |

这些是 Foundation 对认知库的约定，不增加 Runtime 根目录 entry。内部模块、调用顺序和 dispatch 由认知库自定；没有 callback 注册 API。

五个入口均同步执行，接收原始 Input 和同一次 Resolve 的 state；`ValidateInput` 只接收这两者。不提供 `visibleNodes`、额外 scope view 或通用 registry。传入完整 Input 不改变线性引用语义。

### 4.2 ResolveQuery

```js
export function ResolveQuery(input, query, remaining, state) {
    // Returns Map<Variable, JSValue>.
}
```

remaining 是仍需实际求解的 Variable 数组，已经移除本地已有值、继承和由 `ref` 得到的项；query.variables 保留原始联合要求。

返回 Map 必须覆盖 remaining 的子集，所有 key 来自 remaining。Foundation 完成赋值后再次调用。结构化未知或冲突原因是普通 value；返回空 Map 表示本轮无进展，交由 `ResolveQueryDefer` 处理。

求值依据遵循 Situation 内的位置无关性：认知可以 Query 其 Situation 内任意位置的认知作为约束，包括 Input 中较晚出现的 Node。继承与 `ref` 的读取使用结构分析确定的来源，不能靠最终 state 的临时搜索替代。

### 4.3 ResolveQueryDefer

```js
export function ResolveQueryDefer(input, query, remaining, state) {
    // Returns Map<Variable, JSValue>.
}
```

与 `ResolveQuery` 同签名，仅当主入口返回空 Map 时调用，每轮最多一次；可以抛异常或完成部分变量。它与主入口同轮都未完成任何变量时 Resolve 失败。该入口是必需的固定导出，缺失即报错。

### 4.4 IsKonsupuImperativeApplicable

```js
export function IsKonsupuImperativeApplicable(
    input, imperative, state
) {
    // Returns boolean.
}
```

Foundation 调用前已确认 addressee 的类型为 KonsupuIdentity。返回值必须是 boolean，表示该祈使是否在当前 Situation 关系下真正对 Konsupu 生效。

对话、转述、引用、转发发令等意义完全由认知库解释。

### 4.5 ResolveImperatives

```js
export function ResolveImperatives(
    input, imperatives, remaining, state
) {
    // Returns { resolved: Set<Imperative>, outputs: Output[] }.
}
```

imperatives 始终是完整有效集合，remaining 是尚未完成的数组。认知库可以检查整个集合，联合处理任意非空子集。

resolved 必须是 remaining 的非空子集；outputs 可以为空，但每项必须属于 Output。两者不存在对应关系。Foundation 校验并累计结果后继续调用，直到 remaining 为空。

在祈使处理阶段检查完整祈使集合是明确允许的；不因此回溯改变 Query 的线性来源判定。

### 4.6 ValidateInput

```js
export function ValidateInput(input, state) {
    // Return normally when the Input passes.
}
```

Structural Pass 全部成功后、任何 Query Resolution、Imperative 适用性判断与祈使执行之前，Foundation 恰好调用一次（3.2）。Input 中没有 Query、也没有指向 Konsupu 的 Imperative 时同样调用。

- 正常返回表示通过，返回值被忽略；
- 领域确认 Input 的语义构造违反自己的 Interface 契约时，调用 `RequireInput(condition, reason)`，交回 Input Translation 修正；
- 其他异常按普通 Resolve 异常处理，进入 Learning；
- 此时任何 Variable 都还没有实际 value，validator 不得读取 value，也不以读取 value 作为检查手段。

它是领域的语义检查，不是第二套 Foundation 结构检查。Foundation 自带的默认实现什么也不做；领域包替换该文件。该入口是必需的固定导出，缺失即报错。

## 附录：实现与验证范围

### A. 核心代码

配套实现按普通 `.js` ESM 文件拆分：类型与约束位于 `Memory/Foundation/`，五个领域入口位于 `Memory/`，对领域开放的导入位于 `Interface/`，自检位于 `Test/`。每文件满足 160 行；每行 80 列的限制当前由 `EnforceJavaScriptColumnLimit = false` 暂时关闭（见规范备忘第 7 节）。

结构扫描（`Analyze.js`、`ScanContent.js`、`PlanQueries.js`、`ValidateRefs.js`）、来源判定（`ResolutionSource.js`）、两个求解循环（`QueryLoop.js`、`ImperativeLoop.js`）、值读取（`Value.js`）与提及索引（`Bindings.js`）都已实现。默认 `ValidateInput` 不做任何检查；其余四个领域入口是显式抛错的待实现入口；Memory 序列化未实现。

### B. 验证范围

Foundation 自检主体位于 `src/foundation/Test/Suite.js`，导出 `FoundationSuite()`；根 `Test.js` 只调用它，上层认知包的根 `Test.js` 可以同时调用它与自己的自检。自检覆盖类型、结构与顺序错误的原因、跨 Situation 引用、来源、ref 与信息流、值读取、提及反查与 global 身份、`ValidateInput` 的调用时机、求解循环与祈使循环；`konsupurt` 的 Go 集成测试在真实 QuickJS Runtime 中验证 Input → Resolve → Output 的跨 Context 传递、失败分类与部分赋值回滚。统一由仓库根目录的 `./xmake.agents test` 运行。

这不是对所有自然语言场景的证明；未覆盖范围见《Konsupu Foundation 使用说明》与《规范备忘》。
