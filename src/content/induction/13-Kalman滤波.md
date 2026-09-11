---
title: "Kalman 滤波"
description: "卡尔曼滤波原理及其在视觉测量中的应用。"
author: "IC"
date: 2026-08-10
tags: ["Kalman", "滤波"]
status: done
draft: false
---

# 学卡尔曼滤波之前，先补线性代数

卡尔曼滤波的推导离不开矩阵运算，至少要掌握矩阵乘法这类基本计算，否则很难看懂公式是怎么推出来的。

有余力的话，再理解一下线性代数的几何意义。

推荐看 3Blue1Brown 的线性代数系列：

【【熟肉】线性代数的本质 - 01 - 向量究竟是什么？】 https://www.bilibili.com/video/BV1Ys411k7yQ/?share_source=copy_web&vd_source=1af1d715be39a4e3dd942d659c9846f6


# 卡尔曼滤波，看这个系列就够了
【【卡尔曼滤波器】1_递归算法_Recursive Processing】 https://www.bilibili.com/video/BV1ez4y1X7eR/?share_source=copy_web&vd_source=1af1d715be39a4e3dd942d659c9846f6

建议跟着手推一遍公式。

视频最后几章会讲到扩展卡尔曼滤波（EKF），后面做自瞄会用到，也建议一并学会。

