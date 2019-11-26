---
layout: post
title: Stripes框架如何做系列-单元测试
description: stripes框架如何做系列中文翻译。单元测试
category: java
tag: [stripes,translation]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Unit+Testing](https://stripesframework.atlassian.net/wiki/display/STRIPES/Unit+Testing)


这篇文档介绍两种主要的方式用来测试ActionBeans和与之关联的外部容器类，比如Tomcat，Resin或者Jetty。要决定哪种方式适合你，应该大概去了解下两者。这不是用一个方案就可以解决所有问题的，你可能需要在你的项目中同时使用这两种技术。

但是首先，让我们先说明一些事情……

1. 自动化测试是一件好事情。自动化测试可以让你方便的对代码进行重构，直到写出更高质量的代码。
2. 我不想通过哲学层面去说明单元测试的好与不好；但良好的可自动运行的测试是值得提倡的，这不关乎他们是否是技术性的单元测试。
3. 有工具可以让你测试整个包含在常规servelt容器内渲染的JSP的周期；我发现这有一点像是努力工作并当可能的时候去测试我的外部容器[^commnet1]。
4. 对每个Stripes用户，我个人比较推荐使用[TestNG]。它要比JUnit先进，如果你有做过任何的单元测试，那么[TestNG]的上手时间也就大概15分钟。

为了证明上述四点，这篇文档的所有示例（实际上包含Stripes的所有单元测试）均使用[TestNG]。


## 方法１：直接调用你的ActionBean

由于**ActionBean**类是一个简单的**POJO**,因此对他们实例化，设置属性以及调用处理方法都是可以直接进行的。下面的代码用来测试CalculatorActionBean类：

> CalculatorActionBeanTest.java
>
	public class CalculatorActionBeanTest {
	    @Test
	    public void myFirstTest() throws Exception {
		CalculatorActionBean bean = new CalculatorActionBean();
		bean.setContext( new ActionBeanContext() );
		bean.setNumberOne(2);
		bean.setNumberTwo(2);
		bean.add();
		Assert.assertEquals(bean.getResult(), 4, "Oh man, our math must suck!");
	    }
	}

当ActionBeans被当做单独的实体，这段用例是完美的。但假如我们要去处理存储在会话中的值或者响应中的cookie时，我们不得不去做进一步的改进。希望现在你已经读过[状态管理]，如果没有，你应该先去读它。它说明了如何通过Strips使用自定义的ActionBeanContext子类实现清晰的状态管理，类型安全以及独立的Servlet应用程序接口。让我们想象下我们用如下的抽象ActionBeanContext子类去定义我们的接口：

> MyAbstractActionBeanContext.java
> 
	public class MyAbstractActionBeanContext extends ActionBeanContext {
	    public abstract void setUser(User user);
	    public abstract User getUser();
	}

这个类的具体实现应该看起来如下：

> MyActionBeanContext.java
> 
	public class MyActionBeanContext extends MyAbstractActionBeanContext {
	    public void setUser(User user) {
		getRequest().getSession().setAttribute("user", user);
	    }
>	 
	    public User getUser() {
		return (User) getRequest().getSession().getAttribute("user");
	    }
	}

到目前为止一切看来还不错？现在，假如所有自定义ActionBeans编码继承MyAbstractActionBeanContext类，那么它将可以接受任何子类，而不仅仅只是我们用在普通应用程序中的MyActionBeanContext类。这意味着我们可以写一个测试实现并在测试中替换它。这个实现看起来可能如下：

> MyTestActionBeanContext.java
> 
	public class MyTestActionBeanContext extends MyAbstractActionBeanContext {
	    private Map<String,Object> fakeSession = new HashMap<String,Object>();
>	 
	    public void setUser(User user) {
		this.fakeSession.put("user", user);
	    }
>	 
	    public User getUser() {
		return (User) this.fakeSession.get("user");
	    }
	}

注意，我们在测试实现中只用了User类型的属性，但是如果你要存放超过两个对象在会话中，使用Map可能更容易。虽然上述只是演示包装会话，但是相同的模式可被应用到与任何Servlet API有关的场景中，比如设置和检索cookie，设置请求属性等。假如你通过自定义ActionBeanContext去调度所有访问的Servlet API类，那么你的ActionBean可以两全其美——当他们需要它时使用Servlet API，并且是完全独立于Servlet API的。

下面将展示如何使用这项技术对LoginActionBean进行测试：

> LoginActionBeanTest.java
> 
	public class LoginActionBeanTest {
	    @Test
	    public void successfulLogin() throws Exception {
		MyAbstractActionBeanContext ctx = new MyTestActionBeanContext();
		LoginActionBean bean = new LoginActionBean();
		bean.setContext(ctx);
		bean.setUsername("shaggy");
		bean.setPassword("shaggy");
		bean.login();
>	 
		Assert.assertNotNull(ctx.getUser());
		Assert.assertEquals(ctx.getUser().getFirstName(), "Shaggy");
		Assert.assertEquals(ctx.getUser().getLastName(), "Rogers");
	    }
>	 
	    @Test
	    public void failedLogin() throws Exception {
		MyAbstractActionBeanContext ctx = new MyTestActionBeanContext();
		LoginActionBean bean = new LoginActionBean();
		bean.setContext(ctx);
		bean.setUsername("shaggy");
		bean.setPassword("scooby");
		bean.login();
>	 
		Assert.assertNull(ctx.getUser());
		Assert.assertNotNull(ctx.getValidationErrors());
		Assert.assertEquals(ctx.getValidationErrors().get("password").size(), 1);
	    }
	}

这个方法是不错的，但是还有几个缺点：

+ 它不能测试类上绑定的URL
+ 它不能测试验证和类型转换是否工作正常
+ 随着ActionBeans变得更加复杂，你的测试看起来会越来越像一个容器
+ 它对于测试Resolutions是否正常工作是困难的


## 方法２：模拟容器用法

从版本1.1.1开始，Stripes包提供了一套丰富的模拟对象，这些对象实现了大量在Servlet中声明了的接口。这些对象可以用于构建处理请求的模拟容器。虽然有点小复杂，但能更逼真的模拟ActionBean被执行的场景。同时对于测试你在注解中的声明也是有好处的。

这些类可以在net.sourceforge.stripes.mock包下找到。随着时间推移，你可能需要了解其中的大多数类，但是现在你只需要将注意力放在类[MockServletContext]和 [MockRoundtrip]上即可。

[MockServletContext]是servlet环境中单个上下文的模拟实现。我们将设置该类型的类去接受和处理我们的请求。这只需要很少的代码就能实现：

> 设置MockServletContext
> 
	MockServletContext context = new MockServletContext("test");
> 	 
	// Add the Stripes Filter
	Map<String,String> filterParams = new HashMap<String,String>();
	filterParams.put("ActionResolver.Packages", "net.sourceforge.stripes");
	context.addFilter(StripesFilter.class, "StripesFilter", filterParams);
> 	 
	// Add the Stripes Dispatcher
	context.setServlet(DispatcherServlet.class, "StripesDispatcher", null);

在这个示例中，我们做了以下几件事：

+ 初始化MockServletContext类并使用_test_命名（比如，所有的URL将以/test开始）
+ 为StripesFilter设置一些初始化参数
+ 插入StripesFilter到模拟上下文中
+ 注册Stripes DispatcherServlet在模拟上下文中

针对上述几点你可能会问，为什么要复制这些步骤？嗯，好吧，这些代码除去注释和空行只有五行代码。原因很简单，使用Stripes包含的模拟对象没有以任何方式被捆绑在Stripes中。如果你有一对用户自定义servlet（当你使用Stripes时，为什么还要这样做？有点跑题了），那么你可以用这些模拟对象进行高效的测试。

上述提供给Stripes过滤器的初始化变量与在web.xml中容器使用的变量是相同的。你可以自由的提供相同的值，或者提供更适合测试的值。这完全取决于你。

> **添加额外的过滤器**
> 你可以添加额外的过滤器，只要能确保你的ActionBeans功能正常。如果你用过滤器去实现OpenSessionInView模式，或者实现自己的安全模式，那么你也可以添加过滤器到上文中。唯一需要知道的是过滤器是按其插入到上下文中的顺序被调用的。

作为模拟对象，而不是一个完整的Servlet容器，你应该知道其中的一些限制：

+ 没有URL匹配；所有的过滤器被用到每一个请求
+ MockServletContext仅支持单一的Servlet，因此你只能一次测试一件事情
+ 转发、重定向和包含是不被处理的（但是关于它们的信息为了验证则是被记录的）

最后，在我们继续之前，将实例化MockServletContext的代码包装在一个测试类中可能是一个好主意。实例化一个模拟上下文要比启动一个完整的servlet容器廉价的多，但仍需花费一到两秒钟。这是微不足道的，但是如果你为每一个单元测试方法都去实例化一个模拟上下文，那么当你有几百个待测试方法时，你将不得不等待一段时间。因此可以实现一个普通的延迟创建单一模拟上下文的，并将其提供给需要它的任何测试类的常规类。或者通过使用TestNG的`@Configuration(beforeSuite=true)`注解方法生成上下文。例如：

> TestFixture.java
> 
	public class TestFixture {
	    private static MockServletContext context;
> 	 
	    @Configuration(beforeTest=true)
	    public void setupNonTrivialObjects() {
		TestFixture.context = new MockServletContext("test");
		...
	    }
> 	 
	    public static MockServletContext getServletContext() {
		return TestFixture.context;
	    }
	}

现在到了有趣的地方——写一些实际的测试。当你确信直接去实例化并使用所有在模拟包下的类时，它是容易使用MockRoundtrip替代的。MockRoundtrip充当其他几个模拟对象的门面，并介绍了Stripe如何使事情尽可能简单的工作的知识。下面是使用MockRoundtrip的一个基本测试：

> 使用MockRoundtrip的简单测试
> 
	@Test
	public void positiveTest() throws Exception {
	    // Setup the servlet engine
	    MockServletContext ctx = TestFixture.getServletContext();
>	 
	    MockRoundtrip trip = new MockRoundtrip(ctx, CalculatorActionBean.class);
	    trip.setParameter("numberOne", "2");
	    trip.setParameter("numberTwo", "2");
	    trip.execute();
>	 
	    CalculatorActionBean bean = trip.getActionBean(CalculatorActionBean.class);
	    Assert.assertEquals(bean.getResult(), 4.0);
	    Assert.assertEquals(trip.getDestination(), "/index.jsp");
	}

这个小片段中有不少信息。首先我们从TestFixture中获取MockServletContext。接着我们通过上下文和想要调用的ActionBean去实例化一个新的MockRoundtrip。其中上下文被用来帮助生成请求时的URL，并在后续的请求处理中被用到。ActionBean类仅被用来获取来自@UrlBinding注解的URL。如果你愿意，也可以使用参数为URL字符串的构造函数来替代ActionBean类。此外由于没有MockHttpSession，MockRoundtrip将为我们创建一个。对于较大较长的测试，你可能需要创建一个MockHttpSession并在一些请求中使用它，以便模拟真实的会话。

MockRoundtrip创建完成后，我们为其设置两个请求变量。注意，就像其他普通的请求参数一样，它们都是字符串。如果你需要为任何变量提供超过一个值，你可以通过可变参数方法`setParameter()`和`addParameter`提供额外的值。

`trip.execute()`在servlet上下文中（当我们构造MockRoundtrip时提供的）执行请求。它将（假设我们的测试工作）调用CalculatorActionBean中默认的操作。还有另一个`execute()`方法，它接受一个事件名称作为参数，并且如果被请求的事件已被提交，它将格式化请求。

最后进行验证。我们从MockRoundtrip中获取ActionBean实例。需要明确的是：这是一个被Stripes和刚刚处理过的请求实例化的ActionBean。第一个断言是相当简单的，它检查确保被计算出的结果是正确的（默认的是加法操作）。第二个断言检查ActionBean转发或重定向给用户正确的页面。一个重要的需要注意的事情是：MockRoundtrip将使用的路径转发或重定向到web应用的相对路径上。无论是转发还是重定向的请求结果，你都将得到相同的返回路径，同时这些路径是不包含上下文路径的。这样做只是为了测试简单，假如你在两种跳转方式上来回切换时。

测试失败的用例也很简单：

> 使用MockRoundtrip测试失败用例
> 
	@Test
	public void negativeTest() throws Exception {
	    // Setup the servlet engine
	    MockServletContext ctx = TestFixture.getServletContext();
>	 
	    MockRoundtrip trip = new MockRoundtrip(ctx, CalculatorActionBean.class);
	    // Omit first parameter - we could also have set it to ""
	    trip.setParameter("numberTwo", "abc");
	    trip.execute();
>	 
	    CalculatorActionBean bean = trip.getActionBean(CalculatorActionBean.class);
	    Assert.assertEquals(bean.getContext().getValidationErrors().size(), 2);
	    Assert.assertEquals(trip.getDestination(), MockRoundtrip.DEFAULT_SOURCE_PAGE);
	}

这段示例和上述的示例是非常相似的，除了我们忽略了一个必填参数和传递"abc"字符串给数字类型的参数。第一个断言检查确保在ValidationErrors中有两个实体。ValidationErrors的结构是一个使用域名映射ValiationError数组的Map。如果想进一步验证，可以循环遍历错误列表中的每一个域并确保每个域都得到一个错误。

第二个断言检查该请求导致导航返回到原页面。Stripes要求请求提供其来源路径页面（至少如果请求可以生成验证错误）。这通常是由`<stripes:form>`标签声明的，但是在这个例子中，MockRoundtrip为我们插入了一个默认的值。如果关心这个值，可以通过`MockRoundtrip.setSourcePage(String url)`方法进行设置。

最后，我们可能在ActionBean中处理方法时用返回数据流的方式替代JSP页面给用户。比如下面来自AJAX CalculatorActionBean的代码片段：

> 处理流数据方法到客户端
> 
	@HandlesEvent("Addition") @DefaultHandler
	public Resolution addNumbers() {
	    String result = String.valueOf(numberOne + numberTwo);
	    return new StreamingResolution("text", new StringReader(result));
	}

在这个示例中我们返回的数据流大小很小——单个浮点数。但原理是相同的，如果我们返回大量的xml或者Javascript流。我们可以使用下面的方式对其进行测试：

> 测试返回流式数据的ActionBean
> 
	@Test
	public void testWithStreamingOutput() throws Exception {
	    MockServletContext ctx = TestFixture.getServletContext();
>	 
	    MockRoundtrip trip = new MockRoundtrip(ctx, CalculatorActionBean.class);
	    trip.setParameter("numberOne", "2");
	    trip.setParameter("numberTwo", "2");
	    trip.execute("Addition");
>	 
	    CalculatorActionBean bean = trip.getActionBean(CalculatorActionBean.class);
	    Assert.assertEquals(bean.getResult(), 4.0);
	    Assert.assertEquals(trip.getOutputString(), "4.0");
	    Assert.assertEquals(trip.getValidationErrors().size(), 0);
	    Assert.assertNull(trip.getDestination());
	}

这里的关键行是第二个断言。这个测试是通过ActionBean输出的字符串完全等于“4.0”的。我们当然可以测试大的字符串，通过检查它们含有的模式或已知的数据。MockRoundtrip也有一个`getOutputBytes()`方法，该方法可被用来检索输出的一个字节[^comment2]。

关于使用MockRoundtrip更多的信息以及其他模拟对象请参考[java文档]

### MockRoundtrips和Spring兼容！

现在你想在spring/stripes应用中使用MockRoundtrip，那么你将得到一个异常：

> 集成spring使用时的异常
> 
> > 15:01:19,277 WARN DefaultExceptionHandler:90
- Unhandled exception caught by the Stripes default exception handler.
net.sourceforge.stripes.exception.StripesRuntimeException:
Exception while trying to lookup and inject a Spring bean into a bean of type MyActionBean using field access on field private
com.xxx.service.MySpringBean
com.xxx.action.GenericActionBean.mySpringBean

为了修正它，你只需要在初始化你的MockServletContext时做一点改变:

> 添加对Spring的兼容
> 
	private static MockServletContext context;
>	 
	@Before
	public static void initContext() {
	    Map<String, String> filterParams = new HashMap<String, String>();
	    //add stripes extensions
	    filterParams.put("Interceptor.Classes", "net.sourceforge.stripes.integration.spring.SpringInterceptor");
>	 
	    filterParams.put("ActionResolver.Packages", "net.sourceforge.stripes");
>	 
	    context.addFilter(StripesFilter.class, "StripesFilter", filterParams);
>	 
	    //here goes your own configuration file
	    context.addInitParameter("contextConfigLocation", "/WEB-INF/applicationContext.xml");
>	 
	    // bind your context with an initializer
	    ContextLoaderListener springContextListener = new ContextLoaderListener();
	    springContextListener.contextInitialized(new ServletContextEvent(context));
>	 
	    // Add the Stripes Dispatcher
	    context.setServlet(DispatcherServlet.class, "StripesDispatcher", null);
	}

也可参看：

+ http://article.gmane.org/gmane.comp.java.stripes.user/9134
+ http://blog.xebia.com/2008/12/16/unit-testing-a-stripes-actionbean-wired-with-spring-beans/


## 使用方法2:模拟容器用法进行向导行为测试

向导行为测试是诡异的，因此为了测试它，我们应该做一些额外的工作。要配置的MockServletContext样例和往常一样。

> 配置MockServletContext
> 
	private MockServletContext ctx;
	..........
	@Before
	public void setUpMockServletContext() {
	    ctx = new MockServletContext("test");
>	 
	    // Add the Stripes Filter
	    Map<String,String> filterParams = new HashMap<String,String>();
	    filterParams.put("ActionResolver.Packages", "com.yourpackage.action");
	    // filterParams.put("LocalePicker.Locales", ".....");
	    // filterParams.put("Extension.Packages", "com.yourpackage.action.extention");
	    ctx.addFilter(StripesFilter.class, "StripesFilter", filterParams);
	    // Add the Stripes Dispatcher
	    ctx.setServlet(DispatcherServlet.class, "StripesDispatcher", null);
	}

正如看到的，当前的配置中只有一个过滤器。稍后我们将会使用到它。

假设在你的向导行为bean中有以下几个用在页面向导处理的域名，域名是filed1,filed2,filed3.

你可以和之前一样尝试运行你的测试。

> 未处理异常在测试方法中
> 
	@Test
	public void negativeTest() throws Exception {
	    MockRoundtrip trip = new MockRoundtrip(ctx, MyWizardActionBean.class);
	    trip.setParameter("field1", "abc");
	    trip.execute();
	    // ....... the rest of test code
	}


你最可能得到的结果是像这样的错误：

> 未处理的异常信息
> 
> > WARN net.sourceforge.stripes.exception.DefaultExceptionHandler - Unhandled exception caught by the Stripes default exception handler.
net.sourceforge.stripes.exception.StripesRuntimeException: Submission of a wizard form in Stripes absolutely
requires that the hidden field Stripes writes containing the names of the fields present on the form is present
and encrypted (as Stripes write it). This is necessary to prevent a user from spoofing the system and getting
around any security/data checks.

产生这个异常是因为向导行为被Stripes做了特殊处理。解决方法是在测试方法中添加如下代码：

> 解决向导行为中的未处理异常
> 
	import net.sourceforge.stripes.util.CryptoUtil;
	.......
	@Test
	public void negativeTest() throws Exception {
	    MockRoundtrip trip = new MockRoundtrip(ctx, MyWizardActionBean.class);
	    trip.setParameter("__fp", CryptoUtil.encrypt("||field1||field2||field3"));// used for @Wizard action
	    trip.setParameter("field1", "abc");
	    trip.execute();
	    // ....... the rest of test code
	}

域名加密代码应该用\|\|开始并用其分割所有域名。然后将加密值指定给由Stripes内部使用的特殊参数“__fp”。

现在所有你的测试都很好的通过并退出，但是在测试日志中你仍有极大可能看到如下的错误信息：

> 向导行为测试日志中的错误
> 
> > ERROR net.sourceforge.stripes.controller.StripesFilter - net.sourceforge.stripes.exception.StripesRuntimeException:
Something is trying to access the current Stripes configuration but the current request was never routed through
the StripesFilter! As a result the appropriate Configuration object cannot be located. Please take a look at the
exact URL in your browser's address bar and ensure that any requests to that URL will be filtered through the
StripesFilter according to the filter mappings in your web.

你应该在你的测试中增加一个JUnit的固定方法来解决该问题。你应该从你的MockServletContext中移除Stripe过滤器并重新为每一个测试方法设置它。添加下面的代码到你的测试中，并在次尝试运行：

> 解决导行为测试日志中的第二个异常
> 
	@After
	public void cleanUp() {
	    // destroy Stripes filter for every test method
	    ctx.getFilters().get(0).destroy(); // assume you have only one (first and single) filter in config
	}

我们在每个测试方法之后摧毁内部配置的Stripes过滤器。该代码假定在测试中您只有一个过滤器（*译者注：对应本节开始时的示例代码——只有一个过滤器*），所以你有几个过滤器，你就应该为你的示例调整你的代码。


[^commnet1]: I find these are a bit too much like hard work and prefer to test outside of my container when possible
[^comment2]: Also MockRoundtrip has a getOutputBytes() method that can be used to retrieve a byte[] of output in case the ActionBean's output was not text.

[TestNg]: http://www.testng.org/
[状态管理]: /blog/2016/08/25/stripes-how-to-state_management/
[MockServletContext]:http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/mock/MockServletContext.html
[MockRoundtrip]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/mock/MockRoundtrip.html
[java文档]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/mock/package-summary.html
