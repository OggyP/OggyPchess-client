$(function(){
    // urlList.appendToElement(urlList,
    //     "" +
    //     "<li>" +
    //     "   <a href='$url'>" +
    //     "     <span class='variant'>$variant</span>" +
    //     "     $name" +
    //     "   </a>" +
    //     "   $altCode" +
    //     "</li>",
    //     "<a href='$altUrl' class='alt-url'>(also $altName)</a>",
    //     "nav > ul",
    //     {}
    // );

    /* NAV */
    let navElement = "nav > ul";
    let code;
    urlList.index.forEach(site => {
        code = "";
        if (Object.keys(site.altUrl).length !== 0) {
            code =
                "<li>" +
                    "<details>" +
                        "<summary>" +
                            "<span class='variant'>" + site.variant + " </span>" +
                            site.name +
                        "</summary>" +
                        "<ul>" +
                            "<li><a href='" + site.url + "'>Main</a></li>";
            for (const [name, url] of Object.entries(site.altUrl)) {
                code = code.concat("<li><a href='" + url + "'>" + name + "</a></li>");
            }
            code = code.concat("</details></ul></li>");
        } else {
            code =
                "<li>" +
                    "<a href='" + site.url + "'>" +
                        "<span class='variant'>" + site.variant + " </span>" +
                        site.name +
                    "</a>" +
                "</li>"
        }
        $(navElement).append(code);
    });

    $("footer").load("/errors/footer.html");


    document.querySelector("#go-back-btn").href = window.location.protocol + "//" + window.location.hostname;


    let navOpen = false;
    let infoOpen = false;
    $('#other-sites-btn').click(function() {
        console.log("1");

        if (navOpen) $('nav').fadeOut('fast');
        else $('nav').fadeIn('fast');
        navOpen = !navOpen;

        if (infoOpen) {
            $('aside').hide();
            infoOpen = false;
        }
    });
    $('#close-nav-btn').click(function() {
        console.log("2");

        if (navOpen) {
            $('nav').fadeOut('fast');
            navOpen = false;
        }

        if (infoOpen) {
            $('aside').hide();
            infoOpen = false;
        }
    });

    $('#more-info-btn').click(function() {
        console.log("3");

        if (infoOpen) $('aside').fadeOut('fast');
        else $('aside').fadeIn('fast');
        infoOpen = !infoOpen;

        if (navOpen) {
            $('nav').hide();
            navOpen = false;
        }
    });
    $('#close-info-btn').click(function() {
        console.log("4");

        if (infoOpen) {
            $('aside').fadeOut('fast');
            infoOpen = false;
        }

        if (navOpen) {
            $('nav').hide();
            navOpen = false;
        }
    });

});