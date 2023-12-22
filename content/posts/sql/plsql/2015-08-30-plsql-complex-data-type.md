---
layout: post
title: PL/SQL复合数据类型
description: 介绍pl/sql复合数据类型。包括记录表、集合、嵌套表、变长数组等数据类型
category: SQL
tag: [pl/sql]
---

* TOC
{:toc}


## PL/SQL记录

PL/SQL记录类似高级语句中的结构，用于处理**单行多列**数据。

### 自定义PL/SQL记录

语法：

	TYPE type_name IS RECORD(
		filed_declaration[,filed_declaration]...
	);
	
	indetifier type_name;
	
示例：

	DECALRE
		TYPE user_record_type IS RECORD(
			name user.name%TYPE,
			age user.age%TYPE
		);
		
		user_record user_type;
	...

### 使用%ROWTYPE属性定义记录变量

**%ROWTYPE**属性可以**基于表或视图**定义记录变量。使用该属性后，记录变量成员的名称和类型与表或视图的名称和类型完全相同。
	
	user_record user%ROWTYPE;
	
### 使用示例

	set serveroutput on 
		DECLARE
			TYPE user_record_type IS RECORD(
				name user.name%TYPE,
				age user.age%TYPE
			);			
			user_record user_record_type;
			user_record1 user_record_type;
			user_record2 user%ROWTYPE;
			user_record3 user%ROWTYPE;
		BEGIN
			-- 在 SELECT INTO 语句中使用 PL/SQL 记录
			SELECT name,age into user_record
			FROM user where uid = 1;
			dbms_output.put_line(user_record.name);
			
			-- 在 SELECT INTO 语句中使用记录变量
			SELECT name into user_record1.name 
			FROM user where uid = 2;
			dbms_output.put_line(user_record1.name);
			
			user_record2.uid := 100;
			user_record2.name := 'name1';
			user_record2.age := 56;
			
			-- 在 VALUES 子句中使用记录变量(Oracle9i新特性)
			INSERT INTO user VALUES user_record2; 
			
			user_record3.name := user_record2.name;
			user_record3.age := user_record2.age;
			UPDATE user SET ROW = user_record3 WHERE uid = user_record2.uid;
		END;
		
		
## PL/SQL集合

PL/SQL集合**相当于高级语言的数组**。用于**存放多行单列数据**。PL/SQL集合包括*索引表*(PL/SQL表)、*嵌套表*(Nested Table)和*变长数组*(VARRAY)等三种类型

### 索引表(PL/SQL表)

该类型数据为Oracle早期类型。索引表的元素个数没有限制，并且下标可以为负值。
	
语法：

	TYPE type_name IS TABLE OF element_type
	[NOT NULL] INDEX BY key_type;
	identifier type_name;
		
* type_name : 定义的索引表名称
* element_type : 索引表中的元数据类型
* NOT NULL : 可选项。索引表中的元素不能引用NULL元素
* key_type ：索引表元素下标数据类型
		

_Oracle9i之前key_type只能为 BINARY_INTEGER 和 PLS_INTEGER;从Oracle9i开始key_type也可以使用VARCHAR2._
		
示例：

	set serveroutput on 
		DECLARE
			TYPE name_table_type IS TABLE OF user.name%TYPE
				INDEX BY BINARY_INTEGER;
			names_table name_table_type;
			
			TYPE area_table_type IS TABLE OF NUMBER
				INDEX BY VARCHAR2(10);
			area_table area_table_type;
		BEGIN
			SELECT name INTO names_table(-1) FROM user
			WHERE uid = 1;
			dbms_output.put_line('姓名'||names_table(-1));
			
			area_table('北京') := 1;
			area_table('上海') := 2;
			area_table('天津') := 3;
			dbms_output.put_line('first->'||area_table('北京')); -- 1
			dbms_output.put_line('second->'||area_table('上海')); -- 2
			dbms_output.put_line('last->'||area_table.last); -- 天津
			
		END;
		
### 嵌套表(Nested Table)

+ 嵌套表的**元素下标从1开始**，元素**个数没有限制**，同时其**元素值可以是稀疏的**；
+ 索引表不能作为表列属性，但嵌套表**可以作为表列属性进行表列定义**；
+ 使用嵌套表元素时，**必须首先使用其构造方法初始化嵌套表**。
	
语法：

	TYPE type_name IS TABLE OF element_type;
	identifier type_name;
		
示例：

	DECLARE
		TYPE name_table_type IS TABLE OF user.name%TYPE;
		name_table name_table_type := name_table_type('a','a'); -- 初始化嵌套表
	BEGIN
		SELECT name INTO name_table(2) FROM user WHERE uid = 1;
		dbms_output.put_line('姓名:' || name_table(2));
	END;
		
_当嵌套表类型当作表列的数据类型使用时，必须首先使用 CREATE TYPE 命令建立嵌套表，必须为嵌套表列指定专门的存储表。_
	
示例：
		
	CREATE TYPE phone_type IS TABLE OF VARCHAR2(20);
		
	CREATE TABLE user (
		id NUMBER(3),name VARCHAR2(10),salary NUMBER(6,2),phone phone_type
	) NESTED TABLE phone STORE AS phone_type;
		

1. 为嵌套表插入数据

		BEGIN 
			INSERT INTO user VALUES(1,'leeyee',800,phone_type('13800000000','13912345678'));
		END;
		
2. 检索嵌套表数据
		
		set serveroutput on
		DECLARE
			phone_table phone_type;
		BEGIN
			SELECT phone INTO phone_table FROM user WHERE id = 1 ;
			FOR i IN 1..phone_table.COUNT LOOP
				dbms_output.put_line('电话号码:'||phone_table(i));
			end LOOP;
		END;
		
3. 更新嵌套表数据
		
		DECLARE
			phone_table phone_type := phone_type('15900001111','15896543219','13345678923');
		BEGIN
			UPDATE user SET phone = phone_table WHERE id = 1;
		END;
		
### 变长数组(VARRAY)

PL/SQL 数组数据类型，可作为**表列数据类型**使用。该数据类型与高级语言**数组**类似，元素**下标从1开始**，并且元素**最大个数有限**。当使用VARRAY是，应首先进行**初始化**。
	
语法：
		
	TYPE type_name IS VARRAY(size) OF element_type [NOT NULL]
	indentifier type_name;
		
+ type_name : 变长数组类型名
+ size : 数组最大元素个数
+ element_type ：数组元素数据类型
	
示例：

	DECLARE
		TYPE user_varray_type IS VARRAY(20) OF user.name%TYPE;
		user_varray user_varray_type := user_varray_type('oxcow','leeyee'); -- 初始化 VARRAY
	BEGIN
		SELECT name INTO user_varray(1) FROM user WHERE uid = 1 ;
		dbms_output.put_line('姓名' || user_varray(1));
	END;
	-- 表列属性
	-- 创建表列属性
	CREATE TYPE phone_type IS VARRAY(20) OF VARCHAR2(20);
	CREATE TABLE user(
		id NUMBER(3),name VARCHAR2(20),phone phone_type
	);
	-- 插入、检索及更新同嵌套表
		
### PL/SQL记录表

PL/SQL记录表用来**存储多行多列数据**。
	
示例：
	
	DECLARE
		TYPE user_table_type IS TABLE OF user%ROWTYPE
			INDEX BY BINNARY_INTEGER;
		user_table user_table_type;
	BEGIN
		SELECT * INTO user_table(1) FROM user WHERE uid = 1;
		SELECT * INTO user_table(2) FROM user WHERE uid = 2;
		dbms_output.put_line('姓名: ' || user_table(1).name);
		dbms_output.put_line('姓名: ' || user_table(2).name);
	END;
			
### 多级集合

多级集合是指**嵌套了集合类型的集合类型**。通过使用多级集合，可以在PL/SQL中实现类似于**多维数组**的功能。_(Oracle9i以后可以使用)_
	
示例：
	
	-- 在块中使用多级 VARRAY
	-- 定义VARRAY(10,10)
	DECLARE
		-- 定义一维VARRAY
		TYPE al_varray_type IS VARRAY(10) OF INT;
		-- 定义二维VARRAY
		TYPE nal_varray_type IS VARRAY(10) OF al_varray_type;
		-- 初始化二维集合变量
		nvl_array nal_array_type := nal_varray_type(
			al_varray_type(58,100,12),
			al_varray_type(432,43,211),
			al_varray_type(2,4)
		);
	BEGIN
		dbms_output.put_line('显示二维数组所有元素');
		FOR i in 1..nvl_array.COUNT LOOP
			FOR j in 1..nvl_array(i).COUNT LOOP
			    dbms_output.put_line('nvl_array('||i||','||j||')='||nvl_array(i)(j));
			END LOOP;
		END LOOP;
	END;
		
	-- 在块中使用多级嵌套表
	DECLARE
		-- 定义一维嵌套表
		TYPE al_table_type IS TABLE OF INT;
		-- 定义二维嵌套表
		TYPE nal_table_type IS TABLE OF al_table_type;
		-- 初始化二维集合变量
		nvl_table nal_table_type := nal_table_type(
			al_table_type(58,100,12),
			al_table_type(432,43,211),
			al_table_type(2,4)
		);
		
	--  在块中使用多级索引表
	DECLARE
		-- 定义一维table
		TYPE al_table_type IS TABLE OF INT INDEX BY BINARY_INTEGER;
		-- 定义二维table
		TYPE nal_table_type IS TABLE OF al_table_type INDEX BY BINARY_INTEGER;
		-- 初始化二维集合变量
		nvl_table nal_table_type;
		nvl_table(1)(1) := 2;
		nvl_table(1)(2) := 3;
		nvl_table(2)(1) := 4;
		nvl_table(2)(2) := 25;
				
## 集合方法

1. EXISTS
	该方法用来**确定集合元素是否存在**。如果存在返回TRUE，否则返回FALSE
2. COUNT
	该方法返回当前**集合变量中的元素总个数**。
3. LIMIT
	该方法返回**当前集合元素的最大个数**。对于嵌套表和索引表，由于其个数没有限制，则在使用该方法时会返回NULL。
4. FIRST 和 LAST
	FIRST 方法**返回集合变量第一个元素的下标**；
	LAST 方法**返回集合变量的最后一个元素下标**；
5. PRIOR 和 NEXT	
	PRIOR 方法**返回当前集合元素的前一个元素的下标**；
	NEXT 方法**返回当前集合元素的后一个元素下标**；
6. EXTEND
	该方法用来**扩展集合变量的尺寸**，并为他们**增加元素**。该方法**只适用于嵌套表和VARRAY**。
	+ EXTEND : 为集合变量添加一个NULL元素
	+ EXTEND(n) : 为集合变量添加n个NULL元素
	+ EXTEND(n,i) : 为集合变量添加n个元素，元素值与第i个元素相同
7. TRIM
	该方法从集合尾部删除元素。该方法**只适应于嵌套表和VARRAY**
	+ TRIM : 从尾部删除一个元素
	+ TRIM(n) : 从尾部删除n个元素
8. DELETE
	该方法用于删除集合元素。该方法**只适用于嵌套表和索引表**。
	+ DELETE : 删除集合变量中的所有元素
	+ DELETE(n) : 删除集合变量的第n个元素
	+ DELETE(n,m) : 删除集合变量从第n个到第m个的所有元素
		
示例：

	DECLARE
		TYPE name_table_type IS TABLE OF user.name%TYPE;
		name_type name_table_type;
	BEGIN
		IF name_type.EXISTS(1）THEN
			name_type(1) := 'leeyee';
		ELSE
			dbms_output_line("必须初始化集合元素");
		END IF;
	END;
