---
layout: post
title: javascript 最佳实践
description: 这篇文章介绍一系列javascript代码开发的首选最佳实践，这些最佳实践是基于javascprit领域许多开发者的观点和经验。因此这只是一些建议而不是一个绝对规则，有经验的开发人员可能会对下面提到的最佳实践略有不同的看法。
category: javascript
tag: [javascript]
keywords: [javascript最佳实践]
---

原文地址：[http://www.javascripttoolbox.com/bestpractices/](http://www.javascripttoolbox.com/bestpractices/)


### 1.总是使用关键字_var_声明变量

javascript中的变量不是全局范围就是函数范围，使用关键字`var`声明变量是必不可少的。当声明一个变量时不管是全局变量还是函数级变量，都不应省略变量的前缀关键字`var`。下边的例子说明了如果不这样做可能存在的潜在问题。

没有使用关键字`var`声明变量产生的问题

    var i = 0; // This is good - creates a global variable
    function test() {
        for (i=0; i<10; i++) {
            alert("Hello World!");
        }
    }
    test();
    alert(i); // The global variable i is now 10!

假如函数内部的变量i没有作为一个函数级别的变量通过`var`声明，它将在这个例子中引用全局变量。这是一个好的方式通过`var`声明一个全局变量，但是对于函数范围的变量通过`var`来声明是重要的。下面提供的两种方式在功能上与上面的代码是一样的。

更正过的函数:

    function test() {
    	var i=0;
        for (var i = 0; i < 10; i++) {
            alert("Hello World!");
        }
    }
    
### 2.属性检测胜过浏览器检测

有些代码是被写来检测浏览器版本和检测基于用户使用代理的不同行为的。通常情况下这个是一个非常糟糕的编程实践。任何甚至是一些看起来像全局“导航”的对象都是令人怀疑的。
最好的方式是使用属性检测。也就是说，当在一个老版本的浏览器上使用任何可能不被支持的高级属性时，应该先去检查下该函数或是方法是否被支持，然后再使用它。这样比起在使用函数或是方法时通过检测具体的浏览器版本和假设客户端支持该功能要好的多。关于这个话题更深层次的讨论可以参看[这里](http://www.jibbering.com/faq/faq_notes/not_browser_detect.html).

比如：

    if (document.getElementById) {
        var element = document.getElementById('MyId');
    } else {
        alert('Your browser lacks the capabilities required to run this script!');
    }
    
### 3.使用方括号

当访问的对象属性是动态生成的（在运行期间定义的）或是对象的属性无法使用点操作获取时，使用方括号。假如你不是一个有经验的javascript程序员，对于在所有地方均使用方括号获取对象属性的操作不算是一个糟糕的编程实践。
javascript中主要有两种方式可以访问对象的属性：

**点操作**

    MyObject.property

**方括号操作**

    MyObject["property"]

当属性名是硬编码方式并且在运行期间是不能被改变时使用点操作；当属性名是一个被评估用来解析属性名的字符串时使用方括号操作。该字符串可以硬编码，也可以是一个变量，甚至可以是一个调用返回字符串属性名的函数。
假如属性名是动态（运行期间）生成的，那么方括号是必需的。比如，当你有属性“value1”、“value2”、“value3”并且想通过一个变量`i = 2`来访问时：

    MyObject["value"+i]
    
是可以工作的，而

    MyObject.value + i

是不可以的。同样在其他一些服务端环境中（php、Struts等）被当作服务端的数组表单域是通过附加方括号表示的。然而，使用点符号引用一个包含方括号的域名将是无法工作的，因为引用一个javascript数组时方括号是做为语法参考的。因此方括号是必须的。比如：

    formref.elements["name[]"]

是可以工作的，而

    formref.elements.name[]

是无法工作的。

方括号的使用建议是：当需要使用方括号时始终使用它，这是显而易见的。使用方括号是没有严格要求的，只是个人喜好和习惯问题。一个好的经验法则是用点符号访问标准对象属性而使用方括号访问那些定义在页面中的对象属性。因此，尽管`document["getElementById"]()`是一个完美的使用方括号的方式，但`document.getElementById()`是一个标准语法，因为`getElementById`是一个在`DOM`文档中定的标准文档对象属性。混合使用点符合和方括号能清楚的标明那些是标准属性，那些是由内容定义的名称：

    document.forms["myformname"].elements["myinput"].value
    
这里，`forms`属性是标准的文档属性，表单名`myformname`是被页面内容定义的。同样的`elements`属性和`value`属性均是被特别定义的，而`myinput`是在页面定义的。这样的语句非常清晰、易于理解，是一种推荐的约定方式，但不是一个严格的规则。

### 4.避免使用eval

javascript中的`eval()`函数是一种在运行时期运行任意代码的方式。几乎在所有的情况下，都应避免使用`eval()`函数。假如在你的代码中存在该函数的调用，那么一定要确保你使用了正确的方式去实现你想要做的事情。例如，`eval`经常会被一些不知道方括号使用规则的程序员调用。

规则是：**“eval是邪恶的”**。不要使用它，除非你是一个经验丰富的开发人员，知道使用`eval`对你来说只是一个例外的情况。
 
### 5.正确引用表单及表单中的元素

在html的表单元素中，所有的表单元素都有一个`name`属性。但对于xhtml文档，name属性不是必须的。取而代之的是对于表单标签应该有一个id属性并可以通过`document.getElementById`获取该表单对象。虽然可以通过索引获取表单，但几乎在所有的情况下使用`document.forms[0]`却是一个不好的实践方式。一些浏览器会把表单可见做为文档自有属性来访问表单的名称。这是不可靠并且不应该被使用的。

下面的例子使用方括号和正确的对象引用来展示如何万无一失的获取表单输入框属性。

    // 正确引用到表单中的input对象
    document.forms["formname"].elements["inputname"]
    // 坏的实践
    document.formname.inputname
    
假如你想通过函数调用获取多表单元素，最好先把表单对象作为一个变量存储起来。这样可以避免在获取表单中的元素时重复获取表单对象。

    var formElements = document.forms["mainForm"].elements;
    formElements["input1"].value="a";
    formElements["input2"].value="b";

当用`onChange`事件或是相似事件验证一个输入栏时，将待验证对象本身的引用传递给验证函数将是一个好的方式。表单内部的每一个`input`元素都有一个表单对象引用来作为参考。

    <input type="text" name="address" onChange="validate(this)">
    function validate(input_obj) {
    // Get a reference to the form which contains this element
    var theform = input_obj.form;
    // Now you can check other inputs in the same form without
    // hard-coding a reference to the form itself
        if (theform.elements["city"].value=="") {
            alert("Error");
        }
    }
通过引用到一个表单对象并通过该引用表单对象访问其属性，你可以写一个不需要在页面上指定包含任何引用表单参数的函数。这种方式经常被作为一种避免多次引用表单对象的习惯性用法使用。
 
### 6.避免使用*with*语句

javascript中`with`语句将在作用域链之前插入一个对象，因此任何对属性/变量的引用将会忽略对象本身的属性/变量而首先检测本地的属性/变量作用域。这种方法经常被看作是一种避免较长引用的捷径。

使用with的举例

    with (document.forms["mainForm"].elements) {
        input1.value = "junk";
        input2.value = "junk";
    }

可以看出上面这段代码的问题是程序员无法验证 input1/input2 是作为表单元素数组的属性被使用的。解释程序会先把用这些名称当作属性来检测，假如不能被找到，那么解释程序将继续查找顶层的作用域链。最终解释程序将试图把input1/input2当作全局变量去寻找其value属性，如果没有则返回一个错误。相反，创建一个引用指向重新使用的对象并且用引用去解决其他引用。

使用一个引用替代

    var elements = document.forms["mainForm"].elements;
    elements.input1.value = "junk";
    elements.input2.value = "junk";
    
### 7.在锚上使用*onclick*事件替代javascript伪协议

当你想通过`<a>`标签触发javascript代码时，使用`onclick`处理器优于使用javascript伪协议。通过`onclick`处理器运行的javascript代码必须返回true或false （或者返回的表达式等价于true或false）给调用该js代码的标签。假如返回true，那么`<a>`标签的HREF属性将被当作一般的超链接使用；假如返回false，那么HREF属性将被忽略。这就是为什么经常在`<a>`标签中使用`onclick`处理器调用js代码时会在代码最后出现"return false"的原因。

正确的语法

    <a href="javascript_required.html" mce_href="javascript_required.html" onclick="doSomething(); return false;">go</a>
    
在这段示例代码中，当超链接被点击时`doSomething()`函数（用户在页面某处定义）将被调用并返回false。href将不会指向浏览器。然而，假如浏览器没有启用javascirpt ，那么javascript_required.html文件将被加载，你可以通过提示用户启用javascript解决该问题。通常情况下当你确认用户浏览器启用了javascript时，链接只需要使用`href="#"`这种简单形式。但这是一种猥琐的方式。一个好的解决方式是链接一个用户浏览器没有开启javascript时的备用页面。

有时，你想有条件的提交一个链接。例如，如果用户浏览远离你的表单页面，你首先要验证这一切都没有改变。在这种情况下，您的点击会调用一个函数，它将返回一个值去说明是否该提交本链接。
    
    <a href="/" onClick="return validate();">Home</a>
    function validate() {
        return prompt("Are you sure you want to exit this page?");
    }
    
在这个例子中，`validate()`函数总是返回true或是false。true意味着用户被允许返回到首页，而false意味着不被允许链接到首页的。这个例子提示用户确认信息，依赖用户点击ok或是cancel来返回true或false;

下面是一些无法正常工作的例子。假如在你的页面上看到这些代码，那么他们是不正确的应该被更正的。

什么是不该做的

    <a href="javascript:doSomething()">link</a>
    <a href="#" onClick="doSomething()">link</a>
    <a href="#" onClick="javascript:doSomething();">link</a>
    <a href="#" onClick="javascript:doSomething(); return false;">link</a>
    
### 8.用一元+操作进行数字类型转换
在javascript中，加号操作符被当作加法或是字符连接符来使用。比如，由于javascript是一种弱类型语言，当将表单域值加起来时这可能会导致一些问题。表单域值将被当作字符串对待，假如你用+将他们放在一起，javascript将视为连接它，而不是加法。

有问题的例子

    <form name="myform" action="[url]">
        <input type="text" name="val1" value="1">
        <input type="text" name="val2" value="2">
    </form>

    function total() {
        var theform = document.forms["myform"];
        var total = theform.elements["val1"].value + theform.elements["val2"].value;
        alert(total); // This will alert "12", but what you wanted was 3!
    }
    
为了更正这个问题，需要给javascript一个暗示，告诉它将值当作数字而不是字符串。你可以使用一元加号操作符将字符串转换为数字类型。使用加号前缀修饰一个变量或者一个表达式将强转该变量或表达式的返回值为数字类型，使其可以成功的使用在一个数学操作中。

更正后的例子

    function total() {
        var theform = document.forms["myform"];
        var total = (+theform.elements["val1"].value) + (+theform.elements["val2"].value);
        alert(total); // This will alert 3
    }
 
### 9.避免使用*document.all*
`document.all`是微软在IE中介绍的，它不是一个标准的javascript DOM属性。虽然许多最新的浏览器通过支持它去兼容依赖于它的蹩脚脚本，但仍有许多浏览器不支持它。

在javascript中除过将`document.all`作为另外一些方法不被支持时的备份及IE5.0以前的浏览器使用外，是没有任何理由使用`document.all`的。你不应该通过判断是否支持`doucment.all`来确定你的浏览器是否为IE，因为现在其他的浏览器也支持这个方法。

仅仅把document.all作为最后的补救方法

    if (document.getElementById) {
        var obj = document.getElementById("myId");
    } else if (document.all) {
        var obj = document.all("myId");
    }
    
一些使用`document.all`的规则是：

- 总是首先尝试使用其他标准方法
- 仅把`doucment.all`作为最后的补救方法使用
- 仅使用他在你需要支持IE5.0以前的版本中
- 当你在使用`document.all`时，总是用`if(document.all)`来检查它是否被支持

### 10.不要在javascript代码块中使用HTML注解

在早期的javascript中（1995），一些像Netscape1.0的浏览器是不支持`<script>`标签的。因此当javascript第一次被发布的时候，面临的问题是需要隐藏老版本浏览器对其不支持而把它们作为文本显示在页面上的问题。"hack"使用HTML的注释包裹script块来隐藏代码。
在script中使用HTML注释是不好的

    <script language="javascript">
        <!--
            // code here
        //-->
    </script>

在今天是没有那个浏览器会忽略`<scrpit>`标签的，因此隐藏javascript代码已经不再需要。事实上，在script中使用HTML注释是无益的，原因如下：

- 在XHTML文档中，js源代码实际将在所有的浏览器中被隐藏。
- 在HTML注释中`--`是不被解析的，因此这将会导致任何在脚本中的递减操作是无效的。


### 11.避免杂乱的全局命名空间

全局变量和函数是很少用到的。使用全局变量可能会导致命名冲突（ Using globals may cause naming conflicts between javascript source files and cause code to break. ）出于这种结果，一个好的实践方式是通过单一全局命名空间将这些全局变量封装起来。

有几个不同的方式可以完成这个任务，其中一些比起另外一些结构是相对比较复杂的。简单的方式是创建一个单一的全局对象，并且分配属性和方法给这个对象。

    var MyLib = {}; // global Object cointainer
    MyLib.value = 1;
    MyLib.increment = function() { 
        MyLib.value++; 
    }
    MyLib.show = function() { 
        alert(MyLib.value); 
    }
    MyLib.value=6;
    MyLib.increment();
    MyLib.show(); // alerts 7

命名空间也可以通过[闭包]创建，并且在javascript中私有成员变量 也能被模拟。
 
### 12.避免使用同步ajax调用

当使用Ajax请求时，你可以选择使用同步模式或者异步模式。异步模式在后台处理请求的同时其他浏览器的请求可以继续被处理，而同步模式将等待请求结果返回后才继续执行下一次请求。

同步请求模式应避免使用。同步请求将造成浏览器被锁住直到请求结果返回。这种情况下，服务器将处于忙碌状态，响应也需要一段时间，用户的浏览器（也许是操作系统）将不允许其他任何事情被做。同时也可能是，响应没有正确的被接收到，浏览器将一直保持锁住状态直到请求超时。

假如你需要使用同步模式，那么你可能需要花大部分时间去重新考虑你的设计。实际需要同步模式的[Ajax]请求如果有也是很少的。
 
### 13.使用json

当通过[Ajax]存储文本格式数据或发送/接收数据时，在能使用[JSON]的情况下尽量使用json替代xml。json是一个更紧凑更高效的数据格式并且是语言中性的。
 
### 14.正确使用`<script>`标签

`<script>`标签是没有 LANGUAGE 属性的。正确的方式是创建如下的javascript代码块：

    <script type="text/javascript"> // code here </script>


[Ajax]: http://www.ajaxtoolbox.com/ "Ajax"
[JSON]: http://www.json.org/ "JavaScript Object Notation"
[闭包]: http://www.jibbering.com/faq/faq_notes/closures.html "Closures"