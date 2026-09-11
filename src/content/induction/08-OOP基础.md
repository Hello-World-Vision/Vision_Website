---
title: "OOP 基础"
description: "面向对象编程基础：类、封装、继承、多态。"
author: "XiMiLu"
date: 2026-08-10
tags: ["C++", "OOP"]
status: done
draft: false
---

> OOP 不是面向对象编程，而是 *O牛批这是OP写的文档*（x

这篇文档默认你已经接触过编程语言，因此不再讲解最基础的语法。

## 1. 什么是面向对象编程？

学习 C++ 时，你会经常听到一个词：**面向对象编程（Object-Oriented Programming，简称 OOP）**。

那么什么叫“面向对象”？

简单来说，面向对象编程是一种编程思想：**把程序拆成多个相互协作的对象，让每个对象保存自己的数据，并提供操作这些数据的方法。**

传统的程序设计方式通常关注这样几个问题：

* 程序有哪些步骤？
* 需要调用哪些函数？
* 数据应该如何传递？

例如：

```cpp
int hp = 100;

void attack(int damage)
{
    hp -= damage;
}
```

这里数据 `hp` 和操作它的函数 `attack()` 是分开的。

随着程序规模变大，会出现很多问题：

* 哪些函数可以修改这个数据？
* 数据应该如何保护？
* 不同类型的数据应该如何组织？

面向对象的做法是**把数据和操作数据的方法绑定在一起，形成一个独立的对象。**

例如：

```cpp
class Player
{
public:
    int hp;

    void attack(int damage)
    {
        hp -= damage;
    }
};
```

这里：

* `hp` 是玩家的数据
* `attack()` 是玩家可以执行的行为

它们属于同一个整体：

```
Player
 ├── 数据
 │    └── hp
 │
 └── 行为
      └── attack()
```

这就是面向对象的基本思想。

---

## 2. 类（Class）与对象（Object）

### 2.1 什么是类？

类可以理解为**创建对象的模板。**

现实生活中就有很多这样的例子：

* 汽车设计图 → 汽车
* 房屋设计图 → 房子
* 学生信息表模板 → 学生对象

程序中的类也是一样。例如：

```cpp
class Student
{
public:
    string name;
    int age;

    void study()
    {
        cout << "学习中" << endl;
    }
};
```

这里定义了一个 `Student` 类，描述一个学生应该有什么：

```
Student

属性：
    name
    age

方法（可以看成行动）：
    study()
```

但要注意，类只是一个模板，此时你还没有创建这个模板下面的**实例**。


### 2.2 什么是对象？

对象是类创建出来的具体实例。

例如：

```cpp
Student s1;
Student s2;
```

这里创建了两个对象：

```
Student 类

s1对象

name = ?
age  = ?


s2对象

name = ?
age  = ?
```

它们虽然来自同一个类，数据却互相独立。例如：

```cpp
s1.name = "Tom";
s2.name = "Jack";
```

结果如下：

```
s1
name = Tom


s2
name = Jack
```

---

## 3. 类的成员：属性和方法

一个类通常包含两部分：

### 3.1 成员变量（属性）

成员变量表示对象的数据。例如：

```cpp
class Student
{
public:
    string name;
    int age;

};
```

这里的 `name` 和 `age` 就是成员变量，说明“学生有什么属性”。

---

### 3.2 成员函数（方法）

成员函数表示对象可以做什么。例如：

```cpp
class Student
{
public:

    void study()
    {
        cout << "学习中" << endl;
    }
};
```

这表示学生可以执行 `study()`，也就是“学生能做什么”。

---

## 4. 封装（Encapsulation）

封装是 OOP 的核心思想之一。

一句话解释：**把数据和操作数据的方法放在一起，并限制外部直接访问内部。**

例如，一个银行账户包含这些内容：

```
账户

余额
密码
取款()
存款()
```

不应该允许用户直接修改余额：`account.money = 10000;`

否则用户就可以充很多648了（x

更合理的做法是：

```cpp
class Account
{
private:

    int money;


public:

    void deposit(int value)
    {
        if(value > 0)
            money += value;
    }


    int getMoney()
    {
        return money;
    }

};
```

这里的关键就是把余额设成私有：

```cpp
private:
    int money;
```


---
### 扩展小阅读：public，private 和 protected
相信读到这里的同学，凭你们惊人的注意力，一定发现前面的 `class` 里有几个申必词汇一直在发挥作用，却没有讲过，也就是 `public` 和 `private`，再加上还没用到的 `protected`，它们统称为**访问控制符**。
#### 1. public：公开成员

`public` 表示：类的这些成员可以被任意访问和调用。例如：

```cpp
class Student
{
public:

    string name;

};
```

创建对象后就可以正常访问：

```cpp
Student s;

s.name = "Tom";
```

通常，对外提供的功能和用户需要调用的接口也会放在 `public` 中。例如：

```cpp
class Account
{
public:

    void deposit(int money);
    int getBalance();

};
```

用户不需要知道内部如何存储余额，只需要调用这些公开函数。那么账户中的`余额`变量存在哪里呢？当然是——（无敌少侠片头音）


#### 2. private：私有成员

`private` 表示：这些成员**只有类的内部可以访问，外部无法直接访问**。

例如：

```cpp
class Account
{

private:

    int balance;


public:

    void deposit(int money)
    {
        balance += money;
    }

};
```

如果你想靠

```cpp
Account a;

a.balance = 1000;   // 报错
```
来致富，那是不行的 :) 因为 `balance` 是私有成员。

但换成

```cpp
a.deposit(1000);
```

就可以正常调用，这样你就有存款了喵。



#### 3. protected：受保护成员

`protected` 表示：这些成员**在类内部和子类中都可以访问，但外部无法直接访问**。

例如我们建立一个 `Animal` 类：

```cpp
class Animal
{

protected:

    int age;


public:

    void eat()
    {
        cout << "吃东西" << endl;
    }

};
```

再把 `Dog` 作为它的子类：

```cpp
class Dog : public Animal
{

public:

    void showAge()
    {
        cout << age << endl;
    }

};
```

这时 `Dog` 可以访问 `Animal` 的 `age`。但外部仍然不行：

```cpp
Animal a;

a.age = 5;   // 错误
```

顺便说明一下这里的称呼：我们把 `Animal` 类称为**父类**，`Dog` 类称为**子类**，它们之间的关系称为**继承**。

---



## 5. 继承（Inheritance）

继承表示：**一个类可以拥有另一个类已有的属性和方法。**

先看现实世界的例子：

```
动物

 ├── 狗
 └── 猫
```

狗和猫都有年龄、名字，也都会吃东西；区别在于狗会汪汪叫，猫会喵喵叫。

对应到程序里，我们先定义 `Animal`，把所有动物共有的属性和方法放在 `Animal` 下：

```cpp
class Animal
{
public:

    int age;

    void eat()
    {
        cout << "吃东西" << endl;
    }

};
```

再把各个子类特有的属性和方法写在子类下：

```cpp
class Dog : public Animal
{

public:

    void bark()
    {
        cout << "汪汪" << endl;
    }

};

class Cat : public Animal
{

public:

    void meow()
    {
        cout << "喵喵" << endl;
    }

};
```

其中 `class Dog : public Animal` 表示 `Dog` 继承自 `Animal`。因此下面几个调用都成立：

```cpp
Dog dog;

dog.eat();
dog.bark();
```

简单来说，继承可以提取公共部分、减少重复，并建立类之间的关系。

---

## 6. 多态（Polymorphism）


简单来说：**同一个接口，可以表现出不同的行为。**

例如，假设动物都有 `speak()` 这个方法，那么猫和狗调用它时显然不应该发出同样的动静。

先看一种写法：

```cpp
class Dog
{
public:
    void speak()
    {
        cout << "汪汪" << endl;
    }
};


class Cat
{
public:
    void speak()
    {
        cout << "喵喵" << endl;
    }
};
```

`Dog` 和 `Cat` 虽然都有 `speak()` 函数，彼此之间却没有统一的关系。这样一来，想用一个函数处理所有动物就比较麻烦：

```cpp
void makeSpeak(Dog dog)
{
    dog.speak();
}
```

这个函数只能接受 `Dog`。以后每增加 `Cat`、`Bird` 等新动物，就得再添加一个新函数。多态就是为了解决这种问题。

首先，我们可以设计一个共同的父类：

```cpp
class Animal
{
public:

    virtual void speak()
    {
        cout << "动物发出声音" << endl;
    }
};
```

这里出现了一个新的关键字 `virtual`，它表示这个函数是一个**虚函数**。虚函数允许子类重新定义父类的行为，从而实现运行时多态。

然后让不同动物继承 `Animal`：

```cpp
class Dog : public Animal
{
public:

    void speak() override
    {
        cout << "汪汪" << endl;
    }
};


class Cat : public Animal
{
public:

    void speak() override
    {
        cout << "喵喵" << endl;
    }
};
```

这里的 `override` 表示当前函数正在重写父类的虚函数。它不是必须写的，但推荐使用。

写上 `override` 之后：

```cpp
void speak() override
```

编译器可以帮你检查：

* 父类是否真的存在这个虚函数
* 函数名字是否写错
* 参数是否匹配

如果不小心写成：

```cpp
void speek() override
```

编译器就会提示错误，帮你避开这类不易察觉的问题。

现在我们可以用父类指针指向不同的子类对象：

```cpp
Animal* animal1 = new Dog();
Animal* animal2 = new Cat();

animal1->speak();
animal2->speak();
```

输出：

```
汪汪
喵喵
```

两个变量的类型都是：

```cpp
Animal*
```

但它们实际指向的对象不同：

```cpp
animal1 -> Dog对象
animal2 -> Cat对象
```

因此调用的函数也不同，这就是多态。程序在运行时根据实际对象类型决定调用哪个函数，这种方式称为**运行时多态（Runtime Polymorphism）**。

