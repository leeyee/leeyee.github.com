---
layout: post
title: mybatis参数映射
description: 本文主要说明mybatis框架对于方法参数的映射规则并分类进行了讨论
category: java
tag: [mybatis]
---

* any list
{:toc}

## 规则

### 非注解参数

当参数未使用`@Param`注解时，可以通过以下方式访问：

>  #{参数位置[0..n-1]}    

或者

>  #{param[1..n]}
    
如果参数类型是自定义对象Bean时,只需加上`.对象属性`即可
    
>  #{参数位置[0..n-1].对象属性}
>  #{param[1..n].对象属性}
        
特别的，如果非注解参数只有一个时，可使用
        
>  #{任意字符}
    
### 注解参数

`@Param` 注释了参数后相当于给该参数指定了一个别名。注释后的参数只能通过
        
>  #{注解别名}
            
或者
    
>  #{param[1..n]}     
    
如果参数类型是自定义对象Bean时,只需加上`.对象属性`即可访问对象属性
    
>  #{注解别名.属性}
>  #{param[1..n].属性}
    
### 示例

为了明确上述规则，我们的示例具体细分了各种情况进行展示。

#### 非注解型

##### 一个参数

    User getUserById(int id);
    
    select * from <TABLE> where id = #{id}
    // or
    select * from <TABLE> where id = #{abdc}
    // or
    select * from <TABLE> where id = #{param1}
    
    User getUser(User user); // user.getName user.getAge 
    
    select * from <TABLE> where name = #{name} and age = #{age}
    
##### 多个参数

    User getUser(String name, int age);  
        
    select * from <TABLE> where name = #{0} and age = #{1}  
    // or  
    select * from <TABLE> where name = #{param1} and age = #{param2}  
     
    User getUser(User usr, int flag);  
    
    select * from <TABLE> where name = #{0.name} and age = {0.age} and flag = #{1}  
    // or  
    select * from <TABLE> where name = #{param1.name} and age = {param1.age} and flag = #{param2}
    
#### 注解型

##### 一个参数
 
    User getUserById(@Param(value="keyId") int id);  

    select * from <TABEL> where id = #{keyId}  
    // or  
    select * from <TABLE> where id = #{param1}  
         
    User getUser(@Param(value="user") User user); // user.getName user.getAge  
    
    select * from <TABLE> where name = #{user.name} and age = #{user.age}  
    // or  
    select * from <TABLE> where name = #{param1.name} and age = #{param1.age}

##### 多个参数

    User getUser(@Param(value="xm") String name, @Param(value="nl") int age);  

    select * from <TABLE> where name = #{xm} and age = #{nl}  
    // or  
    select * from <TABLE> where name = #{param1} and age = #{param2}  
    // or  
    select * from <TABLE> where name = #{xm} and age = #{param2}  
  
    User getUser(@Param(value="usr") User user, @Param(value="tag") int flag); 
    
    select * from <TABLE> where name = #{usr.name} and age = #{usr.age} and flag = #{tag}  
    // or  
    select * from <TABLE> where name = #{param1.name} and age = #{param1.age} and flag = #{param2}  
    // or  
    select * from <TABLE> where name = #{usr.name} and age = #{param1.age} and flag = #{param2}

#### 非注解和注解型混合型

当采用部分参数使用`@Param`注解时，参数注释为将以上两种情况结合起来即可.

    User getUser(String name, @Param(value="nl") age, int gendar);  
  
    // 对于age的访问不能是 #{1} 只能是 #{param2} | #{nl}  
    select * from <TABLE> where name = #{0} and age = #{nl} and gendar = #{param3)

### 框架主要映射处理代码

#### 参数的获取

`org.apache.ibatis.binding.MapperMethod`

    private Object getParam(Object[] args) {  
        final int paramCount = paramPositions.size();  
        // 无参数  
        if (args == null || paramCount == 0) {  
            return null;  
        // 无注解并参数个数为1  
        } else if (!hasNamedParameters && paramCount == 1) {  
            return args[paramPositions.get(0)];  
        } else {  
            Map<String, Object> param = new MapperParamMap<Object>();  
            for (int i = 0; i < paramCount; i++) {  
                param.put(paramNames.get(i), args[paramPositions.get(i)]);  
        }  
        // issue #71, add param names as param1, param2...but ensure backward compatibility  
        // 这就是 #{param[1..n]} 的来源  
        for (int i = 0; i < paramCount; i++) {  
            String genericParamName = "param" + String.valueOf(i + 1);  
            if (!param.containsKey(genericParamName)) {  
                param.put(genericParamName, args[paramPositions.get(i)]);  
            }  
        }  
        return param;  
        }  
    }

#### SQL预编译参数设置

`org.apache.ibatis.executor.parameter.DefaultParameterHandler`
  
    public void setParameters(PreparedStatement ps) throws SQLException {  
        ErrorContext.instance().activity("setting parameters").object(mappedStatement.getParameterMap().getId());  
        List<ParameterMapping> parameterMappings = boundSql.getParameterMappings();  
        if (parameterMappings != null) {  
            MetaObject metaObject = parameterObject == null ? null : configuration.newMetaObject(parameterObject);  
            for (int i = 0; i < parameterMappings.size(); i++) {  
                ParameterMapping parameterMapping = parameterMappings.get(i);  
                if (parameterMapping.getMode() != ParameterMode.OUT) {  
                    Object value;  
                    String propertyName = parameterMapping.getProperty();  
                    PropertyTokenizer prop = new PropertyTokenizer(propertyName);  
                    if (parameterObject == null) {  
                        value = null;  
                    } else if (typeHandlerRegistry.hasTypeHandler(parameterObject.getClass())) {  
                        value = parameterObject;  
                    } else if (boundSql.hasAdditionalParameter(propertyName)) {  
                        value = boundSql.getAdditionalParameter(propertyName);  
                    } else if (propertyName.startsWith(ForEachSqlNode.ITEM_PREFIX)  
              && boundSql.hasAdditionalParameter(prop.getName())) {  
                        value = boundSql.getAdditionalParameter(prop.getName());  
                        if (value != null) {  
                            value = configuration.newMetaObject(value).getValue(propertyName.substring(prop.getName().length()));  
                        }  
                } else {  
                    value = metaObject == null ? null : metaObject.getValue(propertyName);  
                }  
                TypeHandler typeHandler = parameterMapping.getTypeHandler();  
                if (typeHandler == null) {  
                    throw new ExecutorException("There was no TypeHandler found for parameter " + propertyName + " of statement " + mappedStatement.getId());  
                }  
                JdbcType jdbcType = parameterMapping.getJdbcType();  
                if (value == null && jdbcType == null) jdbcType = configuration.getJdbcTypeForNull();  
                    typeHandler.setParameter(ps, i + 1, value, jdbcType);  
                }  
            }  
        }  
    }