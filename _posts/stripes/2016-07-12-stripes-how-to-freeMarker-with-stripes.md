---
layout: post
title: Stripes框架如何做系列-集成FreeMarker
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/FreeMarker+with+Stripes](https://stripesframework.atlassian.net/wiki/display/STRIPES/FreeMarker+with+Stripes)


这份文档主要提供对那些已经熟悉[FreeMarker]框架并想将其与Stripes集成的帮助。因此这里不打算去介绍[FreeMarker]本身，因为[FreeMarker]自身已有了优秀的[说明文档](http://www.freemarker.org/docs/index.html)。

## FreeMarker配置

首先第一步是去[下载FreeMarker](http://sourceforge.net/project/showfiles.php?group_id=794)。强烈建议使用[FreeMarker]2.3.8及其以上版本。从2.3.8开始，[FreeMarker]新增了一些对未支持JSP标签的支持以便实现完全支持JSP 2.0标签库。由于Stripes的一些标签依赖JSP 2.0 API，因此如果使用低版本的[FreeMarker]会导致其无法正常工作。 

下载完成后，拷贝/lib目录下的FreeMarker.jar文件到你的web应用类路径下，你的类路径有可能是WEB-INF/lib

接下来你需要配置[FreeMarker] servlet，以下是你需要在web.xml里添加的最小配置内容。更多的配置细节你可以参看[FreeMarker] 的文档说明。
 
> web.xml FreeMarker servlet片段
>
	<servlet>
	    <servlet-name>Freemarker</servlet-name>
	    <servlet-class>freemarker.ext.servlet.FreemarkerServlet</servlet-class>
>	 
	    <init-param>
	        <param-name>TemplatePath</param-name>
	        <param-value>/</param-value>
	    </init-param>
	    <init-param>
	        <param-name>template_update_delay</param-name>
	        <param-value>0</param-value> <!-- 0 is for dev only! Use higher value otherwise. -->
	    </init-param>
	    <load-on-startup>1</load-on-startup>
	</servlet>
>	 
	<servlet-mapping>
	    <servlet-name>Freemarker</servlet-name>
	    <url-pattern>*.ftl</url-pattern>
	</servlet-mapping>

这里使用了*ftl*作为[FreeMarker] servlet 映射的后缀，当然你也可以使用其他后缀命名。*TemplatePath* 告诉FreeMarker应该去web应用程序的根目录下寻找模板文件，同样你也可以使用其路径。

配置[FreeMarker]的最后一步是要确保Stripes Fitler过滤请求是指向[FreeMarker]模板的。这一步是可选的，但强烈建议进行配置。除非不允许（永远不会）直接指向[FreeMarker]模板（比如，导航总是首先通过ActionBeans并且总是forward 而永远不会直接跳转到视图），那么这一步就没必要了。

> web.xml 过滤 FreeMarker 请求片段
>
	<filter-mapping>
	    <filter-name>StripesFilter</filter-name>
	    <servlet-name>Freemarker</servlet-name>
	    <dispatcher>REQUEST</dispatcher>
	</filter-mapping>

## 使用FreeMarker和Stripes

一旦FreeMarker安装和配置完成，就可以立即开始使用了。Stripes与视图层有大量交互的主要部分是标签库。在FreeMarker中Stripes是无法通过提供一个替代宏来使用的，但是多亏FreeMaker的内嵌轻量级标签容器，使得可以在FreeMaker中使用Stripes标签库。为此，需要在FreeMarker模板文件的顶部添加一个单独的`assign`语句：

> 在FreeMaker模板中使用Stripes标签库
>
	[#assign s=JspTaglibs["http://stripes.sourceforge.net/stripes.tld"]]


因为Stripes使用ActionBean作为一个请求属性，而FreeMarker使所有的请求属性在模板模型中可用，所以可以使用FreeMarker的内置表达式语言来引用ActionBean属性，就像任何其他模型对象一样。Stripes不能使用自身的表达式语言（当Stripes使用JSP时使用JSP的EL表达式），因此在FreeMarker中访问ActionBeans就如你所想的，是通过FreeMarker的表达式语言了。

## FreeMarker快速入门实例


下面代码那是基于快速入门指南中的JSP代码改造而成的一个FreeMarker模板。ActionBean中除了将'index.jps'改成'index.ftl'外其他都一样。

> FreeMarker版本的快速入门模板-index.ftl
>
	[#ftl]
	[#assign s=JspTaglibs["http://stripes.sourceforge.net/stripes.tld"]]
	<html>
	<head>
	<title>My First Stripe</title>
	<style type="text/css">
	input.error { background-color: yellow; }
	</style>
	</head>
	<body>
	<h1>Stripes Calculator - FTL</h1>
>	 
	Hi, I'm the Stripes Calculator. I can only do addition. Maybe, some day, a nice programmer
	will come along and teach me how to do other things?
>	 
	[@s.form action="/examples/quickstart/Calculator.action"]
	[@s.errors/]
	<table>
	    <tr>
	        <td>Number 1:</td>
	        <td>[@s.text name="numberOne"/]</td>
	    </tr>
	    <tr>
	        <td>Number 2:</td>
	        <td>[@s.text name="numberTwo"/]</td>
	    </tr>
	    <tr>
	        <td colspan="2">
	            [@s.submit name="addition" value="Add"/]
	            [@s.submit name="division" value="Divide"/]
	        </td>
	    </tr>
	    <tr>
	        <td>Result:</td>
	        <td>${(actionBean.result)!}</td>
	    </tr>
	</table>
	[/@]
	</body>
	</html>

第一个也是最明显的变化是，该模板使用FreeMarker的方括号标签语法替代了JSP语法。接下来的变化是去除了JSP标签的导入语句，并将其替换成位于第二行的FreeMarker的声明语句。

Stripes标签在JSP中采用`<stripes:tagname attr="value"/>` 的形式。而在 FreeMarker模板中采用了`[@s.tagname attr="value"` 这种形式。改变**'stripes'**前缀到**'s'**是任意的（这两个前缀都是有效的对于两个模板系统），但是's'更符合FreeMarker偏向简洁一致的风格。

最有一个显著的变化是下面这行代码：

	<td>${(actionBean.result)!}</td>

表达式被包裹在括号中并附带**'!'**，这么做是因为模板第一次被渲染时，*actionBean* 等于 *null*，FreeMarker处理时会抛出异常。**'!'** 操作符的作用就是为了告诉FreeMarker，当表达式为空时忽略处理，避免模板处理抛出异常。

## 陷阱

下面罗列了一些简单的问题清单，这些问题是当一个熟悉JSP但不熟悉FeerMarker的用户，遇到需要将一些小的应用从JSP迁移到FreeMarker时可能会遇到的。这些问题都不是FreeMarker自身的问题，但对于任何熟悉JSP的人却是容易被坑的问题。

1. 一些Stripes标签名称中包含连字符。这在FreeMarker中是不被支持的除非标签名是被引用的。因此，例如你想使用*layout-render* 标签在FreeMare中，你不得不使用`[@s["layout-render"]]`这种方式。结束标签必须使用`[/@]`

2. FreeMarker比起JSP对于*null*值的处理是比较严格的。因此对于任何你通过表达式（比如：`actionBean.user.name`）访问的bean值，假如该值有可能为*null* ，那么你需要用FreeMarker的内建表达式去避免发生这种情况。比如使用`actionBean.user.name!` 将*null*值渲染成空字符串，或者使用`actionBean.user.name!'New User'` 将*null* 值渲染成一个新的对象*'New User'*，否则程序会在解析模板时抛出错误。

3. 在FreeMarker中使用引号引用非字符串是不必要也是不正确的。比如，在JSP中我们可以这样写
	
		<stripes:text name="foo" value="${actionBean.user.dateOfBirth}"/>
		
	将提供给Stripes标签的将是精确的属性值——可能是`java.util.Date`； 在FreeMarker中如果我们这样写
	
		[@s.text name="foo" value="${actionBean.user.dateOfBirth}"/]
	
	将导致属性的字符串值被提供给标签（调用属性的`toString()`方法）。正确的是FreeMarker语法是比较简洁的：
	
		[@s.text name="foo" value=actionBean.user.dateOfBirth/]



[FreeMarker]: http://www.freemarker.org/
 