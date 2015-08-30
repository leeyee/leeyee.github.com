---
layout: post
title: SQL查询语句要点
description: 本文主要介绍一些SQL语法中有查询操作的要点.主要涉及内外链接查询、合并查询等
category: SQL
tag: [pl/sql, sql]
keywords: [left join,union,union all,sql子查询]
---

* TOC
{:toc}

## 内连接和外连接
    select table1.column, table2.column
        from table1 [inner | left | rigth | full ] join table2 ON table1.column1 = table2.column2;

### 内连接

内连接用于返回满足连接条件的所有记录；默认情况下，在执行连接查询时如果没有指定任何连接操作符，那么这些连接查询都属于内连接。
	
    SQL> select a.dname,b.ename from department a, employee b where a.deptNo = b.deptNo;

或者

    SQL> select a.dame,b.ename from department a inner join employee b ON a.deptNo = b.deptNo;

<span class="label label-important"><em>NOTES：</em></span>

从Ooracle9i开始，如果主表主键列和从表外键列名称相同，那么还可以使用`natural join`关键字自动执行内连接

    SQL> select dname,ename from department natrual join employee;

### 外连接

外连接是内连接的扩展，不仅会返回满足连接条件的所有记录，还会返回不满足连接条件的记录。

#### 左外连接

左外连接通过`left [outer] join`实现。左外连接返回满足连接条件的记录，同时返回不满足条件的连接操作符左边表的其他行。

    SQL> select a.dname, b.ename from department a left join employee b on a.deptno = b.deptno;
        
		dname       ename
		------		-------
		test		king
		test 		king2
		test1				
		test2
			
#### 右外连接

右外连接通过`rigth [outer] join`实现。右外连接返回满足连接条件的记录，同时返回不满足条件的连接操作符右边表的其他行。

    SQL> select a.dname, b.ename from department a right join employee b on a.deptno = b.deptno;
        
		dname       ename
		------		-------
		test		king
		test 		king2
					king3
					king4
								
#### 完全外连接

完全外连接通过`full [outer] join`实现。完全外连接时左外连接和右外连接的结合。

    SQL> select a.dname, b.ename from department a full join employee b on a.deptno = b.deptno;
        
		dname       ename
		------		-------
		test		king
		test 		king2
		test1
		test2
					king3
					king4		
									
#### 使用`(+)`操作符
		
Oracle9i前使用`(+)`操作符。Oracle9i后建议使用`outer join`执行外连接。语法如下：

    select table1.column, table2.column 
        from table1, table2 
            where table1.column1(+) = table2.column2;
			
当使用`(+)`操作符时，应该将该操作符放在显示较少行（完全满足连接条件）的一端。
		
<span class="label label-important"><em>NOTES：</em></span>

1. `(+)`操作符只出现在`where`子句中，并且不能同`OUTER JOIN`语法同用;
2. 当使用`(+)`操作符执行外连接时，如果`where`子句中包含多个条件，则必须所有条件中都包含`(+)`操作符;
3. `(+)`操作符只适用于列，不能用在表达式上;
4. `(+)`操作符不能与`or`和`in`操作符一起使用;
5. `(+)`操作符只能实现左外、右外连接，不能实现完全连接;

        2.1 左外连接示例可写成
        SQL> select a.dname, b.ename from department a, employee b where a.deptno = b.deptno(+);
            
        2.2 右外连接示例可写成
        SQL> select a.dname, b.ename from department a, employee b where a.deptno(+) = b.deptno;
			
## 子查询

### 单行子查询

只返回一行数据的子查询语句。当在`where`中引用单行子查询时，可以使用单行比较符 =,>,<,>=,<=,<>
    
    SQL> select ename, salary, deptno from employee where deptno = 
    SQL> (select deptno from employee where ename = 'scott');

### 多行子查询

返回多行数据的子查询语句。当在`where`中引用多行子查询时，必须要使用如下多行比较符:
    
+ `in` : 匹配于子查询结果的任一个值即可
 
        SQL> select ename,job,sal,deptno from emp where job in
        SQL> (select distinct job from emp where deptno = 10);

+ `all` : 必须要符合子查询结果的所有值
        
        SQL> select ename,job,sal,deptno from emp where sal > all
        SQL> (select sal from emp where deptno = 10);

+ `any` : 只要符合子查询结果的任一个值即可
        
        SQL> select ename,job,sal,deptno from emp where sal > any
        SQL> (select sal from emp where deptno = 10);	

### 多列子查询

多列子查询返回多列数据的子查询语句。
    
+ 当多列子查询返回单行数据时，`where`中可以使用单行比较符；
+ 当多列子查询返回多行数据时，`where`中必须使用多行比较符；
+ 当使用子查询比较多列数据时，即可以成对比较也可以非成对比较。成对比较要求多个列的数据必须同时匹配，非成对则不要求。
	
	    -- 成对比较示例
		    SQL> select ename, sal, comm, deptno from emp
		    SQL> where (sal, nvl(comm,-1) in
		    SQL> (select sal, nvl(comm,-1) from emp where deptno = 10 );

        -- 非成对比较示例.执行非成对比较，应使用多个多行子查询实现
		    SQL> select ename, sal, comm, deptno from emp
		    SQL> where sal in
		    SQL> (select sal from emp where deptno = 30 )
		    SQL> and nvl(comm,-1) in
		    SQL> (select nvl(comm,-1) from emp where deptno = 30);

### 其他子查询

#### 相关子查询

相关子查询是指需要引用主查询表列的子查询语句，相关子查询是通过`exists` 谓词实现的。

    SQL> select ename, sal, job, depton from emp where exists
    SQL> (select 1 from dept where dept.depton = emp.depton );

<span class="label label-important"><em>NOTES：</em></span>
当使用`exists`谓词时，如果子查询存在返回结果，则条件为`TRUE`; 如果子查询没有返回结果，则条件为`FALSE`
		
#### 在from子句中使用子查询

`from`中的子查询会被当作视图对待，因此也被称作内嵌视图。

<span class="label label-important"><em>NOTES：</em></span>
`from`子句中使用子查询时，必须要给子查询指定别名

    SQL> select ename, job, sal, from emp, 
    SQL> (select deptno, avg(sal) avgsal from emp group by deptno) dept 
    SQL> where emp.deptno = deptno and sal > dept.avgsal;
	
#### 在`DML`语句中使用子查询
	
1. 在`insert`语句中使用子查询

        SQL> insert into customer(name,age) select name,age from employee where eno = 200;
        
2. 在`update`语句中使用子查询

        SQL> update emp set (sal, comm) = 
        SQL> (select sal, comm from emp where ename = 'jack')
        SQL> where job = (select job from emp where ename = 'jack');

3. 在`delete`语句中使用子查询

        SQL> delete emp where deptno = 
        SQL> (select deptno from dept where dname = 'jack');
	
4. 在`DDL`语句中使用子查询

    - 在`create table`语句中使用

        使用子查询可以在建立新表的同时复制表中的数据

            SQL> create table new_emp (id, name, sal, job) as
            SQL> select empno,ename,esal,ejob from emp;

    - 在`create view`中使用

        创建视图时必须要指定视图所对应的子查询语句
				
            SQL> create or replace view dept_10 as
            SQL> SELECT empno,ename,esal,ejob FROM emp ORDER BY empno;
            
    - 在`create materialized view`中使用
    
        创建[实体化视图][1]时，必须要指定实体化视图所对应的SQL语句，并且该SQL语句将来可用于查询重写。

            SQL> create materialized view summary_emp as
            SQL> select deptno, job, avg(sal) avasal, sum(sal) sumsal 
            SQL> from emp group by cube(deptno, job);
			
## 合并查询
    
    select 语句1 [union | union all | intersect | minus] select 语句2
	
1. 这些集合操作符具有相同的优先级。同时使用时会按照从左至右的方式引用这些集合操作符
2. 使用集合操作符时，必须确保不同查询的列个数和数据类型都要匹配
3. 对于`lob`、`varray`和嵌套表列来说，集合操作符无效
4. 对于`long`列来说，`union`、`intersect`、`minus`操作无效
5. 如果选择列表包含了表达式，则必须要为其指定列别名
	
### union

合并结果集，并会自动去掉结果集中的重复行，并且会以第一列的结果进行排序

    SQL> select ename,sal,job from emp where sal > 2500
    SQL> union
    SQL> select ename,sal,job from emp where job = 'manager';
    
###  union all

合并结果集，但不会去掉结果集中的重复行，也不会进行任何排序，只是简单的做合并
    
    SQL> select ename,sal,job from emp where sal > 2500
    SQL> union all
    SQL> select ename,sal,job from emp where job = 'manager';
    
### intersect

获取两个结果集的交集，并以第一列的结果进行排序

    SQL> select ename,sal,job from emp where sal > 2500
    SQL> intersect
    SQL> select ename,sal,job from emp where job = 'manager';

### minus

获取两个结果集的差集。只显示在第一个结果集中存在，在第二结果集中不存在的数据，并以第一列的结果进行排序

    SQL> select ename,sal,job from emp where sal > 2500
    SQL> minus
    SQL> select ename,sal,job from emp where job = 'manager';
			
## 其他复杂查询

### 层次查询

当表具有层次结构时，使用层次查询可以更直观的显示数据结果，并显示其数据之间的层次关系

    select 语句 start with condition connect by condition
    
+ `start with`: 用于指定层次查询的根行。
+ `connect by`: 用户指定父行和子行之间的关系。

在condition表达式中，必须使用`prior`引用父行。语法如下：
			 	
    ... prior expr = expr 或者 ... expr = prior expr
		
假如emp表具层次结构，其中empno列对应雇员号，而mgr列对应管理者编号。那么通过层次查询，可以显示雇员之间的上下级关系。
	
    SQL> col ename format a15
	SQL> col job format a15
	SQL> select lpad(' ', 3 * (level-1))||ename ename,
	SQL> lpad(' ', 3 * (level-1))||job job from emp
	SQL> where job <> 'clean' start with mgr is null
	SQL> connect by mgr = prior empno;

### case表达式

为了在 SQL 语句中使用 `if..then..else`语法，可以使用 `case`表达式。当使用`case`表达式时，可以使用 `where`子句指定条件语句。

    SQL> select ename, sal,
    SQL> case when sal > 3000 then 3
	SQL> when sal >  2000 then 2
	SQL> else 1 end grade
	SQL> from emp where deptno = 10;
		
### 使用with语句重用子查询

Oracle9i开始，通过`with`子句可以给子查询指定一个名称，并且使得在一条语句中可以完成所有任务，避免使用临时表

    SQL> with summary as (
	SQL> 	select dname, sum(sal) as dept_total from emp,dept
	SQL> 	where emp.deptno = dept.deptno group by dname
	SQL> )
	SQL> select dname, dept_total from summary where dept_total > 
	SQL> ( select sum(dept_total) * 1/3 from summary);
		
### 倒叙查询

默认情况下执行查询操作只能看到最近提交的数据。从Oracle9i开始，通过使用倒叙查询([Flashback Query][2])特征，可以查看到过去某个时间点所提交的数据。

<span class="label label-important"><em>NOTES：</em></span>
使用倒叙查询，要求数据库必须采用`undo`管理方式，并且初始化参数`undo_retention`限制了`undo`数据的保留时间。

1. 查看当前数据

        SQL> select ename, sal from emp where ename = 'jack';
	
2. 查看历史数据

    执行倒叙查询时，通过在`from`子句后指定`as of`子句可以查看过去的历史数据。`as of`中既可以指定时间，也可以指定SCN.

    <span class="label label-important"><em>NOTES：</em></span>
    使用倒叙查询只能看到5分钟之前变化数据。
	
        SQL> select ename, sal from emp as of timestamp to_timestamp('2011-10-12 16:00:00','yyyy-MM-dd hh24:mi:ss')
        SQL> where ename = 'jack';

3. 使用`dbms_flashback`包获取特定`SCN`的数据

        SQL> exec dbms_flashback.enable_at_system_change_number(717402);
		SQL> select sal from emp where ename = 'jack';
		SQL> exec dbms_flashback.disable;
		SQL> select sal from emp where ename = 'jack';
        

[1]: http://docs.oracle.com/cd/E11882_01/server.112/e17118/statements_6002.htm "materialized view" 
[2]: http://docs.oracle.com/cd/E11882_01/appdev.112/e25518/adfns_flashback.htm "Flashback Query"