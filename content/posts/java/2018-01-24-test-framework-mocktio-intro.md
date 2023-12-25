---
title:  java测试框架Mockito简介
date: 2018-01-24
description:  java测试框架Mockito简介。简单介绍关于利用mockito包方法mock或者spy一个对象。
categories: "java"
tags: ["java","test"]
slug: "test-framework-mocktio-intro"
aliases: ['/blog/2018/01/24/test-framework-mocktio-intro.html']
---

本文基于mockito-core:2.8.9进行介绍。详细内容可在[这里](https://static.javadoc.io/org.mockito/mockito-core/2.13.0/org/mockito/Mockito.html#stubbing)查看具体的文档说明进一步了解。

## Mock对象：
	
	// normal
	List<String> mockList = Mockito.mock(List.class);
	// one-liner mock and stub
	List<String> mockList1 = Mockito.when(List.class).get(0)).thenReturn(“mock").getMock();

mock与new的区别在于：

1. mock返回对象属性为空或者为初始值，具体取决于对象属性类型是原始类型还是包装类型。
2. 调用mock对象未被stub的方法，默认情况下会根据具体的返回值类型返回null、原始/包装类型值或者空集合。比如：
	1. int/Integer返回0
	2. List/Map返回[]
	3. String/Object返回null

## Spy对象：

创建真实对象的spy

	// spy对象有无参构造函数
	List<String> spyList = Mockito.spy(ArrayList.class);
	
	// spy对象构造函数均带参
	// public User(String name){...}
	User spyUser = Mockito.spy(new User("spy"));

1. spy方法返回对象是对该对象进行new操作后的**包装对象**。
2. spy对象具有和原始对象相同的行为，除非某些方法被stub。

Mockito **不会** 委托调用传递的实例，而是创建一个实例的副本。因此当保留实例并与之交互时，不要期望spy的对象知道这些交互以及它们对实例状态的影响。因此[^comment1]：

1. *在spy对象中*，当一个*unstub*方法被调用时（而不是原对象对应的方法），是看不到对原始对象的影响的。
2. 留心*final*方法，Mockito 是不能mock *final*方法的，因此，当你spy一个真实的对象并且试图stub一个*final*方法时就会带来问题，也就无法验证这些方法。

> 简单来说，mock和spy的区别在于，mock是全部模拟，而spy则为部分模拟。
> 
> 尽量不使用spy方法去部分模拟对象，尤其是那些新的、测试驱动和设计良好的代码。除非你测试的代码是不能轻易被更改的（第三方接口、遗留代码的临时重构等）[^comment2]

## Stub方法：

	Mockito.when(mockObject.someMethod).thenReturn(someAnswer)

1. 个方法一旦被stub后，不管被调用多少次都将返回stubbed值。
2. 同一个方法可以被多次stub，但只有最后一个会生效，前面的将被覆盖.

		Mockito. when(mockList.get(0)).thenReturn("abc");
		Mockito.when(mockList.get(0)).thenReturn("abcd");
		Mockito.mockList.get(0); // return "abcd"

对于spy对象的stub，需要注意，如果使用
	
	// throws IndexOutOfBoundsException
	Mockito.when(spyList.get(0)).thenReturn("a");

时，有可能会抛出异常。所以对spy对象正确的stub方式是：

	Mockito.doReturn("a").when(spyList).get(0);

		
### stub同个方法返回不同值

	Mockito.when(mockList.get(0))
		.thenThrow(new RuntimeException("mock exception"))
		.thenReturn("a")
		.thenReturn("b");

当前三次调用`mockList.get(0)`时，将分别返回*异常、a、b*。超过三次后，均将返回字符*b*。也可使用简化方式实现上述功能：

	Mockito.when(mockList.get(0)).thenReturn("a","b","c");
 
### 参数匹配

对于不指定参数具体值的方法stub, 可以使用以下方式进行：

	Mockito.when(mockList.get(ArgumentMatchers.anyInt()).thenReturn("a");

除过`ArgumentMatchers.anyInt`还有`ArgumentMatchers.anyString`、`ArgumentMatchers.anyObject`等。

当方法具有多个参数时，如果其中有一个参数需要使用参数匹配，而另一个是指定参数时，那么对于该指定参数需要使用`ArgumentMatchers.eq`进行包装，否则会报错：
	
	// User get(String name,String age)
	User mockUser = Mockito.mock(User.class);
	// 报错
	Mockito.when(mockUser.get(ArgumentMatchers.anyString(), 20).thenReturn("a");
	// 正确方式
	Mockito.when(mockUser.get(ArgumentMatchers.anyString(), ArgumentMatchers.eq(20)).thenReturn("a");
	Mockito.when(mockUser.get(ArgumentMatchers.eq("Gates"), ArgumentMatchers.anyInt()).thenReturn("a");

### 自定义thenAnswer

当stub的thenReturn或者thenThrow不能满足需要时，我们可以实现thenAnswer接口，编写自定义stub行为：

	 when(mock.someMethod(anyString())).thenAnswer(new Answer() {
	     Object answer(InvocationOnMock invocation) {
	         Object[] args = invocation.getArguments();
	         Object mock = invocation.getMock();
	         return "called with arguments: " + args;
	     }
	 });
	 //the following prints "called with arguments: foo"
	 System.out.println(mock.someMethod("foo"));

#### 返回第一个参数
	
	// mock返回第一个参数
	when(mock.someMethod(anyString())).thenAnswer(i -> i.getArguments()[0]);
	
	// or
    doAnswer(AdditionalAnswers.returnsFirstArg()).when(mock).someMethod(anyString());
	
## 验证

### 是否被调用

某些情况下，我们只关心方法是否被调用，而不是其返回值，那么可以通过下面的方式验证mock对象的某个方法是否被执行：

	mockList.add("a");
	mockList.add("b");
	mockList.add("b");

	Mockito.verify(mockList).add("a");
	Mockito.verity(mockList, Mockito.times(2)).add("b");

默认情况下, verity 的 times 是 1 ,因此可以省略.

### 调用顺序

需要验证集合数据是否有序的情况:

    List<Integer> mockInts = mock(List.class);
    mockInts.add(1);
    mockInts.add(2);
    mockInts.add(1);
    mockInts.add(3);
    InOrder inOrder = Mockito.inOrder(mockInts);
    inOrder.verify(mockInts).add(1);
    inOrder.verify(mockInts).add(2);
    inOrder.verify(mockInts).add(3);

注意，`Mockito.inOrder` 验证的是相对顺序，而不是实际的顺序。比如上述代码中，1,2,3; 2,1,3;1,2,1;1,1,3等符合前后顺序的都是验证通过的，而2,3,1这种不符合前后顺序的将会验证失败。

## Spy 或者 Mock抽象类

1. 简单的：

		SomeAbstract spy = spy(SomeAbstract.class);

2. Mock抽象方法，spy接口默认方法(since 2.7.13)

		Function function = spy(Function.class);
	
3. 使用生成器mock

		OtherAbstract spy = mock(OtherAbstract.class
			, withSettings()
				.useConstructor()
				.defaultAnswer(CALLS_REAL_METHODS));

4. 带有构造函数的(since 2.7.14)

		SomeAbstract spy = mock(SomeAbstract.class
			, withSettings()
				.useConstructor("arg1",123)
				.defaultAnswer(CALLS_REAL_METHODS));

5.  非静态内部抽象类
	
		 InnerAbstract spy = mock(InnerAbstract.class
			 ,withSettings()
				 .useConstructor()
				 .outerInstance(outerInstance)
				 .defaultAnswer(CALLS_REAL_METHODS));	



[^comment1]: Mockito *does not* delegate calls to the passed real instance, instead it actually creates a copy of it. So if you keep the real instance and interact with it, don't expect the spied to be aware of those interaction and their effect on real instance state. The corollary is that when an *unstubbed* method is called *on the spy* but *not on the real instance*, you won't see any effects on the real instance.
    
    Watch out for final methods. Mockito doesn't mock final methods so the bottom line is: when you spy on real objects + you try to stub a final method = trouble. Also you won't be able to verify those method as well.

[^comment2]: As usual you are going to read the partial mock warning: Object oriented programming is more less tackling complexity by dividing the complexity into separate, specific, SRPy objects. How does partial mock fit into this paradigm? Well, it just doesn't... Partial mock usually means that the complexity has been moved to a different method on the same object. In most cases, this is not the way you want to design your application.
    
    However, there are rare cases when partial mocks come handy: dealing with code you cannot change easily (3rd party interfaces, interim refactoring of legacy code etc.) However, I wouldn't use partial mocks for new, test-driven & well-designed code.
