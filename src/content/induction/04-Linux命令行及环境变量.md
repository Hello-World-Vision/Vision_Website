---
title: "Linux 命令行及环境变量"
description: "Linux 常用命令行工具与 shell 环境变量的使用方法。"
author: "Cicada"
date: 2026-08-10
tags: ["Linux", "命令行", "环境变量"]
status: done
draft: false
---

# Linux 命令行指南与环境变量学习

> 本文档进入对终端（Terminal）的讲解。
> 掌握命令行并不是要你去背诵许多命令和环境变量名，而是要你建立起与操作系统直接对话的直觉。

---

## 1. 终端命令学习

对于常年使用 Windows 图形界面（鼠标点击）的新人来说，面对全黑的终端往往会感到无所适从。在1.1,1.2,1.3小节中，我将带你理解什么是命令行，学习常见的命令，并教你如何借助 LLM（大语言模型）和终端 Agent 来辅助操作。

### 1.1 理解并接受命令行
图形界面（GUI）虽然直观，但是有很多时候不够高效和方便。
在视觉组的开发中，你需要编译代码、操控底层硬件、管理 ROS 节点，这些操作在图形界面里要么找不到按钮，要么极其低效。只有通过敲击一行行文本命令，你才能获得对计算机最高级别的控制权。

### 1.2 掌握核心与核心的命令
你不需要记住所有的命令，但在开始借力 AI 之前，你必须通过系统的学习，让手指形成对最基础操作的肌肉记忆（如切换目录 `cd`、查看文件 `ls`、创建文件夹 `mkdir`）。

请通过以下两个实例资料，完成你的终端启蒙：
*   **图文参考手册（当字典查阅）**：
    
    🔗 [Linux常用命令](https://blog.csdn.net/wzk4869/article/details/132855372)
    
    🔗 [Linux 基础命令速查手册 (菜鸟教程)](https://www.runoob.com/linux/linux-command-manual.html)
    
    
    *（注：只需浏览最常用的文件管理命令，不需要死记硬背参数。）*
*   **视频（跟着敲一遍）**：
    *   **视频标题**：Linux Command Line Tutorial - Learn Linux Terminal in 40 minutes 
    *   **视频链接**：[https://www.youtube.com/watch?v=kQaOtys9Pp8](https://www.youtube.com/watch?v=kQaOtys9Pp8)
    *   *（这是专门为机器人开发者录制的速成视频。请打开你的 Ubuntu 终端，跟着视频里的操作同步敲击键盘，感受目录切换和文件操作的逻辑，完全理解和掌握这个视频基本上Linux的命令基础就差不多了）*
    *   *（注：如果当前网络暂无法访问 YouTube，请在 Bilibili 搜索 `Linux命令行快速入门教程 零基础`，寻找时长较短、带实操演示的视频作为平替。但是还是希望完成基础网络配置）*

### 1.3 终端与SHELL

“终端”其实包含两个核心概念：终端模拟器 (Terminal)（负责展示窗口、多标签页、字体和颜色）和 Shell（真正的内核，负责解释和执行你输入的命令，如 Bash、Zsh）。

linux下常用的终端比如：

- GNOME Terminal / Konsole： 分别是 GNOME 和 KDE 两大主流 Linux 桌面环境的默认终端。它们开箱即用，支持多标签页和基础的配置，稳定可靠，适合 80% 的日常开发需求。

- Terminator： 核心卖点是无限分割窗口（平铺）。你可以像切豆腐一样在同一个大窗口里切出无数个小终端，极其适合需要同时监控日志、运行服务和执行命令的后端或运维人员。

*终端只是“显示器”，真正在后台处理你输入命令的内核是 Shell。*

+ Bash
    它是 Linux 和服务器世界的绝对默认标准。只要你连上一台云服务器，99% 的概率它在运行 Bash。

    资料和教程全网最多，兼容性无敌。网上搜到的所有终端命令，几乎都是为它写的。
+ Zsh
  命令和Bash基本没区别。配合一个叫 Oh My Zsh 的傻瓜式框架，你可以一键给终端换上酷炫的主题，还能直观地看到 Git 代码仓库的状态，你还可以tab自动补全（笔者推荐）
+ Fish
    不需要任何配置。装好立刻就拥有极度聪明的“灰色暗影提示”（根据历史记录猜你要输入什么，按一下右方向键就能补全）和语法高亮（敲错命令显示红色，敲对显示绿色）。
  

### 1.4 了解Agent的重要性和尝试使用
当你在上一步掌握了基础的目录切换和文件操作后，请停止去背诵更复杂的命令。**人脑的记忆是有限的，你应该把精力放在视觉算法的逻辑上。**
对于复杂的解压、网络配置、环境安装等长串命令，你要学会把 LLM 和终端 Agent（如 OpenCode）作为你的外脑：
*   **错误做法**：凭着模糊的记忆乱敲 `tar -zxvf`，或者去搜索引擎翻找 5 年前的垃圾博客。
*   **正确做法**：直接在终端呼出 Agent，或者打开你的大模型对话框输入：*"我下载了一个 xxx.tar.gz 文件，帮我写一段 Ubuntu 命令把它解压到 /opt 目录下，并用大白话解释每个参数的意思。"*

---

## 2. 值得提醒的命令：权限与进程
我们不过度讲解底层理论，直接给出最常用的完整命令例子，并教你如何用 LLM 辅助排错。

### 2.1 权限控制（Permission）
Linux 默认不允许普通用户直接触碰底层硬件和系统核心文件。
*   **完整命令例子 1：赋予脚本执行权限**
    如果你写了一个 `run.sh` 脚本但无法运行，提示权限不足：
    ```bash
    chmod +x run.sh
    ./run.sh
    ```
*   **完整命令例子 2：临时借用最高权限（sudo）**
    如果你的程序读取工业相机或串口（如 `/dev/ttyUSB0`）失败，报错 `Permission Denied`：
    ```bash
    # 暴力但有效的方法：给这个硬件端口赋予所有人可读可写的权限
    sudo chmod 777 /dev/ttyUSB0
    ```

> **💡 学会向 LLM 提问：**
> 如果你的命令出现了报错，你不知道要如何处理，或者不确定自己的处理是否正确，你应该把报错信息扔给 AI。
> **你的 Prompt 示范**：*"我在 Ubuntu 下运行 C++ 视觉程序，尝试读取 /dev/ttyUSB0 串口时报错 `Permission Denied`。我已经确认硬件插好了，告诉我可能是什么权限问题？如何解决，而不是每次开机都输入 sudo chmod？"*

### 2.2 进程管理
当你写了一个 C++ 死循环，或者某个 ROS 节点卡死，导致终端无法输入时，不要强行按电源键重启电脑
*   **完整命令例子：查找并强制杀死进程**
    ```bash
    # 第一步：打开系统进程监视器（按 q 键可以退出）
    htop
    
    # 在界面中找到那个导致 CPU 爆满的进程，记下最左侧的数字编号（PID，假设是 1234）
    # 第二步：下达最高优先级的抹杀指令（-9 代表强制执行）
    kill -9 1234
    ```

> **💡 让 Agent 辅助操作：**
> 如果你觉得用 `htop` 找 PID 太麻烦，你可以利用 Agent 的自动化能力。
> **你的 Prompt 示范**：*"我有一个名为 `armor_detector` 的程序在后台卡死了，帮我写一行命令，直接找到它的 PID 并把它强制 kill 掉。"*（AI 通常会教你使用 `pkill -9 armor_detector` 这样更高级的组合命令）。

> 我写这些让Agent 辅助操作的提醒的目的就是让你慢慢学会你在有一定命令基础的情况下，有能力去使用Agent解决很多问题的。
---

## 3. 学习环境变量

这是全篇最重要的部分。RM 视觉组很多"奇怪的报错"，本质上都是因为你不懂环境变量造成的。

> 📺 **动手之前，先花 10 分钟看这个入门视频**：
> *   **视频标题**：Linux Environment Variables: A Beginner's Guide to System Configuration [7]
> *   **频道名**：CodeLucky
> *   **视频链接**：[https://www.youtube.com/watch?v=l_aB3_n5Nns](https://www.youtube.com/watch?v=l_aB3_n5Nns)
> *   **建议**：先看视频，对"环境变量是干嘛的、`export` 怎么用"建立起直觉，再往下读。下面的文档是针对视觉组写的，3.5 的操作和 3.7 的排错案例都是在视频基础上的深入，看完视频再读才不会感到很难。
>
> *(注：如果当前网络暂无法访问 YouTube，请先完成基础网络配置，对于基础网络配置没看懂的部分，要问你的AI怎么做)*

### 3.1 环境变量的定义
环境变量本质上就是操作系统的 **"全局通讯录"**。当你只给系统一个名字时(一个全是大写字母的字符串)，系统会去这个通讯录里翻找对应的详细地址。

### 3.2 `$PATH`：解决 `Command not found` 
*   **现象**：你在终端输入 `git` 或 `rosrun`，系统能正常运行；但你自己下了一个名为 `myapp` 的软件，输入 `myapp`，系统却报错：`Command not found`。
*   **真相**：当你在终端输入一个词时，系统怎么知道去硬盘的哪个角落找它？它会去查阅一个叫 `$PATH` 的专属通讯录。`git` 的安装路径被写在了 `$PATH` 里，而你的 `myapp` 没有。
*   **解法**：你需要把 `myapp` 所在的文件夹路径，强行塞进 `$PATH` 这个通讯录里。

### 3.3 `~/.bashrc`：终端的开机自启脚本
*   **现象**：你看各种教程，总是让你执行一句 `source /opt/ros/humble/setup.bash`，然后还要你把这句话写进一个叫 `~/.bashrc` 的文件里。
*   **真相**：`~/.bashrc` 就是你终端的**"每次开机必读剧本"**。你每次新打开一个黑框（Terminal），系统在显示光标前，都会偷偷把 `~/.bashrc` 里的所有代码默默执行一遍。
*   **应用**：把你修改 `$PATH` 的指令写进 `~/.bashrc`，这就意味着你每次打开终端，系统都会自动帮你更新一遍通讯录，一劳永逸。

### 3.4 `$LD_LIBRARY_PATH`：C++ 动态链接
*   **痛点场景**：你的 CMake 编译完美通过。但当你输入 `./run` 运行视觉程序时，瞬间报错：`error while loading shared libraries: libopencv_core.so: cannot open shared object file`。
*   **原因**：编译通过只代表代码语法没错；但在运行时，你的程序需要调用 OpenCV 的 `.so` 动态库文件。系统在默认的库文件夹里找不到它。
*   **解决方式**：`$LD_LIBRARY_PATH` 是另一本专门用来找 `.so` 库文件的通讯录。你需要把 OpenCV 库的存放路径（通常在 `/usr/local/lib`）加进这个环境变量里，系统就能瞬间找到它。

### 3.5 如何查看与设置环境变量
前面你知道了"通讯录"的存在和重要性，但还差最关键的一环：**怎么查看和修改环境变量**。本节讲解最常用的操作。

*   **查看某个变量**：`echo $PATH`
    ```bash
    echo $PATH
    # 输出类似：/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:...
    ```
    `$` 是"取值"的意思，`echo $PATH` 就是"把 PATH 的值打印出来"。
*   **查看全部变量**：
    ```bash
    env          # 列出所有环境变量（环境变量 = 会传给子进程的变量）
    printenv     # 同上，输出更清晰
    ```
*   **临时设置（只对当前终端有效）**：
    ```bash
    export MY_VAR=hello
    echo $MY_VAR                       # 输出 hello
    export PATH=$PATH:/opt/myapp/bin   # 在原有 PATH 后面追加一个新路径
    ```
    > **注意**：`export` 只在**当前这个终端窗口** 及其子进程内有效。关掉窗口或新开一个终端，改动就消失了。
*   **永久设置（写进 .bashrc）**：
    把 `export` 那一行写进 `~/.bashrc`，再执行：
    ```bash
    source ~/.bashrc
    ```
    这样每次新开终端都会自动执行（也就是 3.3 节说的"开机自启剧本"）。
*   **删除变量**：`unset MY_VAR`

**注意：作用域 = 子进程继承**
> 你在终端 `export` 的变量，会被你从这个终端里启动的**所有程序** 继承——包括 `rosrun`、`python3`、你编译好的 `./run`。很多"我的程序明明能编译，为什么运行表现不一样"的诡异问题，根源都是某个环境变量在不同终端里不一样。排查时先用 `env` 看看当前终端的环境。

### 3.6 `$HOME`：别把路径写死
*   **现象**：你的代码里有这样的路径：`/home/zhangsan/catkin_ws/src/...`。在自己电脑上一切正常，交给队友或换到机器人上就跑不动，疯狂报 `No such file or directory`。
*   **真相**：`$HOME` 就是当前登录用户的**家目录**。你的家目录是 `/home/cicada`，队友的是 `/home/lisi`。把别人家的门牌号写死进代码，到了别人家里当然找不到东西。
*   **解法**：用 `$HOME`（或它的简写 `~`）代替写死的用户名：
    ```bash
    echo $HOME                       # 输出 /home/cicada
    cd ~/catkin_ws/src               # 和 cd $HOME/catkin_ws/src 等价
    python3 $HOME/vision/run.py
    ```
    在 C++ / CMake / Python 里同样适用：`"$ENV{HOME}/config.yaml"`、`Path.home()`。**凡是写路径，能用 `$HOME` / `~` 就别写死具体用户名**，这样你的代码在任何一台电脑上都能直接跑。

### 3.7 实战排错：一个 OpenCV 版本冲突的解决
前几节的理论，最终都要落到一个场景里。视觉组常见问题：**为什么我明明装好了 OpenCV，程序还是找不到库、或者用错了版本？** 完整走一遍排查流程。

*   **现象**：你的视觉程序 `./run` 启动后瞬间崩溃，报错五花八门：
    ```bash
    error while loading shared libraries: libopencv_core.so.4.5: cannot open shared object file
    # 或者更隐蔽的：
    terminate called after throwing an instance of 'cv::Exception'
    ```
*   **真相**：你的电脑上往往同时存在**两套甚至更多套 OpenCV**：
    *   **A：apt 系统自带的**（`sudo apt install libopencv-dev`），库文件在 `/usr/lib/x86_64-linux-gnu/`，Ubuntu 20.04 是 4.2，Ubuntu 22.04 是 4.5。
    *   **B：手动编译安装的**，库文件在 `/usr/local/lib`，版本可能是 4.8、4.9。
    *   **C：ROS 自带的**，在 `/opt/ros/humble/lib`，版本可能又是另一个。
    
    编译时 CMake 找到的是 B，但运行时 `LD_LIBRARY_PATH` 把系统先指向了 A，或者 `.bashrc` 里 `source` 的顺序导致 ROS 的 OpenCV 抢了先。**编译链接和运行时加载的是两套不同版本，自然就崩了。**
*   **解法（一套完整排查命令）**：
    ```bash
    # 第一步：看系统到底有哪些 OpenCV 版本
    ls /usr/local/lib | grep opencv                      # 手动编译装的
    ls /usr/lib/x86_64-linux-gnu | grep opencv           # apt 装的
    apt list --installed | grep opencv                   # 列出 apt 装的包

    # 第二步：看程序运行时到底在找哪个库
    ldd ./run | grep opencv              # 列出 run 实际链接的 .so 文件
    ldd ./run | grep "not found"         # 哪个库找不到，一目了然

    # 第三步：查 LD_LIBRARY_PATH 当前指向哪里
    echo $LD_LIBRARY_PATH
    ```
    详细说明：
    *   如果程序要 `libopencv_core.so.4.5`，系统里却只有 `.so.4.2`，说明编译时和运行时版本不一致 → 统一它们：要么把 B 的路径加进 `LD_LIBRARY_PATH`，要么重新用 A 的版本编译。
    *   如果 `ldd` 显示链接到的是 `libopencv_core.so`（无版本号），说明 `.so` 的软链接被改动过，可能是不同安装互相覆盖 → 用 `ls -l /usr/local/lib/libopencv_core.so*` 检查软链接指向。

> **💡 学会向 LLM 提问（报错排查万能公式）：**
> 把报错原文 + 环境信息 + 你查到的结果一起丢给 AI。
