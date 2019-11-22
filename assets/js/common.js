$(function () {
    $("pre").addClass('code');
    $('#markdown-toc').addClass('nav');
    $('#markdown-toc').hide();
    $('#markdown-toc ul').addClass('nav');
    $("#markdown-toc li").addClass('nav-item');
    
    // 表格
    $("table").addClass("table table-hover table-scroll");
    
    // 文章的链接做弹出式访问
    $.each($("#article_content a"), function (idx, ele) {
        var href = $(ele).attr("href");
        var _target = $(ele).attr("target");
        if (href && href.indexOf("#") != 0 && !_target) {
            $(ele).attr("target", "_blank");
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
        $('html, body').animate({scrollTop:0}, scrollSpeed);
        return false;
    });

    $('#coyprightModal_btn').click(function(){
        $('#coyprightModal').addClass("active");
    });

    $("#coyprightModal .btn-link").click(function(){
        $('#coyprightModal').removeClass("active");
    });

});