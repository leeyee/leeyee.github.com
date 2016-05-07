---
layout: post
title: Linux Shell Crontab 的坑
description: 本文介绍Linux crontab下使用atnodes及mail遇到的一些问题
category: 其他
tag: [linux]
---

写了个简单的日志统计并发送邮件的脚本，使用到了`atnodes` 和 `mail` 命令。同时托管给 *crontab* 定时调用执行。手动测试的时候运行的很是完美，只可惜，自动化后就各种坑：

1. `atnodes` 无法使用！脚本抛出：_Permission denied, please try again_

2. `mail` 中文乱码！

最后这样处理了：

1. 针对 *atnodes* 的问题，最终的解决方案是：**只能手动执行**。原因很简单： 

    > 公司的开发机登录使用RSA动态口令，因此托管给 *Crontab*时，每进行一个机器的查询时都需要有登录动作。


2. 针对 *mail* 中文乱码的问题，最终的解决方案是：**使用 *Python* 脚本发送邮件**。 因为使用 *mail* 命令最后都没解决 subject 乱码的问题，虽然解决了邮件内容乱码。

    > **基本上白干了，自动化就不用想了，只能每天苦逼的手动执行脚本给运营了 !**

## Crontab [^comment1]

*atnodes* 用起来的确很方便，不需要登陆到每一台目标机器就可以使用命令对其进行操作了。这对一个应用部署了很多应用服务器的集群环境来说是方便的。但问题是执行用户对目标机器有登陆可以免密，因此针对公司这种使用RSA动态密码的环境来说，使用 *crontab* 来执行你的脚本就不太现实了！就会导致上面的报错：权限不足。

当然发现这个问题也费劲了，原因是直接在 *crontab* 中配置了将脚本运行的输出指向了 */dev/null*， 这直接导致异常信息被吞噬了；同时 *crontab* 中的MAILTO有没有配置，也触使没有收到 *Crontab* 发出的脚本执行异常邮件。所以对于 *Crontab* 的配置试时需要注意一下几点：

1. 配置 MAILTO 到你的邮箱。比如:

		MAILTO=seadead@gmail.com

2. 设置 *Crontab* 时将其输出指向一个存在的目录，当期调试运行的没有问题后在配置到 */dev/null*

## mail

*mail* 命令是很坑人的。手动执行该命令，一切都是那么完美，可当在 *Crontab* 中时，表现的情况完全是另一个样。当 *Crontab* 执行 *mail* 命令

	cat mail.txt | mail -s "测试邮件" seadlead@gmail.com

直接会乱码掉！查了下，网上说可以这样写 [^comment]：

	cat mail.txt | "=?UTF-8?B?`echo 测试邮件 | base64`?=" seadlead@gmail.com

这样写的结果就是邮件正文不乱码了，但标题依旧乱码！如此这般的折腾了好久都没解决，最后只能使用 *Python* 发送邮件了

后来也就不想弄，因为花了太多时间在这个标题乱码上。网上搜索的各种办法都试过了就是不行。最后怀疑是不是操作系统问题，哪里没有设置对导致的，因为用上述方法发送有邮件时，邮件正文中会出现邮件头信息，会提示说当前编码是 **8bit !**（这是什么鬼！）

最后还是觉得：Linux的相关知识太欠缺，对于这个系统了解还是不够深。后续还得多关注下这块。


[^comment1]: 关于*Contab*的配置可以参考： [crontab 定时任务](http://linuxtools-rst.readthedocs.org/zh_CN/latest/tool/crontab.html)	这篇博客

[^comment]:  没有找到[Linux send邮件中文乱码(转)](http://jimingsong.iteye.com/blog/1539446) 的原始链接地址，先这样引用吧，后续如果找到会改到原作者的地址上去
