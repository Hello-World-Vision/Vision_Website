---
title: "Git & GitHub 教学"
description: "Git 版本控制基础与 GitHub 协作流程教学。"
author: "Tinglerain"
date: 2026-08-22
tags: ["Git", "GitHub"]
status: done
draft: false
---

# Git & GitHub 教学

> 本文档讲的是版本控制。
> 你写视觉代码，不是把文件丢进一个文件夹就算结束了。代码要能回退，要能协作，要能知道谁改了什么、什么时候改的，这些都靠 Git。

---

## 1. 为什么要学 Git

### 1.1 解决的问题

Git 主要解决以下问题：

*   你改坏了代码，想退回上一个能跑的版本；
*   你和队友同时改同一个项目，需要知道谁改了哪里；
*   你需要把代码放到 GitHub 上，让其他人也能拿到同一份代码。

你可以把 Git 理解成一个“带时间轴的文件管理器”。每次提交都像存档，分支就是平行开发线，远程仓库就是大家都能访问的公共版本。

### 1.2 几个最常见的词

先把这几个词认清楚，后面看命令会轻松很多：

*   **仓库**：一个被 Git 管理的项目目录。
*   **提交**：一次保存好的版本记录。
*   **分支**：一条独立开发线，方便你做新功能或修 bug。
*   **远程仓库**：放在 GitHub 上的那份代码副本。

---

## 2. 本地 Git 基础

### 2.1 安装与身份配置

Ubuntu 通常自带 Git，先验证：

```bash
git --version
```

如果提示找不到命令，用 apt 安装：

```bash
sudo apt install git
```

安装后需要完成一次全局身份配置，告诉 Git 你是谁，之后每次提交都会记录你的名字和邮箱：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@xxx.com"
```

### 2.2 第一次提交

最常见的流程就是：初始化仓库、查看状态、添加文件、提交。

```bash
# 进入你的项目目录，初始化仓库（只需要做一次）
cd ~/workspace
git init

# 看看现在有哪些文件被改动了
git status

# 把文件加入暂存区
git add .
# 或者只加一个文件
git add src/armor_detector.cpp

# 提交这次修改
git commit -m "完成装甲板检测的初版实现"

# 看历史记录
git log --oneline
```

`commit message` 尽量写详细一些，方便后续查看。

```text
✅ "修复装甲板在逆光下的误检，改用 HSV 空间过滤"
❌ "update"
❌ "111"
❌ "改了东西"
```

### 2.3 查看改动和回退

查看当前的改动：

```bash
git diff                  # 看当前还没提交的改动
git show <commit编号>     # 看某一次提交具体改了什么
```

如果代码改坏了，可以回到上一个版本：

```bash
git log --oneline
git reset --hard <commit编号>
```

`git reset` 用于 commit 级别的撤销。
- `--soft` 会撤销提交，但会保留工作区和暂存区的修改。
- `--mixed` 会撤销提交，清空暂存区的修改，但是保留工作区的修改。
- `--hard` 会撤销提交，清空暂存区和工作区的修改。

### 2.4 分支

正式的多人项目里，别直接在 `main` 上乱改。你应该先开一个自己的分支，做完再合回去：

```bash
# 新开一个分支，叫 feature/armor-detector
git checkout -b feature/armor-detector

# 回到 main 分支
git checkout main
git merge feature/armor-detector

git branch -d feature/armor-detector
```

### 2.5 `.gitignore`

有些东西不要提交到仓库里，比如编译产物、日志、数据集、密钥。仓库里放这些东西没意义，还会把历史撑得很大。

在仓库根目录创建 `.gitignore` 文件，写上需要忽略的模式：

```gitignore
# 编译产物
build/
deploy/
*.o
*.so

# IDE 与系统文件
.vscode/
.idea/
.DS_Store

# 数据集与日志
*.bag
dataset/
*.log

# 密钥（绝对禁止入库！）
*.key
*.pem
```

如果你不确定自己的项目要忽略哪些文件，可以直接让 AI 帮你看看。

> **你的 Prompt 示范**：*"我有一个 C++ + CMake + OpenCV 的视觉项目，使用 catkin 构建。请帮我生成一份合适的 .gitignore，并告诉我哪些文件不应该进 Git。"*

---

## 3. GitHub

GitHub 就是把本地仓库放到网上。这样你自己能同步，队友也能拉取，出问题时还能留痕。

### 3.1 连接方式

GitHub 常见有两种连接方式：`HTTPS` 和 `SSH`。

### 3.1.1 HTTPS

HTTPS 的特点是简单，第一次上手最容易理解，适合这些情况：

*   你刚开始用 Git，还不想先配密钥；
*   你只是临时拉一下代码；
*   你在一台不常用的电脑上操作。

常见写法：

```bash
git clone https://github.com/ZJU-RoboMaster/vision.git
```

如果仓库是私有的，GitHub 现在一般不会让你直接输账号密码，而是让你用 `Personal Access Token`（PAT） 代替密码。你可以把它理解成“网页登录用的临时口令”。

### 3.1.2 SSH

SSH 更适合长期开发。配好以后，拉代码和推代码都更顺手，不用反复输入密码或 token。

先生成密钥：

```bash
ssh-keygen -t ed25519 -C "你的邮箱@xxx.com"
```
此时按 Enter 保存在默认路径里，可以为你的密钥配置密码

查看密钥：
```bash
cat ~/.ssh/id_ed25519.pub
```

然后把公钥复制到 GitHub 的 `Settings -> SSH and GPG keys` 里。

验证是否成功：

```bash
ssh -T git@github.com
```

第一次会问你是否信任，填 yes 即可。如果成功，会看到类似这样的提示：

```text
Hi xxx! You've successfully authenticated, but GitHub does not provide shell access.
```

SSH 地址一般长这样：

```bash
git clone git@github.com:ZJU-RoboMaster/vision.git
```

### 3.1.3 选哪个

*   **新手先用 HTTPS 也行**，省得一开始就被密钥配置卡住；
*   **正式开发更推荐 SSH**，尤其是你以后会频繁 `push`、`pull`、切分支的时候；
*   视觉组常用的做法是：GitHub 用 SSH，远程机器登录也用 SSH，一套习惯直接打通。

### 3.2 clone、push、pull

最常见的操作就是先克隆仓库:

```bash
# HTTPS 写法
git clone https://github.com/ZJU-RoboMaster/vision.git

# SSH 写法
git clone git@github.com:ZJU-RoboMaster/vision.git

cd vision
```

提交修改：
```bash
git add .
git commit -m "xxx"

git push -u origin main

git pull
```

`push` 是把本地提交传到 GitHub，`pull` 是把远程最新代码拉下来。开始干活前看一下有没有新提交，这个习惯很重要。

> **💡 push的语法：**
> 基本语法：`git push <远程仓库名> <本地分支名>:<远程分支名>`
> 远程仓库默认是 `origin`。如果分支名只写一个，则默认本地与远程分支名相同。
> `-u` 是 `--set-upstream` 的简写，意思是设置上游分支。推送的同时，告诉 Git："以后这个本地分支就默认关联远程的 origin/main 了"

### 3.3 团队协作

新人先记住一句话：**不要直接改主分支，先开自己的分支，改完再合进去。**

最常见的顺序是这样的：

1. 先把主分支更新到最新。
2. 新建一个自己的分支。
3. 在这个分支上改代码、提交。
4. 推到 GitHub 上。
5. 让队友看一眼，确认没问题后再合并。

注意：

*   `main` 分支尽量保持稳定；
*   每次只改一件事，别把无关修改混在一起；
*   提交信息写清楚，不要只写 `update`；
*   你不确定的时候，先问队友，再提交。

### 3.4 合并冲突

冲突是正常的，不是什么大事。一般是你和队友改到了同一段代码。

Git 会在文件里标出来：

```bash
git pull
# 输出类似：CONFLICT (content): Merge conflict in src/armor_detector.cpp
```

打开文件后，你会看到类似这样的标记：

```cpp
<<<<<<< HEAD
// 远程（队友）的版本
float threshold = 200.0;
=======
// 你本地（自己）的版本
float threshold = 150.0;
>>>>>>> feature/my-branch
```

你要做的事情就是：把不需要的标记删掉，自己决定保留哪一边，或者把两边合起来。

```bash
git add src/armor_detector.cpp
git commit -m "合并 main 并解决 threshold 冲突"
git push
```

> **💡 如果你看不出来该留哪边，可以把冲突内容发给 AI。**
> **你的 Prompt 示范**：*"我在合并 Git 时遇到冲突，文件是 src/armor_detector.cpp。下面是冲突片段和上下文代码，请帮我分析应该保留哪部分，或者怎么把两边合并得更合理。"*

---

### 3.5 Public和Private
GitHub 仓库分为 Public（公开） 和 Private（私有） 两种类型，核心区别在于代码的可见范围。

Public (公开仓库)： 所有人可见。任何人都能在互联网上搜索、查看和下载你的代码。非常适合用来做开源项目、分享实用工具，或者作为展示个人编程能力的“简历”。（注：虽然大家都能看和下载，但只有你授权的人才能提交修改）。

Private (私有仓库)： 仅限内部可见。只有你以及你明确邀请的协作者（Collaborators）才能看到和访问这个仓库。适合用于商业项目、公司代码、尚未完成的草稿，或者包含敏感信息的个人备份。


> [!CAUTION]
>  如果你想把队里的代码clone下来，然后push到自己的仓库好好修改再提交上去，不要把自己的仓库设置成public！一定要注意设置成private！
> （我经常通过这种方式看别的队伍和自家队伍的仓库，每次都有新发现）
## 4. 常见问题

### 4.1 大文件别进仓库

数据集、模型、编译产物、日志文件，不要乱提交。仓库一旦被这些东西污染，后面处理起来会很麻烦。

### 4.2 密钥不要进 Git

这是最危险的情况之一。密钥一旦提交，基本就要按泄露处理：马上吊销，重新生成，再把它从仓库里移出去。

### 4.3 不要随便 `force push`

`git push --force` 不是普通命令。它会改写远程历史，容易把队友的提交直接覆盖掉。你不确定的时候，别用。

### 4.4 不会处理时，先把报错原文扔给 AI

> **💡 学习习惯：**
> Git 出问题时，不要只说“推不上去”或者“冲突了”。把完整报错、执行过的命令、当前分支状态一起给 AI，这样它才知道你在说什么。
>
> **你的 Prompt 示范**：*"我执行 `git push` 时提示 `Updates were rejected because the remote contains work that you do not have locally`，我现在在 `feature/fix-armor-threshold` 分支上。请告诉我这是什么原因，以及正常的处理顺序。"*

---

## 5. 学习资源

*   **官方文档**：
    🔗 [Git 官方文档](https://git-scm.com/doc)
    🔗 [GitHub Docs](https://docs.github.com/zh)
*   **图文教程**：
    🔗 [廖雪峰 Git 教程](https://www.liaoxuefeng.com/wiki/896043488029600)
*   **实操练习**：    
    🔗 [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN)
*   **视频**：
    *   **视频标题**：Git and GitHub for Beginners - Crash Course
    *   **视频链接**：[https://www.youtube.com/watch?v=RGOj5yH7evk](https://www.youtube.com/watch?v=RGOj5yH7evk)
    *   **学习建议**：先把 clone、add、commit、push、pull 这几个动作弄熟，再去看分支和冲突。