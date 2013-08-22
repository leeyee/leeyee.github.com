---
layout: post
title: mybatis分页的简单实现
description: 本文主要介绍通过mybatis拦截器依据正则表达式拦截相应的查询语句，同时依赖mybatis的RowBounds对象传递分页参数，依次来简单的实现mybatis的物理分页效果。
category: mybatis
tag: [mybatis]
keywords: [mybatis分页, ibatis分页, mybatis rowbounds分页]
---

最近的项目中使用到了`mybatis`，发现`mybatis`不支持物理分页，只支持内存分页。因此为了解决这个问题，在网上搜索了一番，不过都比较繁琐。最后使用正则表达过滤查询语句的方式简单解决了该问题.

`mybatis`物理分页的核心是使用`mybatis`的拦截器 `org.apache.ibatis.plugin.Interceptor` ,在`mybatis`准备好`SQL`的时候，对`SQL`字符串进行拦截，生成适合`Oracle`数据库的分页语句即可。废话不多讲了，直接上代码.

<div class="alert alert-error">
<strong>Notes: </strong> 该部分依赖commons-lang3.jar包进行反射写入，也可使用 mybatis 自带的反射类实现这部分功能
</div>

###拦截器代码

    package org.mybatis.test.interceptor;
    
	import java.sql.Connection;
	import java.util.*;
	
	import org.apache.commons.lang3.StringUtils;
	import org.apache.commons.lang3.reflect.FieldUtils;
	import org.apache.ibatis.executor.statement.StatementHandler;
	import org.apache.ibatis.mapping.BoundSql;
	import org.apache.ibatis.plugin.*;
	import org.apache.ibatis.session.RowBounds;
	
	@Intercepts(@Signature(type = StatementHandler.class, method = "prepare", args = { Connection.class }))
	public class PaginationInterceptor implements Interceptor {
	
		private final static String SQL_SELECT_REGEX = "(?is)^\\s*SELECT.*$";
		private final static String SQL_COUNT_REGEX = "(?is)^\\s*SELECT\\s+COUNT\\s*\\(\\s*(?:\\*|\\w+)\\s*\\).*$";
	
		//@Override
		public Object intercept(Invocation inv) throws Throwable {
	
			StatementHandler target = (StatementHandler) inv.getTarget();
	
			BoundSql boundSql = target.getBoundSql();
	
			String sql = boundSql.getSql();
	
			if (StringUtils.isBlank(sql)) {
				return inv.proceed();
			}
			System.out.println("origin sql>>>>>" + sql.replaceAll("\n", ""));
	
			// 只有为select查询语句时才进行下一步
			if (sql.matches(SQL_SELECT_REGEX)
					&& !Pattern.matches(SQL_COUNT_REGEX, sql)) {
	
				Object obj = FieldUtils.readField(target, "delegate", true);
				// 反射获取 RowBounds 对象。
				RowBounds rowBounds = (RowBounds) FieldUtils.readField(obj,
						"rowBounds", true);
						
				// 分页参数存在且不为默认值时进行分页SQL构造
				if (rowBounds != null && rowBounds != RowBounds.DEFAULT) {
					FieldUtils.writeField(boundSql, "sql", newSql(sql, rowBounds),
							true);
					System.out.println("new sql>>>>>"
							+ boundSql.getSql().replaceAll("\n", ""));
	
					// 一定要还原否则将无法得到下一组数据(第一次的数据被缓存了)
					FieldUtils.writeField(rowBounds, "offset",
							RowBounds.NO_ROW_OFFSET, true);
					FieldUtils.writeField(rowBounds, "limit",
							RowBounds.NO_ROW_LIMIT, true);
				}
			}
			return inv.proceed();
		}
	
		public String newSql(String oldSql, RowBounds rowBounds) {
			String start = " SELECT * FROM   (SELECT   row_.*, ROWNUM rownum_ FROM ( ";
			String end = " ) row_ WHERE   ROWNUM <= " + rowBounds.getLimit()
					+ ") WHERE   rownum_ > " + rowBounds.getOffset();
	
			return start + oldSql + end;
		}
	
		//@Override
		public Object plugin(Object target) {
			return Plugin.wrap(target, this);
		}
	
		//@Override
		public void setProperties(Properties arg0) {
			System.out.println(arg0);
		}
	    
        //测试正则表达式是否能正常工作
		public static void main(String[] args) {
			String SQL_SELECT_REGEX = "^\\s*SELECT.*$";
			String SQL_COUNT_REGEX = "^\\s*SELECT\\s+COUNT\\s*\\(\\s*(?:\\*|\\w+)\\s*\\).*$";
			List<String> tests = new ArrayList<String>();
			tests.add("select count(*) from abc \n\t\t where\n abc");
			tests.add("SELECT 	COUNT(*) from abc");
			tests.add(" select count  (*) from abc");
			tests.add("  select count(  *) from abc");
			tests.add("select count( *  ),id   from abc");
			tests.add("select * from abc");
			tests.add("select abc,test,fdas from abc");
			tests.add("select count(adb) from abc");
			tests.add("select count(0) from abc");
			tests.add("select min(count(*)) from abc");
			tests.add("update min(count(*)) from abc");
			tests.add("delete min(count(*)) from abc");
			Pattern p1 = Pattern.compile(SQL_SELECT_REGEX, Pattern.DOTALL
					| Pattern.CASE_INSENSITIVE);
			Pattern p2 = Pattern.compile(SQL_COUNT_REGEX, Pattern.DOTALL
					| Pattern.CASE_INSENSITIVE);
			for (String str : tests) {
				Matcher m1 = p1.matcher(str);
				Matcher m2 = p2.matcher(str);
				System.out.println("匹配字符串: " + str);
				System.out.println("	是select语句? " + m1.matches());
				System.out.println("	是count语句? " + m2.matches());
				System.out.println();
			}
		}
	}

###在spring中配置拦截器

    <bean name="paginationInterceptor" class="org.mybatis.test.interceptor.PaginationInterceptor"></bean>

	<!-- define the SqlSessionFactory -->
	<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
		<property name="dataSource" ref="dataSource" />
		<property name="typeAliasesPackage" value="org.mybatis.test.domain" />
		<property name="plugins">
			<list>
				<ref bean="paginationInterceptor" />
			</list>
		</property>
	</bean>

###使用
	
	public class Test(){
		private String name;
		private int age;
		// set/get省
	}

1. 在TestMapper.java接口类中声明分页方法
	
	    //统计总条数
	    int countByVo(Test test)；
	    //分页查询
	    List<T> queryByVo(RowBounds rowBound, Test test);

2. TestMapper.xml中

	    <select id="countByVo" parameterType="Test" resultType="int">
		    select count(*) as count from table_test
		    <where>
			    <if test="name != null">name like '' || #{name} || '%'</if>
		    </where>
	    </select>

	    <select id="queryByVo" parameterType="Test" resultType="Test">
		    select * from table_test
		    <where>
			    <if test="name != null">name like '' || #{name} || '%'</if>
		    </where>
	    </select>	

3. 业务层代码
	
	    @Autowired
	    private TestMapper testMapper;  
     
	    /**
	      * @param offset 起始位置
          * @param limit 结束位置
	      */
	    public void queryByVo(int offset, int limit) {
		    Test test = new Test();
		    List<User> list = this.testMapper.queryByVo(new RowBounds(offset, limit), test);
	    }	