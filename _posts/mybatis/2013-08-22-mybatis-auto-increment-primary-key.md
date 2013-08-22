---
layout: post
title: mybatis自增主键配置
description: mybatis进行插入操作时，如果表的主键是自增的，针对不同的数据库相应的操作也不同。基本上经常会遇到的就是 oracle sequece 和 mysql 自增主键，至于其他的手动生成唯一主键的问题在这里就不讨论了，这里主要说明下在mybatis中对于自增主键的配置
category: mybatis
tag: [mybatis]
keywords: [mybatis sequence, mybatis 自增主键]
---

mybatis进行插入操作时，如果表的主键是自增的，针对不同的数据库相应的操作也不同。基本上经常会遇到的就是 Oracle Sequece 和  Mysql 自增主键，至于其他的手动生成唯一主键的问题在这里就不讨论了，这里主要说明下在mybatis中对于自增主键的配置。

##不返回自增主键值

如果考虑到插入数据的主键不作为其他表插入数据的外键使用，那么可以考虑使用这种方式。

1. Oracle Sequence 配置

        <sql id='TABLE_NAME'>TEST_USER</sql>
        <sql id='TABLE_SEQUENCE'>SEQ_TEST_USER_ID.nextval</sql>
    
        <!-- 注意这里直接调用sequence的nextval函数 -->
        <insert id="insert" parameterType="User">
            insert into <include refid="TABLE_NAME" /> (ID,NAME,AGE)
		        values ( <include refid="TABLE_SEQUENCE" /> ,#{name}, #{age} )
        </insert>

    当插入语句如上配置时，那么针对如下语句

        User user = new User();
        user.setName("test");
        user.setAge(24);
    
        userMapper.insert(user);
        System.out.println(user.id); // user.id 为空

    `user.id`为空，也就是说如上的配置并不能在完成插入操作后将插入时的主键值存放到保存的对象中。

2. Mysql自增主键配置

    由于mysql数据库中，可以设置表的主键为自增，所以对于Mysql数据库在mybatis配置插入语句时，不指定插入ID字段即可。主键的自增交由Mysql来管理。

        <sql id='TABLE_NAME'>TEST_USER</sql>
       
        <!-- 注意这里的插入SQL中是没有指明ID字段的！ -->
        <insert id="insert" parameterType="User">
            insert into <include refid="TABLE_NAME" /> (NAME,AGE)
    	        values (#{name}, #{age} )
        </insert>
    
    同样，针对Mysql如此配置mybaits，插入完成后`user.id`为空。
    
    
##插入后获取自增主键值
    
上述的情况能满足大部分情况，但有时候我们会遇到类似一对多的那种表结构，在插入多端数据时，需要获取刚刚保存了的一段的主键。那么这个时候，上述的配置就无法满足需要了。为此我们需要使用mybatis提供的`<selectKey />`来单独配置针对自增逐渐的处理。

1. Oracle Sequence 配置

        <sql id='TABLE_NAME'>TEST_USER</sql>
        <sql id='TABLE_SEQUENCE'>SEQ_TEST_USER_ID.nextval</sql>
    
        <!-- 注意这里需要先查询自增主键值 -->
        <insert id="insert" parameterType="User">
            <selectKey keyProperty="id" resultType="int" order="BEFORE">
    		    select <include refid="TABLE_SEQUENCE" /> from dual
		    </selectKey>
            insert into <include refid="TABLE_NAME" /> (ID,NAME,AGE)
    	        values ( #{id}, #{name}, #{age} )
        </insert>

    当使用了`<selectKey />`后，在实际的插入操作时，mybatis会执行以下两句SQL:

        select SEQ_TEST_USER_ID.nextval from dual; // 语句1
        insert into (ID,NAME,AGE) values ( ?, ?, ? ); // 语句2
    
    在执行插入 *语句2* 之前，会先执行 *语句1* 以获取当前的ID值，然后mybatis使用反射调用`User`对象的`setId`方法，将 *语句1* 查询出的值保存在`User`对象中，然后才执行 *语句2* 这样就保证了执行完插入后

        User user = new User();
        user.setName("test");
        user.setAge(24);
    
        userMapper.insert(user);
        System.out.println(user.id); // user.id 不为空

    `user.id`是有值的。

2. Mysql自增主键配置
    
    由于Mysql的自增主键是有Mysql自己维护的，因此为了获取插入的自增主键值，需要通过SQL语句

        select LAST_INSERT_ID();

    来获取的。因此针对Mysql的配置就如下：
    
        <sql id='TABLE_NAME'>TEST_USER</sql>
        
        <!-- 注意这里需要先查询自增主键值 -->
        <insert id="insert" parameterType="User">
            <selectKey keyProperty="id" resultType="int" order="BEFORE">
        	    SELECT LAST_INSERT_ID()
		    </selectKey>
            insert into <include refid="TABLE_NAME" /> (ID,NAME,AGE)
    	    	values ( #{id}, #{name}, #{age} )
        </insert>
    
##小结

1. 当数据插入操作不关心插入后数据的主键（唯一标识），那么建议使用 *不返回自增主键值* 的方式来配置插入语句，这样可以**避免额外的SQL开销**.

2. 当执行插入操作后需要立即获取插入的自增主键值，比如一次操作中保存一对多这种关系的数据，那么就要使用 *插入后获取自增主键值* 的方式配置.