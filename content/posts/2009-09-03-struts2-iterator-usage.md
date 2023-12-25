---
title: Struts2中iterator标签的相关使用
date: 2009-09-03
description: Struts2的iterator标签使用说明
categories: "java"
tags: ["struts2"]
slug: "struts2-iterator-usage"
aliases: ['/blog/2009/09/03/struts2-iterator-usage.html']
---

在说明s:iterator标签的使用前，先了解下struts2中的Value Stack。这里参考了webwork中对Value Stack的描述，由于struts2是在webwork的基础上进行升级的，因此webwork对于Value Stack的表述同样适用于struts2。在这里不描述Value Stack具体做什么，但有两点需要注意：

1. 一个value stack本质上是一个List；
2. 在栈中调用 [n] 将返回一个从位置n开始的子栈；

对于2举个例子说明。假定Value Stack包含了[model,action,others]，那么

1. [0] --- 返回 [model,action,others]；
2. [1] --- 返回 [action,others]；
3. [2] --- 返回 [others];

现在将开始介绍 `s:iterator` 的一些使用。以下代码片段均在开发环境eclipse3.4 wtp、tomcat5.5、jdk5上使用struts2.1.6测试通过。

## 集合元素访问

定义如下`List`集合：

    List<String> list = new ArrayList<String>();
    list.add("Monday");
    list.add("Thursday");
    list.add("Friday");
    list.add("Sunday");

标签遍历方式如下：

    <s:iterator value="days"><s:property /></s:iterator>

## top关键字

还是使用上面例子中的 `list` 集合，使用 **top** 关键字过滤掉“Monday”

    <s:iterator value="list">
        <s:if test="top!='Monday'">
            <s:property />
        </s:if>
    </s:iterator>

1. top 指代当前迭代元素，可以为对象；
2. 这里的top可用 **[0]**.top替代，但不能使用 **[0]**。 **[0]**代表整个栈对象。如果单纯调用 **[0]**将会调用其`toString()`方法输出对象信息；

## first/last关键字

1. **first** 用来标记集合中的第一个元素,返回一个boolean类型;
2. **last** 用来标记集合中的最后一个元素,返回一个boolean类型;

定义如下数组：

    String[][] aTs = { { "一", "二", "三", "四" },{ "一一", "二二", "三三", "四四"} };

使用如下方式遍历该二维数组：

    <!-- 遍历二维数组 -->
    <s:iterator value="aTs" status="of">
        <!-- 遍历的当前元素如果是最后一个则输入换行标签 -->
        <s:if test="#of.last"><br/></s:if>
        <!-- top 指代内部数组 -->
        <s:iterator value="top">
            <!--亦可用[0].top替代。如果单纯用[0],则会同时打印该处栈对象信息-->
            <s:property />
        </s:iterator>
    </s:iterator>

1. **iterator** 标签中的 **status** 属性代表当前迭代的位置；
2. **#of.last** 用于判断当前迭代到的元素是否为最后一个元素；

## odd/even关键字

1. **odd** 关键字用来判断当前迭代位置是否为奇数行, **odd** 返回boolean类型;
2. **even** 关键字用来判断当前迭代位置是否为偶数行, **even** 返回boolean类型.

还是用上面定义的`list`作为实例来实现一个奇偶行输出颜色不同的效果:

    <!--奇数行显示为红色,偶数行显示为绿色-->
    <s:iterator value="list" status="offset">
        <s:if test="#offset.odd==true">
            <li style="color: red"><s:property /></li>
        </s:if>
        <s:if test="#offset.even==true">
            <li style="color: green"><s:property /></li>
        </s:if>
    </s:iterator>

## status属性小结

当在`iterator`标签中使用了 **status** 属性时，可以有以下操作，有兴趣的可以逐一尝试下：

- even : boolean - 如果当前迭代位置是偶数返回true
- odd : boolean - 如果当前迭代位置是奇数返回true
- count : int - 返回当前迭代位置的计数(从1开始)
- index : int - 返回当前迭代位置的编号(从0开始)
- first : boolean - 如果当前迭代位置是第一位时返回true
- last : boolean - 如果当前迭代位置是最后一位时返回true
- modulus(operand : int) : int - 返回当前计数(从1开始)与指定操作数的模数

## iterator中调用Value Stack

首先做如下假设：

1. 定义一个城市类City,包含属性城市名name;
2. 定义一个国家类Country，包含对象name和城市集合;
3. 国家类集合实例名是countries，其对应的城市集合实例名是cities

那么我们想要在迭代cities时访问所属Country的name属性就的用如下方式：

    <s:iterator value="countries">
        <s:iterator value="cities">

            <!-- 获取 city.name -->
            <s:property value="name"/>,

            <!-- 获取 country.name -->
            <!-- 等价于 [1].top.name -->
            <s:property value="[1].name"/>

            <br/>
        </s:iterator>
    </s:iterator>


1. city处于当前栈，即top或者[0],而[1]指明了外层iterator对象，即country [^comment]

2. ' **[n]** '标记引用开始位置为n的子栈（sub-stack），而不仅仅是位置n处的对象。因此' **[0]** '代表整个栈，而' **[1]** '是除 **top** 对象外所有的栈元素。



[^comment]: 原英文说明为: we refer to a specific position on the stack: '[1]'. The top of the stack, position 0, contains the current city, pushed on by the inner iterator; position 1 contains the current country, pushed there by the outer iterator.