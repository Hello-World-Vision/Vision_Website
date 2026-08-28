---
title: "CMake 基础"
description: "CMake基础以及项目的基本结构"
author: "wcc什么时候能穿女仆装"
date: 2026-08-26
tags: ["CMake"]
status: done
draft: false
---
> 本文档参考高翔老师的《视觉SLAM十四讲》中CMake相关部分撰写。(btw这是一本好书，同学们可以作为拓展阅读)

对于没有接触过使用CMake构建项目的同学们，我希望你们能跟着教程一起做一遍，**现在的AI已经可以写出无误的CMakeLists,但一个良好的的文件结构仍然值得学习。**
以及，在之后的大作业和备赛中，大部分编译报错你都可以通过问AI解决。
## CMake 与 C++ 项目构建

在前面的学习中，我们编写的大多数程序可能只有一个或者几个 `.cpp` 文件。对于这样的小程序，直接使用 `g++` 就可以完成编译。

例如，新建一个 `hello.cpp`：

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello C++!" << std::endl;
    return 0;
}
```

在 Linux 终端中执行：

```bash
g++ hello.cpp -o hello
```

这里 `g++` 会把 `hello.cpp` 编译并链接成一个名为 `hello` 的可执行文件。随后运行：

```bash
./hello
```

应该可以看到：

```text
Hello C++!
```

对于这种只有一个源文件的程序，直接使用 `g++` 非常方便。

但实际项目通常不会一直这么简单。

假设我们的程序逐渐变成：

```text
project/
├── main.cpp
├── camera.cpp
├── robot.cpp
└── serial.cpp
```

那么编译命令可能会变成：

```bash
g++ main.cpp camera.cpp robot.cpp serial.cpp -o robot
```

如果以后还需要指定头文件路径、链接第三方库或者添加不同的编译参数，命令会继续变长。

当项目中存在几十甚至几百个源文件时，让程序员手动维护这些编译命令显然不太现实。因此实际的软件工程通常会使用专门的**构建系统**管理编译过程。

CMake 就是 C++ 项目中最常见的构建工具之一。

---

## CMake 是什么

首先需要明确一点，**CMake 并不是编译器**。

真正负责把 C++ 代码编译成机器代码的仍然是 GCC、Clang、MSVC 等编译器。CMake 更像是一个工程管理工具，我们告诉 CMake：

* 项目叫什么；
* 哪些 `.cpp` 文件需要参与编译；
* 要生成哪些可执行程序；
* 要生成哪些库；
* 哪些程序需要使用哪些库。

然后由 CMake 为我们组织实际的构建过程。

整个过程可以简单理解为：

```text
CMakeLists.txt
      ↓
    CMake
      ↓
 Ninja / Make 等构建系统
      ↓
 GCC / Clang 等编译器
      ↓
   可执行程序
```

CMake 项目的主要配置通常写在一个名为：

```text
CMakeLists.txt
```

的文件中。

接下来我们仍然从刚才的 `hello.cpp` 开始，把它改造成一个最简单的 CMake 工程。

---

## 第一个 CMake 工程

现在项目目录中只有两个文件：

```text
project/
├── CMakeLists.txt
└── hello.cpp
```

在 `CMakeLists.txt` 中写入：

```cmake
cmake_minimum_required(VERSION 3.20)

project(HelloCMake)

add_executable(hello hello.cpp)
```

这已经是一个完整的 CMake 项目。

先来看这三条命令分别是什么意思。

```cmake
cmake_minimum_required(VERSION 3.20)
```

表示这个项目要求 CMake 版本至少为 3.20。

接下来：

```cmake
project(HelloCMake)
```

定义项目名称为 `HelloCMake`。

最后：

```cmake
add_executable(hello hello.cpp)
```

告诉 CMake：使用 `hello.cpp` 构建一个名为 `hello` 的可执行程序。

`add_executable` 可以简单理解为：

```cmake
add_executable(程序名 源文件...)
```

例如：

```cmake
add_executable(robot main.cpp robot.cpp camera.cpp)
```

表示使用三个 `.cpp` 文件生成一个名为 `robot` 的程序。

---

## 第一次使用 CMake 编译

进入项目目录`project/`后执行：

```bash
cmake .
```
对该工程进行分析

然后你会发现你的目录里出现了一堆申必文件（）我们暂时不管它们都是什么，其中最重要的是MakeFile文件，因为这是我们下一步用`make`执行自动化编译的基础。然后我们执行`make`,正常的话终端大概如下
```
$ make
[ 50%] Building CXX object CMakeFiles/helloSLAM.dir/helloSLAM.cpp.o
[100%] Linking CXX executable helloSLAM
[100%] Built target helloSLAM
```
此时你`ls`一下，可以看到目录里多出了刚才在`CMakeLists.txt` 中声明的那个可执行程序 helloSLAM（表现为绿色）。执行它
```
$ ./helloSLAM 
Hello SLAM!
```
> cmake 过程处理了工程文件之间的关系，而 make 过程实际调用了 g++ 来编译程序。虽然这个过程中多了调用cmake 和 make 的步骤，但我们对项目的编译管理工作，从输入一串 g++ 命令，变成了维护若干个比较直观的 CMakeLists.txt 文件，这将明显降低维护整个工程的难度。比如，当我想新增一个可执行文件时，只需在 CMakeLists.txt 中添加一行“add_executable”命令即可，而后续的步骤都是不变的。cmake 会帮我们解决代码的依赖关系，无需我们输入一大串 g++ 命令。

现在，你的目录里除了源码、`CMakeLists.txt`和可执行程序外，还有一堆中间文件残余，怎么办呢？

### 为什么你需要build
比起把所有中间文件都放在项目根目录下，更合理的做法是创建一个中间目录`build`，然后把所有中间文件都放在这个目录下，belike:
```
project/
├── build/
├── CMakeLists.txt
└── main.cpp
```
此时我们编译的命令变为
```
mkdir build
cd build
cmake ...
make
```
我们进入 `build` 文件夹，再通过 `cmake ..` 命令，对上一层文件夹进行编译。这样，`cmake` 产生的中间文件就会生成在 `build` 文件夹中，与源代码分开。相应地，可执行文件也会位于 `build` 文件夹中，不过影响不大。

## 多文件程序

现在稍微扩展一下刚才的项目。

我们创建一个简单的计算函数：

```text
project/
├── CMakeLists.txt
├── main.cpp
└── calculator.cpp
```

`calculator.cpp`：

```cpp
int add(int a, int b)
{
    return a + b;
}
```

在 `main.cpp` 中暂时声明这个函数：

```cpp
#include <iostream>

int add(int a, int b);

int main()
{
    std::cout << add(2, 3) << std::endl;
    return 0;
}
```

如果直接使用 `g++`，需要：

```bash
g++ main.cpp calculator.cpp -o calculator
```

使用 CMake 时，只需要写：

```cmake
cmake_minimum_required(VERSION 3.20)

project(Calculator)

add_executable(
    calculator
    main.cpp
    calculator.cpp
)
```

自行编译并运行。

到目前为止，`main.cpp` 和 `calculator.cpp` 都属于同一个可执行程序。

但在实际工程中，我们经常会把一些具有独立功能的代码组织成**库**。

---

## 使用库

所谓库，可以暂时简单理解为：**一组已经实现好的功能代码，其他程序可以调用其中的函数或者类。**

例如刚才的

```cpp
int add(int a, int b);
```

完全可以作为一个小型数学库中的功能。

我们现在把`calculator.cpp`单独编译成一个库。

修改 `CMakeLists.txt`：

```cmake
cmake_minimum_required(VERSION 3.20)

project(Calculator)

add_library(
    calculator_lib
    calculator.cpp
)

add_executable(calculator main.cpp)

target_link_libraries(calculator PRIVATE calculator_lib)
```

这里：

```cmake
add_library(calculator_lib calculator.cpp)
```

表示使用 `calculator.cpp` 构建一个名为 `calculator_lib` 的库。

而
```cmake
target_link_libraries(calculator PRIVATE calculator_lib)
```
将库链接到可执行文件上。

自行编译并运行。

此时 CMake 不再把 `calculator.cpp` 编译成一个可以直接运行的程序，而是把它构建成一个库。你会在`build`文件夹下找到`libcalculator_lib.a`，这就是得到的库。`.a`后缀意为静态库，`.so`后缀意为共享库。

如果希望明确生成静态库，可以写：

```cmake
add_library(
    calculator_lib
    STATIC
    calculator.cpp
)
```

如果希望生成共享库：

```cmake
add_library(
    calculator_lib
    SHARED
    calculator.cpp
)
```

初学阶段不需要深入研究两者在加载方式和文件组织上的区别，只需要知道：`add_library` 可以把一部分 C++ 代码组织成库，供其他程序使用。

此外，库本身通常没有 `main()`，所以不能像普通程序一样：

```bash
./calculator_lib
```

直接运行。

它的用途是提供功能给其他程序使用。

---


## 为库提供头文件

现在我们的 `calculator.cpp` 提供了：

```cpp
int add(int a, int b)
{
    return a + b;
}
```

如果其他程序希望调用 `add()`，就必须知道这个函数长什么样，也就是需要知道它的声明。

因此一般会给库准备一个对应的头文件，来包含函数的声明：

```text
project/
├── CMakeLists.txt
├── calculator.cpp
├── calculator.hpp
└── main.cpp
```

`calculator.hpp`：

```cpp
#pragma once

int add(int a, int b);
```

`calculator.cpp`：

```cpp
#include "calculator.hpp"

int add(int a, int b)
{
    return a + b;
}
```

然后在 `main.cpp` 中使用：

```cpp
#include <iostream>
#include "calculator.hpp"

int main()
{
    std::cout << add(2, 3) << std::endl;
    return 0;
}
```

这样使用 `calculator` 功能的程序只需要关心`#include "calculator.hpp"`，而不需要知道 `add()` 内部是怎样实现的。这也正是头文件和源文件分离的重要作用之一。

---

## 使用更规范的目录结构

随着代码逐渐增加，我们通常不会把所有文件都堆在一个目录中。

可以把项目整理成：

```text
project/
├── CMakeLists.txt
├── include/
│   └── calculator.hpp
└── src/
    ├── calculator.cpp
    └── main.cpp
```

这时 `calculator.cpp` 仍然写：

```cpp
#include "calculator.hpp"

int add(int a, int b)
{
    return a + b;
}
```

`main.cpp`：

```cpp
#include <iostream>

#include "calculator.hpp"

int main()
{
    std::cout << add(2, 3) << std::endl;
    return 0;
}
```

但现在头文件位于 `include/` 中，编译器默认并不知道应该去这个目录寻找它。

因此需要告诉 CMake：

```cmake
target_include_directories(
    calculator_lib
    PUBLIC
    include
)
```

完整的 `CMakeLists.txt` 可以写成：

```cmake
cmake_minimum_required(VERSION 3.20)

project(Calculator)

add_library(
    calculator_lib
    src/calculator.cpp
)

target_include_directories(
    calculator_lib
    PUBLIC
    include
)

add_executable(
    calculator
    src/main.cpp
)

target_link_libraries(
    calculator
    PRIVATE
    calculator_lib
)
```

这里：

```cmake
target_include_directories(
    calculator_lib
    PUBLIC
    include
)
```

可以理解为：`calculator_lib` 的头文件可以在 `include` 目录中找到，并且使用这个库的程序也需要知道这个目录。

至于 `PUBLIC`、`PRIVATE` 和 `INTERFACE` 的完整区别，在初学阶段没有必要马上深入研究。


---

## 再理解一次 Target

到这里，其实我们已经接触到了现代 CMake 最重要的概念之一：

**target，也就是构建目标。**

例如：

```cmake
add_executable(
    calculator
    src/main.cpp
)
```

创建了一个 target：

```text
calculator
```

而：

```cmake
add_library(
    calculator_lib
    src/calculator.cpp
)
```

又创建了另一个 target：

```text
calculator_lib
```

随后：

```cmake
target_include_directories(...)
```

是在给某个 target 设置头文件目录。

```cmake
target_link_libraries(...)
```

则是在描述不同 target 之间的链接关系。

所以理解现代 CMake 时，可以先建立这样一个思路：

```text
.cpp 文件
    ↓
创建 Target
    ↓
给 Target 添加配置
    ↓
建立 Target 之间的依赖关系
```

例如刚才的项目实际上可以画成：

```text
src/calculator.cpp
        │
        ↓
 calculator_lib
        │
        │ link
        ↓
   calculator
        ↑
        │
  src/main.cpp
```

如果能够看懂这个关系，那么很多 CMake 配置就不会显得那么抽象。

---

## 一个完整的练习
> 你学会的已经不止1+1,现在开始实践吧：）（ps:想跳过也可以哦）

试试实现下面这个项目：

```text
hello_project/
├── CMakeLists.txt
├── include/
│   └── hello.hpp
└── src/
    ├── hello.cpp
    └── main.cpp
```

其中 `hello.hpp` 声明：

```cpp
void printHello();
```

`hello.cpp` 实现：

```cpp
#include <iostream>

#include "hello.hpp"

void printHello()
{
    std::cout << "Hello CMake!" << std::endl;
}
```

`main.cpp` 调用：

```cpp
#include "hello.hpp"

int main()
{
    printHello();
    return 0;
}
```

尝试自己完成 `CMakeLists.txt`，要求：

1. 使用 `hello.cpp` 创建一个名为 `hello_lib` 的库；
2. 使用 `main.cpp` 创建一个名为 `hello` 的可执行程序；
3. 把 `include` 设置为头文件目录；
4. 让 `hello` 链接 `hello_lib`；
5. 最后使用 CMake 完成编译并运行程序。


可以先不要看下面的答案。

完整配置应类似：

```cmake
cmake_minimum_required(VERSION 3.20)

project(HelloProject)

add_library(
    hello_lib
    src/hello.cpp
)

target_include_directories(
    hello_lib
    PUBLIC
    include
)

add_executable(
    hello
    src/main.cpp
)

target_link_libraries(
    hello
    PRIVATE
    hello_lib
)
```



---

## 尝试制造几个错误

相比直接背 CMake 命令，我更推荐在这里主动制造几个错误，再观察编译器和链接器的提示。

### 实验一：删掉源文件

把：

```cmake
src/hello.cpp
```

从：

```cmake
add_library(...)
```

中删除，观察 CMake 会提示什么。

### 实验二：删掉头文件目录

把：

```cmake
target_include_directories(
    hello_lib
    PUBLIC
    include
)
```

删除，然后重新构建。你观察到什么报错？



### 实验三：不链接库

删掉：

```cmake
target_link_libraries(
    hello
    PRIVATE
    hello_lib
)
```

再次编译。你观察到什么报错？



