---
layout: post
title: jQuery插件编写
category: jQuery
tag: [javascript, jQuery]
description: 当你已经熟练掌握`jQuery`并且想学习如何编写属于自己的插件程序时，你可以参看这篇文章。使用插件程序和方法扩展`jQuery`是非常强大的。你可以将一些想法抽象为函数并封装到插件中以便为你和你的同事节省许多开发时间。
keywords: [jQuery插件编写]
---

原文地址：[http://docs.jquery.com/Plugins/Authoring](http://docs.jquery.com/Plugins/Authoring)

So you've become comfortable with jQuery and would like to learn how to write your own plugins. Great! You're in the right spot. Extending jQuery with plugins and methods is very powerful and can save you and your peers a lot of development time by abstracting your most clever functions into plugins. This post will outline the basics, best practices, and common pitfalls to watch out for as you begin writing your plugin.

当你已经熟练掌握`jQuery`并且想学习如何编写属于自己的插件程序时，你可以参看这篇文章。使用插件程序和方法扩展`jQuery`是非常强大的。你可以将一些想法抽象为函数并封装到插件中以便为你和你的同事节省许多开发时间。

#目录(CONTENTS)
1. [入门知识(Getting Started)](#t1)

2. [上下文(Context)](#t2)

3. [基本要素(The Basics)](#t3)

4. [保持可链通性(Maintaining Chainability)](#t4)

5. [默认值和可选项(Defaults and Options)](#t5)

6. [命名空间(Namespacing)](#t6)

    6.1 [插件方法(Plugin Methods)](#t61)
   
    6.2 [事件(Events)](#t62)
   
    6.3 [数据(Data)](#t63)
   
7. [总结和最佳实践(Summary and Best Practices)](#t7)

8. [翻译(Translations)](#t8)


##<div id='t1'>入门知识(Getting Started)</div>
To write a jQuery plugin, start by adding a new function property to the jQuery.fn object where the name of the property is the name of your plugin:

编写`jQuery`插件,是从添加一个新的函数属性到`jQuery.fn`对象开始的，其中新的函数属性名为你要编写插件的名称：

    jQuery.fn.myPlugin = function() {
        // Do your awesome plugin stuff here
    };
   
But wait! Where's my awesome dollar sign that I know and love? It's still there, however to make sure that your plugin doesn't collide with other libraries that might use the dollar sign, it's a best practice to pass jQuery to an IIFE (Immediately Invoked Function Expression) that maps it to the dollar sign so it can't be overwritten by another library in the scope of its execution.

但是请等一下，我们喜爱的万能`$`符号在哪里？它仍然在哪里，然而为了确保你的插件不会与其他可能使用`$`符号的`javascript`库冲突，一个最佳的实践是将`jQuery`对象当做参数传递到一个可立即执行的函数表达式中（IIFE），该函数表达式会通过`$`符号来映射`jQuery`对象，这样在该函数表达式内，`$`符号将不会被在其可执行的作用域中的其他库所覆盖。

    (function( $ ) {
        $.fn.myPlugin = function() {
            // Do your awesome plugin stuff here
        };
    })( jQuery );
   
Ah, that's better. Now within that closure, we can use the dollar sign in place of jQuery as much as we like.

这样就可以了。现在通过闭包，我们就能使用我们喜爱的`$`符号代替`jQuery`对象了。

##<div id='t2'>上下文(Context)</div>
Now that we have our shell we can start writing our actual plugin code. But before we do that, I'd like to say a word about context. In the immediate scope of the plugin function, the this keyword refers to the jQuery object the plugin was invoked on. This is a common slip up due to the fact that in other instances where jQuery accepts a callback, the this keyword refers to the native DOM element. This often leads to developers unnecessarily wrapping the this keyword (again) in the jQuery function.

现在，有了插件外壳，我们就可以开始编写真正的插件代码了。但是在此之前，我想要谈谈上下文。在插件函数的当前域中，*this* 关键字是指代被调用插件中的`jQuery`对象的。这是一个常见的疏忽，因为在`jQuery`接受回调的其他情况中，*this* 关键字指代的是原生`DOM`元素。这常常会导致开发人员不必要地使用`jQuery`函数来包装 *this* 关键字。

    (function( $ ){
        $.fn.myPlugin = function() {
            // there's no need to do $(this) because
            // "this" is already a jquery object
            // $(this) would be the same as $($('#element'));
            // 这里不需要执行$(this),
            // 因为this已经是一个jQuery object对象了
            // $(this) 等价于 $($('#element'));
            this.fadeIn('normal', function(){
                // the this keyword is a DOM element
            });
        };
    })( jQuery );
    $('#element').myPlugin();
   
##<div id='t3'>基本要素(The Basics)</div>
Now that we understand the context of jQuery plugins, let's write a plugin that actually does something.

现在，在了解了`jQuery`插件的上下文后，我们来编写一个实现了一些功能的插件。

    (function( $ ){
        $.fn.maxHeight = function() {
            var max = 0;
            this.each(function() {
                max = Math.max( max, $(this).height() );
            });
            return max;
        };
    })( jQuery );
    // Returns the height of the tallest div
    var tallest = $('div').maxHeight();
   
This is a simple plugin that leverages .height() to return the height of the tallest div in the page.

这是一个简单的插件，通过调用 `.height()` 来获取页面最高div元素的高度。

##<div id='t4'>保持可链通性(Maintaining Chainability)</div>

The previous example returns an integer value of the tallest div on the page, but often times the intent of a plugin is simply modify the collection of elements in some way, and pass them along to the next method in the chain. This is the beauty of jQuery's design and is one of the reasons jQuery is so popular. So to maintain chainability in a plugin, you must make sure your plugin returns the this keyword.

前面的示例返回一个整数值。但是大多数时候编写插件的意图是在某种程度上简单的修改一系列的元素，并且传递他们到另一个方法。这是`jQuery`优雅的设计之处和如此受欢迎的原因之一。因此为了维护插件中代码的可链通性，必须保证插件返回 *this* 关键字。

    (function( $ ){
        $.fn.lockDimensions = function( type ) { 
            return this.each(function() {
                var $this = $(this);
                if ( !type || type == 'width' ) {
                    $this.width( $this.width() );
                }
                if ( !type || type == 'height' ) {
                    $this.height( $this.height() );
                }
            });
        };
    })( jQuery );
   
    $('div').lockDimensions('width').css('color', 'red');

Because the plugin returns the this keyword in its immediate scope, it maintains chainability and the jQuery collection can continue to be manipulated by jQuery methods, such as .css. So if your plugin doesn't return an intrinsic value, you should always return the this keyword in the immediate scope of the plugin function. Also, as you might assume, arguments you pass in your plugin invocation get passed to the immediate scope of the plugin function. So in the previous example, the string 'width' becomes the type argument for the plugin function.

因为插件在其当前的作用范围内返回了 *this* 关键字，所以就维持了可链通性，返回的`jQuery`对象集合也就可以继续被`jQuery`方法操作，比如 `.css`。假如插件不能返回一个内在值，那么就应该总是返回在其当前作用范围内的 *this* 关键字。另外，如你所想，插件调用中的参数也传递到了当前作用范围内的插件函数中。所以在上述示例中，字符串'width'就变成了插件函数中的一个 type 参数。

##<div id='t5'>默认值和可选项(Defaults and Options)</div>

For more complex and customizable plugins that provide many options, it's a best practice to have default settings that can get extended (using $.extend) when the plugin is invoked. So instead of calling a plugin with a large number of arguments, you can call it with one argument which is an object literal of the settings you would like to override. Here's how you do it.

对于许多包含可选项的复杂可定制化插件，最好的方式是有一些能在被调用时可扩展(使用`$.extend`)的默认设置。这样就可以避免在调用插件时传递大量参数，取而代之的是在调用时使用一个需要覆盖掉的参数对象。下面就是如何实现他。

    (function( $ ){
        $.fn.tooltip = function( options ) { 
            // Create some defaults, extending them with any options that were provided
            var settings = $.extend( {
                'location'         : 'top',
                'background-color' : 'blue'
            }, options);
       
            return this.each(function() {       
                // Tooltip plugin code here
            });
        };
    })( jQuery );
   
    $('div').tooltip({
        'location' : 'left'
    });
   
In this example, after calling the tooltip plugin with the given options, the default location setting gets overridden to become 'left', while the background-color setting remains the default 'blue'. So the final settings object ends up looking like this:

在这例子中，当使用给定的可选项调用 `tooltip` 插件方法后，默认的 'location' 属性会被设置成 'left', 而 'background-color' 属性则保持不变。所以最终的 'settings' 对象看来是这样的：

    {
        'location'         : 'left',
        'background-color' : 'blue'
    }
   
This is a great way to offer a highly configurable plugin without requiring the developer to define all available options.

这是一种很好的方式。它提供了一个高度可配置的插件，而不需要开发人员去定义所有的可用选项。

##<div id='t6'>命名空间(Namespacing)</div>

Properly namespacing your plugin is a very important part of plugin development. Namespacing correctly assures that your plugin will have a very low chance of being overwritten by other plugins or code living on the same page. Namespacing also makes your life easier as a plugin developer because it helps you keep better track of your methods, events and data.

为你的插件设置一个适当的命名空间是插件开发中非常重要的一部分。合理的命名空间可以降低你的插件被另一些插件或者当前页面上的代码覆盖的几率。命名空间也可以让你的开发变得容易，它可以让你更好的跟踪方法、事件和数据。

###<div id='t61'>插件方法(Plugin Methods)</div>

Under no circumstance should a single plugin ever claim more than one namespace in the jQuery.fn object.

在任何情况下，一个单独的插件在`jQuery.fn`对象上的命名空间都不应超过一个。

    (function( $ ){
        $.fn.tooltip = function( options ) {
            // THIS
        };
        $.fn.tooltipShow = function( ) {
            // IS
        };
        $.fn.tooltipHide = function( ) {
            // BAD
        };
        $.fn.tooltipUpdate = function( content ) {
            // !!! 
        };
    })( jQuery );
   
This is a discouraged because it clutters up the $.fn namespace. To remedy this, you should collect all of your plugin's methods in an object literal and call them by passing the string name of the method to the plugin.

这样做是不被提倡的，因为它会使`$.fn`命名空间变得混乱。为了解决这个问题，你应该将所有插件的方法存放在一个对象字面量中，然后通过传递方法的字符串名称来调用。

    (function( $ ){
        var methods = {
            init : function( options ) {
                // THIS
            },
            show : function( ) {
                // IS
            },
            hide : function( ) {
                // GOOD
            },
            update : function( content ) {
                // !!!
            }
        };

        $.fn.tooltip = function( method ) {
        // Method calling logic
            if ( methods[method] ) {
                return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
            }   
        };
    })( jQuery );

    // calls the init method
    $('div').tooltip();

    // calls the init method
    $('div').tooltip({
        foo : 'bar'
    });
    // calls the hide method
    $('div').tooltip('hide');
    // calls the update method
    $('div').tooltip('update', 'This is the new tooltip content!');
   
This type of plugin architecture allows you to encapsulate all of your methods in the plugin's parent closure, and call them by first passing the string name of the method, and then passing any additional parameters you might need for that method. This type of method encapsulation and architecture is a standard in the jQuery plugin community and it used by countless plugins, including the plugins and widgets in [jQueryUI](http://jqueryui.com/).

这种类型的插件结构允许在插件的父闭包中封装所有的方法，然后通过先传递方法的字符串名称，再传递其他一些这个方法可能用到的参数来调用。这种方式的方法封装和架构在`jQuery`插件社区是一种标准并被无数的插件采用，包括[jQueryUI](http://jqueryui.com/)插件和组件。

###<div id='t62'>事件(Events)</div>

A lesser known feature of the [bind](http://docs.jquery.com/Events/bind) method is that is allows for namespacing of bound events. If your plugin binds an event, its a good practice to namespace it. This way, if you need to [unbind](http://docs.jquery.com/Events/unbind) it later, you can do so without interfering with other events that might have been bound to the same type of event. You can namespace your events by appending “.< namespace >”the type of event you're binding.

对于[bind](http://docs.jquery.com/Events/bind)方法一个鲜有人知的特性是允许为绑定的事件声明命名空间。假如你的插件绑定了一个事件，一个好的处理方式是为该事件也添加命名空间。通过这种方式，假如随后你需要解除绑定([unbind](http://docs.jquery.com/Events/unbind))，就可以在不影响其他可能已经绑定了相同类型事件的情况下解除该绑定。你可以通过添加`.<namespace>`给你要绑定的事件添加命名空间。

    (function( $ ){
        var methods = {
            init : function( options ) {
                return this.each(function(){
                    $(window).bind('resize.tooltip', methods.reposition);
                });
            },
            destroy : function( ) {
                return this.each(function(){
                    $(window).unbind('.tooltip');
                })
            },
            reposition : function( ) {
                // ...
            },
            show : function( ) {
                // ...
            },
            hide : function( ) {
                // ...
            },
            update : function( content ) {
                // ...
            }
        };

        $.fn.tooltip = function( method ) {
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
            }   
        };
    })( jQuery );
   
    $('#fun').tooltip();
    // Some time later...
    $('#fun').tooltip('destroy');
   
In this example, when the tooltip is initialized with the init method, it binds the reposition method to the resize event of the window under the namespace 'tooltip'. Later, if the developer needs to destroy the tooltip, we can unbind the events bound by the plugin by passing its namespace, in this case 'tooltip', to the unbind method. This allows us to safely unbind plugin events without accidentally unbinding events that may have been bound outside of the plugin.

在这个示例中，当 `tooltip` 使用 `init` 方法初始化时，他会绑定 `reposition` 方法到`window`对象的 `resize` 事件上，这些都是在 'tooltip' 命名空间下进行的。之后，如果开发人员需要销毁 `tooltip` ，就可以通过传递命名空间来解除该命名空间下绑定的事件。这让我们可以安全的解除通过插件绑定的事件，而不用担心将通过插件外其他方式绑定的事件也解除掉。

###<div id='t63'>数据(Data)</div>

Often times in plugin development, you may need to maintain state or check if your plugin has already been initialized on a given element. Using jQuery's data method is a great way to keep track of variables on a per element basis. However, rather than keeping track of a bunch of separate data calls with different names, it's best to use a single object literal to house all of your variables, and access that object by a single data namespace.

通常在插件开发中，可能需要维护状态或者检测插件在给定的元素上是否已被初始化。使用`jquery` 的 `data` 方法可以很好的跟踪基于每一个元素的变量。然而，相比跟踪大量有着不同名字的单独数据，还不如使用一个单独对象的字面量去存储所有变量并通过单一数据命名空间来访问此对象。

    (function( $ ){
        var methods = {
            init : function( options ) {
                return this.each(function(){
                    var $this = $(this),
                    data = $this.data('tooltip'),
                    tooltip = $('<div />', {
                        text : $this.attr('title')
                    });
                // If the plugin hasn't been initialized yet
                    if ( ! data ) {
                        /*
                        Do more setup stuff here
                        */
                        $(this).data('tooltip', {
                            target : $this,
                            tooltip : tooltip
                        });
                    }
                });
            },
            destroy : function( ) {
                return this.each(function(){
                    var $this = $(this),
                    data = $this.data('tooltip');
                    // Namespacing FTW
                    $(window).unbind('.tooltip');
                    data.tooltip.remove();
                    $this.removeData('tooltip');
                })
            },
            reposition : function( ) { // ... },
            show : function( ) { // ... },
            hide : function( ) { // ... },
            update : function( content ) { // ...}
        };

        $.fn.tooltip = function( method ) {
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
            }   
        };
    })( jQuery );

Using data helps you keep track of variables and state across method calls from your plugin. Namespacing your data into one object literal makes it easy to access all of your plugin's properties from one central location, as well as reducing the data namespace which allows for easy removal if need be.

使用数据有助于跟踪变量及来自插件方法调用间的状态。命名空间数据到一个对象字面量中，从一个中心位置来访问  以便从一个中心位置容易的访问所有的插件属性，同时如果有需要还可以轻松的移除不需要的命名空间。

##<div id='t7'>总结和最佳实践(Summary and Best Practices)</div>

Writing jQuery plugins allows you to make the most out of the library and abstract your most clever and useful functions out into reusable code that can save you time and make your development even more efficient. Here's a brief summary of the post and what to keep in mind when developing your next jQuery plugin:

编写`jQuery`插件允许你实现最有利用效率的库，允许你抽象有用的函数到可重用代码中，从而为你节省大量开发时间，使你的开发团队更加高效。下面是一些一些在开发`jQuery`插件过程中应时刻牢记的简要的总结：


1.  Always wrap your plugin in a closure: (function( $ ){ /* plugin goes here */ })( jQuery );
   
    始终将你的插件封装在一个闭包中：`(function($) { /* plugin goes here */ })( jQuery );`

2.  Don't redundantly wrap the this keyword in the immediate scope of your plugin's function

    不要在插件函数的当前作用域中使用`$(this)`多余的处理 *this* 关键字。

3.  Unless you're returning an intrinsic value from your plugin, always have your plugin's function return the this keyword to maintain chainability.

    除非返回一个内部值，否则总是让你的插件函数返回 *this* 关键字以保持链通性。

4.  Rather than requiring a lengthy amount of arguments, pass your     plugin settings in an object literal that can be extended over the plugin's defaults.

    不要为你的插件函数定义过多的参数，而是通过传递一个可被扩展到插件默认值的对象字面量来传递参数。

5.  Don't clutter the jQuery.fn object with more than one namespace per plugin.

    保证每个插件中只有一个 `jQuery.fn` 对象的命名空间

6.  Always namespace your methods, events and data.

    总是为自己的方法、事件和数据设置命名空间。

##<div id='t8'>Translations</div>

If you have translated this article or have some similar one on your blog post a link here. Please mark Full Translated articles with (t) and similar ones with (s).
