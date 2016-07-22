---
layout: post
title: Stripes框架如何做系列-布局复用
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Layout+Reuse](https://stripesframework.atlassian.net/wiki/display/STRIPES/Layout+Reuse)


几乎所有的web应用程序都不止一个页面。但大多数情况所有的页面（或者针对每个页面子集使用不同的布局）都有基本相同的主题或者布局。因此常规的通用处理方式是编写如下的JSP页面：

> 使用include标签进行简单的布局复用
>
	<jsp:include page="/nav/header.jsp"/>
	...
	<jsp:include page="/nav/context.jsp"/>
	My page content here
	<jsp:include page="/nav/footer.jsp" />

对于简单的场景，这种处理方式恰如其分，但是仍会带来一些问题。当没有在指定位置包含正确的JSP时，页面很容易被搞坏掉。亦或因为想在head节点中插入脚本和样式，而不得不为每个页面定义head节点并开放或关闭body节点。如此以来，页面会变得不一致。更何况，如果想改变现有布局，就不得不修改站点中的每一个页面。同时，现在几乎没有在不同布局中展示页面而不用修改页面的情况出现。

当然，这个问题并不是没有解决方案，而是可以通过已有的工具，比如[Tiles]和[Sitemesh]来解决的。但我不认为这个问题已经通过简单的方式被解决了。Tiles虽然功能很全，但对于百分之九十九的人来说其使用起来是复杂的。我更偏向使用Sitemesh，因为它提供了一些Stripes没有的布局标签（下面将会讲到）。但它依赖一些XML配置和第三方包等。因此Stripes提供了一个非常简单但很强大的解决方案去解决该问题。如果符合你的要求，那么建议使用，否则可以看看Sitemesh。

## 使用Stripes布局标签进行基本布局

Stripes包含三个简单的标签用来创建和使用布局，它们是：

+ `<stripes:layout-definition>`：定义一个可复用布局
+ `<stripes:layout-component>`：定义一个布局内的组件
+ `<stripes:layout-render>`：在页面中展示布局内容

Stripes使用JSP定义和展示布局内容。下面是一个简单的使用Stripes布局标签展示有统一页眉和页脚的布局示例：

> /layout/default.jsp
>
	<%@ page contentType="text/html;charset=UTF-8" language="java" %>
	<%@ taglib prefix="stripes" uri="http://stripes.sourceforge.net/stripes.tld" %>
>	 
	<stripes:layout-definition>
	<html>
	    <head>
		<title>Layout Example</title>
		<link rel="stylesheet"
		    type="text/css"
		    xhref="${pageContext.request.contextPath}/style/default.css"/>
		<stripes:layout-component name="html_head"/>
	    </head>
>	 
	    <body>
		<stripes:layout-component name="header">
		    <jsp:include page="/layout/_header.jsp"/>
		</stripes:layout-component>
>	 
		<div class="pageContent">
		    <stripes:layout-component name="contents"/>
		</div>
>	 
		<stripes:layout-component name="footer">
		    <jsp:include page="/layout/_footer.jsp"/>
		</stripes:layout-component>
	    </body>
	</html>
	</stripes:layout-definition>

当这个布局被渲染时，有以下事情发生：

+ `<stripes:layout-definition>`外的内容是被忽略的
+ 任何`<stripes:layout-definition>`内`<stripes:layout-component>`外的内容将被直接展示
+ 当遇到`<stripes:layout-component>`标签时，除非没有被重写，那么内容将被直接渲染，否则将使用重写内容替代当前定义中已有的内容

让我们看下使用了这个布局的Hello World页面。

> /HelloWorld.jsp
> 
	<%@ taglib prefix="stripes" uri="http://stripes.sourceforge.net/stripes.tld" %>
	<stripes:layout-render name="/layout/default.jsp">
	    <stripes:layout-component name="contents">
		Hello World!
	    </stripes:layout-component>
	</stripes:layout-render>

注意这里*stripes:layout-render*的*name*属性就是default.jsp的文件路径。在这个示例中再次使用了`<stripes:layout-component>`标签，但重写了布局组件的页面内容。布局中的任何组件都可以被重写。在示例布局顶部，有一个叫做“html_head”的布局组件。一个具体的页面可以重写这个组件内容（添加一个`<script>`块或者一些meta标签），而不用去直接修改布局代码。

> **使用绝对路径**
> 
> > 在*stripes:layout-render* 标签的*name*属性中，始终使用以／开始的绝对路径名。

> **使用有效的java命名规则命名组件名**
> 
> > 虽然在一些场景下使用类似“body-content”（命名包含连字符）这样的组件命名可以正常工作，但它仍可能产生一些难以跟踪的问题。请考虑将使用java命名规则去命名组件作为一种最佳编程实践。尤其是使用下划线替代连字符，如“body_content”，以及不要在名字中使用空格等。


## 传递额外信息到布局

当你想让你的页面看起来更加标准，那么当前这么做就已经很不错了。但或许页面的标题应该使用一种特定的风格被显示，并且总是在同一个位置。或许你还想让浏览器窗口显示页面标题。好吧，你可以强迫你的用户通过`<stripes:layout-components>`重写像页面标题这样的小事情的内容，但这样会让人感觉很笨重。

出于这样的考虑，`<stripes:layout-render>`标签是可以接受动态属性的。这意味着你可以在`<stripes:layout-render>`标签中使用任何你喜欢的属性。所有这些属性被当做布局定义页面的上下文属性。这样可以很方便的通过EL表达式来访问这些属性了。想象下，将JSP示例改成这样：

> /HelloWorld.jsp
> 
	<%@ taglib prefix="stripes" uri="http://stripes.sourceforge.net/stripes.tld" %>
	<stripes:layout-render name="/layout/default.jsp" pageTitle="Using A Layout">
	    <stripes:layout-component name="contents">
		Hello World!
	    </stripes:layout-component>
	</stripes:layout-render>

然后我们就可以在布局定义中使用*pageTitle* 了：

> /layout/default.jsp
>
	...
	<stripes:layout-definition>
	<html>
	    <head>
		<title>Examples: ${pageTitle}</title>
		<link rel="stylesheet"
		    type="text/css"
		    xhref="${pageContext.request.contextPath}/style/default.css"/>
		<stripes:layout-component name="html_head"/>
	    </head>
>	 
	    <body>
		<stripes:layout-component name="header">
		    <jsp:include page="/layout/_header.jsp"/>
		</stripes:layout-component>
>	 
		<div class="title>${pageTitle}</div>
>	 
		<div class="pageContent">
		    <stripes:layout-component name="contents"/>
		</div>
>	 
		<stripes:layout-component name="footer">
		    <jsp:include page="/layout/_footer.jsp"/>
		</stripes:layout-component>
	    </body>
	</html>
	</stripes:layout-definition>


但是，假设在某些情况下，页面标题不是这么简单呢？或许我们要包含用户名并且做一些格式化和国际化呢？好吧，碰巧的是*layout-components*标签的*name*属性值也可在页面上下文中被使用。因此我们可以使用如下的方式定义另一个JSP传递*pageTitle*:

> /HelloWorld2.jsp
>
	<%@ taglib prefix="stripes" uri="http://stripes.sourceforge.net/stripes.tld" %>
	<stripes:layout-render name="/layout/default.jsp">
	    <stripes:layout-component name="contents">
		Hello World!
	    </stripes:layout-component>
	    <stripes:layout-component name="pageTitle">
		<jsp:useBean scope="session" name="user" class="com.myco.myapp.User"/>
		<c:choose>
		    <c:when test="${user.male}>Mr.</c:when>
		    <c:otherwise>Ms.</c:otherwise>
		<c:choose>
		${user.lastName} is using a Layout
	    </stripes:layout-component>
	</stripes:layout-render>


这里有一些值得我们注意的点：

+ 只要你愿意你可以传递许多参数到布局
+ 参数不仅可以当做渲染标签属性，也可以当做渲染标签内的组件属性
+ **但是：** 只有组件可以通过`<stripes:layout-component>`标签被放入到布局中，渲染属性仅作为页面上下文属性使用
+ 布局组件必须生成一个字符串，而渲染属性可以是任何类型（比如，可以传递一个列表或者一个User对象到布局）

## 布局嵌套

目前为止所有的示例都是使用单一布局来设计整个页面。这一节将介绍如何使用页面布局片段、嵌套布局或者继承布局来进行页面设计。

### 页面布局片段

显而易见，你可以使用布局来控制一小块页面的渲染。在这种方式下使用布局标签和使用JSP片段自定义新的标签文件是非常相似的。但重要的区别在于，通过JSP片段自定义标签文件时，这些JSP片段中不能包含任何脚本。通常这都不是问题，但有些时候这种方式却会带来一些问题。不管怎么样，可以想象下，或许可以通过一个标准的方式展示带有标题的图片，那么你可以定义一个如下的布局：

> /layout/imgage.jsp
> 
	<stripes:layout-definition>
	    <table style="minimal">
		<tr>
		    <td align="center"><img xsrc="${pageContext.request.contextPath}/${src}" alt="${caption}" /></td>
		</tr>
		<tr>
		    <td style="caption">${caption}</td>
		</tr>
	    </table>
	</stripes:layout-definition>


然后在JSP中给图片一个统一的设置：

> /HelloWorld.jsp
> 
	<%@ taglib prefix="stripes" uri="http://stripes.sourceforge.net/stripes.tld" %>
	<stripes:layout-render name="/layout/default.jsp" pageTitle="Using A Layout">
	    <stripes:layout-component name="contents">
		<p>Lookee! An image!</p>
>	 
		<stripes:layout-render name="/layout/image.jsp"
		    xsrc="/HelloWorld.jpg" caption="Hello World!"/>
	    </stripes:layout-component>
	</stripes:layout-render>

现在，当用户突然决定他们想将图片展示的标题从底部挪到旁边时，那们你只需要改变布局即可，而不是去更新站点下的所有JSP页面。

### 嵌套布局

到这一步为止你的站点看起来很不错，所有的导航都是一致的。但是仍然有一堆去做不同搜索的页面，它们只是略有不同。同时，一些搜索条件是在结果的上方，一些则是在下方，还有一些按钮是左对齐，另一些则是右对齐。那么你可以为搜索定义一个布局，并将其作为全局布局！它可能看起来是这样的：

> /layout/search.jsp
> 
	<stripes:layout-definition>
	    <stripes:layout-render name="/layout/default.jsp" pageTitle="${type} Search">
		<stripes:layout-component name="contents">
		    <div class="searchFields">${inputs}</div>
		    <div class="searchButtons">${buttons}</div>
		    <div class="searchResults">${results}</div>
		</stripes:layout-component>
	    </stripe:layout-render>
	</stripes:layout-definition>

在这个示例中，我们看到用一个布局去定义另一个布局（搜索使用默认布局），但是在默认布局的页面上下文中强制增加了额外的结构。

> 因为将`<stripes:layout-render>`标签内嵌在了`<stripes:layout-definition>`标签中，所以`<stripes:layout-render>`标签内任何`<stripes:layout-component>`标签将被绑定到`<stripes:layout-render>`标签中，而不是`<stripes:layout-definition>`标签中。这就是为什么在示例中，通过EL表达式（inputs,buttons和results）替代`<stripes:layout-component>`标签从页面上下文中导入组件的原因。


[Tiles]: http://struts.apache.org/userGuide/dev_tiles.html
[Sitemesh]: http://www.opensymphony.com/sitemesh/

