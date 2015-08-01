---
layout: post
title: PL/SQL常用函数
description: 本文主要介绍PL/SQL中常用的函数，比如数字、字符、日期函数等。
category: pl/sql
tag: [pl/sql]
keywords: [SQL函数, sql function, pl/sql函数, pl/sql function]
---


### 常用数字函数

`abs(n)` : 返回n的绝对值

`ceil(n)` : 返回大于等于数字n的最小整数

`floor(n)` : 返回小于等于数字n的最大整数

`mod(m,n)` : 取m/n的余数

`power(m,n)` : 返回m的n次幂

`round(n[,m])` : 执行四舍五入运算。省略m，则四舍五入到整数位；m为负，四舍五入到小数点前m位；m为正，四舍五入到小数点后m位

`trunc(n[,m])` : 截取数字。省略m，数字n去掉小数部分；m为负,数字n截取小数点前m位；m为正，数字n截取小数点后m位

#### demo:
    select
        abs(-12),
        ceil(12.4),
        floor(12.9),
        mod(100,3),
        power(2,3),
        round(12.4),
        round(12.5),
        round(12.09,-1),
        round(12.09,1),
        trunc(30.3),
        trunc(20.358899,3),
        trunc(28.3565,-1)
    from dual;

### 常用字符函数

`ascii(char)` : char字符的ascii码

`chr(n)` : 将ascii码值n转换成字符

`concat(str1,str2)` : 连接str1\str2为一个字符串。相当于连接符（||）

`initcap(char)` : 将字符串中的每个单词首字母大写，其他字符小写

`instr(char1,char2[,n[,m]])` : 获取子串char2在字符串char1中的位置。n为其实搜索位置，m为子串出现的次数；n为负，则从尾部开始搜索；n\m默认为1

`length(char)` : 返回字符串的长度。如果char = null则返回null

`lower(char)` : 返回char的小写格式

`upper(char)` : 返回char的大写格式

`lpad(char1,n,char2)` :  在字符串char1的左端填充字符串char2直到长度达到n;char2默认为空格，如果char1.length>n，则返回char1左端的n个字符

`rpad(char1,n,char2)` :  在字符串char1的右端填充字符串char2直到长度达到n;char2默认为空格，如果char1.length>n，则返回char1左端的n个字符

`ltrim(char1[,set])` : 去掉字符串char1左端包含的set中的任意字符。

`rtrim(char1[,set])` : 去掉字符串char1右端包含的set中的任意字符。

`nls_initcap(char,'nls_param')` : 同`initcap`.但这里的char用于指定`NCHAR`或者`NVARCHAR2`类型字符串；`nls_param`的格式为nls_sort=sort,用于指定特定语言特征

`nls_lower(char,'nls_param')` : 同`lower`,参数同`nls_initcap`

`nls_upper(char,'nls_param')` : 同`upper`,参数同`nls_initcap`

`replace(char,search_str[,replacement_str])` :  将字符串char中的子串search_str替换成replacement_str；如果search_str=null，返回char；如果replacement_str=null，则会去掉char中的search_str

`soundex(char)` : 返回字符串char的语音表示，使用该函数可比较发印相同的字符串

`substr(char,m[,n])` : 获取char的子字符串。m为字符起始位置，n为子串长度。m为0，从首字符开始;m为负从尾部开始

`trim(char|char From string)` : 从字符串的头尾或者两端截断特定字符。

`translate(string,from_str,to_str)` : 将string按照from_str与to_str的对应关系进行转换

#### demo:
    select 
        ascii('a'), -- 字符的assii码
        chr(68), -- 数字对应的字符
        concat('a','cd'), -- 字符串连接
        ('a'||'cd'), -- 字符串连接
        initcap('ok abc'),-- 单词首字母大写
        instr('abccdcdc','c',1,2),
        length(null), -- 字符串的长度
        length('abc'),
        lower('ABCD'),-- 小写字符串
        upper('abcd'),-- 大写字符串
        LPAD('ac',6,'$'), -- 在字符串前面填补$字段直到字符串长度达到6
        LPAD('accc',2,'$'), 
        RPAD('ac',4,'*'), -- 在字符串后面填补*字段直到字符串长度达到4
        RPAD('acccc',4,'*'),
        ltrim('1234','1'), -- 去掉字符串最左边为'1'的字符
        ltrim('1234','23'),
        rtrim('1234','234'), -- 去掉字符串最右边为'234'的字符
        rtrim('1234','23'),
        nls_initcap(n'ok abc'), -- 单词首字母大写
        nls_lower(n'SQL'), -- 单词小写
        replace('abc','b','123'), -- 字符串替换
        replace('abc','b'),
        replace('','b'),
        soundex('lawer'),-- 返回字符串语音表示
        soundex('lier'),
        soundex('ok'),
        substr('hello',2,2), -- 子字符串 substr(str,offset,len)
        substr('hello',2),
        substr('hello',-2),
        substr('hello',-3,2),
        translate('234abcd', '12345abcde','ahellojack'),
        '  adc',
        trim('  adc '), -- 去除字符串两端空格
        trim('a' from 'aa123ab') -- 去除字符串两端指定字符
    from dual;

### 常用日期时间函数(一)

`add_months(d,n)` : 返回特定日期时间d前后的n个月所对应的日期时间。n为正整数表示之后，负整数表示之后

`current_date` : 返回当前会话时区所对应日期时间。Oracle9i新增

`current_timestamp` : 返回当前会话时区所对应详细日期时间。Oracle9i新增

`dbtimezone` : 返回数据库所在时区。Oracle9i新增

`extract` : 从日期中获取所需要的特定数据。Oracle9i新增。比如：
    select
    	extract(year from sysdate)  --年
    	extract(month from sysdate) --月
    	extract(day from sysdate)   --日
    from dual;
    
`last_day(d)` : 返回特定日期所在月份最后一天

`months_between(d1,d2)` : 返回日期d1和d2之间相差的月数。d1 < d2 返回负数；d1和d2天数相同或都是月底，返回整数；否则Oracle以每月31天为准来计算结果的小数部分。

`new_time(date,zone1,zone2)` : 返回时区zone1对应的时区zone2的日期时间。

`next_day(d,char)` : 返回指定日期d后的第一个工作日char所对应的日期。

    select next_day(sysdate,'星期一') from dual;

#### demo:
    select  
        to_char(sysdate,'yyyy-MM-dd hh24:mi:ss'),
        add_months(sysdate, 2), -- 当前时间加两个月
        current_date, -- 当前日期
        current_timestamp, -- 当前日期时间
        dbtimezone, -- 当前时区
        extract(year from sysdate) as year, -- 获取from日期的年份
        extract(month from sysdate) month, 
        extract(day from sysdate) day,
        from_tz(timestamp '2011-10-12 21:49:30','5:00'),
        last_day(sysdate), -- 当前日期所在月份的最后一天
        months_between(sysdate+1, sysdate) as 相差月数, 
        new_time(sysdate,'bst','est'),-- bst的时区对应est时区的时间
        next_day(sysdate,'星期二') -- 指定日期后的第一个工作日
    from dual;

### 常用日期时间函数(二)

`numtodsinterval(n,char_expr)` : 将数字n转换为INTERVAL DAY TO SECOND格式，char_expr可取 DAY | HOUR | MINUTE | SECOND

    select 
        numtodsinterval(60,'SECOND'), -- 60秒
        numtodsinterval(60,'MINUTE'), -- 60分钟
        numtodsinterval(60,'HOUR'),-- 60小时
        numtodsinterval(60,'DAY'), -- 60天
    from dual;
 
`numtoyminterval(n,char_expr)` : 将数字n转换为INTERVAL YEAR TO MONTH格式，char_expr可取 YEAR | MONTH

    select 
        numtoyminterval(60,'MONTH'), -- 60月
        numtoyminterval（60,'YEAR'), -- 60年
    from dual;

`round(d[,fmt])` : 返回日期的四舍五入结果。如果fmt指定年度，则7月1日为分界线；如果fmt指定月，则16日为分界线；如果指定天，则中午12:00为分界线。

    select 
        round(sysdate,'DAY'),   -- 四舍五入到天
        round(sysdate,'MONTH'), -- 四舍五入到月
        round(sysdate,'YEAR'),  -- 四舍五入到年
    from dual;

`sessiontimezone` : 当前会话所在时区。Oracle9i新增

`sysdate` : 系统日期时间

`systimestamp` : 系统日期时间及时区。Oracle9i新增

`to_timestamp(char[fmt[,'nls_parame']])` : 将符合指定日期和时间格式的字符串转变为`timestamp`类型
    
    select to_timestamp('2012-09','yyyy-mm') from dual;

`trunc(d,[fmt])` : 日期阶段函数。如果fmt指定年度，则结果为本年度的1月1日；如果为月，则将结果为本月1日

    select 
        trunc(sysdate,'MONTH'), -- 取到月
        trunc(sysdate,'YEAR'), -- 取到年
        trunc(sysdate,'mm')
    from dual;


### 转换函数

    set serveroutput on ;
    declare 
        v_cast varchar2(20);
    begin
        v_cast := cast(sysdate as varchar2);
        dbms_output.put_line(v_cast);
    end;

    select 
        asciistr('中国'), -- 返回参数的数据库字符串的ascii字符串
        bin_to_num(1,0), -- 返回二进制10表示的十进制数
        cast('123' as number) , -- 将字符串123转成number类型输出
        convert('abc','us7ascii','we8iso8859p1') ,-- 将字符串有编码us7ascii转成we8iso8859p1编码
        to_char(n'中国'),
        to_nchar('中国'),
        to_char(sysdate,'yyyy-mm-dd hh24:mi:ss'),
        to_char(100,'L99G999D99MI'), -- 将数字100转换成人民币式字符串
        to_clob('abc'), -- 将字符串转化成clob类型
        to_date('2000-12-23','yyyy-mm-dd') ,-- 将字符日期格式转化成日期格式
        to_number('￥100','L99999D99')
    from dual;

### 其他单行当行函数

`decode(expr1,serch1,result,[search2,result2,...][,default)` : 如果expr1 = serch1 输出 result ...
    
    -- id = 1, money * 10; id = 2, money * 20
    select id,money, decode(id,1,money*10,2,money*20,money) from customer;
    
`coalesce(expr1[,expr2][,expr3]..)` : 返回表达式中第一个NOT NULL表达式的结果

    select coalesce(null,null,'ab') from dual;
    
`dump(expr,return_frm)` : 返回表达式所对应的数据类型代码、长度及内部表示格式

    select dump('abc','1016') from dual;

`empty_blob()` : 初始化`blob`变量或字段

`empty_clob()` : 初始化`clob`变量或字段

    update yt_uniform_information set content = empty_clob() where key_id = 20 ;
    
<span class="label label-important"><em>NOTES：</em></span>
`content = empty_clob()` 与 `content = null`是不同的

`greatest(expr1[,expr2]...)` : 返回表达式中值最大的一个

`least(expr1[,expr2]...)` : 返回表达式中值最小的一个

`nls_charset_id(text)` : 返回字符集的id号

`nls_charset_name(number)` : 返回特定ID号所对应的字符集名

`nls_charset_decl_len(byte_count,charset[id])` : 返回字节数在特定字符集中占用的字符个数

`nullif(expr1,expr2)` : expr1 = expr2 返回 null ; 否则返回expr1。可用在字段上;Oracle9i新增

`nvl(expr1,expr2)` : expr1 = null 返回 expr2 否则返回expr1

`nvl2(expr1,expr2,expr3)` : expr1 != null 返回 expr2; expr1 = null 返回 expr3;参数expr1为任意数据类型，expr2、expr3为除`LONG`之外的任何数据类型。Oracle9i新增

`sys_context('context','attribute')` : 返回上下文特定属性值。context为应用上下文名 attribute为指定属性名

`uid` : 当前会话对应的用户ID号

`user` : 当前会话对应数据库用户名

`userenv(parameter)` : 返回当前上下文的属性信息。paramer = isdba|language|terminal|client_info

`vsize(expr)` : oracle内部存储expr的实际字节数.只能在SQL语句中使用

    select 
        greatest(1,2,4,4,10), 
        least(1,2,4,4,10), 
        nullif('abc','abc'),
        nvl(100,23),
        sys_context('userenv','os_user') "OS用户",
        sys_context('userenv','session_user') "数据库用户" , 
        uid,
        user,
        userenv('isdba'), -- 是否具有DBA权限
        userenv('language'), -- 当前会话语言地区和字符集
        userenv('terminal'), -- 当期会话所在终端的OS标识符 
        userenv('client_info'), -- 返回有包dbms_application_info所存储的用户会话信息（最长64字节）
        vsize('ad')
    from dual;

`sys_dburigen(colname)` ：根据列或者属性生成类型为DBUriType的URL

`sys_xmlgen(expr[,fmt])` : 根据数据库表的行和列生成一个XMLType实例

`sys_xmlagg(expr[,fmt])` : 汇总所有xml文档，并生成一个xml文档(用于可分组的数据列中(一对多))

`xmlelement(identifier[,xml_attribute_clause][,value_expr]` : 返回XMLType实例.identifier必选，指定元素名，xml_attribute_clause可选，指定元素属性子句，value_expr可选，指定元素值

`xmlcolattval(value_expr1[,value_expr2]...)` : 生成XML块，并增加column做为属性名

`xmlconcat(XMLType_instance1[,XMLType_instance2]...)` : 连接多个XMLType实例，并生成一个新的XMLType实例

`xmlforest(value_expr1[,value_expr2]...)` : 返回XML块

`xmlsequence(XMLType_instance)` : 返回XMLType实例中顶级节点一下的`VARRAY`元素

    select 
        name, 
        sys_dburigen(name),
        sys_xmlgen(name),
        xmlelement(id,name,money), -- <id>namemoney</id>
        xmlcolattval(name), -- <column name = "NAME">leeyee</column>
        xmlcolattval(name,money), -- <column name = "NAME">leeyee</column><column name = "MONEY">12.23</column>
        xmlelement("customer",xmlcolattval(id,name,money)),
        xmlconcat(xmlelement(id,name),xmlelement(money,money)),
        xmlforest(name,money),
        xmlsequence(xmlelement("customer",xmlcolattval(id,name,money)))
    from customer a ;

`sys_xmlagg(expr[,fmt])` : 汇总所有xml文档，并生成一个xml文档

`xmlagg(XMLType_instance[ORDER BY sor_list])` : 汇总多个XML块，生成XML文档。

    select 
        sys_xmlagg(sys_xmlgen(name)),
        xmlagg(xmlelement(name,name)),
    from yt_site_function_menu where function = 3

    create table xml_tables of xmltype;
    insert into xml_tables values(xmltype('<address>
        <province name="北京市">
		    <city name="北京辖区">
			    <country name="东城区" />
			    <country name="西城区" />
			    <country name="崇文区" />
			    <country name="宣武区" />
		    </city>
		    <city name="北京辖县">
			    <country name="密云县" />
			    <country name="延庆县" />
		    </city>
	    </province>
	    <province name="天津市">
		    <city name="天津辖区">
			    <country name="和平区" />
			    <country name="河东区" />
		    	<country name="河西区" />
			    <country name="南开区" />
			    <country name="河北区" />
		    </city>
		    <city name="天津辖县">
			    <country name="宁河县" />
			    <country name="静海县" />
			    <country name="蓟县" />
		    </city>
	    </province>
    </address>'));
    insert into xml_tables values(xmltype('<body>
	    <form onsubmit="javascript:return check(this);">
		    <button onclick="test();">fd</button>
		    <div id="ad"></div>
		    <input type="submit" value="check" />
	    </form>
        <div id="test">作为试验，还是让我们来测试一下效果吧。</div>
    </body>'));

`existsnode(xmltype_instance,Xpath_string)` : 确定xml节点路径是否存在。存在返回1否则返回0

`extract(xmltype_instance,Xpath_string)` : 返回xml节点路径下的内容

`extractvalue(xmltype_instance,Xpath_string)` : 返回xml节点路径下的内容值

`updatexml(xmltype_instance,Xpath_string,value_expr)` : 更新特定XMLType实例相应节点路径内容

    select 
        -- p.*,
        existsnode(value(p),'/address/province/city[0]'),
        extract(value(p),'/address/province[1]/city[1]/country[1]'),  
        extract(value(p),'/body/div'),
        extractvalue(value(p),'/body/div'),
        xmlsequence(extract(value(p),'/address/province/city/*'))
    from xml_tables p ;
    
    update xml_tables p set p=updatexml(value(p),'/body/div/text()','作为试验，还是让我们来测试一下效果吧。');


### 分组函数

具体请查看[SQL分组语句要点](/blog/2011/11/16/plsql-sql-groupby/)

