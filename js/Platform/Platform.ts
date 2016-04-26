namespace Platform {

    export var platform: "unknown" | "node-webkit" | "WinRT";
    platform = "unknown";


    /**
     * Initialises the Platform layer. Call before using any other function in this module.
     */
    export function init () {
        
        if (typeof Windows !== 'undefined') {
            platform = 'WinRT';
        } else if (typeof module !== 'undefined') {
            platform = "node-webkit";
        }

        console.log("Platform detected: " + platform);
        
        if (Platform.platform == 'WinRT') {
            Platform.localStorage = localStorageNW;
        } else if (Platform.platform == 'node-webkit') {
            Platform.localStorage = localStorageNW;
        }
        
        Platform.fs.init();
            
    }
    
    export var localStorage;
    
    let localStorageNW = {

        /*
            Pass a key-value pair to be stored.
            Value has to be an object that represents a valid JSON. Bad things happen if it does not.
            This function is truly asynchronous in some platforms like Chrome.

            @entry : Single-membered Object representing key-value pair to be stored.

            @callback: callback to be executed when the value has been stored.
        */
        setJSON: function (entry, callback: (err: Error)) {

            // Check entry is object
            if (typeof entry != "object") {
                callback(new Error(`Could not store item: entry is not an object`));;
            } else
            // check entry has only one member
            if (Object.keys(entry).length != 1) {
                callback(new Error(`Could not store item: entry is longer than one key-value pair`));
            }

            var key = Object.keys(entry)[0];
            var value = entry[key];

            if (typeof value == "object" || typeof value == "array") {
                value = JSON.stringify(value);
            } else {
                callback(new Error(`Could not store item: Value of item has to be a valid JSON-able object or array`))
            }

            window.localStorage.setItem(key, value);
            callback(null);

        },

        /*
            Retrieves the value of the passed key

                @query: the key for the objet to be restored.

                @callback: parameters:
                    value: value of key if found. Null otherwise.
                    error: Error if key was not found.
        */
        get: function(query, callback) {
            
            console.log('get');

            if (typeof query == "array") {

            } else if (typeof query == "string") {
                
                var value = window.localStorage.getItem(query);
                if (value == null)
                    callback(null, Error('Key was not found'));
                else
                    callback(JSON.parse(value));
                    
            } else if (query == null) {
                var key, value;
                var obj = {};
                for (var iii = 0; iii < window.localStorage.length; iii++) {
                    key = window.localStorage.key(iii);
                    value = window.localStorage.getItem(key);
                    try {
                        value = JSON.parse(value);
                    } catch (e) {

                    }
                    obj[key] = value;
                }
                callback(obj);
            }

        }

    }

}
