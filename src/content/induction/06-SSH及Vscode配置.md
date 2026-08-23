---
title: "SSH 及 Vscode 配置"
description: "VSCode、CMake、Git Graph 与 SSH 远程开发的常用配置。"
author: "Tinglerain"
date: 2026-08-10
tags: ["SSH", "VSCode"]
status: done
draft: false
---

# SSH 及 VSCode 配置

> 这一篇主要讲开发环境的配置。视觉开发经常要在自己的电脑和车载电脑之间来回切换，VSCode 配合 SSH 用熟之后，编辑代码、编译和看日志都会方便很多。

---

## 1. VSCode 基本配置

### 1.1 建议安装的插件

在扩展商店搜索并安装下面的插件：

*   **C/C++**：提供 C/C++ 补全、跳转和调试支持。
*   **CMake Tools**：配置和编译 CMake 工程。
*   **Git Graph**：以图的形式查看提交和分支。
*   **Remote - SSH**：通过 SSH 连接远程 Linux 电脑。
*   **Chinese (Simplified)**：中文界面，按个人习惯安装。

### 1.2 打开一个工程

启动 VSCode 后选择 `File -> Open Folder`，打开项目的根目录，不要只打开某一个源文件。这样 CMake、Git 和代码补全才能正确识别整个工程。

如果项目使用 CMake，左下角会出现 CMake 相关按钮。第一次打开工程时，依次选择 `Kit`、`Configure`，然后点击 `Build`。编译生成的文件通常放在 `build/` 目录中。

也可以直接在终端编译：

```bash
cmake -S . -B build
cmake --build build -j
```

ROS 或 catkin 工程按照项目里的脚本和说明编译，不要直接套用上面的命令。

### 1.3 Git Graph 怎么看

打开左侧的 Git Graph 后，主要看以下几项：

*   当前处在哪个分支；
*   本地有没有还没 push 的提交；
*   分支从哪里分出来、有没有合并；
*   修改是谁提交的。

遇到分支或冲突问题时，先看图，再用命令行确认：

```bash
git log --oneline --graph --decorate --all
```

---

## 2. 通过 SSH 登录远程电脑

SSH 是一种远程登录协议。视觉组里常见的用法是：自己的电脑运行 VSCode，代码和程序实际放在车载电脑或实验室的 Linux 主机上。

### 2.1 先确认远端能登录

在本地终端执行下面的命令，把用户名和 IP 换成远端电脑的实际信息：

```bash
ssh helloworld@192.168.1.100
```

第一次连接时会询问是否信任这台电脑，确认 IP 没有写错后输入 `yes`。然后输入远端用户的密码。登录成功后，终端提示符会变成远端电脑的样子。

退出远程终端：

```bash
exit
```

如果连不上，先检查两台电脑是否在同一个网络，再检查 IP、用户名和 SSH 服务，不要只在 VSCode 里反复点击连接。

### 2.2 写入 SSH 配置

每次输入完整的用户名和 IP 比较麻烦，可以在本地创建或编辑 `~/.ssh/config`：

```sshconfig
Host helloworld
    HostName 192.168.1.100
    User helloworld
```

之后只需要输入：

```bash
ssh helloworld
```

`Host helloworld` 是自己起的别名，`HostName`、`User` 和 `Port` 要按照实际设备填写。配置文件权限不正确时，SSH 可能会拒绝读取，可以执行：

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config
```

### 2.3 使用密钥登录

如果每天都要登录同一台电脑，建议使用密钥，不要每次都输入密码。

本地生成一对密钥：

```bash
ssh-keygen -t ed25519 -C "你的邮箱@xxx.com"
```

一路按 Enter 会使用默认保存路径，也可以在提示时设置密钥密码。然后把公钥复制到远端：

```bash
ssh-copy-id helloworld@192.168.1.100
```

再次登录时，如果配置正确，就不需要输入远端账户密码。公钥文件是 `~/.ssh/id_ed25519.pub`，私钥是 `~/.ssh/id_ed25519`。私钥不能发给别人，也不要提交到 Git 仓库。

---

## 3. VSCode Remote - SSH

### 3.1 添加远程主机

安装 `Remote - SSH` 插件后，按 `Ctrl+Shift+P` 打开命令面板，执行：

```text
Remote-SSH: Add New SSH Host...
```

输入：

```bash
ssh helloworld@192.168.1.100
```

也可以直接选择刚才配置的主机别名：

```bash
ssh helloworld
```

保存到 `~/.ssh/config` 后，点击左下角的绿色远程连接按钮，选择 `helloworld`。第一次连接时，VSCode 会在远端安装 VSCode Server，需要等待一段时间。

### 3.2 打开远程工程

连接成功后，选择 `File -> Open Folder`，填写远端的工程路径，例如：

```text
/home/helloworld/vision_ws/src/vision
```

此时 VSCode 左下角会显示远程主机名称。新开的终端也在远端运行，可以直接执行编译和启动命令：

```bash
cd ~/vision_ws
colcon build --symlink-install
source install/setup.bash
```

注意左下角是否显示了远程主机。如果没有显示，当前打开的可能仍然是本地目录。

### 3.3 文件传输

文件传输推荐使用 `rsync`。它只同步有变化的部分，适合反复传输代码和配置文件：

```bash
rsync -avP config.yaml helloworld@192.168.1.100:~/vision_ws/config/
```

同步整个工程目录时，可以通过 `-e ssh` 明确使用 SSH：

```bash
rsync -avzP -e ssh ./src/ helloworld@192.168.1.100:~/vision_ws/src/
```

从远端下载到本地时，把远端路径写在前面：

```bash
rsync -avP helloworld@192.168.1.100:~/vision_ws/log.txt ./
```

常用参数如下：

*   `-a`：归档模式，递归同步目录，并尽量保留权限、时间、软链接等属性，通常最常用。
*   `-v`：显示详细同步过程，方便确认正在传输哪些文件。
*   `-z`：传输时压缩数据，网络较慢时有帮助，但会增加 CPU 开销。
*   `-P`：等价于 `--partial --progress`，显示进度，并保留未完成的临时文件，方便断点续传。
*   `-e ssh`：指定使用 SSH 作为远程 shell；通过 SSH 传输时也可以省略，因为 `rsync` 默认使用 SSH。
*   `--exclude 'build/'`：排除不需要同步的目录或文件，例如编译产物。
*   `--dry-run` 或 `-n`：只预览将要执行的操作，不真正修改目标目录，首次同步建议先使用。
*   `--delete`：删除目标端多余的文件，使两端完全一致；使用前务必确认源路径，避免误删。

路径末尾的 `/` 主要区别在**源目录**上，目标路径末尾是否有 `/` 通常不影响结果。源目录带 `/` 表示同步目录中的内容，不带 `/` 表示把目录本身也同步过去。比如本地有 `./src/main.cpp`：

```bash
# 结果：远端得到 ~/vision_ws/main.cpp
rsync -avzn ./src/ helloworld@192.168.1.100:~/vision_ws/

# 结果：远端得到 ~/vision_ws/src/main.cpp
rsync -avzn ./src helloworld@192.168.1.100:~/vision_ws/
```

因此，当前面的目标路径已经是 `~/vision_ws/src/` 时，源路径应写成 `./src/`，表示把 `src` 目录中的内容同步到远端的 `src` 目录。正式同步前，可以先用 `-n` 预览：

```bash
rsync -avzn --exclude 'build/' ./src/ helloworld@192.168.1.100:~/vision_ws/src/
```

---

## 4. 常见问题

### 4.1 `Connection refused`

这通常表示 IP 能找到，但远端没有 SSH 服务在对应端口监听。登录远端电脑后检查：

```bash
sudo systemctl status ssh
```

如果服务没有启动：

```bash
sudo systemctl start ssh
```

### 4.2 `Permission denied (publickey,password)`

先确认用户名是否正确，再检查本地使用的是哪一个密钥：

```bash
ssh -v helloworld
```

输出里会显示 SSH 尝试使用的密钥和认证过程。不要把完整输出直接发到公开群聊，里面可能包含主机信息。

### 4.3 VSCode 连接后马上断开

打开 `View -> Output`，在右侧选择 `Remote - SSH` 查看日志。常见原因有：

*   远端磁盘空间不足；
*   远端用户没有家目录写权限；
*   远端系统架构或版本不满足 VSCode Server 的要求；
*   网络不稳定，服务端没有安装完整。

可以先用普通 SSH 登录确认网络和权限，再处理 VSCode 的问题。

### 4.4 远程终端里找不到 ROS 或其他命令

Remote - SSH 打开的终端不会自动继承本地环境。检查远端的环境变量和启动脚本：

```bash
echo $PATH
source /opt/ros/humble/setup.bash
```

如果每次都需要手动执行，可以把正确的 `source` 命令写进远端用户的 `~/.bashrc`。不同电脑上的 ROS 版本可能不同，路径以远端实际安装的版本为准。

### 4.5 不确定怎么排错

提问时至少提供以下信息：

*   本地和远端的系统版本；
*   执行过的完整命令；
*   完整报错原文；
*   `ssh -v` 或 VSCode `Remote - SSH` 输出中的相关部分。

不要只说“SSH 连不上”。有了这些信息，才能判断是网络、账号、密钥、权限还是 VSCode Server 的问题。

---

## 5. 学习资源

*   **VSCode Remote - SSH 官方文档**：[https://code.visualstudio.com/docs/remote/ssh](https://code.visualstudio.com/docs/remote/ssh)
*   **VSCode CMake Tools**：[https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools)
*   **Git Graph**：[https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph)
*   **OpenSSH 手册**：[https://man.openbsd.org/ssh](https://man.openbsd.org/ssh)
