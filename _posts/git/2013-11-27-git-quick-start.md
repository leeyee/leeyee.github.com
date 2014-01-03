---
layout: post
title: git快速入门
description: 本文分场景演示如何快速上手git，使你能快速的掌握git的基本用法，如需更深入的了解，请直接查阅官方文档。
category: git
tag: [git]
keywords: [git quick start, git快速入门]
---

##约定##
1. 这只是一个简单的快速入门，如果您已经精通，请绕行;
2. 这里我们不会讲GIT、SVN、VSS及CVS的区别。如有需要，请[Google];
3. 这里不具体讲解GIT COMMAND的具体含义。如有需要，请git help;
4. 这里不讲解GIT如何在windows及Linux下的配置。如有需要，请在[http://github.com]上寻找

我们这里模拟几种场景，以便您快速上手.

###场景一：【本地建立GIT版本管理并添加文件】###

####step-1、创建项目根目录

    $ mkdir gitProject

####step-2、进入目录并初始版本管理

    $ cd gitProject
    $ git init

`git init`后，将在 gitProject目录下生成 .git隐藏文件。可使用 `ls -a` 进行查看

####step-3、添加文件到目录gitProject

    $ touch HelloWorld.java

####step-4、查看当前版本仓库状态

    $ git status     # 这里应该会显示HelloWorld.java为untracked files,也就是尚未进行版本管理

####step-5、将HelloWorld.java添加到版本管理中

    $ git add HelloWorld.java

####step-6、再次查看版本仓库状态

    $ git status     # 此时将会显示HelloWorld为一个new file，需要提交到版本库中

####step-7、提交HelloWorld.java到版本库

    $ git commit HelloWorld.java

####step-8、为HelloWorld.java添加内容

    $ vi HelloWorld.java

####step-9、查看当前HelloWorld.java文件与提交的版本库中的差异

    $ git diff

####step-10、提交修改后的HelloWorld.java到版本库

    $ git commit -m 'init import' HelloWorld.java

####step-11、查看操作日志

    $ git log

*补充知识*：

1.  在 step-5 时，如何对使用了[git add]的文件反操作呢？

    你可以使用命令 `git rm --cached HelloWorld.java` 这样就可以将已经在版本管理中的文件解除版本控制了。
    你也可以使用 `git reset HEAD HelloWorld.java` 解除版本控制，但使用 `git reset` 命令时，目标文件应没有使用过 `git commit`，否则该命令将不起作用;

2.  在 step-5、step-8 时，如何批量添加和提交？

    你可以使用命令 `git add *.java` 使用通配符添加。或者 `git add .`添加当前目录下的所有文件。
    `git add .`等价于 `git add *`。对于 `git commit` 同样可以使用通配看符添加。同时 `git commit` 只会操作那些使用过 `git add` 的文件;

3.  在 step-9 时，当你修改了文件但没有使用 `git commit` 时，你想取消当前修改到最近一次提交？

    你可以使用以下命令`git checkout -- HelloWorld.java`;

4.  在 step-10 时，当 `git commit -m <msg>` 后，如果修改提交时的内容？比如修改 'init import'为 '初始提交'?

    你可以使用命令 `git commit --amend` 或者使用 `git reset --soft HEAD`，其中：

    1.  HEAD: 为当前提交版本
    2.  HEAD^:为HEAD的父亲版本；
    3.  HEAD~2: 为HEAD的父亲的父亲版本 ....

    `git commit -m '初始提交' HelloWorld.java`


###场景二：【建立分支并合并分支】

####step-1、使用场景一的命令创建Git项目 gitPro ，并添加文件 HelloGit.java 文件。

    HelloGit.java文件内容如下：
    public class HelloGit{
        public static void main(String []args){
            System.out.println("Say Hello Git from master branch");
        }
    }

####step-2、查看当前分支列表

    $ git branch  # git init 后默认的分支名为master.因此如果没有建立过分支，那么使用[git branch]将显示分支master

####step-3、创建develop分支，并且切换到develop分支

    $ git branch develop
    $ git checkout develop
    # 以上两句命令可用 [ $ git checkout -b develop]替代
    # 如果需要删除分支可用 [ $ git branch -d develop]

####step-4、修改 HelloGit.java 并添加 readme文件。

    $ vi HelloGit.java
    $ touch readme
    $ git add readme
    $ vi readme

修改后HelloGit.java的内容如下：

    public class HelloGit{
        public void developSayHello(){
            System.out.println("Say Hello Git from develop branch");
        }
        public static void main(String []args){
            HelloGit hg = new HelloGit();
            hg.developSayHello();
        }
    }

readme文件内容如下：

    this readme file is created by develop

####step-5、查看HelloWorld.java、readme文件的状态并提交

    $ git status
    $ git commit HelloWorld.java

####step-6、切换到 master 分支

    $ git checkout master

####step-7、查看 master 分支和 develop 分支的不同，并合并

    $ git diff master develop
    $ git merge --no-ff develop  # 可以使用 [ $ git reset --hard ORIG_HEAD] 取消合并

####step-8、处理冲突文件 HelloGit.java

    $ vi HelloGit.java

修改后的文件内容如下：

    public class HelloGit{
        public void developSayHello(){
            System.out.println("Say Hello Git from develop branch");
        }
        public static void main(String []args){
            System.out.println("Say Hello Git from master branch");
            HelloGit hg = new HelloGit();
            hg.developSayHello();
        }
    }

    $ git add HelloGit.java

如有多个冲突文件，重复以上命令即可。最后提交合并后的文件

    $ git commit

####step-9、取消合并，返回到最后一次提交时的版本

    $ git reset --hard ORIG_HEAD  # 可查看帮助手册了解 --hard|--soft|--mixed 当前区别


###场景三：【连接远程服务器】

####准备工作：

1.  申请GitHub账户并登录
2.  配置相关KEY。具体可查看GitHub官方说明
3.  新建Repositories，名为Test-Git

####step-1、连接到远程服务器GIT空间

    $ git remote add origin git@github.com:oxcow/Test-Git.git  # 实际使用中请使用自己的地址

####step-2、推送本地版本信息至服务器

    $ git push -u origin master     # 如果本地还有分支需要存放到服务器，那么可继续执行该命令

####step-3、修改本地文件，提交并推送到服务器

    $ vi HelloWorld.java     # 编辑一些内容...
    $ git commit -m 'add some contentext' HelloWorld.java
    $ git push origin master     # 更新本地修改后的文件到服务器

####step-4、从服务器获取文件

首先我们在github.com/Test-Git上修改我们前面上传的文件HelloWorld.java并提交。本地获取可用以下命令

    $ git pull origin master     # [git pull]命令将会直接用服务器上的版本覆盖本地版本，请慎用

或者使用

    $ git fetch --all     # 获取服务器文件到本地，但不覆盖本地文件
    $ git meger     origin/master     # 合并服务器主干到本地分支

###场景四：【创建删除发布版本并推送至服务器】

####step-1、查看当前发布版本

    $ git tag

####step-2、创建新的发布版本在本地仓库

    $ git tag v1.0beta

####step-3、推送 v1.0beta 至服务器

    $ git push -u origin v1.0.beta     #推送成功后可在github的tag标签出看到打包后的文件。有两种格式,zip和tar

####step-4、删除本地仓库发布版本

    $ git tag -d v1.0beta

####step-5、删除远程服务器发布版本

    $ git push origin v1.0beta --delete

###场景五：【还原已经删除的文件】

####step-1、查看当前删除的文件

    $ git ls-files -d

####step-2、恢复被删除的文件（单个恢复）

    $ git checkout <filename>

####step-2-1、全部恢复

    $ git ls-files -d | xargs git checkout


[http://github.com]: http://github.com "GitHub 主页"
[Google]:  http://google.com  "谷歌"