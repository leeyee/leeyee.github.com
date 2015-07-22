---
layout: post
title: AWK 入门
description: 本文主要介绍一些awk的入门语法及相关示例。包括awk基本语法及基本参数，内建参数的使用，awk脚本等相关基础入门内容
category: 脚本语言
tag: [script, awk]
keywords: [awk,忽略大小写,awk脚本,awk正则]
---

预先定义log.txt文本内容如下：

    2 this is a test
    3 Are you like awk
    This's a test
    10 There are orange,apple,mongo



## 基本命令

1. awk '{[pattern] action}' {filenames}  行匹配语句 **awk ''  只能用单引号**

        # 每行按空格或TAB分割，输入分割后的1、4项
        $ awk '{print $1,$4}' log.txt
        ---------------------------------------------
        2 a
        3 like
        This's
        10 orange,apple,mongo

        # 格式化输出
        $ awk '{printf "%-8s %-10s\n",$1,$4}' log.txt
        ---------------------------------------------
        2        a
        3        like
        This's
        10       orange,apple,mongo

2. awk -F   -F相当于内置变量FS, 指定分割字符

        # 使用","分割
        $  awk -F, '{print $1,$2}'   log.txt
        ---------------------------------------------
        2 this is a test
        3 Are you like awk
        This's a test
        10 There are orange apple

        # 或者使用内建变量
        $ awk 'BEGIN{FS=","} {print $1,$2}'     log.txt
        ---------------------------------------------
        2 this is a test
        3 Are you like awk
        This's a test
        10 There are orange apple

        # 使用多个分隔符.先使用空格分割，然后对分割结果再使用","分割
        $ awk -F '[ ,]'  '{print $1,$2,$5}'   log.txt
        ---------------------------------------------
        2 this test
        3 Are awk
        This's a
        10 There apple

3. awk -v   设置变量

        $ awk -va=1 '{print $1,$1+a}' log.txt
        ---------------------------------------------
        2 3
        3 4
        This's 1
        10 11

        $ awk -va=1 -vb=s '{print $1,$1+a,$1b}' log.txt
        ---------------------------------------------
        2 3 2s
        3 4 3s
        This's 1 This'ss
        10 11 10s

4. awk -f {awk脚本} {文件名}

        $ awk -f cal.awk log.txt


## 运算符

|运算符|描述|
|------|----|
|= += -= *= /= %= ^= **=|赋值|
|?:|C条件表达式|
|\|\||逻辑或|
|&&|逻辑与|
|~ ~!|匹配正则表达式和不匹配正则表达式|
|< <= > >= != ==|关系运算符|
|空格|连接|
|\+ -|加，减|
|\* / &|乘，除与求余|
|\+ - !|一元加，减和逻辑非|
|^ \**\*|求幂|
|++ --|增加或减少，作为前缀或后缀|
|$|字段引用|
|in|数组成员


    # 过滤第一列大于2的行
    $ awk '$1>2' log.txt
    ---------------------------------------------
    3 Are you like awk
    This's a test
    10 There are orange,apple,mongo

    # 过滤第一列等于2的行
    $ awk '$1==2 {print $1,$3}' log.txt
    ---------------------------------------------
    2 is

    # 过滤第一列大于2并且第二列等于'Are'的行
    $ awk '$1>2 && $2=="Are" {print $1,$2,$3}' log.txt
    ---------------------------------------------
    3 Are you


## 内建变量

|变量|描述|
|-------|------|
|\$n|当前记录的第n个字段，字段间由FS分隔|
|\$0|完整的输入记录|
|ARGC|命令行参数的数目|
|ARGIND|命令行中当前文件的位置(从0开始算)|
|ARGV|包含命令行参数的数组|
|CONVFMT|数字转换格式(默认值为%.6g)ENVIRON环境变量关联数组|
|ERRNO|最后一个系统错误的描述|
|FIELDWIDTHS|字段宽度列表(用空格键分隔)|
|FILENAME|当前文件名|
|FNR|同NR，但相对于当前文件|
|FS|字段分隔符(默认是任何空格)|
|IGNORECASE|如果为真，则进行忽略大小写的匹配|
|NF|当前记录中的字段数|
|NR|当前记录数|
|OFMT|数字的输出格式(默认值是%.6g)|
|OFS|输出字段分隔符(默认值是一个空格)|
|ORS|输出记录分隔符(默认值是一个换行符)|
|RLENGTH|由match函数所匹配的字符串的长度|
|RS|记录分隔符(默认是一个换行符)|
|RSTART|由match函数所匹配的字符串的第一个位置|
|SUBSEP|数组下标分隔符(默认值是/034)|


    $ awk 'BEGIN{printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n","FILENAME","ARGC","FNR","FS","NF","NR","OFS","ORS","RS";printf "---------------------------------------------\n"} {printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n",FILENAME,ARGC,FNR,FS,NF,NR,OFS,ORS,RS}'  log.txt


    FILENAME ARGC  FNR   FS   NF   NR  OFS  ORS   RS
    ---------------------------------------------
    log.txt    2    1         5    1
    log.txt    2    2         5    2
    log.txt    2    3         3    3
    log.txt    2    4         4    4

    $ awk -F\' 'BEGIN{printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n","FILENAME","ARGC","FNR","FS","NF","NR","OFS","ORS","RS";printf "---------------------------------------------\n"} {printf "%4s %4s %4s %4s %4s %4s %4s %4s %4s\n",FILENAME,ARGC,FNR,FS,NF,NR,OFS,ORS,RS}'  log.txt

    FILENAME ARGC  FNR   FS   NF   NR  OFS  ORS   RS
    ---------------------------------------------
    log.txt    2    1    '    1    1
    log.txt    2    2    '    1    2
    log.txt    2    3    '    2    3
    log.txt    2    4    '    1    4

    # 输出顺序号 NR, 匹配文本行号
    $ awk '{print NR,FNR,$1,$2,$3}' log.txt
    ---------------------------------------------
    1 1 2 this is
    2 2 3 Are you
    3 3 This's a test
    4 4 10 There are

    # 指定输出分割符
    $  awk '{print $1,$2,$5}' OFS=" $ "  log.txt
    ---------------------------------------------
    2 $ this $ test
    3 $ Are $ awk
    This's $ a $
    10 $ There $

## 使用正则，字符串匹配

    # 第二列包含"th"
    $ awk '$2 ~ /th/ {print $2,$4}' log.txt
    ---------------------------------------------
    this a

> **~ 表示模式开始。// 中是模式。**

    # 包含"re"
    $ awk '/re/ ' log.txt
    ---------------------------------------------
    3 Are you like awk
    10 There are orange,apple,mongo


### 忽略大小写

    $ awk 'BEGIN{IGNORECASE=1} /this/' log.txt
    ---------------------------------------------
    2 this is a test
    This's a test

### 模式取反

    $ awk '$2 !~ /th/ {print $2,$4}' log.txt
    ---------------------------------------------
    Are like
    a
    There orange,apple,mongo

    $ awk '!/th/ {print $2,$4}' log.txt
    ---------------------------------------------
    Are like
    a
    There orange,apple,mongo

## awk脚本

    #! /bin/awk -f
    # FileName: cal.awk

    # 运行前
    BEGIN {
        math = 0
        english = 0
        computer = 0

        printf "NAME     NO.     MATH     ENGLISH     COMPUTER     TOTAL\n"
        printf "-------------------------------------------------------------------------\n"
    }
    # 运行中
    {
        math+=$3
        english+=$4
        computer+=$5
        printf "%-6s %-6s %4d %8d %8d %8d\n",$1,$2,$3,$4,$5,$3+$4+$5
    }
    END {
        printf "-------------------------------------------------------------------------\n"
        printf " TOTAL:%10d %8d %8d \n",math,english,computer
        printf "AVERAGE:%10.2f %8.2f %8.2f\n",math/NR,english/NR,comoputer/NR
    }


## Some code

### 计算文件大小

    $ ls -l *.txt | awk '{sum+=$6} END {print sum}'
    --------------------------------------------------
    666581

### 从文件中找出长度大于80的行

    awk 'lenght>80' log.txt

### 打印九九乘法表

    seq 9 | sed 'H;g' | awk -v RS='' '{for(i=1;i<=NF;i++)printf("%dx%d=%d%s", i, NR, i*NR, i==NR?"\n":"\t")}'



#### 参考文章

[1]. 陈皓, [AWK 简明教程](http://coolshell.cn/articles/9070.html), 2013-2-17

[2]. 上善_若水, [正则表达式awk](http://blog.csdn.net/tolys/article/details/1807523), 2007-09-30
