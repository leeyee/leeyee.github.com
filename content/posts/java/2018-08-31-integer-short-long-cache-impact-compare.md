---
title: 缓存对Integer, Short, Long对象比较的影响
date: 2018-08-31
description: 在进行Integer,Short,Long对象比较时，应使用equals方法进行值判断.
categories: "java"
tags: ["java"]
slug: "integer-short-long-cache-impact-compare"
aliases: ['/blog/2018/08/31/integer-short-long-cache-impact-compare.html']
---

结论：

> 在进行Intege,Short,Long对象比较时，应使用`equals`方法进行值判断。亦或使用其对应的非包装类型进行`==`比较（**注意为空的情况**）。


遇到一个坑，当Interge对象值大于127时，使用 `==` 比较时会返回false。参看源码会发现`Interge`对象使用了 `IntegerCache`进行了值缓存。默认情况下，当`Interge`的值在 **-128到127** 时使用`IntegerCache`缓存。

当值在-128到127时:

    Integer a = 127, b = 127;

    Assert.assertTrue(a == b);
    Assert.assertTrue(a.intValue() == b.intValue());
    Assert.assertTrue(a.equals(b));
    
当值 >127 and < -128 时:

    Integer a = 128, b = 128;

    Assert.assertFalse(a == b);
    Assert.assertTrue(a.intValue() == b.intValue());
    Assert.assertTrue(a.equals(b));
    
当然对于`IntegerCache`可缓存的最大值可以通过虚拟机参数进行设置。参看源码：

    // high value may be configured by property
    int h = 127;
    String integerCacheHighPropValue =
        sun.misc.VM.getSavedProperty("java.lang.Integer.IntegerCache.high");
    if (integerCacheHighPropValue != null) {
        try {
            int i = parseInt(integerCacheHighPropValue);
            i = Math.max(i, 127);
            // Maximum array size is Integer.MAX_VALUE
            h = Math.min(i, Integer.MAX_VALUE - (-low) -1);
        } catch( NumberFormatException nfe) {
            // If the property cannot be parsed into an int, ignore it.
        }
    }
    high = h;

因此可通过设置[^comments]

> -Djava.lang.Integer.IntegerCache.high=<size\>

或者

> -XX:AutoBoxCacheMax=<size\>

来改变`IntegerCache`的缓存上限。


对于`Short`和`Long`对象，翻看其源码，同样会发现存在`ShortCache`和`LongCache`这样的缓存对象。但和`IntegerCache`不同的是，`ShortCache` 和 `LongCache` 缓存范围固定为 **-128到127**,该值无法通过参数进行重置。

    Short s1 = 127, s2 = 127;

    Assert.assertTrue(s1 == s2);
    Assert.assertTrue(s1.intValue() == s2.intValue());
    Assert.assertTrue(s1.equals(s2));

    s1 = 128; s2 = 128;

    Assert.assertFalse(s1 == s2);
    Assert.assertTrue(s1.intValue() == s2.intValue());
    Assert.assertTrue(s1.equals(s2));


    Long L1 = 127L, L2 = 127L;

    Assert.assertTrue(L1 == L2);
    Assert.assertTrue(L1.intValue() == L2.intValue());
    Assert.assertTrue(L1.equals(L2));

    L1 = 128L; L2 = 128L;

    Assert.assertFalse(L1 == L2);
    Assert.assertTrue(L1.intValue() == L2.intValue());
    Assert.assertTrue(L1.equals(L2));
    
> 如果能确定定义的值在缓存范围内，那么 `==` 和 `equlas` 返回的结果是相同的。不过还是建议在比较这三种类型时直接使用 `equlas` 方法。

[^comments]: [How large is the Integer cache?](https://stackoverflow.com/questions/15052216/how-large-is-the-integer-cache)
