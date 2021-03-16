---
layout: post
title: SQL Server 主键声明及自增操作
description: oracle, mysql, sqlserver主键的声明及自增操作
category: database
tag: [database]
---

* TOC
{:toc}


在看*SQL Server*主键声明及自增操作前先复习下*Oracle*和*Mysql*的主键操作


## *Oracle* 主键

表声明语句

    CREATE TABLE demo_user(
        user_id    NUMBER(10)      not null,
        name       VARCHAR2(60)    not null,
        constraint PK_DMEO_USER primary key (user_id)
    );

自增主键依赖`SEQUENCE`

    CREATE SEQUENCE SEQ_DEMO_USER_ID INCREMENT BY 1 START WITH 1;

对应操作语句为,

    SELECT SEQ_DEMO_USER_ID.currval from dual;
    
    SELECT SEQ_DEMO_USER_ID.nextval from dual;
    
    INSERT INTO TABLE(user_id, name) VALUES(SEQ_DEMO_USER_ID.nextval, 'demo');
 
Java实体类声明，

    @Entity
    @Table(name = "demo_user")
    @SequenceGenerator(name = "SEQ_USER_ID", sequenceName = "SEQ_DEMO_USER_ID", allocationSize = 1)
    public class UserEntity{
        
        @Id
	    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_USER_ID")
	    @Column(name = "user_id")
        private Long id;
        
    }

## *Mysql* 主键

*Mysql* 自增主键由数据库自己维护，只要声明主键 `AUTO_INCREMENT` 即可

    CREATE TABLE demo_user(
        user_id  INT(6)  NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT 'primary key',
        name VARCHAR(300)
    )

对应操作语句为,

    INSERT INTO(name) VALUES('demo');
    
Java实体类声明，

    @Entity
    @Table(name = "demo_user")
    public class UserEntity{
        
        @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    @Column(name = "user_id")
        private Long id;
        
    }
    

## *SQL server* 主键

### `IDENTITY` 实现自增

设置表字段`IDENTITY(seed, increment)`

    CREATE TABLE demo_user(
        user_id  BIGINT  IDENTITY(1,1)  NOT NULL,
        name NVARCHAR(300),
        CONSTRAINT pk_demo_user PRIMARY KEY (user_id),
    )
    
对应操作语句为,

    -- 确保该功能开关是开着的
    SET IDENTITY_INSERT demo_user ON;
    
    INSERT INTO(name) VALUES('demo');
    
    -- 操作完成后关闭该功能
    SET IDENTITY_INSERT demo_user OFF;
    
Java实体类声明与*Mysql*相同。
    
### `SEQUENCE` 实现自增

声明语句,

    CREATE SEQUENCE SEQ_DEMO_USER_ID START WITH 1 INCREMENT BY 1;
    
    CREATE SEQUENCE SEQ_DEMO_USER_ID AS int   
        START WITH 125  
        INCREMENT BY 25  
        MINVALUE 100  
        MAXVALUE 200  
        CYCLE  -- 超过MAXVALUE后，从START再次开始
        CACHE 3;
        
    -- throw error when the sequence exceeds 200
    ALTER SEQUENCE SEQ_DEMO_USER_ID
        RESTART WITH 100  -- 从100重新开始
        INCREMENT BY 50  
        MINVALUE 50  
        MAXVALUE 200  
        NO CYCLE  
        NO CACHE;  
    
对应操作语句为,

    SELECT NEXT VALUE FOR SEQ_DEMO_USER_ID;
    
    INSERT INTO(user_id, name) VALUES(NEXT VALUE FOR SEQ_DEMO_USER_ID, 'demo');
    
    DROP SEQUENCE SEQ_DEMO_USER_ID;
    
    
## Reference

[Oracle CREATE SEQUENCE](https://docs.oracle.com/cd/B28359_01/server.111/b28286/statements_6015.htm#SQLRF01314)

[NEXT VALUE FOR (Transact-SQL)](https://docs.microsoft.com/en-us/sql/t-sql/functions/next-value-for-transact-sql?view=sql-server-ver15)

[ALTER SEQUENCE (Transact-SQL)](https://docs.microsoft.com/en-us/sql/t-sql/statements/alter-sequence-transact-sql?view=sql-server-ver15)