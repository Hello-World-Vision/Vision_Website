---
# ==============================================================================
# 开源项目模板（src/content/open-source/ 下的每个 .md 文件 = 一个项目）
# 字段说明：
#   repo / homepage / language / stars 均为选填，填了会在卡片上展示。
# ==============================================================================
title: "rm-vision-baseline 视觉自瞄基线库"
description: "覆盖相机标定、灯条识别、PnP 解算与串口通信的开源基线，开箱即用。"
author: "ZJU Vision Group"
date: 2026-04-12
repo: "https://github.com/ZJU-Vision/rm-vision-baseline"
homepage: "https://zju-vision.github.io/docs/open-source/rm-vision-baseline"
language: "C++"
stars: 128
tags: ["C++", "RoboMaster", "视觉", "开源"]
draft: false
---

## 项目简介

`rm-vision-baseline` 是视觉组沉淀下来的**模块化自瞄基线**，
新队员可以用它在一周内把「相机 → 识别 → 解算 → 发射」整条链路跑通。

## 模块划分

- `src/camera`  — 相机驱动与标定
- `src/detect`  — 灯条/装甲板识别
- `src/solve`   — PnP 位姿解算
- `src/serial`  — 与下位机串口通信

## 快速开始

```bash
git clone https://github.com/ZJU-Vision/rm-vision-baseline.git
cd rm-vision-baseline && mkdir build && cd build
cmake .. && make -j$(nproc)
./bin/vision_demo --video=../data/demo.mp4
```

## 开源协议

本项目采用 MIT 协议，欢迎任何人 fork 与贡献。
