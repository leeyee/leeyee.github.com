---
title: windows下Git命令组的实现
date: 2015-08-11
description: windows环境下配置常用git命令组合
categories: "git"
tag: ["git"]
---

使用git进行项目版本管理时，在实际的操作中经常会有使用多个命令完成一个操作的情况出现，比如常见的代码远程更新操作可能就包含以下几个步骤：

1. 保存当前工作区。[`git stash`][1]
2. 拉取远程分支代码到本地。[`git pull --rebase`][2]
3. 恢复当前工作区。`git stash pop`

那么有没有办法可以使用一个自定义命令一次完成上述三个命令的执行？

其实要完成上述命令组很简单，我们只要完成一个包含这几条命令的脚本文件即可。linux环境下我们可以直接自定一个shell脚本，比如下面的形式：

```shell
#!/bin/sh

git stash
git pull --rebase
git stash pop
```

同样，针对windows系统，处理方式是相同，只不过是完成bat脚本。当然了，一般开发过程中使用的都是[Git-preview],为了可以直接在这个工具下使用自定义命令组，可以进行如下配置：

1. 首先新建一个没有后缀的文件，这里我们叫 *mypull*，内容如下：

        #!/bin/sh
        # Copyright (C) 2015, leeyee
        # mailto:seadlead@gmail.com
        # 实现以下命令组
        # git stash
        # git pull --rebase
        # git stash pop
        # File: mypull
        echo '---- excute git stash ----'
        git stash

        echo '---- excute git pull --rebase ----'
        git pull --rebase

        echo '---- git stash pop ----'
        git stash pop


2. 将该文件放到[Git-preview]安装路径下的 *bin* 目录中即可。

3. 此时就可以直接在 git bash 使用命令 `mypull` 了


[Git-preview]:https://msysgit.github.io/
[1]:http://git-scm.com/book/zh/v1/Git-%E5%B7%A5%E5%85%B7-%E5%82%A8%E8%97%8F%EF%BC%88Stashing%EF%BC%89
[2]:http://git-scm.com/docs/git-pull