---
title: Stripes框架如何做系列-索引属性
date: 2016-07-22
description: stripes框架如何做系列中文翻译
categories: java
tags: [stripes,translation]
series: ["Strips 如何做系列"]
series_order: 9
---


原文地址：[https://stripesframework.atlassian.net/wiki/display/STRIPES/Indexed+Properties](https://stripesframework.atlassian.net/wiki/display/STRIPES/Indexed+Properties)


这篇如何做将涉及如何使用数字索引和字符索引映射属性。定义数字索引是有点困难的，但可以用示例很容易展示出来。试想下，如果想要在页面上编辑一些关于bug的信息，那么可以通过一个包含像 "bug.name", "bug.description", "bug.priority"等信息域的表单来完成该操作。现在，如果需要在一个页面一次编辑多个bug，那么可以写许多包含类似"bug1.name", "bug2.name"的域属性在一个表单中（同样ActionBean中一样）。但是这样做太费事了。此时可以考虑使用Stripes定义的符号（和其他工具类似）并用类似 bug[0].name和 bug[1].name的方式来替换表单域。

为完成上述功能还有两个方面需要考虑：如何在表单内生成域字段名和如何在ActionBean中去接收他们。其实，这两者都是很简单的。

## JSP中的数字索引属性

本质上，在JSP中构建参数名是由开发者决定的。这是一个好消息也是一个坏消息。坏消息是这意味着开发人员需要略多做点工作，但也仅仅只是多做一点。好消息是说它意味着更多的灵活性。这么做有以下优点：

+ 索引可以内嵌在属性名内的任何位置
+ 一个单独的属性可以有多个索引（比如：`bugs[0].watchers[3].name`）
+ 索引可以来自任何地方——允许与任何循环提供访问其索引的标签互操作，这些标签允许访问其索引，比如*c:for\**标签、*[display:table](http://www.displaytag.org/)*标签等。

下面是一段JSP使用索引属性的示例片段（它是来自Bugzooky[简单应用](https://stripesframework.atlassian.net/wiki/display/STRIPES/Sample+Application)的简化版页面）:

> 在JSP中使用索引属性
>
	<stripes:form action="/bugzooky/EditPeople.action">
	    <table class="display">
	        <tr>
	            <th>ID</th>
	            <th>Username</th>
	            <th>First Name</th>
	            <th>Last Name</th>
	            <th>Email</th>
	        </tr>
	        <c:forEach items="${personManager.allPeople}" var="person" varStatus="loop">
	            <tr>
	                <td>
	                    ${person.id}
	                    <stripes:hidden name="people[${loop.index}].id" value="${person.id}"/>
	                </td>
	                <td>
	                    <stripes:text name="people[${loop.index}].username" value="${person.username}"/>
	                </td>
	                <td>
	                    <stripes:text name="people[${loop.index}].firstName" value="${person.firstName}"/>
	                </td>
	                <td>
	                    <stripes:text name="people[${loop.index}].lastName" value="${person.lastName}"/>
	                </td>
	                <td>
	                    <stripes:text name="people[${loop.index}].email" value="${person.email}"/>
	                </td>
	            </tr>
	            <c:set var="newIndex" value="${loop.index + 1}" scope="page"/>
	        </c:forEach>
	        <%-- And now, an empty row, to allow the adding of new users. --%>
	        <tr>
	            <td></td>
	            <td></td>
	            <td>
	                <stripes:text name="people[${newIndex}].username"/>
	            </td>
	            <td>
	                <stripes:text name="people[${newIndex}].firstName"/>
	            </td>
	            <td>
	                <stripes:text name="people[${newIndex}].lastName"/>
	            </td>
	            <td>
	                <stripes:text name="people[${newIndex}].email"/>
	            </td>
	        </tr>
	    </table>
	> 
	    <div class="buttons">
	        <stripes:submit name="Save" value="Save Changes"/>
	    </div>
	</stripes:form>

通过使用*c:forEach* 标签，*varStatus*属性（包含当前遍历对象索引）变量被命名为*loop*。然后在表单字域中，*loop.index* 通过EL表达式被插入到表单域名中。比如，`people[$loop.index}].username` 在运行时将被解释为`people[0].username`,`people[1}].username`等。

## 使用ActionBean中列表的数字索引的属性

这是Stripes真正擅长的地方。上述表单对应的相关ActionBean代码如下：

> 在ActionBean中使用索引属性
>
	  private List<Person> people;
>
	  @ValidateNestedProperties ({
	  @Validate(field="username", required=true, minlength=3, maxlength=15),
	  @Validate(field="firstName", required=true, maxlength=25),
	  @Validate(field="lastName", required=true, maxlength=25),
	  @Validate(field="email", mask="[\\w\\.]+@[\\w\\.]+\\.\\w+")
	  })
	  public List<Person> getPeople() { return people; }
	  public void setPeople(List<Person> people) { this.people = people; }

正如你所看到的，带有索引的表单域对象被声明成一个具有相应泛型类型的List属性（后者实现了List接口的对象），并为其提供了*getter*和*setter*方法。Stripes将会在运行时检测出*people*属性是一个List对象，然后将实例化并绑定了参数的*people*对象添加到List对象中。你不需要对列表进行实例化，这些动作都是由 Stripes帮你完成的。

> 设置另外一些没有索引的集合
> 
> > Stripes是明确不支持Sets的索引属性，也不支持不保证元素顺序或顺序固定的集合对象（比如*SortedSet*）——不依赖外部索引的集合对象。这样做的原因是，这些集合是不可能保证排序的一致性，添加或修改元素会让集合元素顺序重排，导致索引无效甚至带来一些危害。
> 
> > 基于上述原因，Stripes现在及未来都不会直接去支持用于Sets的索引属性。假如你仍然想使用Set集合，推荐的解决方案是在ActionBean中初始化一个Map（key最好是一个id字段）或者List，并用Set中的元素填充它，同时为其提供存取方法。使用Map的解决方案是安全的，因为其允许通过key而不是一个数字索引来访问。 假如你更偏向使用List方式，那么建议使用`Collections.unmodifiable()`方法确保List不能添加或者删除元素，以确保顺序的稳定性。

## 索引属性校验

你可能已经注意到`getPeople()`方法是被注解了的，但没有去校验列表的有效性而是校验列表项的有效性——在这个例子中也就是`Person`对象。Stripes对每个索引或列表中的行进行校验。对于数字或列表索引属性以及Map属性都是真实的，而不管List/Map是否是ActionBean的属性或者是其内嵌的子属性。（ Stripes performs validations for each index or row in the list as if it were a regular property. This is true for both numeric/List indexed properties and Map properties, regardless of whether the List/Map is a property of the ActionBean or a sub-property nested within a property of the ActionBean.）

举个例子，如果需要在页面上编辑一个`Person`对象，该`Person`对象有一叫*pets*的属于`Pet`对象的List属性，并且每个`Pet`对象都有一个*Nicknames* 属性的List。对于这些属性我们不需要通过任何索引去写校验，仅仅只是将其当作普通属性来处理即可：

> 索引属性的指定校验
> 
	  @ValidateNestedProperties({
	  @Validate(field="phoneNumber", required=true),
	  @Validate(field="pets.age", required=true, maxvalue=100),
	  @Validate(field="pets.nicknames.name", required=true, maxlength=50),
	  })
	  private Person person;

然而，这里的校验有个大的变化。要支持必填字段的校验，相同索引域至少要有一个值。为了理解这一点很容易想到作为创建多行表单机制的索引属性。因此这种变化意味着空的表单行将被忽略掉。

例如，在Bugzooky的示例应用中，Bugzooky管理页面展示了一个上述我们已经用作示例的表单。回头看看JSP示例你将会注意到一个放在最后并且没有值的额外行。如果用户没有在这一行输入任何值就提交该表单，Stripes将忽略它并不提示错误，因为该行所有域的值都是空的。但是，如果用户输入任何一个域，比如用户名，而其他域为空，那么提交后服务端的验证错误信息将会展示出来。

## Maps的索引属性（任意key类型）

就像可以使用数字索引在ActionBean中构造列表一样，也可以通过Stripes知道的如何转化的任意类型（比如，数字，字符串，日期，用户自定义类型等）去构造Maps。Stripes将使用Map对应的getter/setter方法上的信息去确定Map key的类型和value的类型。

Map索引语法和上述列表的示例是相似的（实际上和使用数字索引一样，它们是相同的）。如果方括号中的值是字符串或字符，那么应该使用引号进行包裹（单引号或者双引号都是可以的），否则直接使用该值即可。

下面的示例将展示如何通过使用Map索引属性尽可能简便的去获取大的选项集或者参数集。在这示例中，Map key是变量的字符串名，value是变量的数字值。

> 在JSP中Map或索引属性使用字符串key
>  
	<stripes:form ... >
	    ...
	    <table>
	        <c:forEach items="${toolParams}" var="toolParam">
	            <tr>
	                <td>${toolParam.name}:</td>
	                <td><stripes:text name="toolParameters['${toolParam.name}']"/></td>
	            </tr>
	        </c:forEach>
	    </table>
	    ...
	</stripes:form>

对应ActionBean中的代码片段是：

> 在ActionBean中Map或索引属性使用字符串key
>  
	private Map<String,Double> toolParameters;
>	 
	public Map<String,Double> getToolParameters() { return toolParameters; }
	public void setToolParameters(Map<String,Double> toolParameters) {
	    this.toolParameters = toolParameters;
	}

##高级索引属性

下面是一些关于Strinpes处理索引属性值得了解的事情：

+ Map keys 是可以被Stripes转化的任何类型（不是因为对于类型有一个被注册的`TypeConverter`，就是因为有一个共用的公共字符串构造函数）
+ 列表中的对象和Map中的values 是可以被Stripes转化的任何类型，或者任何使用内嵌属性的复杂类型
+ Stripes将实例化列表对象和Map对象（包含`SortedMap`对象）
+ Stripes将实例化列表对象和Map对象中的复杂类型，为了设置内嵌属性，只要该类型有公共的无参构造方法就行。
+ 可以使用链式索引属性

最后一点是值得详细说明的。这意味着你可以有如下的ActionBean属性：

	public Map<Date,List<Appointment>> getAppoinments() { return appointments; } 
	public void setAppoinments(Map<Date,List<Appointment>> appointments) { 
	    this.appointments = appointments; 
	} 

输出方式如下：

	Note: <stripes:text name="appointments[${date}][${idx}].note"/>