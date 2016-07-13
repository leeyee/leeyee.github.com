---
layout: post
title: Stripes框架如何做系列-文件上传
description: stripes框架如何做系列中文翻译
category: stripes
tag: [stripes,译文]
---

* [TOC]
{:toc}

原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/File+Uploads](https://stripesframework.atlassian.net/wiki/display/STRIPES/File+Uploads)


## 表单中使用文件上传标签

使用Stripes是很容易实现文件上传的。最简单的方式就是Stripes的表单域中添加一个文件域，然后在ActionBean中使用`FileBean`对象去表示该文件属性即可。比如：

> 在JSP页面中使用文件域
>
	<stripes:form>
	    ...
	    <stripes:file name="newAttachment"/>
	    ...
	</stripes:form>

> ActionBean中的FileBean属性
>
	private FileBean newAttachment;
>	 
	public FileBean getNewAttachment() {
	    return newAttachment;
	}
>	 
	public void setNewAttachment(FileBean newAttachment) {
	    this.newAttachment = newAttachment;
	}


这里是有必要去看下关于[FileBean]类的具体文档描述.


## 处理上传文件

仅仅有上述代码还不能真正的完成上传。受限于HTTP的规范，上传文件的操作未必有想象中简单。这个需要花点时间去了解。当HTTP规范定义了*multipart/form-data MIME*类型，以便允许一个或多个文件在同一时间与其他请求数据被同时上传时，并未规定请求部分需要按照一定的顺序进入。也就是说，浏览器可以选择发送上传文件在其他请求参数之前。

这意味着上传文件不能在ActionBean中被直接当做流，因为在文件上传完成前有可能是无法访问其他请求信息的。Stripes为了解决这个问题，和其他实现一样，将数据流文件保存在本地磁盘，处理请求，然后在提供对本地磁盘文件的访问。因此这对于如何在ActionBean中处理获取附件[FileBean]对象会产生影响。一般来说，你是想保存文件在某个地方，或者将其当做流去做一些其他事情……


## 保存上传的文件

通过调用`FileBean.save(File toFile)`方法，可以实现保存上传文件到指定位置。该方法会将通过上传处理并被保存的临时文件移动到你指定的本地文件中。如果调用该方法，临时文件被移走了，因此是不需要（实际上也是不需要的）调用`FileBean.delete()`将其删除的（译者注：save方法调用的是File的rename方法，同时调用save方法也就意味是要将上传文件保存在服务器上，因此也就不需要做什么清理工作了）。

## 读取上传文件流

另一种处理方式是将上传文件当做输入流来处理。选择这样做的原因可能在于需要将文件内容写入到数据库，或者分析上传的数据。可以通过调用`FileBean.getInputStream()`方法获取上传文件输入流，然后使用你想使用的任何输入流来读取数据。一旦使用这种方式，应在数据处理完成后调用`FileBean.delete()`删除上传的临时文件。如果不这样做，将会到导致web应用的临时目录被所有的上传文件塞满（译者注：其实可以忽略，如果你的磁盘够大。但进行清理是个好的习惯，因为读取流意味者你关心的是文件内容，而非文件本身）。

> 知道何时该去删除FileBeans
>
> > 如果将[FileBean]作为一个输入流处理，那么需要调用`FileBean.delete()`；如果用`save()`方法，那么则不需要调用`FileBean.delete()`！

## 使用索引属性进行多文件上传

在开发不知道上传文件有多少个的情况下，有必要支持多文件上传。对于非文件字段，可以通过绑定了ActionBean的列表或数组的多个同名表单域来获取。而对于文件字段，由于Multipart包支持的有限性，导致Stripes是不支持通过该种方式获取多个[FileBean]对象的。但是，可以通过使用Stripes提供的索引属性简单的模仿该功能。

下面的代码展示如何接受多个上传文件：

> 在JSP中使用索引文件域
>
	<stripes:form>
	    <c:forEach ... varStatus="loop">
	    ...
	    <stripes:file name="newAttachments[${loop.index}]"/>
	    ...
	</stripes:form>

> 在ActionBean中的索引FileBean属性
>
	private List<FileBean> newAttachments;
>	 
	public List<FileBean> getNewAttachments() {
	    return this.newAttachments;
	}
>	 
	public void setNewAttachment(List<FileBean> newAttachments) {
	    this.newAttachments = newAttachments;
	}

## 限制上传文件大小

获取POST请求内容前，仅有的一块有用信息是POST的总大小。该大小包括上传文件，表单所有域以及请求头信息等。基于这个结果，我们唯一可以做的就是通过POST大小来限制上传大小。你需要仔细考虑这个限制——它应该足够低以避免拒绝服务攻击，但同时也应该高到可以接受你的用户上传他们想要的各种文件。

Stripes默认这个限制是10M。对于如何改变这个限制可参考[配置指南](https://stripesframework.atlassian.net/wiki/display/STRIPES/Configuration+Reference)中的[文件上传](https://stripesframework.atlassian.net/wiki/display/STRIPES/Configuration+Reference)一节。


## 可替代实现

multipard表单数据的解析要做正确是相当困难的，基于这个原因，Stripes使用完善的第三方包完成这个功能。实施解析的代码被包装在一个叫[MultipartWrapper]的接口中，Stripes提供了两个基于该接口的实现。

为什么是两个？早前的Stripes版本中附带了一个（非插入式）使用[COS]包的实现。这么做主要有两个原因：一个是它没有依赖关系（比如，使用它时不需要依赖其他jar包），另一个是它提供了一个更加直观的编程模型（对我来说，开发Stripes）。然而，[COS]的许可是比较苛刻的，虽然他能满足大多数商业开发者，但它排除了分发你的应用的可能性，假如没有[COS]授权的商业许可。

基于这个原因，第二个实现使用了Apache Commons文件上传，因为其使用了更宽泛的Apache许可（和Stripes使用的许可类似）。唯一的真正的缺点是其依赖common-io包。

出于向后兼容的原因，[COS]实现已经重构到一个实现了[MultipartWrapper]接口，名叫[CosMultipartWrapper]的实现类中，并且依旧作为默认的上传处理实现。

如果你要使用`CommonsFileupload`，你同样需要添加cos包到你的类路径中，同时可以明确的配置[CosMultipartWrapper]通过添加配置参数到Stripes过滤器中：

	<init-param>
	    <param-name>MultipartWrapper.Class</param-name>
	    <param-value>net.sourceforge.stripes.controller.multipart.CommonsMultipartWrapper</param-value>
	</init-param>

另外，也可以通过插件替换负责构建[MultipartWrapper]初始化顺序的代码去增加额外的控制行为。这个可以通实现[MultipartWrapperFactory]接口并且声明自己定义代码作为一个初始参数在Stripes过滤器中实现:
 

	<init-param>
	    <param-name>MultipartWrapperFactory.Class</param-name>
	    <param-value>com.myco.CustomMultipartWrapperFactory</param-value>
	</init-param>



[FileBean]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/action/FileBean.html
[MultipartWrapper]:http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/controller/multipart/MultipartWrapper.html 
[COS]: http://servlets.com/cos/
[CosMultipartWrapper]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/controller/multipart/CommonsMultipartWrapper.html
[MultipartWrapperFactory]: http://stripes.sourceforge.net/docs/current/javadoc/net/sourceforge/stripes/controller/multipart/MultipartWrapperFactory.html
