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

> 本文进入对终端（Terminal）的讲解。
> 掌握命令行不是要背下大量命令和环境变量名，而是建立起与操作系统直接对话的直觉。

---

## 1. 终端命令学习

长期使用 Windows 图形界面的新人，一开始面对 Linux 频繁的终端操作时往往不知从何下手。本章带你理解命令行是什么、学习常用命令，并说明如何借助 LLM 和终端 Agent 辅助操作。

### 1.1 理解并接受命令行

图形界面（GUI）直观，但很多时候不够高效。在视觉组的开发中，你需要编译代码、操作底层硬件、管理 ROS 节点，这些操作在图形界面里要么没有对应按钮，要么很不方便。通过命令行，你可以更直接地控制这些流程。

### 1.2 掌握最基础的命令

你不需要记住所有命令，但在借助 AI 之前，应通过系统学习让手指对最基础的操作形成肌肉记忆，例如切换目录 `cd`、查看文件 `ls`、创建文件夹 `mkdir`。

可以通过以下两份资料完成终端入门：

- **图文参考手册（当字典查阅）**：

  - [Linux commands](https://harry-hhj.github.io/posts/Linux-Commands/)
  - [Linux 基础命令速查手册（菜鸟教程）](https://www.runoob.com/linux/linux-command-manual.html)

  只需浏览最常用的文件管理命令，不需要死记硬背参数。

- **视频（跟着敲一遍）**：

  以下视频侧重讲解环境变量的作用、工作原理和 `.bashrc` 相关内容，可以先看，与本文第 3 章配合理解：

  - [Bash Environment Variables](https://www.youtube.com/watch?v=yM8v5i2Qjgg)
  - [Linux Environment Variables 讲解](https://www.youtube.com/watch?v=N9AOjvM5w5s)
  - [鱼香 ROS：环境变量中文教学](https://www.bilibili.com/video/BV1pm42137bR/)（中文，暂时先用着）

  打开 Ubuntu 终端，跟着视频同步敲键盘，理解目录切换、文件操作和环境变量的逻辑。如果当前网络无法访问 YouTube，可以先看上面的 B 站中文教学，也建议先完成《基础网络配置》。

### 1.3 终端与 Shell

“终端”其实包含两个概念：终端模拟器（Terminal，负责展示窗口、多标签页、字体和颜色）和 Shell（负责解释并执行你输入的命令，如 Bash、Zsh）。终端模拟器负责显示，真正在后台处理命令的是 Shell。

Linux 下常用的终端模拟器：

- **GNOME Terminal / Konsole**：分别是 GNOME 和 KDE 桌面环境的默认终端，开箱即用，支持多标签页和基础配置，适合大部分日常开发。
- **Terminator**：支持在同一窗口里分割出多个终端（平铺），适合需要同时监控日志、运行服务和执行命令的场景。

常见的 Shell：

- **Bash**：Linux 和服务器上最常见的默认 Shell。资料和教程最多，网上的终端命令大多针对它编写。
- **Zsh**：命令与 Bash 基本一致。配合 Oh My Zsh 框架，可以更换主题、直观查看 Git 仓库状态，并支持 Tab 自动补全（笔者推荐）。
- **Fish**：默认配置即可使用，自带基于历史记录的灰色提示（按右方向键补全）和语法高亮（命令正确显示绿色，错误显示红色）。

### 1.4 尝试使用 Agent

掌握基础的目录切换和文件操作后，就不必再去背诵更复杂的命令。人脑记忆有限，你应该把精力放在视觉算法的逻辑上。

对于复杂的解压、网络配置、环境安装等长串命令，可以把 LLM 和终端 Agent（如 OpenCode）当作外脑：

- **不推荐**：凭模糊记忆乱敲 `tar -zxvf`，或在搜索引擎里翻找过时的博客。（如果你知道该用哪个命令，只是忘了具体格式，这样查找是可以的。）
- **推荐**：直接在终端呼出 Agent，或在大模型对话框中输入：*"我下载了一个 xxx.tar.gz 文件，帮我写一段 Ubuntu 命令把它解压到 /opt 目录下，并解释每个参数的意思。"*

> [!TIP] **小工具**
> 如果想知道某条命令到底做了什么，可以把它输入[这个网站](https://explainshell.com/)，它会给出逐段的英文解释。

---

## 2. 权限与进程

本节不深入底层理论，直接给出最常用的完整命令示例，并说明如何用 LLM 辅助排错。

### 2.1 权限控制（Permission）

Linux 默认不允许普通用户直接操作底层硬件和系统核心文件。当你执行一个没有执行权限的脚本时，终端会报错。下面看一个例子。

先创建脚本 `try.sh`：

```bash
#!/bin/bash

echo "Hello, this is try.sh!"
```

然后执行：

```bash
./try.sh
```

终端不会输出 `Hello, this is try.sh!`，而是报错：

```bash
bash: ./try.sh: Permission denied
```

这是权限不够。你可以先把报错交给 AI，试着自己解决。以下是我的做法：

输入 `ls -l`，找到输出中的 `try.sh`：

```bash
-rw-rw-r--  1 walt walt   43  9月  3 12:47 try.sh
```

其中的 `-rw-rw-r--` 就是问题所在，含义放在[下面](#答案)解答。改变文件权限的命令是 `chmod`：

```bash
chmod +x try.sh
```

再次 `ls -l`，`try.sh` 的属性变成：

```bash
-rwxrwxr-x  1 walt walt   43  9月  3 12:47 try.sh
```

此时执行 `./try.sh`，就能成功输出 `Hello, this is try.sh!`。

<a id="答案"></a>

> [!NOTE] **解答**
> Linux 权限通常写成 `rwx` 的形式，分别对应读、写、执行；三组 `rwx` 分别对应所有者、所属组和其他用户。执行 `chmod +x` 后，本质上是为 `try.sh` 添加了执行权限，使它从 `-rw-rw-r--` 变为 `-rwxrwxr-x`。`rwx` 三位又分别对应二进制的三位数字，因此也常见 `chmod 777 try.sh` 的写法，你可以自己尝试理解。另外，即使不给 `try.sh` 执行权限，用 `bash try.sh` 也能执行，想一想这是为什么，它用的是什么权限？

> [!TIP] **学会向 LLM 提问**
> 如果命令报错而你不知道如何处理，或者不确定自己的处理是否正确，可以把报错信息交给 AI。
> **Prompt 示范**：*"我在 Ubuntu 下运行 C++ 视觉程序，尝试读取 /dev/ttyUSB0 串口时报错 `Permission denied`。我已确认硬件插好了，可能是什么权限问题？如何解决？"*

### 2.2 进程管理

当你写了一个 C++ 死循环，或某个 ROS 节点卡死导致终端无法输入时，不要直接按电源键重启电脑。

查找并强制结束进程：

```bash
# 第一步：打开系统进程监视器（按 q 键退出）
htop

# 在界面中找到占用 CPU 过高的进程，记下最左侧的编号（PID，假设是 1234）
# 第二步：强制结束该进程（-9 表示强制）
kill -9 1234
```

> [!TIP] **让 Agent 辅助操作**
> 如果觉得用 `htop` 找 PID 麻烦，可以借助 Agent。
> **Prompt 示范**：*"我有一个名为 `armor_detector` 的程序在后台卡死了，帮我写一行命令，找到它的 PID 并强制结束它。"* AI 通常会给出 `pkill -9 armor_detector` 这类更简洁的命令。

> 这些示例的目的，是希望你在有一定命令行基础后，逐步学会用 Agent 解决问题。

---

## 3. 学习环境变量

这是全文最重要的部分。视觉组很多“奇怪的报错”，本质上都和不熟悉环境变量有关。

> 动手之前，先花 10 分钟看这个入门视频：
> - 视频标题：Linux Environment Variables: A Beginner's Guide to System Configuration
> - 频道名：CodeLucky
> - 视频链接：[https://www.youtube.com/watch?v=l_aB3_n5Nns](https://www.youtube.com/watch?v=l_aB3_n5Nns)
> - 建议：先看视频，对“环境变量是做什么的、`export` 怎么用”建立直觉，再往下读。3.5 的操作和 3.7 的排错案例都建立在这些概念之上，看完视频再读会更顺。
>
> 如果当前网络无法访问 YouTube，请先完成《基础网络配置》；配置中没看懂的部分，可以问 AI 怎么做。

### 3.1 环境变量的定义

可以把环境变量理解为操作系统的一份“通讯录”。当你只给系统一个名字（通常是一串大写字母）时，系统会去这份通讯录里查找对应的具体内容。

### 3.2 `$PATH`：解决 `Command not found`

- **现象**：在终端输入 `git` 或 `rosrun` 都能正常运行，但你自己下载了一个名为 `myapp` 的程序，输入 `myapp` 却报错 `Command not found`。
- **原因**：当你输入一个命令时，系统通过 `$PATH` 查找它对应的可执行文件在哪个目录。`git` 的所在目录已经写进了 `$PATH`，而 `myapp` 的目录没有。
- **解法**：把 `myapp` 所在的目录加入 `$PATH`。

### 3.3 `~/.bashrc`：终端启动时执行的脚本

- **现象**：很多教程让你执行 `source /opt/ros/humble/setup.bash`，还要把这句话写进 `~/.bashrc`。
- **原因**：每次新打开一个终端，系统在显示光标前，都会执行一遍 `~/.bashrc` 里的内容。
- **应用**：把修改 `$PATH` 的命令写进 `~/.bashrc`，之后每次打开终端都会自动执行，不必手动重复设置。

### 3.4 `$LD_LIBRARY_PATH`：C++ 动态链接

- **场景**：CMake 编译通过，但运行 `./run` 时报错：`error while loading shared libraries: libopencv_core.so: cannot open shared object file`。
- **原因**：编译通过只说明语法没问题；运行时程序需要加载 OpenCV 的 `.so` 动态库，而系统在默认的库目录里没有找到它。
- **解法**：`$LD_LIBRARY_PATH` 是系统查找 `.so` 库文件的一份路径列表。把 OpenCV 库所在目录（通常是 `/usr/local/lib`）加入该变量，运行时就能找到对应的库。

### 3.5 如何查看与设置环境变量

前面介绍了环境变量的作用，本节讲最常用的查看和修改操作。

- **查看某个变量**：

  ```bash
  echo $PATH
  # 输出类似：/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:...
  ```

  `$` 表示取值，`echo $PATH` 就是打印 `PATH` 的值。

- **查看全部变量**：

  ```bash
  env          # 列出所有环境变量（环境变量会传递给子进程）
  printenv     # 作用相同，输出更清晰
  ```

- **临时设置（只对当前终端有效）**：

  ```bash
  export MY_VAR=hello
  echo $MY_VAR                       # 输出 hello
  export PATH=$PATH:/opt/myapp/bin   # 在原有 PATH 后追加一个新路径
  ```

  > **注意**：`export` 只在当前终端窗口及其子进程内有效。关闭窗口或新开终端后，改动就不再保留。

- **永久设置（写进 .bashrc）**：把 `export` 那一行写进 `~/.bashrc`，再执行：

  ```bash
  source ~/.bashrc
  ```

  这样每次新开终端都会自动执行（即 3.3 节说的启动脚本）。

- **删除变量**：`unset MY_VAR`

> **作用域：子进程继承**
> 你在终端 `export` 的变量，会被从这个终端启动的所有程序继承，包括 `rosrun`、`python3` 和你编译好的 `./run`。很多“程序能编译，运行表现却不一样”的问题，根源是某个环境变量在不同终端里取值不同。排查时先用 `env` 查看当前终端的环境。

### 3.6 `$HOME`：不要把路径写死

- **现象**：代码里写了 `/home/zhangsan/catkin_ws/src/...` 这样的路径。在自己电脑上正常，交给队友或换到机器人上就报 `No such file or directory`。
- **原因**：`$HOME` 是当前登录用户的家目录。你的家目录是 `/home/cicada`，队友的可能是 `/home/lisi`。把具体用户名写死进代码，换一台机器就找不到对应目录。
- **解法**：用 `$HOME`（或简写 `~`）代替写死的用户名：

  ```bash
  echo $HOME                       # 输出 /home/cicada
  cd ~/catkin_ws/src               # 等价于 cd $HOME/catkin_ws/src
  python3 $HOME/vision/run.py
  ```

  C++、CMake、Python 里同样适用，例如 `"$ENV{HOME}/config.yaml"`、`Path.home()`。写路径时能用 `$HOME` / `~` 就不要写死具体用户名，这样代码在不同电脑上都能直接运行。

### 3.7 实战排错：一次 OpenCV 版本冲突

前几节的概念，最终都要落到具体场景。视觉组常见的问题是：明明装好了 OpenCV，程序却找不到库，或者用错了版本。下面完整走一遍排查流程。

- **现象**：视觉程序 `./run` 启动后立即崩溃，报错形式不一：

  ```bash
  error while loading shared libraries: libopencv_core.so.4.5: cannot open shared object file
  # 或者更隐蔽的：
  terminate called after throwing an instance of 'cv::Exception'
  ```

- **原因**：一台电脑上常常同时存在多套 OpenCV：

  - **A：apt 安装的系统版本**（`sudo apt install libopencv-dev`），库文件在 `/usr/lib/x86_64-linux-gnu/`，Ubuntu 20.04 为 4.2，Ubuntu 22.04 为 4.5。
  - **B：手动编译安装的**，库文件在 `/usr/local/lib`，版本可能是 4.8、4.9。
  - **C：ROS 自带的**，在 `/opt/ros/humble/lib`，版本可能又不相同。

  编译时 CMake 找到的是 B，但运行时 `LD_LIBRARY_PATH` 先指向了 A，或者 `.bashrc` 里 `source` 的顺序让 ROS 的 OpenCV 排在前面。编译链接和运行时加载的是不同版本，程序就会崩溃。

- **解法（一套排查命令）**：

  ```bash
  # 第一步：看系统里有哪些 OpenCV 版本
  ls /usr/local/lib | grep opencv                      # 手动编译安装的
  ls /usr/lib/x86_64-linux-gnu | grep opencv           # apt 安装的
  apt list --installed | grep opencv                   # 列出 apt 安装的包

  # 第二步：看程序运行时实际在找哪个库
  ldd ./run | grep opencv              # 列出 run 实际链接的 .so 文件
  ldd ./run | grep "not found"         # 找不到的库会直接列出

  # 第三步：查看 LD_LIBRARY_PATH 当前指向
  echo $LD_LIBRARY_PATH
  ```

  说明：

  - 如果程序需要 `libopencv_core.so.4.5`，系统里却只有 `.so.4.2`，说明编译时和运行时版本不一致。统一它们：要么把 B 的路径加进 `LD_LIBRARY_PATH`，要么用 A 的版本重新编译。
  - 如果 `ldd` 显示链接到的是不带版本号的 `libopencv_core.so`，说明该 `.so` 的软链接可能被不同安装互相覆盖过。用 `ls -l /usr/local/lib/libopencv_core.so*` 检查软链接的指向。
