---
layout: post
title: 屏蔽window.close方法在IE中的二次确认
description: 在实际的开发过程中遇到当调用javascript中window.close方法时，IE7+会在页面关闭前询问用户是否要关闭的二次确认对话框。为了避免这个问题，需要在调用window对象的close方法前做一些处理
category: javascript
tag: [javascript]
---

* any list
{:toc}

在实际的开发过程中遇到当调用javascript中`window.close()`方法时，IE会在页面关闭前询问用户是否要关闭的二次确认对话框。为了避免这个问题，需要在调用`window`对象的`close`方法前做一些处理

针对IE的不同版本，处理方式是不同的。因此在处理之前应先判断IE浏览器的版本。

浏览器及其版本的判断可以使用jQuery1.9版本之前的[$.browser](http://api.jquery.com/jQuery.browser/)方法或者[使用javascript检测浏览器版本](/blog/2009/08/24/javacript-broswer-check/)中提到的方式检测，这里不在赘述直接给出相关代码。

### IE7及其以上版本

    if(isMinIE7||isMinIE8){ // IE7以上  
        window.open('','_top');  
        window.top.close();  
        return ;  
    }  
    
### IE6及其以下版本

    if(isMinIE6){//IE6   
        window.opener=null;  
        window.close();  
        return ;  
    }  

### Chrome,Safari和Firefox

     window.close(); 
     
<div class="alert alert-error">
<h4>Notes: </h4> 针对FireFox浏览器时，除了使用<code>window.close()</code>，为了达到直接关节而无需提示的效果都需要在FireFox的地址栏中输入<code>about:config</code>，然后将<code>dom.allow_script_to_close_windows</code>改为true才能达到想要的效果。
</div>
