---
title: javascript身份证号码验证
date: 2013-07-31
description: 根据身份证号码的生成规则，对其使用javascript进行有效性验证。从而可以在web应用中针对用户输入的身份证号码进行客户端验证
categories: "javascript"
tags: ["javascript"]
slug: 'javascript-idcard-validate'
aliases: ['/blog/2013/07/31/javascript-idcard-validate.html']
---

{{< github repo="oxcow/id-number-validator" >}}

## 15位身份证号码编码规则

    ddddddyymmddxxp

1. dddddd: 地区码
2. yymmdd: 出生年月日
3. xx: 顺序类编码，无法确定
4. p: 性别。奇数位男，偶数为女

## 18位身份证号码编码规则

    ddddddyyyymmddxxxy
    
1. dddddd: 地区码
2. yyyymmdd: 出生年月日
3. xxx：顺序类编码，无法确定。奇数为男，偶数为女
4. y: 校验位。可通过前17位计算获取

### 校验规则

1. 加权因子**W<sub>i</sub>**

    从右到左依次定义为：

    > **W<sub>i</sub> = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1]**

2. 校验位值
    
    > **Y = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ]**

    其中 *10* 身份证中用 *X* 替代。

3. 校验位位置

    > **Y_P = mod(&#931;(A<sub>i</sub>+W<sub>i</sub>),11)**

    其中下标 **i** 为身份证号码 **从右往左** 的 2...8 位;  **A<sub>i</sub>**为身份证号对应位数值。
    
    该公式表示将身份证的前17位与其对应的加权因子 **W<sub>i</sub>** 相乘并求和，再将得到的结果与 11 求模，所得的结果即为校验位值所在的位置。然后直接在校验位值 **Y** 中查找即可得到校验位值.
    

比如有一为 _330304197002051590_ 的身份证号，那么最后一位校验位 **0** 的验证过程如下：

1. 加权求和

    3×7 + 3×9 + 0×10 + 3×5 + 0×8 + 4×4 + 1×2 + 9×1 + 7×6 + 0×3 + 0×7 + 2×9 + 0×10 + 5×5 + 1×8 + 5×4 + 9×2  = **221**
        
2. 求模

    221 % 11 = 1

3. 获取验证位数值

    Y[1] = 0

## javascript编码实现

针对上述身份证生成规则的描述，在验证时针对15位身份证号只需要判断其出生日期是否正确即可；而针对18位身份证号，除了验证出生日期外还需要对最后的校验位进行验证。

因此我们命名一个名为`getIdCardInfo`的函数，接受身份证号作为参数进行验证。该函数返回身份证信息对象。该对象具有5个属性，分别为：

> 1. isTrue : 身份证号是否有效。默认为 false
> 2. year : 出生年。默认为null
> 3. month : 出生月。默认为null
> 4. day : 出生日。默认为null
> 5. isMale : 是否为男性。默认false
> 6. isFemale : 是否为女性。默认false

### 源代码

您可进入[该项目的GitHub页](https://github.com/oxcow/id-number-validator)进行下载或贡献

	function getIdCardInfo(cardNo) {
		var info = {
			isTrue : false,
			year : null,
			month : null,
			day : null,
			isMale : false,
			isFemale : false
		};
		if (!cardNo || (15 != cardNo.length && 18 != cardNo.length) ) {
			info.isTrue = false;
			return info;
		}
		if (15 == cardNo.length) {
			var year = cardNo.substring(6, 8);
			var month = cardNo.substring(8, 10);
			var day = cardNo.substring(10, 12);
			var p = cardNo.substring(14, 15); //性别位
			var birthday = new Date(year, parseFloat(month) - 1,
					parseFloat(day));
			// 对于老身份证中的年龄则不需考虑千年虫问题而使用getYear()方法  
			if (birthday.getYear() != parseFloat(year)
					|| birthday.getMonth() != parseFloat(month) - 1
					|| birthday.getDate() != parseFloat(day)) {
				info.isTrue = false;
			} else {
				info.isTrue = true;
				info.year = birthday.getFullYear();
				info.month = birthday.getMonth() + 1;
				info.day = birthday.getDate();
				if (p % 2 == 0) {
					info.isFemale = true;
					info.isMale = false;
				} else {
					info.isFemale = false;
					info.isMale = true
				}
			}
			return info;
		}
		if (18 == cardNo.length) {
			var year = cardNo.substring(6, 10);
			var month = cardNo.substring(10, 12);
			var day = cardNo.substring(12, 14);
			var p = cardNo.substring(14, 17)
			var birthday = new Date(year, parseFloat(month) - 1,
					parseFloat(day));
			// 这里用getFullYear()获取年份，避免千年虫问题
			if (birthday.getFullYear() != parseFloat(year)
					|| birthday.getMonth() != parseFloat(month) - 1
					|| birthday.getDate() != parseFloat(day)) {
				info.isTrue = false;
				return info;
			}
			var Wi = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1 ];// 加权因子  
			var Y = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ];// 身份证验证位值.10代表X 
			// 验证校验位
			var sum = 0; // 声明加权求和变量
			var _cardNo = cardNo.split("");

			if (_cardNo[17].toLowerCase() == 'x') {
				_cardNo[17] = 10;// 将最后位为x的验证码替换为10方便后续操作  
			}
			for ( var i = 0; i < 17; i++) {
				sum += Wi[i] * _cardNo[i];// 加权求和  
			}
			var i = sum % 11;// 得到验证码所位置

			if (_cardNo[17] != Y[i]) {
				return info.isTrue = false;
			}
			info.isTrue = true;
			info.year = birthday.getFullYear();
			info.month = birthday.getMonth() + 1;
			info.day = birthday.getDate();
			if (p % 2 == 0) {
				info.isFemale = true;
				info.isMale = false;
			} else {
				info.isFemale = false;
				info.isMale = true
			}
			return info;
		}
		return info;
	}


<script type='text/javascript'>
    function getIdCardInfo(cardNo) {
		var info = {
			isTrue : false,
			year : null,
			month : null,
			day : null,
			isMale : false,
			isFemale : false
		};
		if (!cardNo && 15 != cardNo.length && 18 != cardNo.length) {
			info.isTrue = false;
			return info;
		}
		if (15 == cardNo.length) {
			var year = cardNo.substring(6, 8);
			var month = cardNo.substring(8, 10);
			var day = cardNo.substring(10, 12);
			var p = cardNo.substring(14, 15); //性别位
			var birthday = new Date(year, parseFloat(month) - 1,
					parseFloat(day));
			// 对于老身份证中的年龄则不需考虑千年虫问题而使用getYear()方法  
			if (birthday.getYear() != parseFloat(year)
					|| birthday.getMonth() != parseFloat(month) - 1
					|| birthday.getDate() != parseFloat(day)) {
				info.isTrue = false;
			} else {
				info.isTrue = true;
				info.year = birthday.getFullYear();
				info.month = birthday.getMonth() + 1;
				info.day = birthday.getDate();
				if (p % 2 == 0) {
					info.isFemale = true;
					info.isMale = false;
				} else {
					info.isFemale = false;
					info.isMale = true
				}
			}
			return info;
		}
		if (18 == cardNo.length) {
			var year = cardNo.substring(6, 10);
			var month = cardNo.substring(10, 12);
			var day = cardNo.substring(12, 14);
			var p = cardNo.substring(14, 17)
			var birthday = new Date(year, parseFloat(month) - 1,
					parseFloat(day));
			// 这里用getFullYear()获取年份，避免千年虫问题
			if (birthday.getFullYear() != parseFloat(year)
					|| birthday.getMonth() != parseFloat(month) - 1
					|| birthday.getDate() != parseFloat(day)) {
				info.isTrue = false;
				return info;
			}
			var Wi = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1 ];// 加权因子  
			var Y = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ];// 身份证验证位值.10代表X 
			// 验证校验位
			var sum = 0; // 声明加权求和变量
			var _cardNo = cardNo.split("");

			if (_cardNo[17].toLowerCase() == 'x') {
				_cardNo[17] = 10;// 将最后位为x的验证码替换为10方便后续操作  
			}
			for ( var i = 0; i < 17; i++) {
				sum += Wi[i] * _cardNo[i];// 加权求和  
			}
			var i = sum % 11;// 得到验证码所位置

			if (_cardNo[17] != Y[i]) {
				return info.isTrue = false;
			}
			info.isTrue = true;
			info.year = birthday.getFullYear();
			info.month = birthday.getMonth() + 1;
			info.day = birthday.getDate();
			if (p % 2 == 0) {
				info.isFemale = true;
				info.isMale = false;
			} else {
				info.isFemale = false;
				info.isMale = true
			}
			return info;
		}
		return info;
	}
</script>
<script type="text/javascript">
    function validateNo(){
        var cardNo = document.getElementById('cardNo').value;
        var cardInfo = getIdCardInfo(cardNo);
        var showInfo = '';
        if(cardInfo.isTrue){
             showInfo = '<span class="text-success">验证通过！</span>';
             if(cardInfo.isMale){
                showInfo += '<span class="text-info">男,生于	' + cardInfo.year + '.' + cardInfo.month + '.' + cardInfo.day + '</span>';
             }
             if(cardInfo.isFemale){
                showInfo += '<span class="text-info">女,生于	' + cardInfo.year + '.' + cardInfo.month + '.' + cardInfo.day + '</span>';
             }
        }else{
            showInfo = '<span class="text-error">号码无效！</span>';
        }
        document.getElementById('cardInfo').innerHTML = showInfo;
    }
</script>

### 验证示例

<div class="row-fluid">
	<div class="input-append">
  		<input id='cardNo' type="text" placeholder="请输入身份证号码...">
  		<button class="btn" onclick="validateNo();">验证</button>
	</div>
	<div id="cardInfo" style="margin-left:20px;display:inline"></div>
</div>