---
title: Hibernate缓存
date: 2013-07-07
description: 本文介绍了相关hibernate缓存的知识以及缓存配置时关于并发事务级别的相关知识。同时结合hibernate annotation的@Cache注解标签，实际演示了如何使用注解配置hibernate缓存。
categories: "java"
tags: ["hibernate", "cache"]
---

Hibernate中实现缓存的对象有`Session`和`SessionFactory`。

`Session`的缓存为内置缓存，不可被卸载，称为Hibernate的一级缓存；

`SessionFactory`有一个内置缓存和一个外置缓存。其中外置缓存可插拔，被称作Hibernate的二级缓存。

**Note:**  Hibernate的这两级缓存均位于**持久化层**，存放的都是数据库数据的拷贝。


## 持久化层缓存的范围

持久化层缓存的范围可分为三类：事务范围、进程范围及群集范围。

事务范围的缓存是持久化层的第一级缓存，通常是必须的；进程范围或群集范围的缓存是持久化层的第二级缓存，通常是可选的。

**对于是否应用群集范围的缓存应慎重考虑，因为有时它未必能提高应用性能。**

### 事务范围

1. 缓存只能被当前事务访问。

2. 其生命周期依赖于事务的生命周期，事务结束，缓存也就结束；

3. 缓存的物理介质为内存；

4. 这里的事务是数据库事务或应用事务。每个事务都有其独自的缓存，缓存内的数据通常采用相互关联的对象形式。

### 进程范围

1. 缓存被进程内的所有事务共享。这些事物可并发访问混存，因此需要相应的事务隔离机制；

2. 其生命周期依赖于进程的生命周期；

3. 缓存的介质为内存或者硬盘；

4. 缓存内的数据既可采用相互关联的对象形式，也可采用对对象的散装数据形式，散装数据形式类似对象的序列化。

### 群集范围

1. 缓存被同一个机器或多个机器上的多个进程共享；

2. 缓存被复制到群集环境中的每个进程节点，进程之间通过远程通讯保证缓存中的数据一致；

3. 缓存中的数据通常采用对象的散装数据形式。

## 持久化层缓存的并发访问策略

### 事务型

仅在受管理环境中使用。提供**可重复读[事务隔离级别]** 。可用于经常读但很少被修改的数据，因为他**可防止脏读和不可重复读**。

### 读写型

提供**读已提交数据[事务隔离级别]**。仅在非群集环境中适用，可用于经常度但很少被修改的数据，因为他**可防止读脏数据** 。

### 非严格读写型

不保证缓存与数据库中数据的一致性。如果存在两个事务同时访问缓存中相同的数据，必须为该数据配置一个很短的过期时间，避免脏读。对于允许偶尔脏读的数据，可以采用该策略。

### 只读型

可用于从来不会被修改的数据，如参考数据等。

### 应用场景

事务型并发访问策略的[事务隔离级别]最高，只读型最低。**隔离级别越低，并发性能越好**。

1. 一般符合以下条件的数据才适合存放在二级缓存中：

    + 很少被修改的数据；
    + 不是很重要的数据，允许出现偶尔的并发问；
    + 不会被并发访问的数据；
    + 参考数据（常量数据）。
    
    其中，参考数据具有以下特点：

    + 实例数目有限；
    + 每个实例会被许多其他类的实例引用；
    + 实例极少或者从来不被修改。

2. 不适合存放于二级缓存中的数据

    + 经常被修改的数据；
    + 财务数据，绝对不允许出现并发问题；
    + 与其他应用共享的数据。因为当使用Hibernate二级缓存与其他应用共享数据库的某种数据时，如果其他应用修改了数据中的数据，Hibernate将无法保证二级缓存中的数据与数据库保持一致。

## Hibernate一级缓存

Hibernate一级缓存中存放的数据是数据库中数据的拷贝，其表现为相互关联的实体对象。`Session`会在某些时间点按照缓存中的数据来同步更新数据库，这一个过程称作清理缓存。

当应用程序调用 Session 的 save(),update(),saveOrUpdate(),load(),get(),find()以及查询接口的 list(),iterate() 或者 filter() 方法时，如果Session 的缓存中不存在相应的对象，Hibernate就会把该对象加入到一级缓存中。

可通过以下两个方法管理缓存：

+ `evict(object o)`：从缓存中清除指定持久化对象
+ `clear()`：清空缓存中的所有持久化对象

其中`evict(object o)`方法适用于：

1. 不希望 Session 继续按照对象状态变化来同步更新数据库；
2. 使用 Hibernate API 批量更新或删除后。当然执行批量更新或者删除最佳的方式是通过 JDBC API 执行相关SQL语句或调用存储过程。

通常，**不建议通过上述方法管理一级缓存**，因为其并不能显著提高应用性能。有效的一级缓存管理办法是：**合理的检索策略和检索方式**。如，通过**延迟加载、集合过滤或者投影查询**等手段来节省内存开销。

## Hibernate二级缓存

Hibernate的二级缓存是进程范围或群集范围的缓存，缓存中存放的是对象的散列数据。二级缓存是可配置的插件，比如：

+ [EHCache] : 可作为进程范围内的缓存，存放数据是物理介质是内存或硬盘，支持Hibernate查询缓存；
+ [OSCache] : 可作为进程范围内的缓存，存放数据是物理介质是内存或硬盘，提供了丰富的缓存数据过期策略，支持Hibernate查询缓存；
+ [SwarmCache] : 可作为群集范围内的的缓存，不支持Hibernate查询缓存；
+ [JBossCache] : 可作为群集范围内的的缓存，支持事务型并发访问策略，支持Hibernate查询缓存。

<table class="table table-bordered">
    <caption>各插件支持的并发访问策略</caption>
    <tr>
        <th>缓存插件</th>
        <th>只读型</th>
        <th>非严格读写型</th>
        <th>读写型</th>
        <th>事务型</th>
        <th>Hibernate适配器</th>
    </tr>
    <tr>
        <td>EHCache</td>
        <td>支持</td>
        <td>支持</td>
        <td>支持</td>
        <td>否</td>
        <td>org.hibernate.cache.EhCacheProvider</td>
    </tr>
    <tr>
        <td>OSCache</td>
        <td>支持</td>
        <td>支持</td>
        <td>支持</td>
        <td>否</td>
        <td>org.hibernate.cache.OSCacheProvider</td>
    </tr>
    <tr>
        <td>SwarmCache</td>
        <td>支持</td>
        <td>支持</td>
        <td>否</td>
        <td>否</td>
        <td>org.hibernate.cache.SwarmCacheProvider</td>
    </tr>
    <tr>
        <td>JBossCache</td>
        <td>支持</td>
        <td>否</td>
        <td>否</td>
        <td>支持</td>
        <td>org.hibernate.cache.TressCacheProvider</td>
    </tr>
    <tfoot>
        <tr><td colspan='6'>注：适配器类名基于Hibernate3.jar包</td></tr>
    </tfoot>
</table>

### 二级缓存的开启

这里采用OSCache作为Hibernate cache适配器。

1. 配置二级缓存适配器

        <prop key="hibernate.cache.provider_class">
            org.hibernate.cache.OSCacheProvider
        </prop>

2. 开启二级缓存

        <prop key="hibernate.cache.use_second_level_cache">true</prop>

## Hibernate查询缓存

Hibernate查询缓存依赖于二级缓存。当启用查询缓存后，第一次执行查询语句时，Hibernate会把查询结果保存在二级缓存中。当再次执行查询语句时，只需从缓存中获取查询结果即可。

需要注意的是：**如果查询结果中包含实体，二级缓存只会存放实体的OID，而对于投影查询，二级缓存则会存放所有数值**。

查询缓存适用于以下场合：

+ 经常使用的查询语句
+ 很少对于查询语句关联的数据库数据进行插入、删除和更新操作。

### 查询缓存的配置

1. 配置二级缓存
2. 在Hibernate中配置

        <prop key="hibernate.cache.use_query_cache">true</prop>
    
3. 调用`Query`,`Criteria`接口的`setCacheable()`方法

**只有当以上三个工作都做了，查询缓存才会生效！**

## 与缓存有关的注解

### Entity

这里的`@Entity`是指来自  persistence.jar 包的`@javax.persistence.Entity`。 当使用该注解持久化一个实体时，Hibernate会将该实体存放在一级缓存（Session）中。

默认情况下，实体不是二级缓存的一部分。通常不建议这么做，但你可以通过在你的持久化配置文件中重写 shared-cache-mode 或者使用 javax.persistence.sharedCache.mode 属性来改变默认情况。可能的值有：

1. **ENABLE_SELECTIVE**: 实体不被缓存，除非明确的被标记为可被缓存。该值为默认值.言下之意就是完全禁止实体二级缓存。

2. **DISABLE_SELECTIVE**: 实体被缓存，除非明确的被标记为不可缓存。

3. **ALL**: 所有实体被缓存，除非明确的被标记为不可缓存。

另，**还有一个来自 hibernate-annotations.jar 包的 [org.hibernate.annotations.Entity](http://docs.jboss.org/hibernate/stable/annotations/reference/en/html/entity.html#entity-hibspec-entity) 注解，该注解是作为 @javax.persistence.Entity 注解的补充来使用的，其自身不具有持久化类的功能。**

### Cache

来自 hibernate-annotations.jar 包，全称`@org.hibernate.annotations.Cache`。该注解可用于类和集合上。

[@Cache](http://docs.jboss.org/hibernate/stable/annotations/reference/en/html/entity.html#d0e2298)定义了二级缓存策略和缓存范围，定义如下：

    @Cache(
        CacheConcurrencyStrategy usage(); // 1
        String region() default "";       // 2
        String include() default "all";   // 3
    )

1. **usage**: 当前缓存策略（**NONE, READ\_ONLY, NONSTRICT\_READ\_WRITE, TRANSACTIONAL**）。
    + read-only: 只读缓存；
    + read-write: 读写缓存；
    + nonstrict-read-write: 不严格读写缓存；
    + transactional: 事务型缓存；

    具体的使用说明请查看上述的**持久化层缓存的并发访问策略**或者[查看这里](http://docs.jboss.org/hibernate/orm/3.6/reference/zh-CN/html/performance.html#performance-cache)。

2. **region**: 可选参数。指定二级缓存的区域名，默认为类或者集合的名字

3. **include**：可选参数（all | non-lazy）。all 包含所有属性，non-lazy 仅包含非延迟加载的属性。

#### 缓存实体

    @javax.persistence.Entity
    @Table(name = "PROVINCE")
    @Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
    public class Province(){ // 省份对象
        ...
    }

#### 缓存集合

    @javax.persistence.Entity
    @Cache (usage = CacheConcurrencyStrategy.READ_ONLY)
    public class Province {//省份对象
        @OneToMany(fetch = FetchType.LAZY)
        @JoinColumn(name = "cityId")
        @Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
        private Set<City> citys; // 省份对应城市
    }

此时，在访问`province.citys`时，Hibernate只缓存了city的OID,因此在实际的查询过程中还是需要执行
   
    select * from city where cityid = ?
 
来访问数据库表的。为了避免该问题，可以为`City`对象配置同样的二级缓存。

    @javax.persistence.Entity
    @Table(name = "CITY")
    @Cache (usage = CacheConcurrencyStrategy.READ_ONLY)
    public class City {
        ...
    } // 城市对象


## 比较完整的例子

1. xml配置

        <!-- 缓存适配器 -->
        <prop key="hibernate.cache.provider_class">
            org.hibernate.cache.OSCacheProvider
        </prop>
        <!-- 开启查询缓存 -->
        <prop key="hibernate.cache.use_query_cache">true</prop>
        <!-- 开启二级缓存 -->
        <prop key="hibernate.cache.use_second_level_cache">true</prop>
2. 实体配置

        @javax.persistence.Entity
        @Table(name = "PROVINCE")
        @Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
        public class Province { // 省份对象
            private String pid;
            private String pname;
            
            @OneToMany // 不用lazy加载，一次性全部加载
            @JoinColumn(name = "cid")
            @Cache(usage = CacheConcurrencyStrategy.READ_ONLY)
            private Set<City> citys; // 省份对应城市
            
            // some set or get method
        }
        
        @javax.persistence.Entity
        @Table(name = "CITY")
        @Cache (usage = CacheConcurrencyStrategy.READ_ONLY)
        public class City { // 城市对象
            private String cid;
            private String cname;
            
            // some set or get method
        } 
        
        // DAO.class
        // HQL
        public List<Provice> findAll(){
            Query query = session.createQuery(" from Provice");
            // 设置为true,启动查询缓存
            query.setCacheable(true); 
            List<Provice> list = query.list();
            session.close();
            return list;
        }
        
        // QBC
        public List<Provice> findAll2(){
            Criteria crit = session.createCriteria(Province.class);
            // 设置为true,启动查询缓存
            crit.setCacheable(true);
    	    List<Module> list = crit.list();
            session.close();
            return list;
        }
        
    
    
[EHCache]: http://ehcache.org/ "EHCache 主页"
[OSCache]: http://www.baike.com/wiki/OSCache "OSCache 互动百科"
[SwarmCache]: http://swarmcache.sourceforge.net/ "SwarmCache 主页"
[JBossCache]: http://www.jboss.org/jbosscache/ "JBossCache 主页"
[事务隔离级别]: /blog/2013/07/04/database-transaction-concurrency/ "数据库事务与并发"