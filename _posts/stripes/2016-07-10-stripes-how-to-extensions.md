---
layout: post
title: Stripes框架如何做系列-扩展
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Extensions](https://stripesframework.atlassian.net/wiki/display/STRIPES/Extensions)


## 扩展－如何扩展和定制Stripes

从Stripes1.5开始，在web.xml中可以配置一个或多个包，Stripes将会自动加载所有扩展。这些扩展包含：

+ 所有实现了[ConfigurableComponent](http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/config/ConfigurableComponent.html)接口的类
+ 自定义[类型转换器](http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/validation/TypeConverter.html)
+ 自定义[格式](http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/format/Formatter.html)
+ [拦截器](http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/controller/Interceptor.html)


在web.xml中添加一个叫做*Extension.Packages*的初始化参数变量到StripesFilter中。你指定的包自动包含其所有的子包，因此不需要通过*号去做通配。具体示例如下：

> web.xml
>
	<filter>
	    <display-name>Stripes Filter</display-name>
	    <filter-name>StripesFilter</filter-name>
	    <filter-class>net.sourceforge.stripes.controller.StripesFilter</filter-class>
	    <init-param>
	        <param-name>ActionResolver.Packages</param-name>
	        <param-value>net.sourceforge.stripes.examples</param-value>
	    </init-param>
	    <init-param>
	        <param-name>Extension.Packages</param-name>
	        <param-value>net.sourceforge.stripes.extensions</param-value>
	    </init-param>
	</filter>

现在可以将Stripes扩展放在*net.sourceforge.stripes.extensions*包及其子包下，他们将会被自动的加载。你也可以指定多个包路径，每个路径之间用逗号分割即可：

> web.xml
>
	<filter>
	    <display-name>Stripes Filter</display-name>
	    <filter-name>StripesFilter</filter-name>
	    <filter-class>net.sourceforge.stripes.controller.StripesFilter</filter-class>
	    <init-param>
	        <param-name>ActionResolver.Packages</param-name>
	        <param-value>net.sourceforge.stripes.examples</param-value>
	    </init-param>
	    <init-param>
	        <param-name>Extension.Packages</param-name>
	        <param-value>net.sourceforge.stripes.extensions, another.pkg.extensions</param-value>
	    </init-param>
	</filter>


如果在扩展包下有指定类不需要被Stripes自动加载，那么你不得不将其移到其他非指定包路径下。如果不想移除，那么可以简单的通过使用[@DontAutoLoad](http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/config/DontAutoLoad.html)注释该类即可。
