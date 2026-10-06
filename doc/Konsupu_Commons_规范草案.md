# Konsupu Commons 核心语义规范（草案）

本文定义 Konsupu Commons 的核心语义：语境对象、字段、Situation、命题与认定、语境关联、求值与结果、推导、量化、态度内容、事件与时间。本版未定义的事项列在第 16 节，正文相应位置写明“本版未定义”并指向该节。附录 A 给出与上一版 Commons 的对应，不属于规范。

整个设计可以概括为：

> **Situation 决定在哪个认知语境中谈论；普通 Node 表示该语境中“有一个……”的语境对象；类型与已写字段决定它被怎样描述；语境关联 Node 显式改变默认实例化或说明对应；Assertion 决定某个 Proposition 是否被认定成立；Virtual 提供非实例化描述；Query 只请求 Variable 的值；时间通过 Proposition 自身的结构，对其自然的 `AllTime` 时间范围逐步施加约束。结构位置不赋予任何隐藏语义。**
>
> **没有明确认知，就保持未知。不从没有写、没有断言、没有结束、没有匹配到或没有时间信息，推出其反面。**

---

## 0. 范围与原则

Commons 定义认知中的语义对象、命题、语境关联，以及由这些认知进行的推导。

Foundation 负责 Node、Situation、Variable、Query、`ref`、resolution 等结构与求值基础。Commons 不另建 scope、binding scope 或 query scope。Foundation 中 Variable 的 resolution 相对于 Situation；Query 的位置不赋予其他认知额外语义。

Commons 遵守以下原则：

1. **显式语义。** 一个结构的意义只由它的类型、字段以及显式修饰它的认知决定。
2. **位置没有隐藏语义。** Node 在 Input 中的位置、被谁引用、所在 Situation 被怎样引用、是否参与 Query，都不改变 Node 的语义角色。
3. **语境对象与现实对象分离。** Node 是认知中用来谈论东西的语境对象，不是现实中的那个东西。
4. **字段没写就是没有约束。**
5. **缺失认知不产生反面认知。** 未明确断言的信息保持未知，不被解释为 false、null、0、无穷、不发生、不结束等。
6. **Query 只请求求值。** Query 不建立语境，不改变任何 Node 或 Proposition 的语义。
7. **求解结果与值分离。** 求解状态不作为结果值出现（7.3）。
8. **具体推导属于具体认知。** 推导方向由认知自己的规则声明，不由字段位置、全局方向表或全局反驳规则隐式给出。
9. **被讨论的关系提升为独立 Node。** 一个关系足够复杂、需要通过 Node 之间的关系来讨论，并且确实被谈及时，从字段提升为独立的 Node（通常是 Proposition）。施事即按此由 `Agent` 表达（13.2）。

---

## 1. 普通 Node

### 1.1 身份

每个普通 Node 都是一个**语境对象**：在某个 Situation 中用来谈论某个对象、事件、状态、命题或其他内容的语义对象。

普通 Node 的身份就是 JavaScript object identity，与 Foundation 相同：

- 两个不同的 JS object，即使 class 与全部字段相同，也是两个语境对象；
- 同一个 Node object 被多处引用时，始终是同一个语境对象；
- 多个语境对象可以对应同一个现实对象；
- 一个语境对象也可能不对应任何现实对象。

没有其他规则覆盖时（`Among`、`Corresponds`，第 6 节），不同的语境对象指向不同的现实事物。`Only` 的排除、`NoInstance` 的否定与计数都依赖这一默认。

### 1.2 默认语义

普通 Node 的默认语义是：

> **该语境中有一个由该 Node 的类型及其已写字段所描述的对象。**

```js
const wolf = new Wolf(story)
wolf.color = black
```

表示 story 中有一个被描述为黑色狼的语境对象。

默认语义不蕴含：

- Event 已经发生；
- Proposition 已经成立；
- 它能对应到现实中的对象；
- 两个描述相同的 Node 是同一个对象；
- 它与另一个 Situation 中的某个 Node 同指。

这些意义由其他显式认知表达。

### 1.3 位置不改变语义

除非被语境关联 Node 显式修饰（第 6 节），普通 Node 的语义不因以下事实改变：

- Input 中的位置或创建顺序；
- 被哪个字段、被什么 Node 引用；
- 所在 Situation 被怎样引用；
- 是否含有 Variable、是否被 Query、所在 Situation 是否含有 Query。

这些事实不赋予 Node 任何结构角色。描述、模式等角色只由语境关联 Node 给出。

---

## 2. 字段

Node 的类型与**已写出的字段**共同构成它的描述。字段没有写，就没有这个约束。

```text
Wolf()               // no colour constraint
Wolf(color=black)    // adds color = black
```

`Wolf(color=black)` 满足 `Wolf()`；反之，仅凭已有信息不能满足明确的黑色约束。

字段不存在，与字段的值是一个 Variable 不同：前者没有约束，后者有一个尚未确定的值。不得用特殊的 `Unknown` 字段值表示“字段没有写”。

字段本身没有方向。某类认知具有特殊的蕴含方向时，由该认知自己的推导规则定义（9.1）。

---

## 3. 类型与继承

普通 Node 的语义类型由其 JavaScript class 确定。语义类继承表示稳定的下位概念关系：子类实例同时是其所有父类所表示概念的实例。

类型不决定 Node identity、实际所指的 identity、Situation 之间的对应，也不决定任何求解角色。

---

## 4. Situation

`Situation` 表示一个认知语境。属于某 Situation 的普通 Node，是该语境中用来谈论的语境对象。

Situation 不因结构位置获得任何类别。“故事”“问题”等只是惯用名称，不是 Commons 的概念。一个 Situation 表示信念、言语内容、计划、想象等，由普通认知显式引用它来表达：

```js
Believes(believer=fox, content=beliefSituation)
```

`beliefSituation` 的意义来自 `Believes.content`。

Commons 沿用 Foundation 的 Situation 结构与信息流规则，不附加其他含义。被 `content` 等字段引用为语境的 Situation 必须是 root（12）。

---

## 5. Proposition 与 Assertion

### 5.1 Proposition

`Proposition` 是可以被认定成立或不成立的普通 Node。创建 Proposition 不意味着它成立。

### 5.2 Assertion

`Assertion` 表示某个 Situation 认定某个 Proposition 成立。

一个 Proposition 在某 Situation 中成立，只来自：

- 显式 Assertion；
- 从已成立的认知经明确的推导规则得到（第 9 节）。

Assertion 只有这一种含义，不因 Proposition 含有 Variable、被 Query、位于哪个 Situation 或参与求解而改变。Assertion 从不充当问题的条件。

---

## 6. 语境关联 Node

### 6.1 总则

语境关联 Node 显式修改普通 Node 的默认语境解释，或描述语境对象之间的对应。

- 所有语境关联 Node 继承统一的抽象基类；
- 它们不是普通语境对象，不表示现实实体，不参与普通 Node identity；
- 它们是声明：出现即生效，不需要也不接受 Assertion；
- 它们不因自己的位置获得其他语义。

### 6.2 `Among`

```js
Among(situated=..., node=..., situation=...)
```

表示 `node` 所谈论的对象，对应于 `situation` 所谈论对象中的某一个。

**默认解释的修改。** 被 `Among` 修饰的 `node` 不再表示“该语境中又有一个这样的对象”，它的“有一个”就是被选中的候选，不新增对象。问题中的描述因此不会虚构存在物。`node` 与被选中的 Node 仍是两个语境对象；`Among` 只约束它们对应的实际对象，不合并 Node identity。

**node 与候选。** `node` 可以是任何普通 Node，包括 Event 与 Proposition：

- `node` 不是 Proposition 时，候选是 `situation` 所谈论的对象；
- `node` 是 Proposition 时，候选是在 `situation` 中成立（可以推出，8.1）的 Proposition，包括由推导规则得到的。派生的 Proposition 不是 Node，绑定后只为 `node` 字段中的 Variable 等提供值。

例如“乌鸦把喙伸进罐子之后发生了什么”：

```text
x = Variable
n = Next(earlier=putBeak, later=x)
Among(node=n, situation=story)
Query(x)
```

**匹配。** `Among` 按 `node` 已写出的约束寻找候选。`node` 的类型只是对应解析的提示，不是硬约束：不同语境可以用不同类型理解同一个实际对象（信念语境中的 `Dog`，在叙述中是 `Reflection`）。

**规则。**

- `situation` 可以与 `situated` 相同；
- `Among` 不选中 `node` 自身；
- `Among` 可以选中受语境关联修饰的 Node。候选按以下优先级分档，只有较高一档没有候选时才考虑较低一档，不同档的候选不构成多值：
  1. 普通 Node；
  2. Virtual Node；
  3. 被 `NoInstance` 声明不存在的 Virtual Node（`NoInstance` 模式中的 Node，6.4）。选中这一档时与 `NoInstance` 构成差异或冲突，结果本版未定义（16 第 16 项）。

**绑定的状态。** `Among` 的绑定按 Query 结果的 status 处理（7.3）：

- 恰好一个候选：`OK`，依赖它的判断只与该候选有关；
- 多个候选：`Ambiguous`，按 7.3 传播到依赖它的结论，不再查看各候选各自的结论；即使各候选的结论相同，结果仍是 `Ambiguous`。已知指向同一现实事物的候选只算一个（7.3）；
- 无候选：由实现决定，可以是 `Unknown`，也可以抛出异常。

`Among` 表达定指（“那只狼”）；存在（“有狼吗”）由 Virtual 模式表达（8.4、10.1）。同一个 `Among` 不因所在 Situation 是否含 Query 而有不同含义。候选的搜索策略见 16 第 1 项。

`Among` 确定的对应只在它所在的 Situation 及其后代中可见（6.3）。

### 6.3 `Corresponds`

```js
Corresponds(situated=..., left=..., right=...)
```

表示 `situated` 所在的 Situation 认定 `left` 与 `right` 对应同一个实际对象。与 `Among` 不同，两侧都已明确，无需解析。它不合并两个 Node 的 identity。

**询问对应。** `Corresponds` 的一侧是 Variable 时，求解即找出与另一侧对应的值，与 `Among` 的描述字段中含 Variable 相同。例如“狗以为它的影子是什么”：

```text
story
|- Corresponds(left=otherDog, right=shadow)   // the narrator's correspondence
|- x = Variable
|- Corresponds(left=x, right=shadow)
|- Query(x)                                   // x = otherDog, the belief's object
```

**可见范围。** 对应（`Corresponds` 与 `Among` 确定的对应）只在它所在的 Situation 及其后代中可见；在其他 Situation 中判断时，这一对应不存在。这与 Foundation 的提及反查一致：反查只返回视角祖先链上的提及者。

**对应组的描述。** 经 `Corresponds` 对应的语境对象组成一组，谈论同一个实际对象。在 Situation S 中判断时，这个对象是什么（它的 class 与字段），由组中位于 S 及其祖先上的成员共同给出：每个这样的成员的描述都对它成立。其他语境（信念、话语等）中的成员只提供身份，它的描述属于它自己的语境：狐狸以为的“跳下”与故事中的“偶然掉落”对应时，在故事中这件事是偶然掉落，不是跳下。组中没有成员位于 S 及其祖先上时，全部成员的描述都对它成立。这些都与成员在 Input 中的先后无关（原则 2）。

**`SameReferent`。** `SameReferent(left, right)` 是普通 Proposition：某个认知主体认定 `left` 与 `right` 同指。它可以被相信、被否定、被询问。`Corresponds` 是 Situation 实际采用的对应，`SameReferent` 是关于对应的认知，两者不得互相替代。

语境对象之间的“不同”由默认规则给出（1.1、6.4），Commons 不提供 `Distinct`。

### 6.4 `Virtual`

```js
Virtual(situated=..., node=...)
```

`Virtual` 取消普通 Node 的默认实例化语义。被修饰的 Node 保留原 class、原字段与原 identity，表示**这种描述本身**，而不是语境中已有的一个实例：

```js
steal = Steal(theme=sheep)
Virtual(node=steal)        // the act of stealing sheep, not one occurrence of it
```

#### 作用范围

`Virtual` 只作用于它直接修饰的 Node。该 Node 的字段：

- 指向具体 Node 时，那个 Node 仍是具体的，是模式中的**常量**；
- 指向另一个 Virtual Node 时，那是模式中的另一个**可变位置**。

上例中，`sheep` 是具体 Node 时表示“偷这只羊”这种行为；`sheep` 也被 `Virtual` 修饰时表示“偷羊”这种行为。

不同的 Virtual Node 默认指向不同的事物：模式中两个 Virtual 的羊是两只不同的羊。Virtual Node 与模式中的具体 Node 之间不作此默认，两者可以指向同一事物。

#### 模式

含有 Virtual Node 的相关结构称为**模式**，由两部分组成：

- **头**：消费它的认知在字段中直接引用的那个 Virtual Node，是被量化、计数或枚举的位置；
- **约束体**：从头出发求出的连通分量。

连通分量沿字段向下、并经 Foundation 的提及反查（`Perspective.Bindings`）向上求出：

- **纳入**：Virtual Node；经普通字段提及分量内 Node 的 Proposition（例如 `Agent`、`Within`）；
- **作为常量留下，不再展开**：具体 Node；
- **不纳入**：经接受模式的字段提及分量的 Node，即**消费者**（例如 `Unable.deed`、`Only.of`、`NoInstance.of`）；语境关联 Node 与声明（`Virtual`、`Among`、`Validity`）。

由此：

- 共用一个 Virtual Node 就是同一个模式；不同的模式各自建立 Virtual Node；
- 同一个模式可以被多个消费者引用，各自以不同的 Virtual Node 为头；
- 约束体与头都相同才是同一个模式；约束体相同而头不同，含义不同（10.3）。

#### 接受模式的字段

字段是否接受模式，由类的字段声明给出，不由位置或是否被 Assertion 推断。

接受模式的字段引用 Virtual Node 时，该 Node 是模式的头，引用者是消费者。接受模式的字段包括：

- 行为类型：`Unable.deed`、`Forbids.deed`、`Habitual.deed`；
- 量化：`Only.of`、`NoInstance.of`；
- 序数：`Nth.of`、`Next.of`（10.5）；
- 意图中的行为：`Promises.deed`、`Goal.objective`、`InOrderTo.goal`；
- `Seek` 一类内涵动词的对象字段。

接受模式的字段也可以引用普通 Node，它是没有可变位置的模式（9.1）。在意图中的行为位置上，普通 Event 表示“特定的那件事”，Virtual 模式表示“这类事”；兑现或达成，是存在已发生的实例 ⊑ 该模式（9.1）。

普通字段引用 Virtual Node 时：

- 引用者是 Proposition：它属于该模式的约束体；
- 引用者是其他普通 Node（Event、Entity 等）：它自身必须被 `Virtual` 修饰。`Virtual` 不因引用关系隐式取消引用者的默认实例化。

#### lint

以下情况为 lint 错误：

- 被 Assertion 的 Proposition 经普通字段提及 Virtual Node（它是模式的约束，不是事实）；
- 未被 `Virtual` 修饰的非 Proposition Node 经普通字段引用 Virtual Node；
- 模式中的 Node 不在消费者所在 Situation 或其祖先链上（提及反查只返回视角祖先链上的提及者）。
- `Virtual` 修饰 Event 的锚点：Virtual Event 的锚点随 Event 一起是 Virtual（11.2），单独声明会使锚点成为与 Event 脱钩的另一个可变位置；“某一时刻”用 Virtual 的 `TimeAnchor` 加 `Within`（14.4）。

#### 量化由消费者决定

`Virtual` 本身不表示全部、任意一个、某一个、集合、类型、通常或可能存在。它只取消默认实例化；如何量化由消费它的认知决定，例如 `Unable(actor, deed)`、`Forbids(deed)`、`Habitual(actor, deed)`、`Nth(pattern, n)` 各自定义量化语义。

---

## 7. Variable、Query 与结果

### 7.1 Variable

`Variable` 表示一个尚未确定的 JavaScript 值。Variable 与普通 Node、Proposition、时间锚点等出现在同一个 Situation 中，不建立独立的 binding scope。

### 7.2 Query

```js
Query(variable)
```

请求 Resolve 求得该 Variable 的值。Query 不建立 Situation 或 scope，不改变任何 Node 的语义，不使 Node 成为描述，也不使 Assertion 成为条件。

```text
story
|- a = Wolf(color=black)
|- b = Variable
|- c = Wolf(color=b)
|- Among(node=c, situation=story)
|- Query(b)
```

所有认知直接属于同一个 Situation。

### 7.3 Query 结果

Query 的结果由两个独立字段组成：

```js
{
    result: /* JS value */,
    status: /* OK | Ambiguous | Unknown | NoMethod */
}
```

| status | 含义 |
|---|---|
| `OK` | 已求得结果 |
| `Ambiguous` | 存在多个不可能同时成立的候选结果，当前认知不足以确定其中之一 |
| `Unknown` | 求解方法已实现，但已有信息不足以确定结果 |
| `NoMethod` | 没有已知的求解方法：类或规则被声明为待实现的桩，求解到达桩 |

status 不是结果值，不作为 `result` 出现。非 `OK` 时 `result` 的数据结构本版未定义（16 第 13 项）。因知识自相矛盾而得到 `Ambiguous` 时（8.4、14.7），实现宜附带矛盾的来源，指出涉及的 Input 位置，供翻译排查；它只是诊断，不是结果值。

**多值即歧义。** 一个 Variable 只有一个值，它的多个候选值总是不可能同时成立，所以多值就是 `Ambiguous`，不另区分“多值答案”与“歧义”。`Validity` 同时推出 `true` 与 `false` 时同样是 `Ambiguous`（8.4）。

**同一事物不是多个候选。** 已知指向同一现实事物的多个语境对象只算一个候选，不得因此得到 `Ambiguous`。这包括：

- 在当前可见范围内经 `Corresponds` 或 `Among` 确定为对应的 Node（6.3）；
- 实际相同、没有时间差的时间锚点。

此时结果为 `OK`，实现宜返回其中位于判断所在 Situation 及其祖先上、在 Input 中最靠前的那个；没有这样的成员时，返回全部成员中最靠前的。返回哪一个只是答案的选择，不影响推导（6.3）。

**传播。** 依赖非 `OK` Variable 的结论自动成为非 `OK`。依赖多个非 `OK` 来源时，取优先级最高者：

```text
Ambiguous > Unknown > NoMethod
```

非 `OK` 从不经 `RequireValue` 报告为输入错误。

**存储与拆箱。** `{result, status}` 作为带 Brand 的冻结对象存入 Foundation 的 Variable value，Foundation 不变。Commons 只通过一个统一的读取函数读取 Variable：

- `OK`：拆箱得到 `result`；`result` 是 ref 时继续沿值链读取（包装会截断 Foundation 自身的值链跟随）；
- 非 `OK`：按上述传播处理；
- 输出投影读取原始包装，使 status 可以被说出。

Foundation 的值检查只看顶层，所以 Commons 在装箱前自行对 `result` 做同样的检查。

---

## 8. 成立、否定与推导

### 8.1 成立

核心判断只有一个：某 Proposition 能否在某 Situation 中由现有认知推出。来源是显式 Assertion 与明确的推导规则（第 9 节）；推出不区分来源类别。

### 8.2 `Not`

```js
Not(proposition=P)
```

表示 P 不成立。P 被反驳，就是当前 Situation 能推出 `Not(P)`；Commons 不另设反驳机制。

`Not` 不作用于时间：`Not` 的 `proposition` 中任意深度都不得出现 `At` 或 `In`（14.5）。

### 8.3 开放世界

不能推出 P，不意味着能推出 `Not(P)`。同样：

- 事件的结束没有被说明，不意味着永不结束；
- 字段没写，不意味着字段为 null；
- 事件没被断言发生，不意味着它没有发生；
- 状态没有被继续断言，不意味着它已不成立。

否定的结论必须有明确认知或推导规则支持。

### 8.4 `Validity`

```js
Validity(situated=..., proposition=P, variable=v)
```

声明 `v` 是 P 在 `situated` 中的成立性。`Validity` 与 `Among` 一样是声明，不需要 Assertion 即生效。它不使 P 成立，也不使 P 成为条件：P 只是被谈论的 Proposition。

求解 `Query(v)` 时：

| 现有认知 | status | result |
|---|---|---|
| 能推出 P，不能推出 `Not(P)` | `OK` | `true` |
| 能推出 `Not(P)`，不能推出 P | `OK` | `false` |
| 两者都不能推出 | `Unknown` | — |
| 两者都能推出 | `Ambiguous` | 候选为 `true` 与 `false` |
| 不知道怎样判断 P | `NoMethod` | — |

“能推出”包括显式 Assertion 与推导规则，两者没有优先级：被断言的 P 又被某个推导规则判为不成立时，两者都能推出，结果为 `Ambiguous`，暴露知识中的矛盾（定义性规则除外，见下）。“能推出”也不限于 `situated` 所谈论的 Node。`Among` 作用于 Proposition 时同样以“可以推出”为候选（6.2）；区别在于 `Among` 为 `node` 中的 Variable 提供值，`Validity` 给出成立性。

**定义性规则。** 类可以声明它的判定规则是定义性的：规则只由该 Proposition 自己的字段（字段值的 class 与值）决定，是这个 class 含义的一部分，例如“偶然发生的事不为任何目的”。不属于任何语境的 Situation（它的 root 不被 `content` 等字段引用为语境，12）中被断言、又被定义性规则判为不成立的 Proposition 是输入错误，不论问的是什么，由 Input Translation 修复：通常是把某人说的、相信的内容断言在了世界中，或选错了 class。语境中的内容可以不自洽（说谎、糊涂的信念），在语境中判断时仍按上表得到 `Ambiguous`。依赖其他认知的规则（先后、计数等）不是定义性的，与断言矛盾时得到 `Ambiguous`。

P 中可以含有没有被 Query 的 Variable。求解器可以在内部为它们取得值以完成推导，但不写入；只有被 Query 的 Variable 得到结果。

例如“那只狼在场吗”：

```text
s
|- w = Wolf()
|- Among(node=w, situation=s)
|- p = Present(subject=w)
|- v = Variable
|- Validity(proposition=p, variable=v)
|- Query(v)
```

`Among` 有多个候选时，结果为 `Ambiguous`（6.2）。

**模式与存在。** P 的约束体含有 Virtual Node 时（6.4），`Validity` 判断是否存在满足该模式的实例：

- 能推出某个 S，且 S ⊑ P：`true`；
- 能推出 `NoInstance(of=H)`，且 P ⊑ H：`false`。

`Validity` 没有头，这里的 ⊑ 不使用 9.1 的第 1 条。写法见 10.1。

---

## 9. 推导规则

具体认知声明稳定的语义推导，例如：

```text
Next(earlier=a, later=b)   → Before(start(a), start(b))
Unable(actor, generalDeed) → Unable(actor, moreSpecificDeed)
```

推导只来自相应认知明确定义的蕴含。求解器不按字段位置、全局方向表或类名硬编码推导方向。新增词汇只增加类、字段与该类自己的推导规则，不修改求解器。规则的声明接口本版未定义（16 第 7 项）。

### 9.1 包含判定

`Unable`、`Not`、`NoInstance`、`Only`、`Forbids`、`Conditional` 等规则，以及第 2 节“已写字段”的满足，都依赖同一个判断：一个描述是否比另一个更具体，记作 S ⊑ G。它由 Commons 的包含判定子系统统一提供，作为各推导规则共用的基础设施；各规则只说明哪一侧是 S、哪一侧是 G，不各自实现包含判定。

包含判定的结果是三值的：是、否、未知。时间先后可能推不出，对应是尽力而为的。

**定义。** 模式的头与约束体见 6.4。不含 Virtual Node 的 Node 或 Proposition 也是一个模式，没有可变位置。S ⊑ G，当且仅当存在映射 h，把 G 的 Virtual Node 映射到 S 的 Node（Virtual 或具体），把 G 中的具体 Node 映射到它自身或它的对应者，使得：

1. h(G 的头) = S 的头；
2. 每个 h(g) 是 g 的 class 或其子类的实例；
3. g 写出的每个字段都与 h(g) 的对应字段匹配；S 可以写出更多字段；
4. G 约束体中的每个 Proposition 经 h 替换后，是 S 约束体中的一个 Proposition，或可以由 S 的约束体推出（推导范围见 16 第 15 项）；
5. h 在 Virtual Node 之间是单射：G 的不同 Virtual Node 映射到 S 的不同 Node（6.4）；Virtual Node 可以映射到 G 中出现的具体 Node 或其对应者。

**方向。** 同一个 ⊑ 在不同位置上方向不同：

| 位置 | 已持有 | 被判断 | 要求 |
|---|---|---|---|
| 肯定：第 2 节的字段满足；`Habitual.deed`、`Promises.deed`、`Goal.objective`、`InOrderTo.goal` | S | G | S ⊑ G |
| 否定：`Not`、`NoInstance`、`Unable.deed`、`Forbids.deed`、`Only.of`、`Conditional` 前件 | G | S | S ⊑ G |
| 精确：`Nth.of`、`Next.of`（10.5） | S | G | S ⊑ G 且 G ⊑ S |

关系的字段在比较时各有方向，由该关系自己的规则声明。例如 `In(P, D)` 要求每一点成立，D 越大越具体：`In(P, D大) ⊑ In(P, D小)`；`Within(a, D)` 相反：`Within(a, D小) ⊑ Within(a, D大)`。

---

## 10. 非实例化描述与量化

### 10.1 存在

普通 Node 已经表示“有一个这样的语境对象”，Commons 不另设正向的存在形式。

询问存在时使用 Virtual 模式与 `Validity`（8.4）。例如“有狼在场吗”：

```text
w = Wolf()
Virtual(w)
p = Present(subject=w)          // pattern constraint, not asserted
v = Variable
Validity(proposition=p, variable=v)
Query(v)
```

“那只狼在场吗”则用 `Among` 指称（6.2）。

### 10.2 `NoInstance`

```js
NoInstance(of=head)
```

是普通 Proposition，表示当前 Situation 中不存在符合该模式的实例。`of` 是模式的头，约束体按 6.4 求出。

```text
wolf = Wolf()
Virtual(wolf)
NoInstance(of=wolf)            // there is no wolf
```

“没有在场的狼”：

```text
wolf = Wolf()
Virtual(wolf)
Present(subject=wolf)          // constraint, not asserted
NoInstance(of=wolf)
```

它同样否定关于个体的问题：“那只狼在场吗”的 `Present(subject=thatWolf)` 是一个没有可变位置的模式，它 ⊑ 上述模式（9.1）。

### 10.3 `Only`

```js
Only(of=head, among=[...])
```

是普通 Proposition，表示当前 Situation 中符合该模式的每一个实例，都是 `among` 所列对象之一。排除的后果由 `Only` 自己的推导规则得到。

`of` 是模式的头，约束体按 6.4 求出。头决定被枚举的是哪个位置：

```text
e = Action()
x = Person()
Virtual(e)
Virtual(x)
Agent(action=e, actor=x)
Within(start(e), afterCry)                 // e happened after the child cried
Only(of=e, among=[shutWindow, callHelp])   // all that was done: shut window, call for help
Only(of=x, among=[nurse])                  // all who did something: the nurse
```

两者约束体相同，头不同，含义不同。

### 10.4 其他量化

本版不提供 `All`。“所有 X 都 Y”用 `Conditional` 的显式全称表达（11.2）；“通常 X”由 `Habitual` 等普通认知表达；“不能做 X”由 `Unable` 表达；“禁止 X”由 `Forbids` 表达。`Virtual` 本身不承担量词。

### 10.5 序数：`Nth` 与 `Next`

```js
Nth(of=head, n=k, item=e, by=...)          // e is the k-th instance of the pattern (k from 1)
Next(earlier=a, later=b, of=head, by=...)  // b is the first instance of the pattern after a
```

二者都是普通 Proposition，按每个实例的一个锚点排序：默认是开始锚点，`by` 为 `"end"` 时是结束锚点；锚点重合的实例不分先后。`of` 是模式的头（6.4）；`Next` 不写 `of` 时，模式是任意 Event。`item`、`later` 为 Variable 时，可以用 `Among` 询问“第 k 个”“下一个”。

**开放世界。** 缺失认知不产生序数（原则 5）：不知道还有别的实例，不等于没有别的实例。因此：

- 已知至少 k 个实例早于 e 时，`Nth(of, k, e)` 不成立；已知某个实例落在 a 与 b 之间时，`Next(a, b)` 不成立。这不需要任何封闭；
- 成立需要封闭：同一个模式头上被断言的 `Only(of=head, among=[...])` 说明实例都在所列之中，`NoInstance(of=head)` 说明没有实例。封闭之下，e 已知是实例，所列之中可能是实例且可能早于 e 的恰好 k−1 个，并且它们都已知是实例、已知早于 e 时，`Nth` 成立；所列之中没有一个可能是实例且可能落在 a 与 b 之间时，`Next` 成立；
- 其余情况为未知。

例如“男孩第二次喊狼来了是哪一次”，故事说男孩一共喊了三次：

```text
c = Cry()
Virtual(c)
Agent(action=c, actor=boy)
Only(of=c, among=[cry1, cry2, cry3])      // the boy cried three times in all
x = Variable
Among(node=Nth(of=c, n=2, item=x), situation=story)
Query(x)                                  // x = cry2
```

**原文说出的序数。** 原文直接说“第三次”时，翻译断言 `Nth`，不需要封闭。被断言的序数与已知的先后冲突时（例如已知有三个更早的实例），结果为 `Ambiguous`（8.4）。

**比较方向。** `of` 两侧必须是同一个模式：较窄模式中的第 k 个不是较宽模式中的第 k 个，反之亦然（9.1“精确”）。被断言的 `Next(a, b)` 给出 a 的锚点早于 b 的对应锚点（第 9 节）。

---

## 11. 逻辑组合与 `Conditional`

### 11.1 `And`

```js
And(propositions=[p1, p2, ...])
```

表示这些命题的合取。单个 Proposition 不需要包装。模式的约束体由连通分量给出（6.4），不需要 `And`；`And` 主要用于 `Conditional` 的前件与后件。

本版不提供 `Or`、`Xor`、`Iff` 等。

### 11.2 `Conditional`

```js
Conditional({
    forall: [...],
    exists: [...],
    antecedent: P,
    consequence: Q
})
```

`forall` 与 `exists` 列出被量化的 Virtual Node。同一个 Virtual Node 在前件与后件中被引用时，按 identity 是同一个模板对象：

```text
forall: [wolf]
antecedent:  P(wolf)
consequence: Q(wolf)        // for every wolf matching the description, if P then Q
```

```text
forall: [request]
exists: [helper, help]      // for every request there are a helper and a help
```

量词由显式字段给出，不由 Node 出现在前件还是后件推断。

- 前件与后件共用 `forall`、`exists` 中的 Virtual Node，属于同一个连通分量（6.4）。`Conditional` 是唯一需要切分模式的消费者：按 `antecedent` 与 `consequence` 各自向下取得前件与后件的约束。分量中的每个约束必须落在其中一侧，否则为 lint 错误。
- 分量中的每个 Virtual Node 都必须列在 `forall` 或 `exists` 中，否则为 lint 错误。Event 的 Start / End 锚点随 Event 一起被量化，不另列。
- `Conditional` 的推导不修改 Declaration 图，也不向 Situation 写入新的 Assertion；求解器只据此推出可成立的认知。

---

## 12. 态度、内容与语境

`Believes`、`Says`、`Plans`、`Fears` 等是普通认知，其 `content` 引用一个 Situation：

```js
Believes(believer=fox, content=belief)
```

`belief` 自己的 Assertion 表示狐狸所相信的内容。`belief ⊨ P` 不推出 `story ⊨ P`：Situation 本身提供语境隔离，Commons 不设特殊的模态求值方式。

**语境必须是 root。** Foundation 中子 Situation 是父 Situation 的细化，直接使用祖先的认知；作为叙述者子 Situation 的信念会继承叙述者的全部认知。因此被 `content` 等字段引用为语境的 Situation 必须是 root，否则为 lint 错误。语境可以直接引用其他 root 中的常量 Node，包括时间锚点。

计划中的 Event、言语中的 Proposition、信念中的 `Not` 等，都只属于相应 Situation，除非有其他显式认知把它们连接到外部 Situation。

本版不提供“P 在 C 的认知中成立”这一元认知 Proposition；在某语境中判断时，使用该语境中的 `Validity` 或指向该语境的 `Among`。

### 12.1 内容的时间

语境中的 Proposition 同样遵守 14.7：不带时间修饰即在 `AllTime` 的每一点成立。言语、信念等内容所关于的时间必须显式写出。例如牧童第三次喊“狼来了”时，言语内容写成：

```text
claim
|- At(Present(subject=wolf), Start(cry3))   // Start(cry3) is the story's anchor
```

### 12.2 内容是否成立

“他说的是真话吗”是在提问的 Situation 中判断内容的命题是否成立。内容中的命题确定时直接引用它：

```text
story
|- v = Variable
|- Validity(proposition=<claim 中的 At(...)>, variable=v)
|- Query(v)
```

内容中的命题需要按描述找出时，用 `Among(node=模式, situation=claim)`（6.2）。

---

## 13. Event 与发生

Event 是普通 Node。`e = new Throw(...)` 只表示当前语境谈论一个 Throw 事件对象，不表示它发生。发生由普通 Proposition 显式表达：

```js
Occurs(event=e)
```

计划、目标、想象、威胁等 Situation 都可以谈论在外部 Situation 中没有发生的 Event。事件具有时间结构，也不意味着它发生。

### 13.1 发生的时间

`Occurs(e)` 在时刻 t 成立，当且仅当 t 在 e 的 Duration 内（14.3）。

`Occurs` 遵守 14.7：不带时间修饰、被 Assertion 的 `Occurs(e)` 表示 e 在 `AllTime` 的每一点都发生，例如“恒星内无时无刻不在发生核反应”。

一般地，被认定的 `Occurs(e)` 在时间 T 上成立，意味着 T 包含于 e 的 Duration：`start(e)` 不晚于 T 的每个锚点，`end(e)` 不早于 T 的每个锚点。T 是 `AllTime` 时，e 的开始与结束锚点就是 `AllTimeStart` 与 `AllTimeEnd`（14.6）。之后的认知若把某个时刻排在 e 的开始之前或结束之后，或使 e 的开始与结束重合，就与之冲突，得到 `Ambiguous`，暴露翻译错误（14.7）；e 的时长有限不构成冲突（14.6）。

判断不带时间修饰的 `Occurs(e)`，问的是 e 是否时时都在发生：已知某个时刻在 e 的 Duration 之外时为假，否则按开放世界为未知（8.3）。同理，时间 D 与 e 的 Duration 已知不相交时，可以推出 `In(Not(Occurs(e)), D)`：e 在 D 中始终没有发生（14.5）。

普通事件的 canonical 写法是：

```text
In(Occurs(e), duration(e))
```

模式中的 Event 同样如此：“某段时间内发生的事”写成 `In(Occurs(e), duration(e))` 加 `Within(start(e), D)`，不写成 `In(Occurs(e), D)`。后者表示 e 在 D 的每一点都在发生，否定或穷尽它几乎不排除任何东西。

`Only` 与 `NoInstance` 排除一个被问的事物，要求问句的描述蕴含模式的约束体，时间窗也不例外。事件的时间窗有三种说法，蕴含关系如下：

| 说法 | 写法 | 蕴含 |
|---|---|---|
| 开始于 D | canonical 写法加 `Within(start(x), D)` | 某一时刻 |
| 在 D 的每一点都在发生 | `In(Occurs(x), D)` | 某一时刻 |
| 在 D 的某一时刻正在发生 | Virtual 锚点 a、`Within(a, D)` 与 `At(Occurs(x), a)` | — |

后两种推不出“开始于 D”：x 可以在 D 之前就已开始。因此窗口写在开始上的模式（`Within(start(e), D)`）只排除同样写明“开始于 D”的问句；问“D 中有没有在扔”（每一点或某一时刻）得到未知，不是假。窗口写在某一时刻上的模式（14.4）排除上表三种问句，但也排除 D 之前开始、延续进 D 的事。按原文选择模式的说法，问句与之对齐。

Interface 可以提供构造辅助（例如 `Occurred(e)`），一次生成 e 的锚点与上述 canonical 写法。

### 13.2 施事

施事按原则 9 由独立的 Proposition 表达：

```js
Agent(action=e, actor=x)
```

Event 不以字段携带施事。“谁丢了石头”写成对 `Agent` 的 `Among`：

```text
d = Drop(theme=pebble, destination=pitcher)
Among(node=d, situation=story)
x = Variable
Among(node=Agent(action=d, actor=x), situation=story)
Query(x)
```

`Goal.actor`、`Promises.actor`、`Unable.actor` 等是命题自身的角色字段，不受此影响。

---

## 14. 时间

### 14.1 总体原则

时间属于 Proposition 的语义结构，不是 Assertion 的附加字段。Assertion 始终只表示当前 Situation 认定这个 Proposition 成立；时间限制由 Proposition 自己的时间修饰表达。因此时间可以包含 Variable，并参与普通 Query。

### 14.2 `TimeAnchor`

Commons 提供可实例化的普通空时间锚点类型 `TimeAnchor`。它不预定义故事开始、故事结束、当前时刻或任何叙事位置。输入根据实际认知创建锚点，并由普通认知说明它们是什么：

```js
storyStart = new TimeAnchor(story)
storyEnd   = new TimeAnchor(story)
```

它们为什么是“故事开始”“故事结束”，由输入中的认知决定，不是 `TimeAnchor` 的内建语义。

### 14.3 事件锚点

一个 Event 具有三类时间锚点：

1. 开始锚点，类型 final；
2. 结束锚点，类型 final；
3. 内部锚点，基类可以直接实例化，也可以派生更具体的内部锚点（顶点、转折点、接触点等）。

事件自带一个 Duration，由事件自身的锚点描述。

结束锚点在结构上存在，但没有认知说明它的位置、关系或结果时，结束时间只是未知。不得推出事件没有结束、永远持续或结束于无穷远处。

锚点的具体 API 与 `start(e)`、`end(e)`、`duration(e)` 的正式形式本版未定义（16 第 8 项）。

### 14.4 锚点关系

时间锚点通过彼此之间的普通 Proposition 获得时间意义：先后、重合、距离、时间差等。这些不是锚点 identity 中隐藏的属性。

`Before(a, b)` 没有被断言或推出时，a 与 b 的先后未知；不能证明 `Before(a, b)`，不推出 `Before(b, a)` 或 `Not(Before(a, b))`。

锚点之间的距离可以是精确的（`Distance(a, b) = 5 minutes`），也可以是模糊的（一段时间、很快、很久）。模糊值的表示本版未定义（16 第 10 项）。

#### `Within`

```js
Within(anchor=A, duration=D)
```

是普通 Proposition，表示锚点 A 位于 Duration D 之中。“P 在 D 中某一时刻成立”不另设时间修饰，而是新建一个锚点：

```text
a = TimeAnchor(s)
Within(a, D)
At(P, a)
```

`In(P, D)` 表示每一点（14.9），二者不得互相替代。

否定存在与穷尽的时间窗通常是“某一时刻”：“狼出来之前没有狼在场”写成 Virtual 锚点 a、`Within(a, D)` 与 `At(Present(wolf), a)`；事件写成 `Within(start(e), D)`（13.1）。问句的时间窗要蕴含模式的时间窗，否则排除不了它（13.1）。

### 14.5 Duration

Duration 是时间范围的描述，由一个或多个锚点定义。由多个锚点定义时，其时间集合是这些锚点本身及它们所界定的中间区域的并集。Duration 可以表示单一连续时间段、多段时间区域的组合、事件自带的持续时间，或由其他认知构造的时间范围。Duration 的构造形式本版未定义（16 第 9 项）。

本版不区分开区间与闭区间。边界前后的差异用更多锚点及锚点之间的关系表达。

#### 时间集合运算

```js
TimeIntersection(T1, T2, ...)   // T1 ∩ T2 ∩ ...
TimeUnion(T1, T2, ...)          // T1 ∪ T2 ∪ ...
TimeComplement(T)               // AllTime \ T
```

- 三者是 Interface 提供的函数，返回带 Brand 的冻结普通值，不是 Node：不属于任何 Situation，不出现在 Input 中，不能被 `Virtual` 修饰；
- 参数可以是时间锚点、Duration、`AllTime`，或另一个时间集合运算的值；
- 值中引用的锚点与 Duration，由持有该值的认知在自己的提及声明中报告，因而照常进入提及反查；
- 结果可以是时间点、时间段，也可以为空。

运算的值可以出现在接受时间描述的字段中：

- 时间点可以用于接受 Duration 的位置，视为只含该点的时间集合；
- 结果不是单个时间点，却用于只接受锚点的位置（例如 `At.anchor`），由消费方报告错误；
- 结果为空时，运算返回空；消费方可以抛出异常或报告错误，由实现决定。

#### `Not` 不作用于时间

`Not` 不作用于时间点与时间段；时间上的“之外”“以外”使用补集。`Not` 的 `proposition` 中任意深度都不得出现 `At` 或 `In`：

- “P 在 D 之外成立”：`In(P, TimeComplement(D))`；
- “P 在 D 中始终不成立”：`In(Not(P), D)`；
- “P 在 D 中某一时刻不成立”：`Within(a, D)` 加 `At(Not(P), a)`。

### 14.6 `AllTime`

Commons 以 Foundation 的 GlobalNode 提供全局 `AllTime`（不是 JavaScript 的数值 `Infinity`）。它是没有施加更窄限制的最大时间范围，是时间约束意义上的顶：

```text
T ∩ AllTime = T
```

`AllTime` 由两个内建的全局时间锚点界定：

```text
AllTime = Duration(AllTimeStart, AllTimeEnd)
```

- 任何时间锚点都位于 `AllTimeStart` 与 `AllTimeEnd` 之间（含两端）；
- `AllTimeStart` 先于 `AllTimeEnd`：`AllTime` 不是一个时刻；
- `AllTime` 的长度没有规定，有限的距离不与 `AllTime` 矛盾；
- 两个边界是锚点，可以像其他锚点一样被引用，例如 `Duration(x, AllTimeEnd)` 表示从 x 起一直持续。它们不是叙事位置（14.2），也不表示未知：位置未知的锚点不在边界上。

`AllTime` 不表示事件永不结束、字段没写、未知的 Duration 或未知的结束。需要表达一直成立或一直持续时，显式引用 `AllTime` 或它的边界。

### 14.7 Proposition 的自然时间

没有时间修饰的 Proposition，其时间是 `AllTime`：没有比 `AllTime` 更窄的时间约束。时间修饰在此基础上逐步缩小范围。

因此，被 Assertion 的、没有时间修饰的 P 在 `AllTime` 的每一点成立：

- `AllTime` 适用于自然规律等不随时间变化的认知；
- 会变化的状态必须写明时段；
- 漏写时段的状态与之后的认知冲突时（例如之后被断言 `Not`），得到 `Ambiguous`，暴露翻译错误；不冲突时不另行检查。乌鸦可以一直叼着肉站在水里。

### 14.8 `At`

```js
At(proposition=P, anchor=A)
```

是普通 Proposition：在 P 已有时间约束的基础上，再把 P 限制于锚点 A，即 P 在 A 这个点成立。

```text
time(At(P, A)) = time(P) ∩ A
```

`time(P) = AllTime` 时，`time(At(P, A)) = A`。

### 14.9 `In`

```js
In(proposition=P, duration=D)
```

是普通 Proposition：在 P 已有时间约束的基础上，再把 P 限制于 D，即 P 在 D 的每一点成立。“D 中某一时刻”用 `Within` 与 `At` 表达（14.4）。

```text
time(In(P, D)) = time(P) ∩ D
```

**各级自动取交集。** 一个 Proposition 的有效时间，是从最外层到它自身的路径上各级时间限定的交集，适用于任何嵌套：

```text
In(
    And([In(P, D1), Q]),
    D2
)
```

P 的有效时间是 D1 ∩ D2，Q 的有效时间是 D2；`And` 自身没有时间限定。`Validity`、`Conditional` 等所引用的 Proposition 同样按此计算。交集为空时按 14.5 处理。

### 14.10 时间与 Query

`At`、`In`、锚点与 Duration 都是普通语义结构，时间问题不需要单独的 Query 机制，status 与其他 Query 相同（7.3）。

```text
a = Variable
At(P, a)
Query(a)
```

询问满足该时间认知的锚点。只有约束足以确定一个锚点时才得到 `OK`。

```text
d = Variable
In(P, d)
Query(d)
```

询问 Duration。结果是一个时间段：能推出 P 在每一点成立的那些时刻构成的 Duration。它是一个值，不把满足条件的各个子时间段或各个点视为多值。

**锚点是 Node。** 时间锚点（`TimeAnchor` 与事件的开始、结束、内部锚点）是普通 Node，不是普通值：

- 提及反查只索引 Input 中的 Node 与 global，锚点是 Node 才能从它反查 `Before`、`Within` 等关于它的命题；
- 模式中的“某一时刻”需要被 `Virtual` 修饰，而 `Virtual` 只作用于 Node；
- 锚点具有 Node identity 与 `situated`，受 Foundation 的引用与信息流规则约束。

**“何时”。** “何时”的 canonical 问法是询问事件的某个具体锚点，例如“事件 e 的开始时刻是？”：锚点作为 Variable 的值被 Query，不要求锚点有名字。不写成“找一个使 `At(P, a)` 成立的 a”：事件的开始、结束与内部锚点都可能满足它，按“多值即歧义”（7.3）必然为 `Ambiguous`。

### 14.11 明确性

时间系统遵守开放世界。只有明确的 Assertion 或推导产生时间认知：

- 未断言结束 ≠ 不结束；
- 结束位置未知 ≠ 结束不存在；
- 位置未知 ≠ 位于 `AllTimeStart` 或 `AllTimeEnd`；
- 未知距离 ≠ 无穷远；
- 未知时间关系 ≠ 相反关系；
- 未写字段 ≠ null；
- 没有时间限定 ≠ 时间信息未知：它采用自然的 `AllTime`；
- 未 Assertion 某个 Proposition ≠ Assertion 其 `Not`。

### 14.12 状态的起止与因果

Commons 没有状态惯性：已开始的状态不默认持续，结束的状态也不默认其反面成立。状态在哪段时间成立，由 Duration 写明：

- 自起点成立：`In(P, duration(storyStart, x))`；
- 自 x 起一直成立：`In(P, Duration(x, AllTimeEnd))`；
- 事件 e 之后成立：`In(P, duration(end(e), storyEnd))`；
- 之后被结束时，Duration 的终点是结束事件的锚点；之后不成立时，另写 `In(Not(P), ...)`。

持续到哪里由翻译写明，不由默认规则推出。某类状态需要持续规则时，由该类认知自己的推导规则给出（16 第 12 项）。

时间先后不等于因果。“e 造成 P”另写 `Causes(cause=e, effect=P)`，`effect` 可以是 Proposition；时间仍由 `In` 给出。时间与因果各只有一种写法。

---

## 15. Core 一览

```text
语境对象：
    普通 Node（默认实例化）
    Situation
    Proposition
    Assertion

语境关联：
    Among
    Corresponds
    Virtual

逻辑：
    Not
    And
    Conditional
    NoInstance
    Only

求解：
    Variable       // Foundation
    Query          // Foundation
    Validity
    result + status

时间：
    TimeAnchor
    事件的开始、结束、内部锚点
    Duration
    AllTime：AllTimeStart、AllTimeEnd
    At
    In
    Within
    时间集合运算（普通值）：TimeIntersection、TimeUnion、TimeComplement

推理：
    类继承
    已写字段约束
    显式推导规则
    包含判定（9.1）
```

`Believes`、`Says`、`Plans`、`Fears`、`Occurs`、`Agent`、`Causes`、`Unable`、`Forbids`、`Mandates`、`Habitual`、`Goal`、`Promises`、`Failed` 等都是普通认知，通过类、字段与自己的推导规则接入，不改变求解器的结构。

---

## 16. 本版未定义的事项

1. `Among` 的候选搜索策略（多候选、无候选与候选优先级已由 6.2 规定）。
2. `Corresponds` 的传递性，以及多个对应的组合规则。
3. `NoInstance`、`Only` 的最终名称与详细推导。
4. `Conditional` 的 `forall` / `exists` 是否足以覆盖实际语料。
5. 多 Node 复杂 Virtual 描述的表达便利性（模式的边界已由 6.4 规定）。
6. `And` 之外是否需要其他逻辑组合。
7. 推导规则的 JavaScript 声明接口，包括字段比较方向（9.1）与字段是否接受模式（6.4）的声明。
8. 事件的开始、结束、内部锚点的 API；`start(e)`、`end(e)`、`duration(e)` 的正式形式（锚点是 Node，14.10）。
9. Duration 的构造形式（时间集合运算已由 14.5 规定）。
10. 模糊时间距离的值表示。
11. 序数的其他形式，例如倒数第 n 个、按内部锚点排序（`Nth` 与 `Next` 已由 10.5 定义）。
12. 某些领域认知是否需要显式的持续规则（14.12）。
13. 非 `OK` 时 `result` 与候选值的数据结构（7.3）。
14. lint 的完整集合：只包括结构错误、字段错误与无法解释的声明。
15. 包含判定第 4 条中“可以推出”所使用的推导规则范围（9.1）。
16. `Among` 选中被 `NoInstance` 声明不存在的 Virtual Node 时的结果：差异还是冲突（6.2）。

---

## 附录 A：与上一版 Commons 的对应（非规范）

上一版的以下机制在本版中不提供；本版需要相应语义时按右栏表达。新版只在语义需求得到证明时才增加机制。

| 上一版 | 本版 |
|---|---|
| 问题 Situation、`Asks`、条件即持有 | 问题认知与故事同处一个 Situation；约束由 `Among`、`Corresponds`、`Validity` 显式声明（6.2、6.3、8.4） |
| `AskWhether`、`Yes` / `No` / `Conflict` | `Validity` 与 boolean 结果（8.4） |
| `HoldsIn` | 指向语境的 `Among`，或语境中的 `Validity`（12） |
| `NotEstablished` 及 correspondence / instance / joint 分级 | status：`Unknown`、`Ambiguous`、`NoMethod`（7.3） |
| `Some` | 普通 Node 的默认实例化；询问存在用 Virtual 模式与 `Validity`（10.1） |
| `Such`、范围 Situation、开放项、描述角色 | Virtual 模式：约束体与头（6.4） |
| `Among.as` | `node` 的类型只作为对应的提示（6.2） |
| `Distinct` | 语境对象与 Virtual Node 默认不同（1.1、6.4） |
| `FIELDS.polarity`、全局 `Refutes`、支持与反驳两套求值 | 各认知自己的推导规则与包含判定（第 9 节） |
| 特殊的模态求值方式 | 语境 Situation 是 root，Situation 本身提供隔离（12） |
| 事件作为施事字段的载体 | 独立的 `Agent`（13.2） |
| `MomentOf` | 事件的开始、结束、内部锚点（14.3） |
| `Between` | Duration（14.5） |
| `While` | 已知成立的 Duration |
| `At` 作为求值时间 | `At` 只是时间修饰（14.8） |
| `Lasted` | 锚点距离或 Duration 的属性（14.4） |
| `Initially`、`ResultsIn`、`Ends`、状态惯性、结束后的永久否定 | `In` 与显式 Duration；因果另由 `Causes` 表达（14.12） |
| `Episode` | 选出的事件锚点与 Duration |
| `Before`、`Overlaps` | 锚点或 Duration 之间的普通 Proposition（14.4） |
