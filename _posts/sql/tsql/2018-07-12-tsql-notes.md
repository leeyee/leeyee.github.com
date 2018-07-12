---
layout: post
title: T-SQL笔记
description: T-SQL笔记。主要记录一些没有特别注意到的语法特性和使用细节
category: SQL
tag: [t-sql]
---

* TOC
{:toc}


> T-SQL即Transact-SQL,是SQL在 Microsoft SQL Server上的增强版。

**主要记录一些没有特别注意到的语法特性和使用细节**

## 数据表相关

数据库表创建后，
- *sysobjects* 系统表中记录表的名称、对象ID、表类型、创建时间集所有者信；
- *syscolumns* 系统表中记录字段ID、字段数据类型及字段长度等信息；。。。

### 表结构查看

可通过系统存储过程 `sp_help` 查看已有表结构信息

    [EXECUTE] sp_help [table_name]

**Tips：**
- 如果省略 *table_name* 则显示该数据库中所有表对象信息；
- `EXECUTE`可简写为`EXEC`;
- 如果该语句位于批处理的第一行时，可省略关键字`EXECUTE`

### 表结构修改

    -- 添加列
    ALTER TABLE <table_name>
        ADD <column_name> <date_type>[(length)] [NULL | NOT NULL]
        
    -- 修改列 
    ALTER TABLE <table_name>
        ALTER COLUMN <column_name> <date_type>[(length)] [NULL | NOT NULL]
        
    -- 删除列
    ALTER TABLE <table_name>
        DROP COLUMN <column_name>

- 删除前需要先删除基于该列的索引和约束

#### 修改列名和表名

    EXEC sp_rename <origin_object_name>, <new_object_name>

**Demo:**

    -- 将 user 表重命名为 new_user
    EXEC sp_rename 'user', 'new_user'
    
    -- 将 user 表的列名 name 重命名为 name_zh
    EXEC sp_rename 'user.name', 'name_zh'
    
#### 添加和删除主键/唯一约束

    ALTER TABLE <table_name>
        ADD [CONSTRAINT 约束名] [PRIMARY KEY | UNIQUE] (column_name 1[,....n])
        
    ALTER TABLE <table_name> DROP CONSTRAINT 约束名
        
**Demo:**

    ALTER TABLE user
        ADD CONSTRAINT pk_name_age PRIMARY KEY(name, age);
        
    ALTER TABLE user
        ADD CONSTRAINT uniq_idcard UNIQUE(id_card);
        
    ALTER TABLE user
        DROP CONSTRAINT pk_name_age;
        
    ALTER TABLE user
        DROP CONSTRAINT uniq_idcard;

---

## 索引

### 索引基本原则

- `PRIMARY KEY` 字段。数据库默认建立；
- `UNIQUE` 字段。数据库默认建立；
- `FOREIGN KEY` 字段；
- 经常用来搜索的字段；
- 经常用作排序的字段；
- 只有两个或很少几个值的字段，比如性别字段，不建议建；
- 表数据行少的，不建议建。

### 索引分类

#### 聚集索引和非聚集索引

**聚集索引（Clustered Index）:** 对物理数据页中的数据按列顺序排序，然后重新存储到磁盘上

- 确定表中数据的物理顺序
- 一个表只能有一个聚集索引
- 聚集索引的大小是表大小的5%
- 聚集索引不适合用于频繁更改的列
- 建立主键约束时，如果表没有聚集索引，那么会用主键作为关键字建立聚集索引
- 聚集索引使用的列越少越好

**非聚集索引（NonClustered Index）:** 虽包含按生序排序的键值，但不影响表中数据记录的实际排列顺序。对表进行下列操作时会重建该表现存非聚集索引：

- 删除聚集索引
- 创建聚集索引
- 更改聚集索引的键值

#### 唯一索引和非唯一索引

**唯一索引：**

- 被索引列任意两行的数据不能相同，包括不能有两个空值的NULL
- 自动为UNIQUE约束列创建唯一索引
- 可能导致INSERT、UPDATE语句执行失败

#### 单列索引和多列索引(复合索引)

复合索引：

1. 限定：
    - 最多16个字段，且字段总长不超过900B
    - 字段必须来自同一个表
2. 原则：
    - 识别高的字段或返回较低百分比数据记录的字段放前面
    - WHERE条件使用第一个字段时，该索引才会被使用

### 索引信息查看

    EXEC sp_helpindex <table_name>
    
### 索引分析

显示预估查询计划

    SET SHOWPLAN_ALL ON|OFF
    -- or SET SHOWPLAN_TEXT ON|OFF
    GO
    SELECT * FROM user WHERE id = 1;
    GO

显示实际查询计划

    SET STATISTICS PROFILE ON|OFF


## SELECT INTO语句

    SELECT <字段列表>  [INTO 新表] FROM <表/视图>...

使用该方式可以直接将查询列数据存放在新表中，而不用提前声明该新表。

**Tips:**

1. 新表不能存在
2. 新表中的列和行是基于查询结果集的
3. 执行该语句时必须有 *CREATE TABLE* 权限
4. 如果新表名以 **#** 开头，则生成临时表

**Demos**

    -- 创建不存在的新表
    SELECT name, age
        INTO new_user
        FROM old_user old
        WHERE old.id > 100
        ORDER BY old.name DESC;
        
    -- 创建临时表
    SELECT name, age
        INTO #temp_user
        FROM old_user old;

    -- 查询新建表或临时表
    SELECT * FROM new_user;
    SELECT * FROM #temp_user;
    
如果想创建一个和原表一样的空数据表，可以使用下面的方式

    -- WHERE返回false即可，目的只是为了保留表结构
    SELECT *
        INTO same_empty_user
        FROM old_user
        WHERE 1 > 2
    
## SELECT TOP语句

    SELECT [TOP n | TOP n PERCENT] 列名1 [,...n]
        FROM <表/视图> ... 

1. *TOP n* 返回最前面n行数据
2. *TOP n PERCENT* 返回最前面的n%行

**Demos:**
    
    /**
        if table user have 100 records and id from 1 to 120.
        1. TOP 10 return 10 records and id from 1 to 10
        2. TOP 10 PRECENT return 12 records and id from 1 to 12.
    */
    SELECT TOP 10 * FROM user ORDER BY id;
    SELECT TOP 10 PRECENT * FROM user ORDER BY id;
    
## NOT BETWEEN... AND ...语句

该语句查询时**不包含参数边界**.

## 空值的查询

涉及空值的查询时，只能使用`IS NULL`语句，而不能使用 *=* 操作符

## 多表连接查询

### 交叉连接

    SELECT 列名列表 FROM 表名1 CROSS JOIN 表名2
    -- or
    SELECT 列名列表 FROM 表名1, 表名2
    
也叫**非限定连接**（*笛卡尔乘积*）

### 内连接 INNER JOIN

    SELECT 列名列表 FROM 表1 [INNER] JOIN 表2 ON 表1.列名 = 表2.列名
    -- or
    SELECT 列名列表 FROM 表1, 表2 WHERE 表1.列名 = 表2.列名
    
也叫**自然连接**。连接条件通常是**主外键**方式，只获取满足条件的数据

### 外连接

以关联的一方（LEFT or RIGHT）或者两方（FULL）作为基础表进行查询，不匹配的部分参照主关联方进行数据补齐。

#### 左外连接 LEFT JOIN
    
    SELECT 列名列表 FROM 表1 LEFT JOIN 表2 ON 表1.列名 = 表2.列名
    
以 *表1* 作为基础表关联 *表2* 。

#### 右外连接 RIGHT JOIN

    SELECT 列名列表 FROM 表1 RIGHT JOIN 表2 ON 表1.列名 = 表2.列名
    
以 *表2* 作为基础表关联 *表1* 。

> 不难发现，右连接 *表1* 和 *表2* 与左连接 *表2* 和 *表1* 是等价的。

#### 全外连接 FULL OUTER JOIN

    SELECT 列名列表 FROM 表1 FULL [OUTER] JOIN 表2 ON 表1.列名 = 表2.列名
    
*表1* 关联 *表2*, 并将*表1* 和 *表2* 多余的数据也返回 

### 自连接

所谓自连接也就是自己关联自己进行关联查询。

## UNION 语句
    
    查询语句1
        UNION [ALL]
    查询语句2

1. UNION 去重顺序连接两个结果集
1. UNION ALL 不去重顺序连接两个结果集
1. 要求结果集返回列数相同，并且相同列数据类型相同。若数据类型长度不同，则以最长的为准
1. *最终结果集的字段名来自第一个查询语句*
1. *最后一个查询语句的`ORDER BY`子句对最终结果集进行排序，同时排序字段只能使用第一个结果集返回的字段*

## UPDATE结合JOIN语句

    UPDATE table_alias
    SET table_alias.column = ? [, table_alias.column = ?]
    FROM table [AS] table_alias
        [INNER | LEFT | RIGHT ] JOIN ref_table [AS] ref_alias ON table_alias.column = ref_alias.column ... 
    [WHERE]
    
**Demo:**

    UPDATE main
		SET main.last_name = pr.last_name, main.first_name = pr.first_name
	FROM user main
		INNER JOIN person pr ON pr.person_id = main.user_id
	WHERE main.last_name IS NULL AND main.first_name IS NULL;
	
## DELETE结合JOIN语句

    DElETE table_alias
	FROM table [AS] table_alias
	    [INNER | LEFT | RIGHT ] JOIN ref_table [AS] ref_alias ON table_alias.column = ref_alias.column ...
	[WHERE]
    
**Demo:**    
    
    DElETE main
	FROM user main
	    INNER JOIN person pr ON pr.person_id = main.user_id
	WHERE main.last_name IS NULL;
	
## DELETE TABLE 和 TRUNCATE TABLE

- `TRUNCAT` 删除速度快于 `DELETE`, 但删除数据不可被恢复（只将对表数据页面的释放操作记录到日志）；
- `DELETE` 操作在删除每一行时都把删除操作记录写入日志，因而可以通过事务回滚；

## 使用CROSS APPLY 和 CHARINDEX 函数替代LIKE进行模糊查询

常规LIKE模糊匹配

    SELECT * FROM user WHERE name like '%jack%'
    
可替换为

    SELECT * 
    FROM user
    CROSS APPLY( SELECT CHARINDEX('jack',name) name_index ) name_criteria
    WHERE name_criteria.name_index > 0
    
   
## T-SQL语法    

### 批处理

> 批处理由多条语句的组合。 GO 语句表示一个批处理的结束

- `GO` 语句必须单独存在，不能含其他SQL语句和注释。
- 批处理中有语法错误，则整改批处理不能被编译和执行；
- 批处理中有语句执行错误，则只影响该条语句，其他语句不受影响；

批处理语句规则：

- 大多数 `CREATE` 命令可以在单个批处理命令中执行，但 `CREATE [ DATABASE | TABEL |  INDEX ]` 除外;
- 调用存储过程，如果不是比处理中的第一个语句，则必须加上 `EXECUTE | EXEC` ;
- 给表字段定义一个 *CHECK* 约束后，批处理未结束前不能使用（声明后不能立即使用）；
- 不能修改表字段名后，立即在该批处理中使用新字段名；
- 绑定规则和默认值到表的字段或自定义数据类型后，不能在同一个批处理中使用；

> 字符串拼接使用 + 号。当有`NULL`字符时，则整个表达式返回NULL.表达式`SELECT 'a' + NULL `将返回 `NULL`

### 流程控制语句


```
    /* BEGIN...END 将多条语句组合成语句块，并将其视作一个单一语句 */
    IF @name IS NOT NULL
        BEGIN
            UPDATE user SET name = @name WHERE id = 1
            SELECT * FROM user
        END
    
    /* IF 语句可嵌套使用，嵌套层数没有限制 */
    IF @name = 'test'
        PRINT 'this is a test'
    ELSE IF @name = 'jack' AND age > 20
        PRINT 'hello young man, jack!'
    ELSE
        PRING 'hello!'
    
    /* CASE 简单表达式 */
    CASE gender
        WHEN 0 THEN 'Female'
        WHEN 1 THEN 'Male'
        -- ELSE 'Unknown'
    END AS Gender_Desc
    
    /* 
        CASE 搜索表达式.
        ELSE可以省，此时如果没有匹配的则返回NULL
    */
    CASE 
        WHEN gender = 0 THEN 'Female'
        WHEN gender = 1 THEN 'Male'
        ELSE 'Unknown'
    END AS Gender_Desc
    
```

#### WAITFOR 延迟执行语句

    WAITFOR {DELAY 'time' | TIME 'time'}

1. DELAY 延迟执行
2. TIME 指定时间执行
3. 上限24小时。

```
    -- 等待10s执行查询语句
    WAITFOR DELAY '00:00:10'
    SELECT * FROM user
    
    -- 指定时间执行查询语句
    WAITFOR TIME '10:00:00'
    SELECT * FROM user

```   

#### WHILE语句

    WHILE 逻辑表达式
        BEGIN
            {语句或语句块1}
            [CONTINUE]
            {语句或语句块2}
            [BREAK]
            {语句或语句块3}
        END
    
表达式为真时循环执行。

    /* Output:
        S0001: 1
        S0001: 2 between 2 and 5
        S0001: 3 between 2 and 5
        S0001: 4 between 2 and 5
        S0001: 5 between 2 and 5
        S0001: num eq 6. the end
        S0001: 6
    */
    DECLARE @num TINYINT = 1
    WHILE 1 = 1
        BEGIN
            IF @num < 2
                BEGIN
                    PRINT @num
                    SET @num += 1
                    CONTINUE
                END
            IF @num = 6
                BEGIN
                    PRINT 'num eq 6. the end'
                    BREAK
                END
            PRINT CONVERT(NVARCHAR(10), @num)  + ' between 2 and 5'
            SET @num += 1
        END
    PRINT @num

## 存储过程

- 系统存储过程通常以 ***sp_*** 开头
- 存储过程名以 ***#*** 开头，则该存储过程为**本地临时存储过程**，并被存放在数据库 **tempdb**中
- 存储过程名以 ***##*** 开头，则该存储过程为**全局临时存储过程**，并被存放在数据库 **tempdb**中
- 存储过程参数最多 ***2100*** 个
- SQL Server中存储过程最大 ***128MB***

利用系统表 **SYSOBJECTS** 或系统函数 **Object_Id** 检验存储过程是否存在。


```
    IF Object_Id('usp_sp', 'P') IS NOT NULL
        DROP PROCEDURE usp_sp

    IF EXISTS (SELECT name FROM SYSOBJECTS WHERE name = 'usp_sp' and type = 'P')
        DROP PROCEDURE usp_sp
        
    -- 临时表
    IF Object_Id('tempdb..#usp_tempsp', 'P') IS NOT NULL
        DROP PROCEDURE #usp_tempsp    
```

系统表 **SYSOBJECTS.type** 字段说明：

type 取值 | 说明 | type 取值 | 说明
---|---|---|---
C | check约束 | D | 默认值或default约束
F | 外键约束 | FN | 标量函数
IF | 嵌套表函数 | K | 主健约束或Unique约束
L | 日志 | P| 存储过程
PK | 主键约束 | R | 规则
RF | 复制筛选器存储过程 | S | 系统表
TR | 触发器 | U | 用户表
V | 试图 | X | 扩展存储过程