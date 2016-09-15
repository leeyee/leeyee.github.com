---
layout: post
title: Stripes框架如何做系列-更多使用默认配置
description: stripes框架如何做系列中文翻译。更多使用默认配置
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Use+Defaults+More](https://stripesframework.atlassian.net/wiki/display/STRIPES/Use+Defaults+More)


这篇文章介绍Stripes中用来减少那些需要在每一个ActionBeans上配置（通常是注解形式）数量的技术。

## URL绑定和事件名

从Stripes 1.2开始，Stripes附带了一个名叫[NameBasedActionResolver]的类，这个类继承子类[AnnotatedClassActionResolver]. 当URL注解不存在时，`NameBasedActionResolver`将自动创建默认的URL绑定和事件名。当注解存在时优先使用注解。

生成URL绑定的这组规则是相当简单的：

1. 获取完全限定的类名
2. 去掉任何额外的包名
3. 去掉ActionBean或者Action或者Bean从类名称的最后，如果存在的话
4. 用斜杠替换点
5. 添加后缀“.action”

举几个例子能更好的说明该规则：

类名 | URL绑定
-------- | ---
com.myco.web.RegisterActionBean | /Register.action
com.myco.www.user.RegisterAction | /user/Register.action
com.companyb.projectb.web.stripes.admin.MainAction | /admin/Main.action

包名被截断，通过移除包名直到遇到一组“基本包名”。这组默认的“基本包名”是：“web”，“www”，“stripes”和“action”。

可以通过集成`NameBasedActionResolver`改变生成URL绑定的规则。同时更改“基本包”或者后缀是简单的，比如：

> 自定义action分解
>
    public class MyActionResolver extends NameBasedActionResolver {
        @Override
        public Set<String> getBasePackages() { return Literal.set("ui", "client"); }
        @Override
        public String getBindingSuffix() { return ".do"; /* ugh */ }
    }

通过这段代码，*com.companyz.accounts.ui.ledger.GeneralLedgerActionBean* 将会被映射成  */ledger/GeneralLedger.do*。 可以通过重写`getUrlBinding(String className)`实现自定义的URL绑定生成规则。

`NameBasedActionResolver`也将自动为所有返回Resolution的公共方法映射事件（不包括哪些被`@HandlesEvent`注解了的方法）。在这示例中，事件名就是方法名。

要了解如何配置一个替代默认的`ActionResolver`可以参看[配置指南]

## 自动类型转换

使用类似Java内置类型的简单表单域类[^myComment1]看起来是相当普遍的，比如`Money`类通常由`BigDecimal`对象包装而成，`EmailAddress`类通常则由一个单独的`String`对象包装而成。在ActionBean中使用Java类型并在的处理类中转换它们成为自定义类型[^myComment2]可能是相当吸引人的。但缺点是需要重复的代码和可能重复的验证注解。

现在，假如你要创建自定义的[TypeConverter]，你可以通过给你的属性附加一个单独的注解使用它：

	@Validate(converter=MoneyTypeConverter.class) 
	private Money balance; 

但是这种方式并不是最优的！这样看起来似乎是一种简单的方式，但当开始在许多action中使用相同的`Money`类时，你将不得不重复这样做。你可以通过使用自定义[TypeConverterFactory]来替代，这样就可以让Stripes知道`Money`类型。那么当注解出现时，Stripes将会自动使用`MoneyTypeConverter`将其转换成`Money`对象。为此，一种简单的处理方式就是继承[DefaultTypeConverterFactory]，比如：

> 自定义TypeConverterFactory
> 
	public class CustomTypeConverterFactory extends DefaultTypeConverterFactory { 
		public void init(Configuration configuration) { 
			super.init(configuration); 
			add(Money.class, MoneyTypeConverter.class); 
		} 
	} 

要了解如何配置一个替代默认的`TypeConverterFactory`可以参看[配置指南]

[^myComment1]: 这里的表单域类指将请求中的参数使用JavaBean的方式进行封装后的类。译者注

[^myComment2]: 这里的自定义类型指`Money`、`EmailAddress`。译者注

[NameBasedActionResolver]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/controller/NameBasedActionResolver.html
[AnnotatedClassActionResolver]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/controller/AnnotatedClassActionResolver.html
[TypeConverter]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/TypeConverter.html
[TypeConverterFactory]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/TypeConverterFactory.html
[DefaultTypeConverterFactory]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/validation/DefaultTypeConverterFactory.html
[配置指南]: https://stripesframework.atlassian.net/wiki/display/STRIPES/Configuration+Reference
