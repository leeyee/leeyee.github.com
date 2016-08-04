---
layout: post
title: Stripes框架如何做系列-Spring和Stripes
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Spring+with+Stripes](https://stripesframework.atlassian.net/wiki/display/STRIPES/Spring+with+Stripes)

Stripes是一个web应用框架，它被设计成易于使用并能提升开发人员的开发效率。Spring是一个主要的轻量级组件容器（当然现如今它也包含了其它的一些功能），同样，它也被设计成易于使用并且也能提升开发效率。那么很自然的，你可能想将两者结合起来使用。

集成了Spring的Stripes使得你的ActionBean类可以访问被配置成Spring bean形式的Spring资源。要这么做，只需要将Spring bean注入到ActionBean中即可。为此，你需要完成一些配置，一旦配置完成，就可以在Stripes web应用中使用Spring bean而无需任何其他XML配置。

## 安装配置Spring

这一节简要展示如何安装和配置Spring，以便能在Stripes应用中使用。这里并不包含所有可能的配置，但提供了一种简单可用的方式。我们从http://www.springframework.org/download下载最新的Spring版本开始，下载完成后解压下载文件并找到dist/spring.jar文件，复制该文件到你的应用路径下，你的应用路径有可能是*WEB-INF/lib*.

> 精简你的classpath
>  > 假如你不想被类路径下许多没有使用的类包困扰，你可能需要花一些时间在*dist*目录下查看spring-*.jar并判断出那些类包是你需要使用Spring的最小类包集合。对于我（这里指原文作者： Rick Grashel ）来说，我是懒于做这些事情的，因此我使用了spring.jar包，这个包包含了所有需要的及一些额外的类。

配置好了jar包后，需要创建一个spring上下文文件，并且在web.xml中配置web应用上下文。让我们看下web.xml：

> 在web.xml中配置Spring
>
    <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
    </listener>
>
    <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>/WEB-INF/spring-context.xml</param-value>
    </context-param>

*listener* 节点简单配置了一个Spring 监听类，该监听类在web应用环境被用来引导Spring启动。*context-param* 节点用来配置Spring上下文本地加载的文件路径。在这个示例中我们使用*/WEB-INF/spring-context.xml*。该文件可以任意命名，同时将其放在*WEB-INF*或者其子目录下是一种好的方式，因为这样可以确保该文件不会被web应用程序客户端访问到。

接下来要做的事情是配置Spring上下文。相关的更多细节可以通过http://www.springframework.org/docs/reference/index.html 阅读Spring文档了解到。下面展示了一些简单的配置，通过该配置我们可以将在Bugzooky应用中的各个管理器组件当作Spring bean来访问。

> /WEB-INF/spring-context.xml
>
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE beans PUBLIC "-//SPRING//DTD BEAN//EN" "http://www.springframework.org/dtd/spring-beans.dtd">
>
    <beans>
        <bean name="/bugzooky/BugManager" class="net.sourceforge.stripes.examples.bugzooky.biz.BugManager"/>
        <bean name="/bugzooky/PersonManager" class="net.sourceforge.stripes.examples.bugzooky.biz.PersonManager"/>
        <bean name="/bugzooky/ComponentManager" class="net.sourceforge.stripes.examples.bugzooky.biz.ComponentManager"/>
    </beans>

## 为Spring配置Stripes

现在我们有了Spring的所有配置，但我们还需要做一些事情，让Stripes可以感知Spring的存在。在web.xml文件中找到Stripes过滤器的初始化变量参数*Interceptor.Classes*，如果该变量已被定义，那么添加下面的代码：

> 使用Spring拦截器（Stripes 1.5及以上）
>
    <init-param>
        <param-name>Interceptor.Classes</param-name>
        <param-value>
            net.sourceforge.stripes.integration.spring.SpringInterceptor
        </param-value>
    </init-param>

该变量告诉Stripes使用Spring拦截器。这段代码可以在Stripes1.5及以上版本中使用；如果你仍然在使用老版本的Stripes，那么需要告知Stripes，在使用Spring拦截器的同时仍要显式的声明使用Stripes自身的Before/After 方法拦截器（这是Stripes默认的拦截器）：

> 使用Spring拦截器（Stripes 1.4.x及以下）
>
    <init-param>
        <param-name>Interceptor.Classes</param-name>
        <param-value>
            net.sourceforge.stripes.integration.spring.SpringInterceptor,
            net.sourceforge.stripes.controller.BeforeAfterMethodInterceptor
        </param-value>
    </init-param>

至此我们完成了整合Stripes和Spring的相关配置，现在我们可以开始做一些编码工作了！

## 在ActionBean中访问Spring Beans

Stripes通过使用[SpringInterceptor]注入Spring beans到初始化完成后的ActionBeans中。为此，需要告诉Stripes如何注入bean以及注入什么。相比使用XML文件，可以使用简单的注解方式进行配置。标准的配置方式看起来如下：

> 注入Spring bean到ActionBean
>
    /** Setter to allow the BugManager to be injected. */
    @SpringBean("/bugzooky/BugManager")
    public void injectBugManager(BugManager bm) {
        this.bm = bm;
    }

指定明确的名称和需要注入的Spring bean的路径可能是最安全的方式。除此之外还有另外两种方式；通过名称自动注入和通过类型自动注入。假如`@SpringBean`省略了*value*值时将会按此方式注入：

> 在ActionBean中自动注入Spring bean
>
    /** Setter to allow the BugManager to be injected. */
    @SpringBean
    protected void setBugManager(BugManager bm) {
        this.bm = bm;
    }

Stripes首先将尝试通过名称自动注入，如果找不到则通过类型进行自动注入。首先获取注入bean的名称是派生自方法名的——假如方法名使用‘set’开头，那么Stripes将移除‘set’并将剩下的字符首字母小写（遵循标准的JavaBean规则），否则使用整个方法名作为注入bean的名称。上面的示例中注入bean的名称为*bugManager*。然后将在Spring上下文中查找是否包含一个名叫*bugManager*的bean。这个查询是大小无关及路径无关的，对于上面的例子将会匹配到*/bugzooky/BugManager* bean。

如果Spring上下文中找不到匹配该名称的bean，那么则通过类型进行最后一次查找。在这个示例中，如果Spring上下文中存在与被注解方法（当前示例中指`BugManager`类）惟一匹配的bean，那么该bean将被选中并注入到ActionBean。

值得注意的是，虽然ActionBeans本身不是Spring beans，但通过这种方式，通过Spring上下文被注入的 beans是完全由Spring管理的，并能访问其他Spring bean提供的所有Spring服务。

> 公共的Get/Set方法对于Spring beans是危险的
> > 因为Stripes通过名称映射变量，而该变量来自ActionBeans中需要注入的属性。因此，使用公共方法作为Spring bean匹配JavaBean属性的方式是非常不明智的（比如`public void setBugManager(...)`）。这样做将允许恶意用户设置你的Spring bean为空，甚至可能将其设置为他自己的内嵌属性，假如你的Spring bean有*getter*方法。
>
> > 虽然这种情况发生的可能性相当小——一个恶意用户成功猜到你在使用Spring，猜到访问Spring Beans的方法名以及Spring Beans的属性。但是理论上这是可能的，因此你应该降低这个风险（特别是因为他很容被规避）。
>
> > Stripes提供了几个备选方案。假如你显式使用` @SpringBean("/some/bean")`命名Spring bean，那么可以简单的使用不同的名称进行命名，比如：`injectBugManager()`。如果通过名称自动注入，那么可以简单的不使用*set*方法，比如：`public void bugManager(BugManager mgr)`。或替代地，如下面所讨论的，将需要注入Spring beans的方法或属性声明为受保护的或私有的。

## 方法 vs 属性访问

Stripes可以通过方法或者属性域注入Spring beans。访问类型由`@SpringBean`标注的位置决定。假如直接注解属性域，比如：

    @SpringBean private BugManager bugManager;

Stripes将使用属性域访问。假如通过方法注解，比如：

    @SpringBean protected void setBugManager(BugManager bm) { ... }

Stripe将使用方法去注入bean。

如果JVM的安全管理允许，Stripes甚至可以当注入对象是被保护、包访问以及私有域和方法时注入Spring bean。如果JVM安全管理不允许，那么将会引发一些异常说明。

## 在其他类型的对象中使用Spring Beans

某些情况下ActionBeans不是你写的被Stripes管理但需要注入Spring bean的类的唯一类型（It's sometimes the case that ActionBeans are not the only type of class you'll write that are managed by Stripes but need Spring beans injected into them）。拦截器是一个常见的例子，而且如果你最终重载任何Stripes的[ConfigurableComponents]，你可能希望注入Spring beans.

幸运的是这是相当容易做到的。在拦截器示例中有个基类是可被扩展的。[SpringInterceptorSupport]是一个简单的基类，它提供了在初始化时进行Spring bean注入的功能。

对于其他类，解决方案也几乎是一样的简单。[SpringHelper]类提供的相同的Spring bean注入机制方法适应于给任何访问的对象，比如`ActionBeanContext`, `ServletContext` 或者Spring `ApplicationContext`。大多数情况下，可以被写成如下形式：

    SpringHelper.injectBeans(obj,StripesFilter.getConfiguration().getServletContext());

[SpringInterceptor]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/integration/spring/SpringInterceptor.html
[ConfigurableComponents]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/config/ConfigurableComponent.html
[SpringInterceptorSupport]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/integration/spring/SpringInterceptorSupport.html
[SpringHelper]: http://stripes.sourceforge.net/docs/current/javadoc/index.html?net/sourceforge/stripes/integration/spring/SpringHelper.html
