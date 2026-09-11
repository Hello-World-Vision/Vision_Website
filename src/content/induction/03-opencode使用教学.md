---
title: "OpenCode 使用教学"
description: "OpenCode (AI Agent) 辅助开发标准操作规范 —— 工程定位、有效沟通、安装配置、TUI 交互与外部资料索引。"
author: "Cicada"
date: 2026-08-10
tags: ["OpenCode", "AI Agent", "开发规范"]
status: done
draft: false
---

> **适用对象：RoboMaster 视觉组全体新成员。**
>
> **责任原则：机器上的代码由工程师全权负责。Agent 是辅助排错与提效的命令行工具，不是代码责任主体。**
>
> 文中"必须""严禁""禁止""不得"均为强制条款。违反本规范产生的代码缺陷、构建故障和赛场事故，由代码提交者本人承担责任。

## 1. Agent 工具的工程定位和基础概念

### 1.1 视频材料

- 视频：[《从 LLM 到 Agent Skill，一期视频带你打通底层逻辑！》](https://www.bilibili.com/video/BV1E7wtzaEdq)
- BV 号：`BV1E7wtzaEdq`

观看该视频的目的是理解从 LLM 到 Agent Skill 的完整概念链路。视频串联以下概念，帮助你建立系统化的 Agent 认知：

- **LLM / Token**：模型如何接收和处理文本；
- **Context / Context Window**：模型在一个会话中能够接触到多少信息，为什么窗口有限；
- **Prompt（User Prompt / System Prompt）**：工程师如何通过文字指令定义 Agent 的行为和任务边界；
- **Tool Calling**：Agent 如何请求执行本地工具（读文件、搜索代码、运行命令、修改文件），从而与本地工程发生实际交互；
- **MCP（Model Context Protocol）**：工具与模型之间的标准化通信协议；
- **Agent / Agent Skill**：如何将上述概念组合成一个可复用的、面向特定任务的工程单元。

不要求通过该视频学习 OpenCode 的具体操作或配置。入组初期完整观看一次即可。观看后你必须能够解释：Agent 为什么需要 Context；Tool Calling 如何让 Agent 与本地工程发生交互；这些概念如何层层递进，构成一个完整的 Agent 系统。

### 1.2 有效的工程沟通

以下提问都是无效的工程沟通：

```text
代码崩了，帮我修。
```

```text
OpenCV 链接不上，怎么办？
```

```text
这段代码为什么不工作？
```

它们无效，是因为缺少 Agent 排错所需的事实：

- 没有源码；
- 没有构建文件；
- 没有完整报错；
- 没有复现步骤；
- 没有运行环境；
- 没有说明预期行为与实际行为。

缺失 Context 的提问，本质上是要求 Agent 猜测工程事实。严禁以猜测代替排错。提问时应提供相关源码、构建配置、完整报错和复现步骤，并说明你期望的行为和实际发生的行为。

### 1.3 Tool Calling 的工程含义

工具调用是 Agent 与本地工程发生实际交互的机制。常见的工具动作包括：

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

### 1.4 Agent 的能力边界

Agent 是调试器、检索器、命令执行协调器和代码审查辅助工具，不是代码代写工具。

Agent 可以：

- 协助定位错误；
- 检索调用链；
- 生成修复候选方案；
- 解释编译器和链接器输出；
- 协助执行测试；
- 检查修改后的差异。

Agent 不能替代：

- 工程师对算法的理解；
- 工程师对生命周期和所有权的判断；
- 工程师对实时性、线程安全和硬件边界的判断；
- 工程师的代码审查；
- 工程师对最终二进制文件的责任。

## 2. 核心规约：实操意识与边界控制

RoboMaster 的工程目标不是把代码跑起来，而是设计并制造一辆在赛场上稳定、可靠、性能优秀的机器人。Agent 可以帮你更快定位 bug，但它不能替代你对算法、系统和控制的理解。

如果你不理解自己正在调用的算法在做什么——它如何利用图像信息做决策，它对噪声、光照、遮挡的容忍度如何——那么无论 Agent 帮你生成多少版代码，你都难以调试出一辆能在赛场上稳定运行的车。

Agent 给出的代码是候选方案，不是标准答案。它不知道你的相机参数、底盘动力学和赛场环境。你必须理解它写的代码逻辑，并且能够向任何一名队员解释：你的代码在做什么、为什么这样做、在什么情况下会失效。开发者若不理解算法思路，就无法调试出一个可靠的机器人。

代码一旦合入仓库并在实车上运行，编译错误、运行时崩溃、赛场失控等后果都由提交者承担。Agent、编译器和模型输出都不构成免责依据。

## 3. 环境部署：OpenCode CLI 安装指南

> 官方文档：[https://opencode.ai/docs/](https://opencode.ai/docs/)

安装前确认 Node.js（[https://nodejs.org/](https://nodejs.org/)）或 Bun（[https://bun.sh/](https://bun.sh/)）已安装并可用；你也可以使用 OpenCode 官方推荐的 `curl` 脚本安装。以下三种方式选择一种，不要同时使用。

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
# 使用 curl 获取安装脚本，可以实现前两种方式没有的启动时自动更新
curl -fsSL https://opencode.ai/install | bash
```

安装完成后，验证版本并启动：

```bash
# 验证 OpenCode 是否安装成功，安装正确会输出版本号
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
- 操作前确认当前 Agent；
- 职责不明确时，不要直接授权修改代码。

不同 Agent 的职责、工具和权限不同。执行任务前必须确认当前模式与目标一致。

> [!TIP]
> OpenCode 自带的主 Agent 只有 plan 和 build。随着使用深入，你可以自定义主 Agent，为它配置指定的子 Agent、权限和提示词。具体操作见官方文档的[这个位置](https://opencode.ai/docs/zh-cn/agents/#%E9%85%8D%E7%BD%AE)。

### 4.2 命令面板

按 `Ctrl+P` 打开命令面板。使用时必须：

- 先查看命令名称与作用；
- 不凭记忆执行不熟悉的命令；
- 不把命令面板与斜杠命令混淆；
- 高风险操作执行前再次核对。

### 4.3 斜杠命令

在输入框中输入 `/`，打开斜杠命令列表。它与 `Ctrl+P` 命令面板不是同一入口：

- `/`：在消息输入区域选择斜杠命令；
- `Ctrl+P`：打开 TUI 命令面板。

不要根据过时教程背诵命令，以当前客户端实际显示的命令列表为准。

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

不要只发送文件名而不说明问题。文件引用只解决 Agent 能看到什么，不能替代工程师想解决什么。

> [!TIP]
> 如果在文字后直接跟 `@` 没有弹出文件供你选择，打一个空格即可。早期版本还出现过 `@` 后要跟单引号才能检索到文件的问题，现在一般已经修复。

### 4.5 AGENTS.md

`AGENTS.md` 用于记录项目级工程规则，其内容会进入 Agent 的上下文。视觉组项目的 `AGENTS.md` 至少应明确：

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

新人必须先阅读项目 `AGENTS.md`，再启动 Agent。不要让 Agent 在不了解战队规范的情况下修改代码。

可参考的示例仓库：

- 仓库：[ForceInjection/opencode-practise](https://github.com/ForceInjection/opencode-practise)，用于观察基本工作流、配置组织和交互方式。
- 深度说明：[opencode_deep_dive.md](https://github.com/ForceInjection/opencode-practise/blob/main/opencode_deep_dive.md)，在不理解角色切换、工具调用或工作流时定向阅读对应章节。
- 示例文件：[AGENTS.md](https://github.com/ForceInjection/opencode-practise/blob/main/AGENTS.md)，用于观察规则文件的结构和表达形式。

> 上述示例服务于 Python 项目，只能用于观察结构和表达方式，不适用于 C++、OpenCV、CMake、ROS 或 RoboMaster 视觉工程。不要把仓库内容整体复制到视觉项目；应根据自己项目的实际需求整理规则，让 Agent 生成 `AGENTS.md` 后再逐项检查是否符合预期。仓库内容与当前 OpenCode 行为冲突时，以当前客户端和官方文档为准。

## 5. API 接入：第三方大模型配置标准

> 配置文件的写法、API Key 的申请步骤和环境变量的设置细节，网上已有比本文更详细、更及时的教程。本节以索引外部资源为主，不重复撰写操作步骤。

### 5.1 建议阅读的资源

1. **菜鸟教程：OpenCode 接入 DeepSeek（实操）**
   - 链接：https://m.runoob.com/opencode/opencode-deepseek.html
   - 作用：从申请 API Key、写入配置文件到启动验证的完整流程。
   - 建议：跟随教程逐步操作。命令与当前客户端行为不一致时，以客户端实际提示为准。

2. **CSDN：OpenCode 安装与配置详解**
   - 链接：https://blog.csdn.net/qq_43462019/article/details/157034844
   - 作用：补充环境变量设置、常见报错排查和多 Provider 共存等场景。
   - 建议：配置第三方 API 时按需查阅，不必通篇阅读。

### 5.2 配置文件位置

- 全局配置：`~/.config/opencode/opencode.json`
- 项目配置：`./opencode.json`（可进入仓库，但不得包含明文密钥）

> OpenCode 配置在启动时加载。修改配置后，必须完全退出并重新启动 OpenCode。

> [!TIP]
> 如果你的配置文件是 `opencode.jsonc` 也没有问题。jsonc 意为 **JSON with Comments**，即允许注释的 JSON 文件，不需要特意改成 `json`。

### 5.3 密钥安全

- 严禁在任何配置文件中写入明文 API Key。
- 严禁将 API Key 提交到 Git 仓库。
- 密钥一旦泄露，必须立即吊销并重新生成。

### 5.4 配置验收

完成配置后必须检查：

- OpenCode 能否正常启动；
- 当前模型是否为配置的模型；
- API Key 是否未出现在 Git 差异中；
- 重启后配置是否仍然生效。

配置失败时，必须保留启动错误全文，不要反复修改字段碰运气。

## 6. 外部工具手册与概念索引

除前面章节给出的官方文档、视频和示例仓库外，还有一份第三方的工具手册和概念字典可供查阅：

- 链接：[https://book.zyh.lol/](https://book.zyh.lol/)
- 定位：第三方"工具手册"和"字典"，不是 OpenCode 官方文档，也不是战队规范。
- 建议入口：[什么是 AI Agent](https://book.zyh.lol/00-what-is-ai-agent/) 一节内容较为详细。

这份手册不建议从头通篇阅读。使用 Agent 的目的是提高开发效率，而不是增加阅读负担。在以下场景带着明确问题定向检索：

1. 需要自定义高级 Agent Skill；
2. 遇到复杂的提示词工程瓶颈，现有规范无法解决；
3. 想更深入理解 Agent 开发中的某个概念或机制。

检索时应带着具体问题进入，例如：

```text
如何定义一个仅在 CMake 链接错误时触发的 Skill？
```

```text
如何限制 Agent 在视觉项目中只能读取、不能修改相机驱动目录？
```

不要进行没有目标的浏览，也不要把第三方手册中的示例直接当作战队标准。技术会不断迭代，但进入仓库的每一行代码、生成的每一个二进制文件和赛场上的每一次故障，责任人都是工程师本人。

## 7. 进阶探索

掌握以上基础内容后，你会在实践中发现 OpenCode 存在一些功能上的不足，或者只是想让它更好看一些，这时可以尝试各种插件、MCP 或 Skill。官方文档有[专门的一章](https://opencode.ai/docs/zh-cn/ecosystem/)介绍了一些项目，其中既有好用的工具，也有长期未维护的项目。

需要某个特定功能的插件时，可以让 AI 通过联网搜索帮你查找，并顺便检查仓库的维护状态，避免装上一个长期无人维护甚至不兼容的插件。此外，你也可以自行探索其他 harness，例如 Claude Code、dsh、pi 等。
