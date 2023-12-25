---
title: javascript中的null和undefined
date: 2013-05-07
description: 本文主要就ECMAScript对null、undefined定义变量的区别以及在使用typeof方法操作这两类变量时返回的结果进行了详细说明。
categories: "javascript"
tags: ["javascript"]
slug: 'jquery-plugins-authoring'
aliases: ['/blog/2013/05/07/jquery-plugins-authoring.html']
---

1. `null`表示无值或不存在的对象；

2. `undefined`表示一个未声明的变量。声明但没有赋值的变量或者一个并不存在的对象属性;

        var param; // 声明但不赋值，其等价于
        var param = undefined;
    
        var obj = {}; //声明一个对象
        var param1 = obj.param; // 对象不存在的属性
        console.info(param1); // undefined
        console.info(param1 === undefined); // true

3. `undefined`不同于**未定义**，但在使用`typeof`方法时，该方法并不区分`undefined`和**未定义**，其返回值均为*字符串`undefined`*

        var param; 
        console.info(typeof param); // 打印 "undefined"
        console.info(typeof param === 'undefined'); // true
    
        // 注意：param1并未被声明，属于首次使用
        console.info(typeof param1); // 打印 "undefined"
        console.info(typeof param1 === 'undefined'); // true
    
4. `undefined`为函数默认的返回值（当函数无明确返回值时）。

        function test(){};
        var fn = test();
        console.info(fn); // 打印 undefined
        console.info( fn === undefined ); // true
    
5. `typeof(null)`返回*字符串`object`*,而`typeof(undefined)`返回*字符串`undefined`*。
    
        console.info(typeof null); // 打印 "object"
        console.info(typeof(null) === 'object'); // true
    
        console.info(typeof undefined); // 打印 "undefined"
        console.info(typeof(undefined) === 'undefined'); // true
    
    但`null == undefined`，这是由于值`undefined`是从值`null`派生过来的，因此`ECMAScript`将其定义为一样的。

        console.info(null == undefined);// true
        
    虽然`null == undefined`，但`null`表示尚未存在的对象，而`undefined`则是声明了变量但未对其初始化时赋予该变量的值；因此只能通过`===`运算符来测试某个值是否**未定义**。

        var param;
        var param1 = undefined;
        console.info(param === undefined); // true
        console.info(param1 === undefined); // true
    
        var param2 = null;
        console.info(param2 == undefined); // true
        console.info(param2 === undefined); // false

6. 函数或方法返回值为对象时，如果该返回的对象找不到，则该函数或方法通常返回是`null`

最后，关于对于`typeof`方法的使用进行下说明：

`typeof`方法返回的是变量的引用类型的字符名称。因此`if(typeof param){}`为永真。如果要判断引用类型，可以使用`instanceof`，但此时变量的声明应使用`new`关键字创建。

老版地址请查看：<br/>
[ECMAScript中原始类型Null和Undefined小结](http://blog.csdn.net/oxcow/article/details/7751835) 或者 [ECMAScript中原始类型Null和Undefined小结](http://leeyee.iteye.com/admin/blogs/1595338)