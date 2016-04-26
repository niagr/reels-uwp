
'use strict'

console.log('yo mama');


$("document").ready(main);

// Convenience fuction to print to console
function say(str) {
	console.log(str);
}
var controller;
function main() {
	Platform.init();
	controller = new Controller();
}