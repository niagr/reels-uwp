namespace Platform {

    export var platform: "unknown" | "node-webkit" | "WinRT";
    platform = "unknown";

    if (typeof Windows !== 'undefined') {
        platform = 'WinRT';
    } else if (typeof module !== 'undefined') {
        platform = "node-webkit";
    }

    console.log("Platform detected: " + platform);

}
