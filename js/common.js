$(function() {
	// 代码高亮
	$("pre").addClass("prettyprint  linenums");
	$.getScript('/js/prettify/prettify.js', function() {
		prettyPrint();
	});

	// 文章的链接做弹出式访问
	$.each($("#j_article a"), function(idx, ele) {
		var href = $(ele).attr("href");
		if (href && href.indexOf("#") != 0) {
			$(ele).attr("target", "_blank");
			$(ele).append("<i class='icon-share'>");
		}
	});
});