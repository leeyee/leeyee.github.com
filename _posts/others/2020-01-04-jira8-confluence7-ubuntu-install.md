---
layout: post
title:  JIRA8 Confluence7 Ubuntu安装
description: 在Ubuntu下配置并破解Jira8, Confluence7
category: other
tag: [linux]
---

* [TOC]
{:toc}

## JIRA8.0.2 Ubuntu 安装

###  Required

- openjdk-11-jre-headless
- MySQL5.7
- [mysql-connector-java5.1.48](https://cdn.mysql.com//Downloads/Connector-J/mysql-connector-java-5.1.48.tar.gz)
- [atlassian-jira-software-8.0.2-x64.bin](https://product-downloads.atlassian.com/software/jira/downloads/atlassian-jira-software-8.0.2-x64.bin)
- 破解文件[^brokenrefer] [atlassian-extras-3.2.jar](https://pan.baidu.com/s/1XxMKwDklYw4jsYJRP87bQw) (提取码:faxb)
    

### Prepare Knowledge

#### 登录远程服务器
    
    ssh username@ip
    
#### scp 命令[^scp]

scp命令用来上传或者下载文件

    # 从本地上传文件到目标服务器
    scp /usr/a/a.txt user_name@ip:/usr/b
    
    # 从目标服务器下载文件到本地
    scp user_name@ip:/usr/b/a.txt /usr/a/
    
如果需要上传或下载整个目录使用

    scp -r
    
### 创建Linux用户组及用户

	# create group
	groupadd jira

	# create user
	# -d 用户主目录,如果不存在使用 -m 添加
	# -s 用户使用登录shell。
	# -g 用户组
	useradd -d /usr/jira -m jira -s /bin/bash -g jira

	# update password
	passwd jira

	# show user info
	cat /etc/passwd

### 上传本地文件到服务器

==**Notes:** 以下只是示例，请使用自己文件路径和服务器地址==

	scp /Users/mac/Desktop/test.txt root@192.168.0.0:/usr/jira

	scp /Users/test/Downloads/atlassian-extras-3.2.jar  jira@192.168.0.0:/usr/jira

	scp /Users/test/Downloads/atlassian-jira-software-8.0.2-x64.bin jira@192.168.0.0:/usr/jira

	scp /Users/test/Downloads/mysql-connector-java-5.1.48.tar.gz jira@192.168.0.0:/usr/jira

### 安装OpenJDK

sudo apt install openjdk-11-jre-headless

#### apt 卸载安装包

如需卸载通过apt安装的包，可参考[这里](https://blog.csdn.net/get_set/article/details/51276609
)

### 安装MySQL

    sudo apt-get update
    sudo apt-get install mysql-server (在线安装)

部分安装输出信息

    update-alternatives: using /etc/mysql/mysql.cnf to provide /etc/mysql/my.cnf (my.cnf) in auto mode
    Renaming removed key_buffer and myisam-recover options (if present)
    Created symlink /etc/systemd/system/multi-user.target.wants/mysql.service → /lib/systemd/system/mysql.service.

#### 开启MySQL

    # 查看Mysql Version
    mysql -V
    
    sudo /etc/init.d/mysql start
    sudo /etc/init.d/mysql stop
    sudo /etc/init.d/mysql restart
    
    # 查看MySQL run status
    sudo /etc/init.d/mysql status

#### 修改root密码[^MysqlRootPw]

Ubuntu apt安装完Mysql后，root 有默认密码，可看查看文件

	sudo cat /etc/mysql/debian.cnf
	
获取，然后用这里的用户名密码登录.

    mysql -u debian-sys-maint -p

进入Mysql终端后进行如执行以下SQL:

    USE mysql
    
    SELECT User, Host, plugin FROM mysql.user;
    
    -- 修改root用户密码校验方式。
    UPDATE user SET plugin='mysql_native_password' WHERE User='root';

    -- 修改root密码
	ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
    -- 或者
	UPDATE mysql.user SET authentication_string=PASSWORD('new_password') where user='root';


#### 创建jira数据库

参考[官方文档](https://confluence.atlassian.com/pages/viewpage.action?pageId=933888039)

    -- 创建数据库
	CREATE DATABASE jiradb CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;

    -- 创建数据库用户(可忽略。直接使用GRANT)
	CREATE USER 'jira'@'localhost' IDENTIFIED BY 'new_password';

    -- 授权
	GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP,REFERENCES,ALTER,INDEX on jiradb.* TO 'jira_prod'@'localhost' IDENTIFIED BY 'new_password';

	flush privileges;

    -- 检查权限
	SHOW GRANTS FOR jira_prod@localhost;

#### 为JIRA配置MySQL

参考[官方文档](https://confluence.atlassian.com/adminjiraserver080/connecting-jira-applications-to-mysql-5-7-967896918.html)

update my.cnf

	sudo vi /ect/mysql/mysql.cnf 

添加

	[mysqld]

	default-storage-engine=INNODB
	character_set_server=utf8mb4
	innodb_default_row_format=DYNAMIC
	innodb_large_prefix=ON
	innodb_file_format=Barracuda
	innodb_log_file_size=2G

重启数据库服务器

	sudo /etc/init.d/mysql restart

登录数据库查看

	show engines;

### 安装jira

	chmod a+x atlassian-jira-software-8.0.2-x64.bin
	sudo ./atlassian-jira-software-8.0.2-x64.bin

~~==**注意**，安装过程中***不要选择***安装完成后立即启动==~~

    Where should JIRA Software be installed?
    [/opt/atlassian/jira]
    
    Default location for JIRA Software data
    [/var/atlassian/application-data/jira]
    
    Use default ports (HTTP: 8080, Control: 8005)
    
    Details on where JIRA Software will be installed and the settings that will be used.
    Installation Directory: /opt/atlassian/jira 
    Home Directory: /var/atlassian/application-data/jira 
    HTTP Port: 8080 
    RMI Port: 8005 
    Install as service: Yes 

#### 复制MySQL JDBC 驱动程序到应用服务器

参考[官方文档](https://confluence.atlassian.com/pages/viewpage.action?pageId=933888039)

    # 解压文件
	tar -zxvf mysql-connector-java-5.1.48.tar.gz

拷贝 mysql-connector-java-5.1.48-bin.jar 到 jira安装目录

	sudo cp mysql-connector-java-5.1.48-bin.jar /opt/atlassian/jira/lib/

#### 延长JIRA试用期限(破解)

**覆盖源文件前建议先备份原文件**
    
    sudo mv atlassian-extras-3.2.jar atlassian-extras-3.2.jar-bak20200102

复制破解文件到指定目录

    sudo cp ~/atlassian-extras-3.2.jar /opt/atlassian/jira/atlassian-jira/WEB-INF/lib/

#### 启动JIRA

所有的JIRA操作命令都在安装目录/bin下

	# start
	sudo /opt/atlassian/jira/bin/startup.sh

	# stop
	sudo /opt/atlassian/jira/bin/stop-jira.sh

### 配置JIRA 

拿到 JIRA Service ID 后去官网申请试用版本，并生成Lience即可。

### Some Issues

> Q: xxx is not in the sudoers file

当前用户无权试用sudo命令。解决方案参看[这里](https://blog.csdn.net/wenlifu71022/article/details/5219115)

    # 添加文件的写权限
    chmod u+w /etc/sudoers
    
    # 添加 user_name ALL=(ALL) ALL. 可参看root配置
    vim /etc/sudoers
    
    # 撤销文件的写权限
    chmod u-w /etc/sudoers

> Q： sudo: unable to resolve host host_name 

无法找到host。解决方案
    
    # add host_name
    vi /etc/hosts
    
> ::1     localhost <host_name>



## Conflunce7.1.2 安装

[参考博客1](https://www.cnblogs.com/kevingrace/p/7607442.html)

[参考博客2](https://www.jianshu.com/p/2f2142ce01b7)

[atlassian-confluence-7.1.2](https://product-downloads.atlassian.com/software/confluence/downloads/atlassian-confluence-7.1.2-x64.bin)

[Installation Guide](https://confluence.atlassian.com/doc/confluence-installation-and-upgrade-guide-214864161.html)

### MySQL

==注意Confluence要求数据库字符集是utf8==

    CREATE DATABASE testdb CHARACTER SET utf8 COLLATE utf8_bin;
    GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP,REFERENCES,ALTER,INDEX on testdb.* TO 'user_name'@'localhost' IDENTIFIED BY 'password';
    flush privileges;

### 安装

    chmod a+x atlassian-confluence-7.1.2-x64.bin
    sudo ./atlassian-confluence-7.1.2-x64.bin
    
#### 安装信息

    /opt/atlassian/confluence
    /var/atlassian/application-data/confluence
    Use default ports (HTTP: 8090, Control: 8000)

#### 启动or关闭

    sudo /etc/init.d/confluence start
    sudo /etc/init.d/confluence stop
    sudo /etc/init.d/confluence restart
    
### MySQL Connector

    sudo cp mysql-connector-java-5.1.48-bin.jar /opt/atlassian/confluence/lib/

### 破解

    sudo mv atlassian-extras-decoder-v2-3.4.1.jar atlassian-extras-decoder-v2-3.4.1.jar-bak20200105
    sudo cp ~/atlassian-extras-decoder-v2-3.2.jar /opt/atlassian/confluence/confluence/WEB-INF/lib/

### Setup

Confluence要求数据库 **tx_isolation** 属性值是 **READ-COMMITTED**，因此在不修改my.cnf重启数据服务的情况下，需要设置数据库连接地址为：

> jdbc:mysql://localhost/confluencedb?sessionVariables=tx_isolation='READ-COMMITTED'


[^brokenrefer]: https://juejin.im/post/5c94ccd8f265da611d742d5e
[^scp]:https://blog.csdn.net/xcg132566/article/details/78797339
[^MysqlRootPw]:https://stackoverflow.com/questions/33991228/what-is-the-default-root-pasword-for-mysql-5-7

