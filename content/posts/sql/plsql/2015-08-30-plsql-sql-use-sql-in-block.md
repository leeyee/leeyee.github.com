---
layout: post
title: PL/SQL块中使用SQL
description: 本文主要介绍SQL语句在PL/SQL程序块中的应用
category: SQL
tag: [pl/sql]
---

* TOC
{:toc}

## 检索单行数据

在PL/SQL块中使用select语句，可以将数据库数据检索到变量中。

当在PL/SQL块中使用select语句时，必须要带有**into**子句。语法如下：

	SELECT select_list
		INTO {variable_name[,variable_name]... | record_name}
	FROM table_name
	WHERE condition;

其中，

* select_list为指定查询列；
* variable_name为接收指定查询列的标量变量名；
* record_name为接收指定查询列的记录变量名；

### 1、使用标量变量接收数据

使用标量变量接收 SELECT 语句的输出结果时，变量个数要与 SELECT 选择项相同，且变量类型和长度要匹配。

	DECLARE
		v_name user.ename%TYPE;
		v_age user.age%TYPE;
	BEGIN
		SELECT name,age into v_name,v_age
		FROM user where uid = &id;
		dbms_output.put_line('姓名:'||v_name);
		dbms_output.put_line('年龄:'||v_age);
	END;

### 2、使用记录变量接收数据

使用记录变量接受数据时，记录成员的个数必须与选择列表项个数完全一致，且数据类型和长度要相匹配。上述例子使用记录变量可写成：

	DECLARE
		TYPE user_record_type IS RECORD (
			name user.name%TYPE,
			age user.age%TYPE
		);
		user_record user_record_type;
	BEGIN
		SELECT name,age into user_record
		FROM user
		WEHRE uid = &id;
		dbms_output.put_line('姓名:'||user_record.name);
		dbms_output.put_line('年龄:'||user_record.age);
	END;


### 3、嵌入使用 SELECT ... INTO ... FROM ... [WHERE] 语句注意事项

1. 在PL/SQL块中使用 SELECT INTO 语句时，该语句只能返回一条数据
2. 当 1 不成立时，会触发以下异常：
	1.  _**NO_DATA_FOUNT异常**_。该异常发生在 SELECT INTO 语句**没有返回任何数据**时
	2.  _**TOO_MANY_ROWS异常**_。该异常发生在 SELECT INTO 语句**没有返回多条数据**时

	_**以上两个异常在没有捕获时将会将异常信息传递到调用环境中**_

3. WHERE 子句中使用变量时，变量名不能与列名相同，否则会触发 **TOO_MANY_ROWS** 异常。例如以下示例将产生异常。

		DECLARE
			uid NUMBER(6) := 10;
			v_name VARCHAR2(10);
		BEGIN
			SELECT name INTO v_name FROM user WHERE uid = uid;
		END;


## 操作数据

### 插入数据

#### SQL*Plus INSERT数据语法为：

	INSERT INTO <table> [(column[,column,...])]
			VALUES(value[,value,...])
	或者

	INSERT INTO <table> [(column[,column,...])] SubQuery

PL/SQL中与SQL*Plus INSERT数据相同，只不过在提供数值时需要使用PL/SQL变量。

#### 在PL/SQL中使用INSERT VALUES插入数据

	DECLARE
			v_name user.name%TYPE;
			v_age user.age%TYPE;
		BEGIN
			v_name := '&name';
			v_age := &age;
			INSERT INTO user(name,age) VALUES(v_name,v_age);
		END;

#### 在PL/SQL中使用子查询插入数据

	DECLARE
			v_deptno dep.no%TYPE;
		BEGIN
			INSERT INTO user(name,age)
				SELECT name,age
				FROM dep
				WHERE no = v_deptno;
		END;

### 更新数据

#### SQL*Plus 语法

	UPDATE <table|view>
	SET <column> = <value> [, <column> = <value>...]
	[WHERE <conditon>];

#### PL/SQL 语法

	DECALARE
			v_name user.name%TYPE := '&name';
			v_age user.age%TYPE := &age;
		BEGIN
			UPDATE user SET name = v_name, age = v_age WHERE uid = 1;
		END;

		DECLARE
			v_uid user.uid%TYPE := &id;
		BEGIN
			UPDATE user SET (name,age) = (
				SELECT name,age FROM user_tmp where uid_tmp = v_uid;
			) WHERE uid = v_uid;


### 删除数据

#### SQL*Plus 语法

	DELETE FROM <table|view> [WHERE <condition>];

#### PL/SQL 语法

		DECLARE
			v_uid user.uid%TYPE := &id;
		BEGIN
			DELETE FROM user WHERE uid = v_uid;
		END;

		DECLARE
			v_age user.age%TYPE := &age;
		BEGIN
			DELETE FROM user WHERE uid  in (
				SELECT tmp_uid FROM user_tmp WHERE age = v_age
			);
		END;

### SQL游标

执行 SELECT、INSERT、UPDATE、DELETE语句时，Oracle Service 会为这些SQL语句分配相应的上下文(Context Area).ORACLE使用上下文解析并执行SQL。而游标是指向上下文区的指针。

ORACLE中，游标包括**隐式游标**和**显式游标**。

**隐式游标**又被称作**SQL游标**，专用于处理 SELECT，INTO，INSERT，UPDATE及DELETE语句；

**显式游标**则用于处理**多行SELECT语句**。

在PL/SQL块中执行INSERT,UPDATE,DELETE时，为了取得DML语句作用的结果，必须要使用SQL游标属性。

#### SQL游标属性

1. **SQL%ISOPEN** 属性

	该属性用于确定SQL游标是否已经打开。在PL/SQL块中执行SELECT INTO,INSERT,UPDATE及DELETE时，Oracle会隐含的打开游标，并且在执行完成后隐含的关闭游标。该属性在实际的开发过程中可以不用考虑。

2. **SQL%FOUND** 属性

	该属性用于确定SQL语句执行是否成功（是否有作用行）。当SQL语句有作用时，其属性为TRUE；否则为FALSE;

		DECLARE
 				v_uid user.uid%TYPE := &id;
 			BEGIN
 				UPDATE user SET age = 100
 				WHERE uid = v_uid;
 				IF SQL%FOUND THEN
 					dbms_output.put_line('语句执行成功');
 				ELSE
 					dbms_output.put_line('语句执行失败');
 				END IF;
 			END;

3. **SQL%NOTFOUND** 属性

	与 SQL%FOUND 属性相反。有作用行时为FALSE,无作用行时为TRUE;

		DECLARE
 				v_uid user.uid%TYPE := &id;
 			BEGIN
 				UPDATE user SET age = 100
 				WHERE uid = v_uid;
 				IF SQL%NOTFOUND THEN
 					dbms_output.put_line('用户表中不存在该用户');
 				ELSE
 					dbms_output.put_line('语句执行成功');
 				END IF;
 			END;

4. **SQL%ROWCOUNT** 属性

	该属性用户统计SQL语句的作用行数。如果没有作用行，则返回0;

		DECLARE
 				v_uid user.uid%TYPE := &id;
 			BEGIN
 				UPDATE user SET age = 100
 				WHERE uid = v_uid;
 				dbms_output.put_line('修改了'||SQL%ROWCOUNT||'行');
 			END;

## 事务控制

PL/SQL块中的事务同SQL*Plus直接使用事务语句COMMIT，ROLLBACK，SAVEPOINT。

* COMMIT :　提交事务
* ROLLBACK :　回滚事务
* SAVEPOINT ：设置事务保存点

		DECLARE
			v_uid user.uid%TYPE :=&id;
		BEGIN
			UPDATE SET age = 100 WHERE uid = v_uid;
		COMMIT;
		EXCEPTION
			WHEN OTHERS THEN
			ROLLBACK;
		END;

		BEGIN
			INSERT INTO user(name,age) VALUEs('name1',20);
		    SAVEPOINT u1;
				INSERT INTO user(name,age) VALUEs('name2',30);
		    SAVEPOINT u2;
				INSERT INTO user(name,age) VALUEs('name3',40);
		    SAVEPOINT u3;
				ROLLBACK TO u2; //回滚到第二条SQL,实际插入两条数据
		COMMIT;
		END;
