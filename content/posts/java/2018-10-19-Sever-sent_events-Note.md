---
title: Sever-sent events note
date: 2018-10-19
description: 利用Sever-sent events（SSE)实现web服务器向浏览器推送消息,主要侧重使用Java代码展示服务器端代码的实现.
categories: "java"
tags: ["java", "javascript"]
---

{{< github repo="oxcow/ServerSentEventsDemo" >}}

在W3C上查询相关JS和CSS时，偶尔发现的一个前端技术点，随手demo and backup下。

Sever-send events 简单来说就是服务器推送消息到浏览器。

## Main

**特点:**

+ 浏览器和服务器通过HTTP建立长链接(keep-alive)
+ 链接后，服务器可推送消息给浏览器，而不需要重新再次建立HTTP链接
+ 单向通讯(服务器 -> 浏览器)
+ 支持事件分类(*event*)
+ 服务器端指定浏览器链接失败或异常时的重试时间(*retry*)

**限定:**

+ 服务器发送请求头`Content-Type`值为*text/event-stream*
+ 消息内容只支持字符，字符需用*UTF-8*编码

**可能的使用场景:**

1. 实时图表（股票实时K线图）
2. 消息推送（消息广播等）
3. 服务器状态监控（内存监控、负载监控等）

## 客户端（浏览器）

客户代码使用JS实现。比较简单，主要有一下几个方法。

**`EventSoure`对象**

> var evtSource = new EventSource(url);
    
创建后，可通过只读属性 *readyState* 获取当前链接状态。

*readyState* 取值:

+ EventSource.CONNECTING(0): 连接中

+ EventSource.OPEN(1): 连接已经建立，可以接收数据。

+ EventSource.CLOSED(2): 连接已断，且不会重连。

**`onopen`事件**

浏览器和服务器建立链接后触发.

    evtSource.onopen = function (event) {}

**`onerror`事件**

服务器端链接异常或超时触发

    evtSource.onerror = function (event) {}

**接收消息(事件监听)**

    evtSource.addEventListener(event_name, function(event){})

如果消息体未指定 *event* 属性，那么可以通过
    
    evtSource.onmessage = function (event) {}

获取消息。`onmessage` 等价于

    evtSource.addEventListener('message', function(event){})
    
同样的，`onopen`,`onerror`都可通过`addEventListener`替换。

> 特别的对于 `addEventListener`的回调函数，返回值将会被默认存放在 *event* 这个变量中，因此下列的代码将输出**true**

    evtSource.addEventListener('message', function(e){
        console.log(e == event);
    })

**浏览器主动关闭连接**

    evtSource.close();
    
### 客户端代码示例

```Javascript
if (typeof(EventSource) !== "undefined") {
    var evtSource = new EventSource("/html5/sse/quick_start_easy");
    evtSource.onopen = function (event) {
        console.log("readyState: ", this.readyState, event);
    }
    evtSource.onmessage = function (event) {
        console.log("readyState: ", this.readyState, event.data);
    }
    evtSource.onerror = function (event) {
        console.log("readyState: ", this.readyState, this, event);
    }
} else {
    console.warn('Sorry! No server-sent events support.');
}
```
    
## 服务器端    

### 数据格式

其实就是一段字符串，称为 **Message** 吧。

> 每次可以发送多条 **Message**, 每条 **Message** 以空白行结尾(\n\n)

每条 **Message** 的包含以下几个属性:

+ id属性，标记当前 **Message** 。客户端可通过 *lastEventId* 获取该值。当客户端重连时，会将该值存放在HTTP头信息的 *Last-Event-ID* 发送到服务端。

+ event属性。事件类型，默认值为*message*,可通过 `onmessage` 获取。当自定义时，需要通过 `addEventListener` 来设置监听回调

+ data属性。要发送的消息正文，可以有多个，每个data一行（使用\n分割）

+ retry属性。当连接异常时，指定客户端再次连接服务时的重试时间间隔。单位毫秒。*根据测试默认情况下该值被默认为3s*

> 1. 每条消息中只有*data*属性是必须的.
> 2. **特别的，可以只发不带属性只有冒号起始的消息，理解为注释（保持连接）。**

**Message Example**

>    id:1
>    event:demoEvent1
>    data:first line
>    date:second line
>    retry:1000
>    
>    id:2
>    event:demoEvent2
>    data:this is a demo data
>    

**Java Code**

```Java
StringBuilder message = new StringBuilder();

// first message
message.append("id:").append(1).append("\n");
message.append("event:").append("demoEvent1").append("\n");
message.append("data:").append("first line").append("\n");
message.append("data:").append("second line").append("\n");
message.append("retry:").append(1000).append("\n");
message.append("\n\n");

// second message
message.append("id:").append(2).append("\n");
message.append("event:").append("demoEvent2").append("\n");
message.append("data:").append("this is a demo data").append("\n");
message.append("\n\n");
```  
### Java实现

基于SpringMVC实现服务器端代码.

一段比较直观的服务器端代码：

```Java
@Controller
@RequestMapping("/html5/sse")
public class QuickStartController {
    @RequestMapping("/quick_start")
    public void quickStart(HttpServletRequest req, HttpServletResponse res) throws IOException {
        // Required! set response header and encoding
        res.setContentType("text/event-stream");
        res.setCharacterEncoding("UTF-8");
        PrintWriter writer = res.getWriter();
        // push data
        for (int i = 0; i < 5; i++) {
            writer.write("data:" + i + ", hello for server send event！" + LocalDateTime.now() + "\n\n");
            writer.flush();
            ThreadUtils.sleep(SLEEP_TIME_MILLISECONDS);
        }
        writer.close();
    }
}
```

利用SprigMVC的`SseEmitter`实现服务端

```Java
@RequestMapping("/quick_start_easy")
public SseEmitter quickStartEasy() {
    final SseEmitter sseEmitter = new SseEmitter();
    ExecutorService worker = Executors.newSingleThreadExecutor();
    worker.execute(() -> {
        try {
            for (int i = 1; i < 6; i++) {
                sseEmitter.send(i + ", hello for server send event!" + LocalDateTime.now(), MediaType.TEXT_PLAIN);
                ThreadUtils.sleep(SLEEP_TIME_MILLISECONDS);
            }
            sseEmitter.complete();
        } catch (IOException e) {
            sseEmitter.completeWithError(e);
        }
    });
    return sseEmitter;
}
```

## 代码演示

[>>GitHub地址](https://github.com/oxcow/ServerSendEventsDemo)

## Reference

https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

http://html5doctor.com/server-sent-events/

http://www.ruanyifeng.com/blog/2017/05/server-sent_events.html

https://www.logicbig.com/tutorials/spring-framework/spring-web-mvc/sse-emitter.html
