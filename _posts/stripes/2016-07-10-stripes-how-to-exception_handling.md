---
layout: post
title: Stripes框架如何做系列-异常处理
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Exception+Handling](https://stripesframework.atlassian.net/wiki/display/STRIPES/Exception+Handling)

## 异常处理简介

Servlet规范的内建异常处理机制是有限的，对于处理Web应用产生的异常。具体来说，当异常发生时，它只能将请求转向到一个JSP或者一个文件，而不能指向一个servlet或者一个没有可执行代码的JSP。而这些就是Stripes的异常处理机制要去解决的。


Stripes大多数主要的接口都允许开发者抛出任何不想处理的异常。比如处理方法、验证方法等。调用所有抛出的异常，取决于你定义的异常处理策略：Stripes是不会强加给你的。也就说，Stripes的作者建议应该传递不能处理的异常，让Stripes框架帮你处理，而不是捕获、包装或者抛出异常。

Stripes异常处理是通过实现[ExceptionHandler]接口来完成的。该接口用来处理请求期间出现的任何异常。他们可能重新抛出异常，或者执行任意代码并返回一个`Resolution`告诉Stripes下一步应该去做什么。


> [ExceptionHandler]在Stripes过滤中被调用。这样就可以在过滤器中处理来自ActionBeans、JSP，甚至其他比Stripes过滤器级别低（Filter Chain 过滤器链路）的Servelet过滤器中生成的异常。

## 默认异常处理

默认的异常处理类[DefaultExceptionHandler]并没有做太多事情。基本上就做了如下操作而已：如果当前正在处理的异常是ServletException，那么该异常将被重新抛出去，否则它将会被包装成StripesServletException对象后在被抛出去。

然而，通过扩展[DefaultExceptionHandler]能很容易的通过不同的方式去处理不同类型的异常。你唯一要做的就是添加并任意命名一个包含异常类型、http请求和http响应三个参数的方法。此外，如果你的方法返回一个`Resolution`，那么该`Resolution`将会被执行。


	public class MyExceptionHandler extends DefaultExceptionHandler {
	    public Resolution handleDatabaseException(SQLException exc, HttpServletRequest request, HttpServletResponse response) {
		// do something to handle SQL exceptions
		return new ForwardResolution(...);
	    }
	 
	    public Resolution handleGeneric(Exception exc, HttpServletRequest request, HttpServletResponse response) {
	    // general exception handling
		return new ForwardResolution(...);
	    }
	}

当一个异常被处理时，[DefaultExceptionHandler]查找最符合该异常的方法进行处理。如果不能找到与触发异常最匹配的处理方法，它将层层寻找该异常的父类型。如果依旧无法找到，那么该异常将会被重新抛出。因此针对此种情况，建议在继承[DefaultExceptionHandler]实现异常处理时，一定要有一个处理所有异常父类的方法，比如上述代码中的`handleGeneric`方法。


## 委派异常处理

[DelegatingExceptionHandler]允许针对异常可以有多个处理类，只要每一个处理类实现[AutoExceptionHandler]接口即可。除此之外，它的工作方式与[DefaultExceptionHandler]是相似的。

实现了[AutoExceptionHandler]接口的类允许有一个或多个相同签名的方法：
 
	public Resolution someMethod(Exception e, HttpServletRequest req, HttpServletResponse res);
	public Resolution someMethod(NullPointerException npe, HttpServletRequest req, HttpServletResponse res);

当[DelegatingExceptionHandler]初始化时，它将扫描类路径下实现了[AutoExceptionHandler]接口的方法。类路径配置可以在Stripes拦截器中通过init-param节点配置DelegatingExceptionHandler.Packages或Extension.Packages参数。

> web.xml
>
	<init-param>
	     <param-name>DelegatingExceptionHandler.Packages</param-name>
	     <param-value>com.myco.web,com.myco.shared</param-value>
	 </init-param>


## 自定义异常处理

自定义异常处理相当简单。你只需要实现`ExceptionHandler`接口并实现两个方法（包含继承的一个）即可。比如：

	public class MyExceptionHandler implements ExceptionHandler {
	    /** Doesn't have to do anything... */
	    public void init(Configuration configuration) throws Exception { }
	 
	    /** Do something a bit more complicated that just going to a view. */
	    public void handle(Throwable throwable, HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		TransactionUtil.rollback(); // rollback any tx in progress
		if (AppProperties.isDevMode()) {
		    throw new StripesServletException(throwable);
		}
		else {
		    request.setAttribute("exception", throwable);
			    request.getRequestDispatcher("/error.jsp").forward(request, response);
		}
	    }
	}

更简单的方式是继承[DefaultExceptionHandler]类并添加上述的异常处理方法即可。

## 配置异常处理

当创建了自定义异常处理类后，还需要对其进行配置才能使其正常工作。方法是在扩展(具体可看[Extensions](https://stripesframework.atlassian.net/wiki/display/STRIPES/Extensions))包或者ExceptionHandler.Class参数中指定自定义异常类。

	<init-param>
	    <param-name>ExceptionHandler.Class</param-name>
	    <param-value>com.myco.exception.MyExceptionHandler</param-value>
	</init-param>


## 在异常处理中访问ActionBean、ActionBeanContext等

异常处理的接口是相当简单的：

	public void handle(Throwable throwable, HttpServletRequest request, HttpServletResponse response) throws ServletException;

这主要是因为异常处理可以处理来自Stripes应用中任何地方的异常，甚至是在异常发生前已被创建的ActionBean和ActionBeanContext！[AutoExceptionHandler]接口也是如此。因此这可能会让你想知道该如何去访问ActionBean等信息。例如，你可能知道，基于被处理异常的类型是来自那个`ActionBean`的。或者你可能只是简单的希望在当前异常所在`ActionBean`中做一些不同的处理。

获取`ActionBean`是相对简单的。获取后就可以很容易的通过`ActionBean`获取`ActionBeanContext`和`ValidationErrors`信息了。

	/**
	 * If there's an ActionBean present, send the user back where they came from with
	 * a stern warning, otherwise send them to the global error page.
	 */
	public void handle(Throwable throwable, HttpServletRequest request, HttpServletResponse response) throws ServletException {
	    ActionBean bean = (ActionBean) request.getAttribute(StripesConstants.REQ_ATTR_ACTION_BEAN);
	 
	    if (bean != null) {
	        bean.getContext().getValidationErrors().addGlobalError(new SimpleError("You made something blow up! Bad user!"));
	        bean.getContext.getSourcePageResolution().execute(request, response);
	    }
	    else {
	        request.getRequestDispatcher("/error.jsp").forward(request, response);
	    }
	}


[ExceptionHandler]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/exception/ExceptionHandler.html
[DefaultExceptionHandler]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/exception/DefaultExceptionHandler.html
[DelegatingExceptionHandler]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/exception/DelegatingExceptionHandler.html
[AutoExceptionHandler]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/exception/AutoExceptionHandler.html
