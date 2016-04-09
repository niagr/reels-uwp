module Platform {


    export var localStorage = {

        /*
            Pass a key-value pair to be stored.
            Value has to be an object that represents a valid JSON. Bad things happen if it does not.
            This function is truly asynchronous in some platforms like Chrome.

            @entry : Single-membered Object representing key-value pair to be stored.

            @callback: callback to be executed when the value has been stored.
        */
        setJSON: function (entry, callback) {

            // Check entry is object
            if (typeof entry != "object") {
                console.debug("entry is not an object")
                return;
            } else
            // check entry has only one member
            if (Object.keys(entry).length != 1) {
                console.debug("entry is longer than one key-value pair");
                return;
            }

            var key = Object.keys(entry)[0];
            var value = entry[key];

            // node-webkit implementation
            if (Platform.platform == "node-webkit") {

                if (typeof value == "object" || typeof value == "array") {
                    value = JSON.stringify(value);
                } else {
                    console.debug("Value of item has to be a valid JSON-able object or array");
                }

                window.localStorage.setItem(key, value);
                callback();

            }

        },

        /*
            Retrieves the value of the passed key

                @query: the key for the objet to be restored.

                @callback: parameters:
                    value: value of key if found. Null otherwise.
                    error: Error if key was not found.
        */
        get: function(query, callback) {

            if (typeof query == "array") {

            } else if (typeof query == "string") {
                if (Platform.platform == "node-webkit") {

                    var value = window.localStorage.getItem(query);

                    if (value == null)
                        callback(null, Error('Key was not found'));
                    else
                        callback(JSON.parse(value));

                }
            } else if (query == null) {
                if (Platform.platform == "node-webkit") {
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


}
