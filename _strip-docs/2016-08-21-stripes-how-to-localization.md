---
layout: post
title: Stripes框架如何做系列-本地化
description: stripes框架如何做系列中文翻译
category: java
tag: [stripes,translation]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Localization](https://stripesframework.atlassian.net/wiki/display/STRIPES/Localization)


本地化是越来越多的网站必须处理的事情。本地化从来都不是不容易的，但是Stripes尽量让其做起来简单。这篇文档我们将覆盖以下内容：

+ 选择使用的语言环境
+ 选择使用的字符编码
+ 寻找本地化资源
+ 本地化验证
+ 本地化错误信息
	+ 在自定义代码中使用本地化错误信息
+ 本地化按钮和标签
+ 传递本地化变量到布局
+ 本地化的其他事情

## 选择使用的语言环境

构建一个本地化应用可能面临的第一个挑战是针对指定的请求使用哪一个本地化设置。因为有可能你支持的语言和区域不止一个。当用户提交请求，该请求可以包含用户首选语言环境的有序列表。因此你不得不基于支持的语言环境，以及用户首选的语言环境去选择为用户服务的语言环境。

Stripes使用[LocalPicker]选择器决定针对当前请求使用那个语言环境。[LocalPicker]从Stripes拦截器中开始执行，所以它甚至会执行直接指向JSP的请求（你不需要通过ActionBean来完成）。一旦[LocalPicker]确定了使用的语言环境，Stripes将通过`HttpServletRequestWrapper`类去调用`request.getLocale()`和`request.getLocales()`方法返回唯一选择的语言环境。这意味着不仅Stripes不需要重新选择就能使用正确的语言环境，也意味着任何其他的本地化工具通过调用`request.getLocale[s]()`方法也将默认返回正确的语言环境。这包括JSTL的_fmt:*_标签——是不是很酷？

Stripes使用[DefaultLocalePicker]作为默认的选择器。[DefaultLocalePicker]通过一个语言[配置](https://stripesframework.atlassian.net/wiki/display/STRIPES/Configuration+Reference)列表决定系统支持的语言环境。假如没有配置列表，它将使用默认的与当前系统环境相同的语言环境。比如，通过调用`java.util.Locale.getDefault()`方法来获取。一个支持美语或者日本语的配置列表可能看起来如下：

	<init-param>
	    <param-name>LocalePicker.Locales</param-name>
	    <param-value>en_US,ja</param-value>
	</init-param>

请求发生时，[DefaultLocalePicker]遍历用户首选的语言配置列表，并且尝试匹配系统中可用语言区域的设置。选择算法是：优先匹配多段，对于相同匹配段数，优先匹配用户配置列表。

> 很明显的en\_US\_foo匹配具有三段的en\_US\_foo，同样它也匹配_en_，因为_en_被当做有所有的三段来对待。这是因为在第二个例子中，语言段和变量段都有两个空字符串，因此被视为相等。


## 选择使用的字符编码

选择使用正确的字符编码也是非常棘手的。许多浏览器在提交表单数据时没有指明字符编码，这导致服务器端使用系统默认的字符编码。这可能会造成一些问题，特别是处理多字符编码时！

为了应对这种情况，Stripes允许针对每一个语言指定字符编码；只要遵循使用冒号将语言配置和字符配置分隔即可。比如：

	<init-param>
	    <param-name>LocalePicker.Locales</param-name>
	    <param-value>en_US:UTF-8,ja:Shift_JIS</param-value>
	</init-param>

如果声明了字符编码，Stripes将确保`HttpServletRequest`中所有的字符数据被转成指定编码后的字符，并且所有返回客户端的字符数据将使用同样的字符编码。如果没有指定字符编码，Stripes则不会进行字符编码，而是将其交给`Servlet`容器去选择编码并处理。

## 寻找本地化资源

Stripes识别两种类型的本地化信息。第一种类型是错误信息；第二种是字段名。每一种类型的信息通过[资源包](http://java.sun.com/j2se/1.5.0/docs/api/java/util/ResourceBundle.html)查找使用。如果你要写一个本地化应用，那么花一些时间去深入了解下资源包是值得的。我不打算在这里解释关于资源包的所有事情，只要知道具有相同名称的一组属性文件的[PropertyResourceBundle]可能是最常见的资源包类型即可。

默认情况下，Stripes对于错误信息和字段名使用一个单独的资源包。其包名是*StripesResources*。这意味着，Stripes通过类似*StripesResources.properties*、*StripesResources_en_US.properties*的文件名寻找属性文件（在类路径下），资源包
是半智能的，因此假如没有完全匹配到，它也总是返回一个包，并尝试使用最匹配的。

可以通过两种方式来改变Stripes使用包的方式。最简单的方式是使用不同名字配置`DefaultLocalizationBundleFactory`。可以对错误信息和字段名使用不同的包，或者相同的，这取决于你。

> 包名应该总是由前缀（比如，StripesResources）而不是文件名（比如，StripesResources.properties）组成。有多种类型的包，因此假如文件包属性是你没有遇到过的，那么可以查看JDK文档。

## 本地化验证

关于本地化验证实际上没有什么可说的。内置数字和日期类型的转换器使用java.text包的本地化功能进行类型转换，因此如果服务用户的页面本地化为法语，那么预期用户输入的数字和日期应被法语化。

[BooleanTypeConverter]和[EnumeratedTypeConverter]不接受本地化输入。布尔类型通常不作为文本或者手动输入展示给用户，所以JDK不支持本地化布尔类型，同样Stripes也不支持。如果你需要这样做，实现起来也不是很困难（使用字典在语言包中查找单词true和false等）。枚举类型被定义为有限数量的值，这些值是在编译时被确定的，因此对其本地化是没有意义的。


## 本地化错误信息

所有通过Stripes内置验证和类型转换产生的验证错误信息都是一个[ScopedLocalizableError]类实例。这样确保了错误信息被展示给用户时可以被本地化，如果在需要时。通过查看[验证指南](https://stripesframework.atlassian.net/wiki/display/STRIPES/Validation+Reference)可以了解用到的验证错误信息的名称。

在验证消息中使用字段名是相当普遍的，可以通过许多方式实现。你的第一个方式可能是硬编码字段名在消息中。由于消息本身可以被本地化，因此这种方式可正常工作。但是对于不同的字段可能使用相同的错误信息，因此你将不得不多次拷贝/粘贴/编辑错误信息。

一个好的方式是使用提供的替换变量在消息模板中插入字段名。因此你能定义一个全局消息-{0}是必须的字段-而不用写几百个使用内嵌字段的消息。{0}在运行时被字段名的替换...但其字段名各有其来处。

如果你不想定义字段名，Stripes将试图提供通过分解表单字段名得来的用户友好的一些东西。但是这些将不会被本地化。最好的替代方式是为你的字段名提供一些本地化的值。通常是在StripesResources中，语法如下：


	actionPath.fieldName=Field Name 
	# or just... 
	fieldName=Field Name 

这允许你指定具体的表单字段名，并只需定义一次你在许多地方需要使用的字段名。例如，你有一个action等于*/security/login.action*的表单，并且有一个叫*user.password*的字段名，那么Stripes将首先寻找如下的资源声明：

	/security/login.action.user.password=Secret Magic Word 

如果不能找到，Stripes将会接着寻找：

	user.password=Secret Magic Word


使用斜杠开始的字段名看起来有点奇怪，但是你应该能习惯！


###在自定义代码中使用本地化错误信息

当你需要在应用中包含错误并且应用需要本地化时，有至少两种可能出现的情况。

首先，假如自定义[TypeConverter]类，当转换失败的时候你可能需要提供验证错误信息。这种情况下，你或许应该使用[ScopedLocalizableError]，因为其允许你提供默认的错误消息然后在特定的地方重载他们。

其次，假如任何实现了`Validatable`接口的自定义ActionBeans，你需要对自定义验证失败提供你自己的错误信息。因为这些错误信息可能是针对特定的ActionBeans的，因此建议使用[LocalizableError]类。错误消息的名称完全由你决定，但是建议使用action路径开始，这样可以和其他错误消息关键字保持一致。

## 本地化按钮和标签

本地化按钮和标签只是一个在“本地化错误信息”那一节描述的本地化字段名的特列。Stripes提供以下标签用来生成表单按钮：`<stripes:button.../>`， `<stripes:submit.../>` 和 `<stripes:reset.../>`以及一个单独用来生成表单字段label的标签：`<stripes:label.../>`。这些标签允许你去决定在页面上直接显示给用户的值，他们也支持通过字段名去查找本地化的值。重现刚才上面说的，假如你有一个类似下面的表单：

	<stripes:form action="/security/login.action">
	<stripes:label for="username"/>: <stripes:text name="username"/>
	<stripes:submit name="login"/> <stripes:reset name="reset"/>
	</stripes:form>


然后你可能想要在你的字段名包中定义下面的资源：

	# Like this... 
	/security/login.action.username=Username 
	/security/login.action.login=Log In 
	/security/login.action.reset=Clear Form 

	# Or Maybe just like this... 
	username=Username 
	login=Log In 
	reset=Clear Form

如果没有合适的本地化资源可用于给定的按钮或者标签，那么标签将检查标签体（标签的text）和值属性。假如标签体是非null同时也是非空的，那么将被使用。否则值属性将被使用。这意味着，如果你需要使用本地化包但又不以Stripe默认方式展示属性名，你可以这样做：

	<stripes:submit name="save">
		<fmt:message bundle="MyBundle" key="button.save"/>
	</stripes:submit>


## 传递本地化变量到布局

假如你正在使用Stripes的[布局](https://stripesframework.atlassian.net/wiki/display/STRIPES/Layout+Reuse)属性，你可能想传递本地化值给布局。你可以通过[传递额外信息到布局](http://iyiguo.net/blog/2016/07/17/stripes-how-to-layout-reuse/)了解更多关于如何传递任意格式化内容给布局的信息。


## 本地化的其他事情

出于以下几个原因，Stripes没有提供本地化整个应用的工具：

1. 工作量太大
2. 人们喜欢用不同的方式去本地化（比如，一个本地化JSP对每个语言环境一个JSP）
3. Stripes集成了JSTL格式化标签并将其做为默认选项

使用集成了JSTL格式化标签的stripes，提供了一个整洁并且更加完整的本地化解决方案。但有几件事情需要考虑：

首先，使用相同资源包提供Stripes本地化资源和通过JSTL标签提供本地化的资源是绝对没有错的。这样做是没有问题的，因此，例如，你需要字段名被展示在页面的其他地方，没有理由不去访问StripesResources包。配置JSTL本地化通过在web.xml中声明stripes资源包的名字即可：

	<context-param>
	    <param-name>
		javax.servlet.jsp.jstl.fmt.localizationContext
	    </param-name>
	    <param-value>StripesResources</param-value>
	</context-param>

其次，你应该很少有需要用到`<fmt:setLocal.../>`标签。因为Stripes的策略是使用过滤器和请求包装，因此应用中所有的组件，包括JSTL标签，当他们调用`request.getLocal()`方法时总是能得到正确的的本地语言环境。

但有个例外是，`<fmt:message>`不能调用`request.getLocal()`方法[^1]。在一个请求没有设置`accept-language`头信息的情况下，你需要在`<fmt:message>`前调用`<fmt:setLocale value="${pageContext.request.locale}"/>`
 


[^1]: [http://www.stripesframework.org/jira/browse/STS-676](http://www.stripesframework.org/jira/browse/STS-676)

[LocalPicker]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/localization/LocalePicker.html

[DefaultLocalePicker]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/localization/DefaultLocalePicker.html

[BooleanTypeConverter]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/BooleanTypeConverter.html
[EnumeratedTypeConverter]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/EnumeratedTypeConverter.html
[ScopedLocalizableError]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/ScopedLocalizableError.html

[TypeConverter]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/TypeConverter.html
[LocalizableError]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/LocalizableError.html




