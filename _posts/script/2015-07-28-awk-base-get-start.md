---
layout: post
title: awk 入门
description: 本文主要介绍一些awk的入门语法及相关示例。包括awk基本语法及基本参数，内建参数的使用，awk脚本等相关基础入门内容
category: 脚本语言
tag: [awk]
keywords: [awk入门,awk内置参数]
---
[toc]

[awk]是一款强大的文本分析工具。[awk] 按行解析数据，并对其进行分割处理。下面是一些[awk]的入门语法与示例。

首先我们使用以下的文件片段演示。文件片段[^1]内容如下：

>The Lost Love
William Wordsworth
She dwelt among the untrodden ways beside the springs of dove.
A maid whom there were none to praise, and very few to love.
A violet by a mossy stone, half hidden from the eye!
Fair as a star, when only one is shining in the sky.
She lived unknown, and few could know, when lucy ceased to be.
But she is in her grave, and oh, the difference to me!

## 常用命令

### 1. 使用默认分割符（空格或者TAB）分割.

	awk '{print NR,$1}' test.txt

输出：

>1 The
2 William
3 She
4 A
5 A
6 Fair
7 She
8 But

**说明**：
: *print*：  输出，没有指定输出连接符时，默认为空格；
: *NR*： [awk]内建变量, 表示当前记录数；
: *\$n*： 根据空格或者TAB分割后的第n个字符串，从1开始。特殊的  **\$0** 表示所有未被分割的行；

### 2. 使用 **-F** 指定分割符

	awk -F, 'BEGIN{OFS="."} {print NR,$1} END{print "-- End --"}' test.txt

输出：

>1.The Lost Love
2.William Wordsworth
3.She dwelt among the untrodden ways beside the springs of dove.
4.A maid whom there were none to praise
5.A violet by a mossy stone
6.Fair as a star
7.She lived unknown
8.But she is in her grave
-- End --

**说明**：

: *-F*： 指定分割字符。如果有多个分割符可使用 `-F '[ ,]'`;
: *-F*： 相当于[awk]内置变量 *FS* .示例语句可与下面的命令进行替换

		awk 'BEGIN{FS=","} {print NR,$2}' test.txt

: *BEGIN*：语法片段，表示解析开始时的处理逻辑；
: *END*：语法片段，表示解析完成后的处理逻辑；
: *OFS*：内置函数，表示输出使用的分割符。默认为空格

### 3.  使用 **-v** 设置变量

	awk -va=' end' -vb=1 '{print NR+1,$1a}' test.txt

输出：

>2 The end
3 William end
4 She end
5 A end
6 A end
7 Fair end
8 She end
9 But end

**说明**：

: *-v*： 指定变量名，可以有多个；
: [awk]字符串连接使用 **.** 、空格或者直接进行连接即可（`$1a `等价于`$1.a`等价于 `$1  a`）；数字类型直接使用 **+** ;

### 4. 使用 **-f** 读取 [awk] 脚本

当查询条件比较复杂时，可以将查询的复杂语句写入单独的文件进行维护，这样能专注于查询逻辑的处理，也易于维护。 然后使用  *-f* 参数对语句脚本进行读取。

	 awk -f a.awk test.txt

a.awk 文件内容如下：

```shell
BEGIN {
	a = " end"
	b = 1
}
{
	print NR+1,$1a
}
```
输出：

>2 The end
3 William end
4 She end
5 A end
6 A end
7 Fair end
8 She end
9 But end

## 基本运算符

### 运算符说明

|运算符|描述|
|------|----:|
|= += -= *= /= %= ^= **=|赋值|
|?:|条件表达式|
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

###举例

1. 获取第四行及第五行以后的行

		awk '(NR>5 || NR==4) {print NR,$0}' test.txt

	输出：

	>4 A maid whom there were none to praise, and very few to love.
6 Fair as a star, when only one is shining in the sky.
7 She lived unknown, and few could know, when lucy ceased to be.
8 But she is in her grave, and oh, the difference to me!

2. 获取按空格分割后第一个分组为‘She'并且第二不分组不等于‘dwelt’的行

		awk '($1=="She" && $2 !="dwelt") {print NR,$0}' test.txt

	输出：

	>7 She lived unknown, and few could know, when lucy ceased to be.

##内置变量

### 变量说明

|变量|描述|
|-------|------:|
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

###举例

1. 显示相关内置参数

		awk '{print FILENAME,ARGC,FNR,FS,NF,NR,OFS} BEGIN{OFS=":"}' test.txt

	输出：

	>test.txt:2:1: :3:1::
test.txt:2:2: :2:2::
test.txt:2:3: :11:3::
test.txt:2:4: :13:4::
test.txt:2:5: :11:5::
test.txt:2:6: :12:6::
test.txt:2:7: :12:7::
test.txt:2:8: :12:8::



[awk]:https://zh.wikipedia.org/wiki/Awk
[^1]: 英文诗歌《失去的爱》，中文翻译如下：

	>失去的爱
    【英】威廉·华兹华斯
    她居住在白鸽泉水的旁边，无人来往的路径通往四面。
    一位姑娘未曾获得称赞，也很少有人爱怜。
    苔藓石旁的一株紫罗兰，半藏着逃离人们的视线！
    美丽得如同天上的孤星，一颗唯一的星清辉闪闪。
    她生无人知，死也无人唁，不知她何时离了人间。
    但她安睡在墓中，哦，可怜，对于我意义全然不同。