---
title: "OpenCV 传统视觉"
description: "面向 RoboMaster 视觉组新成员的 OpenCV 与传统计算机视觉入门 —— 从基本数据结构、图像处理 API 到灯条与装甲板二维检测。"
author: "视觉组"
date: 2026-08-10
tags: ["OpenCV", "图像处理", "传统视觉", "RoboMaster"]
status: done
draft: false
---

> 本文面向第一次系统学习 OpenCV C++ 与传统计算机视觉的读者。目标很直接：**先学会使用 OpenCV 的常见对象与 API，再把这些基础工具组合成一个可解释、可调试的传统视觉 Detector。** 建议边读边编译，主动修改示例参数观察结果。

### 建议先收藏的 OpenCV 官方资料

OpenCV 的 API 很多，不建议靠记忆学习。遇到参数、数据类型或版本行为不确定时，优先查官方文档：

- **OpenCV Tutorials 总目录**  
  https://docs.opencv.org/4.x/d9/df8/tutorial_root.html
- **Linux 官方安装教程**  
  https://docs.opencv.org/4.x/d7/d9f/tutorial_linux_install.html
- **Core 模块教程：`Mat`、图像数据与基础运算**  
  https://docs.opencv.org/4.x/de/d7a/tutorial_table_of_content_core.html
- **Image Processing (`imgproc`) 教程目录**  
  https://docs.opencv.org/4.x/d7/da8/tutorial_table_of_content_imgproc.html
- **`cv::Mat` 官方入门教程**  
  https://docs.opencv.org/4.x/d6/d6d/tutorial_mat_the_basic_image_container.html

> 本文使用 **C++17 + OpenCV 4.x 风格 API**。如果你的本机版本不同，具体函数签名和行为以当前版本官方文档为准。

---

## 安装 OpenCV：先把环境跑通

对于 Ubuntu 新人，最省事的方式是直接使用发行版软件源安装 OpenCV C++ 开发包。执行：

```bash
# 更新 apt 软件包索引。
sudo apt update

# 安装：
# - libopencv-dev：OpenCV 的 C++ 头文件、动态库和 CMake 配置；
# - pkg-config：用于在命令行查询 OpenCV 的编译/链接参数；
# - cmake、g++：后续示例工程需要的基本构建工具。
sudo apt install -y libopencv-dev pkg-config cmake g++
```

安装完成后先确认系统能够找到 OpenCV：

```bash
# 输出系统当前安装的 OpenCV 版本。
pkg-config --modversion opencv4

# 如果希望查看编译器需要的 include / link 参数，可以执行：
pkg-config --cflags --libs opencv4
```

如果第一条命令能够输出类似 `4.x.x` 的版本号，说明基础安装已经完成。Ubuntu 软件源中的 OpenCV 版本可能落后于官方最新版本，但对于本文涉及的 `Mat`、`cvtColor`、`threshold`、`findContours`、`minAreaRect` 等基础内容通常足够使用。

如果你确实需要指定版本、`opencv_contrib`、特殊编译选项，或者希望自己控制 CUDA / GUI / codec 等依赖，再按照上面的 **Linux 官方安装教程**从源码使用 CMake 构建。新人阶段没有明确需求时，不建议一开始就自行编译整套 OpenCV。

---

## 0. 先建立整体认识

一套 RoboMaster 自瞄系统大致可以抽象为：

```text
工业相机 → 图像 → 目标检测 → 目标二维特征 → 位姿解算 → 目标状态估计 → 弹道解算 → 云台控制
```

本文主要处理其中的前半段：

```text
Image → Preprocess → Binary / Feature Image → Geometric Candidates → Light → Armor → 2D Corners
```

完成本文后，你应该能够理解一个简化的 Detector 为什么最终会输出类似的数据：

```cpp
struct Armor {
    cv::Point2f center;
    std::array<cv::Point2f, 4> corners;
};
```

这里的 `center` 和 `corners` 都还是**图像坐标系中的二维像素坐标**。本文先把重点放在二维图像处理与目标几何提取上。

还需要提前建立一个认识：**OpenCV 不等于计算机视觉算法。** OpenCV 为我们提供矩阵、图像读写、滤波、颜色转换、轮廓、几何拟合等基础工具；至于“哪个轮廓是灯条”“哪两根灯条能组成装甲板”，这些判断仍然需要你根据目标先验自行建立特征和判据。

---

# 第一部分：先学会使用 OpenCV

## 1. 第一个 OpenCV 程序

### 1.1 OpenCV 代码的常见模块

OpenCV 是一个规模很大的计算机视觉库。新人阶段最常接触下面几个模块：

| 模块 | 常见头文件 | 主要用途 |
| --- | --- | --- |
| Core | `opencv2/core.hpp` | `Mat`、`Point`、`Rect`、`Scalar` 等基础数据结构与矩阵运算 |
| Imgcodecs | `opencv2/imgcodecs.hpp` | `imread`、`imwrite`，图像文件读写 |
| HighGUI | `opencv2/highgui.hpp` | `imshow`、`waitKey`、窗口与 Trackbar |
| Imgproc | `opencv2/imgproc.hpp` | 颜色转换、滤波、阈值、形态学、轮廓、绘图等 |
| VideoIO | `opencv2/videoio.hpp` | `VideoCapture`、视频文件和普通摄像头读取 |

训练代码里也经常直接包含：

```cpp
#include <opencv2/opencv.hpp>
```

它会一次性引入大量常用 OpenCV 头文件，适合刚入门时减少配置负担。后续正式项目中可以根据模块按需包含头文件。

### 1.2 一个最小的 CMake 工程

建立如下目录：

```text
opencv_demo/
├── CMakeLists.txt
└── main.cpp
```

`CMakeLists.txt`：

```cmake
# 本工程至少要求 CMake 3.16。
cmake_minimum_required(VERSION 3.16)

# 创建一个名为 opencv_demo 的 C++ 工程。
project(opencv_demo LANGUAGES CXX)

# 本文示例统一使用 C++17。
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 查找系统已经安装的 OpenCV。
# REQUIRED 表示：如果找不到 OpenCV，CMake 直接报错停止配置，
# 而不是继续生成一个无法链接的工程。
find_package(OpenCV REQUIRED)

# 把 main.cpp 编译成可执行文件 opencv_demo。
add_executable(opencv_demo main.cpp)

# OpenCV_INCLUDE_DIRS 保存 OpenCV 头文件所在路径，
# 这样 #include <opencv2/opencv.hpp> 才能够被编译器找到。
target_include_directories(
    opencv_demo
    PRIVATE
    ${OpenCV_INCLUDE_DIRS}
)

# OpenCV_LIBS 保存当前 OpenCV 安装所需要链接的库。
# 不链接这些库时，代码可能能通过头文件编译，
# 但最终会在链接阶段出现 undefined reference。
target_link_libraries(
    opencv_demo
    PRIVATE
    ${OpenCV_LIBS}
)
```

编译：

```bash
mkdir -p build
cd build
cmake ..
cmake --build . -j
```

运行：

```bash
./opencv_demo ../test.jpg
```

### 1.3 完整示例一：读图、查看属性、ROI、绘制、显示和保存

下面这段代码不是为了展示复杂算法，而是让你第一次看到常用 OpenCV 对象如何一起工作。建议真正编译并运行，然后逐行修改参数观察结果。

```cpp
#include <opencv2/opencv.hpp>

#include <iostream>
#include <string>

int main(int argc, char** argv)
{
    // argc 是命令行参数数量，argv 是每个参数对应的字符串。
    // 这里要求用户在运行程序时额外提供一张图片的路径：
    // ./opencv_demo ../test.jpg
    if (argc < 2) {
        std::cerr
            << "Usage: "
            << argv[0]
            << " <image_path>\n";
        return 1;
    }

    // argv[1] 就是用户传入的图片路径。
    const std::string image_path = argv[1];

    // imread() 从磁盘读取图片并返回 cv::Mat。
    // IMREAD_COLOR 表示以 3 通道彩色图读取。
    // 在 OpenCV 中常规彩色图的通道顺序是 BGR，而不是 RGB。
    cv::Mat image =
        cv::imread(image_path, cv::IMREAD_COLOR);

    // OpenCV 的很多函数遇到错误时不会抛出 C++ 异常。
    // imread() 读取失败时，通常得到一个 empty Mat，
    // 因此读取文件后第一件事应该检查 image.empty()。
    if (image.empty()) {
        std::cerr
            << "Failed to read image: "
            << image_path
            << '\n';
        return 1;
    }

    // rows = 行数 = 图像高度；
    // cols = 列数 = 图像宽度。
    std::cout << "width    = " << image.cols << '\n';
    std::cout << "height   = " << image.rows << '\n';

    // channels() 返回通道数量。
    // 常见 BGR 图为 3，灰度图为 1。
    std::cout
        << "channels = "
        << image.channels()
        << '\n';

    // type() 返回 OpenCV 内部的类型编码。
    // 例如常见 BGR 图通常是 CV_8UC3。
    std::cout
        << "type     = "
        << image.type()
        << '\n';

    // 取图像中心像素。
    const int x = image.cols / 2;
    const int y = image.rows / 2;

    // 对 CV_8UC3 图像，一个像素可以用 cv::Vec3b 表示：
    // 3 = 三个通道，b = unsigned char / byte。
    //
    // 注意 at() 的两个二维下标是 (row, col)，
    // 也就是 (y, x)，不是平时说坐标时习惯的 (x, y)。
    const cv::Vec3b pixel =
        image.at<cv::Vec3b>(y, x);

    // Vec3b 的通道顺序：
    // pixel[0] = Blue
    // pixel[1] = Green
    // pixel[2] = Red
    std::cout
        << "center pixel BGR = "
        << static_cast<int>(pixel[0]) << ", "
        << static_cast<int>(pixel[1]) << ", "
        << static_cast<int>(pixel[2]) << '\n';

    // 构造一个位于图像中央、宽高都是原图一半的 ROI。
    const int roi_width  = image.cols / 2;
    const int roi_height = image.rows / 2;
    const int roi_x =
        (image.cols - roi_width) / 2;
    const int roi_y =
        (image.rows - roi_height) / 2;

    // Rect(x, y, width, height)：
    // (x, y) 是矩形左上角，后两个参数是宽和高。
    const cv::Rect roi_rect(
        roi_x,
        roi_y,
        roi_width,
        roi_height
    );

    // image(roi_rect) 并没有复制 ROI 中所有像素。
    // roi 通常只是一个指向原 image 局部区域的 Mat 视图，
    // 修改 roi 中的像素也可能同时修改 image。
    cv::Mat roi = image(roi_rect);

    // 为了在调试图上画框，同时保留 image 原始内容，
    // 这里显式使用 clone() 做一次深拷贝。
    cv::Mat debug = image.clone();

    // 对普通 BGR 图像，Scalar 的前三个值同样按 B、G、R 排列。
    const cv::Scalar green(0, 255, 0);
    const cv::Scalar red(0, 0, 255);

    // 在 debug 上画出 ROI 边界。
    // 最后的 2 表示线宽为 2 像素。
    cv::rectangle(
        debug,
        roi_rect,
        green,
        2
    );

    // 在图像中心画一个实心红点。
    cv::circle(
        debug,
        cv::Point(x, y),
        6,
        red,
        cv::FILLED
    );

    // 在图像左上角绘制文字。
    // FONT_HERSHEY_SIMPLEX 是字体；
    // 1.0 是字体缩放系数；
    // 最后的 2 是文字线宽。
    cv::putText(
        debug,
        "OpenCV demo",
        cv::Point(20, 40),
        cv::FONT_HERSHEY_SIMPLEX,
        1.0,
        green,
        2
    );

    // imshow() 只负责把 Mat 提交给 GUI 窗口显示。
    cv::imshow("original", image);
    cv::imshow("roi", roi);
    cv::imshow("debug", debug);

    // 把调试图写回磁盘。
    // 文件扩展名会影响最终编码格式。
    if (!cv::imwrite("debug_output.jpg", debug)) {
        std::cerr
            << "Failed to save debug_output.jpg\n";
    }

    // HighGUI 的窗口刷新和键盘事件由 waitKey() 驱动。
    // waitKey(0) 表示一直等待，直到用户按键。
    cv::waitKey(0);

    return 0;
}
```

这一个程序已经使用了 `cv::Mat`、`cv::Vec3b`、`cv::Rect`、`cv::Point`、`cv::Scalar`、`imread`、`imwrite`、`rectangle`、`circle`、`putText`、`imshow` 和 `waitKey`。不要急着记住函数参数；先明确每个对象代表什么、每一步输入和输出是什么。

---

## 2. OpenCV 最常见的数据结构

OpenCV C++ 代码的基础不是“很多神秘函数”，而是少数几个会反复出现的数据结构。先把这些对象看懂，后面读任何视觉代码都会轻松很多。

| 类型 | 含义 | 常见用途 |
| --- | --- | --- |
| `cv::Mat` | 多维稠密数组，图像最常见的载体 | 图像、Mask、矩阵、中间结果 |
| `cv::Point` / `Point2f` | 二维点 | 像素坐标、中心、角点 |
| `cv::Point3f` | 三维点 | 后续 PnP、空间几何 |
| `cv::Size` / `Size2f` | 宽和高 | 图像尺寸、卷积核尺寸、矩形尺寸 |
| `cv::Rect` / `Rect2f` | 水平矩形 | ROI、Bounding Box |
| `cv::Scalar` | 最多四个标量组成的值 | 颜色、上下阈值、矩阵初始化 |
| `cv::Vec3b` | 长度为 3 的 `uchar` 向量 | 读取一个 BGR 像素 |
| `cv::RotatedRect` | 带中心、尺寸和角度的旋转矩形 | 细长目标、灯条几何拟合 |
| `cv::Moments` | 图像/轮廓矩 | 面积、质心等形状信息 |

### 2.1 `cv::Point`：坐标最基础的表达

```cpp
cv::Point p1(100, 50);          // int
cv::Point2f p2(100.5f, 50.2f); // float

std::cout << p2.x << ", " << p2.y << '\n';
```

图像坐标系原点位于左上角，`x` 向右、`y` 向下。注意这和数学课中常用的笛卡尔坐标系不一样。

### 2.2 `cv::Size`：宽和高

```cpp
cv::Size image_size(1280, 1024);
cv::Size kernel_size(5, 5);

std::cout << image_size.width << '\n';
std::cout << image_size.height << '\n';
```

OpenCV 中 `Size(width, height)` 的顺序和 `Mat(rows, cols)` 的顺序不同。新人要有意识地区分“宽高”和“行列”。

### 2.3 `cv::Rect`：水平矩形和 ROI

```cpp
cv::Rect rect(100, 80, 300, 200);
// x = 100, y = 80, width = 300, height = 200

cv::Mat roi = image(rect);
```

`image(rect)` 默认是**视图**，与原图共享底层数据。如果希望得到完全独立的 ROI：

```cpp
cv::Mat roi_copy = image(rect).clone();
```

### 2.4 `cv::Scalar`：颜色和多通道常量

```cpp
cv::Scalar blue(255, 0, 0);
cv::Scalar green(0, 255, 0);
cv::Scalar red(0, 0, 255);
```

对于普通 BGR 图像，顺序同样是 B、G、R。`Scalar` 还常用于 `inRange`：

```cpp
cv::Scalar lower_hsv(90, 80, 80);
cv::Scalar upper_hsv(130, 255, 255);
```

### 2.5 `cv::RotatedRect`

```cpp
cv::RotatedRect rotated(
    cv::Point2f(300.0f, 200.0f),
    cv::Size2f(40.0f, 120.0f),
    20.0f
);

cv::Point2f vertices[4];
rotated.points(vertices);
```

它保存中心 `center`、尺寸 `size` 和角度 `angle`。在比赛代码中，不建议让 OpenCV 自身的宽高和角度约定直接传播到整个工程；更好的做法是在 Detector 内部把它转换成战队自己定义的 `Light`，统一“长边”“短边”“倾角”的意义。

---

## 3. `cv::Mat`：OpenCV 最重要的对象

### 3.1 图像的本质

一张 8 bit 灰度图可以理解成一个二维数组，每个位置是 `0~255` 的亮度值；普通 8 bit BGR 彩色图则可以理解成“每个位置包含 3 个 `uchar` 数值”的二维数组。

![OpenCV 官方教程用一块局部区域说明：人眼看到的是图像，计算机实际处理的是像素数值矩阵](https://docs.opencv.org/4.x/MatBasicImageForComputer.jpg)

*图：OpenCV 官方 `Mat - The Basic Image Container` 教程中的示意图。它非常直观地说明了为什么 `cv::Mat` 是学习 OpenCV 的起点。*

常见 `Mat` 类型：

| 类型 | 含义 | 常见场景 |
| --- | --- | --- |
| `CV_8UC1` | 8 bit 无符号、1 通道 | 灰度图、二值图 |
| `CV_8UC3` | 8 bit 无符号、3 通道 | BGR 彩色图 |
| `CV_16UC1` | 16 bit 无符号、1 通道 | 部分深度图、工业相机数据 |
| `CV_32FC1` | 32 bit float、1 通道 | 浮点计算结果 |
| `CV_32FC3` | 32 bit float、3 通道 | 浮点三通道图像 |

你可以用这些接口查看一张 `Mat`：

```cpp
std::cout << image.rows << '\n';
std::cout << image.cols << '\n';
std::cout << image.channels() << '\n';
std::cout << image.depth() << '\n';
std::cout << image.type() << '\n';
std::cout << image.size() << '\n';
std::cout << std::boolalpha << image.empty() << '\n';
```

### 3.2 浅拷贝与深拷贝

```cpp
cv::Mat a = image;         // 通常共享底层数据
cv::Mat b = image.clone(); // 独立复制
image.copyTo(b);           // 也是显式复制
```

`cv::Mat` 内部使用引用计数管理数据，因此普通赋值通常不会复制整张图。如果 `a` 和 `image` 共享数据，对其中一个修改像素可能影响另一个。这个特性很高效，但也会制造隐蔽 bug，所以必须建立“这个 Mat 是视图还是独立数据”的意识。

### 3.3 像素访问

灰度图：

```cpp
uchar value = gray.at<uchar>(y, x);
```

BGR 图：

```cpp
cv::Vec3b pixel = image.at<cv::Vec3b>(y, x);

uchar b = pixel[0];
uchar g = pixel[1];
uchar r = pixel[2];
```

这里必须再次强调：`at` 常用的二维索引是 `(row, col)`，也就是 `(y, x)`。

对大图逐像素循环时，`at()` 更适合教学和低频访问；需要高性能连续遍历时，常见做法是按行使用 `ptr<T>()`：

```cpp
for (int y = 0; y < gray.rows; ++y) {
    uchar* row = gray.ptr<uchar>(y);

    for (int x = 0; x < gray.cols; ++x) {
        if (row[x] > 200) {
            row[x] = 255;
        }
    }
}
```

新人阶段优先保证正确性和可读性，不要在没有 Profile 的情况下为了“可能更快”写复杂指针代码。

---

## 4. 图像与视频的输入输出

### 4.1 `imread`、`imwrite`

```cpp
cv::Mat color = cv::imread("image.jpg", cv::IMREAD_COLOR);
cv::Mat gray  = cv::imread("image.jpg", cv::IMREAD_GRAYSCALE);

if (color.empty()) {
    // 读取失败
}

cv::imwrite("result.png", color);
```

不要假设文件一定读取成功。路径错误、工作目录错误和文件损坏都可能让 `imread` 返回空图。

### 4.2 `imshow`、`waitKey`

```cpp
cv::imshow("image", image);

int key = cv::waitKey(1);
if (key == 27) {
    // ESC
}
```

在处理视频时，`waitKey(1)` 常被用来刷新窗口并读取键盘输入。调试 GUI 是非常方便的工具，但正式上车程序通常不会依赖 GUI 窗口。

### 4.3 `VideoCapture`

`VideoCapture` 可以读取普通视频文件，也可以打开系统摄像头。工业相机在 RM 项目中往往使用厂商 SDK，不一定直接通过 `VideoCapture`，但理解这个接口有助于新人先使用普通视频进行离线实验。

#### 完整示例二：读取视频并实时处理

```cpp
#include <opencv2/opencv.hpp>

#include <iostream>
#include <string>

int main(int argc, char** argv)
{
    // 运行方式：
    // ./opencv_demo ../test.mp4
    if (argc < 2) {
        std::cerr
            << "Usage: "
            << argv[0]
            << " <video_path>\n";
        return 1;
    }

    // VideoCapture 可以读取视频文件，也可以打开普通摄像头。
    // 传入字符串路径时，OpenCV 会尝试使用可用的视频后端解码文件。
    cv::VideoCapture capture(argv[1]);

    // 视频打开失败时必须立即停止。
    // 常见原因包括：路径错误、文件损坏、缺少对应 codec/backend。
    if (!capture.isOpened()) {
        std::cerr << "Failed to open video.\n";
        return 1;
    }

    // frame 用于保存每次从视频流中读取的一帧。
    // read() 会在需要时为 Mat 分配或复用内存。
    cv::Mat frame;

    // capture.read(frame) 成功读取一帧时返回 true；
    // 到达视频末尾或读取失败时返回 false。
    while (capture.read(frame)) {
        if (frame.empty()) {
            break;
        }

        cv::Mat gray;
        cv::Mat blurred;
        cv::Mat edges;

        // BGR 彩色图 -> 单通道灰度图。
        // Canny 主要处理亮度梯度，因此通常先转 Gray。
        cv::cvtColor(
            frame,
            gray,
            cv::COLOR_BGR2GRAY
        );

        // 高斯滤波抑制一部分高频噪声。
        // Size(5, 5) 是卷积核尺寸，1.2 是高斯 sigma。
        // 这里单独输出 blurred，避免把 gray 原地覆盖，
        // 新人调试时更容易同时查看不同阶段的结果。
        cv::GaussianBlur(
            gray,
            blurred,
            cv::Size(5, 5),
            1.2
        );

        // Canny 根据局部梯度寻找边缘。
        // 80 和 160 是低、高阈值，只是教程示例参数。
        cv::Canny(
            blurred,
            edges,
            80,
            160
        );

        // 同时显示原始帧和边缘图，
        // 可以直观看到“输入 -> 中间结果”的变化。
        cv::imshow("frame", frame);
        cv::imshow("gray", gray);
        cv::imshow("edges", edges);

        // waitKey(1) 最多等待约 1 ms，同时让 HighGUI 刷新窗口。
        // 返回值是按键码；ESC=27，或者按 q 时退出循环。
        const int key = cv::waitKey(1);
        if (key == 27 || key == 'q') {
            break;
        }
    }

    // capture 离开作用域时会自动释放资源；
    // 也可以显式调用 capture.release()。
    return 0;
}
```

这段代码已经非常接近真实视觉程序的最小循环：**取一帧 → 处理 → 输出结果 → 进入下一帧**。后续 Detector 只是在“处理”这一步中加入更多内容。

---

# 第二部分：常见图像处理操作

## 5. 颜色空间、通道与 Mask

### 5.1 BGR、Gray、HSV

OpenCV 常规彩色图最常见的是 BGR。灰度图只保留单通道亮度信息；HSV 则把颜色大致拆成 Hue（色相）、Saturation（饱和度）和 Value（明度），在需要按颜色做规则分割时往往更加直观。

转换使用 `cvtColor`：

```cpp
cv::Mat gray;
cv::Mat hsv;

cv::cvtColor(image, gray, cv::COLOR_BGR2GRAY);
cv::cvtColor(image, hsv, cv::COLOR_BGR2HSV);
```

对标准 8 bit `COLOR_BGR2HSV` 转换，OpenCV 将 H 压缩到约 `0~179` 的整数范围，S、V 为 `0~255`。因此不要直接把网上以“角度 0~360°”表示的 HSV 数值原样复制进 OpenCV 阈值。

### 5.2 `split` 和 `merge`

如果需要单独访问通道：

```cpp
std::vector<cv::Mat> channels;
cv::split(image, channels);

cv::Mat blue  = channels[0];
cv::Mat green = channels[1];
cv::Mat red   = channels[2];

cv::Mat merged;
cv::merge(channels, merged);
```

传统 RM 视觉中有时也会直接构造通道差，例如 `B - R` 或 `R - B`，利用敌我灯条颜色差异增强目标。但是否有效取决于相机、曝光、赛场环境和数据，不能把某一种通道差视为固定模板。

### 5.3 `inRange` 与 Mask

```cpp
cv::Scalar lower_blue(90, 80, 80);
cv::Scalar upper_blue(130, 255, 255);

cv::Mat mask;
cv::inRange(hsv, lower_blue, upper_blue, mask);
```

`mask` 是一张 `CV_8UC1` 图像：满足范围的像素变成 255，不满足的像素变成 0。Mask 可以进一步用于提取原图内容：

```cpp
cv::Mat selected;
cv::bitwise_and(image, image, selected, mask);
```

这背后的核心思想不是“调用 `inRange`”，而是把自然语言中的“颜色接近蓝色且足够饱和、足够亮”转换成数值区间。

---

## 6. 尺寸变换与滤波

### 6.1 `resize`

```cpp
cv::Mat resized;
cv::resize(
    image,
    resized,
    cv::Size(640, 480),
    0.0,
    0.0,
    cv::INTER_LINEAR
);
```

缩小图像可以减少后续计算量，但也会损失细节。视觉算法中不要为了追求 FPS 盲目降低分辨率，应该通过数据验证目标在远距离时仍然保留足够像素。

### 6.2 `GaussianBlur`

```cpp
cv::Mat blurred;
cv::GaussianBlur(
    gray,
    blurred,
    cv::Size(5, 5),
    1.2
);
```

Gaussian Blur 常用于抑制高频噪声，让阈值或边缘检测更稳定。滤波也会削弱细节，因此 kernel 越大并不代表效果越好。

### 6.3 `medianBlur`

```cpp
cv::medianBlur(gray, blurred, 5);
```

中值滤波对椒盐类孤立噪声尤其直观。实际工程中应该根据噪声类型选择滤波方法，而不是把 Gaussian Blur、Median Blur、Morphology 全部无脑叠加。

### 6.4 其他常见函数

新人后续读工程时还会遇到：

```cpp
cv::flip(...);       // 翻转
cv::rotate(...);     // 旋转
cv::normalize(...);  // 归一化
cv::absdiff(...);    // 绝对差
cv::minMaxLoc(...);  // 查找最小/最大值及位置
cv::countNonZero(...);// 统计非零像素
```

这些不需要在第一次学习时全部掌握，但应该知道 OpenCV 里存在这类基础数组和图像操作。

---

## 7. 二值化

### 7.1 `threshold`

```cpp
cv::Mat binary;

cv::threshold(
    gray,
    binary,
    180,
    255,
    cv::THRESH_BINARY
);
```

它的含义是把连续灰度值压缩成两类：满足条件的像素变成前景，不满足的变成背景。固定阈值最大的优点是简单、快速、可解释；最大的缺点是对曝光和光照变化敏感。

![OpenCV 官方阈值教程示例：左侧为输入图像，右侧为按阈值分割后的结果](https://docs.opencv.org/4.x/Threshold_Tutorial_Theory_Example.jpg)

*图：OpenCV 官方 `Basic Thresholding Operations` 教程。二值化的关键不是“把图片变成黑白”，而是把连续像素值根据一个判据划分成前景和背景。*

常见阈值类型还包括：

```cpp
cv::THRESH_BINARY
cv::THRESH_BINARY_INV
cv::THRESH_TRUNC
cv::THRESH_TOZERO
cv::THRESH_OTSU
```

新人阶段重点掌握 `THRESH_BINARY`，知道 Otsu 等自动阈值方法存在即可。

### 7.2 `adaptiveThreshold`

```cpp
cv::adaptiveThreshold(
    gray,
    binary,
    255,
    cv::ADAPTIVE_THRESH_GAUSSIAN_C,
    cv::THRESH_BINARY,
    11,
    2
);
```

自适应阈值根据局部区域计算阈值，适合亮度分布不均的一些问题，但计算更复杂，也不意味着它一定比固定阈值更适合 RM。比赛算法需要根据实际图像验证，而不是按“高级程度”选择函数。

---

## 8. 形态学操作

形态学主要处理二值图或 Mask 的局部结构。最常见的四个概念是腐蚀、膨胀、开运算和闭运算。

先创建结构元素：

```cpp
cv::Mat kernel = cv::getStructuringElement(
    cv::MORPH_RECT,
    cv::Size(3, 3)
);
```

然后可以：

```cpp
cv::erode(binary, eroded, kernel);
cv::dilate(binary, dilated, kernel);

cv::morphologyEx(
    binary,
    opened,
    cv::MORPH_OPEN,
    kernel
);

cv::morphologyEx(
    binary,
    closed,
    cv::MORPH_CLOSE,
    kernel
);
```

直观理解：

| 操作 | 直观效果 | 常见用途 |
| --- | --- | --- |
| Erode | 白色区域收缩 | 去掉细小突出、断开细连接 |
| Dilate | 白色区域扩张 | 填补小裂缝、连接邻近区域 |
| Open | 先腐蚀再膨胀 | 去除小白噪点 |
| Close | 先膨胀再腐蚀 | 填补小黑洞、连接断裂目标 |

<p align="center">
  <img src="https://docs.opencv.org/4.x/Morphology_1_Tutorial_Theory_Original_Image.png" width="25%" alt="Original morphology image">
  <img src="https://docs.opencv.org/4.x/Morphology_1_Tutorial_Theory_Dilation.png" width="25%" alt="Dilation result">
  <img src="https://docs.opencv.org/4.x/Morphology_1_Tutorial_Theory_Erosion.png" width="25%" alt="Erosion result">
</p>

<p align="center"><em>OpenCV 官方形态学教程示例：原图（左）、膨胀（中）、腐蚀（右）。观察白色前景的边界如何向外扩张或向内收缩。</em></p>

形态学不是每个 Pipeline 的强制步骤。每增加一次处理，就增加计算量、参数和失败模式；只有当它能够稳定解决真实数据中的问题时才应该加入。

---

## 9. 边缘检测

最常见的边缘检测接口之一是 `Canny`：

```cpp
cv::Mat edges;
cv::Canny(gray, edges, 80, 160);
```

边缘表示图像灰度变化剧烈的位置。它在轮廓、形状、标定板等任务中很常见，但 RoboMaster 灯条检测不一定必须经过 Canny：如果颜色/亮度二值化已经得到干净的白色目标区域，可以直接寻找轮廓。

这里体现出一个重要原则：**不要因为学过某个函数，就强行把它塞进 Pipeline。**

---

# 第三部分：从像素到几何对象

## 10. 轮廓 `findContours`

### 10.1 Contour 的定义

轮廓可以理解为一组按边界顺序排列的二维点。在 C++ 中最常见的存储形式是：

```cpp
std::vector<std::vector<cv::Point>> contours;
```

外层 `vector` 表示“有很多条轮廓”，内层 `vector<cv::Point>` 表示“一条轮廓由很多二维点组成”。

最常用的调用：

```cpp
cv::findContours(
    binary,
    contours,
    cv::RETR_EXTERNAL,
    cv::CHAIN_APPROX_SIMPLE
);
```

两个参数尤其需要理解：

- `RETR_EXTERNAL`：只取最外层轮廓，适合很多目标候选提取问题；
- `CHAIN_APPROX_SIMPLE`：压缩共线点，通常可以明显减少轮廓点数量；
- 与之相对的 `CHAIN_APPROX_NONE` 会保留边界上的全部点。对于一个矩形，很多共线像素点实际上并没有提供新的几何信息，所以基础目标检测里经常优先使用 `CHAIN_APPROX_SIMPLE`。

![OpenCV 官方轮廓教程：左侧 CHAIN_APPROX_NONE 保存大量边界点，右侧 CHAIN_APPROX_SIMPLE 只保留必要拐点](https://docs.opencv.org/4.x/none.jpg)

*图：OpenCV 官方 Contours 教程。示例中矩形使用 `CHAIN_APPROX_NONE` 时保存数百个点，而 `CHAIN_APPROX_SIMPLE` 可以压缩到少量拐点。*

其他 Retrieval Mode（例如 `RETR_LIST`、`RETR_TREE`）在需要轮廓层级关系时再学习。

### 10.2 轮廓的常用几何特征

```cpp
double area = cv::contourArea(contour);
double perimeter = cv::arcLength(contour, true);

cv::Rect box = cv::boundingRect(contour);
cv::RotatedRect rotated = cv::minAreaRect(contour);

cv::Moments m = cv::moments(contour);
```

质心可以通过 Moments 得到：

```cpp
if (std::abs(m.m00) > 1e-6) {
    cv::Point2f center(
        static_cast<float>(m.m10 / m.m00),
        static_cast<float>(m.m01 / m.m00)
    );
}
```

此外还会遇到：

```cpp
cv::approxPolyDP(...); // 多边形近似
cv::convexHull(...);   // 凸包
cv::isContourConvex(...);
```

这些函数在矩形、标志物、特殊形状检测中非常常见。本文主线不会逐一展开，但你应该知道它们属于“从轮廓提取形状信息”这一类工具。

### 10.3 完整示例三：颜色分割、形态学、轮廓和旋转矩形

下面这段程序展示了一条完整但通用的传统视觉 Pipeline。它会读取一张图片，在 HSV 中提取蓝色区域，进行形态学处理，寻找轮廓，并用 `minAreaRect` 拟合候选区域。

```cpp
#include <opencv2/opencv.hpp>

#include <iostream>
#include <vector>

int main(int argc, char** argv)
{
    if (argc < 2) {
        std::cerr
            << "Usage: "
            << argv[0]
            << " <image_path>\n";
        return 1;
    }

    // 读取 BGR 彩色图。
    cv::Mat image =
        cv::imread(argv[1], cv::IMREAD_COLOR);

    if (image.empty()) {
        std::cerr << "Failed to read image.\n";
        return 1;
    }

    // ---------- Stage 1: 颜色空间转换 ----------
    //
    // BGR 中“颜色”和“亮度”混在三个通道里。
    // HSV 把 Hue / Saturation / Value 分开，
    // 方便我们直接使用一个范围描述“蓝色且足够亮”。
    cv::Mat hsv;
    cv::cvtColor(
        image,
        hsv,
        cv::COLOR_BGR2HSV
    );

    // ---------- Stage 2: 颜色范围分割 ----------
    //
    // lower_blue / upper_blue 是 HSV 三个通道的上下界。
    // 下面的数值只用于教学演示，不是 RM 比赛标准参数。
    //
    // 对标准 8-bit OpenCV HSV：
    // H 常用范围约为 [0, 179]；
    // S、V 常用范围为 [0, 255]。
    const cv::Scalar lower_blue(90, 80, 80);
    const cv::Scalar upper_blue(130, 255, 255);

    cv::Mat mask;
    cv::inRange(
        hsv,
        lower_blue,
        upper_blue,
        mask
    );

    // mask 是 CV_8UC1 单通道图：
    // 满足范围的像素 = 255（白）；
    // 不满足范围的像素 = 0（黑）。

    // ---------- Stage 3: 形态学去噪 ----------
    //
    // 先生成一个 3x3 矩形结构元素。
    // kernel 的形状和大小会直接影响处理结果。
    const cv::Mat kernel =
        cv::getStructuringElement(
            cv::MORPH_RECT,
            cv::Size(3, 3)
        );

    cv::Mat cleaned;

    // MORPH_OPEN = 先腐蚀，再膨胀。
    // 对“白色前景 + 黑色背景”的二值图，
    // 常用来去掉一些比目标小得多的孤立白点。
    cv::morphologyEx(
        mask,
        cleaned,
        cv::MORPH_OPEN,
        kernel
    );

    // ---------- Stage 4: 从像素区域提取轮廓 ----------
    //
    // 一条 contour 本质上是一组 Point；
    // contours 是“很多条轮廓”的集合。
    std::vector<std::vector<cv::Point>> contours;

    cv::findContours(
        cleaned,
        contours,
        cv::RETR_EXTERNAL,      // 只取最外层轮廓
        cv::CHAIN_APPROX_SIMPLE // 压缩共线边界点
    );

    // 后面的线框、文字只画到 debug，
    // 不修改原始 image，便于对照。
    cv::Mat debug = image.clone();

    // ---------- Stage 5: 逐个分析轮廓 ----------
    for (const auto& contour : contours) {
        // contourArea() 返回轮廓内部面积，单位约为 pixel^2。
        const double area =
            cv::contourArea(contour);

        // 很小的连通区域更可能是噪声。
        // 30.0 只是示例阈值，真实项目应来自数据统计。
        if (area < 30.0) {
            continue;
        }

        // 用最小面积旋转矩形包住当前轮廓。
        // 相比 boundingRect()，它允许矩形旋转，
        // 因而更适合描述倾斜的细长目标。
        const cv::RotatedRect rect =
            cv::minAreaRect(contour);

        // RotatedRect::points() 把旋转矩形转换成 4 个角点，
        // 这样就可以用 line() 把矩形真正画到图像上。
        cv::Point2f vertices[4];
        rect.points(vertices);

        for (int i = 0; i < 4; ++i) {
            cv::line(
                debug,
                vertices[i],
                vertices[(i + 1) % 4],
                cv::Scalar(0, 255, 0),
                2
            );
        }

        // 用一个红色实心点标记旋转矩形中心。
        cv::circle(
            debug,
            rect.center,
            3,
            cv::Scalar(0, 0, 255),
            cv::FILLED
        );

        // 把每个候选的几何参数打印出来。
        // 新人建议实际旋转目标，观察 size / angle 怎样变化。
        std::cout
            << "area=" << area
            << ", center=("
            << rect.center.x << ", "
            << rect.center.y << ")"
            << ", size=("
            << rect.size.width << ", "
            << rect.size.height << ")"
            << ", angle="
            << rect.angle
            << '\n';
    }

    // 同时查看 Pipeline 的关键中间结果：
    // 原图 -> 原始 Mask -> 形态学结果 -> 最终几何结果。
    cv::imshow("image", image);
    cv::imshow("mask", mask);
    cv::imshow("cleaned", cleaned);
    cv::imshow("result", debug);

    cv::waitKey(0);
    return 0;
}
```

读这类代码时，不要从第一行开始机械地记 API。先从 Pipeline 看：**颜色空间转换 → 分割 → 去噪 → 轮廓 → 几何拟合 → 可视化。** 当你知道每一层解决什么问题以后，函数名才真正有意义。

---

## 11. 绘图函数与 Debug 可视化

视觉开发中，“把中间结果画出来”是最重要的调试方法之一。常用绘制函数：

```cpp
cv::line(...)
cv::rectangle(...)
cv::circle(...)
cv::ellipse(...)
cv::polylines(...)
cv::drawContours(...)
cv::putText(...)
```

典型用途不是“把结果画漂亮”，而是验证你的算法究竟看到了什么。例如：

- 所有轮廓画成灰色；
- 通过面积筛选的候选画成黄色；
- 通过完整灯条筛选的候选画成绿色；
- 最终装甲板画四角点和中心；
- 被拒绝候选旁边写出 `ratio`、`angle` 等数值。

这样当最终结果错误时，你可以快速判断问题发生在 Pipeline 哪一级。

---

## 12. Trackbar：把“反复改代码”变成“实时调参数”

对于阈值、HSV 区间、形态学 kernel 等参数，OpenCV 的 Trackbar 很适合教学和初步数据观察。

完整示例：

```cpp
#include <opencv2/opencv.hpp>

#include <iostream>

int main(int argc, char** argv)
{
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <image_path>\n";
        return 1;
    }

    cv::Mat image = cv::imread(argv[1]);
    if (image.empty()) {
        return 1;
    }

    cv::Mat hsv;
    cv::cvtColor(image, hsv, cv::COLOR_BGR2HSV);

    int h_min = 90;
    int h_max = 130;
    int s_min = 80;
    int v_min = 80;

    cv::namedWindow("control");

    // createTrackbar() 把一个整数变量绑定到 GUI 滑块。
    // 当你拖动滑块时，对应变量会自动更新。
    // 标准 8-bit HSV 中 H 最大常用 179，因此这里上限设为 179；
    // S / V 为 8 bit，所以上限为 255。
    cv::createTrackbar("H min", "control", &h_min, 179);
    cv::createTrackbar("H max", "control", &h_max, 179);
    cv::createTrackbar("S min", "control", &s_min, 255);
    cv::createTrackbar("V min", "control", &v_min, 255);

    while (true) {
        cv::Mat mask;

        // 每一轮循环都读取当前滑块值，重新生成 Mask。
        // 这样拖动 H/S/V 参数时，窗口里的结果会立即变化。
        cv::inRange(
            hsv,
            cv::Scalar(h_min, s_min, v_min),
            cv::Scalar(h_max, 255, 255),
            mask
        );

        cv::imshow("image", image);
        cv::imshow("mask", mask);

        const int key = cv::waitKey(10);
        if (key == 27 || key == 'q') {
            break;
        }
    }

    return 0;
}
```

Trackbar 的用途是帮助你**观察参数对图像的影响和采集统计数据**，不是让你在一张图上拖出一个“刚好能识别”的参数，然后直接写死进比赛代码。最终参数仍然必须在真实数据集上验证。

---

# 第四部分：RoboMaster 传统视觉建模

## 13. 从“人眼判断”到“机器判据”

假设你看到画面里有一根装甲板灯条。你可能会说：“它很亮、颜色是蓝的、形状细长、方向接近竖直。”计算机不能理解这些自然语言，所以需要把它们转换成数值特征。

| 人的描述 | 可计算特征 | 常见 OpenCV 工具 |
| --- | --- | --- |
| 很亮 | Gray / HSV-V / 通道强度 | `cvtColor`、`split` |
| 是蓝色/红色 | HSV 区间、通道差 | `inRange`、数组运算 |
| 很细长 | 长宽比 | `minAreaRect` |
| 面积合理 | Contour Area | `contourArea` |
| 接近竖直 | 长轴倾角 | `RotatedRect` / 顶点计算 |
| 两根灯条差不多高 | Height Ratio | 基础数学 |
| 两根灯条方向相近 | Angle Difference | 基础数学 |
| 中心高度接近 | Normalized Δy | `Point2f`、基础数学 |
| 左右距离合理 | Normalized Center Distance | `norm`、基础数学 |

传统视觉最核心的能力不是知道 `findContours` 的参数，而是知道**应该构造什么特征，为什么这个特征对真正目标稳定、对干扰目标不稳定。**

---

## 14. 推荐定义自己的 `Light` 和 `Armor`

OpenCV 给你的只是通用几何对象：

```cpp
cv::RotatedRect
```

但是业务层真正关心的是：

```cpp
struct Light {
    cv::Point2f center;
    cv::Point2f top;
    cv::Point2f bottom;

    float width;
    float height;
    float tilt;
};

struct Armor {
    Light left;
    Light right;

    cv::Point2f center;
    std::array<cv::Point2f, 4> corners;
};
```

这种数据结构完成了一次重要的抽象：

```text
像素 → 轮廓 → 通用几何对象 → 有业务语义的 Light → Armor
```

后续模块应该尽量使用有稳定语义的接口，而不是到处重新解释 OpenCV 的 `RotatedRect::width`、`height` 和 `angle`。

---

## 15. 完整实战：一个简化的灯条 Detector

下面给出一段完整代码。它刻意保持简单，目的是让新人第一次看到“前面学过的 API 如何组合成一个 Detector”，而不是作为战队最终比赛算法直接使用。

代码流程：

1. 读取图像；
2. HSV 颜色分割；
3. 形态学去噪；
4. `findContours`；
5. `minAreaRect`；
6. 将 `RotatedRect` 规范化为 `Light`；
7. 使用面积、长宽比和倾角进行筛选；
8. 绘制结果。

```cpp
#include <opencv2/opencv.hpp>

#include <algorithm>
#include <cmath>
#include <iostream>
#include <vector>

struct Light {
    cv::Point2f center;
    cv::Point2f top;
    cv::Point2f bottom;

    float width = 0.0f;
    float height = 0.0f;

    // 相对竖直方向的倾斜角。
    // 0 表示竖直，正负表示向不同方向倾斜。
    float tilt = 0.0f;
};

float normalizeTiltFromVertical(const cv::Point2f& direction)
{
    // direction 是灯条长轴的一个二维方向向量。
    //
    // 常见 atan2(y, x) 是“相对 x 轴”的角度。
    // 这里写成 atan2(direction.x, direction.y)，
    // 相当于把 y 轴（图像中的竖直方向）作为 0° 参考，
    // 对灯条来说更直观：越接近竖直，tilt 越接近 0。
    //
    // 注意：图像坐标 y 向下，因此角度正负方向与普通数学坐标
    // 可能不完全符合你的直觉。正式工程必须统一自己的角度定义。
    float angle = static_cast<float>(
        std::atan2(direction.x, direction.y) * 180.0 / CV_PI
    );

    // 长轴方向正反等价，因此按 180° 周期折叠到 [-90, 90]。
    while (angle > 90.0f) {
        angle -= 180.0f;
    }
    while (angle <= -90.0f) {
        angle += 180.0f;
    }

    return angle;
}

Light makeLight(const cv::RotatedRect& rect)
{
    cv::Point2f pts[4];
    rect.points(pts);

    // RotatedRect 的 4 个顶点按矩形边界给出。
    // 计算两条相邻边长度，就能判断哪一条是长边、哪一条是短边。
    // cv::norm(Point2f) 对二维向量返回欧氏长度。
    const float edge01 =
        static_cast<float>(
            cv::norm(pts[1] - pts[0])
        );
    const float edge12 =
        static_cast<float>(
            cv::norm(pts[2] - pts[1])
        );

    cv::Point2f long_axis_direction;

    Light light;
    light.center = rect.center;

    if (edge01 >= edge12) {
        light.height = edge01;
        light.width = edge12;
        long_axis_direction = pts[1] - pts[0];
    } else {
        light.height = edge12;
        light.width = edge01;
        long_axis_direction = pts[2] - pts[1];
    }

    const float axis_length = std::max(
        1e-6f,
        static_cast<float>(cv::norm(long_axis_direction))
    );

    const cv::Point2f unit_axis = long_axis_direction / axis_length;

    cv::Point2f end_a =
        light.center + unit_axis * (light.height * 0.5f);
    cv::Point2f end_b =
        light.center - unit_axis * (light.height * 0.5f);

    // 图像中 y 更小的是“上”。
    if (end_a.y < end_b.y) {
        light.top = end_a;
        light.bottom = end_b;
    } else {
        light.top = end_b;
        light.bottom = end_a;
    }

    light.tilt = normalizeTiltFromVertical(unit_axis);
    return light;
}

std::vector<Light> detectLights(const cv::Mat& image)
{
    cv::Mat hsv;
    cv::cvtColor(image, hsv, cv::COLOR_BGR2HSV);

    // 仅作为教程示例。
    // 真实参数必须来自战队自己的相机、曝光和数据集。
    const cv::Scalar lower_blue(90, 80, 100);
    const cv::Scalar upper_blue(130, 255, 255);

    cv::Mat mask;
    cv::inRange(hsv, lower_blue, upper_blue, mask);

    const cv::Mat kernel = cv::getStructuringElement(
        cv::MORPH_RECT,
        cv::Size(3, 3)
    );

    cv::morphologyEx(
        mask,
        mask,
        cv::MORPH_OPEN,
        kernel
    );

    std::vector<std::vector<cv::Point>> contours;
    cv::findContours(
        mask,
        contours,
        cv::RETR_EXTERNAL,
        cv::CHAIN_APPROX_SIMPLE
    );

    std::vector<Light> lights;

    for (const auto& contour : contours) {
        const double area = cv::contourArea(contour);

        if (area < 20.0) {
            continue;
        }

        const cv::RotatedRect rect = cv::minAreaRect(contour);
        Light light = makeLight(rect);

        if (light.width < 1e-3f) {
            continue;
        }

        const float aspect_ratio =
            light.height / light.width;

        // 下面开始从“通用旋转矩形”筛成“有语义的 Light”。
        // aspect_ratio 描述候选是否足够细长；
        // tilt 描述候选是否接近我们预期的灯条方向。
        //
        // 以下阈值全部只是教学示例，不能直接作为比赛参数。
        const bool ratio_ok =
            aspect_ratio > 2.0f &&
            aspect_ratio < 15.0f;

        const bool tilt_ok =
            std::abs(light.tilt) < 40.0f;

        if (!ratio_ok || !tilt_ok) {
            continue;
        }

        lights.push_back(light);
    }

    return lights;
}

void drawLights(
    cv::Mat& image,
    const std::vector<Light>& lights
)
{
    for (const Light& light : lights) {
        cv::line(
            image,
            light.top,
            light.bottom,
            cv::Scalar(0, 255, 0),
            2
        );

        cv::circle(
            image,
            light.center,
            3,
            cv::Scalar(0, 0, 255),
            cv::FILLED
        );

        const std::string text =
            "r=" +
            std::to_string(light.height / light.width).substr(0, 4) +
            " tilt=" +
            std::to_string(light.tilt).substr(0, 5);

        cv::putText(
            image,
            text,
            light.center + cv::Point2f(5.0f, -5.0f),
            cv::FONT_HERSHEY_SIMPLEX,
            0.4,
            cv::Scalar(0, 255, 255),
            1
        );
    }
}

int main(int argc, char** argv)
{
    if (argc < 2) {
        std::cerr << "Usage: " << argv[0] << " <image_path>\n";
        return 1;
    }

    cv::Mat image = cv::imread(argv[1]);
    if (image.empty()) {
        std::cerr << "Failed to read image.\n";
        return 1;
    }

    const std::vector<Light> lights =
        detectLights(image);

    cv::Mat debug = image.clone();
    drawLights(debug, lights);

    std::cout
        << "Detected lights: "
        << lights.size()
        << '\n';

    cv::imshow("result", debug);
    cv::waitKey(0);

    return 0;
}
```

这段代码最值得注意的不是具体阈值，而是结构：

```cpp
image
    -> detectLights()
        -> cvtColor
        -> inRange
        -> morphologyEx
        -> findContours
        -> contourArea
        -> minAreaRect
        -> makeLight
        -> feature filter
    -> std::vector<Light>
```

当 Detector 变复杂以后，也应该努力保持这种清晰的数据流。

---

## 16. 从两个 `Light` 匹配成 `Armor`

得到灯条只是第一步。两个灯条是否属于同一个装甲板，可以构造一组相对几何特征。

```cpp
float mean_height =
    0.5f * (left.height + right.height);

float height_ratio =
    std::max(left.height, right.height) /
    std::max(1e-6f, std::min(left.height, right.height));

float normalized_y_diff =
    std::abs(left.center.y - right.center.y) /
    mean_height;

float normalized_x_diff =
    std::abs(left.center.x - right.center.x) /
    mean_height;

float tilt_diff =
    std::abs(left.tilt - right.tilt);
```

这里故意使用 `ratio` 和“除以平均灯条高度”的归一化距离，而不是直接写 `abs(y1 - y2) < 20`、`distance < 100`。原因是目标距离变化时，所有像素尺度都会一起变化，相对量通常比固定像素量更稳定。

一个简化的匹配函数可以写成：

```cpp
bool isArmorPair(const Light& a, const Light& b)
{
    const Light& left  = (a.center.x < b.center.x) ? a : b;
    const Light& right = (a.center.x < b.center.x) ? b : a;

    const float mean_height =
        0.5f * (left.height + right.height);

    if (mean_height < 1e-3f) {
        return false;
    }

    const float height_ratio =
        std::max(left.height, right.height) /
        std::max(1e-3f, std::min(left.height, right.height));

    const float y_diff =
        std::abs(left.center.y - right.center.y) /
        mean_height;

    const float x_diff =
        std::abs(left.center.x - right.center.x) /
        mean_height;

    const float tilt_diff =
        std::abs(left.tilt - right.tilt);

    // 仅用于说明判据结构，不是比赛标准参数。
    return
        height_ratio < 1.5f &&
        y_diff < 0.6f &&
        x_diff > 0.5f &&
        x_diff < 6.0f &&
        tilt_diff < 20.0f;
}
```

真正比赛代码还要处理敌我颜色、大小装甲板、透视变化、异常配对、目标编号识别等更多问题。这里的目标只是让你理解：**检测本质上是在不断把候选集合变小。**

---

## 17. 四角点的重要性

当两个灯条匹配成装甲板后，Detector 最重要的输出之一是顺序稳定的四个二维角点。你可以从灯条端点构造一个初始版本，例如：

```cpp
Armor armor;

armor.left = left;
armor.right = right;
armor.center =
    0.5f * (left.center + right.center);

// 示例顺序：左上、右上、右下、左下。
armor.corners = {
    left.top,
    right.top,
    right.bottom,
    left.bottom
};
```

真正项目中要结合灯条结构、透视和装甲板定义确定更准确的角点方案。无论采用什么方法，有一条工程要求必须从 Detector 开始就固定下来：**四个角点的顺序必须在全队统一。**

后续 PnP 会把二维角点和装甲板物理模型上的三维点一一对应。如果某个模块使用“左上、右上、右下、左下”，另一个模块却理解成不同顺序，程序可能仍然正常运行，但得到完全错误的三维姿态。

---

# 第五部分：工程化使用 OpenCV

## 18. 参数不是 Magic Number

传统视觉代码中一定会出现很多参数：

```cpp
if (area > 20.0 &&
    ratio > 2.0f &&
    ratio < 15.0f &&
    std::abs(tilt) < 40.0f) {
    ...
}
```

正确的问题不是“这个值调到多少能识别”，而是“这个参数代表什么物理或几何意义，它在真实样本上的分布是什么”。

推荐流程：

1. 采集覆盖不同距离、曝光、姿态和运动状态的数据；
2. 对真目标和典型干扰分别记录 `area`、`ratio`、`tilt` 等特征；
3. 查看分布和重叠区域；
4. 根据漏检/误检代价确定初始阈值；
5. 留出合理 margin；
6. 在独立数据上再次验证。

例如真正灯条长宽比在当前数据中大部分位于 `3.1~6.4`，可以从一个更宽松的区间开始验证，而不是因为某一张图片 `ratio=4.8` 就把阈值写成 `4.5~5.0`。

---

## 19. Failure Case 比成功截图更重要

一个视觉算法在几张测试图上框出装甲板，没有太大说明力。你更应该系统保存和分析：

- False Negative：真实目标被漏掉；
- False Positive：背景被误识别；
- 过曝、欠曝；
- 运动模糊；
- 远距离小目标；
- 强反光；
- 部分遮挡；
- 多目标交叉；
- 特殊姿态；
- 场地灯光干扰。

建议训练时就维护数据目录：

```text
dataset/
├── normal/
├── overexposure/
├── underexposure/
├── motion_blur/
├── reflection/
├── far/
├── occlusion/
├── false_positive/
└── false_negative/
```

算法改动后重新跑这些 Failure Case，才能判断“修复一个问题”的同时有没有引入新的回归。

---

## 20. 调试一个视觉 Pipeline

出现“装甲板没有识别出来”时，最错误的做法是同时乱改 HSV、面积、长宽比和角度阈值。应该沿数据流逐级定位：

```text
Original
  → Gray / HSV / Channel Difference
  → Binary Mask
  → Morphology Result
  → Contours
  → RotatedRect Candidates
  → Lights
  → Armor Pairs
  → Final Armors
```

每一级都应该能够可视化或打印关键数值。例如：

```cpp
cv::imshow("mask", mask);
cv::imshow("morph", morph);

std::cout
    << "candidate area=" << area
    << " ratio=" << ratio
    << " tilt=" << tilt
    << '\n';
```

如果 Mask 里目标已经消失，问题一定发生在颜色/亮度分割之前；如果 Light 全部正确但 Armor 为零，就不应该继续调整 HSV，而应该检查匹配判据。

**视觉 Debug 的基本原则：不要猜，检查中间结果。**

---

## 21. 模块化组织

新人练习时可以把所有东西写在一个 `main.cpp` 里，但真正开始迭代后应该拆分职责：

```cpp
cv::Mat preprocess(const cv::Mat& image);

std::vector<Light> detectLights(const cv::Mat& image);

std::vector<Armor> matchArmors(
    const std::vector<Light>& lights
);

void drawDebug(
    cv::Mat& image,
    const std::vector<Light>& lights,
    const std::vector<Armor>& armors
);
```

更进一步可以组织为类：

```cpp
class ArmorDetector {
public:
    std::vector<Armor> detect(const cv::Mat& image);

private:
    cv::Mat preprocess(const cv::Mat& image);
    std::vector<Light> detectLights(const cv::Mat& binary);
    std::vector<Armor> matchArmors(
        const std::vector<Light>& lights
    );
};
```

模块化的重点不是“代码看起来高级”，而是明确每层输入、输出和职责。一个函数如果既负责相机取图、又负责二值化、又负责匹配、又发送 ROS Message，后续几乎必然难以调试和测试。

---

## 22. 实时性与性能

RoboMaster 视觉最终运行在实时系统中，所以正确性之后还必须关心延迟。最简单的测量方式：

```cpp
const int64 t0 = cv::getTickCount();

// detector.detect(frame);

const int64 t1 = cv::getTickCount();

const double ms =
    (t1 - t0) * 1000.0 / cv::getTickFrequency();

std::cout << "latency = " << ms << " ms\n";
```

或者使用 `std::chrono`。

常见性能问题包括：

- 对整张高分辨率图像做本可避免的处理；
- 高频 `clone()`；
- 重复 `cvtColor`；
- 每帧大量动态内存分配；
- 对所有像素进行不必要的 C++ 层循环；
- 没有 ROI；
- 在没有 Profile 的情况下盲目进行复杂“优化”。

推荐顺序始终是：

```text
Correct → Robust → Profile → Optimize
```

先确保算法正确和稳定，再测量真正瓶颈，再优化瓶颈。

---

# 第六部分：常用 OpenCV API 速查

这一节不是要求背诵，而是给新人建立“遇到问题时该往哪里找”的索引。

## 23. Core / 基础对象

| API / 类型 | 作用 |
| --- | --- |
| `cv::Mat` | 图像和矩阵 |
| `cv::Point`, `Point2f`, `Point3f` | 二维/三维点 |
| `cv::Size`, `Size2f` | 尺寸 |
| `cv::Rect`, `Rect2f` | 水平矩形 / ROI |
| `cv::Scalar` | 多通道常量和颜色 |
| `cv::Vec3b` | 三通道 8 bit 像素 |
| `cv::norm` | 距离/范数 |
| `cv::absdiff` | 数组绝对差 |
| `cv::minMaxLoc` | 查找最小/最大值 |
| `cv::countNonZero` | 非零像素数量 |
| `cv::split`, `cv::merge` | 通道拆分与合并 |
| `cv::bitwise_and/or/not` | Mask 和按位运算 |

## 24. 图像 / 视频输入输出

| API | 作用 |
| --- | --- |
| `cv::imread` | 读取图片 |
| `cv::imwrite` | 保存图片 |
| `cv::VideoCapture` | 读取摄像头或视频 |
| `cv::imshow` | 显示图像 |
| `cv::waitKey` | GUI 等待和按键 |
| `cv::namedWindow` | 创建窗口 |
| `cv::createTrackbar` | 创建调参滑块 |

## 25. 图像处理

| API | 作用 |
| --- | --- |
| `cv::cvtColor` | 颜色空间转换 |
| `cv::resize` | 缩放 |
| `cv::GaussianBlur` | 高斯滤波 |
| `cv::medianBlur` | 中值滤波 |
| `cv::threshold` | 固定阈值二值化 |
| `cv::adaptiveThreshold` | 自适应阈值 |
| `cv::inRange` | 区间分割生成 Mask |
| `cv::getStructuringElement` | 生成形态学 kernel |
| `cv::erode` | 腐蚀 |
| `cv::dilate` | 膨胀 |
| `cv::morphologyEx` | 开/闭等形态学操作 |
| `cv::Canny` | Canny 边缘检测 |

## 26. 轮廓与几何

| API / 类型 | 作用 |
| --- | --- |
| `cv::findContours` | 提取轮廓 |
| `cv::drawContours` | 绘制轮廓 |
| `cv::contourArea` | 轮廓面积 |
| `cv::arcLength` | 周长/曲线长度 |
| `cv::moments` | 图像矩 / 轮廓矩 |
| `cv::approxPolyDP` | 多边形近似 |
| `cv::convexHull` | 凸包 |
| `cv::boundingRect` | 水平外接矩形 |
| `cv::minAreaRect` | 最小面积旋转矩形 |
| `cv::RotatedRect::points` | 获取旋转矩形四顶点 |

## 27. 绘图

| API | 作用 |
| --- | --- |
| `cv::line` | 线段 |
| `cv::rectangle` | 矩形 |
| `cv::circle` | 圆 |
| `cv::ellipse` | 椭圆 |
| `cv::polylines` | 多段线 / 多边形 |
| `cv::putText` | 绘制文字 |

当你不知道一个函数的某个参数具体是什么意思时，优先阅读 OpenCV 官方文档，不要只复制博客代码。尤其是颜色范围、角度、图像类型和函数对输入格式的要求，必须结合当前 OpenCV 版本确认。

---

> **到这里，本文的 OpenCV 主体内容已经结束。** 当前输出仍然是二维图像坐标；三维几何、机器人软件通信以及射击控制属于另外的问题域，本文不继续展开。

---

# 第七部分：练习与验收


## 28. 建议练习

### Task 1：基础图像操作

读取一张图片，输出宽、高、通道数；取中央 ROI；在图上绘制矩形、中心点和文字；保存结果。

必须使用：

```text
Mat / Point / Rect / Scalar
imread / imwrite
rectangle / circle / putText
imshow / waitKey
```

### Task 2：颜色与二值化

读取一张彩色图，分别生成 Gray 和 HSV；使用 `threshold` 和 `inRange` 产生两种不同的 Binary Mask，并说明它们各自依据了什么信息。

### Task 3：形态学

人为制造或寻找一张有噪点和孔洞的二值图，对比 Erode、Dilate、Open、Close，说明每一种操作改变了什么。

### Task 4：轮廓与几何

对二值图运行 `findContours`，为每条轮廓计算：

```text
Area
Perimeter
BoundingRect
MinAreaRect
```

并将结果可视化。

### Task 5：Trackbar 参数观察

编写 HSV Trackbar 工具，不要求得到“最终比赛参数”，但要能够解释 H、S、V 每个参数改变后 Mask 为什么发生对应变化。

### Task 6：灯条 Detector

完成：

```text
Image
  → Preprocess
  → Contours
  → RotatedRect
  → Light Feature Filter
  → vector<Light>
```

要求能够打印每个候选的面积、长宽比和倾角，并说明被过滤的原因。

### Task 7：装甲板匹配

对 `vector<Light>` 两两匹配，构造 `Armor`。至少使用：

- 灯条高度比例；
- 归一化中心高度差；
- 归一化水平距离；
- 灯条角度差。

最终输出装甲板中心和四角点。

### Task 8：视频 Detector

把单图 Detector 放进视频循环，显示实时结果并统计单帧处理延迟。保存典型漏检和误检帧作为 Failure Case。

---

## 29. 最终验收

完成本文后，你至少应该能够回答并实际演示：

**OpenCV 基础：**

- `cv::Mat`、`Point2f`、`Rect`、`Scalar`、`RotatedRect` 分别是什么？
- `Mat` 的浅拷贝和 `clone()` 有什么区别？
- `rows/cols`、`width/height`、`(y,x)/(x,y)` 为什么容易混淆？
- BGR、Gray、HSV 分别适合处理什么信息？
- `VideoCapture`、`imshow`、`waitKey` 的基本工作方式是什么？

**图像处理：**

- `cvtColor`、`split`、`inRange`、`threshold` 的输入输出分别是什么？
- Gaussian Blur 和 Morphology 为什么不是“越多越好”？
- `erode`、`dilate`、`open`、`close` 各自改变什么？
- 什么情况下会考虑 `Canny`？

**轮廓与几何：**

- `findContours` 的输出数据结构是什么？
- `contourArea`、`arcLength`、`boundingRect`、`minAreaRect` 各自提供什么信息？
- 为什么要把 `RotatedRect` 转换成自己定义的 `Light`？

**算法思维：**

- 什么是特征？什么是判据？
- 为什么归一化距离通常比固定像素距离更适合处理远近变化？
- 为什么“参数调出来了”不是充分解释？
- 什么是 False Positive、False Negative 和 Failure Case？

**工程能力：**

- 当最终 Armor 消失时，应该如何逐级检查 Pipeline？
- 如何用 OpenCV 绘图和 Trackbar 做调试？
- 如何组织 `preprocess / detectLights / matchArmors` 的职责？
- 如何测量单帧处理延迟？

---

## 30. 最后需要记住的主线

如果你完成全文后只能保留一条主线，请记住：

```text
图像是数据
   ↓
通过颜色、亮度、边缘等信息增强目标
   ↓
通过阈值或其他方法得到候选区域
   ↓
把像素区域转换成轮廓和几何对象
   ↓
从几何对象中计算可解释的特征
   ↓
利用目标先验建立判据
   ↓
把通用几何对象提升成 Light、Armor 等业务对象
   ↓
输出稳定的二维目标信息
```

OpenCV 的价值在于提供稳定、高效、经过大量验证的基础视觉工具；RoboMaster 视觉组成员真正需要训练的能力，是知道**为什么选择这个工具、它的输入输出是什么、这个特征为什么有效、这个参数从哪里来、算法在哪些条件下会失败。**

> **本文的终点：你能够独立阅读和编写基础 OpenCV C++ 程序，并完成一个可解释、可调试的简化传统视觉 Detector，稳定输出 Armor 的二维几何信息。**

---

---

## 参考与继续阅读

本文开头已经列出了最重要的 OpenCV 官方入口。后续学习时，建议按当前问题定向查阅官方教程，而不是从 API Reference 第一页开始顺序阅读。尤其是 `cv::Mat`、`imgproc`、颜色转换、阈值、形态学与轮廓相关章节，都会在实际视觉开发中反复使用。
