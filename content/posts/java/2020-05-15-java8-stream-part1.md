---
title: Java8 Stream数据处理(Part1)
date: 2020-05-15
description: Java8 Stream 数据处理第一部分，介绍Stream的相关知识及应用。
categories: "java"
tags: ["java"]
---

## Get Start

对于`Stream`的定义是：

> A sequence of elements from a source that supports aggregate operations

简单来说就是：*支持聚合操作的源数据元素序列*。

- **Sequence of elements**: A stream provides an interface to a sequenced set of values of a specific element type. However, streams don’t actually store elements; they are computed on demand.

- **Source**: Streams consume from a data-providing source such as collections, arrays, or I/O resources.

- **Aggregate operations**: Streams support SQL-like operations and common operations from functional programing languages, such as filter, map, reduce, find, match, sorted, and so on. 

重点就是：
> *流不存数数据。它只按需计算*

**流操作** 和 **集合操作** 的区别在于：

* Pipelining: 许多流操作返回自身，因此可以将不同的操作连接在一起形成管道。这样便于*lazy*和*short-circuiting*
* Internal iteration: 流操作使用隐式（内部）迭代，而集合操作使用显示迭代（外部迭代）


## Stream Vs Collections

**Stream** 是关于计算的，**Collections** 是关于数据的。

**Collections**和**Stream**之间的差异与计算事物时有关。

**Collections**是内存中的数据结构，其中包含该数据结构当前具有的所有值；

**Collections**中的每个元素都必须先进行计算，然后才能将其添加到集合中；

相反，**Stream** 是概念上固定的数据结构，其中元素是按需计算的。


使用`Collection`接口要求用户进行迭代(如`foreach`)，这个称作外部迭代。相反，`Streams`库使用内部迭代-它为您进行迭代，并负责将结果流值存储在某个位置.

    List<String> transactionIds = new ArrayList<>(); 
    for(Transaction t: transactions){
        transactionIds.add(t.getId()); 
    }
    
    List<Integer> transactionIds = transactions.stream()
                .map(Transaction::getId)
                .collect(toList());
                

## Stream operations

`java.util .stream.Stream`定义的流操作可分为两类：

- 中间操作. `filter`, `sorted`和`map`都属于这类操作，它们会返回流自身，因此可以链接操作。
- 终端操作. `collect`，关闭流并返回结果。

这两类操作的*区别*在于：

> 在对流管道调用终端操作之前，中间操作不会被执行。他们是“懒惰的”。这是因为中间操作通常可以通过终端操作被“合并”处理。

    Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8).stream()
            .filter(n -> {
                System.out.println("filtering " + n);
                return n % 2 == 0;
            })
            .map(n -> {
                System.out.println("mapping " + n);
                return n * n;
            })
            .limit(2)
            .collect(toList());
            
OUTPUT:
    
    filtering 1
    filtering 2
    mapping 2
    filtering 3
    filtering 4
    mapping 4
    

如果*Source*是对象，那么会有些许不同。*针对每一个对象调用所有管道操作，而不是对所有数据进行逐个管道操作*。

    users.stream()
            .filter(u -> {
                System.out.println("filtering " + u);
                return u.getAge() > 18;
            })
            .map(u -> {
                System.out.println("mapping " + u);
                return u.getAge();
            })
            .limit(2)
            .collect(toList());
            
OUTPUT:

    filtering User{id=1, name='Jack', address=Address{id=1, address='DC'}}
    mapping User{id=1, name='Jack', address=Address{id=1, address='DC'}}
    filtering User{id=2, name='Jason', address=Address{id=2, address='W.C'}}
    mapping User{id=2, name='Jason', address=Address{id=2, address='W.C'}}
    
### 过滤操作

- `filter(Predicate)`: 返回符合要求的所有元素的流对象
- `distinct`: 返回具有唯一元素的流（依赖流对象的`equals`方法）
- `limit(n)`: 返回不超过给定大小n的流
- `skip(n)`: 返回一个流，其中前n个元素被丢弃

### 查找和匹配

下面的操作是终端操作，因此会关闭流并返回结果

- `anyMatch`: 只要有一个元素匹配就返回真
- `allMatch`: 所有元素都匹配时返回真
- `noneMatch`: 所有元素都不匹配时返回真
- `findFirst`: 从流中返回第一个元素。返回Option对象
- `findAny`: 从流中返回任意一个元素(返回结果不稳定)。返回Option对象。

Demo:

    Optional<Integer> first = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8).stream()
                    .findFirst();
                    
    Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8).stream()
                    .findAny()
                    .ifPresent(System.out::println);
                    
### 映射

**`map`操作**

通过`map`方法，可以将流的元素映射成另外一种形式。该方法会作用于每个元素并将其映射到一个新元素中。

**`reduce`操作**

该操作对每个元素重复应用一个操作（例如，将两个数字相加），直到产生结果为止。在函数式编程中，通常将其称为**折叠操作**

    int sum = numbers.stream().reduce(0, (a, b) -> a + b);

    int product = numbers.stream().reduce(1, (a, b) -> a * b);
    
    int max = numbers.stream().reduce(1, Integer::max);
    

## Numeric Streams

可以使用`reduce`方法来计算整数流的总和。但是，这是有代价的：**执行许多装箱操作，以将Integer对象重复添加在一起**。

为了解决这个问题，可以使用原始专用流接口处理。`IntStream`, `DoubleStream`, 和 `LongStream`。

通过`mapToInt`, `mapToDouble`, 和 `mapToLong`将原始流转换为指定的流。

    int a = numbers.mapToInt(Integer::intValue).sum();
    
当然也可以通过`boxed()`将原始流转换成对象流。

### Stream Range

`IntStream`, `DoubleStream`, 和 `LongStream` 提供静态方法 `range` and `rangeClosed` 生成数字范围。

    // 7, 8, 9
    IntStream.range(7, 10).forEach(System.out::println);
    
    // 7, 8, 9, 10
    IntStream.rangeClosed(7, 10).forEach(System.out::println);

## Building Streams

1. 使用`Stream.of`构建流

        Stream<Integer> stream = Stream.of(1, 2, 3);
        
        IntStream intStream = IntStream.of(1, 2, 3);

1. 使用`Arrays.stream`构建流

        int[] nums = {1, 2, 3};
        IntStream intStream = Arrays.stream(nums);
    
1. 使用`Files.lines`以行的形式转换文件

        long numberOfLines = Files.lines(Paths.get("yourFile.txt"), Charset.defaultCharset())
                .count();
            
1. 使用`Stream.iterate` 和 `Stream.generate` 创建无限流

        Stream<Integer> numbers = Stream.iterate(0, n -> n + 10);
        
        // 0, 10, 20, 30, 40
        numbers.limit(5).forEach(System.out::println); 
        
        // random int stream
        IntStream randomIntStream = IntStream.generate(new Random()::nextInt);
        
        // random stream
        Stream<Integer> randomStream = Stream.generate(new Random()::nextInt);
        
## Reference

[Processing Data with Java SE 8 Streams, Part 1](https://www.oracle.com/technical-resources/articles/java/ma14-java-se-8-streams.html)

[Java 8 中的 Streams API 详解](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/index.html)
