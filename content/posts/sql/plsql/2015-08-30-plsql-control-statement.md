---
title: PL/SQL流程控制语言
date: 2015-08-30
description: PL/SQL流程控制语言
categories: SQL
tags: [pl/sql]
slug: 'plsql-control-statement'
aliases: ['/blog/2015/08/30/plsql-control-statement.html']
---

## 条件分支语句

### IF语句

语法：

	IF condition THEN
		statements;
	[ELSIF condition THEN
		statements;]
	[ELSE
		statements;]
	END IF;

示例：

	DECLARE
		v_age NUMBER(3);
	BEGIN
		SELECT age INTO v_age FROM user
		WHERE lower(name) = lower('&&name');
		IF v_age < 20 THEN
			UPDATE user SET age = v_age*2 WHERE lower(name) = lower('&&name');
		ELSEIF v_age < 40 THEN
		  UPDATE user SET age = v_age*3 WHERE lower(name) = lower('&&name');
		ELSE
			UPDATE user SET age = v_age/2 WHERE lower(name) = lower('&&name');
		END IF;
	END;

### CASE语句

语法：

1. 单一条件

		CASE selector
			WHEN expression1 THEN sequence_of_statements1;
			WHEN expression1 THEN sequence_of_statements2;
			...
			WHEN expression1 THEN sequence_of_statementsN;
			[ELSE sequence_of_statementsN+1;]
		END CASE;

2. 多条件

		CASE
			WHEN selector_condition1 THEN sequence_of_statements1;
			WHEN selector_condition2 THEN sequence_of_statements2;
			...
			WHEN selector_conditionN THEN sequence_of_statementsN;
			[ELSE sequence_of_statementsN+1;]
		END CASE;

示例：

	DECLARE
		v_uid  user.uid%TYPE;
		BEGIN
			v_uid := &id;
			CASE v_uid
				WHEN 1 THEN UPDATE user SET age = 20 WHERE uid = v_uid;
				WHEN 2 THEN UPDATE user SET age = 40 WHERE uid = v_uid;
				ELSE
					dbms_out.put_line('不存在该用户');
			END CASE;
		END;

	DECLARE
		v_uid  user.uid%TYPE;
		BEGIN
			v_uid := &id;
			CASE
				WHEN v_uid == 1 THEN UPDATE user SET age = 20 WHERE uid = v_uid;
				WHEN v_uid == 2 THEN UPDATE user SET age = 40 WHERE uid = v_uid;
				ELSE
					dbms_out.put_line('不存在该用户');
		END CASE;
	END;

## 循环语句

### LOOP 循环

语法：

	LOOP
		statement1;
		EXIT [WHEN condition];
	END LOOP;

使用该语句statement1至少会被执行一次。相当于do...while

	DELCARE
		i INT :=1;
		BEGIN
			LOOP
				UPDATE user SET createDate = SYSDATE WHERE uid = i;
				EXIT WHEN i = 10 ;
				i := i+1;
			END LOOP;
		COMMIT;
	END;

### WHILE 循环

语法：

	WHILE condition LOOP
		statement1;
		statement2;
		...
	END LOOP;

示例：

	DECLARE
		i INT := 1;
	BEGIN
		WHILE i <= 10 LOOP
			UPDATE user SET createDate = SYSDATE WHERE uid = i;
			i := i+1;
		END LOOP;
	COMMIT;
	END;

### FOR 循环

语法：

	FOR counter IN [REVERSE]
		min_bound..upper_bound LOOP
		statement1;
		statement1;
		...
	END LOOP;

* _counter_ : 循环控制变量，由Oracle隐含定义，不需要显示定义；
* _min_bound_、_upper_bound_ ：循环控制变量的上下界；
* 默认情况下FOR循环在每执行一次后，控制变量会自增一；如果指定**REVERSE**选项，则会减一；

示例：

	BEGIN
		FOR i IN 1..10 LOOP
			UPDATE user SET createDate = SYSDATE WHERE uid = i;
		END LOOP;
		COMMIT;
	END;

### 嵌套循环和标号

    -- 该示例中的<<waibu>>、<<neibu>>为标号，该名称可以自定义。
    DECLARE
		result INT;
	BEGIN
		<<waibu>>
		FOR i IN 1..10 LOOP
			<<neibu>>
			FOR j IN 1..10 LOOP
			    result := i * j;
				dbms_output.put_line(result);
				-- 当 result=10 时，退出外部循环，本例中是当i=5时退出。相当于调用break语句
				EXIT waibu WHEN result = 10; 
				-- 当 j = 2 时，退出内部循环。相当于调用break语句
				EXIT WHEN j = 2; 
			END LOOP neibu;
		END LOOP waibu;
			dbms_output.put_line(result);
		END;

## 顺序控制语句

### GOTO 语句

GOTO语句用于跳转到特定标号处。**一般不建议使用**。

语法:

	GOTO label_name;

示例：

	DECLARE
		i INT := 1;
	BEGIN
		LOOP
			IF i = 10 THEN
				GOTO jump_loop;
			END IF;
			EXIT WHEN i > 11;
			dbms_output.put_line('i-->'||i); -- 这条语句是不会被执行的！
			i := i+1;
		END LOOP;
		<<jump_loop>>
			dbms_output.put_line('i == 10 ! ');
	END;

### NULL 语句

NULL 语句不执行任何操作，并且直接将控制传递到下一条语句。使用NULL可以提高PL/SQL程序的可读性

示例：

	DECLARE
		v_uid user.uid%TYPE := &di;
		v_age user.age%TYPE;
	BEGIN
		SELECT age INTO v_age FROM user WHERE uid = v_uid;
		IF v_age < 20 THEN
			UPDATE user SET age = 100 WHERE uid = v_uid;
			commit;
		ELSE
			NULL;
		END IF;
	END;