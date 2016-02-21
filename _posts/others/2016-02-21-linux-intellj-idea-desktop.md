---
layout: post
title: Ubuntu14下配置Intellj IDEA快捷方式
description: 本文介绍Intellj IDEA在Ubuntu14下配置桌面快捷时需要主要的一些问题
category: 其他
tag: [linux]
keywords: [linux idea, ubuntu idea, ubuntu idea desktop, idea desktop]
---

* TOC
{:toc}


下面是一些在Ubuntu14下安装Intellj IDEA后配置桌面快捷方式时一些坑，记录下。

## JDK环境变量的问题

ubuntu中，我们将环境变量配置在etc/profile 或者当前登陆用户的.bashrc/.bash_profile文件中。因此其对应的使用范围也是不同的。

etc/profile 针对所有登录用户，因此为省事期间，可以将JDK配置在这里，一劳永逸，也就不会出现后续问题。

但是如果要区分用用户，那么最好还算将其配置在需要的用户.bashrc/.bash_profile目录下。（.bash_profile文件不已经有！比如我使用的ubuntu14.0.4）

JDK环境变量：

    export IDEA_JDK=/usr/java/jdk1.8.0_73
    export JAVA_HOME=/usr/java/jdk1.8.0_73
    export PATH=$JAVA_HOME/bin:$IDEA_JDK/bin:$PATH
    export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

### JDK环境变量在 etc/profile

idea.desktop文件内容如下[^comment]：

    [Desktop Entry]
    Version=1.0
    Type=Application
    Name=IntelliJ IDEA
    Icon=/home/leeyee/develop/idea-IU-14.0.4/bin/idea.png  # 实际安装路径
    Exec="/home/leeyee/develop/idea-IU-14.0.4/bin/idea.sh" %f # 实际启动脚本
    Comment=Develop with pleasure!
    Categories=Development;IDE;
    Terminal=false
    StartupWMClass=jetbrains-idea

此时直接点击对应的图标即可启动。

### JDK环境变量在当前用户的.bashrc或者.bash_profile下

此时的idea.desktop中的Exec就需要将JDK的路径配置进去，否则双击启动时无法找到JDK，导致启动失败

idea.desktop文件内容如下：

    #!/usr/bin/env xdg-open
    [Desktop Entry]
    Version=1.0
    Type=Application
    Name=IntelliJ IDEA
    Icon=/home/leeyee/develop/idea-IU-14.0.4/bin/idea.png
    Exec=env JAVA_HOME=/usr/java/jdk1.8.0_73 "/home/leeyee/develop/idea-IU-14.0.4/bin/idea.sh" %f # 这里多了指定JAVA_HOME
    Comment=Develop with pleasure!
    Categories=Development;IDE;
    Terminal=false
    StartupWMClass=jetbrains-idea


[^comment]: Intellj IDEA安装完成后使用idea.sh初次启动时，会在交互页面中提示是否需要生成快捷方式到usr/share/applications。该段内容即为其自动生成的。