---
title: "Linux 安装与环境部署讲解"
description: "Ubuntu 双系统安装与环境部署的核心思路和资料导航，包括启动盘、分区、UEFI、Secure Boot、BitLocker、硬件兼容性与显卡驱动。"
author: "Cicada"
date: 2026-08-10
tags: ["Linux", "Ubuntu", "环境配置", "双系统"]
status: done
draft: false
---

在开始 RoboMaster 视觉组的实际开发前，你需要准备一个能够运行 C++、CMake、OpenCV 和 ROS 的 Linux 环境。视觉组统一使用 Ubuntu 24.04 LTS，本文介绍 Windows 11 与 Ubuntu 24.04 LTS 双系统的安装准备、常见问题和安装后配置。

下载系统镜像时，必须选择 Ubuntu 24.04 LTS 的桌面版 ISO，从 [Ubuntu 官方下载页](https://ubuntu.com/download/desktop) 获取。不要下载 22.04、23.10 等其他版本，也不要使用来源不明的第三方镜像。统一版本可以让大家的依赖安装、ROS 配置和问题复现保持一致。

双系统安装涉及磁盘分区、UEFI 固件和系统引导。不同品牌、不同型号电脑的设置界面和默认配置并不相同，因此本文不提供一套可以直接套用到所有设备的操作步骤。动手前请备份重要数据，并根据自己的电脑型号核对教程中的每一步。

## 1. 为什么使用 Ubuntu

视觉算法和机器人开发并不要求所有电脑都使用同一种操作系统，但 Ubuntu 具有以下实际优势：

- ROS 官方通常优先支持 Ubuntu，安装文档和软件包也更集中。
- C++ 项目常用的 GCC、CMake、Git 和 `apt` 等工具在 Linux 下可以直接使用。
- 工业相机、串口设备和其他开发硬件的命令行工具及文档通常包含 Linux 支持。
- 视觉组不同成员使用相近的系统环境后，安装依赖和复现问题会更容易。

因此，视觉组的开发机统一使用 Ubuntu 24.04 LTS。即使你已经装过其他版本或其他发行版，也应按本文统一到 Ubuntu 24.04 LTS，以保证环境一致。

## 2. 安装前的学习资料

建议先用一份完整教程了解安装流程，再在实际操作时对照图文资料。外部教程中的电脑型号和 Ubuntu 版本可能与你的设备不同，涉及 BIOS、磁盘和驱动的部分不能直接照抄。

### 2.1 视频资料

1. **Ubuntu 24.04 + Windows 11 双系统安装全过程**

   - [视频链接](https://www.youtube.com/watch?v=EXyuSOSMt4A)
   - 重点了解制作启动盘、进入 BIOS、分配磁盘空间、安装系统和选择启动系统的完整流程。

2. **Dual Boot Windows and Ubuntu Linux in 10 Minutes (2026)**

   - [视频链接](https://www.youtube.com/watch?v=UTqDuWHbZkw)
   - 可重点查看 `04:12` 的 Rufus 操作、`06:30` 的 Windows 分区压缩和 `09:46` 的 Ubuntu 安装过程。

3. **Dual-Boot Made Easy: Manual Partitioning**

   - [视频链接](https://www.youtube.com/watch?v=alMwciirq6A)
   - 用于理解根目录 `/`、交换空间 `swap`、EFI 系统分区和手动分区之间的关系。

如果当前网络无法访问 YouTube，可以在 Bilibili 搜索 `Rufus Ventoy 完整使用教程`、`双系统 分区原理 Secure Boot` 或 `Ubuntu 双系统安装`，选择能够展示实际操作的教程。网络问题可以参考上一篇《基础网络配置》解决。

### 2.2 图文资料

1. **Ubuntu 24.04 LTS + Windows 11 双系统安装教程**

   - [教程链接](https://hs.cnies.org/archives/dual-boot-ubuntu2404-win11)
   - 这篇教程包含设备加密、Ventoy、BIOS、分区、安装、系统切换和时间同步等内容，适合安装时对照阅读。
   - 文中的机型是华硕天选 4。软件步骤可以参考，BIOS 菜单、快捷键和硬件设置仍应以自己的电脑为准。

2. **Windows + Ubuntu 22.04 双系统安装**

   - [参考链接](https://www.zywvvd.com/notes/system/linux/ubuntu-win-doublesys/ubuntu-win-doublesys/)
   - 这篇文章使用 Ubuntu 22.04，安装界面与 Ubuntu 24.04 可能不同，适合作为问题排查和装后配置的参考。
   - 其中涉及 BitLocker、显卡驱动、GRUB 和系统时间等主题，可在遇到对应问题时查阅。

3. **Ubuntu 官方安装文档**

   - [Install Ubuntu Desktop](https://ubuntu.com/tutorials/install-ubuntu-desktop)
   - 遇到安装器选项、磁盘识别或安装后设置问题时，优先核对官方文档。

搜索硬件相关问题时，应把电脑品牌和型号写进关键词，例如 `联想拯救者 Ubuntu 24.04 双系统`，比只搜索“Ubuntu 双系统黑屏”更容易找到适用方案。

## 3. 安装前需要理解的概念

### 3.1 ISO 镜像和启动盘

Ubuntu 的安装介质是一个 `.iso` 镜像文件，这里使用 Ubuntu 24.04 LTS 桌面版的 ISO。电脑不能把它当作普通压缩包直接安装，需要借助 Rufus、Ventoy 等工具制作启动盘。

制作完成后，电脑可以从 U 盘启动 Ubuntu 安装程序。写入启动盘会修改 U 盘内容，因此应使用可以清空的 U 盘，并确认没有误选移动硬盘或其他存储设备。

### 3.2 未分配空间和磁盘分区

如果要在保留 Windows 的同时安装 Ubuntu，通常需要先在 Windows 的“磁盘管理”中压缩现有分区，得到一块未分配空间。安装 Ubuntu 时再使用这块空间创建 Linux 分区。

不要在安装器中随意选择“擦除整个磁盘”或类似选项。此类选项可能删除 Windows 和磁盘上的数据。分区前应确认：

- 重要文件已经备份到其他存储设备；
- 目标磁盘和目标分区与自己的规划一致；
- 未分配空间确实来自计划安装 Ubuntu 的磁盘；
- 你知道安装器将如何使用 EFI 系统分区。

视觉开发会产生编译产物、数据集和日志，空间需求取决于你的硬盘容量和工作内容。原文建议至少预留 200 GB，这可以作为较宽裕的参考，但不是所有电脑都必须满足的固定值。空间不足时，后续管理数据集和构建目录会比较困难。

### 3.3 UEFI、GPT 和 Secure Boot

现代 Windows 11 电脑通常使用 UEFI 固件和 GPT 分区表。Ubuntu 安装时应尽量保持与 Windows 相同的启动方式，不要在 UEFI 和 Legacy/CSM 之间随意切换。

Secure Boot 用于验证启动组件的签名。Ubuntu 的官方安装介质和部分驱动支持 Secure Boot，因此它并不是所有设备都必须关闭的选项。只有在安装器、第三方驱动或设备固件确实出现兼容性问题，并且已经查阅设备和 Ubuntu 文档后，才考虑临时关闭。

如果关闭过 Secure Boot，应记录原始设置，并在确认驱动和启动链支持后决定是否重新开启。修改 BIOS 前最好拍照记录相关选项，避免出现问题后无法恢复。

### 3.4 BitLocker 和设备加密

Windows 11 可能启用了 BitLocker 或设备加密。修改 BIOS、启动方式或磁盘分区后，Windows 可能要求输入恢复密钥。

安装前至少完成以下准备：

1. 确认 Windows 是否启用了 BitLocker 或设备加密。
2. 在 Microsoft 账户或 Windows 设置中找到恢复密钥，并保存到安全位置。
3. 确认重要文件已有独立备份。
4. 只有在教程或设备要求明确时，才决定暂停或关闭加密；操作完成后应重新检查加密状态。

恢复密钥不是普通登录密码，无法用猜测替代。找不到恢复密钥时，不要继续修改分区或 BIOS。

## 4. Windows 侧准备

正式安装前，在 Windows 中完成以下检查：

1. 备份重要文件，尤其是桌面、下载目录和项目代码。
2. 准备 Ubuntu ISO、启动盘工具和一个可清空的 U 盘。
3. 备份 BitLocker 或设备加密恢复密钥。
4. 在“磁盘管理”中压缩目标分区，创建未分配空间。
5. 关闭 Windows 快速启动和休眠，避免 Windows 保持混合关机状态，影响另一系统访问磁盘。
6. 确认 Windows 当前能够正常启动，并记录现有 BIOS 启动模式。

不建议为了安装 Ubuntu 长期停用 Windows 更新。安装前可以让系统完成待处理的更新，或者在操作前暂缓一次更新；安装完成后仍应按正常方式维护 Windows。

## 5. 常见硬件问题

### 5.1 无法进入 BIOS 或启动菜单

插入 U 盘后电脑仍然直接进入 Windows，常见原因是没有打开启动菜单，或者选择了错误的启动项。

不同品牌的快捷键可能不同，以下表格只作参考：

| 品牌 | BIOS 设置 | Boot Menu |
| --- | --- | --- |
| 联想 | `F2` | `F12` |
| 戴尔 | `F2` | `F12` |
| 华硕 | `F2` 或 `Del` | `F8` 或 `Esc` |
| 惠普 | `F10` | `F9` |
| 微星 | `Del` | `F11` |
| 小米 / Redmi | `F2` | `F12` |

开机显示品牌标志时连续按对应按键，不要只按一次。也可以在 Windows 中通过“高级启动 -> UEFI 固件设置”进入 BIOS。快捷键和菜单名称以电脑厂商说明为准。

启动菜单中优先选择带有 `UEFI:` 前缀的 U 盘项，例如 `UEFI: SanDisk USB`。如果列表中没有 U 盘，重新检查 ISO 是否成功写入、U 盘是否损坏，以及 BIOS 是否识别到它。

### 5.2 VMD、RST 和磁盘无法识别

如果 Ubuntu 安装器看不到 Windows 磁盘或预留空间，可能与 Intel VMD/RST 存储模式有关，也可能是启动盘、固件或安装器版本的问题。

不要直接进入 BIOS 把 `RAID/VMD` 改为 `AHCI`。如果 Windows 没有提前准备好对应驱动和启动模式，直接修改可能导致 Windows 无法启动。应先查阅自己电脑型号的官方说明或可靠教程，确认是否需要切换、如何切换，以及如何在 Windows 安全模式下完成准备。无法确认时，先停止操作并备份数据。

### 5.3 Nvidia 独立显卡导致黑屏

部分搭载 Nvidia 显卡的电脑可能在启动安装器时黑屏或卡在厂商 Logo。原因可能涉及 Nouveau 驱动、固件设置、显示输出和内核版本，不能仅凭现象确定。

可以先尝试在 GRUB 安装启动项中临时加入 `nomodeset`：

1. 在启动菜单选择 Ubuntu 安装项。
2. 按 `e` 编辑启动参数。
3. 找到包含 `quiet splash` 的一行，在其后加入 `nomodeset`。
4. 按屏幕提示启动安装程序。

`nomodeset` 只是临时绕过显卡模式设置，可能降低显示效果，不能代替正式驱动配置。如果安装完成后仍然黑屏，应通过 TTY 或恢复模式安装与当前 Ubuntu 版本匹配的驱动，并记录完整的错误现象。

## 6. BIOS 中的基本检查

进入 BIOS 后，不要为了“照教程操作”修改所有选项。通常只需要确认以下内容：

1. 启动方式保持为 UEFI，不要随意启用 Legacy/CSM。
2. 通过一次性的 Boot Menu 选择 U 盘，优先于永久修改启动顺序。
3. 只有在确认存在兼容性问题时，才修改 Secure Boot，并记录原值。
4. 不要在没有了解后果的情况下修改存储控制器模式、磁盘模式或其他硬件选项。

如果必须修改启动顺序，安装完成后再检查默认启动项是否符合预期。每次改动前拍照记录，出现问题时可以按记录恢复。

## 7. 安装后配置

### 7.1 Nvidia 驱动

进入 Ubuntu 桌面后，可以使用图形界面安装推荐驱动：

`Software & Updates（软件和更新） -> Additional Drivers（附加驱动）`

选择与系统推荐、并标注为 `proprietary, tested` 的驱动，安装后重启。驱动名称会随显卡型号和 Ubuntu 版本变化，不要固定安装某个网上教程指定的版本。

如果图形界面无法使用，可以切换到 TTY：

```bash
sudo ubuntu-drivers autoinstall
sudo reboot
```

执行前应确认网络可用，并保留终端输出。遇到黑屏时，不要反复安装多个来源的驱动包。

### 7.2 双系统时间

Windows 和 Ubuntu 对硬件时钟的解释方式可能不同，表现为切换系统后时间相差数小时。优先按照当前 Ubuntu 和 Windows 版本的官方文档设置时间同步。

如果确认系统采用本地时间配置，可以执行：

```bash
timedatectl set-local-rtc 1
```

执行后检查状态：

```bash
timedatectl
```

### 7.3 GRUB 默认启动项

如果希望 GRUB 记住上次选择的系统，可以编辑 `/etc/default/grub`，将默认项改为保存模式，并启用保存功能：

```bash
sudo vim /etc/default/grub
```

确认或修改为：

```text
GRUB_DEFAULT=saved
GRUB_SAVEDEFAULT=true
```

然后更新配置：

```bash
sudo update-grub
```

修改系统启动配置前，建议先备份原文件。若只是想改变默认系统，也可以在 BIOS 的启动项中调整 Windows Boot Manager 或 Ubuntu 的优先级。

## 8. 安装完成后的检查

完成安装后，至少确认以下内容：

- Windows 和 Ubuntu 都能单独启动；
- Ubuntu 能识别键盘、网络、显示器和主要开发硬件；
- `git`、编译器和包管理器能够正常使用；
- Nvidia 驱动（如果需要）已经正确加载；
- BitLocker 或设备加密状态符合你的预期，恢复密钥仍然可用；
- 重要项目和数据已经有备份。

如果安装失败或系统无法启动，先记录电脑型号、Ubuntu 版本、最后一次修改的 BIOS 选项和完整错误信息，再搜索或提问。不要在没有记录现状的情况下连续修改多个设置，否则很难判断问题来自哪一步。
