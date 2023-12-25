---
title: SQL增删改语句要点
date: 2011-11-14
description: 本文主要介绍一些SQL语法中有关对数据进行插入、更新及删除操作的要点
categories: "SQL"
tags: ["pl/sql"]
slug: 'plsql-sql-cud'
aliases: ['/blog/2011/11/14/plsql-sql-cud.html']
---

## SQL分类

1. 数据查询语句（`select` 语句）：用于检索数据库数据

2. 数据操纵语言（`Data Manipulation Language`,`DML`）：用于改变数据库数据,包括`insert`、`update`和`delete`三条语句

3. 事物控制语句（`Transaction Contorl Language`,`TCL`）：用户维护数据库的一致性,包括`commit`、`rollback`和`savepoint`三条语句。

    3.1. `commit`确认已经进行的数据库更改
    
    3.2. `rollback`取消已经进行的数据库更改
    
    3.3. `savepoint`设置保存点，以取消部分数据库改变
    
4. 数据定义语句（`Data Definition Language`,`DDL`）：用于建立、修改和删除数据库对象。比如`create table` 、`alter table`和`drop table`。`DDL`语句会自动提交事务

5. 数据库控制语言（`Data Control Language`,`DCL`）：用于执行权限授予和收回操作，包括`grant`和`revoke`两条命令。`DCL`语句会自动提交事务

	 5.1. `grant`命令用户给用户或角色授予权限
     
	 5.2. `revoke`命令用于收回用户或角色所具有的权限。

## 子查询插入数据

1. 使用子查询插入数据
    
        insert into customer(name,age) select name,age from employee where eno = 200;
    
2. 使用子查询执行直接装载

        insert /*+append */ into customer(name,age) select name,age from employee where eno = 200;

_**NOTES：**_

+ **以上两条语句的执行结果一样，但2使用了<code>/*+append */</code>来表示采用直接装载方式**;
+ **当要装载大批量数据是，采用2方法装载数据的速度要远远优于1**;


## 多表插入

_**NOTES：**_ **Oracle9i后可以使用!**

    insert all insert_into_clause [value_clause] subquery;
    insert coditional_insert_clause subquery;

+ insert_into_clause 用于指定`INSERT`语句；
+ value_clause 用于指定值子句；
+ subquery 用于指定提供数据的子查询；
+ conditional_insert_clause 用于指定`INSERT`条件子句

<p />

1. 使用`all`操作符执行多表插入
    
    1.1. 不指定插入列
    
        insert all
        	when cid = 1 then into customer1
			when age > 20 then into customer2
			else into customer3
		select * from customer;
            
    1.2. 指定插入列
    
        insert all
    		when cid = 1 then into customer1(cid,name,age)
			when age > 20 then into customer2(cid,name,age)
			else into customer3(cid,name,age)
		select cid,name,age from customer;

2. 使用`first`操作符执行多表插入

当使用`first`操作符执行多表插入时，如果数据已经满足先前条件，并且已经被插入到某表，那么该行数据在后续插入中将不会被再次使用。

    insert first
        when cid = 1 then into customer1
        -- 如果age>20的数据中包含cid=1的数据，那么该条数据将不会被再次插入customer2
        when age > 20 then into customer2
        else into customer3
	select * from customer;

## 截断表(`truncate table`)
 
    truncate table <table_name>;

与`delete`的区别:

1. `delete`删除表的所有数据时，不会释放表所占用的空间。
2. `truncate`删除表时，不仅会删除表的所有数据，还会释放表所占用空间
3. `delete`操作可以回滚，而`truncate`则无法回滚
