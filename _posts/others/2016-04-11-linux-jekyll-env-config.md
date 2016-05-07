---
layout: post
title:  Linux下的Jekyll开发环境配置
description: 在linux Ubuntu14下配置github静态网站开发环境Jekyll
category: 其他
tag: [linux]
---

* [TOC]
{:toc}

博客文章一直是托管在github上的，对于站点的开发也是基于jekyll进行的，不过之前是通过在Window系统上安装Ruby进行的。最近将操作系统切换到了linux，因此需要在linux下配置jekyll环境。说实在的真没有在Windows上点击exe程序进行安装那么舒服，安装过程中遇到了不少问题。不过还好，最后都一一解决了。

## Ruby安装 [^ruby]

Jekyll是基于[Ruby]的，因此在安装前需要先安装Ruby。然后通过 `gem` 进行jekyll安装。

可以通过软件管理中心或者`apt-get`命令直接安装[Ruby]，不过就算安装成功也无法使用最新的jekyll3，因为最新的jekyll3要求[Ruby]的版本必须在2.0以上。通过

> sudo apt-get install ruby-full

进行安装时，[Ruby]的版本目前只支持到1.9。所以针对[Ruby]的安装，需要下载源文件进行本地编译安装，或者通过[RVM]管理工具进行安装。

### Ruby源文件编译安装

可以在 [这里](https://www.ruby-lang.org/en/downloads/) 下载到最新版本。现在完成后以此如下操作即可完成安装：

> $ tar -zxvf ruby-2.3.0.tar.gz
	$ cd ruby-2.3.0
	$ ./configure
	$ make
	$ sudo make install

上述命令执行完成后，如果没有出现异常信息，那么运行：

> $ ruby -v

就应该可以看到当前安装的ruby版本信息。

使用源码虽然可以安装，但是如果需要安装多个不同版本的[Ruby]时，就会引起问题。因此[Ruby]官方是推荐使用[RVM]来管理[Ruby]版本。同时，安装完成[RVM]后也能方便安装 [Rails]

**Tips:** 	ubuntu14.0 安装过程如果出现包依赖错误，或者一些依赖无法升级的问题，需要先进入“系统设置”->“软件更新”对系统重要模块进行更新。作者之前就是因为禁止更新，导致在这里花费了很多时间解决无法安装依赖的问题。

### 通过RVM管理工具安装Ruby

#### RVM管理工具安装 [^rvm]

[RVM]的安装直接照着官方安装说明，依次执行以下命令即可：

>   #设置安全秘钥
	$ gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
	# 安装 rvm
	$ \curl -sSL https://get.rvm.io | bash
	# 安装 ruby
	$ \curl -sSL https://get.rvm.io | bash -s stable --ruby
	# 载入 RVM 环境
	$ source ~/.rvm/scripts/rvm

到这里，[RVM]安装完成。可用通过`rvm -v` 查看当前 `rvm` 的版本信息。

#### Ruby安装 [^rvm-ruby]

接着通过[RVM]工具安装[Ruby]：
		
>   # 检测rvm依赖
	$ rvm requirements
	# 安装 ruby
	$ rvm install 2.3.0
	# 设置默认ruby版本

#### RVM is not Function 解决 [^rvm-is-not-function]

上述步骤做完后如果在当前的终端输入`gem -v` 或者 `ruby -v` 时是没有问题的。但如果关闭了终端，重新开启一个新的终端时，有可能会提示

> 程序 'gem' 已包含在下列软件包中：
 * ruby
 * rubygems
请尝试：sudo apt-get install <选定的软件包>

其实`gem`，`ruby` 是已经安装过了的。出现这种情况时需要将 .profile 中的

> [[ -s "\$HOME/.rvm/scripts/rvm" ]] && source "\$HOME/.rvm/scripts/rvm" # Load RVM into a shell session *as a function*

拷贝到 .bashrc 中

## jekyll安装

上述[Ruby]环境配置完成后即可进行[jekyll]的安装[^jekyll-config]：

> $ gem install jekyll
    
jekyll3支持feed、sitemap、seo的自动生成[^jekyll-comment]，不过在使用这些功能前需要先进行安装

> $ gem install jekyll-mentions
    $ gem install jekyll-sitemap
    $ gem install jekyll-feed
    $ gem install jekyll-seo-tag
    $ gem install jekyll-paginate
    
安装完成后，可以在_config.yml文件中进行配置：

> gems:
  - jekyll-mentions
  - jekyll-sitemap
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-paginate
  
  
当然，只有这样的配置还不足以生成相应的文件，还需要进行一下配置。

### RSS配置

参考：[https://github.com/jekyll/jekyll-feed](https://github.com/jekyll/jekyll-feed)

### 站点地图配置

参考：[https://github.com/jekyll/jekyll-sitemap](https://github.com/jekyll/jekyll-sitemap)

### 搜索配置(SEO)

参考：[https://github.com/jekyll/jekyll-seo-tag](https://github.com/jekyll/jekyll-seo-tag) 

其实配置很简单，只要post中存在title、discription即可，然后在default模板中</head>前添加

> {\% seo \%}

即可。

### jekyll安装中可能遇到的问题

使用`gem` 命令安装jekyll是有可能会出现如下找不到安装地址的问题

> Error fetching https://ruby.taobao.org/:
          SSL_connect returned=1 errno=0 state=SSLv3 read server certificate B: ce
  rtificate verify failed (https://rubygems-china.oss-cn-hangzhou.aliyuncs.com/spe
  cs.4.8.gz)

遇到这种情况只需要将`gem`中的连接地址换掉就可以了
    
>   # 查看当前连接地址
    $ gem source -l
    # 移除无效地址
    $ gem source --remove https://rubygems.org/
    # 添加新的地址
    $ gem source -a http://rubygems.org/

[^ruby]: 可参考 https://www.ruby-lang.org/zh_cn/documentation/installation/
[^rvm]: 可参考 https://rvm.io/rvm/install
[^rvm-ruby]:  可参考 https://ruby-china.org/wiki/install_ruby_guide
[^rvm-is-not-function]: 可参考 https://ruby-china.org/topics/3705
[^jekyll-config]: 可参考 https://jekyllrb.com/docs/quickstart/
[^jekyll-comment]: 之前使用的是2.0版本的，sitemap/feed都是通过第三方插件的方式生成的；当前最新的版本自带这些功能。
[^jekyll pit]: 可参考 https://tonypepelu.github.io/archivers/how-to-use-jekyll-with-easybook-to-create-blog

[Ruby]: https://www.ruby-lang.org/zh_cn/ "ruby"
[Rails]: http://rubyonrails.org/ "rails"
[RVM]: https://rvm.io/ "rvm"
[Jekyll]: http://jekyllcn.com/ "jekyll"