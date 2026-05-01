# 有记录层的多线程工作记忆卸载器 PRD v0.1

> 工作名：**Work Memory Compiler / 多线程工作记忆卸载器**\
> 产品类型：可接入 agent / cyberboss 的模块，不是 cyberboss 本体，也不是 Personal Ledger Agent 的改名版本。\
> 当前优先来源：本轮产品讨论。此前 Personal Ledger Agent PRD 仅作为可迁移原则参考，不作为主产品定义。

---

## 1. 产品定位

**有记录层的多线程工作记忆卸载器** 是一个接入 agent / cyberboss 的工作记忆模块。

它面向弱项目管理倾向的多线程个人工作者，允许用户在专注工作时用低摩擦、低质量、甚至不完整的输入卸载认知负担；模块负责保留时间痕迹、识别线程、暂存碎片、轻量校准、生成整理包，并在用户进入归纳整理段时，把这些内容整理成结构化、易读、认知负载小的材料。

一句话：

> **工作时只管丢碎片；它负责记时间、看线程，等你有空时整理成能继续用的工作记忆。**

更完整的定义：

> 它不是传统任务管理工具，不要求用户维护看板，也不追踪每一次上下文切换。它提供一个“记录层 + 工作记忆层 + 整理层 + 长期记忆层”，帮助用户在频繁切换线程的工作时段不丢进度，在整理时段获得结构化的线程截图、整理包、dashboard 或可归档日志，并随着长期使用逐渐理解用户的工作背景、表达习惯、常见线程、决策偏好与材料体系。

---

## 2. 与 Personal Ledger Agent 的关系

本产品不是此前 Personal Ledger Agent PRD 的直接延续，而是一次重新收窄后的独立产品。

本产品更聚焦：

```text
输入：低摩擦碎片 / 微信短句 / emoji / 截图 / 事后补充 / md 批注 / UI note
处理：记录时间、暂存、线程识别、轻量确认、整理、归档候选
输出：线程截图 / 整理包 / dashboard / 待确认记录 / 可归档日志
```

本产品保留以下可迁移原则：

- 记录事实，不解释用户。
- 辅助归档，不审视用户。
- 帮助接线，不接管节奏。
- 用户输入先进入 draft / buffer，模块自行判断哪些可以进正式记录，哪些还需要后续处理，如果可以依靠简短的一句话询问，可以先问用户。不要直接全部写死为正式记录。（但是也不要全都当成buffer了，而且不能每一条都向用户询问，但可以采用“已记录为xxxx”的方式隐形询问，用户看到了异常的总结会反馈给莫模块。）
- 不要求用户每次切换都汇报。
- 多线程与多维标签应由系统承担，不应成为用户日常负担。

---

## 3. 目标用户画像

### 3.1 核心用户

核心用户是：**弱项目管理倾向的多线程个人工作者**。

典型包括：

- 创作者
- 研究者
- 独立开发者
- AI-heavy knowledge worker
- 多项目并行的个人工作者
- 工程研发型个人贡献者
- 需要长期思考和材料积累的人

他们不是没有系统意识，也不是不会归档材料。相反，他们通常具备较强的结构化能力、复盘能力和长期系统意识。

他们的问题在于：

> **在集中注意力工作的时段，认知资源已经被工作本身消耗。**

因此，在专注段里，他们没有余力对每个碎片进行分类、命名、归档、说明上下文或维护看板。

### 3.2 用户不是谁

本产品第一阶段不面向：

- 企业 PM / 团队协作管理者
- 需要 Jira / Linear / 飞书项目管理替代品的团队
- 需要严格工时统计的管理者
- 主要诉求是习惯养成、情绪陪伴、生活监督的用户
- 希望 agent 替自己做复杂优先级判断的人

---

## 4. 核心问题

### 4.1 多线程工作段中的真实问题

用户在一个工作时段内可能同时处理：

- ChatGPT 对话
- cyberboss / 微信交互
- 本地 markdown
- Codex / 其他 coding agent
- 浏览器搜索
- debug log
- 截图与现场反馈
- 纸面草稿
- 脑内判断
- 临时插入的外部消息

用户不会，也不应该，每次切换都向 agent 汇报。

真实输入更可能是：

```text
这个点别丢
小看板这个词不对
之后问结构水嘴压紧
96/97 参数可能错了
我现在临时有事
刚才那个之后整理
我回来再说
这个和 PLA 那条线有关
```

这些输入短、脏、含混、上下文依赖强，但它们正是产品应当接受的基本输入形态。

### 4.2 归纳整理段中的真实问题

用户并不是永远拒绝高摩擦输入。

用户通常会明确区分：

```text
专注工作段：不想整理，只想工作。
归纳整理段：愿意确认、修正、补充、批注、归档。
```

因此，产品不应追求“永远低摩擦”，而应追求：

> **在专注段低摩擦，在整理段高结构。**

---

## 5. 产品核心价值

### 5.1 认知负载转移

本产品替用户承担部分认知负载：

| 用户状态  | 用户能提供什么           | 模块承担什么             | 输出形态                 |
| ----- | ----------------- | ------------------ | -------------------- |
| 专注工作中 | 低质碎片、半句话、emoji、截图 | 接住、记时间、暂存、少打扰      | 一句确认 / 静默记录          |
| 线程过多时 | 用户未必意识到遗漏         | 轻量校准当前线程           | 线程截图 / 短提醒           |
| 临时中断时 | 一个 emoji 或极短指示    | 记录中断时间和上下文候选       | 中断标记                 |
| 回来继续时 | “我回来了”“刚才那个”      | 找可能线程，恢复上下文        | 接线提示，可开关建议           |
| 归纳整理时 | 用户愿意补充、确认、批注      | 预整理、分组、提出问题        | 整理包 / dashboard / md |
| 日终疲惫时 | 用户不想深度处理          | 给短版总结，可延后确认        | 低负担摘要                |
| 周期复盘时 | 用户愿意高摩擦整理         | 线程归档、合并、carry over | 周整理包 / 线程 review     |

### 5.2 脏输入到干净输出

产品核心转换链路：

```text
低质输入
→ Dirty Buffer / 临时记忆
→ Draft Events
→ Thread Snapshot / Review Pack
→ 用户确认 / 批注 / 补充
→ Ledger Commit / 正式记录
```

产品成功不是因为它让用户输入更规范，而是因为：

> **用户输入可以很烂，但系统输出必须清楚。**

---

## 6. 核心设计原则

### 6.1 默认低打扰，但允许轻确认

此前的原则“工作中只接住，不打扰、不追问、不要求分类”需要修正为：

> **工作中默认低打扰地接住低质信息；但在合适时机，用极短确认帮助用户校准当前线程认知，防止遗漏。**

轻确认不是整理，也不是追问，而是极短的认知校准。

示例：

```text
我现在记到 4 条线：PLA 产品形态、结构压紧、96/97 参数、JAKA 输出。你不用展开，漏了就回一个关键词。
```

### 6.2 允许用户稍后补充

系统必须允许：

- 不完整输入
- 事后补记
- 前后修正
- 用户推翻之前的说法
- 用户只发关键词
- 用户只发 emoji
- 用户说“之后补”

系统不应当在专注段强迫用户立即补全。

### 6.3 字段少，维度多

底层信息结构应当“核心字段少，但维度承载能力强”。

用户侧不应面对复杂表单；系统侧应能够支持时间、线程、来源、状态、置信度、事件类型、自定义标签、材料引用等多维组织。

### 6.4 先 draft，后 commit

所有低质输入、agent 推断、材料提取、线程归类都先进入 draft / buffer。

进入正式记录前必须经过：

- 用户确认；或
- 用户配置的自动提交规则；或
- 明确低风险记录类型。

### 6.5 不把推测写成事实

系统输出必须区分：

```text
事实：用户明确说过，或材料明确出现。
推测：agent 根据上下文判断。
待确认：需要用户补充或确认。
可丢弃：可能低价值，但不自动删除。
```

### 6.6 帮助接线，不接管节奏

系统可以帮助用户回忆和整理，但默认不替用户做复杂优先级判断，也不替用户决定下一步应该做什么。

“下一步建议”应作为可配置能力，而不是默认强推。

---

## 7. 产品四层结构

### 7.1 记录层：Time Audit / Fact Ledger

记录层负责留下“发生过什么”的时间痕迹。

它不是传统工时统计，也不是监控用户，而是保留工作记忆所需的最小时间证据。

记录层应支持：

- 精确时间
- 近似时间
- 事后补记时间
- 中断时间
- 用户输入时间
- 整理时间
- 事件来源
- 是否来自用户、agent、文件、md、UI、快捷事件

### 7.2 工作记忆层：Active Threads / Dirty Buffer

工作记忆层负责当前未闭合内容。

它应回答：

```text
现在挂着哪些线程？
哪些线程刚刚有进展？
哪些只是被提了一下？
哪些需要用户补充？
哪些可能已经被忘了？
哪些需要进入整理包？
```

### 7.3 整理层：Review Pack / Dashboard / Commit

整理层负责把碎片转换成结构化内容。

典型输出：

- 线程截图
- 当日整理包
- 阶段整理包
- 周整理包
- dashboard
- 待确认问题列表
- 可归档 markdown
- agent 可读 JSON / YAML

整理层不是单一交互形态，而是一套“整理阶梯”：

```text
轻量整理：微信窗口内直接确认 / 补充 / 忽略
中度整理：agent 发送 .md，用户下载、修改、批注后回传
深度整理：拉起 Review UI，用户批量补 note、确认、合并、归档
```

### 7.4 长期记忆层：User Work Memory / Context Memory

长期记忆层负责让模块随着使用时间推进表现更好。

它不等于把所有日志都塞进 prompt，也不等于无限期保存所有原始碎片。它应当从正式记录、整理包、决策记录、用户修正、材料补充中提炼稳定、可复用的工作背景信息。

长期记忆层应回答：

```text
用户长期关注哪些工作线？
用户常用哪些表达、项目名、缩写和材料名？
用户倾向如何做决策？
哪些背景信息反复出现，后续不应每次重新解释？
哪些线程已经结束、暂停或被合并？
哪些记忆有时效性，需要过期或复查？
```

长期记忆层的目标不是“替用户判断”，而是降低重复解释成本，让 agent 在后续整理、接线、归纳、材料补全时更懂上下文。

长期记忆必须带有：

```yaml
memory_item:
  id: string
  type: enum
  summary: string
  source_refs: []
  created_at: datetime
  updated_at: datetime
  confidence: explicit | inferred_high | inferred_medium | inferred_low
  stability: stable | evolving | temporary | deprecated
  review_policy: never | monthly | on_conflict | expires_at
  user_editable: true
```

长期记忆类型建议：

```yaml
memory_types:
  - user_preferences        # 用户偏好的交互方式、整理频率、输出风格
  - work_background         # 用户工作背景、长期项目、领域语境
  - recurring_threads       # 反复出现的问题线
  - domain_glossary         # 用户常用术语、缩写、项目名、样品名
  - decision_history        # 重要决策及其演化
  - artifact_index          # 重要材料、文档、日志、截图的索引
  - interaction_rules       # 用户明确设定的行为规则，如少问、多确认、默认保守
  - review_templates        # 用户自定义整理包、线程截图、dashboard 模板
```

长期记忆的写入原则：

- 用户明确说过或确认过的内容优先进入长期记忆。
- agent 推断的内容必须低置信度保存，并在合适时机等待确认。
- 与用户工作背景相关、反复出现、未来会降低解释成本的信息更适合进入长期记忆。
- 单次情绪、一次性碎片、未确认猜测不应直接进入长期记忆。
- 长期记忆应支持用户查看、修改、删除和禁用。
- 当新材料与旧记忆冲突时，应生成 memory conflict，而不是静默覆盖。

---

## 8. 核心对象模型

## 8.1 Event：最小记录单元

核心字段应尽量少。

```yaml
event:
  id: string
  created_at: datetime
  event_time: datetime | string | null
  raw: string
  kind: enum
  summary: string
  status: enum
  confidence: enum
  meta: object
```

### kind

```yaml
kind:
  - note
  - todo
  - done
  - decision
  - question
  - observation
  - interruption
  - reminder
  - material
  - quick_event
```

### status

```yaml
status:
  - buffered
  - draft
  - confirmed
  - committed
  - ignored
  - needs_clarification
  - discarded_candidate
```

### confidence

```yaml
confidence:
  - explicit
  - inferred_high
  - inferred_medium
  - inferred_low
  - unknown
```

### meta

```yaml
meta:
  threads: []
  facets: []
  source: user_input | agent | wechat | md | ui | file | screenshot | quick_event
  time_precision: exact | approximate | inferred | unknown
  evidence_refs: []
  linked_events: []
  linked_materials: []
  reminder: null | object
  user_tags: []
  needs_user_review: boolean
```

---

## 8.2 Thread：持续问题线

Thread 是跨时间持续存在的问题线，不是分类文件夹。

```yaml
thread:
  id: string
  title: string
  status: active | parked | waiting | ready_to_resume | needs_clarification | stale | done_candidate | archived
  recent_summary: string
  open_loops: []
  last_touched_at: datetime
  related_events: []
  confidence: enum
```

用户不需要日常维护 thread 状态。状态主要由系统内部使用，在整理包或线程截图中以自然语言呈现。

---

## 8.3 Dirty Buffer / 临时记忆

Dirty Buffer 是低质输入暂存层。

用户侧名称可以是：

```text
临时记忆
乱记箱
待整理碎片
今天先放着
```

Dirty Buffer 允许：

- 内容不完整
- thread 未知
- facet 未知
- 时间不精确
- 内容重复
- 前后矛盾
- 暂时无法归类
- 用户之后补充

Dirty Buffer 不能频繁打扰用户，必须遵守触发策略。

---

## 8.4 Thread Snapshot / 线程截图

线程截图是面向“当前状态”的输出，不是完整总结。

它回答：

```text
现在有哪些线程？
每条线程到哪里了？
有没有快被忘掉的？
有没有需要用户确认的？
```

示例：

```markdown
# 当前线程截图｜15:40

## 1. PLA 产品形态
状态：正在定义产品边界  
最近判断：专注段低摩擦，整理段高结构  
未闭合：字段结构、自定义模板、快捷事件

## 2. 结构夹具
状态：挂起  
待办：问结构工程师水嘴局部压紧方案

## 3. 焊接样品 96/97
状态：待确认  
观察：参数记录可能有误

## 可能遗漏
- 前面提过 time audit 记录层，但还没有纳入结构设计。
```

---

## 8.5 Review Pack / 整理包

整理包是面向“一段时间”的输出。

它回答：

```text
过去这段发生了什么？
真正推进了哪些线？
形成了哪些判断？
有哪些待办？
哪些需要确认？
哪些可以丢弃？
之后从哪里接？
```

整理包可以是 structured text、markdown 文档、dashboard 页面或 UI review queue。

---

## 8.6 Ledger Commit / 正式落盘

Ledger Commit 是用户确认后的正式记录。

用户可以说：

```text
1/2/4 确认，3 先留着，5 丢掉。
```

系统执行：

```text
确认项 → 正式记录
待确认项 → 留在 buffer / draft
丢弃项 → 标记 ignored / discarded_candidate
```

---

## 8.7 Decision Record / 决策记录

记录决策是本产品的必要能力。

多线程工作者在工作中经常形成阶段性判断，但这些判断很容易散落在聊天、材料、截图、debug log、会议记录、代码提交说明里。如果不记录决策，用户后续会反复重新思考同一个问题，或者忘记当初为什么做出某个取舍。

Decision Record 用于记录：

```text
做出了什么判断？
为什么这样判断？
当时基于哪些材料？
排除了哪些选项？
这个决策是否仍需后续材料补充？
后续是否被修正、推翻或扩展？
```

建议结构：

```yaml
decision_record:
  id: string
  title: string
  decision: string
  context: string
  rationale: []
  alternatives_considered: []
  tradeoffs: []
  confidence: explicit | inferred_high | inferred_medium | inferred_low
  status: draft | confirmed | superseded | reversed | needs_more_evidence
  source_events: []
  linked_threads: []
  linked_materials: []
  followup_questions: []
  created_at: datetime
  updated_at: datetime
  supersedes: null | decision_id
  superseded_by: null | decision_id
```

### 决策的后续材料补充

用户可以在后续上传材料来补充某个决策，例如：

```text
把这个测试记录补充到“先不做屏幕监控，只做旁证 connector”这个决策下面。
```

或：

```text
这份 md 是当时为什么决定先做整理包的背景材料。
```

系统处理流程：

```text
用户上传材料
→ agent 摘要材料
→ 提取与决策相关的 facts / hypotheses / evidence / counter-evidence
→ 生成 Decision Patch
→ 用户确认
→ 更新 Decision Record
```

Decision Patch 必须区分：

```text
原始决策：当时已经确认的判断
新增证据：后续材料补充的信息
新增解释：对当时理由的补充理解
冲突证据：可能推翻或修正决策的内容
待确认问题：需要用户判断是否更新决策状态
```

示例：

```yaml
decision_patch:
  target_decision: "先不做屏幕监控，只做旁证 connector"
  new_evidence:
    - "用户多次提到工作发生在手机、纸面、脑内和外出场景，屏幕监控无法覆盖。"
  added_rationale:
    - "屏幕活动只能说明用户看过什么，不能说明用户为什么看、形成了什么判断。"
  counter_evidence: []
  suggested_status_change: null
  needs_user_confirmation: true
```

决策记录应进入长期记忆层中的 decision_history，但必须保留来源与版本，避免后续 agent 把演化后的理由误认为原始理由。

---

## 9. 快捷事件系统

## 9.1 背景

用户在微信多端登录、移动办公、临时打断、现场处理事务时，可能连打字都嫌麻烦。

因此，模块应支持“快捷事件定义”。

用户可以配置：

```text
快捷事件定义 + 绑定 emoji
```

一个快捷事件可绑定多个 emoji，但存在上限，以避免误触和歧义。

## 9.2 快捷事件定义

```yaml
quick_event_definition:
  id: string
  name: string
  description: string
  emojis: []
  max_emojis: 3
  event_kind: quick_event | interruption | note | todo | done | waiting
  default_action: buffer | create_event | mark_interruption | mark_waiting | mark_done
  ask_on_return: boolean
  require_confirmation: boolean
```

## 9.3 默认快捷事件建议

MVP 默认只建议两个：

```yaml
quick_events:
  - name: 临时中断
    emojis: ["🧷"]
    action: mark_interruption
    ask_on_return: true

  - name: 这个别丢
    emojis: ["📌"]
    action: buffer
    ask_on_return: false
```

高级用户可配置更多：

```yaml
examples:
  - name: 已完成
    emojis: ["✅"]
    action: create_done_candidate

  - name: 等反馈
    emojis: ["⏳"]
    action: mark_waiting

  - name: 之后整理
    emojis: ["🧹"]
    action: mark_review_candidate
```

## 9.4 临时中断流程

用户发：

```text
🧷
```

系统记录：

```yaml
event:
  kind: interruption
  event_time: now
  raw: "🧷"
  summary: "用户标记了一次临时中断"
  status: buffered
  meta:
    possible_current_threads: []
    ask_on_return: true
```

用户回来后说：

```text
回来了
```

系统返回：

```text
你 15:42 发了 🧷，我把那时标为一次临时中断。
我能确认的上下文是：当时正在讨论「专注段低摩擦输入」和「整理包」。
刚才临时发生的事要不要补一句？也可以略过。
```

注意：系统不应假装知道用户中断期间发生了什么。

---

## 10. 模式与状态机

本产品包含 5 种主要工作模式。

```text
1. Focus Capture｜专注捕捉
2. Thread Check｜线程校准
3. Interrupt Marker｜中断标记
4. Review Pack｜整理包
5. Ledger Commit｜确认落盘
```

## 10.1 Focus Capture｜专注捕捉

目标：低摩擦接住用户输入。

用户输入：

```text
这个字段少但维度多的点别丢
```

系统：

```text
记下了：字段少，但通过 thread / facet / meta 承载多维信息。
```

默认只确认，不展开。

## 10.2 Thread Check｜线程校准

目标：间歇性帮助用户确认当前线程认知，防止遗漏。

系统：

```text
我现在记到 5 条线。你不用展开，漏了就回关键词。
```

触发条件包括：

- 当前活跃线程过多
- 多条待确认碎片累积
- 用户多次使用“别丢”“之后补”等表达
- 用户长时间沉默后回归
- 到达用户设定的确认周期

## 10.3 Interrupt Marker｜中断标记

目标：用户用快捷事件标记中断，不必打字。

系统记录时间、上下文候选和可能关联线程。

## 10.4 Review Pack｜整理包

目标：在整理段生成结构化输出。

触发方式：

- 用户主动要求
- 周期提醒
- Dirty Buffer 达到阈值
- agent 判断线程过多
- 工作日结束
- 用户发送“整理”类快捷事件

## 10.5 Ledger Commit｜确认落盘

目标：让用户在高摩擦整理段确认、修改、批注、删除、归档。

---

## 11. Confirmation Budget：确认预算

为了适配不同用户，系统需要确认预算配置。

```yaml
confirmation_budget:
  mode: silent | light | balanced | active
  max_checks_per_focus_block: 0-3
  min_interval_minutes: 30-120
  thread_count_threshold: 4
  dirty_item_threshold: 8
  allow_risk_triggered_check: true
```

### silent 静默模式

只记，不问。

适合：高度专注、不希望被打扰的用户。

### light 轻确认模式

每一段较长专注时段最多轻确认一次。

### balanced 平衡模式

当线程过多、dirty buffer 过多、中断后回归时提醒。

### active 主动校准模式

适合容易断线或明确希望 agent 提醒的用户。

---

## 12. 最小可行动上下文开关

“回来继续”时，系统可以提供接线信息，但是否给下一步建议应可配置。

```yaml
resume_suggestion:
  mode: off | conservative | proactive
```

### off

不主动提供接线建议，只展示可确认事实。

### conservative 默认建议

只恢复事实与当前状态：

```text
上次停在：
- 你在讨论整理包和线程截图
- 已确定：专注段和整理段需要不同交互
- 待确认：emoji 中断是否作为快捷入口
```

### proactive

在上下文足够时给出下一步建议：

```text
可以从这里接：
- 先定义整理包模板
- 再定义快捷事件结构
```

默认建议：conservative。

---

## 13. 整理包模板与自定义

用户可以自定义整理包结构，但不应从复杂 schema editor 开始。

## 13.1 模板级自定义

预设模板：

```text
极简版
标准版
研究者版
创作者版
工程调试版
管理者个人版
```

### 极简版

```markdown
# 简版整理包
## 今天推进了什么
## 还挂着什么
## 待确认
## 明天从哪里接
```

### 标准版

```markdown
# 今日整理包
## 1. 主要线程
## 2. 已确定
## 3. 新增待办
## 4. 待确认
## 5. 可丢弃碎片
## 6. 明天可接
```

### 工程调试版

```markdown
# 工程调试整理包
## 1. 事实
## 2. 观察
## 3. 假设
## 4. 待验证
## 5. 风险
## 6. 下一步测试
## 7. 需要用户确认
```

### 创作者版

```markdown
# 创作整理包
## 1. 主题
## 2. 素材
## 3. 判断
## 4. 未完成表达
## 5. 可发展片段
## 6. 可丢弃想法
```

## 13.2 段落级自定义

用户可以指定固定段落：

```text
我的整理包里固定保留：
1. 今天推进了什么
2. 卡住了什么
3. 明天从哪里接
4. 不要再想什么
```

## 13.3 事件结构自定义

高级用户可以定义事件类型。

```yaml
custom_event_types:
  experiment_observation:
    fields:
      - sample_id
      - parameter
      - phenomenon
      - confidence
      - next_check
```

---

## 14. 归纳整理段的三种交互形态

用户在归纳整理段可以承受更高摩擦，因此模块应支持多种整理方式。

这三种方式不是互斥产品路线，而是一套整理阶梯。不同用户、不同工作负载、不同设备状态下，可以选择不同整理方式。

```text
微信窗口：最轻，适合短确认和少量补充。
.md 往返：中等摩擦，适合长文、批注、离线修改。
Review UI：最高能力，适合复杂整理、批量确认、note 补充和 dashboard 操作。
```

## 14.1 方式一：直接与微信窗口交互

适合轻量整理。

流程：

```text
agent 发送整理包摘要
→ 用户在微信中回复确认 / 修改 / 补充
→ agent 更新 draft
→ 用户确认落盘
```

优点：

- 无需切换工具
- 手机和电脑微信都可用
- 低门槛
- 适合疲惫状态下的短确认

限制：

- 长文编辑困难
- 批注不方便
- 多轮修订容易散
- 不适合复杂线程合并或大量材料补充

适合输出：

- 简版线程截图
- 今日短整理包
- 待确认问题列表
- “1/2/4 确认，3 待补充”式快速落盘

## 14.2 方式二：agent 发送 .md 文档，用户下载后修改 + 批注后发回

适合中等复杂整理。

流程：

```text
agent 生成 review_pack.md
→ 发送给用户
→ 用户下载、修改、批注
→ 用户发回 md
→ agent 读取变更和批注
→ agent 更新整理包和正式记录
```

md 文档应包含：

```markdown
# Review Pack
## 使用说明
## 待确认项
## 线程分组
## 今日判断
## 决策记录
## 新增待办
## 可丢弃内容
## 用户批注区
```

优点：

- 适合长内容
- 用户可离线修改
- markdown 对 agent 友好
- 可保留版本
- 适合补充决策背景、材料引用、批注和修正

限制：

- 文件来回传递有摩擦
- 移动端体验一般
- 需要处理版本差异和批注解析

适合输出：

- 阶段整理包
- 决策记录草稿
- 材料补全包
- 周整理包
- 可归档日志

## 14.3 方式三：拉起本地 / 公网 UI 服务，用户进行 note 补充与确认

适合深度整理。

流程：

```text
agent / 模块启动 review UI 服务
→ 配置端口映射或公网链接
→ 用户打开页面
→ 用户补充 note、确认、删除、合并、归档
→ 系统写回 ledger / buffer
```

UI 应支持：

- dirty buffer 列表
- 线程截图
- 整理包预览
- 决策记录编辑
- 决策材料补充
- 待确认项
- 用户 note 补充
- 批量确认 / 忽略
- 拖拽或选择归属线程
- 导出 md / JSON
- dashboard 预览
- 长期记忆查看、修正、删除

优点：

- 最适合复杂整理
- 可视化低负担
- 支持批注和批量操作
- 支持用户直接补充 note 和决策背景
- 适合 dashboard、长期记忆和线程归档操作

限制：

- 部署复杂
- 需要本地服务 / 端口 / 公网链接
- 安全与隐私边界要清楚
- 公网链接必须默认关闭或显式授权

## 14.4 整理方式选择策略

模块可以根据内容量和用户状态推荐整理方式：

```yaml
review_interaction_selector:
  wechat_inline:
    when:
      - dirty_items <= 8
      - decision_records <= 2
      - user_is_on_mobile
      - user_requested_short_summary
  md_roundtrip:
    when:
      - dirty_items > 8
      - long_text_needed
      - decisions_need_rationale
      - user_wants_annotation
  review_ui:
    when:
      - dirty_items > 20
      - multiple_threads_need_merge
      - many_decisions_or_materials
      - user_wants_dashboard_or_note_editing
```

系统推荐时应保持低压力：

```text
这次内容比较多。我可以先发微信短版；如果你要细改，我再生成 md 或拉起 review UI。
```

---

## 15. Dirty Buffer 触发策略

Dirty Buffer 不应频繁触发。

触发分为五类：

```text
用户主动触发
周期触发
风险触发
中断触发
边界触发
```

## 15.1 用户主动触发

用户说：

```text
整理一下今天
把临时记的拿出来
刚才那些帮我捋一下
生成整理包
```

## 15.2 周期触发

用户可设定：

```yaml
review_schedule:
  daily:
    enabled: true
    time: "22:30"
    output: daily_pack
  weekly:
    enabled: true
    day: "Friday"
    time: "16:00"
    output: weekly_thread_review
```

## 15.3 风险触发

条件示例：

```yaml
risk_triggers:
  active_thread_count_gt: 5
  dirty_item_count_gt: 12
  needs_clarification_count_gt: 4
  stale_active_thread_hours_gt: 24
```

触发后系统不一定发完整整理包，可以只发轻量线程截图。

## 15.4 中断触发

用户发送临时中断快捷事件，回来后系统询问是否补记。

## 15.5 边界触发

例如：

- 长时间沉默后回归
- 工作日结束
- 周末前
- 用户完成一段长对话
- 用户关闭某个工作段

---

## 16. 周期整理提醒

用户可设置不同整理节奏。

典型配置：

```yaml
review_preferences:
  daily_pack:
    enabled: true
    time: "22:30"
    format: short | standard | dashboard
  weekly_pack:
    enabled: true
    day: "Sunday"
    time: "16:00"
    format: thread_review
  dirty_buffer_digest:
    enabled: true
    threshold_items: 10
    threshold_age_hours: 24
```

不同用户推荐：

```text
高强度工作者：每天一次轻整理 + 每周一次深整理
创作者：每 2–3 天一次素材整理
研究者：每周一次 thread review
易断线用户：中途线程截图频率高一点
极简用户：只在主动要求时整理
```

---

## 17. 输出形态

## 17.1 纯文本短确认

用于专注段。

```text
记下了：字段少，但通过 meta 承载多维信息。
```

## 17.2 线程截图

用于轻量校准。

```markdown
# 当前线程截图
## 还开着
## 待确认
## 可能遗漏
```

## 17.3 整理包 structured text

用于微信窗口中直接阅读。

## 17.4 Markdown 文档

用于用户下载、修改、批注后回传。

## 17.5 Dashboard / Review UI

用于深度整理。

## 17.6 Agent-readable Export

用于后续 agent 接续：

```yaml
export:
  events: []
  threads: []
  dirty_buffer: []
  confirmed_records: []
  decisions: []
  open_loops: []
  reminders: []
  memory_items: []
```

---

## 17.7 长期记忆视图

长期记忆需要有用户可见视图，避免系统在后台悄悄形成错误理解。

最低限度应支持：

```text
查看：当前系统记住了哪些工作背景 / 偏好 / 常见线程
修改：用户直接改写某条记忆
删除：用户删除错误或不希望保留的记忆
禁用：某类记忆不再用于接线或整理
冲突提示：当新材料与旧记忆冲突时提醒用户
```

长期记忆视图可以优先放在 Review UI 中，微信端只提供摘要和快速修改入口。

示例：

```markdown
# 当前工作记忆

## 工作背景
- 用户正在探索一个可接入 cyberboss 的多线程工作记忆模块。
- 用户不希望产品被做成完整 Personal Ledger Agent。

## 交互偏好
- 专注段默认低打扰。
- 线程过多时允许轻量确认。
- 整理段可以承受高摩擦输入。

## 常见线程
- Work Memory Compiler 产品形态
- Cyberboss / timeline-for-agent 改造
- 自动化焊接研发

## 待复查记忆
- “resume suggestion 默认 conservative”是否仍然成立。
```

---

## 18. 典型 Storyboard

## 18.1 专注段：用户只丢碎片

用户：

```text
小看板这个词不对，用户不会这么用，之后整理。
```

系统：

```text
记下了：小看板作为用户侧概念可能不自然，之后整理。
```

不追问，不展开。

---

## 18.2 线程过多：agent 轻量校准

系统：

```text
我现在记到 6 条未闭合线索，其中 3 条今天还没处理：
- 快捷事件定义
- 整理包模板
- time audit 记录层

你不用展开，漏了就回一个关键词。
```

---

## 18.3 临时中断：emoji 快捷事件

用户：

```text
🧷
```

系统：

```text
已标记 15:42 临时中断。回来后我可以帮你接上。
```

用户回来：

```text
回来了
```

系统：

```text
你 15:42 发了 🧷，我把那时标为一次中断。
当时可确认的上下文是：快捷事件、线程截图、整理包模板。
刚才临时发生的事要不要补一句？也可以略过。
```

---

## 18.4 归纳整理段：微信内整理

用户：

```text
把今天临时记的东西拿出来。
```

系统：

```markdown
# 今日临时整理包

## 1. 产品定位
已确定：这是有记录层的多线程工作记忆卸载器，不是完整 Personal Ledger Agent。

## 2. 新增机制
- confirmation budget
- 快捷事件定义 + emoji 绑定
- 线程截图
- 整理包模板

## 3. 待确认
- 默认整理周期是 daily 还是用户主动？
- resume suggestion 默认是否 conservative？

## 4. 可落盘
1/2/3 可作为 PRD 核心章节。
```

用户：

```text
1/2/3确认，整理周期先设为用户配置。
```

系统：

```text
已确认，整理周期默认改为用户配置。
```

---

## 18.5 归纳整理段：md 往返

系统发送：

```text
我生成了 review_pack_2026-05-01.md，你可以下载后直接修改或批注，发回来我会继续整理。
```

用户回传 md。

系统：

```text
我读到了 5 处修改和 3 条批注：
- 你把“小看板”改成“线程截图”
- 你新增了“快捷事件定义”
- 你要求整理周期可配置

我已更新 draft，是否写入正式 PRD？
```

---

## 18.6 归纳整理段：UI 深整理

系统：

```text
整理内容较多，我可以拉起一个 review UI。你可以在页面里补 note、确认、删除和合并线程。
```

用户打开 UI，完成整理。

系统：

```text
已根据 UI 操作更新：
- 9 条 dirty items 已确认
- 3 条保留待补充
- 2 条丢弃
- 生成今日整理包和线程截图
```

---

## 19. 配置项

```yaml
user_config:
  confirmation_budget:
    mode: balanced
    max_checks_per_focus_block: 1
    min_interval_minutes: 60
    thread_count_threshold: 5

  resume_suggestion:
    mode: conservative

  quick_events:
    max_total_events: 8
    max_emojis_per_event: 3
    definitions: []

  review_schedule:
    daily_pack:
      enabled: true
      time: "22:30"
      format: short
    weekly_pack:
      enabled: false
      day: "Sunday"
      time: "16:00"
      format: thread_review

  review_pack_template:
    preset: standard
    custom_sections: []

  decision_records:
    enabled: true
    auto_detect_decisions: true
    require_confirmation_for_inferred_decisions: true
    allow_material_patches: true

  long_term_memory:
    enabled: true
    default_write_policy: confirmed_only
    allow_inferred_memory: true
    inferred_memory_requires_review: true
    memory_review_interval: monthly
    user_can_delete: true
    conflict_policy: ask_user

  interaction_modes:
    wechat_inline: true
    md_roundtrip: true
    review_ui: false
```

---

## 20. 非目标

v0.1 不做：

- 替用户做复杂项目推进
- 自动判断复杂优先级
- 替用户安排团队任务
- 严格工时统计
- 高频屏幕监控
- 自动窥探用户电脑活动
- 把微信消息自动解释成人格/情绪状态
- 把所有 dirty buffer 自动写入正式记录
- 把所有 agent 推断自动写入长期记忆
- 在没有来源和置信度的情况下记住用户倾向
- 要求用户维护传统看板
- 默认给很多下一步建议

---

## 21. MVP 范围

## v0.1：微信入口 + Dirty Buffer + 快捷事件 + 整理包

目标：验证用户是否愿意把碎片丢给模块，并在整理段使用整理包。

功能：

- 微信内低摩擦记录
- Dirty Buffer
- Event 基础结构
- Thread 基础识别
- Decision Record 基础结构
- 快捷事件定义，至少支持 2 个默认 emoji
- 轻量线程截图
- 手动触发整理包
- 用户确认 / 忽略 / 待补充
- 简单 markdown 导出
- 最小长期记忆：仅记录用户明确确认的工作背景和交互偏好

不做：

- UI 服务
- 高级自定义 schema
- 自动屏幕监控
- 完整 dashboard

## v0.2：确认预算 + 周期整理 + md 往返

功能：

- confirmation budget
- 周期整理提醒
- md 文档生成
- 用户修改 / 批注后回传
- agent 读取 md 变更
- 整理包模板
- conservative resume mode
- Decision Patch：用户上传材料后补充决策背景
- 长期记忆 review：用户可查看 / 修改 / 删除记忆摘要

## v0.3：Review UI + 高级配置

功能：

- 本地 / 公网 review UI
- 端口配置 / 公网链接
- note 补充
- 批量确认 / 丢弃 / 合并
- 决策记录编辑与材料补充
- 长期记忆管理视图
- 自定义事件结构
- dashboard 视图
- agent-readable export

---

## 22. 成功标准

## 22.1 专注段成功标准

- 用户愿意发送低质量碎片。
- 用户不觉得 agent 打扰。
- 用户无需每次切换都汇报。
- emoji 快捷事件比打字更低摩擦。
- 系统不会因上下文不足而过度推断。

## 22.2 工作记忆成功标准

- 系统能识别当前多个线程。
- 系统能在合适时机提醒可能遗漏的线程。
- 用户通过线程截图能快速恢复“现在挂着什么”。
- 中断标记能帮助用户事后补记。

## 22.3 整理段成功标准

- 用户闲下来时，整理包已经完成 70% 预处理。
- 用户只需要确认、修正、补充，而不是从零整理。
- 整理包能区分事实、推测、待确认、可丢弃。
- 用户可以通过微信、md 或 UI 三种方式完成整理。

## 22.4 记录层成功标准

- 系统保留足够 time audit 信息。
- 用户可以回看某天 / 某段时间发生了什么。
- 用户可以知道某条线程上次在哪里被触碰。
- 系统不会把记录层变成高压工时统计。

## 22.5 产品体验成功标准

- 用户感觉“工作时不用维护系统”。
- 用户感觉“整理时系统已经帮我做了大半”。
- 用户更少丢失线程进度。
- 用户能在疲惫时通过低负担输出理解今天发生了什么。
- 用户愿意持续使用至少 7 天。

## 22.6 决策记录成功标准

- 系统能识别用户明确形成的决策。
- 决策记录能保留当时上下文、理由、取舍和来源。
- 用户后续上传材料时，系统能生成 Decision Patch，而不是把新增材料混入原始决策。
- 系统能标记决策被补充、修正、推翻或替代。

## 22.7 长期记忆成功标准

- 系统能逐渐减少用户重复解释工作背景的次数。
- 系统能记住用户确认过的交互偏好、常见线程、术语和材料索引。
- 系统不会把单次碎片或未经确认的推测直接固化为长期记忆。
- 用户能查看、修改、删除长期记忆。
- 当长期记忆与新材料冲突时，系统能提示用户复查。

---

## 23. 风险与反模式

## 23.1 过度主动

风险：agent 频繁总结、频繁追问、频繁解释，破坏专注。

对策：confirmation budget + 默认短确认。

## 23.2 过度推断

风险：agent 上下文不足，却给出不可靠建议。

对策：事实 / 推测 / 待确认分层；resume suggestion 可关闭。

## 23.3 结构过重

风险：产品变成另一个项目管理系统。

对策：用户侧只暴露自然语言、快捷事件、整理包；复杂 schema 留在后台。

## 23.4 Dirty Buffer 堆积

风险：临时记忆变成垃圾场。

对策：周期整理、风险触发、可丢弃候选、整理包。

## 23.5 隐私与安全

风险：本地 UI、公网链接、微信材料、工作内容涉及隐私。

对策：local-first；公网链接默认关闭；导出前提示；访问 token；过期链接。

---

## 24. 一句话总结

**有记录层的多线程工作记忆卸载器** 是一个接入 agent / cyberboss 的认知负载缓冲模块。

它允许用户在专注工作时用低摩擦方式丢碎片、发 emoji、补一句话；系统负责记录时间、暂存低质输入、识别线程、轻量校准、生成线程截图和整理包；当用户进入归纳整理段时，再通过微信、markdown 往返或 review UI，让用户确认、批注、归档和继续。

它的核心不是替用户管理项目，而是：

> **让用户在工作时少维护，在整理时少重建，在回来时少丢线。**

