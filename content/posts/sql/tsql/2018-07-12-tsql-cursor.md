---
title: T-SQL游标
date: 2018-07-12
description: T-SQL游标简介
categories: "SQL"
tags: ["t-sql"]
slug: 'tsql-cursor'
aliases: ['/blog/2018/07/12/tsql-cursor.html']
---

## 游标

类似指针。可以对`SELECT`返回数据逐行进行处理。支持以下功能：

- 定位结果集中的特定行；
- 从结果集的当前位置检索一行或多行；
- 支持对结果集中当前位置行数据进行修改；

### 分类

- **静态游标**：打开游标时在*tempdb*中建立`SELECT`结果集的快照。只展示打开游标时的结果集，不同步展示当前其他对该数据集的实际更新。
- **动态游标**：与静态游标对应，当滚动游标时，反映结果集中的所有更改。结果集中的行数据值、顺序和成员在每次提取时都会改变，所有用户的`UPDATE`,`INSERT`,`DELETE`语句均通过游标可见。
- **只进游标**：不可滚动，只支持从头到尾顺序提取数据。
- **键集游标**：游标中各行成员身份和顺序固定。健集驱动游标由一组唯一标识符（键）控制，这组键称为健集。键是根据唯一方式标识结果集中各行的一组列生成的。健集是打开游标时来自符合`SELECT`语句要求的所有行中的一组键值。健集驱动的游标对应的健集是打开游标时在数据库*tempdb*中生成的。

### 定义

    /* 声明游标名 */
    DECLARE cursor_name CURSOR
    /* 游标作用域 */
    [LOCAL|GOBAL]
    /* 游标移动方向。默认FORWARD_ONLY */
    [FORWARD_ONLY|SCROLL]
    /* 游标类型 */
    [STATIC|KEYSET|DYNAMIC|FAST_FORWARD]
    /* 访问属性 */
    [READ_ONLY|SCROLL_LOCKS|OPTIMISTIC]
    /* 类型转换警告信息 */
    [TYPE_WARNING]
    FOR SELECT_statement
    /* 可修改的列 */
    [FOR UPDATE [OF column_name[,...n]]]
    


- **LOCAL**：指明该游标仅在存储过程、触发器或批处理文件内。当其建立结果执行时，即自动解除。
- **GOBAL**：session范围内的所有存储过程、触发器或批处理。连接结束时，自动解除。
- **FORWARD_ONLY**：只能由第一行数据向前到最后一行。默认选项
- **SCROLL**：可以查看前后行数据。具体可取值：
    - **FIRST**：游标第一行
    - **LAST**：最后一行
    - **PRIOR**：上一行
    - **NEXT**：下一行
    - **RELATIVE n**：当前位置的前或后*n*行数据。*n*为正为向下，否则为向上
    - **ABSULUTE n**：指定行
- **STATIC**：静态游标
- **KEYSET**：健集游标。指定当游标打开时，系统在*tempdb*内部建立一个*keyset*,*keyset*的键值可唯一标识游标的数据。用户更改非键值时，能反映出其变动。新增一行符合游标范围的数据时，无法由此游标读到；删除游标中的一行时，用该游标读取该行数据会得到一个 `@@FETCH_status` 为 *-2* 的返回值；
- **DYNAMIC**：动态有标
- **FAST_FORWARD**：当设定`FOR READ_ONLY` 或者 `READ_ONLY`时，该选项将启动系统的效能最佳化；
- **READ_ONLY**：内容不可改
- **SCROLL_LOCKS**：数据读入游标时，锁定读入数据。可确保成功更新或删除游标内的数据。与选项 **FAST_FORWARD** 冲突；
- **OPTIMISTIC**：用`WHERE CURRENT OF`方式修改或删除有标内数据时，如果该行数据已被其他用户变动过，则该方式不会成功；
- **TYPE_WARNING**：若游标的类型被内部更改为和用户要求说明的类型不同时，发送一个警告信息给客户

### 打开游标

    OPEN [GLOBAL] cursor_name | @cursor_variable_name
    
- **GLOBAL**: 全局游标
- **cursor_name**：游标名称
- `@cursor_variable_name`：有标变量名称，该变量引用一个游标

可以通过判断全局变量 `@@ERRORS` 是否为0来确认游标是否打开成功。打开成功可通过全局变量 `@@CURSOR_ROWS` 获取游标中的记录行数。

`@@ERRORS` 值 | 说明
---|---
-m | 游标采用异步方式填充，m为当前健集中已填充的行数
-1 | 动态游标，游标中的行数时动态变化的，不能确定
0 | 游标没被打开或者已被关闭或释放
m | 填充完成，返回有标中的行数

### 获取数据

    FETCH [NEXT|PRIOR|FIRST|LAST|ABSOLUTE{n|@nvar}|RELATIVE{n|@nvar}]
    FROM [GLBAL] cursor_name | @cursor_variable_name
    [INTO @variable_name[,...n]]
    
参数 | 说明
---|---
NEXT | 当前行后一行。第一使用次，则返回第一行。**默认**
PRIOR | 当前行前一行
FIRST | 返回第一行并将其当作当前行
LAST | 返回最后一样并将其当作当前行
ABSOLUTE{n\|`@nvar`} | n>0返回从游标头开始的第n行;n<0返回从游标尾之前的第n行;游标移到该行
RELATIVE{n\|`@nvar`} | n>0当前行后第n行;n<0当前行前第n行;游标移到该行
`INTO @variable_name[,...n]` | 存入变量

`@@FETCH_STATUS` 返回获取语句执行的最终状态。需要说明的是：

> `@@FETCH_STATUS` 对于一个连接上的所有游标是全局性的。因此为了保证正确性，查看当前 `FETCH` 的 `@@FETCH_STATUS` 时，必须是在一个 `FETCH` 前执行。

返回值 | 说明
---|---
0 | 成功
-1 | 失败，或不在结果集中
-2 | 提取行不存在

### 使用游标修改数据

    UPDATE table_name SET column_name = ? WHERE CURRENT OF cursor_name
    DELETE FROM table_name WHERE CURRENT OF cursor_name
    
`CURRENT OF` 只能在`UPDATE`,`DELETE`中使用

### 关闭释放游标

```
    -- 关闭游标
    CLOSE cursor_name
    
    --释放游标
    DEALLOCATE cursor_name
```

- 关闭后数据不可再读。如需使用可再次使用`OPEN`语句打开。
- 释放后会从当前会话中移除游标引用，释放所有资源。释放后不可`OPEN`语句打开，必须使用`DECLARE`重建游标

## 游标Demos

1. 获取表数据量

```
    /* INSENSITIVE 不考虑处理过程中数据表的变动 */
    DECLARE total_user INSENSITIVE CURSOR
    FOR 
        SELECT * FROM user
    
    OPEN total_user
    
    IF @@ERROR = 0
        BEGIN
            PRINT 'cursor open success!'
            PRINT 'tatal user: ' + 
                CONVERT(VARCHAR(3),@@CURSOR_ROWS)
        END
        
    CLOSE total_user
    DEALLOCATE total_user
    
```

2. 逐条获取数据


``` 
    SELECT * FROM user WHERE age > 30
    
    DECLARE cr_age CURSOR
    FOR 
        SELECT * FROM user WHERE age > 30
    
    OPEN cr_age
    
    FETCH NEXT FROM cr_age
    WHILE @@FETCH_STATUS = 0
        FETCH NEXT FROM cr_age
    
    CLOSE cr_age
    DEALLOCATE cr_age

```

3. 更新数据

```
    SELECT * FROM user WHERE name  = 'jack'; -- age = 30
    
    DECLARE cr_update_age CURSOR
    FOR 
        SELECT * FROM user WHERE name  = 'jack'
        
    FETCH NEXT FROM cr_update_age
    UPDATE user SET age = 31 WHERE CURRENT OF cr_update_age
    
    OPEN cr_update_age
    
    CLOSE cr_update_age
    DEALLOCATE cr_update_age
    
    SELECT * FROM user WHERE name  = 'jack'; -- age = 31
```