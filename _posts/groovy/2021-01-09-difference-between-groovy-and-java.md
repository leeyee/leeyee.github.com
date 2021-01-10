---
layout: post
title: Groovy与Java的不同
description: 简单介绍Groovy和Java两者之间的差异
category: groovy
tag: [groovy, java]
---

* any list
{:toc}

 
简单介绍Groovy和Java两者之间的差异, 完整的信息可参看[官方文档](http://www.groovy-lang.org/differences.html)

 
## 默认导入

不需要显式的import语句导入Groovy基础包，默认是导入的。

## 多方法

Groovy是在**运行时**选择要执行的方法（动态）。具体可看[方法的选择算法](http://www.groovy-lang.org/objectorientation.html#_method_selection_algorithm)

Java是在**编译时**根据声明的类型选择的（静态）。

## 数组的初始化

Java

    int[] array = {1, 2, 3}
    int[] array2 = new int[] {1, 2, 3}

Groovy

    int[] array = [1, 2, 3]

从Groovy3+ 同样可以使用Java方式

## 包范围可见

在Groovy中，省略字段上的修饰符不会像Java中那样导致程序包私有字段

    class User {
        String name
    }

它是用于创建属性，即私有字段，关联getter/setter的。如果需要包私有字段，那么需要使用`@PackageScope`注解该字段
    
    @PackageScope String name

## 自动资源管理(ARM)

Java7引入了自动资源管理，比如

    try (BufferedReader reader = Files.newBufferedReader(file, charset)) {
        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println(line);
        }
    } catch (IOException e) {
        e.printStackTrace();
    }
    
Groovy3+ 也支持类似块操作。但同时Groovy也提供了通过闭包的解决方式。

    file.eachLine('UTF-8') {
       println it
    }

    file.withReader('UTF-8') { reader ->
       reader.eachLine {
           println it
       }
    }

## 内部类

Groovy匿名内部类和嵌套类的实现与Java密切相关，但又有一些不同。比如

1. 从类中访问的局部变量不必是`final`的；
2. 在生成内部类字节码时，会附带一些用于groovy.lang.Closure的实现细节

### 静态内部类

    class A{
        static class B {}
    }
    new A.B()
    
### 匿名内部类

    CountDownLatch called = new CountDownLatch(1)

    Timer timer = new Timer()
    timer.schedule(new TimerTask() {
        void run() {
            called.countDown()
        }
    }, 0)
    
    assert called.await(10, TimeUnit.SECONDS)
    
### 非静态内部类实例

Java 

    public class Y {
        public class X {}
        public X foo() {
            return new X();
        }
        public static X createX(Y y) {
            return y.new X();
        }
    }

Groov3+支持上述方式，但Groovy3之前，不支持`y.new X()`，需要使用`new X(y)`替代。

Groovy

    public class Y {
        ...
        public static X createX(Y y) {
            return new X(y)
        }
    }

## Lamda表达式和`::`操作

Java8+

    Runnable run = () -> System.out.println("Run");
    list.forEach(System.out::println);
    
Groovy3+也支持上述方式，较早的版本需要使用下面的方式

    Runnable run = { println 'run' }
    
    list.each { println it }
    // or 
    list.each(this.&println)


## Groovy字符串 GString

由于双引号字符串文字被解释为GString值,如果使用Groovy和Java编译器编译具有String文字且包含美元字符的类，则Groovy可能会因编译错误而失败，或者会产生完全不同的代码

## 字符串和字符

Groovy中的单引号文字用于String，而String或GString中的双引号结果则取决于文字中是否存在插值。

    assert 'c'.getClass()==String
    assert "c".getClass()==String
    assert "c${1}".getClass() in GString

仅当分配给`char`类型的变量时，Groovy才会自动将单字符字符串转换为`char`,因此需要显式转换或确保值已预先转换。

    char a = 'a'
    assert Character.digit(a, 16) == 10 : 'But Groovy does boxing'
    assert Character.digit((char) 'a', 16) == 10
    
对于单字符字符串可强转或者使用Groovy的`as`操作:

    // for single char strings, both are the same
    assert ((char) "c").class==Character
    assert ("c" as char).class==Character
    
对于多字符字符串，Java式的强转会报错，而Groovy式的转换则会取第一个字符做为返回值:

    // for multi char strings they are not
    try {
      ((char) 'cx') == 'c'
      assert false: 'will fail - not castable'
    } catch(GroovyCastException e) {
    }
    assert ('cx' as char) == 'c'
    assert 'cx'.asType(char) == 'c'
    
## 原始类型和包装

Groovy对所有对象都使用对象，所以它会[自动包装](https://docs.groovy-lang.org/latest/html/documentation/core-object-orientation.html#_primitive_types)对基元的引用。

    void foo(long l){
        println "in foo(long)"
    }
    
    void foo(Integer i){
        println "in foo(Integer)"
    }
    
    int i = 2
    foo(i)

Java中将会调用`foo(long)`, 而在Groovy中则会调用`foo(Integer)`


## `==`的行为

在Java中，`==`表示对象的原始类型或身份相同。

在Groovy中，`==`表示在所有情况下均相等, 在比较对象时，它转换为`a.compareTo(b) == 0`，否则为`a.equals(b)`。

Groovy中使用`is`方法判断对象引用是否相等, Groovy3+ 中，还可以使用`===`或者`!==`运算符。

## 数据类型转换

参考[官方文档](http://www.groovy-lang.org/differences.html#_conversions)


## Groovy额外关键字

Groovy具有许多与Java相同的关键字，而Groovy3也具有与Java相同的var保留类型。此外，Groovy具有以下关键字：

- `as`
- `def`
- `in`
- `trait`
- `it`

Groovy不如Java严格，它允许某些关键字出现在Java非法的地方, 比如

    var var = [def: 1, as: 2, in: 3, trait: 4]

虽然这样做可以，但容易混淆。完全不建议这样做！