---
title: Stripes框架如何做系列-Ajax
date: 2016-07-08
description: stripes框架如何做系列中文翻译
categories: "java"
tag: ["stripes","translation"]
slug: 'stripes-how-to-ajax'
series: ["Strips 如何做系列"]
series_order: 1
---

原文链接：[https://stripesframework.atlassian.net/wiki/display/STRIPES/AJAX](https://stripesframework.atlassian.net/wiki/display/STRIPES/AJAX)


如果你没有听说过[Ajax]那么你有可能还生活在穴居时代，因此这里我们不会去讲[Ajax]是什么。如果你真的需要了解，那么建议你点击[这里][1]。因为[Ajax]作为客户端技术，Stripes作为服务器端框架，所以这篇文档主要关注如何使用[Ajax]技术与Stripes进行交互。如果你关注的是客户端视觉效果和一些[Ajax]技巧，那么通过谷歌搜索你能得到比本文更好的说明。

有许多不同的方式可用来编写[Ajax]应用程序。基本上最容易想到的就是调用一些服务器端（或者只是获取静态内容）逻辑完成与屏幕上可见内容的交互而不用去刷新浏览器页面。更复杂（功能也更强大）的方法包括通过调用服务端返回如XML或者[JSON]结构化数据，然后客户端通过JavaScript进行一些复杂的操作。

这篇文章讲介绍以下内容：

+ 如实通过[Ajax]调用Stripes ActionBeans
+ 来自[快速开始指南]的基于[Ajax]版本的计算器应用
+ Stripes使用[Ajax]的一些额外的技巧

## 使用AJAX调用ActionBeans

有许多的[Ajax]框架，他们提供了几乎所有有用的方法来完成[Ajax]调用。但在使用这些框架前，也许你首先要做的是使用Javascript通过浏览器调用ActionBean。当然Stripes是不需要任何特定的[Ajax]框架也能良好工作的，无论你选择的是*Dojo*、*MochiKIt*、*Prototype*抑或任何其他客户端工具包。

这里我们将使用*Prototype*框架完成示例。*Prototype*是一个优秀的框架包，它整合了不同浏览器间的差异，并在灵活的Javascript API上添加了更加明确的接口方法。

## AJAX计算器应用

虽然计算器应用是不起眼的，但却可以作为讲解在[Ajax]下如何使用Stripes的好的示例。下面的JSP代码片段来自[快速开始指南]并做了点小的改动（如果你还没看过快速入开始中的代码， 那么你有必要对照着看下）:

> /ajax/index.jsp
>
		<%@ page contentType="text/html;charset=UTF-8" language="java" %>
		<%@ taglib prefix="stripes" uri="http://stripes.sourceforge.net/stripes.tld"%>
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
		<html>
		<head>
		<title>My First Ajax Stripe</title>
		<script type="text/javascript"
		src="${pageContext.request.contextPath}/ajax/prototype.js"></script>
		<script type="text/javascript" xml:space="preserve">
		    /*
		    * Function that uses Prototype to invoke an action of a form. Slurps the values
		    * from the form using prototype's 'Form.serialize()' method, and then submits
		    * them to the server using prototype's 'Ajax.Updater' which transmits the request
		    * and then renders the response text into the named container.
		    *
		    * NOTE: Requires Prototype version 1.6 or above.
		    *
		    * @param form reference to the form object being submitted
		    * @param event the name of the event to be triggered, or null
		    * @param container the name of the HTML container to insert the result into
		    */
		    function invoke(form, event, container) {
		        if (!form.onsubmit) { form.onsubmit = function() { return false } };
		        var params = Form.serialize(form, {submit:event});
		        new Ajax.Updater(container, form.action, {method:'post', parameters:params});
		    }
		</script>
		</head>
		<body>
		<h1>Stripes Ajax Calculator</h1>
>
		<p>Hi, I'm the Stripes Calculator. I can only do addition. Maybe, some day, a nice programmer
		will come along and teach me how to do other things?</p>
>
		<stripes:form action="/examples/ajax/Calculator.action">
		    <table>
		        <tr>
		            <td>Number 1:</td>
		            <td><stripes:text name="numberOne"/></td>
		        </tr>
		        <tr>
		            <td>Number 2:</td>
		            <td><stripes:text name="numberTwo"/></td>
		        </tr>
		        <tr>
		            <td colspan="2">
		                <stripes:submit name="add" value="Add"
		                    onclick="invoke(this.form, this.name, 'result');"/>
		                <stripes:submit name="divide" value="Divide"
		                    onclick="invoke(this.form, this.name, 'result');"/>
		            </td>
		        </tr>
		        <tr>
		            <td>Result:</td>
		            <td id="result"></td>
		        </tr>
		    </table>
		</stripes:form>
		</body>
		</html>

有一些需要注意的地方。从下往上会看，首先会看到如下的代码：

    <td>Result:</td>
    <td id="result"></td>

这段代码不再使用EL表达式从ActionBean中获取结果，因为结果在服务器端还尚未被渲染到JSP上。而是使用id属性标识结果被放置的位置，这样当页面被加载时我们可以将结果放置到该位置。紧接着会看到：

    <stripes:submit name="add" value="Add"
        onclick="invoke(this.form, this.name, 'result');"/>
    <stripes:submit name="divide" value="Divide"
        onclick="invoke(this.form, this.name, 'result');"/>


这里当点击提交按钮时会触发javascript的invoke方法，该方法有三个参数，依次是表单对象、按钮名称（Stripes事件名）及存放结果的HTML元素id。最后会看到：

    <script type="text/javascript"
        src="${pageContext.request.contextPath}/ajax/prototype.js"></script>
    <script type="text/javascript" xml:space="preserve">
        /* ... */
        function invoke(form, event, container) {
            if (!form.onsubmit) { form.onsubmit = function() { return false } };
            var params = Form.serialize(form,{submit:event});
            new Ajax.Updater(container, form.action,{method:'post', parameters:params});
        }
    </script>

其中，第一个script标签导入javascript *Prototype* 框架包；第二个标签定义一个调用函数。该函数使用 *Prototype* 完成调用服务器端的ActionBean并将服务器返回的结果更新到HTML的指定位置。但在调用之前，该函数首先对form表单对象常规的提交事件进行了屏蔽禁止操作，使其表单提交时总是返回false.

这就是整个JSP页面的内容了。假如我们的ActionBean工作正常，那么当按钮点击后，页面将和服务器进行交互，并在不用刷新浏览器窗口的情况下将服务器端的响应渲染到当前页面。

下面我们看下服务器端ActionBean的代码：

> "AJAX CalculatorActionBean.java"
>
	package net.sourceforge.stripes.examples.ajax;
>
	import net.sourceforge.stripes.action.ActionBean;
	import net.sourceforge.stripes.action.ActionBeanContext;
	import net.sourceforge.stripes.action.DefaultHandler;
	import net.sourceforge.stripes.action.Resolution;
	import net.sourceforge.stripes.action.StreamingResolution;
	import net.sourceforge.stripes.validation.Validate;
	import net.sourceforge.stripes.validation.ValidationError;
	import net.sourceforge.stripes.validation.ValidationErrorHandler;
	import net.sourceforge.stripes.validation.ValidationErrors;
	import java.io.StringReader;
	import java.util.List;
>
	/**
	* A very simple calculator action that is designed to work with an ajax front end.
	* @author Tim Fennell
	*/
	public class CalculatorActionBean implements ActionBean,　ValidationErrorHandler {
	    private ActionBeanContext context;
	    @Validate(required=true) private double numberOne;
	    @Validate(required=true) private double numberTwo;
>
	    public ActionBeanContext getContext() { return context; }
	    public void setContext(ActionBeanContext context) {
		    this.context = context;
		}
>
	    @DefaultHandler public Resolution add() {
	        String result = String.valueOf(numberOne + numberTwo);
	        return new StreamingResolution("text", new StringReader(result));
	    }
>
	    public Resolution divide() {
	        String result = String.valueOf(numberOne / numberTwo);
	        return new StreamingResolution("text", new StringReader(result));
	    }
>
	    // Standard getter and setter methods
	    public double getNumberOne() { return numberOne; }
	    public void setNumberOne(double numberOne) {
		    this.numberOne = numberOne;
		}
>
	    public double getNumberTwo() { return numberTwo; }
	    public void setNumberTwo(double numberTwo) {
		    this.numberTwo = numberTwo;
		}
	}

这段代码和[快速开始指南]的代码看起来非常相似，除了加法和除法的实现有所不同外。这里将设置属性并转发请求到用户JSP页面替换成了数学计算，然后将计算结果当做文本类型，通过[StreamingResolution]对象返回给客户端。


	@DefaultHandler
	public Resolution add() {
	    String result = String.valueOf(numberOne + numberTwo);
	    return new StreamingResolution("text", new StringReader(result));
	}

这样，当按钮被点击时，页面将和ActionBean进行交互，响应结果将被回传到页面并被显示在适当的位置。


##  处理校验错误

在一些验证错误消息发生前，上述代码能良好的运行。当错误发生时，Stripes应试图将请求返回指向用户提交时的页面，并提示校验错误信息。如果使用上述代码，那么这些错误的结果不得不内嵌在当前的页面中。幸运的是没必要如此做！Stripes提供了一个针对ActionBeans可选的[ValidationErrorHandler]接口。这个接口允许当验证错误发生时，中断当前ActionBeans执行的流程，并告诉Stripes下一步该如何做。

在ActionBean的顶部可以添加：

	public class CalculatorActionBean implements ActionBean, ValidationErrorHandler {
	    ...
	    /** Converts errors to HTML and streams them back to the browser. */
	    public Resolution handleValidationErrors(ValidationErrors errors) throws Exception {
	        StringBuilder message = new StringBuilder();

	        for (List<ValidationError> fieldErrors : errors.values()) {
	            for (ValidationError error : fieldErrors) {
	                message.append("<div class=\"error\">");
	                message.append(error.getMessage(getContext().getLocale()));
	                message.append("</div>");
	            }
	        }

	        return new StreamingResolution("text/html", new StringReader(message.toString()));
	    }
	    ...
	}


因为ActionBean实现了[ValidationErrorHandler]接口，所以当验证错误发生时，Stripes将调用`handleValidationErrors`方法。示例代码中，通过循环错误集合构造HTML片段，将每一个错误信息放在div标签中。然后将该HTML片段再次通过[StreamingResolution]对象返回给客户端。这样，当验证错误发生时，错误信息的展示将会与显示正确信息时在同一位置上。

## 更高效的实时流

[StreamingResolution]适合以下场景：

+ 返回给客户端的流数据来自流或者来自读取的对象（比如，返回来自web服务调用或者数据库的一大块XML）
+ ActionBean返回给客户端的信息在千字节或者更少

然而，如果想在ActionBean中生成大量输出，同时在开始将其返回给客户端前又不想将其完全缓冲到一个字符串中，那么一种好的处理方式就是创建一个匿名的Resource对象。看下面的示例：

> 使用匿名Resource
>
	@HandlesEvent("GetLotsOfData")
	public Resolution getLotsOfData() {
	    Map<String,String> items = getReallyBigMap();
	    return new Resolution() {
	        public void execute(HttpServletRequest request, HttpServletResponse response) throws Exception {
	            response.setContentType("text/xml");
>
	            response.getOutputStream().print("<entries>");
	            for (Map.Entry<String,String> entry : items.entries()) {
	                response.getOutputStream().print("<entry><key>");
	                response.getOutputStream().print(entry.getKey());
	                response.getOutputStream().print("</key><value>");
	                response.getOutputStream().print(entry.getValue());
	                response.getOutputStream().print("</value></entry>");
	            }
	            response.getOutputStream().print("</entries>");
	        }
	    }
	}

## 使用ForwardResolution返回html片段

如果[Ajax]请求希望返回一个html片段作为响应，那么可以用`ForwardResolution`对象实现。这样做的好处在于html片段可以放在JSP文件中，而不需要用手工去拼凑返回的html代码字符串。

1. Ajax发出请求
2. ActionBean请求事件处理指向一个jsp
3. Ajax使用该jsp生成的html片段更新指定DOM容器内容

例如，假如我们决定添加一个具有显示隐藏包含额外功能的按钮给计算器，我们可以通过创建一个名叫'showScientificCalc()'的事件处理方法，并添加一个新的名叫'scientificCalcControls.jsp'的jsp页面来实现。

	public Resolution showScientificCalc() {
	    return new ForwardResolution("/fictitious/scientificCalcControls.jsp");
	}

## 返回更复杂的数据给浏览器

有些情况下可能需要返回结构化的数据给浏览器，而不是直接显示的html。有两种方式可以处理这种情况：

+ 返回xml格式的数据
+ 返回JSON或者JavaScript

这两种方式都可以，但更推荐使用第二种方式。因为[JSON]或者JavaScript在浏览器上是更容易被处理，并且可以支持更复杂的数据（比如周期性的对象图）。Stripes中可使用[JavaScriptResolution]和[JavaScriptBuilder]实现如此次的交互。

[JavaScriptBuilder]是一个类，它可以接受任何类型的java对象，并通过遍历该对象，将其构建成一组javascript语句和[JSON]块，when evaluated, recreate the object's state in JavaScript。它能处理所有的Java内建类型及用户自己定义类型，甚至能正确处理循环对象图，确保每一个对象被序列化一次并且所有的对象引用都是有效的。

[JavaScriptResolution]是Resolution的实现，通过他可以序列化项到JavaScript并将其返回给客户端。虽然不能使用该方式返回一个数字，但是一个被改变的针对使用*Prototype*的计算器示例的JavaScript集合可能看起来如下：

> 处理JavaScriptResolution
>
	/** Function that handles the update when the async request returns. */
	function update(xhr) {
	    var output = eval(xhr.responseText);
	    $('result').innerHtml = output;
	}
>
	/** Function to submit a request and invoke a handler when it completes. */
	function invoke(form, event, handler) {
	    var params = Form.serialize(form, {submit:event});
	    new Ajax.Request(form.action, {method:'post', parameters:params, onSuccess:handler}});
	}

[1]: http://en.wikipedia.org/wiki/AJAX  "wiki"
[Ajax]: http://en.wikipedia.org/wiki/AJAX  "wiki"
[JSON]: http://www.json.org/
[快速开始指南]: https://stripesframework.atlassian.net/wiki/display/STRIPES/Quick+Start+Guide
[StreamingResolution]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/action/StreamingResolution.html
[ValidationErrorHandler]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/ValidationErrorHandler.html
[JavaScriptResolution]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/ajax/JavaScriptResolution.html

[JavaScriptBuilder]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/ajax/JavaScriptBuilder.html

