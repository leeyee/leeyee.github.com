---
layout: post
title: 使用javascript检测浏览器版本
description: 本文介绍如何通过分析浏览器navigator的user-agent属性来检测不同浏览器的版本信息
category: javascript
tag: [javascript]
---

* any list
{:toc}

以下浏览器版本的判断方法参考了《JavaScript 高级程序设计》第八章。

总体上我们验证浏览器及其版本是通过浏览器的**user-agent**字符串来检测的。常见的有：

> Safari： Mozilla/5.0 (Windows NT 5.1) AppleWebKit/534.57.2 (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2
    Chrome： Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.64 Safari/537.31
    IE：     Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0; InfoPath.2; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)
    Firefox：Mozilla/5.0 (Windows NT 5.1; rv:19.0) Gecko/20100101 Firefox/19.0 

因此对浏览器的版本分析都是基于该字符串中所包含的信息进行的。可以通过如下代码获取**user-agent**信息：
    
    var sUserAgent = navigator.userAgent;    

### Opera浏览器检测

    var isOpera = sUserAgent.indexOf("Opera") > -1;
    if (isOpera) {
		//检测是否进行了伪装
		if (navigator.appName == 'Opera') {
			version = parseFloat(navigator.appVersion);//没有伪装，直接获取版本号
		} else {
			var reOperaVersion = new RegExp("Opera (\\d+.\\d+)");
            //使用正则表达式的test方法测试并将版本号保存在RegExp.$1中
			reOperaVersion.test(sUserAgent);
			version = parseFloat(RegExp['$1']);
		}
	}

### Google Chrome浏览器检测

    var isChrome = sUserAgent.indexOf("Chrome") > -1;
	if (isChrome) {
		var reChorme = new RegExp("Chrome/(\\d+\\.\\d+(?:\\.\\d+\\.\\d+))?");
		reChorme.test(sUserAgent);
        version = parseFloat(RegExp['$1']);
	}

### IE浏览器检测

    // !isOpera 避免是由Opera伪装成的IE  
    var isIE = sUserAgent.indexOf("compatible") > -1
			&& sUserAgent.indexOf("MSIE") > -1 && !isOpera;
	if (isIE) {
		var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
		reIE.test(sUserAgent);
		version = parseFloat(RegExp['$1']);
	}


### Konqueror/Safari 浏览器检测

    //排除Chrome信息，因为在Chrome的user-agent字符串中会出现Konqueror/Safari的关键字
    var isKHTML = (sUserAgent.indexOf("KHTML") > -1
			|| sUserAgent.indexOf("Konqueror") > -1 || sUserAgent
			.indexOf("AppleWebKit") > -1)
			&& !isChrome;

	if (isKHTML) {//判断是否基于KHTML，如果是的话在继续判断属于何种KHTML浏览器
		var isSafari = sUserAgent.indexOf("AppleWebKit") > -1;
		var isKonq = sUserAgent.indexOf("Konqueror") > -1;

		if (isSafari) {
			var reAppleWebKit = new RegExp("Version/(\\d+(?:\\.\\d*)?)");
			reAppleWebKit.test(sUserAgent);
			var fAppleWebKitVersion = parseFloat(RegExp["$1"]);
			version = parseFloat(RegExp['$1']);
		} else if (isKonq) {
			var reKong = new RegExp(
					"Konqueror/(\\d+(?:\\.\\d+(?\\.\\d)?)?)");
			reKong.test(sUserAgent);
			version = parseFloat(RegExp['$1']);
		}
	}

### Mozilla FireFox浏览器检测

    //排除Chrome 及Konqueror/Safari的伪装
	var isMoz = sUserAgent.indexOf("Gecko") > -1 && !isChrome && !isKHTML;
	if (isMoz) {
		var reMoz = new RegExp("rv:(\\d+\\.\\d+(?:\\.\\d+)?)");
		reMoz.test(sUserAgent);
		version = parseFloat(RegExp['$1']);
	}

基本上浏览器的判断就到此为止，其他浏览器不做说明。可以使用

    console.info(navigator.userAgent);  

提示的信息具体分析相应浏览器的**user-agent**，然后进行过处理获取浏览器个性信息及版本。

### 完整的代码

    var broswer = function() {
		var _broswer = {};
		var sUserAgent = navigator.userAgent;
		console.info("useragent: ", sUserAgent);

		var isOpera = sUserAgent.indexOf("Opera") > -1;
		if (isOpera) {
			//首先检测Opera是否进行了伪装
			if (navigator.appName == 'Opera') {
                //如果没有进行伪装，则直接后去版本号
				_broswer.version = parseFloat(navigator.appVersion);
			} else {
				var reOperaVersion = new RegExp("Opera (\\d+.\\d+)");
                //使用正则表达式的test方法测试并将版本号保存在RegExp.$1中
				reOperaVersion.test(sUserAgent);
				_broswer.version = parseFloat(RegExp['$1']);
			}
			_broswer.opera = true;
		}

		var isChrome = sUserAgent.indexOf("Chrome") > -1;
		if (isChrome) {
			var reChorme = new RegExp("Chrome/(\\d+\\.\\d+(?:\\.\\d+\\.\\d+))?");
			reChorme.test(sUserAgent);
			_broswer.version = parseFloat(RegExp['$1']);
			_broswer.chrome = true;
		}

		//排除Chrome信息，因为在Chrome的user-agent字符串中会出现Konqueror/Safari的关键字
		var isKHTML = (sUserAgent.indexOf("KHTML") > -1
				|| sUserAgent.indexOf("Konqueror") > -1 || sUserAgent
				.indexOf("AppleWebKit") > -1)
				&& !isChrome;

		if (isKHTML) {//判断是否基于KHTML，如果时的话在继续判断属于何种KHTML浏览器
			var isSafari = sUserAgent.indexOf("AppleWebKit") > -1;
			var isKonq = sUserAgent.indexOf("Konqueror") > -1;

			if (isSafari) {
				var reAppleWebKit = new RegExp("Version/(\\d+(?:\\.\\d*)?)");
				reAppleWebKit.test(sUserAgent);
				var fAppleWebKitVersion = parseFloat(RegExp["$1"]);
				_broswer.version = parseFloat(RegExp['$1']);
				_broswer.safari = true;
			} else if (isKonq) {
				var reKong = new RegExp(
						"Konqueror/(\\d+(?:\\.\\d+(?\\.\\d)?)?)");
				reKong.test(sUserAgent);
				_broswer.version = parseFloat(RegExp['$1']);
				_broswer.konqueror = true;
			}
		}

		// !isOpera 避免是由Opera伪装成的IE  
		var isIE = sUserAgent.indexOf("compatible") > -1
				&& sUserAgent.indexOf("MSIE") > -1 && !isOpera;
		if (isIE) {
			var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
			reIE.test(sUserAgent);
			_broswer.version = parseFloat(RegExp['$1']);
			_broswer.msie = true;
		}

		// 排除Chrome 及 Konqueror/Safari 的伪装
		var isMoz = sUserAgent.indexOf("Gecko") > -1 && !isChrome && !isKHTML;
		if (isMoz) {
			var reMoz = new RegExp("rv:(\\d+\\.\\d+(?:\\.\\d+)?)");
			reMoz.test(sUserAgent);
			_broswer.version = parseFloat(RegExp['$1']);
			_broswer.mozilla = true;
		}
		return _broswer;
	}
    
    // 调用
    var broswer = broswer();
	console.info("broswer.version: ", broswer.version);
	console.info("broswer.msie is ", broswer.msie);
	console.info("broswer.safari is ", broswer.safari);
	console.info("broswer.opera is ", broswer.opera);
	console.info("broswer.mozilla is ", broswer.mozilla);
	console.info("broswer.chrome is ", broswer.chrome);
    console.info("broswer.konqueror is ", broswer.konqueror);
