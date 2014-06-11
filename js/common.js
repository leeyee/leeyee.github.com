$(function() {
	// 代码高亮
	$("pre").addClass("prettyprint  linenums");
	$.getScript('/js/prettify/prettify.js', function() {
		prettyPrint();
	});

    $("table").addClass("table table-bordered");

	// 文章的链接做弹出式访问
	$.each($("#j_article a"), function(idx, ele) {
		var href = $(ele).attr("href");
		var _target = $(ele).attr("target");
		if (href && href.indexOf("#") != 0 && !_target) {
			$(ele).attr("target", "_blank");
			$(ele).append("<i class='icon-share' />");
		}
	});

	// 抓取文章标题h2-h6
	var $allH2_6 = $("#j_article").find("h2, h3, h4, h5, h6");
	if ($allH2_6.length) {
		var frag = document.createDocumentFragment(); // 创建文档碎片
		$.each($allH2_6, function(idx, ele) {
			var hNo = parseInt(ele.tagName.replace(/[a-z]/ig, ""));
			var $a = $("<a>").attr("data-top", $(ele).offset().top).text(
					$(ele).text()).bind(
					"click.autoTitle",
					function() {
						var _top = parseInt($(this).attr("data-top"))
								+ parseInt($("#j_dir_content").height()) - 40;
						$('body, html').animate({
							scrollTop : _top
						}, 800, 'swing');
					});

			var $div = $("<div>").css({
				'margin-left' : (20 * hNo - 30)
			}).append($a);

			$(frag).append($div);
		});
		var $h1 = $("#j_article").find("h1")
		if ($h1) {
			$("#j_dir").text($h1.text()).append(
					'<abbr title="文章标题结构" class="initialism">(?)</abbr>');
		}
		$('.autoTitle').show();
		$("#j_dir_content").append(frag);
		$("#j_dir").css("cursor", "pointer").bind("click.autoTitle",
				function() {
					$("#j_dir_content").slideToggle(800);
				});
	}
});