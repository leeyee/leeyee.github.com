$(function() {
	$("pre").addClass("prettyprint  linenums");
	$.getScript('/js/prettify/prettify.js', function() {
		prettyPrint();
	});
});