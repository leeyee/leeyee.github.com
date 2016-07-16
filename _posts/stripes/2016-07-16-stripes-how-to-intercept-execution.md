---
layout: post
title: Stripes框架如何做系列-拦截器
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Intercept+Execution](https://stripesframework.atlassian.net/wiki/display/STRIPES/Intercept+Execution)


Stripes设计了拦截器系统，这样可以很容易的为其添加功能。对于交叉性的请求行为，编写拦截器比起扩展Stripes已有组件功能要简单的多。

下面是Stripes生命周期和其拦截系统的核心类：

+ [LifecycleStage]是一个枚举类，用来描述一个请求处理的不同阶段。更多的关于生命周期详细细节可[参看这里](https://stripesframework.atlassian.net/wiki/pages/viewpage.action?pageId=492132)。
+ [Interceptor]是一个接口类，其定义了拦截器的接口方法
+ [Intercepts]是一个注解，用来注解拦截器在那个阶段被拦截
+ [ExecutionContext]包装了所有和ActionBean调用有关的上下文内容，并将其提供给拦截器

## 拦截器示例

让我们看一个示例，其实现了一个简单的拦截器，用来在每个请求被处理的开始和结束前输出一段日志：

> NoisyInterceptor.java
>
	@Intercepts({LifecycleStage.ActionBeanResolution,
	    LifecycleStage.HandlerResolution,
	    LifecycleStage.BindingAndValidation,
	    LifecycleStage.CustomValidation,
	    LifecycleStage.EventHandling,
	    LifecycleStage.ResolutionExecution})
	public class NoisyInterceptor implements Interceptor {
	    public Resolution intercept(ExecutionContext ctx) throws Exception {
		System.out.println("Before " + ctx.getLifecycleStage());
		Resolution resolution = ctx.proceed();
		System.out.println("After " + ctx.getLifecycleStage());
		return resolution
	    }
	}

虽然这个拦截器没有做任何实际有价值的事，但它能说明一些基本概念。首先，@Intercepts注解该拦截器在请求生命周期的哪些阶段被调用。示例中，我们指定了所有阶段，因此针对每一个ActionBean的请求，拦截器将被调用六次！其次，拦截器拦截围绕生命周期阶段。这样就可以执行代码在请求前和请求后。当拦截器准备执行生命周期代码（或者下游拦截器）时，只需要简单的调用`ExecutionContext.proceed()`方法即可。

实际上，拦截器可以决定是否完全跳过一个阶段，甚至可以通过返回一个`Resolution`中断之前的请求。当拦截器这样做的时候，`Resolution`被执行，而剩下的生命周期阶段将被忽略。

## 拦截器配置

拦截器的配置是相当简单的。使用Stripes 1.5及以上版本时，如果拦截器所在包是被配置在了*Extension.Packages* 参数中，那么拦截器将被自动检测到。也可通过Stripes过滤器的初始化参数进行配置：

> 在web.xml中配置拦截器（Stripes 1.5及以上）
>
	<init-param>
	    <param-name>Interceptor.Classes</param-name>
	    <param-value>
		com.myco.NoisyInterceptor
	    </param-value>
	</init-param>

通常来说，如果拦截器的执行顺序是重要的，那么应该使用web.xml进行配置。当多个拦截器在相同的生命周期阶段进行拦截时，他们的执行顺序依赖于其在配置列表中的顺序。

如果使用的是Stripes 1.4及其早期的版本，必须通过web.xml进行配置，唯一需要注意的是，Stripes默认配置了一个名叫[BeforeAfterMethodInterceptor]的拦截器。当指定拦截器时还需要指定[BeforeAfterMethodInterceptor]，除非你希望禁用它。

> 在web.xml中配置拦截器（Stripes 1.4及其早期版本）
>
	<init-param>
	    <param-name>Interceptor.Classes</param-name>
	    <param-value>
		com.myco.NoisyInterceptor,
		net.sourceforge.stripes.controller.BeforeAfterMethodInterceptor
	    </param-value>
	</init-param>

## 另一个示例：权限安全

这是一个在应用程序安全方面有用的拦截器示例。其原型可能看起来像这样：

> SecurityInterceptor.java
>
	@Intercepts(LifecycleStage.HandlerResolution)
	public class SecurityInterceptor implements Interceptor {
	    /** Intercepts execution and checks that the user has appropriate permissions. */
	    public Resolution intercept(ExecutionContext ctx) throws Exception {
		Resolution resolution = ctx.proceed();
>	 
		if (isPermitted(ctx.getActionBean(), ctx.getActionBeanContext()) {
		    return resolution;
		}
		else if (loggedIn(ctx.getActionBeanContext()) {
		    return new RedirectResolution("/security/Unauthorized.jsp");
		}
		else {
		    return new RedirectResolution("/security/Login.jsp");
		}
	    }
>	 
	    /** Returns true if the user is logged in. */
	    protected boolean isLoggedIn(ActionBeanContext ctx) {
		return ((MyActionBeanContext) ctx).getUser() != null;
	    }
>	 
	    /** Returns true if the user is permitted to invoke the event requested. */
	    protected boolean isPermitted() { ... }
	}

这个示例中，拦截器仅拦截指定的生命周期阶段——处理中。当这一阶段处理完成时，`ExecutionContext`对象中包含了被调用的ActionBean的信息，和正在被处理的事件——用足够多的信息去判断用户是否被允许访问。在此之上，拦截器为了进一步检查，可以通过`ActionBeanContext`获取`HttpServletRequest`信息。

## BeforeAfterMethodInterceptor拦截器

上面提到的[BeforeAfterMethodInterceptor]拦截器，给ActionBean提供了在确定的生命周期阶段前和后去执行指定方法的机会。ActionBean中，用@Before注解的方法会在指定的生命周期执行前被调用，而@After注解的方法则是在其之后被调用。

## SpringInterceptorSupport类

[SpringInterceptorSupport]是一个简单的基类，它提供将Spring　bean注入到自定义拦截器的功能。除此之外，它和直接实现了[Interceptor]接口的拦截器之间没有区别。



[LifecycleStage]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/controller/LifecycleStage.html
[Interceptor]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/controller/Interceptor.html
[Intercepts]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/controller/Intercepts.html
[ExecutionContext]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/controller/ExecutionContext.html
[BeforeAfterMethodInterceptor]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/controller/BeforeAfterMethodInterceptor.html
[SpringInterceptorSupport]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/integration/spring/SpringInterceptorSupport.html




