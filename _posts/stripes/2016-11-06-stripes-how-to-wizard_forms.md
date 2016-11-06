---
layout: post
title: Stripes框架如何做系列-向导表单
description: stripes框架如何做系列中文翻译。向导表单
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Wizard+Forms](https://stripesframework.atlassian.net/wiki/display/STRIPES/Wizard+Forms)


向导表单（跨越多个页面的逻辑表单）经常会出现问题。基于无状态的web处理跨多个页面的交互可能是相当棘手的。一个标准的示例是新用户的注册流程。因为用户需要通过被拆分成的多个页面一部分一部的输入信息。同时输入的信息在每一个页面都应被校验，并始终保留在同一个流中，并在结束的时候在一个原子事物中被提交。

## Stripes向导

在Stripes中创建一个向导流实际上是非常简单的。简单来说，它涉及编写一个单独的ActionBean去管理页面之间的流，并且通过使用`@Wizard`注解来标记它。除此之外，还取决于你是否想用单独的事件／方法去处理导航，或者每个事件一个方法。每个页面用不同的事件（方法）会使流的管理变得容易。下面是一个来自Bugzooky的简短示例:

> 一个向导 action bean示例
> 
	@Wizard
	@UrlBinding("/bugzooky/Register.action")
	public class RegisterActionBean extends BugzookyActionBean {
	    @ValidateNestedProperties({
	        @Validate(field="username", required=true, minlength=5, maxlength=20),
	        @Validate(field="password", required=true, minlength=5, maxlength=20),
	        @Validate(field="firstName", required=true, maxlength=50),
	    @Validate(field="lastName", required=true, maxlength=50)
	    })
	    private Person user; // getter/setters omitted for brevity
>	 
	    @Validate(required=true, minlength=5, maxlength=20, expression="this == user.password")
	    private String confirmPassword; // getter/setters omitted for brevity
>	 
	    /**
	     * Validates that the two passwords entered match each other, and that the
	     * username entered is not already taken in the system.
	     */
	    @ValidationMethod
	    public void validate(ValidationErrors errors) {
	        if ( new PersonManager().getPerson(this.user.getUsername()) != null ) {
	            errors.add("user.username", new LocalizableError("usernameTaken"));
	        }
	    }
>	 
	    public Resolution gotoStep2() throws Exception {
	        return new ForwardResolution("/bugzooky/Register2.jsp");
	    }
>	 
	    /**
	     * Registers a new user, logs them in, and redirects them to the bug list page.
	     */
	    @DefaultHandler
	    public Resolution registerUser() {
	        new PersonManager().saveOrUpdate(this.user);
	        getContext().setUser(this.user);
	        getContext().getMessages().add(
	        new LocalizableError(getClass().getName() + ".successMessage",
	        this.user.getFirstName(),
	        this.user.getUsername()));
>	 
	        return new RedirectResolution("/bugzooky/BugList.jsp");
	    }
	}
	
当一个ActionBean被标记为一个向导时，Stripes将会做以下事情：

+ 当表单被渲染时，Stripes将插入一个加密的隐藏字段，该字段包含所有展示在页面上的字段（基于安全考虑，如果这些丢失了的话，Stripes将会进行提示）
+ 在表单渲染的最后，请求中存在但尚未以表单形式呈现的任何字段都将作为隐藏字段。
+ 必填字段的校验是基于提交页面上已知的字段来的。

基于这样的结果，你可以构建自己的ActionBean，就好像表单真的是在一个页面上（但你仍然不得不小心自定义校验中的空校验），并且移动字段从一个页面到另个页面是无需更改你的ActionBean或者任何配置信息的。

## “开始”事件的特殊处理

如上所述，Stripes的向导系统不喜欢当请求指向向导ActionBean时，该请求没有提供应该被校验字段的有效加密隐藏字段。这会导致在事件开始你想让向导ActionBean决定如何初始流时产生问题（比如，决定发送哪一个注册页面给用户时）。

为了处理这个问题，你可以设计一个或多个“开始”事件。对于这些事件，假如加密字段的列表不存在时，Stripes不会出错。因此，这些事件应该仅被当做前置事件使用，而不是首次通过向导流提交数据时使用。语法（从上面复制我们的例子）如下：

> 使用开始时间的向导
> 
	@Wizard(startEvents="begin")
	@UrlBinding("/bugzooky/Register.action")
	public class RegisterActionBean extends BugzookyActionBean {
	    ....
	    /** Sends the user to the registration page at the start of the flow */
	    public Resolution begin() {
	        return new RedirectResolution("/bugzooky/Register.jsp");
	    }
	    ....
	}

## 向后导航的问题

向后导航仍然存在几个问题。Stripes使用的自动向导系统假设了提交页面上的所有数据都是有效的，或者用户将被显示错误消息。但有时可能期望允许用户在向导中回退，而不强制验证当前页面上的信息。

这是当前系统的局限。 有三个可解决的方案，但都不太理想：

1. 使用JavaScript执行向后导航。这样做的缺点是，通过不向服务器提交任何数据，用户在当前页面输入的信息（如果有的话）将会丢失
2. 强制用户在执行返回之前提供有效的输入
3. 不要使用Stripes内置必填字段的校验，而是根据提交的页面自行进行校验。
