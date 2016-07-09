---
layout: post
title: Stripes框架如何做系列-展示错误
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

web应用几乎没有例外的会在某些点上生成一些验证错误信息，提示用户做错了什么，应该怎么样正确的去做。这些提示应该与你的应用UI策略一致，能明确的告诉用户如何去处理。下面介绍如何利用Stripes进行错误信息展示。

## 输出错误

Stripes提供若干输出验证错误信息的标签，这些标签是值得花时间通过阅读文档去了解的。主要的标签是[stripes:erros](http://stripes.sourceforge.net/docs/current/taglib/stripes/errors.html)。这个标签可以针对一个表单输出所有的验证错误信息或者仅仅输出一个表单指定域的错误信息。

这里就不重复标签文档内容了，直接看下几个示例：

> 示例1：使用默认的格式输出所有错误
>
    <stripes:errors/>

针对这个例子，假设其不是内嵌在`<stripes:form>` 标签中的，它会将所有错误信息通过 ***HTML*** 的*ul*标签展示出来。如果在一个页面上有多个表单，可以为每一个表单在不同的位置显示错误信息：

> 示例2：多表输出错误信息在不同的位置
>
    <stripes:form action="/foo/first.action">
		<stripes:errors/>
	 ...
	</stripes:form>
> 
	...
> 
	<stripes:errors action="/foo/second.action">
	<stripes:form action="/foo/second.action">
	 ...
	</stripes:form>

第一个`<stripes:errors/>`标签是内嵌在`<stripes:form>` 标签中的.这种情况下，`<stripes:errors/>` 仅输出表单提交后针对该表单的错误信息。第二个`<stripes:errors/>`不是内嵌在表单元素内的，但是由于其支持 *action* 属性，因此它将也只显示与 *action* 属性值匹配的表单错误信息。

下面的示例展示如何输出指定域的错误信息，以及如何输出全局错误（不关联任何指定的的域）

> 示例3：输出指定域的错误信息
>
	<stripes:form action="/foo/fist.action">
       <stripes:errors globalErrorsOnly="true"/>
       <table>
			<tr>
			    <td>Username:</td>
			    <td>
				<stripes:text name="username"/>
				<stripes:errors field="username"/>
			    </td>
			</tr>
			<tr>
			    <td>Password:</td>
			    <td>
				<stripes:text name="password"/>
				<stripes:errors field="password"/>
			    </td>
			</tr>
    	</table>
	</stripes:form>


默认的错误输出格式是通过错误消息包下的一组四个资源控制的（通常是StripesResources）。*A different set of resources is used when outputting field specific errors to allow distinct presentation*.关于错误输出的更多细节可以在标签文档[errors tag](http://stripes.sourceforge.net/docs/current/taglib/stripes/errors.html)中找到。同时，错误格式也可通过每次使用错误标签时，内嵌[individual错误标签](http://stripes.sourceforge.net/docs/current/taglib/stripes/individual-error.html)进行修改。 



## 域错误高亮显示

Stripes具有当错误发生时改变字段域展示的能力。为此，该类通过实现 [TagErrorRenderer]接口，并通过一个实现了[TagErrorRendererFactory]接口的工厂类来提供实例。接下来的几分钟内，我们将介绍实现了这些接口的自定义类能做些什么，但在这之前，让我们先看下默认的类都多了些什么。

### 使用默认的TagErrorRenderer改变样式


首先，有一个非常简单的默认工厂类[DefaultTagErrorRendererFactory]，通过它可以返回[DefaultTagErrorRenderer]的初始化实例。它也可以被配置成返回你自己的实现了[TageErrorRender]对象的实例。

[DefaultTagErrorRenderer]的实现是非常简单的。针对错误中的任何一个域它只做了一个改变标签的 ***CSS*** 样式的操作。如果标签没有一个*class="something"*的属性（也就是没有 *class* 属性），默认的将会为其添加*class="error"*。如果标签包含 *class* 属性，比如*class="foo"*那么渲染器将重写 *class* 属性为*class="error foo"*

初看起来这样的处理有点局限，只能使用一个类名去控制所有的表单错误域样式。如果你想展示不同于文本控件（文本输入框和文本输入区域）的图形控件（类似选择框、复选单选按钮）该如何做？好吧，如果你问到这个问题，那么是时候学习一些（或许更多）关于 ***CSS*** 的知识了。***CSS*** 选择器允许对名字相同但属性不同的标签指定不同的样式。下面的例子用来展示如何将属性选择器用在一个全局的针对输入域的错误样式上。

> 使用选择器指定错误样式类
> 
	input.error, textarea.error {
		color: red;
		background-color: yellow;
	}
> 
	input.error[type="radio"],input.error[type="checkbox"],select.error {
		background-color: white;
		border: 2px solid red;
	}

使用选择器，你可以：

+ 为每一个输入域声明一个不同的样式
+ 当一个域是空，对比当其有错误值时，声明不同的样式
+ 在HTML布局中指定基于域位置的样式

> CSS选择器参考,可参看[http://www.w3.org/TR/REC-CSS2/selector.html.](http://www.w3.org/TR/REC-CSS2/selector.html)
 

### 使用自定义TagErrorRenderer

我们已经看到，使用***CSS***可以直观的改变错误域的样式。但是仍有一些问题是无法通过 ***CSS*** 来解决，或者至少解决起来会非常困难。比如你想在错误域旁放一个红色的小**\***，或者一个警告图标，也有可能是一小块类似“<<<嘿白痴，错误在这里”的消息提示。好吧，也许最后一个扯的有点远，但是没人知道你的用户想要什么！除了这里提到的，还有更多的需求都可以通过自定义TagErrorRenderer来完成。

实际上，第一个步骤是确定你需要实现多少个[TagErrorRenderer]。大多数情况下你可能只需要一个实现，但是当使用[TagErrorRendererFactory]创建一个[TagErrorRenderer]时，它是支持通过初始化InputTagSupport（所有Stripes 输入标签的基类）来实现自定义[TagErrorRenderer]的。这会给你一些信息，你需要提供不同的错误渲染实现，比如基于标签的，基于标签属性的，或者有关标签的包含信息等等。


假设现在我们要实现一个[TagErrorRenderer]，目标是输出一个红色星号到输入框的旁边。那么首先我们需要实现一个[TagErrorRenderer]接口。

> 一个自定义TagErrorRenderer
>
	public class CustomTagErrorRenderer implements TagErrorRenderer {
		private InputTagSupport tag;
> 
		/** 存储错误中的标签. */
		public void init(InputTagSupport tag) {
			this.tag = tag;
		}
 >
		/** 在出错标签前输出红色星号. */
		public void doBeforeStartTag() {
			try {
				this.tag.getPageContext().getOut().write
                    ("<span style=\"color:red; font-weight:bold;\">*</span>");
			} catch (IOException ioe) {
				// Not really a whole lot we can do if writing to out fails!
			}
		}
> 
		/** 出错的标签后面不需要做任何操作. */
		public void doAfterEndTag() { }
	}
    
> **改变与恢复**
> 假如在一个[TagErrorRenderer]中改变了标签的状态，那么在`doAfterEndTag`方法中恢复标签的到改变前的状态是非常重要的。因为许现代的 ***Servlet/JSP*** 容器池有自定义标签，它们是希望在容器在调用完 *setter* 方法后，该标签是在相同的状态下。如果你改变了一些东西但是忘记改回来了，那么你可能会在你的 ***JSP*** 页面中看到一些莫名其妙的错误。

现在我们有了自定义的[TagErrorRenderer]，接下来我们要告诉Stripes去使用他。要做到这一点的简单方式就是将该自定义类放在使用 ***Extension.Packages*** 参数(见[Extensions])配置的包下，Stripes容器将会自动加载该类。另外你也可以配置[DefaultTagErrorRendererFactory]，通过使用初始化参数声明使用新的渲染:

    <init-param>
        <param-name>TagErrorRenderer.Class</param-name>
        <param-value>com.myco.web.util.CustomTagErrorRenderer</param-value>
    </init-param>

更多的关于配置的细节可在[配置指南](https://stripesframework.atlassian.net/wiki/display/STRIPES/Configuration+Reference)中查看运行时配置的有关章节.



[TagErrorRenderer]: (http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/tag/TagErrorRendererFactory.html)
[TagErrorRendererFactory]: (http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/tag/TagErrorRendererFactory.html)
[DefaultTagErrorRenderer]: (http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/tag/DefaultTagErrorRenderer.html)
[DefaultTagErrorRendererFactory]: (http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/tag/DefaultTagErrorRendererFactory.html)
[Extensions]: (https://stripesframework.atlassian.net/wiki/display/STRIPES/Extensions)
