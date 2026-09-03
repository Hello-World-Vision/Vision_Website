---
title: "OpenCode 使用教学"
description: "OpenCode (AI Agent) 辅助开发标准操作规范 —— 工程定位、无效沟通规避与强制使用纪律。"
author: "Cicada"
date: 2026-08-10
tags: ["OpenCode", "AI Agent", "开发规范"]
status: done
draft: false
---

> **适用对象：RoboMaster 视觉组全体新成员。**
>
> **责任原则：机器上的代码由工程师全权负责。Agent 仅是辅助排错与提效的命令行工具，不是代码责任主体。**
>
> 文中"必须""严禁""禁止""不得"均为强制条款。违反本规范产生的代码缺陷、构建故障和赛场事故，由代码提交者本人承担责任。

## 1. Agent 工具的工程定位和基础概念

### 1.1 视频材料

- 视频：[《从 LLM 到 Agent Skill，一期视频带你打通底层逻辑！》](https://www.bilibili.com/video/BV1E7wtzaEdq)
- BV 号：`BV1E7wtzaEdq`

**观看该视频的目的：理解从 LLM 到 Agent Skill 的完整概念链路。**

该视频的核心价值在于串联以下概念，建立系统化的 Agent 认知：

- **LLM / Token**：模型如何接收和处理文本；
- **Context / Context Window**：模型在一个会话中能够接触到多少信息，为什么窗口有限；
- **Prompt（User Prompt / System Prompt）**：工程师如何通过文字指令定义 Agent 的行为和任务边界；
- **Tool Calling**：Agent 如何请求执行本地工具（读文件、搜索代码、运行命令、修改文件），从而与本地工程发生实际交互；
- **MCP（Model Context Protocol）**：工具与模型之间的标准化通信协议；
- **Agent / Agent Skill**：如何将上述概念组合成一个可复用的、面向特定任务的工程单元。

不要求通过该视频学习 OpenCode 的具体操作或配置。观看后必须能够解释：为什么 Agent 需要 Context；Tool Calling 如何让 Agent 与你的本地工程发生交互；这些概念如何层层递进，构成一个完整的 Agent 系统。

### 1.2 无效工程沟通

以下提问一律视为无效工程沟通：

```text
代码崩了，帮我修。
```

```text
OpenCV 链接不上，怎么办？
```

```text
这段代码为什么不工作？
```

无效原因：

- 没有源码；
- 没有构建文件；
- 没有完整报错；
- 没有复现步骤；
- 没有运行环境；
- 没有说明预期行为与实际行为。

**缺失 Context 的提问，本质上是要求 Agent 猜测工程事实。严禁以猜测代替排错。**

### 1.3 Tool Calling 的工程含义

工具调用是 Agent 与本地工程发生实际交互的机制。常见工具动作包括：

- 读取源码；
- 搜索符号和调用位置；
- 检查编译诊断；
- 执行 CMake、测试或调试命令；
- 修改文件；
- 查看 Git 差异。

Agent 的文字回复不等于工程事实。只有经过工具检查后，Agent 才可能知道当前机器上的真实状态。

每次工具调用都必须满足以下要求：

- 工程师能够说明该工具为什么需要执行；
- 执行命令与当前问题直接相关；
- 高风险命令必须经过人工确认；
- 命令输出必须作为证据保留；
- 修改后必须重新编译、测试和运行。

### 1.4 Agent 的工程定位

> **Agent 是调试器、检索器、命令执行协调器和代码审查辅助工具，不是代码代写工具。**

Agent 可以：

- 协助定位错误；
- 检索调用链；
- 生成修复候选方案；
- 解释编译器和链接器输出；
- 协助执行测试；
- 检查修改后的差异。

Agent 不可以替代：

- 工程师对算法的理解；
- 工程师对生命周期和所有权的判断；
- 工程师对实时性、线程安全和硬件边界的判断；
- 工程师的代码审查；
- 工程师对最终二进制文件的责任。

## 2. 核心规约：实操意识与边界控制

RoboMaster 的工程目标不是"把代码跑起来"，而是设计并制造一辆在赛场上稳定、可靠、性能优秀的机器人。Agent 可以帮助你更快地定位 bug，但它不能替代你对算法、系统和控制的理解。

如果你不理解自己正在调用的算法在做什么——它是如何利用图像信息做决策的，它对噪声、光照、遮挡的容忍度如何——那么无论 Agent 帮你生成多少版代码，你都调试不出一辆能在赛场上稳定运行的车。代码可以跑，车不可以瞎跑。

Agent 给出的代码只是候选方案，不是标准答案。它不知道你的相机参数、你的底盘动力学、你的赛场环境。你必须理解它写的代码逻辑是怎么样的，必须能向任何一名队员解释你的代码在做什么、为什么这样做、在什么情况下会失效。

> **打 RM 的目的是搞懂，是设计出一辆稳定、优秀的车子，而不是用 Agent 去应付。开发者本身对算法思路不理解，必然无法调试出一个优秀的机器人。**

代码一旦合入仓库并在实车上运行，所有后果——包括编译错误、运行时崩溃、赛场上失控——全部由提交者承担。Agent 不替你承担责任。编译器不替你承担责任。模型输出不是免责声明。

## 3. 环境部署：OpenCode CLI 安装指南

> 官方文档：[https://opencode.ai/docs/](https://opencode.ai/docs/)

安装前确认 Node.js（[https://nodejs.org/](https://nodejs.org/)）或 Bun（[https://bun.sh/](https://bun.sh/)）已安装并可用，或者你也可以选择用opencode官方推荐的`curl`命令安装。以下三种安装方式选择一种，不可同时使用。

```bash
# 使用 npm 全局安装 OpenCode CLI（前置条件：系统中已安装 Node.js 和 npm）
npm install -g opencode-ai
```
或
```bash
# 使用 bun 全局安装 OpenCode CLI（前置条件：系统中已安装 Bun）
bun install -g opencode-ai
```
或
```bash
# 使用 curl 获取安装脚本，可以实现前两种安装方式没有的启动时自动更新
curl -fsSL https://opencode.ai/install | bash
```

```bash
# 验证 OpenCode 是否安装成功，如安装正确则输出版本号
opencode --version
```

```bash
# 启动 OpenCode TUI 交互界面
opencode
```

## 4. UI 界面与交互规范

### 4.1 主 Agent 切换

在 TUI 中：

- 按 `Tab` 正向切换主 Agent；
- 按 `Shift+Tab` 反向切换主 Agent；
- 操作前必须确认当前 Agent；
- 不得在职责不明确时直接授权修改代码。

角色切换不是装饰性操作。不同 Agent 的职责、工具和权限不同。执行任务前必须确认当前模式是否与目标一致。

> [!TIP]
> opencode自带的主agent只有plan和build，随着使用的深入，你可以自定义自己的主agent,为它配置指定的子agent和权限，并给它一份自己的提示词。具体操作你可以在官方文档中的[这个位置](https://opencode.ai/docs/zh-cn/agents/#%E9%85%8D%E7%BD%AE)看到。

### 4.2 命令面板

按 `Ctrl+P` 打开命令面板。

使用命令面板时必须：

- 先查看命令名称与作用；
- 不凭记忆执行不熟悉的命令；
- 不将命令面板与斜杠命令混淆；
- 高风险操作执行前再次核对。

### 4.3 斜杠命令

在输入框中输入 `/`，打开斜杠命令列表。

斜杠命令与 `Ctrl+P` 命令面板不是同一入口：

- `/`：在消息输入区域选择斜杠命令；
- `Ctrl+P`：打开 TUI 命令面板。

不得根据过时教程背诵命令。必须以当前客户端实际显示的命令列表为准。

### 4.4 文件上下文

引用源码时使用：

```text
@CMakeLists.txt
@src/armor_detector.cpp
@include/armor_detector.hpp
```

引用后仍须明确任务：

```text
读取这些文件，先说明目标之间的调用关系，再分析链接错误。不要直接修改。
```

禁止只发送文件名而不说明问题。文件引用只解决"Agent 能看到什么"，不能替代"工程师想解决什么"。

> [!TIP]
> 你可能会在使用时发现在文字后直接跟上@不会出现文件给你选择，这时候你只需要打个空格就可以了。以前的opencode还出现过@后要跟一个单引号才能检索到文件的小问题，现在应该没有了。

### 4.5 AGENTS.md

`AGENTS.md` 用于记录项目级工程规则，其内容会进入 Agent 的上下文。

视觉组项目中的 `AGENTS.md` 至少应明确：

- C++ 标准与编译器要求；
- 格式化和静态检查规则；
- CMake 目标组织方式；
- OpenCV 使用约束；
- ROS 包、节点、话题和坐标系规范；
- 禁止修改的硬件接口；
- 测试和构建命令；
- Git 操作边界；
- 实时性和线程安全要求；
- 允许使用的工具与高风险命令。

新人必须先阅读项目 `AGENTS.md`，再启动 Agent。不得让 Agent 在不了解战队规范的情况下修改代码。

指定参考：

- 仓库：[ForceInjection/opencode-practise](https://github.com/ForceInjection/opencode-practise)
- 深度说明：[opencode_deep_dive.md](https://github.com/ForceInjection/opencode-practise/blob/main/opencode_deep_dive.md)
- 示例文件：[AGENTS.md](https://github.com/ForceInjection/opencode-practise/blob/main/AGENTS.md)

> 上述 `AGENTS.md` 是 Python 示例项目的规则文件，只能用于观察结构和表达方式。不建议将其内容直接复制到 RoboMaster 视觉项目。不同项目的约束条件不同，你应当根据自己项目的实际需求整理规则，让 Agent 生成 `AGENTS.md` 后再逐项检查是否符合预期。

## 5. API 接入：第三方大模型配置标准

> 配置文件的写法、API Key 的申请步骤、环境变量的设置细节，网上已有大量比本文档更详细、更及时的教程。本节以索引外部优质资源为主，不重复撰写操作步骤。

### 5.1 建议读取的资源
1. **菜鸟教程：OpenCode 接入 DeepSeek（实操）**
   https://m.runoob.com/opencode/opencode-deepseek.html
   作用：从申请 API Key 到写入配置文件到启动验证，完整的端到端操作流程。
   建议：跟随教程逐步操作。如果教程中的命令与当前客户端行为不一致，以客户端实际提示为准。

2. **CSDN：OpenCode 安装与配置详解（可以直接操作）**
   https://blog.csdn.net/qq_43462019/article/details/157034844
   作用：补充环境变量设置、常见报错排查、多 Provider 共存等实际场景。
   建议：配置第三方API时可以参考，不用通篇阅读。

### 5.2 配置文件位置

全局配置：`~/.config/opencode/opencode.json`

项目配置：`./opencode.json`（可进入仓库，但不得包含明文密钥）

> OpenCode 配置在启动时加载。修改配置后，必须完全退出并重新启动 OpenCode。

> [!TIP]
> 或许你会发现你的配置文件是`opencode.jsonc`，这不是问题，jsonc意为**JSON with Comments**，即允许注释的json文件，不需要特意把它改成json.

### 5.3 提醒

**严禁在任何配置文件中写入明文 API Key。**
**严禁将 API Key 提交到 Git 仓库。**
**密钥一旦泄露，必须立即吊销并重新生成。**

### 5.4 配置验收

完成配置后必须检查：

- OpenCode 能否正常启动；
- 当前模型是否为配置的模型；
- API Key 是否未出现在 Git 差异中；
- 重启后配置是否仍然生效。

若配置失败，必须保留启动错误全文。禁止反复修改字段碰运气。

## 6. 技术手册：外部知识库索引

### 6.1 Context 与 Tool 认知材料

- 链接：[《从 LLM 到 Agent Skill，一期视频带你打通底层逻辑！》](https://www.bilibili.com/video/BV1E7wtzaEdq)
- 作用定位：用于理解从 LLM、Token、Context、Tool Calling、MCP 到 Agent Skill 的完整概念链路。
- 阅读指令：入组初期完整观看一次。观看后必须能够解释"Agent 为什么需要工程上下文"和"工具调用如何取得本地证据"。不得将视频内容直接当作 OpenCode 操作规范。

### 6.2 OpenCode 实战参考

- 链接：[ForceInjection/opencode-practise](https://github.com/ForceInjection/opencode-practise)
- 作用定位：第三方维护的 OpenCode 实战演示仓库，用于观察基本工作流、配置组织和交互方式。
- 阅读指令：只阅读与当前操作直接相关的目录和示例。不得把仓库内容整体复制到视觉项目。仓库内容与当前 OpenCode 行为冲突时，以当前客户端和官方文档为准。

### 6.3 交互与工作流说明

- 链接：[opencode_deep_dive.md](https://github.com/ForceInjection/opencode-practise/blob/main/opencode_deep_dive.md)
- 作用定位：补充说明 TUI、Agent、工具和工作流概念。
- 阅读指令：仅在不理解角色切换、工具调用或工作流时定向阅读对应章节。不得通篇照搬其中的版本细节、权限描述或内部实现结论。

### 6.4 AGENTS.md 示例

- 链接：[AGENTS.md](https://github.com/ForceInjection/opencode-practise/blob/main/AGENTS.md)
- 作用定位：观察项目规则文件的结构、粒度和表达形式。
- 阅读指令：只学习"如何组织规则"，不得复制具体规则。该文件服务于 Python 示例项目，不适用于 C++、OpenCV、CMake、ROS 或 RoboMaster 视觉工程。

### 6.5 外部工具手册, 字典和概念索引

- 链接：[https://book.zyh.lol/](https://book.zyh.lol/)
- 作用定位：第三方"工具手册"和"字典"，不是 OpenCode 官方文档，也不是战队规范。
- 阅读指令：**不建议从头到尾通篇阅读，效率太低。使用 Agent 的目的是提高开发效率，不是增加阅读负担。**
#### 建议阅读：
- https://book.zyh.lol/00-what-is-ai-agent/ 这个里面的内容是非常详细的

在以下场景建议进入该网站定向检索：

1. 需要自定义高级 Agent Skill；
2. 遇到复杂提示词工程瓶颈，现有规范无法解决；
3. 对 Agent 开发中的某个概念或机制想获得更深入的理解。

检索时必须带着明确问题进入。例如：

```text
如何定义一个仅在 CMake 链接错误时触发的 Skill？
```

```text
如何限制 Agent 在视觉项目中只能读取、不能修改相机驱动目录？
```

禁止进行没有目标的浏览。禁止把第三方手册中的示例直接视为战队标准。

> **技术可以迭代，责任不能外包。进入仓库的每一行代码、生成的每一个二进制文件、赛场上的每一次故障，责任人都是工程师本人。**

### 小拓展
在掌握以上基础内容后，你会在工程实践中发现opencode存在各种功能上的不足（或者你只是想让它变好看一点），这时候你就需要去尝试各种插件、MCP或者skill了。官方文档里有[专门的一章](https://opencode.ai/docs/zh-cn/ecosystem/)简介了一些项目，里面有一些好用的东西，也有一些长期没维护已经似了：（。在你需要某个特定功能的插件时，可以直接让AI通过它的联网搜索能力帮你查找，顺便检查仓库状态，以免随便装了一个好久没维护甚至不兼容的东西。此外，你也可以自行探索其他的harness,比如 claudecode、dsh、pi等。