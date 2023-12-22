---
layout: post
title: Spring ContentNegotiatingViewResolver 简单分析
description: Spring ContentNegotiatingViewResolver 简单分析
category: java
tag: [spring]
---

* TOC
{:toc}


# Conclusion

对于自定义`ViewResolvers`，可以通过下面的方式使用:

    return new ModelAndView("viewName"); // ByViewName
    // or
    return new ModelAndView(new CustomerView()); // ByViewObject
    
但在实操中，对于 *ByViewName* 方式，建议在注解 `@RequestMapping` 中给出具体的 *produces (mediaType)*，比如

    @RequestMapping(value = "/", produces = "application/pdf")
    @RequestMapping(value = "/", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    
> 因为在*ByViewName*方式下，如果不提供*produces*属性，那么完全依赖容器中`ViewResolvers`的顺序，并且都将以默认方式`text/html`进行处理。

# Analysis

下面来看下具体的代码. 当`return new ModelAndView` 时会调用

    // DispatcherServlet.java#render(ModelAndView mv, HttpServletRequest request, HttpServletResponse response)
	View view;
	String viewName = mv.getViewName();
	if (viewName != null) {
		// We need to resolve the view name.
		view = resolveViewName(viewName, mv.getModelInternal(), locale, request);
		if (view == null) {
			throw new ServletException("Could not resolve view with name '" + mv.getViewName() +
					"' in servlet with name '" + getServletName() + "'");
		}
	}
	else {
		// No need to lookup: the ModelAndView object contains the actual View object.
		view = mv.getView();
		if (view == null) {
			throw new ServletException("ModelAndView [" + mv + "] neither contains a view name nor a " +
					"View object in servlet with name '" + getServletName() + "'");
		}
	}

可以看到 *ByViewObject* 方式直接就是拿自定义的`View`，而对于*ByViewName*，则需要通过 *name* 进行反查具体的`View`类。

	@Nullable
	protected View resolveViewName(String viewName, @Nullable Map<String, Object> model,
			Locale locale, HttpServletRequest request) throws Exception {

		if (this.viewResolvers != null) {
			for (ViewResolver viewResolver : this.viewResolvers) {
				View view = viewResolver.resolveViewName(viewName, locale);
				if (view != null) {
					return view;
				}
			}
		}
		return null;
	}

从`resolveViewName`方法可以看出，如果有多`View`匹配，就返回第一个，**因此容器中 `ViewResolvers` 的顺序就比较关键**。

## 使用Spring

通常，为了使用自定义视图，需要实现`View`接口，并在配置文件中配置 `BeanNameViewResolver` 即可，**同时要保证 `BeanNameViewResolver` 排在最前面**。

那么这种情况下不管是 *ByViewName* 还是 *ByViewObject* 方式是不需要具体指明 *produces* 的。

## 使用Spring Boot

当使用Spring Boot时，就需要注意了。因为`WebMvcAutoConfiguration`中，对于`ViewResolvers`，默认了三个 `ViewResolver`，顺序如下:

    ContentNegotiatingViewResolver -> viewResolver
    BeanNameViewResolver -> beanNameViewResolver
    InternalResourceViewResolver -> defaultViewResolver

因此，核心的 `ViewResolver` 就是 `ContentNegotiatingViewResolver`，那么这个 `resolver` 具体做了什么呢？可以看下源码

	public View resolveViewName(String viewName, Locale locale) throws Exception {
		RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
		Assert.state(attrs instanceof ServletRequestAttributes, "No current ServletRequestAttributes");
		List<MediaType> requestedMediaTypes = getMediaTypes(((ServletRequestAttributes) attrs).getRequest());
		if (requestedMediaTypes != null) {
			List<View> candidateViews = getCandidateViews(viewName, locale, requestedMediaTypes);
			View bestView = getBestView(candidateViews, requestedMediaTypes, attrs);
			if (bestView != null) {
				return bestView;
			}
		}
		...
	}

主要有三个核心方法:

### getMediaTypes

1. 从`HttpRequest`的`Header`中获取 *Accept*.
2. 获取`@RequestMapping`中指定的 *mediaType*.
3. 如果指定的 *mediaType* 与可接受的匹配，则使用指定的.


            protected List<MediaType> getMediaTypes(HttpServletRequest request) {
                Assert.state(this.contentNegotiationManager != null, "No ContentNegotiationManager set");
                try {
                    ServletWebRequest webRequest = new ServletWebRequest(request);
                    List<MediaType> acceptableMediaTypes = this.contentNegotiationManager.resolveMediaTypes(webRequest);
                    List<MediaType> producibleMediaTypes = getProducibleMediaTypes(request);
                    Set<MediaType> compatibleMediaTypes = new LinkedHashSet<>();
                    for (MediaType acceptable : acceptableMediaTypes) {
                        for (MediaType producible : producibleMediaTypes) {
                            if (acceptable.isCompatibleWith(producible)) {
                                compatibleMediaTypes.add(getMostSpecificMediaType(acceptable, producible));
                            }
                        }
                    }
                    List<MediaType> selectedMediaTypes = new ArrayList<>(compatibleMediaTypes);
                    MediaType.sortBySpecificityAndQuality(selectedMediaTypes);
                    return selectedMediaTypes;
                }
                catch (HttpMediaTypeNotAcceptableException ex) {
                    if (logger.isDebugEnabled()) {
                        logger.debug(ex.getMessage());
                    }
                    return null;
                }
            }

### getCandidateViews

获取候选`View`。遍历所有`viewResolvers`，返回匹配 *viewName* 配置的`View`;

    private List<View> getCandidateViews(String viewName, Locale locale, List<MediaType> requestedMediaTypes)
            throws Exception {
        List<View> candidateViews = new ArrayList<>();
        if (this.viewResolvers != null) {
            Assert.state(this.contentNegotiationManager != null, "No ContentNegotiationManager set");
            for (ViewResolver viewResolver : this.viewResolvers) {
                View view = viewResolver.resolveViewName(viewName, locale);
                if (view != null) {
                    candidateViews.add(view);
                }
                for (MediaType requestedMediaType : requestedMediaTypes) {
                    List<String> extensions = this.contentNegotiationManager.resolveFileExtensions(requestedMediaType);
                    for (String extension : extensions) {
                        String viewNameWithExtension = viewName + '.' + extension;
                        view = viewResolver.resolveViewName(viewNameWithExtension, locale);
                        if (view != null) {
                            candidateViews.add(view);
                        }
                    }
                }
            }
        }
        ...
        return candidateViews;
    }

### getBestView

1. 遍历候选`View`，如果是`SmartView`并且是 *RedirectView*，则直接返回;
2. 遍历请求*mediaType*（来自`getMediaTypes`方法）与候选`View`匹配。如果候选`View`声明了*contentType*, 并且与当前*mediaType*匹配，则返回该`View`.

举个例子，一般请求`Accept`如下：

> text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8

如果声明

    @GetMapping(value = "/", produces = "application/pdf")

那么，*application/pdf* 就匹配 `*/*`

	@Nullable
	private View getBestView(List<View> candidateViews, List<MediaType> requestedMediaTypes, RequestAttributes attrs) {
		for (View candidateView : candidateViews) {
			if (candidateView instanceof SmartView) {
				SmartView smartView = (SmartView) candidateView;
				if (smartView.isRedirectView()) {
					return candidateView;
				}
			}
		}
		for (MediaType mediaType : requestedMediaTypes) {
			for (View candidateView : candidateViews) {
				if (StringUtils.hasText(candidateView.getContentType())) {
					MediaType candidateContentType = MediaType.parseMediaType(candidateView.getContentType());
					if (mediaType.isCompatibleWith(candidateContentType)) {
						if (logger.isDebugEnabled()) {
							logger.debug("Selected '" + mediaType + "' given " + requestedMediaTypes);
						}
						attrs.setAttribute(View.SELECTED_CONTENT_TYPE, mediaType, RequestAttributes.SCOPE_REQUEST);
						return candidateView;
					}
				}
			}
		}
		return null;
	}


那么现在如果使用Spring boot **默认配置**，同时增加自定义`View`的实现（比如`PdfView`或者`ExcelView`），当使用*ByViewName*这种方式，针对`ContentNegotiatingViewResolver`就会发生:

`getMediaTypes` 仅返回 `HttpRequest` `Header`的 *Accept*. 可能如下：

    ['text/html','application/xhtml+xml','application/xml','*/*']
    
`getCandidateViews` 返回2个候选`Resolver`

    PdfView -> appliction/pdf
    InternalResourceViewResolver -> text/html
        
这里之所以会返回`InternalResourceViewResolver`对象，是因为通过*ByViewName*请求时，该`Resolver`会把*viewName*当作*URL*路径处理，那么在`getCandidateViews`中调用`InternalResourceViewResolver#resolveViewName`方法时，就会被返回。可具体参看`AbstractCachingViewResolver#resolveViewName`

那么`getBestView`就会返回`InternalResourceViewResolver`而不是`PdfView`（`text/html`首先匹配到了`InternalResourceViewResolver`的*contentType*）

# Extend

## 修改Spring boot中的默认配置

两种方式：

1. 自己管理`WebMvc`的配置。可以通过`@EnableWebMvc`注解`@Configuration`类。不建议该种方式，这种方式会将Spring boot默认的所有配置无效化。

2. 在自己的`@Configuration`类覆盖Spring boot默认的配置

比如，在使用FreeMarker的情况下，就完全可以不用`InternalResourceViewResolver`，那么只要在`@Configuration`类中覆盖对应的Bean`即可，其他类似。

    @Bean
    InternalResourceViewResolver defaultViewResolver() {
        return null;
    }
