---
layout: post
title: javascript身份证号码验证
description: 根据身份证号码的生成规则，对其使用javascript进行有效性验证。从而可以在web应用中针对用户输入的身份证号码进行客户端验证
category: javascript
tag: [javascript]
keywords: [javascript身份证号码验证, 身份证号码验证, 身份证号码验证号码生成算法]
---

##15位身份证号码编码规则

	ddddddyymmddxxp

1. dddddd: 地区码
2. yymmdd: 出生年月日
3. xx: 顺序类编码，无法确定
4. p: 性别。奇数位男，偶数为女

##18位身份证号码编码规则

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
    

比如我们有一为 _330304197002051590_ 的身份证号，那么最后一位校验位 **0** 的验证过程就如下：

1. 加权求和

    3×7 + 3×9 + 0×10 + 3×5 + 0×8 + 4×4 + 1×2 + 9×1 + 7×6 + 0×3 + 0×7 + 2×9 + 0×10 + 5×5 + 1×8 + 5×4 + 9×2  = **221**
        
2. 求模

    221 % 11 = 1

3. 获取验证位数值

    Y[1] = 0

## javascript的实现

针对15身份证号的验证，只需要验证其出生日期是否正确即可。而对于18位身份证号的验证除了验证出生日还需要进行校验位的验证。因此基于上述规则进行javascript编码，

	function getIdCardInfo(cardNo){
		var info = {
			isTrue : false,
			year : null,
			month : null,
			day : null,
			isMale : false,
			isFemale : false
		};
		if(!cardNo && 15 != cardNo.length && 18 != cardNo.length){
			info.isTrue = false;
			return info;
		}
		
		if(15 == cardNo.length){
			var year =  cardNo.substring(6,8);  
			var month = cardNo.substring(8,10);  
			var day = cardNo.substring(10,12);
			var p = cardNo.substring(14,15)
			var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day));  
			// 对于老身份证中的年龄则不需考虑千年虫问题而使用getYear()方法  
			if(temp_date.getYear()!=parseFloat(year)  
				||temp_date.getMonth()!=parseFloat(month)-1  
				||temp_date.getDate()!=parseFloat(day)){  
                info.isTrue = false;
			}else{  
				info.isTrue = true;
				info.year = year;
				info.month = month;
				info.day = day;
				if(p % 2 == 0){
					info.isFemale = true; 
					info.isMale = false;
				}else{
					info.isFemale = false; 
					info.isMale = true
				}
			}
			return info;
		}
		
		var Wi = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1 ];// 加权因子  
		var Y = [ 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ];// 身份证验证位值.10代表X 

		if(18 == cardNo.length){
			var year =  cardNo.substring(6,10);  
			var month = cardNo.substring(10,12);  
			var day = cardNo.substring(12,14); 
			var p = cardNo.substring(14,17)
			var temp_date = new Date(year,parseFloat(month)-1,parseFloat(day)); 
			// 这里用getFullYear()获取年份，避免千年虫问题
			if(temp_date.getFullYear()!=parseFloat(year)  
				||temp_date.getMonth()!=parseFloat(month)-1  
				||temp_date.getDate()!=parseFloat(day)){  
				info.isTrue = false;
				return info;
			}
			
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
			
			if(_cardNo[17] != Y[i]){
				return info.isTrue = false;
			}
			
			info.isTrue = true;
			info.year = year;
			info.month = month;
			info.day = day;
			if(p % 2 == 0){
				info.isFemale = true; 
				info.isMale = false;
			}else{
				info.isFemale = false; 
				info.isMale = true
			}
			return info;
		}
		return info;
	}
	window.onload = function(){
		var info = getIdCardInfo('13073119830715576X');
		console.log(info);
		
	}
