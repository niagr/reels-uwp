
'use strict'

console.log('yo mama');

let myConsole: MyConsole;
let posterCount = 1;

$("document").ready(function () {
   $("#start-button").click(main);
   $("#platform-button").click(Platform.init);
   myConsole = new MyConsole($('#debug'));
});

// Convenience fuction to print to console
function say(str) {
	console.log(str);
}
var controller;
function main() {
	Platform.init();
    controller = new Controller();
    $('#clear-button').click(function (ev) {
        window.localStorage.clear();
    });
}

function printDebug (str: string) {
    let $deb = $("#debug");
    $deb.append($("<br>"));
    $deb.append(str);
}

function foo2 () {
    var k = 1;
    Windows.Storage.ApplicationData.current.localFolder.getItemsAsync()
    .done(function (items) {
        var namesArray = (items.map(function(item) {
            return item.name;
        }));
        console.log(namesArray);
        for (let name of namesArray) {
            Windows.Storage.ApplicationData.current.localFolder.getItemAsync(name).done(function (item) {
                console.log(k++ + ': Found item ' + name);
            }, function (err) {
                console.log("Could not find item " + name + ": " + err);
            });
        }
    }, function (err) {
        console.log(err);
    });
}

function foo() {
    Platform.init();
    Platform.fs.appDataDir((dataDir) => {
        dataDir.getChildren((children) => {
            let i = 1;
            for (let child of children) {
                let name = child.get_base_name();
                dataDir.getFile(name, {create:false}, (file, err) => {
                    console.log(`${i++}: Found file ${file.get_base_name()}`);
                });
            }
        });
    });
}

class MyConsole {
    
    constructor (_widget: JQuery) {
        this.widget = _widget;
        this.store = [];
    }
    
    private store: string[];
    
    private widget: JQuery;
    
    public log (msg: string) {
        this.store.push(msg);
        this.widget.append($('<br>'));
        this.widget.append(msg);
    }
    
}