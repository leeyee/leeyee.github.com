---
layout: post
title: Velocity模版语言 (VTL)用户指南笔记
description: velocity 模版使用指南笔记。
category: java
tag: [velocity]
---

* [TOC]
{:toc}

http://velocity.apache.org/engine/2.0/user-guide.html

## 注释

**单行**

    ## this is a single line comment.

**多行**

    #*
        Multi lines comment.
        Mulit lines comment.
    *#

## 引用

### 变量

以 **$** 开始，大小写字母开始，可包含数字和下划线

**当VTL引用变量时，变量可以从模版的`set`指令或Java代码中获取值。**

### 属性

    $user.Name
    $user.age

#### 属性查找规则

对于小写名，比如`$user.name`查找顺序为：

1. getname()
2. getName()
3. **get("name")**
4. isName()

对于大写名，比如`$user.Name`查找顺序为：

1. getName()
2. getname()
3. **get("Name")**
4. isName()

### 方法

    $user.getName()
    $user.getAge()
    $user.setName("leeyee")
    $user.setAag(30)
    $user.setAttributes(["attr1", "attr2", "attr3"])

> 属性和方法之间的主要区别在于：**可以为方法指定参数列表**。

所有数组引用都被当作固定长度的列表处理，也就是`java.util.List`对象。所以，如果有一个名为`$array`的数组引用（假设是一个带有三个值的`String[]`），那么可以有如下操作

    $array.isEmpty() ## or $array.empty
    $array.size()
    $array.get(1)
    $array.set(1, 'test')
    
Velocity也支持`vararg`方法。

    public void setSomethings(String... something){
        
    }
    // or
    public void setSomethings(String [] somethings){
        
    }

    $thisObj.setSomethings('some1', 'some2', 'some3')
    $thisObj.setSomethings('some')
    
    ## length eq zero empty array
    $thisObj.setSomethings()

### 渲染

**模版渲染时，每个引用（无论是变量、属性还是方法）产生的最终值都会被转换成`String`对象。** 即调用对象的`toString()`方法。

### 索引表示法


    $foo[0]     ## $foo takes in an Integer look up
    $foo[$i]    ## Using another reference as the index
    $foo['bar'] ## passing a string where $foo may be a map

这些相当于调用了`$foo.get(0)`

    $foo.bar[1].junk
    $foo.callMethod()[1]
    $foo['apple'][4]
    
使用索引表示法设置引用

    #set($foo[0] = 1)
    #set($foo.bar[1] = 3)
    #set($map['apple'] = 'Orange')

对于上面的表达式，Velocity首先尝试调用对象的`set`方法，在尝试`put`方法。
    
## Formal Reference Notation

上面引用均为其简写形式，下面给出完整的引用。

    ${user.name}
    ${user.getName()}
    
大部分情况下使用简写形式，但在某些情况需要完整形式。比如

    Jack is a $vicemaniac.

这对Velocity来说是模糊的，此时就需使用完整形式明确指明引用名称。

    Jack is a ${vice}maniac.
    
## Quiet Reference Notation

Velocity遇到未定义引用时，将输出引用本身。比如

    <input type='text' name='email' value='$email'/>

当`$email`未定义时，该输入框的值为字符串 *$email*。

为了不让该种情况出现，应使用`$!email`替代`$email`。这样当`$email`未定义或值不存在时，将输出一个空字符串。

⚠️ **`$!email` 的 Formal 形式是 `$!{email}`**

## 严格引用模式

Velocity 1.6 引入严格模式。通过设置参数`runtime.references.strict`为 *true* 开启。开启严格模式后，以下情况将抛出异常。

1. 引用**未显式**放入上下文或**未使用**`#set`定义，抛出异常；
2. 引用调用对象未包含的属性和方法，抛出异常；
3. 在空值上调用方法或属性，抛出异常；

假如`$foo`未定义，则下列的语句在严格模式下都将抛出异常

    $foo
    #set($bar = $foo)
    #if($foo == $bar)
    #foreach($item in $foo)#end

假如`$obj`是一个对象，有属性`foo`和返回 *null* 的方法`returnNull()`，那么下面的语句严格模式下会抛出异常

    $obj.abc
    $obj.foo.abc
    $obj.returnNull.abc

### 特别的`#if`

对于`#if`和 `#elseif`这两个指令，如果不涉及引用的属性和方法或者值的比较，则不受严格模式影响。

下面示例代码中涉及到的`$foo`未被定义, 但不会抛出异常

    #if ($foo) #end ## False
    #if ( ! $foo) #end  ## True
    #if ($foo && $foo.bar)#end  ## False
    #if ($foo && $foo == 'bar')#end ## False
    #if ($foo || $foo2)#end ## False
    
对于通过 `#if` 进行>,<,>=,<=比较的，是受严格模式影响。

对于`#foreach`指令，严格模式下要求参数是可迭代的，否则抛出异常。该行为可通过设置`directive.foreach.skip.invalid`来改变。

### 引用值为null

引用被定义但值为 *null* ，严格模式下将抛出异常。此时可以通过 `$!` 简单渲染而不抛错。这与上下文中不存在该引用是不同的。

假如严格模式下 `$foo=null` , `$bar` 不存在,

    this is $foo    ## throws an exception because $foo is null
    this is $!foo   ## render to 'this is ' without an exception
    #* 
        Strict mode: throws an exception because $bar is not in the context.
        No strict mode: render to 'this is ' without an exception.
    *#
    this is $!bar   

## Case Substitution

下面每组代码示例都是等价的：
     
    $foo.getBar()
    $foo.Bar
    
    $user.setName('jack')
    #set( $user.Name = 'jack')
    
    $data.getRequest().getServerName()
    $data.Request.ServerName
    ${data.Request.ServerName}
    
⚠️  **引用的解析只针对JavaBean getter/setter方法等价的属性，不解析引用对象的公共实例变量。** 参考属性查找规则。

## 指令

以 **#** 开头，指令名可用 **{** 和 **}** 进行包裹。比如

    #if($a == 1)true enough#elseno way!#end

会引起Velocity迷惑，抛出异常。此时就需要对指令名进行包裹。

    #if($a == 1)true enough#{else}no way!#end
    
### Set

该指令没有`#end`语句

    #set( $monkey = $bill ) ## variable reference
    #set( $monkey.Friend = "monica" ) ## string literal
    #set( $monkey.Blame = $whitehouse.Leak ) ## property reference
    #set( $monkey.Plan = $spindoctor.weave($web) ) ## method reference
    #set( $monkey.Number = 123 ) ##number literal
    #set( $monkey.Say = ["Not", $my, "fault"] ) ## ArrayList
    #set( $monkey.Map = {"banana" : "good", "roast beef" : "bad"}) ## Map

表达式

    #set( $value = $foo + 1 )
    #set( $value = $bar - 1 )
    #set( $value = $foo * $bar )
    #set( $value = $foo / $bar )
    
#### 字面

使用`#set`指令时，将解析**双引号**字符中的字符串。

    #set( $hello = "hello")
    #set( $world = "world")
    #set( $link = "$a $b !")  ## $link is hello world !

默认不解析**单引号**字符串中的字符串

    #set( $hello = "hello")
    #set( $world = "world")
    #set( $link = '$a $b !')  ## $link is '$a $b !'

可在 *velocity.properties* 修改 **stringliterals.interpolate** 为 *true* 改变该行为。


如有不想被解析的内容，可通过指令`#[[...]]#`来包装块。下面的代码将不会被解析，而被原样输出

    #[[
        #foreach ($i in $array)
            will not be parsed.
        #end
    ]]#
    
### 条件指令

#### If/ElseIf/Else

    #if( condition )
    #elseif ( condition )
    #else
    #end

**特殊值判断**

- $ref == $null
- $ref == false
- $ref == ''
- $ref == 0
- $ref.size() == 0

`$null` 比较特殊，如果不是自定义的变量，那么语义就是`null`，否则就是具体的变量引用（比如设置了 `#set($null = "abc")`）。

⚠️ **Velocity上下文仅包含对象**。当说`boolean`时，它将被表示为`Boolean`对象

**比较符号替代品**

*==,!=,>,<,>=,<=,!* 可用 *eq,ne,gt,lt,ge,le,not*替代

#### 逻辑操作

支持：AND，OR，NOT

    $foo == $bar
    $foo && $bar
    $foo || $bar
    !$foo
    
Velocity的等号操作可以直接比较数字，字符串或者对象。当对象是不同的类时，通过对象的`toString`方法比较。

### 循环迭代

#### Foreach

    #foreach ( $element in $elements )
    #end
    
    #foreach ( $key in $map.keySet() )
    #end
    

属性 | 说明
---|---
$foreach.index | 当前元素索引，从0开始
$foreach.count | 当前元素位置，从1开始
$foreach.first | 是否第一个元素
$foreach.last | 是否最后一个元素
$foreach.hasNext | 是否有下个元素
$foreach.parent | 父循环当前对象
$foreach.topmost | 父循环当前对象

    #foreach ( $user in $users )
        #if ( $foreach.count > 5 )
            #break
        #end
        
        $foreach.index : $user.Name
        
        #if ($foreach.hasNext)
            <br />
        #end
    #end
    
### Include

    #include ( "some.txt" )
    #include ( 'a.txt', 'b.jpg', 'c.htm')
    
引入本地文件，该文件不会被解析。 出于安全考虑，引入文件应在 **TEMPLATE_ROOT** 下。

`#include` 指令的参数可以是变量引用。

    #include( "a.txt", $otherFile )

### Parse

    #parse( "me.vm" )
    #parse( $othervm )
    
`#parse`和`#include`类似，只不过`#parse`会解析引入文件。

不同点：

- `#parse` 只有一个参数；
- `#parse` 模版可以包含`#parse`指令。默认最多10，可通过**directive.parse.max.depth**进行修改；
- `#parse` 支持递归调用；

### Break

`#break` 指令用来停止渲染当前的执行范围。执行范围是包含内容的任何指令。与`#stop`不同点在于只能中断最里面的范围。

### Stop

`#stop` 终止模版渲染。`#stop` 可以有一个参数，该参数会在该命令执行结束时被写入日志(LEVEL DEBUG)。

    #stop( '$foo was not in context' )

### Evalute

执行动态VTL。类似Javascript的 *eval* 函数。

    #set($source1 = "abc")
    #set($select = "1")
    #set($dynamicsource = "$source$select")
    
    ## $dynamicsource is now the string '$source1'
    #evaluate($dynamicsource)

### Define

定义一个块。相当于定一个模板片段的引用，作用于当前模版上下文中。

    #define( $block )Hello $who#end
    #set( $who = 'World!' )
    $block  ## output: Hello World!

### 宏

`#macro` 定义需要被重复使用到到模版片段。

**无参宏**

    #macro ( noArgMacro )
        <tr><td></td></tr>
    #end

使用 `#noArgMacro()` 调用。 如果宏片段中包含参数，

    #macro ( noArgMacro )
        <tr><td>$!bodyContent</td></tr>
    #end

则在调用该无参宏时，需要通过以下方式来传递参数：

    #@noArgMacro() Hello World!#end
    
**有参宏**

    #macro ( argMacro $arg1 [$arg2..])
        ## html 
    #end
    
使用 `#argMacro( $ar1 $arg2)` 调用。

宏可以被定义为内联的（在某个具体的模版文件内定义），这意味着该宏在其他模版中不可用。

#### 宏参数

以下均可作为宏的参数：

- Reference：任何以 **$** 起始的引用
- String：比如 *"$foo"* 或者 *'hello'*
- Number：比如*1，2*等
- Integer Range：*[1..2]* 或 *[$foo..$bar]*
- Object Array：*["a","b","c"]*
- boolean: *true* or *false*

对于Reference参数，是按照参数名称来传递的[^comment]，也就是说**参数的值是在宏内部每次使用才生成的**。

    #macro ( callMe $a )
        $a $a $a
    #end

此时调用`#callMe( $foo.bar() )` 则 `$foo.bar()` 将会被调用三次。如果不想这么做，那么需要调用方式改成下面的样子：

    #set( $myVal = $foo.bar() )
    #callMe( $myVal )

#### 宏属性

- **velocimacro.library**: 宏文件查找路径；多个用逗号分隔；默认Velocity从*VM_global_library.vm*文件中查找；

- **velocimacro.permissions.allow.inline**: 是否可在常规模版中定义宏。取值：true|false。默认true，表示允许模版设计者在模版中定义宏。

- **velocimacro.permissions.allow.inline.to.replace.global**: 内联定义的宏是否可替换全局宏。可取值true或false, 默认false。启动时加载

- **velocimacro.permissions.allow.inline.local.scope**: 内联宏是否只对定义模版可见。默认false。

- **velocimacro.library.autoreload**: 是否自动加载宏。默认false。当开启时，需要设置**file.resource.loader.cache**为*false*。该属性主要用来开发测试。

> ⚠️ 当有两个模版各自定义一个具有相同名称的宏时，需要将 **velocimacro.permissions.allow.inline.local.scope** 或者 **velocimacro.permissions.allow.inline.to.replace.global** 设置为true，以便每个模版使用自己的宏。

更多属性可查看[开发者指南]( http://velocity.apache.org/engine/2.0/developer-guide.html)

## 特殊字符处理(Getting Literal)

### 美元符号

直接使用即可，VTL不会将此时 **$** 当作模版内置符号进行处理，因为其不符合VTL对于变量的定义。

### 转义VTL引用

    #set( $email = "foo" )
    $email  ## foo
    \$email ## $email
    
    \\$email    ## \foo
    \\\$email   ## \$email 
    
`$email` 未被定义：

    $email  ## $email
    \$email ## \$email
    \\$email    ## \\$email
    \\\$email   ## \\\$email

### 转义无效VTL引用

    #set( $D = '$' )
    ${D}{my:invalid:non:reference}

### 转义VTL指令

    ## #include( "a.txt" ) renders as <contents of a.txt>
    #include( "a.txt" )
    
    ## \#include( "a.txt" ) renders as #include( "a.txt" )
    \#include( "a.txt" )
    
    ## \\#include ( "a.txt" ) renders as \<contents of a.txt>
    \\#include ( "a.txt" )

特别的，对于

    #if( $jazz )
        Vyacheslav Ganelin
    #end

如果`$jazz`是 *true*

    ## render as 
    Vyacheslav Ganelin

否则没有输出。转义会改变输出，

    \#if( $jazz )
        Vyacheslav Ganelin
    \#end

此时指令被转义但`$jazz`的渲染正常，因此当`$jazz`是 *true* 时将输出：

    #if( true )
     Vyacheslav Ganelin
    #end

而对于

    \\#if( $jazz )
       Vyacheslav Ganelin
    \\#end

当`$jazz`是 *true* 时输出：

    \ Vyacheslav Ganelin
    \
否则输出：

    \

⚠️ 如果转义不正确，将会出错，比如下面的代码：

    \\\#if( $jazz )
        Vyacheslave Ganelin
    \\#end

## VTL: 格式问题

Velocity默认移除多余的空白。因此下面的代码片段是等价的：

    #set( $imperial = ["Munetaka","Koreyasu","Hisakira","Morikune"] )
    #foreach( $shogun in $imperial )
        $shogun
    #end
    
    Send me #set($foo=["$10 and ","a pie"])#foreach($a in $foo)$a#end please.

## 其他功能

### Math

`#set`指令支持加减乘除和取余操作。

### Ranger 操作

范围操作与`#set`和`foreach`语句一起使用。

    [n..m]

*n*,*m* 为整数或返回整数的表达式。*m*可以小于*n*。

    [1..3]  ## 1,2,3
    [2..-1] ## 2,1,0,-1
    

### 转义和 **!**

    #set( $foo = "bar" )
    $\!foo  ## $!foo
    $\!{foo}    ## $!{foo}
    $\\!foo ## $\!foo
    $\\\!foo    ## $\\!foo
    
    \$foo   ## $foo
    \$!foo  ## $!foo
    \$!{foo}    ## $!{foo}
    \\$!{foo}   ## \bar
    
### 关于宏的常见问题

#### 指令参数是否可以是其他指令或VM？

    #center( $bold("hello") )

**不可以**。但可以通过以下方式达到相同的目的

    #set($stuff = "#bold('hello')" )
    #center( $stuff )
    
⚠️  `$stuff` 是在 `#center` 内部调用时才执行的，而不是直接将其返回值传递到 `#center` 中。

    #macro( inner $foo )
      inner : $foo
    #end
    
    #macro( outer $foo )
       #set($bar = "outerlala")
       outer : $foo
    #end
    
    #set($bar = 'calltimelala')
    #outer( "#inner($bar)" ) ## Outer : inner : outerlala

#### 是否可以通`#parse()`指令注册宏么？

**Velocity1.6 后可以**。之前的版本要求必须先定义宏后才能使用宏。

#### 如何开启宏自动加载？

    file.resource.loader.path = templates
    file.resource.loader.cache = false
    velocimacro.library.autoreload = true
    
⚠️ 不要在生产环境使用该配置!

### 字符串拼接

直接拼接变量即可。

    #set( $size = "Big" )
    #set( $name = "Ben" )
    
    The clock is $size$name
    
    #set($clock = "$size$name" )
    The clock is $clock ## The clock is BigBen
    
    #set($clock = "${size}Tall$name" )
    The clock is $clock ## The clock is BigTallBen
    

[^comment]:When passing references as arguments to Velocimacros, please note that references are passed 'by name'
