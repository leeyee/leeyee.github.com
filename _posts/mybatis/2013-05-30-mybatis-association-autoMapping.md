---
layout: post
title: 使用autoMapping配置关联关系时应注意的问题
description: 利用`association`解决多对一、一对一问题时，在配置`resultMap`时使用`autoMapping`属性映射表字段时，生成的多端对象数据中是拿不到声明的外键的。如果业务有需要在多的一端对象中直接获取外键属性，而不是通过对应的一端来获取，那么就需要在使用`autoMapping`时，重新为多端表指明主外键映射关系或者撇弃`autoMapping`而改用手工声明。
category: mybatis
tag: [mybatis]
keywords: [mybatis autoMapping, 使用autoMapping配置关联关系时应注意的问题]
---

利用`association`解决多对一、一对一问题时，在配置`resultMap`时使用`autoMapping`属性映射表字段时，生成的多端对象数据中是拿不到声明的外键的。
  
如果业务有需要在多的一端对象中直接获取外键属性，而不是通过对应的一端来获取，那么就需要在使用`autoMapping`时，重新为多端表指明主外键映射关系或者撇弃`autoMapping`而改用手工声明。

假设我们有两张表:

1. Blog(**id**,_authorid_,name,context,create_time)

2. Author(**id**,name,age)

这两张表间的关系为`ManyToOne`,其中`Blog.authorid`对应`Author.id`

对应的`javaBean`为：

    public class Blog {
        private int id;
        private String name;
        private String context;
        private Integer authorid;
        private Author author;
        // some set or get method
    }
    public class Author {
        private int id;
        private String name;
        private int age;
        // some set or get method
    }

接着我们需要给SQL

    select a.*,b.id as bid,b.name as bname,b.age from Blog a left join Author b on a.authorid = b.id
    
配置`mybatis` Mapper映射文件BlogMapper，那么通常我们的配置如下

    <resultMap type= "Blog" id="blogResultMap" autoMapping ="true">
        <!-- manyToOne -->
        <association property ="author" column="authorid" javaType= "Author">
            <id property ="id" column="bid" />
            <!-- 或者使用
                <id property ="id" column="authorid" />
            -->
            <result property ="name" column="bname" />
            <result property ="age" column="age" />
        </association>
    </resultMap>

    <select id="queryByVo" parameterType="Blog" resultMap="blogResultMap">
        select a.*,b.id as bid,b.name as bname,b.age from Blog a left join Author b on a.authorid = b.id
	</select>

当我们使用了

    List<Blog> blogs = blogService.queryByVo(new Blog());
    
后，就可以通过`blog.author`获取`Author`对象了。这里需要注意的一点是，虽然我们在`Blog`对象中设置了`authorid`属性,并且也在`resultMap`标签中使用了`autoMapping`，但在查询出的`blog`中通过`blog.authorid`是获取不到值的，只能通过`blog.author.id`来获取`authorid`.可见`autoMapping`并未自动映射`authorid`属性。

那么如果想直接通过`Blog`对象获取`authorid`该怎么办呢？有两种办法来处理：

1. 使用`autoMapping = "true"`时，mybatis 默认规则不在多端映射外键属性，通过多端只能获取一端的对象。因此我们需要在使用`autoMapping = "true"`时补充一些映射规则

        <resultMap type= "Blog" id="blogResultMap" autoMapping ="true">
            <id property="id" column="id" />  <!-- 注释:1  -->
            <!-- 或者 <result property="id" column="id" /> -->
            <result property="authorid" column="authorid" />  <!-- 注释:2 -->
            <!-- manyToOne -->
            <association property ="author" column="authorid" javaType= "Author">
                <id property ="id" column="bid" />
                <!-- 或者使用
                    <id property ="id" column="authorid" />
                -->
                <result property ="name" column="bname" />
                <result property ="age" column="age" />
            </association>
        </resultMap>

    <div class="alert alert-error">
    <strong>Notes:</strong>
	如果只设置了<b>‘注释:2’</b>，那么将只能获取 Blog 表中相同 authorid 的第一条信息,因此这里需要重新覆盖主键和外键的映射.
	</div>

2. 不使用`autoMapping`属性，直接手工配置

        <resultMap type= "Blog" id="blogResultMap">
            <id property="id" column="id" />
            <result property="authorid" column="authorid" />
    	    <result property="name" column="name" /> 
		    <result property="context" column="context" />
            <!-- manyToOne -->
            <association property ="author" column="authorid" javaType= "Author">
                <id property ="id" column="bid" />
                <!-- 或者使用
                    <id property ="id" column="authorid" />
                -->
                <result property ="name" column="bname" />
                <result property ="age" column="age" />
            </association>
        </resultMap>
  
  	很显然这种方式下，如果需要映射的表字段过多，那么就需要点体力了！


改用上述方式后及可以直接在`Blog`对象中直接获取`authorid`属性了。