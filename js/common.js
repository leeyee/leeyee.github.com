$(function () {
    // 代码高亮
    $("pre").addClass("prettyprint  linenums");
    $.getScript('/js/prettify/prettify.js', function () {
        prettyPrint();
    });

    // 表格
    $("table").addClass("table table-bordered");

    // 文章的链接做弹出式访问
    $.each($("#j_article a"), function (idx, ele) {
        var href = $(ele).attr("href");
        var _target = $(ele).attr("target");
        if (href && href.indexOf("#") != 0 && !_target) {
            $(ele).attr("target", "_blank");
            //$(ele).append("<span class='glyphicon glyphicon-new-window' />");
        }
    });
});