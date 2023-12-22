---
layout: post
title: Spring Retry 简介
description: Spring-Retry 简介
category: java
tag: [spring,translation]
---

* TOC
{:toc}

原文地址：[http://docs.spring.io/spring-batch/reference/html/retry.html](http://docs.spring.io/spring-batch/reference/html/retry.html)


## 9.1  RetryTemplate 重试模板方法

**Note** 

The retry functionality was pulled out of Spring Batch as of 2.2.0. It is now part of a new library, Spring Retry.

**注意：**从Spring Batch 2.2.0开始，重试功能作为一个新的项目Spring Retry单独维护

To make processing more robust and less prone to failure, sometimes it helps to automatically retry a failed operation in case it might succeed on a subsequent attempt. Errors that are susceptible to this kind of treatment are transient in nature. For example a remote call to a web service or RMI service that fails because of a network glitch or a DeadLockLoserException in a database update may resolve themselves after a short wait. To automate the retry of such operations Spring Batch has the RetryOperations strategy. The RetryOperations interface looks like this:

为了使处理更加健壮，减少异常的发生，重试一个失败的操作有时是必要的，因为有可能在后续的失败重试中处理成功了。因此对于程序异常或者错误更应该使用这种重试机制进行处理。例如在远程调用web服务或者RMI服务时，因网络故障或者数据库更新时发生 `DeadLockLoserException` 导致请求失败，但在稍等片刻后这种异常会自动恢复。为了实现这种情况下的重试操作，Spring Batch 提供重试策略。这些重试操作接口定义如下：

	public interface RetryOperations {

		<T> T execute(RetryCallback<T> retryCallback) throws Exception;

		<T> T execute(RetryCallback<T> retryCallback, RecoveryCallback<T> recoveryCallback)
			throws Exception;

		<T> T execute(RetryCallback<T> retryCallback, RetryState retryState)
			throws Exception, ExhaustedRetryException;

		<T> T execute(RetryCallback<T> retryCallback, RecoveryCallback<T> recoveryCallback,
			RetryState retryState) throws Exception;

	}

The basic callback is a simple interface that allows you to insert some business logic to be retried:

基本的回调是一个简单的接口，你可以通过该接口实现需要重试的业务逻辑：

	public interface RetryCallback<T> {

		T doWithRetry(RetryContext context) throws Throwable;

	}

The callback is executed and if it fails (by throwing an Exception), it will be retried until either it is successful, or the implementation decides to abort. There are a number of overloaded execute methods in the RetryOperations interface dealing with various use cases for recovery when all retry attempts are exhausted, and also with retry state, which allows clients and implementations to store information between calls (more on this later).

回调执行过程中如果抛出异常，将会进行重试，直到回调成功或者被回调实现终止。`RetryOperations`接口中定义了一些基本执行方法，可以用来处理重试结束后的用户的“兜底”操作，也可以将每次重试失败时的重试状态返回给调用方

The simplest general purpose implementation of RetryOperations is RetryTemplate. It could be used like this

最简单的 `RetryOperations` 实现是 `RetryTempate` 方法，使用方法如下：

	// RetryTemplate 默认使用SimpleRetryPolicy策略。
	// SimpleRetryPolicy 是调用次数重试。默认3次
	RetryTemplate template = new RetryTemplate();
	
	// version1.1.2中默认超时1000ms
	TimeoutRetryPolicy policy = new TimeoutRetryPolicy();
	policy.setTimeout(30000L);

	template.setRetryPolicy(policy);

	Foo result = template.execute(new RetryCallback<Foo>() {

		public Foo doWithRetry(RetryContext context) {
			// Do stuff that might fail, e.g. webservice operation
			return result;
		}

	});
	
In the example we execute a web service call and return the result to the user. If that call fails then it is retried until a timeout is reached.

在这个示例中，我们执行web服务调用并返回结果给用户。如果调用失败了，那么将继续重试，直到超时为止。

### 9.1.1 RetryContext 重试上下文

The method parameter for the RetryCallback is a RetryContext. Many callbacks will simply ignore the context, but if necessary it can be used as an attribute bag to store data for the duration of the iteration.

`RetryCallback` 方法的参数是 `RetryContext`（重试上下文）.许多回调将简单地忽略该上下文，但是如果需要，可以将上下文在重试迭代时间范围内当作一个属性包存储数据使用。

比如：

	public int le10(int i) throws Exception {
		if (i < 10) throw new Exception(i + " le 10");
		return i;
	}
	public static void main(String... args) throws Exceptioin {
		RetryTemplate template = new RetryTemplate();

        TimeoutRetryPolicy policy = new TimeoutRetryPolicy();
        policy.setTimeout(50000L);

        template.setRetryPolicy(policy);

        int result = template.execute(new RetryCallback<Integer, Exception>() {

            int i = 5;
            
            @Override
            public Integer doWithRetry(RetryContext context) throws Exception {
                return le10(i++);
            }
        });
		
		System.out.println(i); // final return is 10
	}

A RetryContext will have a parent context if there is a nested retry in progress in the same thread. The parent context is occasionally useful for storing data that need to be shared between calls to execute.

如果在同一线程处理中有一个内嵌的重试，那么重试上下文将有一个父上下文。父上下文偶尔被用来在需要被调用执行之间存储共享数据。

### 9.1.2 RecoveryCallback “兜底”回调

When a retry is exhausted the RetryOperations can pass control to a different callback, the RecoveryCallback. To use this feature clients just pass in the callbacks together to the same method, for example:

当所有重试操作完成时（依然没有获取正确的结果）可以通过 `RecoveryCallback` 实现一个兜底的操作。例如：

	Foo foo = template.execute(new RetryCallback<Foo>() {
		public Foo doWithRetry(RetryContext context) {
			// business logic here
		},
	  new RecoveryCallback<Foo>() {
		Foo recover(RetryContext context) throws Exception {
			  // recover logic here
		}
	});
	
If the business logic does not succeed before the template decides to abort, then the client is given the chance to do some alternate processing through the recovery callback.

在重试调用执行完成前如果业务逻辑仍然不能成功获取结果，那么客户端可以通过实现 `RecoveryCallback` 接口替换原有业务逻辑，并返回相应的结果。

### 9.1.3 Stateless Retry 无状态重试

In the simplest case, a retry is just a while loop: the RetryTemplate can just keep trying until it either succeeds or fails. The RetryContext contains some state to determine whether to retry or abort, but this state is on the stack and there is no need to store it anywhere globally, so we call this stateless retry. The distinction between stateless and stateful retry is contained in the implementation of the RetryPolicy (the RetryTemplate can handle both). In a stateless retry, the callback is always executed in the same thread on retry as when it failed.

在最简单的示例中，重试仅仅是一个 while 循环：`RetryTemplate` 仅仅能保持尝试直到成功或者失败。 `RetryContext` 包含了一些状态用来决定是否重试还是中止，但是该状态是存储在内存栈中的，而不是作为一个全局属性存在，因此我们认为是无状态重试。无状态和有状态重试的区别是在于 `RetryPolicy` 的实现上（`RetryTemplate` 两种状态的处理都支持）。在无状态重试中，失败重试回调总是执行在同一个线程中。

### 9.1.4 Stateful Retry 有状态重试

Where the failure has caused a transactional resource to become invalid, there are some special considerations. This does not apply to a simple remote call because there is no transactional resource (usually), but it does sometimes apply to a database update, especially when using Hibernate. In this case it only makes sense to rethrow the exception that called the failure immediately so that the transaction can roll back and we can start a new valid one.

当故障导致事务资源变为无效时，需要做一些特殊的考虑。有状态重试并不适用于简单的远程调用，因为远程调用没有事务性资源（通常情况下），但当其被应用到数据库更新，尤其是使用Hibernate时，就显得重要了。在这种场景下，当调用失败时立即重新抛出异常以便事务可以回滚。

In these cases a stateless retry is not good enough because the re-throw and roll back necessarily involve leaving the RetryOperations.execute() method and potentially losing the context that was on the stack. To avoid losing it we have to introduce a storage strategy to lift it off the stack and put it (at a minimum) in heap storage. For this purpose Spring Batch provides a storage strategy RetryContextCache which can be injected into the RetryTemplate. The default implementation of the RetryContextCache is in memory, using a simple Map. Advanced usage with multiple processes in a clustered environment might also consider implementing the RetryContextCache with a cluster cache of some sort (though, even in a clustered environment this might be overkill).

这种请况下，一个无状态重试是不够的，因为重新抛出异常并回滚必然会离开 `RetryOperations.execute()` 方法，导致内存栈中的上下文信息丢失。为了避免丢失上下文，我们不得不使用一种存储策略将内存栈（局部的）中的信息存放到至少是内存堆（全局）一级的存储中。为此，Spring Batch 提供一种存储策略——可以注入到`RetryTemplate` 的 `RetryContextCache`。`RetryContextCache` 默认实现方式是通过使用一个简单的 `Map` 对象将其存储在内存中。集群环境中的多进程高级用法可以考虑通过集群的高速缓存来实现 `RetryContextCache`（不过在集群环境中，这种做法有点小题大做了）。

Part of the responsibility of the RetryOperations is to recognize the failed operations when they come back in a new execution (and usually wrapped in a new transaction). To facilitate this, Spring Batch provides the RetryState abstraction. This works in conjunction with a special execute methods in the RetryOperations.

`RetryOperations` 的职责之一就是在进行一个新的重试时记住失败的操作（通常被包装在一个新的事物中）。为此，Spring Batch 抽象出了 `RetryState` 接口。`RetryState` 被用在 `RetryOperations` 作为一个特殊的执行方法。

The way the failed operations are recognized is by identifying the state across multiple invocations of the retry. To identify the state, the user can provide an RetryState object that is responsible for returning a unique key identifying the item. The identifier is used as a key in the RetryContextCache.

这种方式下，失败操作被标识为状态在每次重试操作时返回。对于标识的状态，可以通过提供一个能返回唯一标识的`RetryState` 对象来定义。该标识在 `RetryContextCache` 中被当作唯一键处理。

**Warning**

Be very careful with the implementation of Object.equals() and Object.hashCode() in the key returned by RetryState. The best advice is to use a business key to identify the items. In the case of a JMS message the message ID can be used.

**注意：**通过 `RetryState` 返回 key 时，要小心 key 的 `equals()` 和 `hashCode()` 方法。最好的方式是使用一个业务键去标识。比如在使用JMS消息时，可以使用消息的ID作为key。

When the retry is exhausted there is also the option to handle the failed item in a different way, instead of calling the RetryCallback (which is presumed now to be likely to fail). Just like in the stateless case, this option is provided by the RecoveryCallback, which can be provided by passing it in to the execute method of RetryOperations.

当所有重试完成，仍然可以选择使用不同方式去替代 `RetryCallback`（RetryCallback 操作现在被假定为可能失败）去处理失败的操作。就像无状态重试下可以通过`RecoveryCallback` 接口传递对应的处理操作到 `RetryOperations` 的 execute 方法中。

The decision to retry or not is actually delegated to a regular RetryPolicy, so the usual concerns about limits and timeouts can be injected there (see below).

是否决定重试实际上是委托给 `RetryPolicy` 的，所以通常对于重试限制和超时重试可以放在`RetryPolicy` 中实现（见下文）。

## 9.2 Retry Policies 重试策略

Inside a RetryTemplate the decision to retry or fail in the execute method is determined by a RetryPolicy which is also a factory for the RetryContext. The RetryTemplate has the responsibility to use the current policy to create a RetryContext and pass that in to the RetryCallback at every attempt. After a callback fails the RetryTemplate has to make a call to the RetryPolicy to ask it to update its state (which will be stored in the RetryContext), and then it asks the policy if another attempt can be made. If another attempt cannot be made (e.g. a limit is reached or a timeout is detected) then the policy is also responsible for handling the exhausted state. Simple implementations will just throw RetryExhaustedException which will cause any enclosing transaction to be rolled back. More sophisticated implementations might attempt to take some recovery action, in which case the transaction can remain intact.

`RetryTemplate`决定重试与否是由`RetryPolicy`方法（`RetryPolicy`是通过 `RetryContext`来操作的）来决定。`RetryTemplate`通过当前的 `RetryPolicy`创建一个`RetryContext`并在每一次重试尝试时调用`RetryCallback`。回调失败后`RetryTemplate`通知`RetryPolicy`让其更新状态（状态信息存储在`RetryContext`中），并询问`RetryPolicy`是否进行可以进行下一次重试。假如重试不可用（比如到达重试次数限制或者重试超时），`RetryPolicy`将修改其状态。`RetryPolicy` 简单的实现只是抛出`RetryExhaustedException`[^correct1]这将导致所有的封闭事务回滚。更复杂的实现方式可能会试图尝试一些恢复性操作，在这种情况下，事务是保持不变的。

**Tip**

Failures are inherently either retryable or not - if the same exception is always going to be thrown from the business logic, it doesn't help to retry it. So don't retry on all exception types - try to focus on only those exceptions that you expect to be retryable. It's not usually harmful to the business logic to retry more aggressively, but it's wasteful because if a failure is deterministic there will be time spent retrying something that you know in advance is fatal.

**技巧：** 对于失败，无论是重试与否，如果业务逻辑总是抛出相同的异常，那么重试是没有意义的。因此，不要对所有的异常都进行重试，而是将重试的焦点放在那些你希望进行重试的异常上。虽然对所以异常都进行重试对于业务没有影响，但这会将时间浪费在事先已知的致命错误上。

Spring Batch provides some simple general purpose implementations of stateless RetryPolicy, for example a SimpleRetryPolicy, and the TimeoutRetryPolicy used in the example above.

Spring Batch 提供了一些无状态重试策略（RetryPolicy）的通用实现，比如上述是示例中的`SimpleRetryPolicy`（循环重试指定次数）、`TimeoutRetryPolicy` （超时时间范围内的重试）等。

The SimpleRetryPolicy just allows a retry on any of a named list of exception types, up to a fixed number of times. It also has a list of "fatal" exceptions that should never be retried, and this list overrides the retryable list so that it can be used to give finer control over the retry behavior:

`SimpleRetryPolicy` 简单重试策略允许当发生指定异常类型时进行指定次数的重试。同时可以指定在哪些致命异常上不进行重试，这些异常类型列表可被重写，以便可以更好的控制重试动作[^correct2]。

	SimpleRetryPolicy policy = new SimpleRetryPolicy();
	// Set the max retry attempts
	policy.setMaxAttempts(5);
	// Retry on all exceptions (this is the default)
	policy.setRetryableExceptions(new Class[] {Exception.class});
	// ... but never retry IllegalStateException
	policy.setFatalExceptions(new Class[] {IllegalStateException.class});

	// Use the policy...
	RetryTemplate template = new RetryTemplate();
	template.setRetryPolicy(policy);
	template.execute(new RetryCallback<Foo>() {
		public Foo doWithRetry(RetryContext context) {
			// business logic here
		}
	});
	
There is also a more flexible implementation called ExceptionClassifierRetryPolicy, which allows the user to configure different retry behavior for an arbitrary set of exception types though the ExceptionClassifier abstraction. The policy works by calling on the classifier to convert an exception into a delegate RetryPolicy, so for example, one exception type can be retried more times before failure than another by mapping it to a different policy.

还有一种被叫做`ExceptionClassifierRetryPolicy`的灵活回调策略实现，他允许用户通过抽象类`ExceptionClassifier`对任意异常集合配置不同的重试行为。该策略通过调用一个分类器将异常转换成一个代理`RetryPolicy`，这种请情况下，针对重试方法抛出的不同异常使用不同的重试策略进行重试。（如果重试方法返回成功或者其中任意一个异常重试达到了终止点，则重试终止）

例如：[^comment1]

	public static String randomException() throws Exception {
		int random = (int) (Math.random() * 10);

		if (random < 4) {
			logger.info("random={} Null Pointer", random);
			throw new NullPointerException();
		} else if (random < 10) {
			logger.info("random={} Arithmetic Excep", random);
			throw new ArithmeticException();
		}
		
		// 这段代码不会被调用 random:0-1
		logger.info("random={} ok !!!!", random);
		return "ok";
	}

	public static void testExceptionClassifierRetryPolicy() throws Exception {
		RetryTemplate template = new RetryTemplate();
		ExceptionClassifierRetryPolicy retryPolicy = new ExceptionClassifierRetryPolicy();

		Map<Class<? extends Throwable>, RetryPolicy> policyMap = Maps.newHashMap();
		
		// 如果发生空指针异常，则最大重试2ms，然后退出重试
		TimeoutRetryPolicy timeoutRetryPolicy = new TimeoutRetryPolicy();
		timeoutRetryPolicy.setTimeout(2L);
		policyMap.put(NullPointerException.class, timeoutRetryPolicy);
		
		// 如果发生 1/0 异常，则最多重试10次，然后退出重试
		SimpleRetryPolicy simpleRetryPolicy = new SimpleRetryPolicy();
		simpleRetryPolicy.setMaxAttempts(10);
		policyMap.put(ArithmeticException.class, simpleRetryPolicy);
		
		// 以上两种异常有可能交替出现，直到某一中类型的异常重试达到终止状态，或者被重试方法返回正确结果
		retryPolicy.setPolicyMap(policyMap);

		template.setRetryPolicy(retryPolicy);

		template.execute(new RetryCallback<String, Exception>() {
			@Override
			public String doWithRetry(RetryContext context) throws Exception {
				return randomException();
			}
		});
	}

Users might need to implement their own retry policies for more customized decisions. For instance, if there is a well-known, solution-specific, classification of exceptions into retryable and not retryable.

用户可能需要自己实现一些个性化的重试策略。比如一个公共的解决特定问题的异常重试机制。

## 9.3 Backoff Policies 回退策略

When retrying after a transient failure it often helps to wait a bit before trying again, because usually the failure is caused by some problem that will only be resolved by waiting. If a RetryCallback fails, the RetryTemplate can pause execution according to the BackoffPolicy in place.

当一个瞬态失败重试完成后，适当的等待一段时间是必要的，因为通常造成失败的问题被解决，只能通过等待来解决。如果重试回调失败，`RetryTemplate`可以通过`BackoffPolicy` 进行回退操作（其实就是两次重试之间如何处理的策略，可以理解成两次重试间如何衔接的策略）。

	public interface BackoffPolicy {

	    BackOffContext start(RetryContext context);

	    void backOff(BackOffContext backOffContext)
        throws BackOffInterruptedException;

	}
	
A BackoffPolicy is free to implement the backOff in any way it chooses. The policies provided by Spring Batch out of the box all use Object.wait(). A common use case is to backoff with an exponentially increasing wait period, to avoid two retries getting into lock step and both failing - this is a lesson learned from the ethernet. For this purpose Spring Batch provides the ExponentialBackoffPolicy.

可以通过实现`BackoffPolicy`接口，选择适合自己的任何方式实现回退（间隔）。Spring Batch 实现的所有开箱策略使用`Object.wait()`。一个常见的用例是，等待时间以指数级增长，这样可以避免两个重试争夺锁资源导致都失败——这是来自以太网的教训。出入这样的考虑，Spring Batch 提供了`ExponentialBackoffPolicy`（指数级回退策略）。


## 9.4 Listeners 重试监听

Often it is useful to be able to receive additional callbacks for cross cutting concerns across a number of different retries. For this purpose Spring Batch provides the RetryListener interface. The RetryTemplate allows users to register RetryListeners, and they will be given callbacks with the RetryContext and Throwable where available during the iteration.
 
通常能接收到在多个不同的重试横切关注点的回调是有用的。因此，Spring Batch 提供了`RetryListener`重试监听接口。`RetryTemplate`重试模板方法允许用户注册相应重试监听，如果有重试，那么可以通过注册的监听获取重试过程中的上下文`RetryContext`和抛出的异常。

The interface looks like this:

接口定义如下：

	public interface RetryListener {

		void open(RetryContext context, RetryCallback<T> callback);

		void onError(RetryContext context, RetryCallback<T> callback, Throwable e);

		void close(RetryContext context, RetryCallback<T> callback, Throwable e);
	}
	
The open and close callbacks come before and after the entire retry in the simplest case and onError applies to the individual RetryCallback calls. The close method might also receive a Throwable; if there has been an error it is the last one thrown by the RetryCallback.

开始重试时会回调open方法，所有重试结束后（包括RecoveryCallback）会回调close方法，每次执行重试方法失败时会回调onError方法。假如最后一个方法`RetryCallback`抛出异常，那么close方法有可能也会收到`Throwable`。
 
Note that when there is more than one listener, they are in a list, so there is an order. In this case open will be called in the same order while onError and close will be called in reverse order.

需要注意的是当有多个监听时，所有的监听都存放在 list 中，因此监听的执行是有顺序的。在 open 方法中，所有的监听按顺序被调用，但在 onError 和 close 方法中，监听执行顺序与 open 中相反。

## 9.5 Declarative Retry 声明式重试

Sometimes there is some business processing that you know you want to retry every time it happens. The classic example of this is the remote service call. Spring Batch provides an AOP interceptor that wraps a method call in a RetryOperations for just this purpose. The RetryOperationsInterceptor executes the intercepted method and retries on failure according to the RetryPolicy in the provided RepeatTemplate.

有时还有一些是你明确知道，当其每次发生时需要重试的业务逻辑。最典型的例子就是远程服务调用。为此Spring Batch 提供了一个AOP拦截器，包装了一个在`RetryOperations`中调用的方法，用来实现这目标。

Here is an example of declarative iteration using the Spring AOP namespace to repeat a service call to a method called remoteCall (for more detail on how to configure AOP interceptors see the Spring User Guide):

下面是使用Spring AOP 配置重复操作拦截器的一个示例（关于如何配置AOP拦截器请查看Spring用户指南）

	<aop:config>
		<aop:pointcut id="transactional"
			expression="execution(* com..*Service.remoteCall(..))" />
		<aop:advisor pointcut-ref="transactional"
			advice-ref="retryAdvice" order="-1"/>
	</aop:config>

	<bean id="retryAdvice" class="org.springframework.batch.retry.interceptor.RetryOperationsInterceptor"/>
		
The example above uses a default RetryTemplate inside the interceptor. To change the policies or listeners, you only need to inject an instance of RetryTemplate into the interceptor.

上面的例子使用拦截器内部默认的RetryTemplate。可以通过注入新的重试策略和监听到拦截器中，改变上述默认机制。

[^correct1]: Spring-Retry 1.2.2版本中，`RetryExhaustedException`已被替换成`ExhaustedRetryException`

[^correct2]: Spring-Retry 1.2.2版本中，可重试异常和不可执行异常数组使用 Map 替代！

[^comment1]: 译者补充的测试用例
