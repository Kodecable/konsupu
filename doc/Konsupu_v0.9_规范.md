# Konsupu v0.9 规范草案

Konsupu 是一个用符号人工智能方法辅助 LLM 的通用 LLM Harness 内核。它让 LLM Agent 自主构造、使用和演化用于理解世界与完成任务的符号系统，而不是预先为特定领域写死完整的知识表示和推理程序。

核心思想为：

- LLM Agent 自主编织符号系统，用于自然语言的结构化解释和推理。
- 符号系统具有可解释性、自描述与自演化能力，以及技能可交换性。
- 在运行时动态学习所需的知识，不必在一开始就构建对世界的完整建模。
- 不要求把所有认知计算最终消灭成确定性符号程序。符号系统可以在推理过程中将部分任务委托回 LLM，并为后者提供明确的约束。当前 DEMO 不实现此类推理中 LLM fallback。

为了方便讨论，实现上述符号系统功能的环境，编排 LLM Agent，提供工具等等的实现软件，称之为 Konsupu Runtime。下文规范主要约束其实现。

## 结构总览

Konsupu Runtime 当前以“用户输入 -> 模型输出”的多轮重复为主要交互方式，一次交互称之为 Interaction。

Konsupu Runtime 的职责不是理解世界，而是提供：

- 一个受版本管理的普通 JavaScript 认知项目；
- 受限、隔离的 LLM Agent 执行环境；
- JavaScript 执行环境；
- Input Translation -> Resolve -> Output Translation 的固定数据流；
- 对持久认知修改的发布与失败恢复；
- Learning 的编辑、测试与发布流程；
- Agent 之间的硬信息边界。

Konsupu Runtime（下称 Runtime）不定义任何实际业务符号语义、认知数据模型或世界模型。这些内容全部属于 Cognition Space 中由 LLM Agent 自行演化的上层认知。

### 认知空间

认知空间（Cognition Space）是一个普通文件系统目录，同时是一个 JavaScript 项目，其中的持久 `.js` / `.json` 源文件共同构成 Konsupu 的跨轮认知。

认知空间具有版本控制能力。认知版本（Cognition Revision，下称 Revision）表示 Cognition Space 的一个已发布持久状态，其具有唯一标识符（Revision identity）。

Revision 的具体实现属于 Runtime 实现细节。当前实现可以使用 Git，此时 Revision identity 可以直接使用 Git commit long hash，但 Agent 和 cognition source 不应依赖 Git 的 branch、HEAD、index、commit 等概念。

储存在认知空间中的认知能够跨 Interaction 存续，称之为 Persistent Cognition；仅存在于 JavaScript 运行时内存中的 JS 对象、对象图和中间状态无法依靠自身跨 Interaction 存续，称之为 Transient Cognition。

#### 文件

Cognition Space 内只允许：

- 普通目录；
- 普通文件，且文件后缀必须是 `.js` 或 `.json`。

不允许：

- symbolic link；
- FIFO；
- socket；
- device node；
- 其他特殊文件。

特别地，以下路径不属于 Cognition Space cognition：

```text
.*
.*/**
**/.*/**
```

Runtime 应当在所有 Agent-facing 文件边界上忽略它们并拒绝访问。

因此当前实现即使在 Cognition Space 内使用 `.git/` 保存版本信息，`.git/` 也不属于 cognition。

#### 基础路径

除上述隐藏路径外，Cognition Space 根目录有且只有以下五个 entry：

```text
Memory/
Test/
Interface/
Resolve.js
Test.js
```

其中 `Memory/`、`Test/`、`Interface/` 必须是普通目录，
`Resolve.js`、`Test.js` 必须是普通 `.js` 文件。

除这些 entry 与不属于 cognition 的隐藏路径外，根目录不得存在任何其他
普通文件或目录。

Runtime 只对这五个路径赋予固定的执行和权限意义。

它不预定义 `Memory/`、`Test/`、`Interface/` 内部的目录结构。

##### Memory/

`Memory/` 保存 Persistent Cognition。

“Memory” 在本文中取广义含义，包括但不限于：

- 系统知道“是什么”；
- 系统知道“如何做”；
- 用户与世界的持久事实；
- 事件；
- 程序性知识；
- 学到的符号逻辑；
- 对话历史的结构化认知；
- 临时但需要跨 Interaction 保留的状态；
- 未来可能被压缩、归并或遗忘的认知。

Runtime 不预定义 `Memory/` 内部目录和数据结构。

Runtime 当前不实现遗忘、压缩或 GC。这些能力以后可以由 cognition 自身实现。

##### Test/

`Test/` 保存 cognition 自己的测试实现、辅助模块和 fixture，用于保证
`Memory/`、`Interface/`、`Resolve.js` 以及它们之间的约定在多轮
Learning 修改后仍然成立。

Runtime 不发现或直接调用 `Test/**` 中的单个测试文件。`Test/` 内部如何
组织测试、测试顺序如何安排、是否存在测试分组等，全部由 cognition 自己
决定。

##### Test.js

`Test.js` 是 Cognition Space 对 Runtime 提供的测试入口，必须是 ESM，
并导出：

```js
export function Test() {
    // ...
}
```

Runtime 在验证 Learning draft 时只调用这个入口。

`Test.js` 可以自行 import `Test/**` 以及其他 cognition source，并由自身
决定实际执行哪些测试以及执行顺序。

Runtime 只规定：

- `Test()` 无参数；
- 正常返回表示测试通过；
- 抛出异常表示测试失败。

##### Interface/

`Interface/` 是暴露给 I/O Translation Agent 的公开符号交互接口，由普通 ESM `.js` 模块构成。

`Interface/` 可以提供：

- 构造 Transient Cognition 的函数；
- 修改 Transient Cognition 的函数；
- 查询和读取 Transient Cognition 的函数；
- 识别、搜索、关联和检查 cognition 的函数；
- Output Translation 所需的读取、解释或观察辅助函数。

Runtime 不预定义 `Interface/` 内部目录、函数名称、参数结构或返回类型。


##### Resolve.js

`Resolve.js` 是 Cognition Space 对 Runtime 提供的推理执行入口，必须是 ESM，并导出：

```js
export function Resolve(input) {
    // ...
    return output;
}
```

Runtime 规定该入口：

- 接收一个 JS value；
- 返回一个 JS value，或抛出异常。

Runtime 不规定：

- input 的类型；
- output 的类型；
- input/output 是否由 class instance、closure、prototype graph 等构成；
- Resolve 内部如何推理；
- Resolve 内部如何组织 Memory。

### JavaScript

Cognition Space 内的 `.js` 文件全部使用 ECMAScript Modules。

当前实现使用 QuickJS-NG 作为 JavaScript 引擎。本文直接使用 `JSRuntime`、`JSContext`、`JSValue` 等 QuickJS 概念描述行为；其他实现如果能够提供等价语义，也可以替代，但推荐直接使用 QuickJS-NG。

QuickJS 的 `std`、`os` 等扩展标准库不导入 cognition 环境。

#### 导入

项目内 JavaScript import 只允许静态 ESM import。

允许：

```js
import { Foo } from "./Foo.js";
import { Bar } from "../Other/Bar.js";
```

要求：

- 项目内 import 必须使用相对路径；
- `.js` 后缀必须显式写出；
- `./` 与 `../` 均可使用；
- 规范化后的目标必须仍位于 Cognition Space；
- 目标必须是普通 `.js` 文件；
- 标准 ESM circular dependency 允许，由实际 JavaScript 引擎处理。

禁止：

```text
bare package import
npm package resolution
node:*
absolute filesystem import
file:
http:
https:
dynamic import()
direct JSON module import
```

例如以下均非法：

```js
import x from "lodash";
import fs from "node:fs";
import x from "/tmp/x.js";
import x from "https://example.com/x.js";
import x from "./data.json";
```

Runtime 提供的 Host API 是非相对 import 的唯一例外，例如：

```js
import { Read } from "konsupu:json";
```

`.json` 文件不能直接作为 ESM module import。访问 JSON 必须通过 Runtime 提供的 Host API。

#### Host API

Host API 并非在所有 JSContext 中提供。具体能力由当前执行阶段决定。

##### JSON

Runtime builtin module：

```js
import {
    Read,
    Write,
    Create,
    Remove,
    Move,
} from "konsupu:json";
```

始终定义上述完整 API surface。Runtime 不根据执行环境裁剪 module export。

是否允许某次 `Read` / `Write` / `Create` / `Remove` / `Move` 调用，
由 Runtime 在调用时根据当前执行实体的权限检查决定。无权限时抛出异常。

Host capability 和权限绑定到一次 JavaScript execution，而不是绑定到
某个 source file 或 module path。

一个合法 module entry 加载的全部 transitive dependencies 都继承当前
execution 的 Host capability 和权限。相同 cognition module 在不同
execution 中被加载时，可以因此拥有不同权限。

I/O Translation Agent 自己的 `js_eval` 临时 module 不允许直接 import
`konsupu:json`；但从合法 `Interface/**` entry 加载的允许 cognition
module graph 及其全部 transitive dependencies 可以 import
`konsupu:json`，调用时按当前 I/O Translation execution 的权限检查。

JSON API path 使用相对于 Cognition Space 根目录、大小写有关的 path。

例如：

```text
Memory/User/History.json
Memory/Cpp/Keywords.json
```

path：

- 不允许以 `/` 开头；
- 不允许包含 `..` path component；
- 不允许指向隐藏路径；
- 必须指向 `.json` 普通文件或待创建的 `.json` path。

具体可读写范围不由 JSON API 本身定义，而由当前执行实体的权限定义。

**Read**

```text
Read(path)
```

要求：

- target 已存在；
- target 是 `.json` 普通文件；
- 当前 JSContext 有权限读取 target；
- 否则抛出异常。

返回普通 JavaScript data，不给返回值附加 Runtime-defined semantic type。

**Write**

```text
Write(path, value)
```

要求：

- target 已存在；
- target 是 `.json` 普通文件；
- 当前执行实体有权限写入 target；
- `value` 可表示为 JSON；
- 写入后自动格式化；
- 否则抛出异常。

无返回值。

**Create**

```text
Create(path, value)
```

要求：

- target 不存在；
- target path 指向 `.json` 文件；
- target 的父目录已存在；
- 当前执行实体有权限在 target 创建文件；
- `value` 可表示为 JSON；
- 写入后自动格式化；
- 否则抛出异常。

无返回值。

**Remove**

```text
Remove(path)
```

要求：

- target 已存在；
- target 是 `.json` 普通文件；
- 当前执行实体有权限删除 target；
- 否则抛出异常。

无返回值。

**Move**

```text
Move(source, destination)
```

要求：

- source 已存在；
- source 是 `.json` 普通文件；
- destination path 指向 `.json` 文件；
- destination 不存在；
- destination 的父目录已存在；
- 当前执行实体有权限读取并移走 source；
- 当前执行实体有权限在 destination 创建文件；
- 不允许隐式 overwrite；
- 否则抛出异常。

无返回值。

JSON API 不提供目录创建、目录删除或任意文件写入能力。

##### InputObjectInvalidError

Resolve JSContext 提供：

```js
import { InputObjectInvalidError } from "konsupu:input";

throw new InputObjectInvalidError("...");
```

`InputObjectInvalidError` 是唯一表示：

> 当前 Resolve failure 是由 Input Translation 构造错误导致，应返回原 Input Translation Agent 修正。

的特殊异常类型。

除此之外的 Resolve JavaScript exception 均按 Resolve cognition failure 处理。

#### 自动格式化与复杂度门禁

所有 Runtime 写入 Cognition Space 的 `.js` / `.json` 在真正写入前自动格式化。

具体 formatter 属于实现细节，但对同一输入必须产生稳定输出。当前实现使用 prettier 3.9.8（meriyah parser + estree printer），运行在独立于认知执行的 QuickJS runtime 中，并使用 Runtime 自己的 JSON pretty formatter。

格式化后的每个 `.js` source 必须满足：

```text
最多 160 行
每行最多 80 列
```

不满足时，本次 `.js` 写入失败。

Runtime 不提供绕过复杂度门禁的方法。

> 如果已有认知结构无法在该限制下继续扩展，Learning 必须通过拆分文件或重构 cognition 解决。

Transient JS code，例如 I/O Translation Agent 在 `js_eval` 中执行的代码，不属于 Cognition Space source，因此不受 160×80 source gate 约束。

#### 同步执行

当前 Runtime protocol 只定义同步 JavaScript 执行。

以下 Runtime entry / interaction 不提供隐式 Promise 等待：

```text
Resolve()
Test()
Interface function invocation
js_eval top-level evaluation
```

`Resolve()` 或 `Test()` 返回 Promise 视为无效结果。

`js_eval` 不支持 dynamic `import()` 或 top-level `await`。Runtime 不为
cognition 提供异步 workflow 推进语义。

#### JS 上下文以及值传递

一次 Interaction 中以下执行方拥有相互独立的 `JSContext`：

- Input Translation Agent；
- Resolve；
- Output Translation Agent。

每个 `JSContext` 有独立的 global environment。

Input Translation、Resolve、Output Translation 在同一 Interaction 中共享同一个 `JSRuntime`，以允许 Runtime 直接传递 `JSValue`。

Test 使用与当前 Interaction 隔离的测试 JavaScript 执行环境；具体是否复用 Runtime 实例属于实现细节，但不能依赖或修改当前 Interaction 的 transient object graph。

多轮 Interaction 是否复用底层 `JSRuntime` 由实现决定，但每个新的 Interaction attempt 中各执行阶段应当获得新的 `JSContext`，除本文明确要求复用某个 Agent context 的错误修复流程外。

Input Translation -> Resolve 和 Resolve -> Output 均直接传递同一 `JSRuntime` 内的 `JSValue` 引用，不进行 JSON serialization、structured clone 或 deep copy。

因此：

- class instance 保持其 prototype；
- object identity 可以保持；
- cyclic graph 可以保持；
- transferred value 可达的整个 JS object graph 都可能被接收方访问和修改。

Runtime 不能假装跨 Context 传递的值不可变。

规范要求：

```text
Resolve SHOULD NOT 修改 input object。
Output Translation SHOULD NOT 修改 Resolve output object。
```

但 Runtime 不强制保证这一点。需要重试时，应当提醒对应 Agent：此前传递的 JS value 可能已经被后续阶段修改。

### Agent 工作区

LLM Agent 默认运行在 Runtime 创建的临时工作目录中。

普通 I/O Translation Agent 的 cwd 至少包含：

```text
CognitionSpace -> <actual Cognition Space>
```

Learning Agent 额外包含：

```text
ReferenceLibrary -> <reference library>
```

上述 symbolic link 只是 Agent workspace 的入口，不属于 Cognition Space 内部文件。

当前 DEMO 不向 Agent 暴露直接 shell / bash / arbitrary process execution。

所有 filesystem 操作必须经过 Runtime 提供的工具。Runtime 在执行工具前必须解析最终 real path 并检查当前 Agent 的路径权限，不能只检查用户输入字符串的 lexical prefix。

以后如果加入 shell，可以另行使用 bubblewrap 等操作系统级隔离机制；当前规范不要求。

## Agents 和流程

一次 Interaction 的正常流程为：

```text
Raw
 ↓
Input Translation
 ↓
Resolve
 ↓
Output Translation
 ↓
Answer
```

能力不足或 cognition 实现错误时进入 Learning。Learning 成功后从哪个阶段继续，由触发 Learning 的阶段决定。

### Agent `finish`

所有 LLM Agent 都通过名为 `finish` 的 Agent tool 声明当前任务已经完成。

`finish` 只是各 Agent tool surface 共有的名称，不是统一的 Runtime request type。不同 Agent 的 `finish` 参数、验证规则以及成功后的 workflow 分别定义。

Runtime 可以拒绝一次 `finish`。被拒绝时，当前 Agent session 继续运行。例如 Learning Agent 调用 `finish` 后 Test 失败，Runtime 向同一个 Learning Agent 返回结构化诊断，由其继续修改当前 draft。

### Input Translation Agent

Input Translation Agent 将当前用户输入的自然语言文本建模为 Transient Cognition 内的符号化结构。

它获得当前 Raw，但看不到上一轮 Raw、上一轮自然语言 Answer 或上一轮 Agent context。

Input Translation Agent 有如下工具：

```text
js_eval
fs_list
fs_read
fs_rg
finish
```

其中 `finish` 使用 Input Translation Agent 自己的参数 schema。

其中：

- `js_eval`：在当前 Input Translation `JSContext` 中把指定 JavaScript
  作为临时 ESM module 求值；
- `fs_list`：浏览允许的目录；
- `fs_read`：读取允许的 source；
- `fs_rg`：在允许的 source 中检索；
- `finish`：结束当前 Input Translation，并声明 success 或
  Input Translation Gap。

每次 `js_eval` 都创建新的临时 ESM module lexical scope，但继续使用同一个
Agent `JSContext`。因此静态 `import` 可以正常使用；跨多次 `js_eval`
需要保留的状态应显式存入 `globalThis`。

`js_eval` 不支持 dynamic `import()` 或 top-level `await`。

Input Translation Agent 的 `js_eval` 临时 module 只允许主动加载：

```text
Interface/**/*.js
```

由合法 `Interface/**` entry 加载的 cognition module graph 可以继续使用
普通静态 ESM dependency，但其 cognition source dependency 只允许位于：

```text
Interface/**/*.js
Memory/**/*.js
```

不得通过 dependency graph 加载 `Resolve.js`、`Test.js` 或 `Test/**`。

其全部 transitive dependencies 继承当前 Input Translation execution 的
Host capability 和权限，并可以 import Runtime Host API。

在 Input Translation 执行环境中，JSON 权限为：

```text
Read  Memory/**/*.json
```

其他 JSON 修改操作即使能够 import，也会在调用时因权限不足失败。


它的 filesystem 工具只允许观察：

- Agent cwd 根目录；
- `CognitionSpace/` 根目录；
- `CognitionSpace/Interface/**`。

除必要的目录名外，不允许通过 list/search/read 泄漏 `Memory/**`、`Test.js`、`Test/**` 或 `Resolve.js` 内容。

Input Translation Agent 调用 Interface 来完成符号化建模。它可以多轮：

- import Interface module；
- 调用 Interface；
- eval 普通 JavaScript；
- 检查中间对象；
- 修改自己的 transient world。

它不负责也无法修改 Persistent Cognition。

Input Translation Agent 启动时记录当前 Revision。由于它不能修改 Persistent Cognition，正常离开时 Revision 必须保持不变。

#### success

Input Translation Agent 成功完成建模时，将最终输入对象赋值给固定 global：

```js
globalThis.StructuredInput
```

随后调用其 `finish` 的成功形式。

Runtime 取得 `StructuredInput` 的 `JSValue`，创建新的 Resolve `JSContext`，将该 value 直接传入 `Resolve.js` 的 `Resolve(input)`。

`StructuredInput` 可以是任意 JS value，不要求 JSON-like。

Input Translation Agent 的 `finish` 有两种调用形式：

```text
finish()
```

表示成功。Runtime 要求 `globalThis` 上存在名为 `StructuredInput` 的
property。检查的是 property 是否存在，而不是其值是否为 `undefined`。

```text
finish(InputTranslationGap)
```

表示无法在当前 Interface 能力下完整建模，进入 Learning。

#### Input Translation Gap

如果当前 `Interface/**` 无法完整表达 Raw，Input Translation Agent 通过自己 `finish` 的 Gap 形式产生 `InputTranslationGap`。

`InputTranslationGap` 是独立的 Runtime message type，不继承某个统一 Gap 类型。概念结构为：

```text
InputTranslationGap {
    missing: [
        {
            description: string,
            near_matches: [
                {
                    path: string,
                    export?: string,
                    limitation: string
                }
            ]
        }
    ]
}
```

`description` 描述缺失的可复用符号能力，不应复述当前 Raw。

`near_matches` 描述当前 `Interface/**` 中看似接近但不能满足需求的能力，其中 `path` 必须指向 Input Translation Agent 实际可见的 Interface source。

Runtime 必须限制数组长度和字符串大小。`InputTranslationGap` 不允许附带 Raw、Answer、任意 metadata 或其他自由结构。

`InputTranslationGap` 直接进入 Learning。

Learning 成功发布新 Revision 后：

- 当前 Input Translation Agent 结束；
- 原 JSContext 不复用；
- 使用同一 Raw 创建一个全新的 Input Translation Agent；
- 新 Agent 在新 Revision 上从头建模。

### Resolve

Resolve 不是 LLM Agent。

Input Translation success 后，Runtime：

1. 记录当前 Revision 作为 Resolve base Revision；
2. 创建新的 Resolve `JSContext`；
3. 将 `StructuredInput` 的 JSValue 直接传入 Resolve Context；
4. 加载并调用：

```js
Resolve(input)
```

Resolve 可以：

- 执行 `Resolve.js`；
- import Cognition Space 内允许的普通 `.js`；
- 使用 JSON Host API；
- 创建和修改任意 transient JS object。

Resolve 的 JSON 权限为：

```text
Read   Memory/**/*.json
Write  Memory/**/*.json
Create Memory/**/*.json
Remove Memory/**/*.json
Move   Memory/**/*.json -> Memory/**/*.json
```

Resolve 不可以：

- 修改任何 `.js`；
- 通过 JSON API 修改 `Memory/` 之外的 `.json`；
- 访问 Raw；
- 使用 QuickJS `std` / `os`；
- 访问 shell、process、network 等未声明能力。

#### Resolve success

`Resolve(input)` 返回一个 JSValue 且没有异常时，Runtime 检查 Cognition Space 相对于 Resolve base Revision 是否存在持久修改。

每一条成功处理的用户输入都必须产生 Persistent Cognition 变化。

用户发送了一条消息、进行了问候、提出了问题、重复了以前的问题，本身都是发生过的新事实。Runtime 不规定这些事实如何表示，但 cognition 必须主动将其记入 `Memory/`。

因此：

```text
Resolve 返回成功
但 Cognition Space 没有持久变化
```

不是合法 success。

Runtime 为这种情况产生独立类型：

```text
ResolveNoPersistenceGap {}
```

该类型本身完整表示“Resolve 返回成功，但没有产生任何 Persistent Cognition 修改”，无需额外 `stage`、`kind` 或 `summary` 字段。

随后进入 Learning。

Runtime 只能验证“发生了持久变化”，不能理解这份变化是否语义上正确或是否充分表示了 Raw。

存在持久变化时：

1. Runtime 发布本次 Resolve 修改；
2. 形成新的 Revision；
3. 保留 Resolve 返回的 JSValue；
4. 创建 Output Translation Agent；
5. 将 Resolve output 传入 Output Translation JSContext。

Resolve success 的 Revision 在进入 Output Translation 前已经正式发布。

#### InputObjectInvalidError

如果 Resolve 抛出 `InputObjectInvalidError`：

1. Runtime 恢复 Resolve base Revision；
2. 本次 Resolve 的 Persistent Cognition 修改全部丢弃；
3. 当前 Resolve JSContext 结束；
4. diagnostic 返回触发本次 Resolve 的同一个 Input Translation Agent；diagnostic 由 Runtime 的固定修复指引与该异常的 message（认知给出的原因，去除首尾空白、修复无效 UTF-8 后附在 `Reason:` 之后）组成，总长不超过 1024 个 Unicode code point，超出部分截断并以 `…` 标记；message 为空时只有固定指引；
5. 该 Input Translation Agent 继续使用原来的 JSContext 修正输入；
6. 再次 success 后创建新的 Resolve JSContext 重试。

由于 JSValue 没有 deep copy，前一个 Resolve 可能已经修改了 Input Translation Agent 提交的 object graph。

因此 Runtime 必须明确提醒 Input Translation Agent：

> 上一次提交的 StructuredInput 可能已经被 Resolve 修改。继续前应当检查、修正或重新构造相关对象。

Resolve 代码风格上应当避免修改 input，但 Runtime 不依赖这一点保证正确性。

#### 其他异常

Resolve 抛出的任何非 `InputObjectInvalidError` JavaScript exception，默认视为：

> 当前 cognition implementation / reasoning 不足或错误。

Runtime 为此产生独立类型 `ResolveExceptionGap`。它不是某个统一 Gap 类型的 variant。概念结构为：

```text
ResolveExceptionGap {
    exception_type: string,
    trace: [
        {
            path: string,
            line: integer,
            column: integer
        }
    ]
}
```

为避免形成 Raw -> Learning 的旁路，Runtime 不得默认把任意 thrown value、exception object contents 或动态 exception message 原样传给 Learning。`ResolveExceptionGap` 只携带 Runtime 明确允许的、经过净化的源码定位信息。

处理：

1. 恢复 Resolve base Revision；
2. 丢弃本次 Resolve 的持久修改；
3. 结束当前 Resolve；
4. 产生 `ResolveExceptionGap`；
5. 进入 Learning。

Learning 成功发布后，不复用旧 Input Translation context：

```text
same Raw
 ↓
new Input Translation
 ↓
new Resolve
```

Host 自身的版本后端损坏、文件系统损坏、QuickJS 初始化失败等 Runtime infrastructure error 不转换成 Learning，而是 Runtime failure。

### Output Translation Agent

Resolve success 后，Runtime 创建新的 Output Translation Agent `JSContext`。

Runtime 将 Resolve output JSValue 赋值给固定 global：

```js
globalThis.StructuredOutput
```

Output Translation Agent 有如下工具：

```text
js_eval
fs_list
fs_read
fs_rg
finish
```

其中 `finish` 使用 Output Translation Agent 自己的参数 schema。

它的 `js_eval` 与 Input Translation 相同：每次把输入作为临时 ESM module 求值，但作用于自己的 `JSContext`。

Output Translation Agent 的 JSContext：

- 可以访问 `StructuredOutput`；
- `js_eval` 临时 module 只允许主动加载 `Interface/**/*.js`；
- 不允许直接 import `konsupu:json`；
- 不允许直接读取 `Memory/**`、`Test.js`、`Test/**` 或 `Resolve.js` source；
- 看不到 Raw；
- 看不到 Input Translation Agent 的 prompt/context；
- 看不到上一轮 Raw/Answer。

由合法 `Interface/**` entry 加载的 cognition module graph 可以继续使用
普通静态 ESM dependency，但其 cognition source dependency 只允许位于：

```text
Interface/**/*.js
Memory/**/*.js
```

不得通过 dependency graph 加载 `Resolve.js`、`Test.js` 或 `Test/**`。

其全部 transitive dependencies 继承当前 Output Translation execution 的
Host capability 和权限，并可以 import `konsupu:json`。

在 Output Translation 执行环境中，JSON 权限为：

```text
Read  Memory/**/*.json
```

其他 JSON 修改操作会在调用时因权限不足失败。

Output Translation Agent 的职责是：

> 使用 Resolve 已经给出的 structured output 和 Interface 提供的公开解释能力，生成自然语言 Answer。

它不应自行补做缺失的领域推理。

#### success

成功时调用：

```text
finish(answer: string)
```

其中 `answer` 是最终自然语言 Answer。

Interaction 完成。

Answer 本身不会被 Runtime 自动再次写入 Cognition Space。

当前轮用户输入的发生和内容应当已经在 Resolve success 时被写入 Persistent Cognition。

下一轮 Interaction 不会因为 UI 保存了当前 Answer 而自动把它重新注入模型上下文。

#### Output Translation Gap

如果当前 `Interface/**` 或 output representation 不足以让 Output Translation Agent 忠实产生自然语言，它通过自己 `finish` 的 Gap 形式产生 `OutputTranslationGap`。

`OutputTranslationGap` 与 `InputTranslationGap` 是完全不同的 Runtime message type，不共享统一父类型或 envelope。概念结构为：

```text
OutputTranslationGap {
    missing: [
        {
            description: string,
            near_matches: [
                {
                    path: string,
                    export?: string,
                    limitation: string
                }
            ]
        }
    ]
}
```

它描述“为了忠实解释当前 structured output，公开 Interface 还缺少什么能力”，而不是补做领域推理或传递自然语言答案。

Runtime 同样必须限制数组长度和字符串大小，并禁止 Raw、Answer、任意 metadata 或其他自由结构。

Output Translation Agent 在发生 Gap 时调用：

```text
finish(OutputTranslationGap)
```

`OutputTranslationGap` 进入 Learning，但此时：

- Resolve 已经 success；
- Resolve 对 Memory 的修改已经发布；
- Resolve Revision 不回滚；
- Resolve output JSValue 必须继续保留。

Learning 成功发布后：

1. 不重新执行 Input Translation；
2. 不重新执行 Resolve；
3. 不改变已经发布的 Resolve Revision；
4. 创建新的 Output Translation JSContext；
5. 新 Output Translation 使用最新 Revision 中的 `Interface/**`；
6. 继续使用之前已经产生的 Resolve output JSValue。

因此一次 Output Translation Gap 可以正常形成两个连续 Revision：

```text
R0
 ↓ Resolve success
R1
 ↓ Output Translation Gap -> Learning
R2
 ↓ retry Output Translation
Answer
```

R2 对 Resolve cognition 的修改只影响未来 Resolve；当前 Interaction 不追溯执行新 `Resolve.js`。

Runtime 必须确保新的 Output Translation Context 能看到 R2 中的新 Interface source，同时仍然能够访问旧 Resolve output JSValue。如何处理 QuickJS module cache 属于实现细节。

前一个 Output Translation Agent 也可能已经修改了 Resolve output object graph。新的 Output Translation Agent 应当被提醒：

> StructuredOutput 可能已被前一次 Output Translation attempt 修改。

Output Translation 代码风格上应当避免修改 output。

### Learning Agent

Learning Agent 负责 Persistent Cognition 的演化。

Learning 至少可以由以下情况触发：

```text
Input Translation Gap
Resolve non-InputObjectInvalidError exception
Resolve success but no persistent cognition change
Output Translation Gap
```

Learning Agent 看不到当前 Raw，也看不到当前 Input / Output Translation Agent 的完整对话上下文。

它获得：

- 当前 Cognition Space source；
- 当前对应类型的 Gap / diagnostic；
- Runtime 返回的 source/test diagnostics；
- ReferenceLibrary；
- 当前 Learning draft。

Learning Agent 的 cwd 中包含：

```text
CognitionSpace -> <actual Cognition Space>
ReferenceLibrary -> <reference library>
```

Learning Agent 有普通文件编辑工具，例如：

```text
fs_list
fs_read
fs_rg
fs_create
fs_write
fs_remove
fs_move
finish
```

Learning 可以通过文件工具读取和修改 Cognition Space 内非隐藏的：

- `Memory/**`；
- `Interface/**`；
- `Resolve.js`；
- `Test.js`；
- `Test/**`。

其中对 `Memory/**/*.json` 的读写属于 Learning Agent 的文件工具权限，
不是 JavaScript `konsupu:json` Host API 权限；Learning Agent 不执行
cognition JavaScript。

Learning 可以创建和删除这些目录树中的普通目录，以及 `.js` / `.json` 普通文件。

根目录除隐藏路径外始终必须严格保持 `Memory/`、`Test/`、`Interface/`、`Resolve.js`、`Test.js` 五个 entry，不能增加、删除或改名。

ReferenceLibrary 只读。

#### 不允许执行代码

Learning Agent 没有：

```text
js_eval
shell
bash
node
qjs
test runner
arbitrary process execution
```

Learning 只能：

```text
read
edit
finish
receive diagnostics
continue editing
```

Learning 不负责自行决定自己的修改是否能够执行。

#### draft

Learning 开始时以当前已发布 Revision 为 base。

Learning 对 Cognition Space 的修改在 `finish` 被 Runtime 接受前视为 draft，不属于正式 published cognition。

Learning 的具体 draft / rollback 实现属于版本后端细节，不向 Agent 暴露 Git working tree、index 或临时 commit 等概念。

#### finish

Learning Agent 的 `finish` 无需与 I/O Translation Agent 的 `finish` 共用参数 schema。

Learning Agent 调用：

```text
finish()
```

表示：

> 当前 draft 已完成，请 Runtime 验证并尝试结束本次 Learning。

Runtime 随后自动执行 Test。Learning Agent 自己不能运行 Test。

Test failure、source load failure、import failure、syntax error、160×80
failure 或 Test exception 都会使 Runtime 拒绝本次 `finish`，并把结构化
diagnostic 返回同一个 Learning Agent。

Runtime 在返回 diagnostic 前必须先恢复 Test Base State。

此时：

- Learning session 不结束；
- Learning draft source edits 保留；
- Learning 继续修改同一个 draft。

全部 Test 成功后：

1. Runtime 接受本次 `finish`；
2. 发布 Learning draft；
3. 形成新的 Revision；
4. Learning session 结束。

如果 Learning 没有任何 source change，Runtime 拒绝 `finish` 并返回 no-change diagnostic，不产生空 Revision。

#### Learning 后续流程

Learning publication 后的继续位置由触发原因决定。

**Input Translation Gap：**

```text
Learning success
 ↓
new Input Translation with same Raw
```

**Resolve cognition failure / no-persistence failure：**

```text
Learning success
 ↓
new Input Translation with same Raw
 ↓
new Resolve
```

**Output Translation Gap：**

```text
Learning success
 ↓
new Output Translation
 ↓
reuse old Resolve output
```

只有 Output Translation Gap 可以在 Learning publication 后直接继续当前已成功 Resolve 的后半段。

## 测试与 Revision

### Test

Learning Agent 调用 `finish` 后，Runtime 在与当前 Interaction 隔离的测试
JavaScript 执行环境中加载 Cognition Space 根目录的：

```text
Test.js
```

并调用：

```js
Test()
```

Runtime 不扫描 `Test/**`、不定义单个测试文件的入口协议，也不规定测试
执行顺序。这些全部由 `Test.js` 自己通过普通 ESM import 和 JavaScript
控制流决定。

测试环境：

- 以根 `Test.js` 为合法 module entry；
- 可以 import Cognition Space 普通 `.js`；
- `Test.js` 加载的全部 transitive dependencies 继承 Test execution 的
  Host capability 和权限；
- 可以 import `konsupu:json`；
- 可以创建 transient object；
- 不获得 Raw；
- 不获得 I/O Translation Agent context；
- 不获得 ReferenceLibrary。

Test execution 对 `Memory/**/*.json` 拥有与 Resolve execution 完全相同
的 JSON 权限，并额外允许读取 `Test/**/*.json`：

```text
Read   Memory/**/*.json
Write  Memory/**/*.json
Create Memory/**/*.json
Remove Memory/**/*.json
Move   Memory/**/*.json -> Memory/**/*.json

Read   Test/**/*.json
```

Test 对 `Test/**/*.json` 没有写权限。

Test 可以为了验证行为修改 `Memory/**/*.json`，例如直接调用当前
`Resolve.js` 完成完整集成测试。这些修改全部是 disposable test state，
绝不能进入 Learning publication。

Runtime 在 Test 开始前记录当前 Learning draft 的完整 Cognition Space
状态，称为 **Test Base State**。

Test Base State 不是 Cognition Revision，因为 Learning draft 尚未发布。

Test 结束后，无论：

- Test 正常返回；
- Test 抛出 exception；
- Test timeout；
- Test 触发 memory / stack limit；
- Runtime 最终接受或拒绝 Learning `finish`；

Runtime 都必须把 Cognition Space 完整恢复到 Test Base State。

Test success 的顺序为：

```text
Learning draft
    ↓
record Test Base State
    ↓
run Test.js
    ↓
restore Test Base State
    ↓
accept Learning finish
    ↓
publish Learning draft as new Revision
```

Test failure 的顺序为：

```text
Learning draft
    ↓
record Test Base State
    ↓
run Test.js
    ↓ failure
restore Test Base State
    ↓
return diagnostic to the same Learning Agent
```

如何记录和恢复 Test Base State 属于隐藏的版本后端实现细节，不定义
filesystem transaction 数据模型。

`Test()` 在限制时间和资源内正常返回，视为通过。

以下情况均视为 Test failure：

- `Test.js` syntax/load failure；
- import resolution failure；
- `Test` export 不存在或不可调用；
- `Test()` 或其调用的测试代码产生未捕获 exception；
- timeout；
- memory / stack limit failure。



#### 代码覆盖率

Learning validation 的目标不是要求 Runtime 机械加载 Cognition Space 中
每个 `.js` 文件，而是通过代码覆盖率确认 Test 实际触及需要验证的 cognition
代码。

具体 coverage metric、阈值以及“哪些修改必须被覆盖”的策略尚未定义。

当前 DEMO 暂缓实现 coverage gate。因此当前 DEMO 中，`Test.js` 未触及的
source 可能不会在 Learning `finish` 时被执行验证；这是已知限制。

### Revision

Revision 只表示 Cognition Space 已发布状态。

Runtime 公开的语义只有：

```text
current Revision
publish new Revision
restore a recorded Revision
```

当前实现可以直接使用 Git commit 实现，但以下概念不属于 Runtime contract：

```text
branch
merge
rebase
index
working tree
stash
reset
```

Agent 不获得 git tool。

#### Input / Output

Input Translation 和 Output Translation 不允许修改 Persistent Cognition，因此正常执行不产生 Revision。

Runtime 可以为了 workflow bookkeeping 记录它们进入和离开时的 current
Revision，但这不产生新的 Revision，也不构成对外部进程并发修改的规范要求。

#### Resolve

Resolve 开始时记录 base Revision。

Resolve success 且产生持久变化：

```text
R0 -> R1
```

立即发布 R1，然后进入 Output Translation。

Resolve 失败：

```text
R0
 ↓ partial JSON writes
failure
 ↓
restore R0
```

Resolve success 但没有持久变化不产生空 Revision，而是进入 Learning。

#### Learning

Learning 以当前 published Revision 为 base。

`finish` 被拒绝时不发布 Revision，保留 draft。

`finish` 通过 Test 验证后才发布新 Revision。

Output Translation Gap 场景下，Resolve publication 和 Learning publication 是两个独立 Revision，不合并。

### 单任务单线程

v0.9 Runtime 同一时刻只允许一个 active Interaction / Learning workflow 修改 Cognition Space。

不定义：

- concurrent Resolve；
- concurrent Learning；
- revision merge；
- write conflict；
- branch cognition semantics。

因此 Runtime 总能明确知道当前 published Revision 和当前 workflow 的 base Revision。


Runtime 可以假定 Cognition Space 在 workflow 期间由其独占管理。外部进程
并发修改 Cognition Space 的行为不属于本文需要定义或保证的使用场景；实现
是否额外检测、锁定或容错由实现自行决定。

### Agent 资源策略

Agent 的 token / turn / retry budget、context compression、上下文保留策略
以及其他资源控制由 Runtime 实现自行决定，不属于本文规范。

规范不要求某个固定次数的 Input repair、Learning 或 Output retry 上限。
实现可以在资源耗尽时终止当前 Interaction，并报告 Runtime execution failure。

## 信息边界

### 跨轮上下文

每一轮新的 Input Translation Agent 只自动获得：

- 当前 Raw；
- 当前 Revision 上可见的 Interface。

它不会自动获得：

```text
previous Raw
previous Answer
previous Agent conversation
previous transient JS values
```

如果过去发生的内容应当影响未来，它必须已经由某次 Resolve 写入 Persistent Cognition。

因此：

> Conversation transcript 本身不是 cognition；但每一条成功处理的用户输入，都必须由 cognition 转化为 Persistent Cognition。

例如：

```text
用户今天打过招呼
用户重复问过某个问题
用户声明过某个偏好
用户曾经纠正过某件事
```

都应当由 cognition 自己决定如何表示并写入 `Memory/`。

Runtime 不保存这些事实的固定结构。

### Agent 信息隔离

Input Translation：

- 能看当前 Raw；
- 能看 Interface；
- 能运行自己的 `js_eval`；
- 不能直接看 Memory / Test.js / Test / Resolve source；
- `js_eval` 不能直接 import JSON Host API；
- Interface module graph 可以按 Input Translation 的只读 JSON 权限访问 Memory；
- 不能修改 Persistent Cognition。

Resolve：

- 看不到 Raw；
- 获得 StructuredInput JSValue；
- 可以执行 cognition；
- 可以读取 JSON；
- 只能修改 `Memory/**/*.json`；
- 不能修改 `.js`。

Output Translation：

- 看不到 Raw；
- 获得 StructuredOutput JSValue；
- 能看 Interface；
- 能运行自己的 `js_eval`；
- 不能直接看 Memory / Test.js / Test / Resolve source；
- `js_eval` 不能直接 import JSON Host API；
- Interface module graph 可以按 Output Translation 的只读 JSON 权限访问 Memory；
- 不能修改 Persistent Cognition。

Learning：

- 看不到 Raw；
- 不执行 cognition code；
- 可以编辑 Cognition Space source；
- 可以读取 ReferenceLibrary；
- 只能通过 Runtime Test 验证修改。

Test：

- 看不到 Raw；
- 由 Runtime 自动执行；
- 测试副作用必须回滚；
- 不能成为 Output 的答案旁路。

### Gap

“Gap”只是规范中对一类 workflow message 的统称：

> 由于意外或当前 Cognition Space 能力不完备，需要把控制转交给 Learning Agent 的结构化消息，统称为 Gap。

Runtime 不定义统一的 `Gap` 数据类型、父类、tagged union 或公共 envelope。

当前 Runtime 至少定义彼此独立的：

```text
InputTranslationGap
OutputTranslationGap
ResolveExceptionGap
ResolveNoPersistenceGap
```

它们各自拥有独立结构、产生者、validator 和 workflow 规则。

`InputObjectInvalidError` 不是 Gap，因为它把控制返回 Input Translation Agent，而不是 Learning。

Learning `finish` 被 Test 拒绝后返回的 validation diagnostic 也不是 Gap，因为此时控制本来就在 Learning Agent。

Gap 不属于 Cognition Space，也不得作为 Raw / Answer side channel。每一种 Gap type 都必须单独限制字段、数组长度和字符串大小，不能通过一个公共自由 `metadata` / `reason` / `context` 字段重新获得任意消息通道。

Runtime 不要求 Learning 只能修改与 Gap 表面描述直接对应的文件；Learning 可以重构任何允许修改的 cognition source，只要最终 Test 通过。

### ReferenceLibrary

ReferenceLibrary 不属于 Cognition Space。

只有 Learning Agent 可以访问它，并且只读。

ReferenceLibrary 用于提供外部资料，例如本地文档、手册或领域参考库。

ReferenceLibrary 内容不能直接送入当前 Output Translation 作为答案。

如果 Learning 使用了其中的信息，必须先修改 Cognition Space、通过 Runtime Test 并发布 Revision，再按对应 Gap 的继续规则恢复 Interaction。

### Runtime 与 cognition 语义的边界

Runtime 认识：

```text
Cognition Space filesystem
.js / .json
Memory/
Interface/
Resolve.js
Test.js
Test/
JSRuntime / JSContext / JSValue
Revision
Agent role
Gap / diagnostic
publish / restore
```

Runtime 不定义或解释任何业务符号类型、知识表示、推理规则、领域概念或 Memory item type。它们对 Runtime 都只是普通 cognition source 和运行时 JS value。

### 当前非目标

v0.9 当前不要求实现：

- Resolve 内部的 LLM fallback；
- 技能交换的具体序列化格式；
- 自动遗忘 / Memory compression；
- concurrent Interaction / Learning；
- branch / merge cognition semantics；
- shell / bash；
- bubblewrap sandbox；
- LSP；
- debugger；
- persistent QuickJS heap snapshot；
- JS object serialization protocol；
- Git 性能优化。

这些能力以后可以在不改变本文 Runtime 与 cognition 语义边界的情况下增加。
