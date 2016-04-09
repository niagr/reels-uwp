// This object controls the general tasks except the view.

//var say: Function;

var global: any = global || {};

interface IMovieSavedInfo extends IMovieInfo {
    video_file_ID: string;
}

class Controller {
    //genres: any[];
    config: any;
    app_data_dir: Platform.fs.DirEntry;
    movie_list: Movie[];


	private gui_controller: GUIController;



	constructor () {

		var that = this;

	    // this.gui_controller = new GUIController(this);

	    global.tmdb = new TMDb.TMDb("f6bfd6dfde719ce3a4c710d7258692cf");

		this.movie_list = [];

		// The root filesystem for persistent storage
		this.app_data_dir = undefined;

	    // Configuration JSON object
	    this.config = {};

	    //this.genres = [];

		this.init();

	}

	private init () {

		var that = this;

//         load genres list
        Platform.localStorage.get("config", function(value: any, error: Error) {

            if (error) {
                    console.debug("No genre list cache found: " + error.message);
            } else if (value.genres) {
                console.log("genres list cache found.");
                that.config.genres = value.genres;
            }
            finish();

        });

        global.tmdb.get_genres(function(err: Error, genres_arr: IGenre[]) {
            if (!err) {
                //that.config.genres = genres_arr;
                that.config.genres = genres_arr;
                Platform.localStorage.setJSON({
                    config: that.config
                }, function() {
                    console.log("Retrieved and wrote new genres list.")
                });
            } else {
                console.error(err.message);
            }
        });

        function finish() {
            that.gui_controller = new GUIController(that);


            // Set up filesystem object
    		if (!that.app_data_dir) {


    			Platform.fs.appDataDir(function (data_dir) {
                    that.app_data_dir = data_dir;
                    that.load_stored_movies();
                })
    		}

        }
	}



	public load_new_movies_from_dir (dir_entry: Platform.fs.DirEntry) {

        var that = this;

		this.load_files(dir_entry, onLoadFiles);


		function onLoadFiles(video_file_list: Platform.fs.FileEntry[]) {

			var new_movie_list: Movie[] = [];

			video_file_list.forEach(function(file, index, arr) {
				new_movie_list.push(new Movie(file));
			});

			that.process_new_movies(new_movie_list);

		}

	}

	// Accepts a dirEntry and a callback
	// Calls the callback with an array of fileEntries of all video files under a directory
	private load_files (dir: Platform.fs.DirEntry, cb : {(video_file_list: Platform.fs.FileEntry[]) : void}) {

		var that = this;

		console.log("hello")

		// This variable keeps track of the number of async dirReader calls made.
		var async_num = 0;

		// Array to hold Entries for all files found recursively under directory
		var file_list: Platform.fs.FileEntry[] = [];

		rec_load_files(dir, 1, onRecLoadFiles);

		// Recustively navigate filesystem
		// This function is asynchronous
		// The callback is called with the complete array of loaded files
		function rec_load_files(dir: Platform.fs.DirEntry, rec_level: number, callback: {(a: Platform.fs.FileEntry[]) : void}) {

//			console.debug("Callback:" + callback);

			// increment the count of async recursions
			async_num++;

			// we excute the asynchronous read
			dir.getChildren(onGetChildren);

			function onGetChildren(child_list: Platform.fs.FileEntry[]) {


				file_list = file_list.concat(child_list);

				if (child_list.length > 0) {
					child_list.forEach(function(entry: any) {

						if (entry.isDirectory()) {
//							say((Array(rec_level + 1).join(" ")) + "-- DIRECTORY: " + entry.name);
							// load the files of this directory
							rec_load_files(entry, rec_level + 1, callback);
						} else {
//							say((Array(rec_level + 1).join(" ")) + "-- " + entry.name);
						}

					});
				}

				async_num--;

				async_return();

			}

//			say("Started reading directory: " + dir.name);

			// Called at the end of every async dir enumeration
			// Joins/waits for all async requests before proceeding
			// Checks the number of asyn methods in operation and moved on if all have retuned
			function async_return() {
				console.log("ready");
				if (async_num == 0) {
					callback(file_list);
				}
			};

		}

		function onRecLoadFiles(file_list) {

			var video_file_list = select_new_video_files(file_list);
			cb(video_file_list);

		}

		// Selects the video files by testing type, checks for duplicates,
		// and returns
		function select_new_video_files(file_list) {

			console.debug("Selecting video files");

			var new_file_list = [];

			file_list.forEach(function(file: Platform.fs.FileEntry) {

				if (	(file.get_base_name().slice(-3) == "avi")
					|| 	(file.get_base_name().slice(-3) == "mkv")
					|| 	(file.get_base_name().slice(-3) == "mp4")	) {

					// iterate through movie list to check for duplicates with filename
					var dupe = false;
					that.movie_list.forEach(function(movie) {

						if (file.get_base_name() == movie.video_file.get_base_name()) {
							dupe = true;
						}

					});
					if (dupe == false) {
						new_file_list.push(file);
						say("video file: " + file.get_base_name());
					}
				}

			});

			return new_file_list;

		}

	}

	private process_new_movies (new_movie_list) {

		var that = this;

		console.debug("processing");

		// Array of indices of files which could not be identified as movies,
		// and hence have to be remved. They can't be removed in the first loop
		// directly because it interferes with the iteration because it shifts the
		// following items, changing their index. They are removed together in the
		// Util method clean_list().
		var remove_list = [];

		// Infer the title and year of movie objects in movie_list
		// Mark the ones that could not be recognised.
		new_movie_list.forEach(function(movie: Movie, index, list) {

			if (movie.infer_title_and_year()) {
				say("title: " + movie.search_title + "; year: " + movie.search_year);
			} else {
                say(" Could not infer the name of file: " + movie.video_file.get_base_name());
				remove_list.push(index);
			};

		});

		Utils.clean_list(new_movie_list, remove_list);

		// get and save info for each movie in list
		new_movie_list.forEach(function(movie, index, list) {

			movie.get_and_save_info(onSearch, index)

		});

		// keeps count in loop of async calls
		var count = 0;

		// callback called after each movie tries getting info
		function onSearch(found: boolean, movie: Movie, index: number) {

			count++;

			if (!found) {
				console.log("Could not find " + movie.search_title + " in datbase");
				remove_list.push(index);
			} else {
				console.log("found " + movie.movie_info.title + " (id:" + movie.movie_info.id + ") in database");
				console.log(movie.movie_info);
                save_info(movie);
                that.gui_controller.add_movie_item(movie);
			}

			// if all movies are done, go to the next thing
			if (count == new_movie_list.length) {
				onInfoSaved();
			}

		}

		// callback called when all movies have finished getting info
		function onInfoSaved() {
			Utils.clean_list(new_movie_list, remove_list);
			console.log("oh yeah");
			that.movie_list = that.movie_list.concat(new_movie_list);

		}

        // saves the info of a movie into localstorage
        function save_info(movie: Movie) {

            var entry: IMovieSavedInfo = $.extend(movie.movie_info, {
                    video_file_ID: Platform.fs.retainEntry(movie.video_file)
            });
            var id = entry.id.toString();
            var storage_obj = {};
            storage_obj[id] = entry;
            Platform.localStorage.setJSON(storage_obj, function() {
                console.debug("stored");
            });

            movie.load_poster();
            var image_file_name = movie.movie_info.id.toString() + ".jpg";
            movie.poster(function(blob: Blob) {
                that.app_data_dir.getFile(image_file_name, {create:true}, function(entry) {
                    entry.write(blob, function () {
                        console.debug("wrote image file");
                    });
                });
            });

            function err(e) {
                console.debug(e.message);
            }

        }

	}

    // loads the stored movies and displays then on the view
	private load_stored_movies () {

		var that = this;


        var new_movie_list = [];

        Platform.localStorage.get(null, onLoaded);

        function onLoaded(stored) {
        console.log("aaaaaa");

            var count = 0;

            $.each(stored, function(key, item: IMovieSavedInfo) {

                function err(e: Error) {
                    console.debug(e.message);
                }

                function onRestoreEntry(entry: Platform.fs.FileEntry) {

                    var movie: Movie = new Movie(entry);
                    for (let p in movie.movie_info) {
                        if (movie.movie_info.hasOwnProperty(p)) {
                            movie.movie_info[p] = item[p];
                            //console.debug("copied " + p);
                        }
                    }
                    // movie.movie_info.id = item.id;
                    // movie.movie_info.title = item.title;
                    // movie.movie_info.imdb_id = item.imdb_id;
                    // movie.movie_info.year = item.year;
                    // movie.movie_info.tagline = item.tagline;
                    // movie.movie_info.description = item.description;
                    // movie.movie_info.cast = item.cast;
                    // movie.movie_info.crew = item.crew;
					// movie.movie_info.genres = item.genres;
                    // movie.movie_info.posterpath = item.posterpath;
                    that.app_data_dir.getFile(movie.movie_info.id.toString() + ".jpg", {create: false}, function(ent: Platform.fs.FileEntry, error: Error) {
                        ent.file(function(file) {
                            movie.set_poster_blob(file);
                        }, err);
                    });
                    new_movie_list.push(movie);
                    ready();

                }

                function onRestoreFailure(e) {
                    err(Error('Could not restore file entry: ' + e.message))
                    ready();
                }

                if (key != "config")
                    Platform.fs.restoreEntry(item.video_file_ID, onRestoreEntry, onRestoreFailure);
                else
                    ready();

            });

            function ready() {
                count++;
                if (count == Object.keys(stored).length)
                    proceed();
            }

            function proceed() {

                new_movie_list.forEach(function(movie) {
                    that.gui_controller.add_movie_item(movie);
                });

                that.movie_list = that.movie_list.concat(new_movie_list);

            }

        }

    }



}
