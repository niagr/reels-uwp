
'use strict'

$("document").ready(function () {
    // Debugging UI - enable in index.html too
    // $("#start-button").click(main);
    // $("#platform-button").click(Platform.init);
    // $("#clear-button").click(window.localStorage.clear);

    main();
});

var controller;
function main() {
	Platform.init();
    controller = new Controller();
}

function printDebug (str: string) {
    let $deb = $("#debug");
    $deb.append($("<br>"));
    $deb.append(str);
}