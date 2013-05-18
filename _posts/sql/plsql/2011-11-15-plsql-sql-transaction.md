---
layout: post
title: SQL事务语句要点
description: 本文主要介绍一些关于SQL语法中有关事务操作的要点
category: pl/sql
tag: [pl/sql,sql]
keywords: [SQL事务,SQL要点,SQL语法]
---

1. 提交事务
    
        commit

    当执行`commit`后，会确认事务变化、结束事务、删除保存点、释放锁。以下情况会自动提交事务：
    
    + 执行`DDL`语句时；比如`create table`,`alter table`,`drop table`等
    + 执行`DCL`语句时；比如`grant`,`revoke`等。
    + 退出`SQL*Plus`时。

2. 保存点

        savepoint <point_name>
        exec dbms_transaction.savepoint('<point_name>');
    
    保存点用来记录事务过程中的某一个阶段。当调用`commit`提交事务后，保存将被删除。
        
3. 回滚事务

    3.1. 回滚部分事务
        
        rollback to <savepoint>
        exec dbms_transaction.rollback_savepoint('<savepoint>');
    
    3.2. 回滚全部事务
        
        rollback
        exec dbms_transaction.rollback
    
示例：

    SQL> insert table_name ...
    SQL> delete table_name ...
    SQL> savepoint A    -- exec dbms_transaction.savepoint('A')
    SQL> update table_name ...
    SQL> savepoint B    -- exec dbms_transaction.savepoint('B')
    SQL> delete table_name ...
    SQL> rollback to B -- 回滚到事务保存点B.或者exec dbms_transaction.rollback_savepoint('B')
    SQL> rollback to A -- 回滚到事务保存点A.或者exec dbms_transaction.rollback_savepoint('A')
    SQL> rollback -- 回滚所有事务.或者exec dbms_transaction.rollback
        
    
###只读事务

    set transaction read only
    exec dbms_transaction.read_only

只读事务只允许执行查询操作，而不允许执行任何DML操作的事物。使用只读事务可以获取特定的时间点的数据。

    -- 会话A
    SQL> set transaction read only; -- 1 设置当前事务为只读事务。
    SQL> select * from emp; -- 3 由于设置了当前事务为只读事务，此时其他会话对表的更新等操作都不会影响该查询SQL。该SQL获取的仍是其他会话更新前的数据
    
    -- 会话B
    SQL> update emp set sal = 3000 where ename = 'jack'; -- 2
    SQL> commit; 

假设会话A在1设置了顺序事务，会话B在2更新了数据，那么会话A在3查询时将会获取时间点在1的数据，而不是会话B在2更新后的数据


###顺序事务

    set transaction isolation level serializable

使用顺序事务时,除了具有只读事务的特点外,顺序事务允许执行DML操作.

    -- 会话A
    SQL> set transaction isolation level serializable; -- 1
    SQL> select sal from emp where ename = 'jack'; --3
    SQL> udpate dept set loc = 'beijing' where deptno = 6;
    SQL> commit;
		
    -- 会话B
    SQL> update emp set sal = 3000 where ename = 'jack'; --2
    SQL> commit;
			
假设会话A在1设置了顺序事务，会话B在2更新了数据，那么会话A在3查询时将会获取时间点在1的数据，而不是会话B在2更新后的数据
