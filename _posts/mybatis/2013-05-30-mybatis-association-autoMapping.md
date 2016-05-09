---
layout: post
title: 使用autoMapping配置关联关系时应注意的问题
description: 利用`association`解决多对一、一对一问题时，在配置`resultMap`时使用`autoMapping`属性映射表字段时，生成的多端对象数据中是拿不到声明的外键的。如果业务有需要在多的一端对象中直接获取外键属性，而不是通过对应的一端来获取，那么就需要在使用`autoMapping`时，重新为多端表指明主外键映射关系或者撇弃`autoMapping`而改用手工声明。
category: mybatis
tag: [mybatis]
---

* TOC
{:toc}

利用 **association** 解决多对一、一对一问题时，在配置 **resultMap** 时使用 ***autoMapping*** 属性映射表字段时，生成的多端对象数据中是拿不到声明的外键的。
  
如果业务有需要在多的一端对象中直接获取外键属性，而不是通过对应的一端来获取，那么就需要在使用 **autoMapping** 时，重新为多端表指明主外键映射关系或者撇弃 ***autoMapping*** 而改用手工声明。

首先做如下定义：

表结构：

> Blog(**id**, *authorid*, name, context, create_time)

> Author(**id**, name, age)

这两张表间的关系为 **ManyToOne**，其中 *Blog.authorid* 对应 *Author.id* 

Blog.java

    public class Blog {
        private int id;
        private String name;
        private String context;
        private Integer authorid;
        private Author author;
        // some set and get method
    }
   
Author.java

    public class Author {
        private int id;
        private String name;
        private int age;
        // some set and get method
    }

实现关联查询的SQL语句为：

    select a.*,b.id as bid,b.name as bname,b.age from Blog a left join Author b on a.authorid = b.id
     
针对如上信息编写 BlogMapper.xml 如下：

    <resultMap type= "Blog" id="blogResultMap" autoMapping ="true">
	    <id property="id" column="id"/> <!-- 注释:1 -->
        <!-- manyToOne -->
        <association property ="author" column="authorid"  javaType="Author">
            <id property ="id" column="bid" />
            <!-- 或者使用 <id property ="id" column="authorid" /> -->
            <result property ="name" column="bname" />
            <result property ="age" column="age" />
        </association>
    </resultMap>

    <select id="queryByVo" parameterType="Blog" resultMap="blogResultMap">
        select a.*,b.id as bid,b.name as bname,b.age from Blog a left join Author b on a.authorid = b.id
	</select>

当使用

    List<Blog> blogs = blogService.queryByVo(new Blog());
    
后，就可以通过 *blog.author* 获取 `Author` 对象了。这里需要注意的一点是，虽然我们在`Blog` 对象中设置了 *authorid* 属性,并且也在 **resultMap** 标签中使用了 ***autoMapping*** ，但在查询出的`Blog`中通过 *blog.authorid* 是获取不到值的，只能通过 *blog.author.id* 来获取 *authorid* 。可见 

> ***autoMapping*** 并未自动映射外键属性（也就是 *authorid* 字段）。

那么如果想直接通过`Blog`对象获取 *authorid* 该怎么办呢？有两种办法来处理：

1. 使用 ***autoMapping = "true"*** 时，**mybatis 默认规则不在多端映射外键属性，通过多端只能获取一端的对象**。因此我们需要在使用 ***autoMapping = "true"*** 时补充一些映射规则

	        <resultMap type= "Blog" id="blogResultMap" autoMapping ="true">
	            <id property="id" column="id" /> 
	            <result property="authorid" column="authorid" />
	            <!-- manyToOne -->
	            <association property ="author" column="authorid" javaType= "Author">
	                <id property ="id" column="bid" />
	                <!-- 或者使用 <id property ="id" column="authorid" />  -->
	                <result property ="name" column="bname" />
	                <result property ="age" column="age" />
	            </association>
	        </resultMap>
	 
2. 不使用 ***autoMapping*** 属性，直接手工配置

        <resultMap type= "Blog" id="blogResultMap">
            <id property="id" column="id" />
            <result property="authorid" column="authorid" />
    	    <result property="name" column="name" /> 
		    <result property="context" column="context" />
            <!-- manyToOne -->
            <association property ="author" column="authorid" javaType= "Author">
                <id property ="id" column="bid" />
                <!-- 或者使用  <id property ="id" column="authorid" /> -->
                <result property ="name" column="bname" />
                <result property ="age" column="age" />
            </association>
        </resultMap>
  
  	很显然这种方式下，如果需要映射的表字段过多，那么就需要点体力了！