---
layout: post
title: Spring3 表达式语言(SpEL)介绍
description: 本文主要介绍Spring3表达式语言(SpEL)的相关功能
category: spring
tag: [spring]
---

[Spring Expression Language (SpEL)](http://static.springsource.org/spring/docs/3.0.0.M3/reference/html/ch07.html)语言支持在运行时操作和查询对象，其语法类似统一的EL语言，但是[SpEL]提供了额外的功能。[SpEL]支持以下功能：

* TOC
{:toc}

使用SpEl进行表达式操作，基本操作如下：

第一步，构建解析

    ExpressionParser parser = new SpelExpressionParser();

第二步，使用表达式进行解析

    Expression exp = parser.parseExpression( SpEl);

第三步，获取结果

    exp.getValue()


## 2.1 文本表达式

文本表达式支持字符表达式、日期、数字（正数、实数及十六进制数）、布尔类型及null.其中字符表达式需要用单引号声明。

对数字支持负数、指数及小数。默认情况下实数使用`Double.parseDouble()`进行表达式类型转换

    String[] lELs = { "'hello SpEL'", "1.028E+7", "0x12EF", "true", "null" };
    assertEquals("hello SpEL",
			exp.parseExpression(lELs[0]).getValue(String.class));
	assertEquals(new Double(10280000), exp.parseExpression(lELs[1])
			.getValue(Double.class));
	assertEquals(new Integer(4847),
			exp.parseExpression(lELs[2]).getValue(Integer.class));
	assertTrue(exp.parseExpression(lELs[3]).getValue(Boolean.class));
	assertNull(exp.parseExpression(lELs[4]).getValue());

## 2.2 属性、数组、列表、字典(map)及索引

在表达式中访问类属性时直接使用属性名，属性名首字母大小写均可。

访问数组时可以使用[index]进行元素对象范围。

访问列表时，可直接使用类表的方法，通过点操作符

    // 属性测试。time为SpElUtil类Date型数据，这里调用Date的属性Year
    assertEquals(new Integer(2011), exp.parseExpression("time.Year + 1900")
			.getValue(secontext, Integer.class));

	// 属性测试。innerClass为SpElUtil类中引入的其他类。
	assertEquals(29,
			exp.parseExpression("innerClass.age").getValue(secontext));

	// 设置SpElUtil类的numbers属性
	spel.setNumbers(Arrays.asList(2, 3, 4, 5, 6, 7, 9));

	// 访问对象属性数组通过索引
	assertEquals(2, exp.parseExpression("numbers[0]").getValue(secontext));

	// 访问map
	assertEquals("string1",
			exp.parseExpression("maps[1]")
					.getValue(secontext, String.class));


## 2.3 内置列表

列表可以直接表示在表达式中使用`{}`符号表达。`{}`本身代表一个空的`list`

    // 构造list
	List<String> nums = (List<String>) exp.parseExpression(
			"{'a','b','c','d'}").getValue();
	assertEquals(Arrays.asList("a", "b", "c", "d"), nums);
    
	// 构造List<List<>>
	List listOfLists = (List) exp.parseExpression("{ {1,2},{3,4} }")
			.getValue(secontext);
	assertEquals(Arrays.asList(1, 2), listOfLists.get(0));


## 2.4 数组构造(spring3.0.3中会抛出异常)

可以通过熟悉的java语法在表达是语言中定义。但目前不支持定义一个初始化的多维数组

    // 创建没有初始值的数组
	int[] a = (int[]) exp.parseExpression("new int[4]").getValue();
	assertEquals(4, a.length);
    
	// 创建带有初始值的数组
	int[] b = (int[]) exp.parseExpression("new int[4]{1,2,3,4}").getValue();
	assertEquals(3, b[2]);
    
	// 创建二维数组
	int[][] c = (int[][]) exp.parseExpression("new int[4][5]").getValue();
	assertEquals(4, c.length);
	assertEquals(5, c[0].length);

## 2.5 方法调用

表达式中的方法调用遵循java语法。
    	
    assertEquals(
			"abC2def",
			exp.parseExpression("'abcdef'.replace('c','C2')").getValue(
						String.class));

	// 自定义类方法测试
	assertFalse(exp.parseExpression("innerClass.isGt30ForAge()").getValue(
			secontext, Boolean.class));
	spel.getInnerClass().setAge(34);
	assertTrue(exp.parseExpression("innerClass.isGt30ForAge()").getValue(
			secontext, Boolean.class));
		
				
## 2.6 操作符

### 2.6.1 关系操作符

支持`eq("==")`、`ne("!=")`、`le("<=")`、`lt("<")`、`gt(">")`、`ge(">=")`、`div("/")`、`mod("%")`、`not("!")`、正则表达式及`instanceof`操作

	assertTrue(exp.parseExpression("1 == 1").getValue(Boolean.class));
	assertTrue(exp.parseExpression("1 eq 1").getValue(Boolean.class));
	assertTrue(exp.parseExpression("1 > -1").getValue(Boolean.class));
	assertTrue(exp.parseExpression("1 gt -1").getValue(Boolean.class));
	assertTrue(exp.parseExpression("'a' < 'b'").getValue(Boolean.class));
	assertTrue(exp.parseExpression("'a' lt 'b'").getValue(Boolean.class));
	assertTrue(exp.parseExpression(
			" new Integer(123) instanceof T(Integer) ").getValue(
			Boolean.class));
	assertTrue(exp.parseExpression("'5.00' matches '^-?\\d+(\\.\\d{2})?$'")
				.getValue(Boolean.class));
				
### 2.6.2 逻辑操作符

逻辑操作符支持`and`,`or`,`not`

    assertTrue(exp.parseExpression("true and true").getValue(Boolean.class));

### 2.6.3 数学运算操作符

加法运算符可以用于数字，字符串和日期。减法可以用在数字和日期。乘法和除法只能用于对数字。其他受支持的数学运算是模数（％）和指数幂（^）。运行顺序按标准运算符优先级执行

    assertEquals(25.0,
    		exp.parseExpression("1 + 2 * 8 div 4 mod 2 + 2 ^ 3 * 3e0")
					.getValue());

## 2.7 赋值操作

通过赋值操作进行属性设置。通常是调用`setValue`方法，但也可以在调用`getValue`时设置。

    Date oldDate = spel.getTime();// 获取当前time属性值
    exp.parseExpression("time").setValue(secontext, new Date(113, 2, 25)); // 为time属性重新赋值
	Date newDate = spel.getTime();// 获取赋值后的time属性值
	assertEquals(2013,
			exp.parseExpression("time.Year + 1900").getValue(secontext));
	assertNotSame(oldDate, newDate);

	// 或者使用下属方法赋值
	assertEquals("abc",
			exp.parseExpression("Name = 'abc'").getValue(secontext));
				
## 2.8 类型

通过特殊的`T`操作符可以用来指定一个`java.lang.Class`的实例。在实例话对象的静态方法将会被调用。

    Class dateClass = exp.parseExpression("T(java.util.Date)").getValue(Class.class);
	assertEquals("java.util.Date", dateClass.getName());
	assertTrue(exp
			.parseExpression(
					"T(java.math.RoundingMode).CEILING < T(java.math.RoundingMode).FLOOR")
			.getValue(Boolean.class));		
	
### 2.9 构造器

构造器通过`new`操作被调用。在`new`操作时需要指明类的完全类名(包括包路径)

    SpelTestInnerClass spt = exp
    		.parseExpression(
					"new  leeyee.study.spring3.bean.SpelTestInnerClass('constructTest',23)")
			.getValue(SpelTestInnerClass.class);
				
## 2.10 变量

变量可以通过 `#变量名` 在表达式中被引用。变量通过`StandardEvaluationContext`类的`setVariable`方法进行设置

    List<Integer> list = new ArrayList<Integer>();
    list.addAll(Arrays.asList(2, 3, 4, 5, 6, 7, 9));

	secontext.setVariable("list", list);
	List<Integer> vList = (List<Integer>) exp.parseExpression("#list")
			.getValue(secontext);
	assertEquals(vList, list);
		
### 2.10.1 `#this`变量

变量`#this`被定义为当前操作对象的引用。

    List<Integer> nums = (List<Integer>) exp.parseExpression(
    		"#list.?[#this >5]").getValue(secontext); // 获取值大于5的元素集合
	assertEquals(nums, Arrays.asList(6, 7, 9));
		
## 2.11 用户自定义函数

你可以扩展[SpEL]通过注册自定义函数。注册后的函数可以在表达式中通过其名称进行调用。函数的注册是通过`StandardEvaluationContext`类的`registerFunction`方法进行声明

    context.registerFunction("len", SpElUtil.class.getDeclaredMethod("len",
			new Class[] { String.class }));
	assertEquals(3, exp.parseExpression("#len('abc')").getValue(context));
		
## 2.12 三元操作

    assertTrue(exp.parseExpression(" true ? true :false").getValue(
			Boolean.class));
				
## 2.13 Elvis操作

`Elvis`操作是一个短的三元操作符语法，通常在[Groovy]语言中使用。

> **Note:** `Elvis`操作在表达式中可以用来生成默认值，当被访问属性为空时。比如`@Value`

    @Value("#systemPro['mail.port'] ? : 25}")
	// 当mail.port为空时将默认为25
	Expression ex = exp.parseExpression("name?:'name is null'");
	assertEquals("override", ex.getValue(secontext, String.class));
	spel.setName(null);
	assertEquals("name is null", ex.getValue(secontext, String.class));
	spel.setName("override");
		
### 2.14 安全导航操作

该操作是为避免空指针异常。他是来自[Groovy]语言的。典型的当你有一个指向对象的引用，在你访问其方法或属性时，可能需要验证该对象的方法或属性是否为空，为了避免验证，使用安全导航操作将简单的返回`null`而不是空指针异常。

    assertEquals("innerClass", exp.parseExpression("innerClass?.name")
			.getValue(secontext, String.class));
	spel.setInnerClass(null);
	// 使用这种表达式可以避免抛出空指针异常
	assertNull(exp.parseExpression("innerClass?.name").getValue(secontext,
			String.class));

## 2.15 集合选择

选择是一个强大的表达式语言属性，可以使用选择表达式过滤源集合，从而生成一个新的符合选择条件的集合

选择的语法为`?[selectionExpression]`。他将过滤集合并且返回一个新的集合（原集合的子集）。选择语句也可用在Map中，过滤keySet及valueSet分别使用key和value关键字。另外：选择语法中，选择符合条件的结果集的第一个元素的语法为 `^[selectionExpression]`，选择最后一个元素的语法为`$[selectionExpression]`

    spel.setNumbers(Arrays.asList(2, 3, 4, 5, 6, 7, 9));

	List<Integer> nums = (List<Integer>) exp.parseExpression(
			"numbers.?[#this >5]").getValue(secontext);
	assertEquals(nums, Arrays.asList(6, 7, 9));
    
	// 获取第一个元素
	assertEquals(6,
			exp.parseExpression("numbers.^[#this > 5]").getValue(secontext));
            
	// 获取最后一个元素
	assertEquals(9,
			exp.parseExpression("numbers.$[#this > 5]").getValue(secontext));

	Map<Integer, String> maps = (Map<Integer, String>) exp.parseExpression(
			"maps.?[value == 'string3' ]").getValue(secontext);
	Map<Integer, String> tmap = new HashMap<Integer, String>();
	tmap.put(3, "string3");
	assertEquals(maps, tmap);

	Map<Integer, String> mapk = (Map<Integer, String>) exp.parseExpression(
			"maps.?[key > 2 and key < 4 ]").getValue(secontext);
	assertEquals(mapk, tmap);
		
## 2.16 集合投影

语法`![projectionExpression]`判断集合中每个元素是否符合语法要求

    assertEquals(Arrays.asList(5, 6, 7, 8, 9), exp
			.parseExpression("numbers.![#this+3]").getValue(secontext));

## 2.17 模板表达式

表达式模板允许混合文字表达式，一个或多个值计算块。每一个值计算块被声明通过可被自定义的前缀和后缀，一般选择使用`#{}`作为一个定界符。

	assertEquals(
			" this is a test 4",
			exp.parseExpression(" this is a test #{ maps.![key].get(3)}",
					new TemplateParserContext()).getValue(secontext,
					String.class));
                    
## 一大段测试用例

    import static org.junit.Assert.*;
	import java.util.*;
	import org.junit.*;

	import org.springframework.context.ApplicationContext;
	import org.springframework.expression.Expression;
	import org.springframework.expression.ExpressionParser;
	import org.springframework.expression.common.TemplateParserContext;
	import org.springframework.expression.spel.standard.SpelExpressionParser;
	import org.springframework.expression.spel.support.StandardEvaluationContext;

	import study.spring.context.factory.ApplicationContextFactory;

	public class SpElUtilTest {
		// spring配置文件上下文
		ApplicationContext context = null;
		// spring el测试辅助类
		SpElUtil spel = null;
		// 表达式解析对象
		ExpressionParser exp = null;
		// 标准赋值上下文
		StandardEvaluationContext secontext;

		@Before
		public void setUp() throws Exception {
			context = ApplicationContextFactory.createInstance();
			spel = context.getBean(SpElUtil.class);
			secontext = new StandardEvaluationContext(spel);
			exp = new SpelExpressionParser();
		}

		@After
		public void tearDown() throws Exception {
			context = null;
			spel = null;
			secontext = null;
			exp = null;
		}

		/**
		 * 文字表达式测试用例
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpELLiteralExpression() throws Exception {
			// 定义各种文字表达式
			String[] lELs = { "'hello SpEL'", "1.028E+7", "0x12EF", "true", "null" };
			assertEquals("hello SpEL",
					exp.parseExpression(lELs[0]).getValue(String.class));
			assertEquals(new Double(10280000), exp.parseExpression(lELs[1])
					.getValue(Double.class));
			assertEquals(new Integer(4847),
					exp.parseExpression(lELs[2]).getValue(Integer.class));
			assertTrue(exp.parseExpression(lELs[3]).getValue(Boolean.class));
			assertNull(exp.parseExpression(lELs[4]).getValue());
		}

		/**
		 * 访问属性、数组、集合和 map 测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpELProOrArrayOrIndexEtcExpression() throws Exception {
			// 属性测试。time为SpElUtil类Date型数据，这里调用Date的属性Year
			assertEquals(new Integer(2011), exp.parseExpression("time.Year + 1900")
					.getValue(secontext, Integer.class));

			// 属性测试。innerClass为SpElUtil类中引入的其他类。
			assertEquals(29,
					exp.parseExpression("innerClass.age").getValue(secontext));

			// 设置SpElUtil类的numbers属性
			spel.setNumbers(Arrays.asList(2, 3, 4, 5, 6, 7, 9));

			// 访问对象属性数组通过索引
			assertEquals(2, exp.parseExpression("numbers[0]").getValue(secontext));

			// 访问map
			assertEquals("string1",
					exp.parseExpression("maps[1]")
							.getValue(secontext, String.class));

		}

		/**
		 * 内联list测试
		 * 
		 * @throws Exception
		 */
		@SuppressWarnings({ "unchecked", "rawtypes" })
		@Test
		public void testSpELInnerListExpression() throws Exception {
			// 构造list
			List<String> nums = (List<String>) exp.parseExpression(
					"{'a','b','c','d'}").getValue();
			assertEquals(Arrays.asList("a", "b", "c", "d"), nums);
			// 构造List<List<>>
			List listOfLists = (List) exp.parseExpression("{ {1,2},{3,4} }")
					.getValue(secontext);
			assertEquals(Arrays.asList(1, 2), listOfLists.get(0));
		}

		/**
		 * Array 构造测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpELArrayConstructionExcpression() throws Exception {
			// 创建没有初始值的数组
			int[] a = (int[]) exp.parseExpression("new int[4]").getValue();
			assertEquals(4, a.length);
			// 创建带有初始值的数组
			int[] b = (int[]) exp.parseExpression("new int[4]{1,2,3,4}").getValue();
			assertEquals(3, b[2]);
			// 创建二维数组
			int[][] c = (int[][]) exp.parseExpression("new int[4][5]").getValue();
			assertEquals(4, c.length);
			assertEquals(5, c[0].length);
		}

		/**
		 * 方法表达式测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpELMethodExcpression() throws Exception {
			// String.replace方法测试
			assertEquals(
					"abC2def",
					exp.parseExpression("'abcdef'.replace('c','C2')").getValue(
							String.class));

			// 自定义类方法测试
			assertFalse(exp.parseExpression("innerClass.isGt30ForAge()").getValue(
					secontext, Boolean.class));
			spel.getInnerClass().setAge(34);
			assertTrue(exp.parseExpression("innerClass.isGt30ForAge()").getValue(
					secontext, Boolean.class));
		}

		/**
		 * 操作符、正则表达式测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpElOperatorAndRegExpression() throws Exception {
			// 关系操作
			assertTrue(exp.parseExpression("1 == 1").getValue(Boolean.class));
			assertTrue(exp.parseExpression("1 eq 1").getValue(Boolean.class));
			assertTrue(exp.parseExpression("1 > -1").getValue(Boolean.class));
			assertTrue(exp.parseExpression("1 gt -1").getValue(Boolean.class));
			assertTrue(exp.parseExpression("'a' < 'b'").getValue(Boolean.class));
			assertTrue(exp.parseExpression("'a' lt 'b'").getValue(Boolean.class));
			assertTrue(exp.parseExpression(
					" new Integer(123) instanceof T(Integer) ").getValue(
					Boolean.class));
			assertTrue(exp.parseExpression("'5.00' matches '^-?\\d+(\\.\\d{2})?$'")
					.getValue(Boolean.class));
			// 逻辑操作
			assertTrue(exp.parseExpression("true and true").getValue(Boolean.class));
			assertTrue(exp.parseExpression("true or false").getValue(Boolean.class));
			assertFalse(exp.parseExpression("innerClass.isGt30ForAge() and false ")
					.getValue(secontext, Boolean.class));
			assertFalse(exp.parseExpression("!innerClass.isGt30ForAge() and true ")
					.getValue(secontext, Boolean.class));
			assertTrue(exp.parseExpression("!false").getValue(Boolean.class));
			// 运算操作
			assertEquals(2, exp.parseExpression("1 + 1").getValue());
			assertEquals("ABab",
					exp.parseExpression("'AB' + 'ab'").getValue(String.class));
			assertEquals(25.0,
					exp.parseExpression("1 + 2 * 8 div 4 mod 2 + 2 ^ 3 * 3e0")
							.getValue());
			assertEquals(exp.parseExpression("1 + 2 * 8 / 4 % 2 + 2 ^ 3 ")
					.getValue(),
					exp.parseExpression("1 + 2 * 8 div 4 mod 2 + 2 ^ 3 ")
							.getValue());
		}

		/**
		 * 赋值表达式测试
		 * 
		 * @throws Exception
		 */
		@SuppressWarnings("deprecation")
		@Test
		public void testSpelAssignmentExpression() throws Exception {
			Date oldDate = spel.getTime();// 获取当前time属性值
			exp.parseExpression("time").setValue(secontext, new Date(113, 2, 25)); // 为time属性重新赋值
			Date newDate = spel.getTime();// 获取赋值后的time属性值
			assertEquals(2013,
					exp.parseExpression("time.Year + 1900").getValue(secontext));
			assertNotSame(oldDate, newDate);

			// 或者使用下属方法赋值
			assertEquals("abc",
					exp.parseExpression("Name = 'abc'").getValue(secontext));

			// 还原time默认，避免后续测试错误
			spel.setTime(oldDate);
			spel.setName("override");
		}

		/**
		 * 类型操作表达式测试
		 * 
		 * @throws Exception
		 */
		@SuppressWarnings("rawtypes")
		@Test
		public void testSpelTypesExpression() throws Exception {
			Class dateClass = exp.parseExpression("T(java.util.Date)").getValue(
					Class.class);
			assertEquals("java.util.Date", dateClass.getName());
			assertTrue(exp
					.parseExpression(
							"T(java.math.RoundingMode).CEILING < T(java.math.RoundingMode).FLOOR")
					.getValue(Boolean.class));
		}

		/**
		 * 构造函数调用测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpelConstructorsExpression() throws Exception {
			SpelTestInnerClass spt = exp
					.parseExpression(
							"new study.spring.beans.SpelTestInnerClass('constructTest',23)")
					.getValue(SpelTestInnerClass.class);
			assertEquals(23, spt.getAge());
			assertEquals("constructTest", spt.getName());
		}

		/**
		 * 设置变量测试
		 * 
		 * @throws Exception
		 */
		@SuppressWarnings("unchecked")
		@Test
		public void testSpelVariablesExpression() throws Exception {
			List<Integer> list = new ArrayList<Integer>();
			list.addAll(Arrays.asList(2, 3, 4, 5, 6, 7, 9));

			secontext.setVariable("list", list);
			List<Integer> vList = (List<Integer>) exp.parseExpression("#list")
					.getValue(secontext);
			assertEquals(vList, list);

			List<Integer> nums = (List<Integer>) exp.parseExpression(
					"#list.?[#this >5]").getValue(secontext); // 获取值大于5的元素集合
			assertEquals(nums, Arrays.asList(6, 7, 9));
		}

		/**
		 * 自定义函数表达式测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpelFunctionExpression() throws Exception {
			StandardEvaluationContext context = new StandardEvaluationContext();
			context.registerFunction("len", SpElUtil.class.getDeclaredMethod("len",
					new Class[] { String.class }));
			assertEquals(3, exp.parseExpression("#len('abc')").getValue(context));
		}

		@Test
		public void testSpelBeanExpression() throws Exception {

		}

		/**
		 * 三元操作测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpelTernaryOperatorExpression() throws Exception {
			assertTrue(exp.parseExpression(" true ? true :false").getValue(
					Boolean.class));
			assertEquals("is true",
					exp.parseExpression(" 1 == 1 ? 'is true' :'is false'")
							.getValue(String.class));
		}

		/**
		 * Elvis 操作测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpeleElvisOperatorExpression() throws Exception {
			Expression ex = exp.parseExpression("name?:'name is null'");
			assertEquals("override", ex.getValue(secontext, String.class));
			spel.setName(null);
			assertEquals("name is null", ex.getValue(secontext, String.class));
			spel.setName("override");
		}

		/**
		 * 安全导航操作测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpelSafeNavOperatorExpression() throws Exception {
			assertEquals("innerClass", exp.parseExpression("innerClass?.name")
					.getValue(secontext, String.class));
			spel.setInnerClass(null);
			// 使用这种表达式可以避免抛出空指针异常
			assertNull(exp.parseExpression("innerClass?.name").getValue(secontext,
					String.class));

		}

		/**
		 * 集合选择表达式测试
		 * 
		 * @throws Exception
		 */
		@SuppressWarnings("unchecked")
		@Test
		public void testSpelCollectionSelectExpression() throws Exception {
			spel.setNumbers(Arrays.asList(2, 3, 4, 5, 6, 7, 9));

			List<Integer> nums = (List<Integer>) exp.parseExpression(
					"numbers.?[#this >5]").getValue(secontext);
			assertEquals(nums, Arrays.asList(6, 7, 9));
			// 获取第一个元素
			assertEquals(6,
					exp.parseExpression("numbers.^[#this > 5]").getValue(secontext));
			// 获取最后一个元素
			assertEquals(9,
					exp.parseExpression("numbers.$[#this > 5]").getValue(secontext));

			Map<Integer, String> maps = (Map<Integer, String>) exp.parseExpression(
					"maps.?[value == 'string3' ]").getValue(secontext);
			Map<Integer, String> tmap = new HashMap<Integer, String>();
			tmap.put(3, "string3");
			assertEquals(maps, tmap);

			Map<Integer, String> mapk = (Map<Integer, String>) exp.parseExpression(
					"maps.?[key > 2 and key < 4 ]").getValue(secontext);
			assertEquals(mapk, tmap);

		}

		/**
		 * 投影表达式测试
		 * 
		 * @throws Exception
		 */
		@SuppressWarnings("unchecked")
		@Test
		public void testSpelProjectionExpression() throws Exception {
			spel.setNumbers(Arrays.asList(2, 3, 4, 5, 6));

			assertEquals(Arrays.asList(5, 6, 7, 8, 9),
					exp.parseExpression("numbers.![#this+3]").getValue(secontext));

			List<Integer> keys = (List<Integer>) exp.parseExpression("maps.![key]")
					.getValue(secontext);
			assertEquals(keys, Arrays.asList(1, 2, 3, 4));

			List<String> mapv = (List<String>) exp.parseExpression("maps.![value]")
					.getValue(secontext);
			assertEquals(mapv,
					Arrays.asList("string1", "string2", "string3", "String4"));

			List<Boolean> mapK = (List<Boolean>) exp.parseExpression(
					"maps.![key > 2 and value !='String4']").getValue(secontext);
			assertEquals(mapK, Arrays.asList(false, false, true, false));
		}

		/**
		 * 模板语言测试
		 * 
		 * @throws Exception
		 */
		@Test
		public void testSpelTemplate() throws Exception {
			assertEquals(
					" this is a test 4",
					exp.parseExpression(" this is a test #{ maps.![key].get(3)}",
							new TemplateParserContext()).getValue(secontext,
							String.class));
		}
	}


[SpEL]: http://static.springsource.org/spring/docs/3.0.0.M3/reference/html/ch07.html "SpEL"
[Groovy]: https://zh.wikipedia.org/wiki/Groovy "Groovy"

