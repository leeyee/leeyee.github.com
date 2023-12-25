---
title: jQuery MsgBox Plugin
date: 2012-05-04
description: 基于jQuery的消息提示框插件。该插件主要包含四个主要方法，jMask遮罩、jUnmask关闭遮罩、jAlert消息提示框及jConfirm消息确认框等。
categories: "javascript"
tags: ["javascript", "jQuery"]
slug: 'jquery-msgbox-plugin'
aliases: ['/blog/2012/05/04/jquery-msgbox-plugin.html']
---

{{< github repo="oxcow/MsgBox-jQuery-Plugin" >}}

## jmask(options) 遮罩层

>移动目标元素对象，使其显示在遮罩层正中央。 `jmask` 接受一个参数.

>**options**: 该参数为对象类型。用来设置遮罩层默认全局属性,默认属性为：
>
    $.fn.jmask.defaults = {
    	bgcolor : '#eee',
		opacity : 0.8
    };

**Example**: 

    $("#jmaskDemo").jmask();
    $("#jmaskDemo").jmask({
        bgcolor:'pink',
        opacity : 0.6
    });

## junmask() 关闭遮罩层

>取消使用 `jmask` 方法遮罩的目标元素,并隐藏目标元素。该方法不接受参数.

**Example**:

    $("#jmaskDemo").junmask();
    
## jalert(msg,options) 消息框

>打开一个消息提示框。 `jalert` 接受两个参数

>**msg**: 消息框显示的消息內容

>**options**: 该参数为对象类型，用来设置消息框全局属性,默认属性为：
>
    $.fn.jalert.defaults = {
    	    title : '消息框',
            width : 320,
            height : 240,
            mask : true,
           	maskcolor : '#eee',
			maskopacity : 0.8
    };
    
**Example**:

    $("#jalertDemo").jalert('jalert demo 测试');
    $("#jalertDemo").jalert('jalert demo 测试',{ 
        title : 'hello jalert', 
        width : 300, 
        height : 250, 
        mask : false
    });

## jconfirm(msg,url,options) 消息确认框

>打开一个消息确认框。 `jconfirm` 接受两个参数

>**msg**: 消息框显示的消息內容

>**options**: 该参数为对象类型，用来设置消息框全局属性,默认属性为：
>
    $.fn.jconfirm.defaults = {
    	title : '确认消息框',
        width : 320,
        height : 240,
        mask : true,
        maskcolor : '#eee',
		maskopacity : 0.8
    };

**Example**:

    $("#jconfirmDemo").jconfirm('jconfirm demo 测试','http://www.163.com');
    $("#jconfirmDemo").jconfirm('jconfirm demo 测试',null,{
        title : 'hello jconfirm', 
        width : 400, 
        height : 300, 
        maskcolor : 'pink',
        maskopacity : 0.9
    });