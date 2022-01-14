const SHOW_ANCHOR_OFFSET = 40;

$(function () {

  //MathJax.Extension.MathZoom = true;
  //MathJax.Extension.MathMenu = true;

  // 目录
  const $markdownToc = $('#markdown-toc');
  const $rightToc = $('#article_toc');

  let isHideRightToc = () => {
    return $rightToc.css('display') === 'none';
  }

  if ($markdownToc.length) {
    $markdownToc.addClass("menu-list is-size-7");
    $markdownToc.find('ul').addClass('menu-list');
    $rightToc.find("p:first").after($markdownToc);
  } else {
    $rightToc.find("p:first").remove();
  }

  // 表格
  $("article.content table").addClass("table is-bordered is-narrow");

  // 文章的链接做弹出式访问
  $.each($("article.content a"), function (idx, ele) {
    const href = $(ele).attr("href");
    const _target = $(ele).attr("target");
    if (href && href.indexOf("#") != 0 && !_target) {
      $(ele).attr("target", "_blank");
    }
  });

  // 收集锚点位置信息。只收集一次，不考虑页面变化导致的锚点位置变化的问题。
  const anchorMap = new Map();
  $.each($markdownToc.find('a'), function (idx, ele) {
    const anchorName = decodeURIComponent($(ele).attr("href"));
    const anchorOffset = $(anchorName).offset().top;
    anchorMap.set(anchorOffset, anchorName.substr(1));
  });

  // 添加滚动事件。到达锚点附近时点亮右边对应的目录标题
  if (anchorMap.size) {
    // 缓存当前已经点亮的标题
    let currentAnchorOffset = 0;
    const anchors = [...anchorMap.keys()];
    $(document).bind('scroll', function () {
      const scrollTop = $(this).scrollTop();
      if (isHideRightToc() || Math.abs(currentAnchorOffset - scrollTop) < SHOW_ANCHOR_OFFSET) {
        return;
      }
      const targetAnchors = anchors.filter(anchorOffset => Math.abs(anchorOffset - scrollTop) < SHOW_ANCHOR_OFFSET);
      if (targetAnchors.length) {
        console.info("Reach Anchor", targetAnchors);
        currentAnchorOffset = targetAnchors[0];
        const topAnchorName = anchorMap.get(targetAnchors[0]);
        $rightToc.find('a').removeClass("is-active");
        $(`#article_toc #markdown-toc-${topAnchorName}`).addClass("is-active");
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {
    // Add a click event on each of them
    $navbarBurgers.forEach(el => {
      el.addEventListener('click', () => {
        // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);
        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');
      });
    });
  }
});