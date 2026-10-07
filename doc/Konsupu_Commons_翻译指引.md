# Konsupu Commons 翻译指引

本文面向把自然语言（故事与问题）翻译成 Commons Input 的人或程序。它不增加语义，只把规范草案（下称“规范”）中容易写错的地方整理成写法；条款号指向规范。条目多数来自 `run/aesop-commons-phase2`（13 篇伊索寓言、65 问）的实际翻译。

翻译 Agent 读不到 `Memory/` 中的类定义。在 `js_eval` 中调用 Help 查看任一出口
的构造方式、字段、规则与写法提示：

```js
import { Help } from "./Interface/Commons.js";
export default Help("Within"); // Help() 列出全部出口
```

`js_eval` 的结果有大小上限。Help 的返回值是字符串，过长时自己分页读：
`Help("Within").slice(0, 1500)`，再 `slice(1500, 3000)`；也可以
`Help().split("\n").slice(0, 40)`。一次只查一个出口。

写法拿不准时，先问两件事：

1. **这句话认定了什么，没认定什么？** 没写的就是未知（原则 4、5）。“没有别的”“只有这些”“一直”都要显式写出。
2. **问句的描述是否蕴含要匹配的事实或模式？** 求解只在蕴含成立时给出 `true` 或 `false`，否则是 `Unknown`。

---

## 1. Input 的基本纪律

- **被引用者先入 Input。** 包装者排在被包装者之后：`In` 在它的命题之后，`Not` 在命题之后，锚点在 Event 之后、引用锚点的命题之前，被感知的内容在感知之前。顺序错误由 Foundation 报出，原因写明该把哪个 Node 提前。
- **先后不带语义（原则 2）。** 除上一条的结构要求外，换一种合法顺序不应改变任何结果。对应组的成员谁先谁后同样不影响推导（6.3）。
- **普通对象要有名字。** 类本身就是 `Entity` 或 `Event` 的对象必须写 `name`：原文的称呼，原文没给时用原文的代词（“它”“他”）。否则是 lint 错误，回答里也说不出它是什么。`Among` 描述与 Virtual 模式不写名字，那里的名字是匹配约束。
- **问句里不新建具体对象。** 问句 Situation 中直接创建的 Entity、Event、TimeAnchor 是新对象，匹配不上故事。它们只能是：故事中的 Node 本身、`Among` 描述（“那个……的”）、Virtual 模式（“有没有……”）、`Corresponds` 的一侧。否则是 lint 错误。
- **表层文本也是字段。** `name` 等字段与其他字段一样参与匹配：问句描述里写了 `name`，就只匹配同名的对象。描述只写判别所需的字段。
- **类的字段声明。** 子类自己声明 `FIELDS` 时就成为最近的声明者：不再声明 `OPEN = true` 的话，未声明的字段会被 lint 拒绝。

## 2. 事件与发生

- 已发生的事件用 canonical 写法 `In(Occurs(e), duration(e))`（13.1）；`Occurred(input, e)` 一次生成锚点与这一写法。
- 不带时间修饰的 `Occurs(e)` 表示“任何时刻都在发生”（13.1、14.7），问“发生过没有”不能这样写。
- **事件锚点不单独 `Virtual`。** Virtual Event 的锚点随 Event 一起是 Virtual；单独声明会被 lint 拒绝（6.4）。要表达“某一时刻”，新建一个 Virtual 的 `TimeAnchor` 再加 `Within`（14.4）。
- 施事用独立的 `Agent(action=e, actor=x)`（13.2），不写成事件的字段。

## 3. 状态与时间

### 3.1 问句要自带时间

不带时间修饰的命题问的是 `AllTime`：在每一个时刻都成立吗（14.7）。只在某段时间成立的状态，用不带时间的问句去问，结果是 `Unknown`。常用问形：

| 问题 | 写法 |
|---|---|
| X 之前是什么状态 | `In(P, Duration(storyStart, start(X)))` |
| 最终是什么状态 | `In(P, Duration(end(X), storyEnd))` |
| 在 a 时刻是否成立 | `At(P, a)` |
| 在 D 中某一时刻成立过吗 | Virtual 锚点 a、`Within(a, D)`、`At(P, a)` |
| 在 D 中始终成立吗 | `In(P, D)` |

`In(P, D)` 是每一点，`At` 加 `Within` 是某一点，二者不能互相替代（14.4）。

### 3.2 区间端点相接即冲突

Duration 包含它的锚点（14.5）：`In(P, [a, c])` 与 `In(Not(P), [c, d])` 在 c 处冲突，结果为 `Ambiguous`。状态在某件事之后恢复时，恢复区间从那件事的结束开始，而不是从开始：

```text
In(Unable(fox, getOut), Duration(start(fall), start(goatJump)))
In(Not(Unable(fox, getOut)), Duration(end(goatJump), storyEnd))   // not start(goatJump)
```

### 3.3 `Not` 与时间

`Not` 的命题里不能带时间修饰（lint，14.5），但 `Not` 可以被时间修饰包住：

| 意思 | 写法 |
|---|---|
| D 中始终不成立 | `In(Not(P), D)` |
| a 时刻不成立 | `At(Not(P), a)` |
| D 之外成立 | `In(P, TimeComplement(D))` |

## 4. 是非问

`Validity(proposition=P, variable=v)` 加 `Query(v)`（8.4）。Query 只计算，不报告：问句要写在 `ask = new Situation(world)` 里（Variable、Validity、Query 都属于它），再断言一个请求 `Requests(addressee=KonsupuIdentity.Ref(), content=ask)`（12.3），答案才会出现在输出里。被问的命题 P 要先进入 Input，但不断言；`Validity` 与 `Query` 是声明，同样只进入 Input，不断言。能推出 P 为 `true`，能推出 `Not(P)` 为 `false`，都推不出为 `Unknown`，都能推出为 `Ambiguous`。

- **按问句的极性翻译。** 机器答案应与问句同向，不要用补集绕：
  - “可以做 X 吗”（许可）：`Validity(Not(Forbids(deed=X)))`。存在禁令时为 `false`。
  - “B 在 A 之后吗”：`Validity(Before(earlier=A, later=B))`。“之后”是 `Before` 两边对调，问的是同一个命题，不是它的否定。
  - “能做 X 吗”（能力，在某段时间）：`Validity(In(Not(Unable(actor, X)), D))` 或 `At(Not(Unable(...)), a)`。已知那段时间内无能力时为 `false`。
- **规范不推出事实。** `Forbids`、`Mandates` 不推出“没有发生”或“发生了”：违禁正是故事常写的内容。“他有没有做 X”问发生，不问禁令。
- **断言与规则矛盾。** 被断言的 P 又被某个类的规则判为不成立（8.4）：
  - 规则是定义性的（例如“偶然的事不为任何目的”），且断言不在任何语境中：输入错误，原因指出断言的位置。通常是把某人说的话断言在了世界中，或选错了类；
  - 其他情况（先后、计数等依赖别的认知的规则，或断言在语境中）：`Ambiguous`，结果的 `conflicts` 写明矛盾的来源。
- **说的是不是真话**：在提问的 Situation 中判断内容里的命题（12.2），内容所关于的时间要写进内容（12.1）。

## 5. 找值：`Among`

- `Among(node=描述, situation=语境)` 在该语境谈论的对象（或可推出的命题）中找唯一符合描述的一个（6.2）。多个候选即 `Ambiguous`，即使它们的答案一样。描述的定指程度要和问句一致：问“谁丢了那颗石子”时把石子写进描述，不要只写“丢石子”。
- **多个约束一起限制答案时，用一个 `And` 作描述：**

  ```text
  x = Variable
  Among(node=And([Agent(action=e, actor=x), Within(start(e), D)]), situation=story)
  ```

  分开写的两条 `Among` 是对同一个变量的两个声明。它们不取交集：值不同即 `Ambiguous`（7.3）。
- **问“那个做了 X 的人怎样了”**：先用 `Among` 找出那个人，再在被问的命题里用它的 Variable；是非问的答案另用一个 Variable：

  ```text
  who = Variable
  Among(node=Agent(action=steal, actor=who), situation=world)
  v = Variable
  Validity(proposition=Agent(action=chase, actor=who), variable=v)
  Query(v)
  ```

  回答里 `who` 写成找到的那个人（8.4、6.2）。`who` 不能兼作 `v`，那是 lint 错误。
- **问“何时”问锚点**（14.10）：Query 事件的开始锚点，或 `At(P, a)` 中的 a。不要在描述里放一个只表示“某一时刻”的 Virtual 锚点：不同时刻的解会成为不同候选，结果为 `Ambiguous`。
- **命题位置不能 Virtual**（6.4）：类型化的命题字段要么直接引用那个命题，要么用 `And` 组合约束。

## 6. 否定存在与穷尽

`NoInstance(of=head)`、`Only(of=head, among=[...])` 对模式说话（10.2、10.3），模式的约束体由 Virtual 头相连的结构给出。

**问句与模式要用同一种时间窗**（13.1）。`Only` 或 `NoInstance` 排除一个问句，要求问句的描述蕴含模式的约束体，时间窗也一样：

| 说法 | 写法 | 蕴含“某一时刻” | 蕴含“开始于 D” |
|---|---|---|---|
| 开始于 D | canonical 写法加 `Within(start(x), D)` | 是 | 是 |
| 在 D 的每一点都在发生 | `In(Occurs(x), D)` | 是 | 否 |
| 在 D 的某一时刻正在发生 | Virtual 锚点 a、`Within(a, D)`、`At(Occurs(x), a)` | 是 | 否 |

- 窗口写在开始上的模式（“哭声之后她做的只有关窗”）只排除写明“开始于 D”的问句；问“D 中有没有在扔”（每一点或某一时刻）是 `Unknown`，因为扔可能在 D 之前就开始了。
- 窗口写在某一时刻上的模式排除上表三种问句，但也排除 D 之前开始、延续进 D 的事。按原文选择模式的说法，再让问句对齐。
- 状态的否定存在用某一时刻：Virtual 锚点 a、`Within(a, D)`、`At(Present(wolf), a)` 加 `NoInstance`（14.4）。
- 被判断的问句里，每个约束都要带上同样的时间限定；漏写的约束问的是 `AllTime`，匹配不上（3.1）。

## 7. 语境与对应

- 信念、话语、计划的内容是 root Situation（12）。在语境中判断时（“狐狸是否认为……”“狐狸是否说过……”），问句写在 `ask = new Situation(语境)` 里，请求照旧由世界断言（12.3）；找值也可以用 `Among(node=..., situation=语境)`。
- **只存在于语境中的对象与事件建在语境里。** 牧羊人想象的狼、他相信发生了的“狼来”，都在信念的 Situation 中创建，Agent 由该语境断言；`Occurred(input, e)` 在 e 所在的 Situation 中断言，所以它们只在语境中成立。建在世界里，它们就在世界中发生了。问“他是否认为某事发生了”时，在 `new Situation(信念)` 中用 Virtual 模式问存在，不要新建一个具体的事件。在信念中问的是信念的内容，不要再问 `Believes` 本身：“在狐狸的信念中，狐狸是否相信这个信念”无法判断，是 lint 错误；要问“狐狸是否有这个信念”，在世界中问。
- **对应**：`Corresponds(left, right)` 说两个语境对象是同一个实际对象（6.3）。在某个 Situation 中，这个对象是什么由该 Situation 及其祖先上的成员给出；别的语境里的成员只提供身份。狐狸话里的“跳下”与故事中的“偶然掉落”对应时，在故事中它是偶然掉落。
- 对应只在声明它的 Situation 及其后代中可见（6.3）：在世界中声明的对应，在信念语境中判断时不存在。语境内需要它时，按内容匹配（Virtual 模式），或在语境中另行声明。
- **问“其实是什么”**：`Corresponds(left=x, right=已知一侧)` 加 `Query(x)`，答案是对应组中的另一侧（6.3）。

## 8. 序数

`Nth(of=head, n=k, item=e)` 与 `Next(earlier=a, later=b, of=head)`（10.5），按实例的开始锚点排序。

- **原文说出的序数**（“他第三次喊”）：直接断言 `Nth`。它与已知的先后冲突时为 `Ambiguous`。
- **需要推出的序数**（原文没标，问“第二次”）：要有封闭，即在同一个模式头上断言 `Only(of=head, among=[...])`，列出全部实例。没有封闭时，序数推不出（`Unknown`），但已知有 k 个更早的实例时，“它是第 k 个”可以被否定。
- 模式头要复用同一个 Virtual Node：序数比较的是“恰好这个模式”，较窄或较宽的模式都不算（9.1“精确”）。
- 叙事中的“然后”若只表示先后，用领域类表达并自行推出 `Before`；`Next` 的意思是“其间没有别的同类实例”，有这个意思时才用它。

## 9. 读结果

| 结果 | 常见原因 |
|---|---|
| `Unknown` | 问句没带时间而事实是区间化的（3.1）；问句的时间窗推不出模式的时间窗（6）；缺少封闭（8）；对应在当前语境不可见（7）；计算达到上限 |
| `Ambiguous` | `Among` 有多个候选（5）；区间端点相接（3.2）；断言与规则矛盾（4）；时间先后成环（14.7）；被断言的序数与已知先后冲突（8）。知识自相矛盾时，结果的 `conflicts` 列出来源与 Input 位置 |
| `NoMethod` | 到达未实现的桩类，或带时间修饰的 `NoInstance`、`Only`、`Conditional` 使判断无法确定 |
| 输入错误（lint 与求解期） | 原因写明规则号、位置与改法，照改即可。求解期的包括：Query 的变量没有声明决定它；世界中的断言违反所属类的定义（4） |
