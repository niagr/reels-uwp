// Global object containing utility methods. No properties live here

var Utils = {
	
	// Accepts a directoryEntry
	// calls callback with an array of all it's children
	get_dir_chilren: function(dir, cb) {
		
		var dir_reader = dir.createReader();
		
		// Array to hold Entries for the this directory's children
		var child_list = [];
		
		// load Entries from directory
		// This calls readEntries till no more entries are returned
		function read_children() {
			dir_reader.readEntries(function(entries) {
				if (entries.length == 0) {
					cb(child_list);
				} else {
					// add current list to the array
					child_list = child_list.concat(entries);
					// call this function recursively
					read_children();
				}
			});
		}
		
		read_children();

	},
	
	// removes unwanted items from an array
	// first param is the array with items to remove
	// second param is an array of indices of the items to remove
	// sets the array to empty after completion
	clean_list: function(item_list, remove_list) {
	
		// Remove the ones that could not be recognised
		remove_list.forEach(function(index, i, list) {
			item_list.splice(index - i, 1);
		});
		
		remove_list.length = 0;
		
	},
    
    get_image: function(url, cb) {
        
        var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				on_reply(xhr.response);
			}
		}
		
		xhr.send();
        
        function on_reply(resp) {
            
            var buffer = new Uint8Array(resp);
            cb(new Blob([buffer], {type:"image/jpeg"}));
            
        }
        
    }
	
}