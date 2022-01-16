'use strict';

const SHOW_ANCHOR_OFFSET = 40;
const LIGHT_CSS_CLASSES="has-text-primary-dark has-text-weight-bold";

const toggleGoTop = (scrollTop) => {
  if (scrollTop > 50) {
    $(".go-top").removeClass('is-hidden');
  } else {
    $(".go-top").addClass("is-hidden");
  }
};

const addScrollEventListener = (func) => {
  $(document).bind('scroll', func);
};

const removeScrollEventListener = () => {
  $(document).unbind('scroll');
}

$(function () {

  const $article = $("article.content");

  // 表格
  $article.find("table").addClass("table is-bordered is-narrow");

  // 文章的链接做弹出式访问
  $.each($article.find("a"), function (idx, ele) {
    const href = $(ele).attr("href");
    const _target = $(ele).attr("target");
    if (href && href.indexOf("#") != 0 && !_target) {
      $(ele).attr("target", "_blank");
    }
  });

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

  // 收集锚点位置信息。只收集一次，不考虑页面变化导致的锚点位置变化的问题。
  const anchorMap = new Map();
  $.each($markdownToc.find('a'), function (idx, ele) {
    const anchorName = decodeURIComponent($(ele).attr("href"));
    const anchorOffset = $(anchorName).offset().top;
    anchorMap.set(anchorOffset, anchorName.substr(1));
  });

  // 缓存当前已经点亮的标题
  let currentAnchorOffset = 0;
  const anchors = [...anchorMap.keys()];

  const lightAnchor = (scrollTop) => {
    if (isHideRightToc() || Math.abs(currentAnchorOffset - scrollTop) < SHOW_ANCHOR_OFFSET) {
      return;
    }
    const targetAnchors = anchors.filter(anchorOffset => Math.abs(anchorOffset - scrollTop) < SHOW_ANCHOR_OFFSET);
    if (targetAnchors.length) {
      console.debug("Reach Anchor", targetAnchors);
      currentAnchorOffset = targetAnchors[0];
      const topAnchorName = anchorMap.get(targetAnchors[0]);
      $rightToc.find('a').removeClass(LIGHT_CSS_CLASSES);
      $(`#article_toc #markdown-toc-${topAnchorName}`).addClass(LIGHT_CSS_CLASSES);
    }
  };

  const scrollHandler = () => {
    const scrollTop = $(this).scrollTop();
    toggleGoTop(scrollTop);
    if (anchorMap.size) {
      lightAnchor(scrollTop);
    }
  }

  // 添加滚动事件。到达锚点附近时点亮右边对应的目录标题
  addScrollEventListener(scrollHandler);

  // 重置右侧导航为初始状态
  const resetRightToc = () => {
    $rightToc.find('a').removeClass(LIGHT_CSS_CLASSES);
    removeScrollEventListener();
    currentAnchorOffset = 0;
  };

  // 回到顶部
  $('.go-top').bind('click', function (e) {
    e.preventDefault();
    resetRightToc();
    $('html').animate({scrollTop: 0}, 'slow', () => {
      addScrollEventListener(scrollHandler);
    });
  });

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