---
layout: post
title: awk多文件处理
description: awk多文件处理及相关关联查询
category: script
tag: [shell]
---

* TOC
{:toc}

日常的开发中，经常会针对不同的需要将程序中的日志进行分类存储，但在运维或者异常处理需要查看时，又不得不针对多个日志文件进行联合处理。甚至有些时候需要进行日志关联查询。这种情况下，一般的 *linux* 命令，比如 *grep* 等就显得功能不够强大了。此时可以考虑使用 *awk* 进行多文件处理，借助其语法可以很方便的实现文件内容关联查询，完成类似 *sql* 式的**关联查询**。

首先，定义如下两个文件。一个是学生信息 *s.log* 

> sid tid name age address
1 1 张三 18 北京朝阳
2 1 李四 19 北京西城
3 2 马六 17 北京海淀
4 2 王五 17 北京昌平
5 3 唐七 18 北京西城
6 1 徐六 16 北京朝阳

一个是老师信息 *t.log* 

> tid name age subject
1 张正	35	数学
2 聂磊	40	语文
3 黄明	42	物理
4 吴立	23	体育

## 基本语法

当使用 *awk* 读取多文件时，可以有以下两种方式：

1. 模糊匹配。形式如下：

	> awk '{...}' *.log

2. 直接指定需要读取的文件。形式如下：

    > awk '{...}'  file1...fileN

针对第一种方式，*awk* 会依次读取匹配到的所有文件；第二种则是依次处理指定的文件。对应两种方式的处理流程都是**先处理完成一个文件后在接着处理另一个文件**。比如
 
	awk 'FNR > 1 {print $1,$2,$3,$4}' s.log t.log
 
输出结果：

>   1 1 张三 18
2 1 李四 19
3 2 马六 17
4 2 王五 17
5 3 唐七 18
6 1 徐六 16
1 张正 35 数学
2 聂磊 40 语文
3 黄明 42 物理
4 吴立 23 体育

以上方式只是简单的将多个文件输出，那么当需要在一个命令中针对不同的文件进行一些差异化的处理时该如何操作呢？

## 两文件处理

一般的，对两个文件的常规处理方式有以下两种：

> **awk 'NR==FNR{...} NR>FNR{...}' file1 file2**
>
>或者
>
> **awk 'NR==FNR{...} NR!=FRN{...}' file1 file2**
>
>或者
>
> **awk 'NR==FNR{...;next}{...}' file1 file2**

其中 *NR* 参数代表当前读取文件的总行数，而 *FNR* 参数代表当前读取文件的行数。所以当读取第一个文件时，总是有 ***NR==FNR***。而当读取第二个文件时，总是有 ***NR>FNR*** 或者 ***NR!=FNR***，因为 *FNR* 重新开始计数了！

下面来看下具体的示例：

假设需要查询学生表中学号为1的学生和教师表中年纪等于23岁的老师，可以使用

	awk 'NR==FNR {if($1==1)print $0} NR>FNR {if($3==23)print $0}' s.log t.log
 
输出结果：

>   1 1 张三 18 北京朝阳
4 吴立  23      体育

如果需要复杂一点的数据，比如要查询学生信息中关联的老师信息，并展示在一行，则可以使用

	awk 'NR==FNR {a[$1]=$0} NR!=FNR {if(FNR>1)print $0,a[$2] }' t.log s.log

输出结果：

>   1 1 张三 18 北京朝阳 1 张正     35      数学
2 1 李四 19 北京西城 1 张正     35      数学
3 2 马六 17 北京海淀 2 聂磊     40      语文
4 2 王五 17 北京昌平 2 聂磊     40      语文
5 3 唐七 18 北京西城 3 黄明     42      物理
6 1 徐六 16 北京朝阳 1 张正     35      数学

这里让 *awk* 在处理第一个文件 t.log 时，将老师的信息通过其主键保存在变量 *a* 中，*a* 类似一个 map。当 *awk* 在处理第二个文件 s.log 时，通过 s.log 的第二个字段，学生对应老师的主键作 key 从数据 *a* 中获取存储的值进行展示。通过这种方式就完成了日志字段的关联查询。其核心还是通过先将第一个文件的值通过需要关联的key进行存储，而在进行第二个文件解析的时候再通过相关关联主键查询出来。（***a* 是数组！**）

## 两个以上文件处理

上面只是针对两个文件的处理，那么如果要处理的文件超过2个时该如何处理呢？

此时就需要用到参数 *ARGIND* 了，*ARGIND* 用来记录当前正在处理文件的顺序，从 **1** 开始。

> **awk 'ARGIND==1 {...} ARGIND==2 {...} ARGIND==3 {...} ... ' file1 file2 file3 ...fileN**

或者使用命令行参数数组 *ARGV*，数组的下标是从 **1** 开始

> **awk 'FILENAME==ARGV[1] {...} FILENAME==ARGV[2] {...} FILENAME==ARGV[3] {...} ... ' file1 file2 file3 ...fileN**

或者直接使用文件名的方式处理。

> **awk 'FILENAME=="file1"{...} FILENAME=="file2" {...} FILENAME=="file3" {...} ... ' file1 file2 file3 ...fileN**


下面我们展示一个对应多文件的简单例子：

	awk 'ARGIND==1 {if(FNR>3)print FNR,$3 } ARGIND==2 {if(FNR>1)print FNR,$2} ARGIND==3 {if(FNR<3)print FNR,$NF}' s.log t.log s.log

输出结果：

>   4 马六
5 王五
6 唐七
7 徐六
2 张正
3 聂磊
4 黄明
5 吴立
1 address
2 北京朝阳

## 总结

针对 *awk* 多文件的处理其实不需要额外的新知识学习，只需要掌握以上两文件及其以上文件的处理模板语句就行。在实际的应用中直接套用模板语句即可。语法上每一个文件块的处理按照 *awk* 的处理单个文件的方式处理即可。