---
layout: post
title: jQuery eTable Plugin
category: jQuery
tag: [javascript,jQuery]
description: 基于jQuery的简单table元素操作插件
keywords: [jQuery table]
---


jQuery eTable Plugin 提供对表格操作的一些基本方法.其实质是通过`$(table).eTable()`获取封装了表格元素的`ETable`对象.`eTable`对象封装了一些列针对表格行列进行操作的方法。使用这些方法可以对表格进行行列的插入与删除。

###eTable对象的获取

    var $eTable = $("#table1").eTable();
    var $eTable = $(document.getElementById('table1')).eTable();
    
###eTable API

####**.getRows()** 获取表格行数.

    var rows = $eTable.getRows();
    
####**.getCols()** 获取表格的列数.

    var cols = $eTable.getCols();

####**.appendRow()** 追加行.

    var cells = ['cell1','cell2','cell3'];
    var cells1 = [
        $("<input type='text'/>").blur(function() {
            alert(this.value);
        }),
        "<input type='radio' />"
    ];
    $eTable.appendRow(cells);
    $eTable.appendRow(cells1);

####**.insertToFirstRow()** 在首行前插入一行.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToFristRow();

####**.insertToLastRow()** 在尾行后插入一行.同`.appendRow()`方法

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToLastRow(cells);

####**.insertBeforeRow()** 在指定行前插入一行.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.insertBeforeRow(3,cells); // 在第3行前插入
    
####**.insertAfterRow()** 在指定行后插入一行.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.insertAfterRow(3,cells); // 在第3行后插入

####**.deleteFirstRow()** 删除首行.
    
    $eTable.deleteFirstRow();
    
####**.deleteLastRow()** 删除尾行.
    
    $eTable.deleteLastRow();

####**.deleteRow()** 删除指定行.删除第一行为`deleteRow(0);`.

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

####**.deleteRows()** 批量删除行.

    var rowIndexs = [0, 2, 3];
    $eTable.deleteRows(rowIndexs); //删除第1、3、4行

####**.appendCol()** 在尾列后追加一列.
    
    var cells = ['cell1','cell2','cell3'];
    $eTable.appendCol(cells);

####**.insertToFirstCol()** 在首列前插入一列.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToFirstCol(cells);  

####**.insertToLastCol()** 在尾列后插入一列.同`.appendCol()`方法.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertToLastCol(cells);    

####**.insertBeforeCol()** 在指定列前插入一列.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertBeforeCol(2,cells); //在第2列前插入
    
####**.insertAfterCol()** 在指定列后插入一列.

    var cells = ['cell1','cell2','cell3'];
    $eTable.insertAfterCol(2,cells); //在第2列后插入

####**.deleteFirstCol()** 删除首列.
    
    $eTable.deleteFirstCol();

####**.deleteLastCol()** 删除尾列
    
    $eTable.deleteLastCol();
    
####**.deleteCol()** 删除指定列.删除第一列为`deleteCol(0);`.
    
    $eTable.deleteCol(3); //删除第4列
    
####**.deleteCols()** 批量删除列.

    var colIndexs = [0,2,3];
    $eTable.deleteCols(colIndexs); //删除第1,3,4行
