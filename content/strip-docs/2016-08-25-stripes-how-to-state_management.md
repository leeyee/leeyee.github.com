---
title: Stripes框架如何做系列-状态管理
date: 2016-08-25
description: stripes框架如何做系列中文翻译。访问Session、Cookies等
categories: "java"
tags: ["stripes","translation"]
series: ["Strips 如何做系列"]
series_order: 12
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/State+Management](https://stripesframework.atlassian.net/wiki/display/STRIPES/State+Management)


这篇文档有两个主要部分：

1. 使用`ActionBeanContext`进行状态管理
2. 使用`FlashScope`进行POST请求后重定向

## 状态管理
 
这一节我们将介绍如何在保证类型安全和ActionBean类可测试的情况下，去访问`HttpSession`，`Cookies`和其他`HttpServletRequest/Response`行为。关键点就在于提供一个自己`ActionBeanContext`子类。

### ActionBeanContext子类

下面是一个允许在类型安全下访问存储在会话中的用户对象的示例子类：

> ActionBeanContext子类
>
	public class MyAppActionBeanContext extends ActionBeanContext {
	    public void setUser(User user) {
			getRequest().getSession().setAttribute("user", user);
	    }
>	 
		 public User getUser() {
			return (User) getRequest().getSession().getAttribute("user");
	    }
	}

现在你有了自定义`ActionBeanContext`对象，接下来需要告诉Stripes如何去使用它。最简单的方式是将其放在扩展包中（请看[扩展](http://iyiguo.net/blog/2016/07/10/stripes-how-to-extensions/)一文）。另外，你可以在web.xml中为Stripes过滤器添加如下的初始参数：

> 配置ActionBeanContext
>
	<init-param>
	    <param-name>ActionBeanContext.Class</param-name>
	    <param-value>com.myco.MyAppActionBeanContext</param-value>
	</init-param>


### 使用自定义ActionBeanContext

现在，被设置为你的`ActionBean`的`ActionBeanContext`将总是被当做`MyAppActionBeanContext`。你仍然需要对那些在你的`ActionBean`中接收到的对象做类型转换，但是幸运的是在Java1.5中有一个叫做[协变返回类型](https://blogs.oracle.com/sundararajan/entry/covariant_return_types_in_java)的新属性，你可以至少使用该属性一次，而不是通过类型强制转换代码。

> 在ActionBean中使用协变返回类型
>
	public class MyActionBean implements ActionBean {
	    private MyAppActionBeanContext context;
>	 
	    /** Interface method from ActionBean. */
	    public setContext(ActionBeanContext context) {
			this.context = (MyAppActionBeanContext) context;
	    }
>	 
	    /** Interface method from ActionBean, using a co-variant return type! */
	    public MyAppActionBeanContext getContext() {
			return this.context;
	    }
>	 
	...
	}

在Java1.4及之前，`getContext()`方法将不能通过编译，因为接口声明必须返回`ActionBeanContext`而不是`MyAppActionBeanContext`，虽然`MyAppActionBeanContext`继承自`ActionBeanContext`。但在Java1.5中却是被允许的，这有助于代码清晰。假如你创建自定义的`BaseActionBean`类，你可以将这些代码放在其中并且不用再次看到它们。

现在当你有了自定义的`ActionBeanContext`后你可以：

+ 添加类型安全的方法用来访问你需要存储在会话中的对象（希望没有太多的对象）
+ 添加类型安全的方法用来获取或者设置cookie
+ 在一个地方存放所有针对上述需要操作的字符串或者关键字
+ 访问方法及请求和响应对象的功能而不用将ActionBeans耦合进它们


同时，因为`ActionBeanContext`被组装在你的`ActionBean`中，并且你的`ActionBean`又被放进到了请求属性中，所以现在你可以通过两种方式访问存储在会话中的对象。在JSP中：

	<div>${user} == ${actionBean.context.user}</div>

虽然这看起来微不足道，但是有一个好处。第一个语法`${user}`是假设你已经通过属性关键字“user”将用户对象放置到JSP范围中（比如会话中）。如果你修改了这个关键字，比如改成“__secretPlace_user”，那么JSP将会阻断。你大概不太可能去改变	`ActionBeanContext`中类型安全的方法，因此`${actionBean.context.user}`可能更安全。这些虽然微不足道，但值的一提。

### 可测试

对于web层面的类进行测试通常来说是困难的。这通常是因为它们不仅需要和以Http开头的对象相互作用，还被迫需要和Servlet、Action或者其他模型的API进行交互。Stripes ActionBeans的单元测试已经是非常简单的了（仅仅需要初始化，设置上下文，设置属性然后继续），但是当你的ActionBean真的需要和请求或会话交互时，你的单元测试将无法继续。因此你可能不得不去构造一个假的Http对象等。

只需要多一点工作，就可以让`ActionBeans`完全可测试化。使用上面提到的`MyAppActionBeanContext`做示例，我们可以创建一个抽象类，而我们的`ActionBeanContext`将会继承它，同时我们的`ActionBeans`也将用到它。让我们重构下：

> MyAppActionBeanContext.java
> 
	public abstract class MyAppActionBeanContext extends ActionBeanContext { 
		public abstract void setUser(User user); 
		public abstract User getUser(); 
	} 

我们真正的类看起来和之前是相同的，但是或许这次会以不同的名字命名它：

> MyAppActionBeanContextImpl.java
> 
	public class MyAppActionBeanContextImpl extends MyAppActionBeanContext { 
		public void setUser(User user) { 
			getRequest().getSession().setAttribute("user", user); 
		} 
>
		public User getUser() { 
			return (User) getRequest().getSession().getAttribute("user"); 
		} 
	} 

然后，创建我们自己的`ActionBeanContext`测试类:

> MyAppActionBeanContextTestImpl.java
>
	public class MyAppActionBeanContextTestImpl extends MyAppActionBeanContext { 
		private User user; 
>
		public void setUser(User user) { this.user = user; } 
>
		public User getUser() {return this.user; } 
	} 
 

这样，我们就拥有了一个自定义ActionBean的测试类，使的能通过很少的努力就能模拟真实环境。你可以想象下其他处理方式。获取测试版本（指`MyAppActionBeanContextTestImpl`）可以简单地继承“真”版本（指`MyAppActionBeanContextImpl`）并且重载访问会话或者请求的方法。你甚至可以进一步在你的“真实”上下文类中定义一个被称作类似`setInSession(String key, Object value)`的受保护的助手方法，这样在正式版本中调用`getRequest().getSession().setAttribute()`，而在测试版本中仅将值存放在本地`Map`中。


## POST请求后重定向

POST请求后重定向是一个相当简单的技术。其思想是，表单POST请求后服务器会做一些重要的操作（比如创建用户，进行交易等），这些是安全的，然后重定向用户到另外一个页面（也有可能是同一个页面）。通过重定向可以确保，当用户点击刷新按钮时不会再次重新提交表单。假如只是在POST后简单的转发到页面，那么刷新操作将会重新提交表单。

但是对于重定向，也有不好的一面。当重定向发出时，任何存储在请求中的属性值会丢失（因为对于页面的请求和当前请求不是同一个请求）。一种选择是将需要的属性值存放在会话中，但这是一个不好的主意。因为当用户使用多个浏览器打开应用时，属性会被破坏掉。

### 闪存域

[FlashScope]被设计用来解决这个问题。本质上，闪存域是类似请求域、会话域等的。而请求域是被定义为当前请求的生命周期而存在，闪存域则被定义为当前请求和后续请求的生命周期而存在。任何闪存域内的添加的项，都将被当做当前请求以及下一个请求的可用属性。

一个闪存域用法的示例是Stripes中的非错误消息功能。[ActionBeanContext]有一个`getMessages()`的方法，它返回可能被添加的消息列表。这个消息列表存放在闪存域中以至于消息对于当前请求是可用的（应该是`ActionBean`转发到一个页面）并且在下一个请求中同样可用（应该`ActionBean`重定向到一个页面）。代码看起来如下：


> FlashScope的用法示例
>
	public List<Message> getMessages(String key) { 
		FlashScope scope = FlashScope.getCurrent(getRequest(), true); 
		List<Message> messages = (List<Message>) scope.get(key); 
> 
		if (messages == null) { 
			messages = new ArrayList<Message>(); 
			scope.put(key, messages); 
		} 
> 
		return messages; 
	} 

第一行真实的调用`FlashScope`的`getCurrent`创建一个`FlashScope`对象，假如`FlashScope`不存在时。接着像其他域一样，通过关键字／值来使用新建的`FlashScope`对象。

### 闪存中的ActionBeans

默认情况下不把`ActionBeans`存放到闪存域中。这样做一部分是出于向后兼容的原因，一部分是因为没有必要任何时候都这样做！而不是说他做起来很困难。假如使用标准的[RedirectResolution]，那么可以通过简单的通过链路方式来调用：

	return new RedirectResolution("/some/page.jsp").flash(this); 

甚至，假如你要重定向一些其他的方法，依旧非常简单：

	// From within the ActionBean 
	FlashScope.getCurrent(getContext().getRequest(), true).put(this);

> **注意:**
> 
> > 如果重定向到JSP，那么这么做。如果重定向到一个转发到JSP的`ActionBean`，那么被闪存的`ActionBean`将被你重定向的`ActionBean`重写。

### 在JSP中访问FlashScope

比方说在你的`ActionBeans`中调用此方法：

	public void addRecipe(HttpServletRequest request, String message) { 
		FlashScope fs = FlashScope.getCurrent(request, true); 
		List<String> messages = (List<String>) fs.get("recipes"); 

		if (messages == null) { 
			messages = new ArrayList<String>(); 
			fs.put("recipes", messages); 
		} 

		messages.add(message); 
	} 


然后重定向到另一个转发到JSP的`ActionBean`。下面是如何在JSP中访问`FlashScope`:

	<c:forEach var="recipe" items="${recipes}"> 
		<div class="recipe_name">${recipe.name}</div> 
	</c:forEach> 

如你所看到的，当你存放一个对象在`FlashScope`中，它可以通过关键字在EL表达式中被直接访问到。

### FlashScope是如何工作的

`FlashScope`的是通过临时存储自己的实例在会话中并在随后的请求中移除它们的方式工作的。结果是，当`FlashScope`被用时，一个额外的变量会被追加到重定向URL中，用来告诉Stripes使用那个`FlashScope`。因为这个参数在相同的会话中有两个或多个浏览器窗口（或者标签页），因此当访问彼此的`FlashScope`时会产生混淆。

这种处理方式有一个明显的副作用，那就是在会话中偶尔会得到没有关联的`FlashScope`。对于这种情况，Stripes会在每次收到一个请求时，针对会话检查存在的所有`FlashScope`；当生成闪存域的请求完成时，每一个闪存域开始“变老”，同时任何超过一定年龄（当前是２分钟）的将被销毁。这个看起来很像一个小范围内的会话过期。

## 综述

希望上述的状态管理和POST请求后重定向是有用的。`FlashScope`实际上提供了一个最好的示例去说明迄今为止为什么使用`ActionBeanContext`去管理所有状态相关的逻辑是一个好主意。

`FlashScope`在Stripes1.2中被介绍。在此之前非错误信息列表被存储在请求属性中。现在非错误信息被存储在闪存范围中。因此再要做一些改进是微不足道的，因为`ActionBeans`已经被完全从消息存储和检索的细节中分离了出来。所以当`ActionBeans`已经被请求直接访问时，是不能通过破坏当前代码做出改变。



[FlashScope]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/controller/FlashScope.html
[ActionBeanContext]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/action/ActionBeanContext.html
[RedirectResolution]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/action/RedirectResolution.html
