$(function () {
    // 代码高亮
    $("pre").addClass("prettyprint linenums");
    $.getScript('http://apps.bdimg.com/libs/prettify/r298/prettify.min.js', function () {
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

    // When to show the scroll link
    // higher number = scroll link appears further down the page
    var upperLimit = 1000;
    // Our scroll link element
    var scrollElem = $('#totop');
    // Scroll to top speed
    var scrollSpeed = 500;
    // Show and hide the scroll to top link based on scroll position
    scrollElem.hide();
    $(window).scroll(function () {
        var scrollTop = $(document).scrollTop();
        if ( scrollTop > upperLimit ) {
            $(scrollElem).stop().fadeTo(300, 1); // fade back in
        }else{
            $(scrollElem).stop().fadeTo(300, 0); // fade out
        }
    });
    // Scroll to top animation on click
    $(scrollElem).click(function(){
        $('html, body').animate({scrollTop:0}, scrollSpeed); return false;
    });

    $('.dropdown-toggle').dropdown()
});