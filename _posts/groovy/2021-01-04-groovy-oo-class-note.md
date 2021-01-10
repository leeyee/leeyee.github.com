---
layout: post
title: Groovy面向对象(类)笔记
description: 记录Groovy的类相关知识。包括类的定义，类的属性，类的方法以及接口等。
category: groovy
tag: [groovy, java]
---

* any list
{:toc}

这里只记录一些特别的特性。没有提及的意味着基本可以参考着Java的方式来。详细的内容请参考[官方文档](http://www.groovy-lang.org/objectorientation.html)

## 类简介

**补充:** Groovy支持和Java相同的原始类型，但都**自动装箱成对象**。

Goovy类和Java类相似，并在JVM层面相互兼容。

与Java的不同点在于:

- 没有可见性修饰符的类或方法会自动公开
- 不需要显式的getter和setter方法，没有可见性修饰符的字段会自动变为属性
- 类名可以和文件名不同，但不建议这样做
- 一个源文件可以有一个或多个类。但如果文件包含不在类中的任何代码，则将其视为脚本。脚本只是具有某些特殊约定的类，它们的名称与它们的源文件相同（因此，不要在脚本中包含与脚本源文件同名的类定义）


## 内部类

从Goovy3开始支持用于非静态内部类实例化的Java语法

    class Computer {
        class Cpu {
            int coreNumber
            Cpu(int coreNumber) {
                this.coreNumber = coreNumber
            }
        }
    }

    assert 4 == new Computer().new Cpu(4).coreNumber
    
## 接口

接口方法总是`public`的，否则会在编译时报错

如果类有和接口定义方法相同的方法（并未`implements`接口，只是同名同参方法），那么可以通过`as`操作使其成运行时成为接口的实例

    interface Say {
       void sayHi()
    }
    
    class SayHello {
        void sayHi() {
            println 'Hello'
        }
    }
    
    def sh = new SayHello()
    assert !(sh instanceof Say)
    
    def sh2 = sh as Say
    assert sh instanceof Say
    
Groovy接口不支持Java8中接口的默认实现。如果要实现类似功能参考Groovy中的`traits`

## 类的构造

除了和Java相同的构造方式外，Groovy还支持以下方式创建对象实例。


当明确**声明**了构造函数时，可以使用以下方式构建实例

    class User{
        String name
        int age
        User(String name, int age){
            this.name = name
            this.age = age
        }
    }
    
    def user1 = new User('lee', 30)
    def user2 = ['lee1', 30] as User
    User user3 = ['lee2', 30]
    
当**未声明**构造函数时，可以使用以下方式构建实例。

    class Person {
        String name
        int age
    }
    
    def p1 = new Person()
    def p2 = new Person(name: 'lee')
    def p3 = new Person(age: 30, name: 'lee')
    def p4 = [age:40, name:'lee'] as Person
    Person p5 = [age:40, name:'lee']
    
==注意，此时其实是先调用无参构造函数，再调用属性的`set` 方法。==

    class Person1 {
        String name
        void setName(String name){
            this.name = "SetName_$name"
        }
    }
     
    def p2 = new Person(name: 'lee')
    assert 'SetName_lee' == p2.getName()

## 方法

- Groovy 方法总是返回一些值，如果没有`return`语句，则返回最后一行语句的值。
- 方法参数可以任意多个，并且参数可能没有明确声明类型。
- 可以使用Java修饰符，如果没有提供可见性修饰符，默认是`public`

### 命名传参

如果方法**第一个**参数是`Map`，那么可以使用命名方式传参或者命名和位置混合传参

    def fun0(Map map){ 
        println "$map.k : $map.v"
    }
    
    fun0(k: 1, v: 's1')
    fun0(v: 's1')

    def fun(Map map, int age){
        println "$map.key : $map.val ; $age"
    }
    
    // 注意，位置参数age不能少，否则抛出groovy.lang.MissingMethodException
    fun(key: 'k', 2)
    fun(key: 'k', val: 'v', 10)
    fun(10, key: 'k', val: 'v')
    fun(10, val: 'v')

如果`Map`类型参数不是第一个，那么需要显式传入`Map`参数，此时如果使用命名参数将会抛出`groovy.lang.MissingMethodException`异常

    def fun1(int age, Map map){
        println "$map.key : $map.val ; $age"
    }
    
    fun1(3, [key: "k", val: 'v'])

### 参数默认值

    def people(String name, int age = 30){
        [name: name, age: age]
    }
    
    assert 30 == people('lee').age
    
### 可变参数

> def foo(p1, ..., pn, T... args)

`T...` 是 `T[]` 的替代表示法

    def varFun(Objects... args){args}

如果以varargs参数为null的方式调用带有varargs的方法，则该参数将为null，而不是长度为1且唯一值为null的数组。
    
    assert varFun(null) == null

如果使用数组作为参数调用varargs方法，则参数将是该数组，而不是包含给定数组作为唯一元素的长度为1的数组。

    Integer[] ints = [1, 2]
    assert varFun(ints) == [1, 2]

如果有可变参数方法，又有指定参数的同名方法存在，那么优先使用指定参数方法

    def varFun(Object x){ -100 }
    assert varFun(1) == -100

### 方法选择算法

动态Groovy支持多种调度（也称为多方法）。调用方法时，将根据方法参数的运行时类型动态确定实际调用的方法。首先，将考虑方法名称和参数数量（包括可变参数的余量），然后考虑每个参数的类型。

    def method(Object o1, Object o2) { 'o/o' }
    def method(Integer i, String  s) { 'i/s' }
    def method(String  s, Integer i) { 's/i' }

那么

    assert method('foo', 42) == 's/i'
    
这是不同于Java的。Java会在所有情况下都调用第一个方法（静态）。 而Groovy使用**运行时类型**（动态），会尝试精确匹配每一个方法，直到找到与之匹配的。


==总之要记住的是，尽量声明语义明确没有歧义的方法==。详细的选择算法可直接参看[文档](http://www.groovy-lang.org/objectorientation.html#_method_selection_algorithm)。

### 异常声明

Groovy自动允许将未经检查的异常视为已检查的异常。因此在Groovy编码过程中可以不用显示的声明异常捕获。程序会自己抛出相应的异常。


## 字段和属性

### 字段

简单来说Groovy的字段就是使用了**强制修饰符**的属性，属性类型可选。

声明字段时，可以省略字段类型。这样做的目的是为了后续使用可选的类型检查

    class User {
        private field
        private String name
    }
    
    
### 属性

属性则是类的**外部可见功能**，不仅仅只是使用*公共字段*来表示这些功能。

JavaBean是Java的典型方法，通过使用私有字段和对应的getters/setters的组合表示属性。Groovy也遵循这样的约定，但提供了更简单的方法来定义属性。

Goovy的属性可以通过无修饰符字段来定义, Groovy会自动生成getters/setters

    Class User {
        String name
        int age
    }
    
上述代码就可表示JavaBean对象，Groovy会自动生成对应的getters/setters方法，并且字段属性为`private`。

此时在Groovy中通过`.`操作使用属性时

    User user = new User()
    user.name = 'lee'
    println user.name

实际上使用的都是属性对应的getters/setters方法，也就是说`user.name = 'lee'`实际上调用的是`user.setName('lee')`

> **需要注意的是**：Java中的`user.name`是直接访问User对象的公共属性；如果Java和Groovy混合开发时，在Java类中调用Groovy的`User`对象时就需要使用`user.setName('lee')`而不是`user.name`

_**如果可以混和开发，那么`Lombok`基本就没啥需要了.**_

最后可以通过对象实例的`properties`获取对象的所有属性，返回值是`Map`

    println user.properties

> [class:class User, age:0, name:lee]