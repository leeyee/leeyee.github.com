---
title: 一些关于javascript、jQuery使用时的建议
date: 2011-04-09
description: 这篇文章介绍一些关于javascript及jQuery代码开发过程中首选的最佳实践。
categories: "javascript"
tags: ["javascript", "jQuery"]
slug: 'javascript-jquery-user-suggests'
aliases: ['/blog/2011/04/09/javascript-jquery-user-suggests.html']
---

## 1.在遍历数组时缓存长度

在遍历数组时应将数组的长度保存在一个变量中，不要在循环中每次都访问数组长度。

    // bad code  
    for ( var i = 0; i < aArray.length; i++) {  
        // TODO something  
    }  
    
    // better code  
    var iLen = aArray.length;  
    for ( var i = 0; i < iLen; i++) {  
        // TODO something  
    }  

## 2.如果需要给DOM中添加新的元素，避免创建一个元素添加一次。应尽量只添加一次

    // bad code  
    $.each(aArray, function(i, item) {  
        var newListItem = '<li>' + item + '</li>';  
        $('ul').append(newListItem); // 这里每append一次都将会重载DOM  
    });  
    
    // better code  
    var frag = document.createDocumentFragment(); // 创建文档碎片  
    $.each(aArray, function(i, item) {  
        var newListItem = '<li>' + item + '</li>';  
        frag.appendChild(newListItem); // 这里不会刷新DOM  
    });  
    $('ul').appendChild(frag); // 添加新元素，此时重载DOM一次  
    
    // or do this  
    var sHtml = '';  
    $.each(aArray, function(i, item) {  
        html += '<li>' + item + '</li>'; // 构造需要添加元素的字符串  
    });  
    $('ul').html(sHtml); // 使用jQuery的$.fn.html()方法添加改字符串  


## 3.避免重复，保持代码干燥

    // bad code  
    if ($eventfade.data('currently') != 'showing') {  
        $eventfade.stop();  
    }  
    if ($eventhover.data('currently') != 'showing') {  
        $eventhover.stop();  
    }  
    if ($spans.data('currently') != 'showing') {  
        $spans.stop();  
    }  
    
    // good  
    var $elems = [ $eventfade, $eventhover, $spans ]; // 构造一个数组  
    $.each($elems, function(i, elem) {  
        if (elem.data('currently') != 'showing') {  
            elem.stop();  
        }  
    });  

## 4.当心匿名函数。

绑定匿名函数是让人头疼的，对于他们调试，修改，测试或者重用都是困难的。因此可以使用对象去组织和命名你的处理方法和回调函数

    // bad code  
    $(document).ready(function() {  
        $('#magic').click(function(e){  
                $('#yayeffects').slideUp(function() {  
                        // TODO some codes  
                });  
        });  
        $("#happiness").load(url + ' #unicorns',function(){  
            // TODO some codes  
        });  
    });  
  
    // better  
    var PI = {  
         onReady :  function(){  
                $('#magci').click(PI.candyMtn);  
                $('#happiness').load(PI.url + ' #unicorns', PI.unicornCb);  
         },  
         candyMtn : function(e) {  
                $('#yayeffects').slideUp(PI.slideCb);  
         },  
         slideCb : function() { // TODO some codes},  
         unicornCb : function() { // TODO some codes}  
    };  
    $(document).ready(PI.onReady);  

## 5.选择器的优化

### 5.1.通过ID来获取元素是最好的选择

    // fast  
    $('#container div.robotarm'); // 获取元素id=container中div元素class=robotarm的元素
    
    // super-fast  
    $('#container').find('div.robotarm');  

`$.fn.find`方法是快速的，因为对于第一个选择`$('#container')`其实质是通过`document.getElementById()`来实现的。`document.getElementById()`是浏览器原生方法 

### 5.2.选择器的右边要具体化，而不是左边。

如果可以尽量使`tag.class`出现在右边，而单独的`tag`或者`.class`出现在左边
    
    // 未经优化的  
    $('div.data .gonzalez'); 
    
    // 优化后  
    $('.data td.gonzalez');  

### 5.3.避免选择器过度具体化

    $('.data table.attendees td.gonzalez');  
    // better : drop the middle if possible  
    $('.data td.gonzalez');  

### 5.4.避免使用通配符选择器。(能被匹配在任何地方的指定或隐含的选择器运行是非常慢的)

    // 查询效率低下  
    $('.buttons > *'); 
    
    // much better  
    $('.buttons').children(); 
    
    // 隐含的通配选择 no good  
    $('.gender :radio'); 
    
    // 和上面一样。明确的通配选择 no good  
    $('.gender *:radio'); 
    
    // much better  
    $('.gender input:radio');  

## 6.使用事件委托(Use Event Delegation)

事件委托允许绑定一个事件处理程序到一个容器元素上（比如，一个无序序列）替代多容器元素（比如，列表项）。

使用jQuery的`$.fn.live`和`$.fn.delegate`是易于实现事件委托的。在可能的情况下应该使用`$.fn.delegate`替代`$.fn.live`,因为`$.fn.delegate`省去了不必要的选择，并且当DOM上下文明确时，相对`$.fn.live`，使用`$.fn.delegate`能减少约80%的开销。

除了性能方面的好处外，事件委托会在添加新容器元素到页面时直接绑定处理程序，而无需对新添容器元素重新绑定处理程序

    // bad (当有很多<li class='trigger'/>时，该种调用将会很慢)  
    $('li.trigger').click(handlerFn); // 当动态添加<li class='trigger'/>元素时，该新增元素上将无法自动添加handlerFn时间，需重新绑定
    
    // better: 使用$.fn.live实现事件委托 所有<li class='trigger'/>都将绑定handlerFn事件  
    $('li.trigger').live('click', handlerFn);
    
    // best: 使用$.fn.delegate实现事件委托，允许你很容易的指定一个上下
    // $('#myList')中的所有<li class='trigger'/>都将绑定handlerFn事件。其他<li class='trigger'/>则未被绑定  
    $('#myList').delegate('li.trigger', 'click', handlerFn);  

## 7.使用`$.fn.detach`从DOM中移除元素

操作DOM是缓慢的；你应该尽可能避免操作他们。在jQuery的1.4版本中提供`$.fn.detach`来解决这个问题。`$.fn.detach`允许从DOM中移除一个元素。

    var $table = $('#myTable');  
    var $parent = $table.parent(); // 获取$table元素的父节点  
    $table.detach(); // 从DOM中移除该表格  
    // TODO 添加一些行到table中  
    $parent.append($table); // 将table重新添加到原来位置  

## 8.使用样式表改变样式，当需要改变许多元素样式时

假如你将使用`$.fn.css`改变超过20个元素的样式时，请考虑添加一个样式标签到页面。这样可以提升约60%的执行速度

    // 前20个是比较快的，往后会越来越慢  
    $('a.swedberg').css('color', '#asd123'); // 考虑到$('a.swedberg')选择的匹配元素的数量很大时  
    // instead of  
    $('<style type="text/css">
            a.swedverg { color ：#asd123 }  
            a.swedverg { color ：#asd123 }
        </style>').appendTo('head');  

## 9.使用`$.data`替代`$.fn.data`存储数据

在DOM元素上使用`$.data`替代在jQuery选择器上调用`$.fn.data`将带来可达10倍的速度提升。因为`$.data`是jQuery的底层方法

    // 惯用的  
    $(element).data(key, value); 
    
    // 十倍速度的  
    $.data(element, key, value); 

## 10.不要对不存在的元素施加操作

jQuery不会告诉你是否正在一大堆空的选择器上运行代码，他会当做没有事情是错的继续运行。因此你需要自己去核实选择器包含的一些元素

    // bad  
    $('#nosuchthing').slideUp(); // 在实现.slideUp前应先确保$('#nosuchthing')是存在的
    
    // better  
    var $mySelection = $('#nosuchthing');  
    if ($mySelection.length) {  
        $mySelection.slideUp();  
    } 
    
    // best：添加一个doOnce插件  
    jQuery.fn.doOnce = function(func) { // doOnce的作用类似公共函数  
        this.length && func.apply(this);  
        return this;  
    };  
    $('li.cartitmes').doOnce(function() {  
        // make it ajax！ /ｏ/  
    });  

## 11.变量定义

多变量可被定义可以用一条语句替代几条语句

    // old & busted  
    var test = 1;  
    var test2 = function() {  
        // TODO some things  
    };  
    var test3 = test2(test); 
    
    // new hotness  
    var test = 1, test2 = function() {  
        // TODO some things  
    }, test3 = test2(test);  
    // 在自动执行函数中，变量的定义可被整块跳过  
    // out foo+bar --> 3  
    (function(foo, bar) {  
        console.log("foo+bar --> " + (foo + bar));  
    })(1, 2);  

## 12.条件语句

    // old way  
    if (type == 'foo' || type == 'bar') {  
        // TODO something  
    } 
    
    // better  
    if (/^(foo|bar)$/.test(type)) {  
        // TODO something  
    }  
    
    // object literal lookup  
    if (({  
        foo : 1,  
        bar : 1  
    })[type]) {  
    // TODO something  
    }  

## 13.不要把jQuery视作一个黑盒子

将jQuery源码作为你的文档 -- 保存[https://github.com/jquery/jquery](https://github.com/jquery/jquery) 在你的书签里，并且经常查阅他.
