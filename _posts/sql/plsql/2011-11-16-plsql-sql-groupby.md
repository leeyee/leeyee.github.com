---
layout: post
title: SQL分组语句要点
description: 本文主要介绍一些SQL语法中有关分组操作的要点
category: SQL
tag: [pl/sql]
---

* TOC
{:toc}


### 常用分组函数：

1. `max([all|distinct]expr)` : 获取列或表达式的最大值，适合任何数据类型；
2. `min([all|distinct]expr)` : 获取列或表达式的最小值，适合任何数据类型;
3. `avg([all|distinct]expr)` : 获取列或表达式的平均值，只适合数字类型;
4. `sum([all|distinct]expr)` : 获取列或表达式的总和，只适合数字类型;
5. `count([all|distinct]expr)` : 获取总行数;
6. `grouping` : 用于确定统计结果是否用到了特定列。如果返回0，则表示统计结果使用了该列；如果返回1，则表示统计结果未使用该列
    
		SQL> SELECT name,address ,SUM(money),GROUPING(name),GROUPING(address) FROM customer GROUP BY CUBE(name,address);
		NAME                         ADDRESS  COUNT(*) SUM(MONEY) GROUPING(name)  GROUPING(address)
		---------------------------- ------- ---------- --------- --------------  -----------------
												4		162.26		1				1
									a		 	1		32			1				0
									abcdefg		2		118.03		1				0
									152号大街	1		12.23		1				0
		oxcow									2		118.03		0				1
		oxcow						abcdefg		2		118.03		0				0
		leeyee									2		44.23		0				1
		leeyee						a			1		32			0				0
		leeyee						152号大街	1		12.23		0				0
	
7. `dense_rank(expr1,expr2,..) within group (order by expr1,expr2,..)` : 该函数用于返回特定数据在一组行数据中的等级。关于[rank][],[dense_rank][]的具体说明请[查看](http://blog.csdn.net/baoqiangwang/article/details/4712481)
	
		SQL> select dense_rank(5000) within group (order by sal) rank from emp;
				RANK
				-----
				12

8. `first` : **Oracle9i新增函数**,获取首个排序等级，然后使用分组汇总函数汇总。**该函数不能单独使用，必须与其他分组函数结合使用**。

        -- 年龄最大的一组人中工资最高的
        SQL> select max(money) keep (dense_rank first order by age desc) from customer;

9. `last` : **Oracle9i新增函数**,获取最后一个排序等级，然后使用分组汇总函数汇总。**该函数不能单独使用，必须与其他分组函数结合使用**。
	
        -- 年龄最小的一组人中工资最高的
        SQL> select name, max(money) keep (dense_rank last order by age desc) from customer;


<span class="label label-important"><em>NOTES：</em></span>

+ 分组函数只能出现在选择列表、`order by`和`having`子句中；
+ 使用分组函数时，除`count(*)`外，其他分组函数都会忽略`null`行；
+ `select`时，列表同时包含列、表达式和分组函数，那么列、表达式必须出现在`group by`子句中；
+ 使用分组函数时，分组函数中可以指定`all`和`distinct`其中`all`为默认选项；


### 横向小计统计(`rollup`)
	
`rollup`操作符在生成原有统计结果的基础上，还会生成横向小计结果.
	SQL> SELECT name,address ,SUM(money) FROM customer GROUP BY ROLLUP(name,address);
		NAME                         ADDRESS  COUNT(*) SUM(MONEY)
		---------------------------- ------- ---------- ----------
		oxcow						abcdefg			2				118.03
		oxcow										2				118.03
		leeyee										1				32
		leeyee						152号大街		1				12.23
		leeyee										2				44.23
													4				162.26
### 纵向小计统计(`cube`)

`cube`操作符在生成原有统计结果的基础上，还会生成横向小计、纵向小计结果.

	SQL> SELECT name,address ,SUM(money) FROM customer GROUP BY CUBE(name,address);
		NAME                         ADDRESS  COUNT(*) SUM(MONEY)
		---------------------------- ------- ---------- ----------
												4			162.26
										a		1			32
									abcdefg		2			118.03
									152号大街	1				12.23
		oxcow									2			118.03
		oxcow						abcdefg		2			118.03
		leeyee									2			44.23
		leeyee					a				1			32
		leeyee						152号大街	1				12.23

### 分组合并`grouping sets`

<span class="label label-important"><em>NOTES：</em></span>**Oracle9i后可以使用**

`grouping sets`操作符可以合并多个分组结果.

	SQL> SELECT name, COUNT(*) FROM customer GROUP BY name;
		NAME                                       COUNT(*)
		---------------------------------------- ----------
		leeyee                                            2
		oxcow                                             2
		
	SQL> SELECT address,COUNT(*) FROM customer GROUP BY address;
		ADDRESS                                   COUNT(*)
		---------------------------------------- ----------
		a											1
		abcdefg										2
		152号大街									1
		
	SQL> SELECT name,address,COUNT(*) FROM CUSTOMER GROUP BY GROUPING SETS(name,address);
		NAME 		ADDRESS      COUNT(*)
		-----		---------    ----------  
		leeyee							2
		oxcow							2
					a					1
					abcdefg				2
					152号大街				1

[rank]: http://docs.oracle.com/cd/B19306_01/server.102/b14200/functions123.htm "rank"
[dense_rank]: http://docs.oracle.com/cd/B19306_01/server.102/b14200/functions043.htm "dense_rank"