$(function($) {
    $(document).scroll(function() {
        var distanceTop = $(document).scrollTop();
        if(distanceTop >= 800) {
            $("#return-top").fadeIn();
        } else {
            $("#return-top").fadeOut();
        }
    });
    $("#return-top").click(function() {
        $("html, body").animate({
            scrollTop: $($(this).attr("href")).offset().top - 250 + "px"
        }, 500);
        return false;
    });

    // 百度统计
    var _hmt = _hmt || [];
    (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?5516d1ba3fc6eecb6cf4a924c309ec8f";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
    })();

});