---
title: Groovy基本语法笔记
date: 2021-01-03
description: 记录Groovy的语法、操作符、运算符等基本语言特性
categories: "groovy"
tag: ["groovy", "java"]
---

这一部分主要记录Groovy的语法、操作符、运算符等基本语言特性。文中没有提及到语法均可参考对应Java语法。

> 本文基于Groovy 3.0.6 详细的说明可以直接参考[官方文档](http://www.groovy-lang.org/documentation.html)


## 语法

### Strings

声明字符串可以使用以下几种方式

1. 单引号 `'...'`
2. 三引号 `'''...'''`
3. 双引号 `"..."`
4. 三双引号 `"""..."""`
5. 斜线字符串 `/.../`
6. 美元斜线字符串 $/.../$

斜线字符串不能声明空串(`def empty = //`被认为是注释);

需要转义字符时使用反斜杠`\`, 对于**美元斜线字符串**使用$;

其中，单引号和三引号不支持插入变量。其他均支持插入变量。

    def name = 'leeyee'
    assert 'name is ${name}' == 'name is ${name}'
    
    def strMultLine = '''1st line
        2nd line
    '''
    
    // remove '\n'
    def strMultLine = '''1st line\
        2nd line
    '''

其中变量占位符号有:

> $, ${}, ${->}

`${}`里可以表达式，也可是语句. 不产生歧义或者单独对象时可用$替代
    
    String name = 'leeyee'
    String sayHi = "Hi, ${name}"
    println " 2 + 3 = ${2 + 3}"
    
    def map = [id: 1, name: 'leeyee']
    print "this is $map.name and id is $map.id"
    
    def sayHi = """Hi,
        $name
    """
    
    def name = /leeyee/
    def sayHi =/Hi,
        $name
    /
    
    def name = $/leeyee/$
    def sayHi =$/Hi,
        $name
    /$

`${->}`表示闭包表达式。闭包表达式是惰性(**Lazy**)的
    
    def num = 1
    def eager = "num=${num}"
    def lazy = "num=${ -> num}"

    assert eager == "num=1"
    assert lazy == "num=1"

    num = 2
    assert eager == "num=1"
    assert lazy == "num=2"

### Numbers

- 二进制: `int num = 0b1010`
- 八进制: `int num = 010`
- 十六进制: `int num = 0x10`

整除运算

    println 3.intdiv(2) // 1

### List

    def nums = [1, 2, 3] // 同构类型
    def nums1 = [1, 'lee', true] // 异构类型
    
上述默认是都是`ArrayList`, 可以使用`as`指定具体的类型, 或者直接声明对应类型的数组

    def linkNums = [1, 2, 3] as LinkedList
    LinkedList linkNum1 = [1, 2, 3]


**List操作**

    def str = ['a', 'b', 'c', 'd']
    
    // Get
    assert 'a' == str[0]
    assert 'd' == str[-1]
    assert 'c' == str[-2]
    assert ['c', null] == str[2, 4]
    assert ['b', 'd'] == str[1, 3]
    assert ['b', 'c', 'd'] == str[1..3]
    assert ['b', 'c'] == str[1..<3]
    
    // Set
    str << 'e'
    str.add('f')
    str[6] = 'g'
    str.add(7,'h')
    assert ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] == str

### Arrays

数组需要强制类型声明:

    String[] books = ['Groovy in Action', 'Making Java Groovy']
    
    def strs = ['a', 'b', 'c', 'd'] as String[]

Groovy3 后也支持Java方式的初始化。**总之不知道Groovy中如何声明时就用Java的方式**

    def ints = new int[]{1, 2, 3}
    String[] strs = new String[] {'cat', 'dog'}

Array元素访问方式和List相同。

### Maps

Groovy创建的Map实际上是`java.util.LinkedHashMap`的实例

    def map = [red: '#F00', green: '#0F0', blue: '#00F']
    assert map instanceof java.util.LinkedHashMap
    
使用变量作为*key*时，必须将*key*用括号包裹起来

    def map0 = [key: 'keyValue']
    assert !map0.containsKey('keyName')
    assert map0.containsKey('key')
    
    def key = 'keyName'
    def map1 = [(key) : 'keyValue']
    assert map1.containsKey('keyName')
    assert !map1.containsKey('key')


    # Get
    assert map['red'] == '#F00'
    assert map.green == '#0F0'
    
    # Set
    map.yellow = '#FF0'
    map['pink'] = '#F0F'
    
## 操作符

### Power操作 `**`

    def n = 2**3 // 8
    def n2 = 4**2 // 16

    def f = 5
    f **= 3 // 5 * 5 * 5

### 三元运算简写 `?:` `?=`

`?:` 和 `?=`
    
    def name
    def displayName = name ?: 'Anonymous'
    assert displayName == 'Anonymous'
    
    int i
    assert i == 0
    i ?= 1
    assert i == 1

### 对象操作

#### 对象安全操作 `?.`

对象安全操作符号`?.`, 避免空指针

    Person person
    assert person?.getName() == null

#### 类公共字段访问操作

使用`.@`操作符直接获取对象属性。而`.`操作调用的是属性对应的`get`方法。
    
    class Person {
        public final String name
        Person(String name){ this.name = name }
        String getName() {"Name: $name"}
    }

    Person p = new Person('lee')
    assert 'Name: lee' == p.name
    assert 'lee' == p.@name

#### 方法指针操作符 `.&`

`.&`用来获取对属性方法的引用

    def string = 'abc'
    def upCaseFun = string.&toUpperCase
    assert upCaseFun() == string.toUpperCase()
    
#### 方法引用操作符 `::`

`::`在动态Groovy中是`.&`的别名。在静态Goovy中类似Java中的`::`

### 正则表达式 `~`

使用`~` 创建正则表达式

    def p = ~/foo/
    assert p instanceof Pattern
    
    def p1 = ~".*foo.*"
    
`Find`操作：

    def text = 'some text to match'
    def m = text =~ /match/
    assert m instanceof Matcher
    
    // if (!m.find(0))
    if(!m) {
        throw new RuntimeException("Oops, text not found!")
    }
    
`Match`操作：

    m = text ==~ /match/
    assert m instanceof Boolean
    
    assert 'start foo end' ==~ p1

    
### 扩展操作符

#### `*.`操作符

- `*.`可用来获取集合对象中某一个单一属性组成的集合
- `*.`是null安全的。当集合对象为空时返回null而不是抛出空指针
- `*.`可以使用在实现了`Iterable`的任何对象上
- `*.`可以多次调用，当处理的对象包含其他集合对象时

        def persons = [new Person('Jack'), new Person('Tom'), null]
        
        // is equivalent to persons.collect{ it.make }
        def names = persons*.name 
        assert ['Jack', 'Tom', null] == names
 
        def cars = [ 
            new Make(name: 'Peugeot',
                models: [new Model('408'), new Model('508')]),
            new Make(name: 'Renault',
                models: [new Model('Clio'), new Model('Captur')])
        ]
        
        def models = cars*.models*.name
        assert models == [['408', '508'], ['Clio', 'Captur']]
        
        // flatten one level
        assert models.sum() == ['408', '508', 'Clio', 'Captur']
        // flatten all levels (one in this case)
        assert models.flatten() == ['408', '508', 'Clio', 'Captur']
  
#### `*` 操作符

- 具有多个变量的方法使用数组传值

        def args = [1, 2, 3]
        int add(int x, int y, int z){x+y+z}
        assert 8 == add(*args)
        
        def arg1 = [1, 3]
        assert 8 == add(2, *args)
        
- 扩展元素到List

        def item = [4, 5]
        assert [1,2,4,5] == [1, 2, *item, 6]

- 扩展元素到Map

如果有相同的*key*,那么后出现的会覆盖之前*value*的。

    def m1 = [c:3, d:4]                   
    def map = [a:1, b:2, *:m1]            
    assert map == [a:1, b:2, c:3, d:4]
     
    assert [a:1, b:2, c:3, d:8] == [a:1, b:2, *:m1, d: 8]   
        
        
### Range操作符

`..` 等价于 `[]`; `..<` 等价于 `[)`。

可以使用具有`next()`和`previous()`方法的任何`Comparable`对象创建一个范围

    def range = 0..5                                    
    assert (0..5).collect() == [0, 1, 2, 3, 4, 5]       
    assert (0..<5).collect() == [0, 1, 2, 3, 4]         
    assert (0..5) instanceof List                       
    assert (0..5).size() == 6
    
    def a2d = 'a'..'d'
    assert a2d == ['a','b','c','d']
    
### 比较运算符`<=>`

`<=>` 相当于`compareTo`方法

    assert (1 <=> 1) == 0
    assert (1 <=> 2) == -1
    assert (2 <=> 1) == 1
    assert ('a' <=> 'z') == -1
    
### 下标运算符

下标运算符是`getAt`或`putAt`的简写

    def list = [0,1,2,3,4]
    assert list[2] == 2                         
    list[2] = 4                                 
    assert list[0..2] == [0,1,4]                
    list[0..2] = [6,6,6]                        
    assert list == [6,6,6,3,4]
    
使用下标运算符分离对象属性(官方示例)

    class User {
        Long id
        String name
        def getAt(int i) {                                             
            switch (i) {
                case 0: return id
                case 1: return name
            }
            throw new IllegalArgumentException("No such element $i")
        }
        void putAt(int i, def value) {                                 
            switch (i) {
                case 0: id = value; return
                case 1: name = value; return
            }
            throw new IllegalArgumentException("No such element $i")
        }
    }
    def user = new User(id: 1, name: 'Alex')                           
    assert user[0] == 1                                                
    assert user[1] == 'Alex'                                           
    user[1] = 'Bob'                                                    
    assert user.name == 'Bob'     
    
### 安全索引操作 `?[]`

Goovey3 引入索引安全操作符`?[]`, 类似`?.`操作。该操作只能避免操作对象为空的情况，不能避免数组越界操作。

    String[] array = ['a', 'b']
    assert 'b' == array?[1]
    array?[1] = 'c'
    assert 'c' == array?[1]
    
    // throw java.lang.ArrayIndexOutOfBoundsException
    array?[2] 
    
    def person = [name: 'lee', location: 'Beijing']
    assert 'lee' == person?['name']
    person?['name'] = 'leeyee'
    assert 'leeyee' == person?['name']
    
    
### 成员操作

`in` 等价 `isCase()`方法。对于`List`类型，等价于`contains()`方法

    def list = ['a','b','c']
    assert ('a' in list)
    assert list.contains('a')
    assert list.isCase('a')

### 对象比较 `==` `===` `is()`

Groovy `==` 相当于Java中的 `equals()`

Groovy(3+) `===` 或者 `is()` 相当于Java中的 `==`

    def list1 = ['Groovy 1.8', 'Groovy 2.0', 'Groovy 2.3']
    def list2 = ['Groovy 1.8', 'Groovy 2.0', 'Groovy 2.3']
    assert list1 == list2
    assert !list1.is(list2)
    assert list1 !== list2
    
### 强制类型转换操作`as`

`as` 强制类型转换。

针对如下Java式的强转在Groovy中会报错

    Integer x = 123
    String s = (String) x
    
因此需要使用`as`操作

    String s = x as String
    
当一个对象被强制转换为另一个对象时，除非目标类型与源类型相同，否则强制将返回一个新对象。

强制规则因源和目标类型而异，如果未找到转换规则，强制可能会失败。可通过在类中实现`asType`方法完成自定义转换规则。

### `<>`操作符

语法糖，为了匹配Java7的泛型。

    List<String> strings = new LinkedList<>()

在动态Groovy中，这是完全未使用的。在静态类型检查的Groovy中，它也是可选的，因为**Groovy类型检查器会执行类型推断**，无论是否存在此运算符


### `Call`操作

调用运算符`()`用于**隐式调用**名为`call`的方法。对于定义调用方法的任何对象，可以省略.call部分，而改用`call`运算符。

    class MyCallable {
        int call(int x) {           
            2*x
        }
    }
    
    def mc = new MyCallable()
    assert mc.call(2) == 4    
    assert mc(2) == 4
    
## 运算符重载

Groovy允许重载运算符。这个功能比较有意思，可以通过重写一些隐式方法实现对操作符行为的改变。具体可直接参考[官方文档](http://groovy-lang.org/operators.html#Operator-Overloading)

一个简单的例子，通过重写`plus`方法，使对象实例可以通过`+`号操作符做加法操作

    class PlusDemo {
        int size
        PlusDemo plus(PlusDemo other){
            return new PlusDemo(size: this.size + other.size)
        }
    }
    
    def a = new PlusDemo(size: 1)
    def b = new PlusDemo(size: 3)
    assert 15 == (a + b).size