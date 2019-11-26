---
layout: post
title: jQuery eTable Plugin
description: 基于jQuery的简单table元素操作插件。该插件使用jQuery对针对table元素的行列添加及行列删除等常用操作进行了封装，形成了一些简单的API方法，方便在实际开发过程中的简单调用。
category: javascript
tag: [javascript, jQuery]
github: 'eTable'
---

* any list
{:toc}

很多时候我们需要对页面上的表格进行添加一行，删除一行这样的基本操作。如果我们使用原生的javascrip来写会很不方便。为了解决这个问题我们封装了一些常规的页面表格处理方式，集成到jQuery中，方面我们后续使用。

如此，jQuery eTable Plugin 便应运而生了。该套函数库提供对表格操作的一些基本方法。其实质是通过`$(table).eTable()`获取封装了表格元素的`ETable`对象，同时.`eTable`对象封装了一些列针对表格行列进行操作的方法。使用这些方法可以对表格进行行列的插入与删除。

可以通过如下方式获取页面表格对象：

    var $eTable = $("#table1").eTable();
    var $eTable = $(document.getElementById('table1')).eTable();
    
获取table对象后就可进行相应的操作了，具体API信息如下：

## API

### **.getRows()** 获取表格行数.

    var rows = $eTable.getRows();
    
### **.getCols()** 获取表格的列数.

    var cols = $eTable.getCols();

### **.appendRow()** 追加行.

    var cells = ['cell1','cell2','cell3'];
    var cells1 = [
        $("<input type='text'/>").blur(function() {
            alert(this.value);
        }),
        "<input type='radio' />"
    ];
    $eTable.appendRow(cells);
    $eTable.appendRow(cells1);

### **.insertToFirstRow()** 在首行前插入一行.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToFristRow();

### **.insertToLastRow()** 在尾行后插入一行.同`.appendRow()`方法

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToLastRow(cells);

### **.insertBeforeRow()** 在指定行前插入一行.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.insertBeforeRow(3,cells); // 在第3行前插入
    
### **.insertAfterRow()** 在指定行后插入一行.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.insertAfterRow(3,cells); // 在第3行后插入

### **.deleteFirstRow()** 删除首行.
    
    $eTable.deleteFirstRow();
    
### **.deleteLastRow()** 删除尾行.
    
    $eTable.deleteLastRow();

### **.deleteRow()** 删除指定行.删除第一行为`deleteRow(0);`.

    var ches = $("table :checked");
    var iLen = ches.length;
    if (iLen === 0) {
        alert("Please select Delete Rows");
        return;
    }
    for (var i = 0; i < iLen; i++) {
        var index = ches[i].parentNode.parentNode.rowIndex;
        $eTable.deleteRow(index);
    }

### **.deleteRows()** 批量删除行.

    var rowIndexs = [0, 2, 3];
    $eTable.deleteRows(rowIndexs); //删除第1、3、4行

### **.appendCol()** 在尾列后追加一列.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.appendCol(cells);

### **.insertToFirstCol()** 在首列前插入一列.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToFirstCol(cells);  

### **.insertToLastCol()** 在尾列后插入一列.同`.appendCol()`方法.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToLastCol(cells);    

### **.insertBeforeCol()** 在指定列前插入一列.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertBeforeCol(2,cells); //在第2列前插入
    
### **.insertAfterCol()** 在指定列后插入一列.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertAfterCol(2,cells); //在第2列后插入

### **.deleteFirstCol()** 删除首列.
    
    $eTable.deleteFirstCol();

### **.deleteLastCol()** 删除尾列
    
    $eTable.deleteLastCol();
    
### **.deleteCol()** 删除指定列.删除第一列为`deleteCol(0);`.
    
    $eTable.deleteCol(3); //删除第4列
    
### **.deleteCols()** 批量删除列.

    var colIndexs = [0,2,3];
    $eTable.deleteCols(colIndexs); //删除第1,3,4行
