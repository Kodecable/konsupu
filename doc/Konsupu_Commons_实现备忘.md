# Konsupu Commons 实现备忘

本文记录 `doc/Konsupu_Commons_规范草案.md` 的实现：代码位置、组装与测试方法、规范第 16 节未定义事项的实现选择、其他解读，以及已知限制。节号均指规范草案。本文与草案冲突时以草案为准；草案修订后，本文的实现选择随之复查。

## 1. 位置、组装与测试

Commons 是建立在 Foundation 之上的认知包，源码以 overlay 形式放在 `src/commons/`，不修改 `src/foundation/`。面向翻译的写法整理在 `Konsupu_Commons_翻译指引.md`。

源码目录：

```text
src/commons/
├── Interface/Commons.js          公开出口，同时转出 Nodes.js
├── Memory/ValidateInput.js       覆盖 Foundation 默认入口：Commons lint
├── Memory/ResolveQuery.js        覆盖 Foundation 默认入口：Commons 求解
├── Memory/ResolveQueryDefer.js   同上（主入口总是完成全部变量）
├── Memory/Commons/
│   ├── Vocabulary/               词汇：Base、Links、Logic、Ordinals、Anchors、TimeValues、TimeRelations、Cognition
│   ├── Model/                    Schema（字段与规则声明）、Graph、Index（输入索引）、Result（{status, result}）
│   ├── Lint/                     lint 规则
│   ├── Engine/                   项、知识库、对应组（Groups）、匹配（Fit、Same）、包含判定（Subsume）、证明、反驳、推导、模式分量、模式实例（Instances）、矛盾诊断（Conflicts）
│   ├── Time/                     时间表达式、锚点序、三值集合推理
│   └── Solve/                    Among、Validity、Corresponds、定义性规则检查（Definitions）与 Query 入口
├── Test/Commons/                 CommonsSuite 与测试词表
└── Test.js                       FoundationSuite() 之后运行 CommonsSuite()
```

overlay 只能新增文件，或覆盖 `Memory/ValidateInput.js`、`Memory/ResolveQuery.js`、`Memory/ResolveQueryDefer.js` 与根 `Test.js`。祈使的两个入口保持 Foundation 的待实现状态。

组装与测试（从仓库根目录）：

```shell
./xmake.agents commons_space      # 组装到 build/commons-space，违反覆盖规则即失败
./xmake.agents go_env_run -- "$PWD/build/linux/x86_64/release/konsupu" \
  format "$PWD/build/commons-space"
./xmake.agents go_env_run -- "$PWD/build/linux/x86_64/release/konsupu" \
  test --space "$PWD/build/commons-space" --config "$PWD/<config>.json"
./xmake.agents test               # 含 Go 集成测试 commons_test.go
```

源码必须是规范格式（prettier），且每个文件格式化后不超过 160 行；格式化 `build/commons-space` 后把 overlay 中的文件拷回 `src/commons` 即可。

Go 集成测试 `src/konsupurt/internal/cognitivespace/javascript/commons_test.go` 在临时目录中按同样的覆盖规则组装空间，格式化并校验后：

- 通过 Runtime 运行根 `Test()`（Foundation 与 Commons 两套自检）；
- 在 Input Context 构造问题、在 Resolve Context 求解、在 Output Context 读出答案，验证跨 Context 的类型判断与答案（测试专用的祈使入口输出 `status:result`）；
- 验证 lint 拒绝与“无声明决定的 Query”被归类为输入修复，原因到达 Input Translation。

## 2. 求解组织

- **ValidateInput** 运行 lint（第 4 节），不读取任何值。
- **ResolveQuery** 为每个待求变量找出决定它的声明：`Validity.variable`、`Corresponds` 的一侧、`Among` 描述中的 Variable，范围是 Query 所在 Situation 及其祖先。每个变量都得到 `{status, result}`；依赖多个声明时取最差的 status（7.3）。没有任何声明决定的变量是输入构造错误（`RequireInput`）：未断言的命题不是约束（原则 2）。
- **知识库**（`Engine/KB.js`）：某 Situation 的事实是它及其祖先中的 Assertion，经时间修饰与合取展开为“命题 + 有效时间”，再经推导规则（Conditional 与各类的 `Derive`）在有限轮内求闭包。对应关系、锚点序都按 Situation 懒建立。
- **对应组**（`Engine/Groups.js`）：知识库把可见的 `Corresponds` 取并查集。组的代表（身份，也是优先给出的答案）是位于该 Situation 及其祖先上的成员中 Input 最靠前者，没有这样的成员时取全部成员中最靠前者。组的描述（facets）是位于祖先链上的全部成员，没有时是全部成员：匹配 Virtual 位置与 `Among` 候选、`Exclude` 的类与字段排除、规则的 `api.Is` 都按“任一描述相符”判断（6.3）。规则的 `api.Value` 给出代表，判断类应使用 `api.Is`。
- **证明**（`Engine/Prove.js`）：被判断的项由某个事实满足（Fit，第 2 节与 9.1），且事实的时间包含项的时间；或由类自己的 `Judge` 规则判定。`Judge` 判为假时仍查找被断言的事实：断言与规则矛盾时两侧都成立，结果为 `Ambiguous`（8.4）。深度优先，先证开放位置最少的项，有步数预算。
- **反驳**（`Engine/Refute.js`、`Engine/Negation.js`）：P 被反驳，就是在 P 的时间中某一点能推出 `Not(P)`（8.2），实现上即在“重叠”模式下证明 `Not(P)`，不另设反驳机制。`Not(P)` 的推出：持有的 `Not`（作为事实匹配，被判断的 P 更具体）；类的 `Judge` 判 P 为假（`Judge` 判断关系本身，与时间无关）；类的 `Fails` 规则成立（它说明 P 在其时间的每一点都不成立，给出整段时间上的 `Not(P)`；例如 `Occurs.Fails`：时间与 e 的 Duration 不相交）；类的 `Refute` 规则成立（它只说明 P 在其时间中某一点不成立，所以只在单点上、或反驳所需的“某一点”上给出 `Not(P)`）；`NoInstance`、`Only` 的 `Excludes` 规则；P 是 `Not(Q)` 而 Q 成立。时间段或 AllTime 上的 `Not(P)` 要求 P 在每一点都不成立（14.5），P 在某一点不成立推不出它。推不出从不当作反驳（8.3）。
- 一次入口调用内的一切（索引、知识库、Among 结果）都在调用结束后丢弃，不做跨调用缓存；构造均为懒解析。

## 3. 规范第 16 节未定义事项的实现选择

| 16 | 实现选择 |
|---|---|
| 1 候选搜索 | 在 `situation` 及其祖先中穷举。对象候选是语境对象（不含命题、声明、Variable、Virtual Node 与被 Among 修饰的描述），按 6.2 的三档依次查找；命题候选是该 Situation 可推出的命题。对应的候选合并，保留 Input 中最靠前者 |
| 2 Corresponds 传递性 | 传递：同一 Situation 可见的对应取并查集；代表与描述见第 2 节“对应组” |
| 3 NoInstance、Only | 名称照用草案。推导规则为各自的 `Excludes`：被判断的约束体嵌入模式（9.1，头映射到约束体中的项）即被 `NoInstance` 否定；嵌入 `Only` 的模式且头不在列表中即被否定。具体头要与列表中每一项可证不同；Virtual 头要求列表中每一项都被排除（类不符、字段指向不同对象，或代入后约束被反驳） |
| 4 Conditional 覆盖面 | 只实现 `forall`/`exists`；带时间修饰的 Conditional 不推导，此时该 Situation 中无法确定的判断给出 `NoMethod` 而非 `Unknown` |
| 5 多 Node 描述的便利性 | 未另加便利写法；`Interface/Commons.js` 提供 `Assert` 与 `Occurred` |
| 6 其他逻辑组合 | 只有 `And` |
| 7 规则声明接口 | 类的静态成员：`FIELDS`（`required`、`pattern`、`variance` 为 `co`/`contra`/`exact`、`context`、`kind`）、`OPEN`、`NO_METHOD`、`TIMELESS`、`POINTS`（`Judge` 需要的锚点字段，未绑定时取已知锚点）、`OBJECTS`（`Judge` 需要的对象字段，未绑定时取范围内的对象）、`CLOSES`（该命题封闭某模式的实例：`{ of, among }`，`NoInstance` 无 `among`）、`DEFINITIONAL`（`Judge` 是定义性的，8.4）、`MODIFIES`/`TIME`（时间修饰）、`CONJUNCTION`，以及 `Judge`、`Refute`、`Fails`、`Order`、`Member`、`Derive`、`Excludes` 规则函数。规则通过 api 句柄访问字段与时间推理，不接触求解器内部：`Field`、`Value`、`Is`、`Time`、`ToTime`、`EventTime`、`EventBounds`、`Member`、`Precedes`、`Coincide`、`Subset`、`Disjoint`，以及模式实例的 `Instance`、`Instances`、`Closure`、`Earlier`（`Engine/Instances.js`）。求解器不按类名分派 |
| 8 锚点 API | `start(e)`、`end(e)` 返回每个 Event 唯一的 `StartAnchor`/`EndAnchor`（字段 `of` 指向 Event），`duration(e)` 即 `Duration(start(e), end(e))`。锚点在 Event 之后、引用者之前推入 Input。内部锚点 `InnerAnchor` 可直接实例化或派生。Virtual Event 的锚点随 Event 一起是 Virtual，不得另行声明（lint）：单独声明的锚点会成为与 Event 脱钩的可变位置，canonical 写法因此不再成立 |
| 9 Duration 构造 | 冻结普通值 `Duration(...anchors)`，表示这些锚点及其间区域；`TimeIntersection`/`TimeUnion`/`TimeComplement` 同为冻结值。品牌为注册 Symbol，可跨 Context 识别 |
| 10 模糊距离 | `Distance.amount` 接受数字或 `Quantity(value, unit)`；只有可判定符号的数量参与排序（正为先后，零为重合） |
| 11 序数的其他形式 | 未实现。`Nth`、`Next`（10.5，`Vocabulary/Ordinals.js`）的规则：实例“已证明”是模式约束在头代入后可证，“已排除”是 `Exclude`（类、字段或约束被反驳）；已知实例在知识库内缓存（证明没有附加事实时）；封闭取同一模式头上所有被断言的 `CLOSES` 列表的交集；先后用锚点序三值比较。测试词表的叙事“然后”是领域类 `Then`，以自己的 `Derive` 推出 `Before` |
| 12 持续规则 | 无默认持续；类可用 `Derive` 自行声明 |
| 13 非 OK 的 result | `Unknown`、`NoMethod` 为 `undefined`；`Ambiguous` 为 `{ candidates, conflicts }`，仅供诊断，不承诺形状。`conflicts` 是知识矛盾的原因（`Engine/Conflicts.js`），指出 Input 位置：锚点序成环的锚点对；被断言、又被某类 `Judge` 判为假的事实；没有更具体的原因时，“P 与它的否定都能推出” |
| 14 lint 集合 | 见第 4 节 |
| 15 包含判定第 4 条的范围 | G 的约束可由 S 的约束体、知识库的事实与推导、锚点序推出 |
| 16 Among 选中第三档 | 报告为 `Ambiguous` |

## 4. lint 集合

均经 `RequireInput` 报告，原因写明规则、位置（类名与 Input 下标）与改法：

- 字段：封闭类的未声明字段；缺少必需字段；字段值的类别不符（Situation、列表、Event、时间点、时间、Node、Proposition、Variable）；`content` 等语境字段不是 root Situation（12）。
- Assertion：只断言 Proposition；声明（语境关联、Validity）不接受 Assertion；被断言的命题不得经普通字段提及 Virtual Node（6.4）。
- 模式：`Virtual` 只修饰语境对象，不修饰 Event 锚点；`Among` 不描述 Virtual Node，每个 Node 至多一个 `Among`；`NoInstance`/`Only`/`Nth` 的头，以及写出时 `Next` 的头，是 Virtual Node；未被 Virtual 修饰的语境对象不得经普通字段引用 Virtual Node；模式中的 Node 必须在消费者所在 Situation 或其祖先链上。
- Conditional：`forall`/`exists` 只列 Virtual Node；模式中的 Virtual Node 都已列出（Event 锚点随 Event）；每个约束落在前件或后件之下（11.2）。
- 时间：`Not` 的 `proposition` 中任意深度不含时间修饰（14.5）；每个 Event 至多一个起点与一个终点锚点，锚点与 Event 同属一个 Situation。

求解期发现的输入错误：Query 的变量没有决定它的声明；所需变量的 Query 排在后面（Foundation 的 `RequireValue`，原因写明应调整的顺序）；不属于任何语境的 Situation 中被断言、又被所属类的定义性规则（`DEFINITIONAL`）判为假的 Proposition（`Solve/Definitions.js`，每次 Query 入口先检查，与问的是什么无关）。

## 5. 其他解读

- **Duration 包含其锚点。** 草案不区分开闭区间（14.5），实现按“锚点及其间区域”取闭区间：`In(P, [a, c])` 与 `In(Not(P), [c, d])` 在 c 处冲突。边界需要区分时用更多锚点表达。
- **未修饰的被判断命题问的是 AllTime。** `Validity(P)` 而 P 只在某段时间成立，结果为 `Unknown`。`Occurs(e)` 未修饰即“任何时刻都在发生”：已知某个锚点在 e 的 Duration 之外时被反驳，否则为 `Unknown`。问“是否发生过”应使用 `In(Occurs(e), duration(e))`（13.1）。
- **AllTime 的边界（14.6）。** `AllTimeStart`、`AllTimeEnd` 是内建的全局锚点（`Vocabulary/Anchors.js`），求解器内部把对它们的所有引用规范为同一个点；`AllTime` 按 `Duration(AllTimeStart, AllTimeEnd)` 推理。时间序对每个已知锚点加入“`AllTimeStart` ≤ 锚点 ≤ `AllTimeEnd`”，并内建 `AllTimeStart` < `AllTimeEnd`；没有任何事实排序的锚点经边界比较（`Time/Order.js` 的 `Through`）。边界只在 Input 引用它们时才作为“何时”等枚举的候选，否则每个未修饰的命题都会多出两个候选。
- **`Occurs` 的先后规则。** 被认定的 `Occurs(e)` 在时间 T 上成立时，`start(e)` ≤ T 的每个锚点 ≤ `end(e)`（`Occurs.Order`，钩子的 `api.Time()` 是事实的时间）。T 为 `AllTime` 时 e 的起止与两个边界重合；把某个时刻排在其外，或使其起止重合，就形成含严格边的环，按锚点序冲突暴露为 `Ambiguous`。有限的 `Distance` 不构成冲突：`AllTime` 的长度没有规定。
- **类型提示（6.2）。** 先找类相符的候选；没有时，若描述至少写出一个字段，接受写出字段全部相符的其他类候选。
- **开放位置的反驳。** 约束体中未绑定的 Virtual Node 与自由 Variable 在反驳时固定为未知项：由此得到的反驳对它们的任何取值都成立。
- **Among 对命题的结果**是派生实例，不是 Node；它只为描述中的变量提供值。`In(P, d)` 中 d 自由时，答案是 P 已知成立的时间的并（14.10），一个值。
- **见证者**（`exists` 的派生对象）可满足存在问题，但不能作为答案给出：以它为值的变量得 `Unknown`。
- **锚点序冲突。** 两个锚点互相可达、且其间有严格边（位于含严格边的环上）时，二者之间的任何先后都可推出，知识冲突。时间比较照常把这样的一对当作满足所比较的关系，同时记录冲突。`Validity` 的任一侧在判断中比较过冲突的锚点对时，只要有一侧成立，结果就是 `Ambiguous`（8.4、14.7），暴露翻译错误；两侧都不成立时照常为 `Unknown`。`Among` 的搜索比较过冲突的锚点对时，唯一候选报告为 `Ambiguous`。不经冲突即可推出的先后（环外的锚点）不受影响。冲突只按判断记录：知识库推导（Conditional 前件）中比较过冲突锚点对得到的事实不另作标记。
- **计算上限**按 `Unknown` 处理（求解方法存在，已有计算不足以确定）。到达上限的搜索或推导不完整：已得到的事实与证明可靠，但没到达的部分是未知，不是不存在。到达上限会被记录，而不是静默丢弃：
  - 知识库的推导（共用一份步数预算）在步数、单条 Conditional 的解数（256）或轮数（6，最后一轮仍有新事实）处停止时，该知识库被标记为不完整；
  - `Validity` 的证明与反驳各有一份步数预算。只有一侧成立时，另一侧或知识库不完整则结果为 `Unknown`：未到达的部分可能使结果成为 `Ambiguous`。两侧都成立时仍为 `Ambiguous`；
  - `Among` 只有一个候选，但搜索（含命题候选数上限 64）或知识库不完整时为 `Unknown`：上限之外可能还有候选。

## 6. 已知限制

- 带时间修饰的 `NoInstance`、`Only`、`Conditional` 不推导；存在这样的认知时，无法确定的判断给出 `NoMethod`。
- 推导轮数（6）、单条 Conditional 的解数（256）、知识库推导与 `Validity` 每一侧的证明步数（各 20000）有上限；到达上限按第 5 节处理，一个 Situation 中的推导不完整会使其中只有一侧成立的判断都成为 `Unknown`。反驳嵌套深度（2）是结构上限，超过的部分视为未推出，不标记为不完整。
- `Corresponds` 询问在对应组内取 Input 中最靠前的成员；询问的一侧是 Among 描述时，优先给出描述所指对象以外的成员。
- 对应组的多个描述按“任一描述相符”匹配：需要把不同成员的字段合起来才相符的描述（一个成员给出类，另一个给出字段）推不出。
- M6（4 个故事 19 问的语料验收）尚未进行。

## 7. 验收与覆盖

`Test/Commons/` 中每个导出的 `Test*` 函数都由 `CommonsSuite` 运行。规范条款与测试的对应：

| 条款 | 测试 |
|---|---|
| 1.1 默认不同、2 已写字段 | `TestAmongSingle`、`TestAmongNoCandidate`、`TestValiditySameThing` |
| 5、8.4 Validity 真值表 | `TestValidityTable`、`TestValidityFreeVariable`、`TestOpenRefutation` |
| 6.2 Among | `TestAmongSingle`、`TestAmongAmbiguousEvenWhenAgreeing`、`TestAmongTypeHint`、`TestAmongTiers`、`TestAmongProposition`、`TestAmongVisibility`、`TestValidityThroughAmong` |
| 6.3 Corresponds、SameReferent、对应组的描述 | `TestCorrespondsQuestion`、`TestCorrespondsVisibility`、`TestCorrespondsFacets`、`TestValiditySameThing` |
| 6.4 Virtual、lint | `TestExistence`、`TestLintAssertions`、`TestLintDeclarations`、`TestLintPatterns`、`TestLintAnchors` |
| 7.3 status、传播、同一事物 | `TestResultBox`、`TestValidityPropagation`、`TestCoincidingAnchors`、`TestNoMethodRules` |
| 8.2 Not、9.1 方向 | `TestNotDerivation`、`TestNotThroughout`、`TestValidityNotDirection`、`TestUnable`、`TestHabitual` |
| 9 推导规则 | `TestDomainRule`、`TestConditionalForall` |
| 10.2 NoInstance、10.3 Only | `TestNoInstance`、`TestOnly`、`TestOnlyHeads`、`TestWindowPattern`、`TestWindowMatch` |
| 10.5 Nth、Next | `TestNthOpen`、`TestNthClosed`、`TestNthHeld`、`TestLintOrdinals` |
| 8.4 断言与规则矛盾、定义性规则、7.3 矛盾诊断 | `TestNthHeld`、`TestConflictReasons`、`TestDefinitional` |
| 11 And、Conditional | `TestConditionalForall`、`TestConditionalExists`、`TestLintConditional` |
| 12 语境 | `TestBeliefIsolation`、`TestClaimTruth`、`TestAmongIntoContext`、`TestLintContextRoot` |
| 13 Event、Agent | `TestAmongAgent`、`TestOccurs`、`TestEventWindow`、`TestJudgedAllTime`、`TestAllTimeEvent`、`TestOccursOrder` |
| 14 时间 | `TestTimeIn`、`TestTimeNesting`、`TestTimeOrder`、`TestTimeNatural`、`TestTimeComplement`、`TestTimeUnion`、`TestQueryTime`、`TestWhen`、`TestLintNotTime`、`TestLintAnchors`、`TestOrderConflict`、`TestAllTimeBounds` |
| 原则 2、6 | `TestPositionIndependence`（带种子的合法顺序打乱）、`TestCorrespondsFacets`（对应组成员的先后）、`TestUnrelatedCognition`、`TestMonotone`、`TestQueryNeedsDeclaration` |
| 7.3 计算上限 | `TestDerivationLimit` |
| 规模 | `TestScale`（30 个已发生事件、约 250 个节点、6 个问题） |
