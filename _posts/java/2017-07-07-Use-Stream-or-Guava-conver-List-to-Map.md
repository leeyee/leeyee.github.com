---
layout: post
title:  使用Stream或者Guava实现List到Map的转换
description: 使用JAVA 8 Stream 或 Guava 转换List到Map
category: java
tag: [java]
---

* any list
{:toc}

实际开发场景中，经常会需要将`List`对象转成`Map`的情况出现。通常的做法是通过遍历List对象然后进行相应处理。JDK8后开始支持lambda表达式，同时提供针对集合的Stream方法，使得对集合的操作大大简化。下面就备份下如何使用lambda表达式和Guava[^guava_verion]实现List到Map的转换。

首先定义测试用的TestBean, 代码如下：

	public class TestBean {
		private String name;
		private Integer age;

		public TestBean() {
		}

		public TestBean(String name, Integer age) {
			this.name = name;
			this.age = age;
		}
		// 省略 set/get 方法
		@Override
		public String toString() {
			if (this != null) {
				return "TestBean{" +
						"name='" + name + '\'' +
						", age=" + age +
						'}';
			}
			return "null";
		}
	}

测试对象：

	List<TestBean> beanList = Lists.newArrayList(
		, new TestBean("jack", 29)
		, new TestBean("Tom", 25)
		, new TestBean("kitty", 25)
		, new TestBean("hurry", 30));

## 简单的List到Map的转换

使用 _name_ 映射到 `TestBean` 对象，首先来看JDK8下如何处理：

### lambda 方式

	Map<String, TestBean> jdk8Map = beanList
		.stream()
		.collect(Collectors.toMap(TestBean::getName, java.util.function.Function.identity()));

其中`Function.identity()` 就是遍历 `beanList` 时对应的当前 `TestBean` 对象，可以简单的认为就是循环遍历时的当前元素 `this`。

**注意：** 这里要保证集合中不存在为空的元素。否则应对空元素进行过滤`filter`后再进行`collect`操作

### Guava 方式

上述代码对应的Guava处理方式如下：

	Map<String, TestBean> guavaMap = Maps.uniqueIndex(beanList, new com.google.common.base.Function<TestBean, String>() {
		@Nullable
		@Override
		public String apply(@Nullable TestBean k) {
			return k.getName();
		}
	});

这里需要注意的是：`guavaMap` 实际对应的是一个 `ImmutableMap` 也就是不可变Map。那么对于 `guavaMap` 就不能使用`add`等改变映射结构的方法。当然，可以通过

	guavaMap = Maps.newHashMap(guavaMap);

消除不可变限制。也可将 `jdk8Map` 包装成不可变：

	jdk8Map = ImmutableMap.copyOf(jdk8Map);

**注意：** 同样这里除了要保证集合中不存在为空的元素外，还要保证从对象中获得的key不为空，因此可以在使用guava处理集合前先做如下操作：

	List<TestBean> testBeans = Lists.newArrayList(Collections2.filter(beanList, new Predicate<TestBean>() {
		@Override
		public boolean apply(@Nullable TestBean input) {
			return input != null && input.getName() != null;
		}
	}));

	
## List 到 Multi Map 的转换

使用 _age_ 映射所有 _name_ ，这个时候可以构造一个`MultiMap`对象。还是先看JDK8下的处理方式：

### lambda 方式

	Map<Integer, List<String>> jdk8MultiMap = beanList
		.stream()
		.filter(o -> o != null) // avoid throws NullPointerException
		.collect(Collectors.toMap(
			// get key
			TestBean::getAge
			// get value
			, (TestBean o) -> Lists.newArrayList(o.getName())
			// 当同一个key遇到不同value时的合并策略
			, (x, y) -> { 
				x.addAll(y);
				return x;
			}
			// 当不需要明确具体的Map类型时可省略。默认就是HashMap
			, HashMap::new 
		));

这段代码看起来是比较清爽的，但是不太那么容易理解，下面是完整的形式：

	Map<Integer, List<String>> jdk8MultiMap1 = beanList
		.stream()
		.filter((TestBean o) -> o != null)
		.collect(Collectors.toMap(
			new Function<TestBean, Integer>() {
				@Override
				public Integer apply(TestBean testBean) {
					return testBean.getAge();
				}
			}
			, new Function<TestBean, List<String>>() {
				@Override
				public List<String> apply(TestBean testBean) {
					return Lists.newArrayList(testBean.getName());
				}
			}
			, new BinaryOperator<List<String>>() {
				@Override
				public List<String> apply(List<String> st1, List<String> st2) {
					st1.addAll(st2);
					return st1;
				}
			}
			, new Supplier<Map<Integer, List<String>>>() {
				@Override
				public Map<Integer, List<String>> get() {
					return new HashMap<>();
				}
			}
		));

### Guava 方式
			
Guava的处理方式就比较直接了，因为Guava包含了这样的数据结构。因此基于Guava的处理方式可以和lambda结合使用：

	ListMultimap<Integer, String> guavaMultiMap = ArrayListMultimap.create();
	
	// not lambda
	/*for (TestBean testBean : beanList) {
		if (testBean != null)
			guavaMultiMap.put(testBean.getAge(), testBean.getName());
	}*/
	
	beanList
		.stream()
		.filter(o -> o != null)
		.forEach(o -> {
			guavaMultiMap.put(o.getAge(), o.getName());
		});

这里我们可以看到，如果只是简单的将`List`转换为`Map`，那么使用JDK 8的 lamdba 和 Guava的方式并没有什么不同的，但如果在后续的使用过程中需要向Map中添加数据时，`jdk8MultiMap` 和 `guavaMultiMap` 是不同的：

	jdk8MultiMap.get(30).add("hurry2");
	guavaMultiMap.put(25,"hello");

相比较起来都不算复杂，但`guavaMultiMap` 看起来会更简明。


## 使用List的index做key

当需要获取List的自然索引时可以如下操作

### lamdba 方式


	// 返回Map的key就是非空元素在集合中的index
	// 1. 先过滤掉空元素
	// 2. 然后获取非空元素index，并组装成IntStream
	// 3. 进行Stream类型转换
	// 4. 进行Map转换

	Map<Integer, TestBean> indexAsKeyMap = beanList
		.stream()
		.filter(o -> o != null)
		.mapToInt(beanList::indexOf)
		.boxed() // 或者mapToObj(Integer::new)
		.collect(Collectors.toMap(idx -> idx, beanList::get));


	// 返回Map的key为非空集合对象的自然连续顺序编号
	// 处理时，应先保证集合元素均为非空的。
    beanList = beanList.stream()
		.filter(o -> o != null)
		.collect(Collectors.toList());

	Map<Integer, TestBean> indexAsKeyMap1 = IntStream
		.range(0, beanList.size())
		.boxed()
		.collect(Collectors.toMap(idx -> idx, beanList::get));

如果_beanList_的测试用例如下：

	beanList = Lists.newArrayList(
		new TestBean("jack", 29)
		, null
		, new TestBean("Tom", 25)
		, new TestBean("hurry", 30));
			
则`indexAsKeyMap`和`indexAsKeyMap1` 分别对应的是：

	----- indexAsKeyMap -----
	0 -> TestBean{name='jack', age=29}
	2 -> TestBean{name='Tom', age=25}
	3 -> TestBean{name='hurry', age=30}
	----- indexAsKeyMap1 -----
	0 -> TestBean{name='jack', age=29}
	1 -> TestBean{name='Tom', age=25}
	2 -> TestBean{name='hurry', age=30}

### Guava 方式

	// 或者使用上面提到的guava过滤方式处理
    beanList = beanList.stream()
		.filter(o -> o != null)
		.collect(Collectors.toList());
            
	Map<Integer, TestBean> indexAsKeyMap2 = Maps.uniqueIndex(beanList, new com.google.common.base.Function<TestBean, Integer>() {
		@Nullable
		@Override
		public Integer apply(@Nullable TestBean k) {
			if(k==null) return Integer.MAX_VALUE;
			return beanList.indexOf(k);
		}
	});
	
`indexAsKeyMap1`和`indexAsKeyMap2`返回的结果相同。

[^guava_verion]: guava version 22.0
