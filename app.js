var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
'use strict';
console.log('yo mama');
var myConsole;
var posterCount = 1;
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
function printDebug(str) {
    var $deb = $("#debug");
    $deb.append($("<br>"));
    $deb.append(str);
}
function foo2() {
    var k = 1;
    Windows.Storage.ApplicationData.current.localFolder.getItemsAsync()
        .done(function (items) {
        var namesArray = (items.map(function (item) {
            return item.name;
        }));
        console.log(namesArray);
        var _loop_1 = function(name_1) {
            Windows.Storage.ApplicationData.current.localFolder.getItemAsync(name_1).done(function (item) {
                console.log(k++ + ': Found item ' + name_1);
            }, function (err) {
                console.log("Could not find item " + name_1 + ": " + err);
            });
        };
        for (var _i = 0, namesArray_1 = namesArray; _i < namesArray_1.length; _i++) {
            var name_1 = namesArray_1[_i];
            _loop_1(name_1);
        }
    }, function (err) {
        console.log(err);
    });
}
function foo() {
    Platform.init();
    Platform.fs.appDataDir(function (dataDir) {
        dataDir.getChildren(function (children) {
            var i = 1;
            for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                var child = children_1[_i];
                var name_2 = child.get_base_name();
                dataDir.getFile(name_2, { create: false }, function (file, err) {
                    console.log(i++ + ": Found file " + file.get_base_name());
                });
            }
        });
    });
}
var MyConsole = (function () {
    function MyConsole(_widget) {
        this.widget = _widget;
        this.store = [];
    }
    MyConsole.prototype.log = function (msg) {
        this.store.push(msg);
        this.widget.append($('<br>'));
        this.widget.append(msg);
    };
    return MyConsole;
}());
// This object controls the general tasks except the view.
//var say: Function;
var global = global || {};
var Controller = (function () {
    function Controller() {
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
    Controller.prototype.init = function () {
        var that = this;
        //         load genres list
        Platform.localStorage.get("config", function (value, error) {
            if (error) {
                console.debug("No stored config data or could not load it: " + error.message);
            }
            else if (value) {
                console.log("config data found");
                if (value.genres) {
                    console.log("genres list cache found.");
                    that.config.genres = value.genres;
                }
                else {
                    console.log("genres list cache not found");
                }
            }
            global.tmdb.get_genres(function (err, genres_arr) {
                if (!err) {
                    //that.config.genres = genres_arr;
                    that.config.genres = genres_arr;
                    Platform.localStorage.setJSON({
                        config: that.config
                    }, function () {
                        console.log("Retrieved and wrote new genres list.");
                    });
                }
                else {
                    console.error(err.message);
                }
                finish();
            });
        });
        function finish() {
            that.gui_controller = new GUIController(that);
            // Set up filesystem object
            if (!that.app_data_dir) {
                Platform.fs.appDataDir(function (data_dir) {
                    if (!data_dir) {
                        throw new Error("Could not get app data dir.");
                    }
                    that.app_data_dir = data_dir;
                    that.load_stored_movies();
                });
            }
        }
    };
    Controller.prototype.load_new_movies_from_dir = function (dir_entry) {
        var that = this;
        this.load_files(dir_entry, onLoadFiles);
        function onLoadFiles(video_file_list) {
            var new_movie_list = [];
            video_file_list.forEach(function (file, index, arr) {
                new_movie_list.push(new Movie(file));
            });
            that.process_new_movies(new_movie_list);
        }
    };
    // Accepts a dirEntry and a callback
    // Calls the callback with an array of fileEntries of all video files under a directory
    Controller.prototype.load_files = function (dir, cb) {
        var that = this;
        console.log("hello");
        // This variable keeps track of the number of async dirReader calls made.
        var async_num = 0;
        // Array to hold Entries for all files found recursively under directory
        var file_list = [];
        rec_load_files(dir, 1, onRecLoadFiles);
        // Recustively navigate filesystem
        // This function is asynchronous
        // The callback is called with the complete array of loaded files
        function rec_load_files(dir, rec_level, callback) {
            //			console.debug("Callback:" + callback);
            // increment the count of async recursions
            async_num++;
            // we excute the asynchronous read
            dir.getChildren(onGetChildren);
            function onGetChildren(child_list) {
                //file_list = file_list.concat(child_list);
                if (child_list.length > 0) {
                    child_list.forEach(function (entry) {
                        if (entry.isDirectory()) {
                            //							say((Array(rec_level + 1).join(" ")) + "-- DIRECTORY: " + entry.name);
                            // load the files of this directory
                            rec_load_files(entry, rec_level + 1, callback);
                        }
                        else {
                            file_list.push(entry);
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
            }
            ;
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
            file_list.forEach(function (file) {
                if ((file.get_base_name().slice(-3) == "avi")
                    || (file.get_base_name().slice(-3) == "mkv")
                    || (file.get_base_name().slice(-3) == "mp4")) {
                    // iterate through movie list to check for duplicates with filename
                    var dupe = false;
                    that.movie_list.forEach(function (movie) {
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
    };
    Controller.prototype.process_new_movies = function (new_movie_list) {
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
        new_movie_list.forEach(function (movie, index, list) {
            if (movie.infer_title_and_year()) {
                say("title: " + movie.search_title + "; year: " + movie.search_year);
            }
            else {
                say(" Could not infer the name of file: " + movie.video_file.get_base_name());
                remove_list.push(index);
            }
            ;
        });
        Utils.clean_list(new_movie_list, remove_list);
        // get and save info for each movie in list
        new_movie_list.forEach(function (movie, index, list) {
            movie.get_and_save_info(onSearch, index);
        });
        // keeps count in loop of async calls
        var count = 0;
        // callback called after each movie tries getting info
        function onSearch(found, movie, index) {
            count++;
            if (!found) {
                console.log("Could not find " + movie.search_title + " in datbase");
                remove_list.push(index);
            }
            else {
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
        function save_info(movie) {
            var entry = $.extend(movie.movie_info, {
                video_file_ID: Platform.fs.retainEntry(movie.video_file)
            });
            var id = entry.id.toString();
            var storage_obj = {};
            storage_obj[id] = entry;
            Platform.localStorage.setJSON(storage_obj, function () {
                console.debug("stored");
                movie.load_poster();
                var image_file_name = movie.movie_info.id.toString() + ".jpg";
                movie.poster(function (blob) {
                    that.app_data_dir.getFile(image_file_name, { create: true }, function (entry) {
                        entry.write(blob, function () {
                            console.debug("wrote image file");
                        });
                    });
                });
            });
            function err(e) {
                console.debug(e.message);
            }
        }
    };
    // loads the stored movies and displays then on the view
    Controller.prototype.load_stored_movies = function () {
        console.log('Loading stored movies.');
        var that = this;
        var new_movie_list = [];
        Platform.localStorage.get(null, onLoaded);
        function onLoaded(stored) {
            delete stored.config;
            var keys = Object.keys(stored);
            if (keys.length < 1) {
                console.log("No stored movies found");
                return;
            }
            else {
                console.log("Stored movies found:");
                console.log(keys);
            }
            var count = 0;
            var c = 0;
            $.each(stored, function (key, item) {
                function err(e) {
                    console.debug(e.message);
                }
                function onRestoreEntry(entry) {
                    var movie = new Movie(entry);
                    for (var p in movie.movie_info) {
                        if (movie.movie_info.hasOwnProperty(p)) {
                            movie.movie_info[p] = item[p];
                        }
                    }
                    //console.log(`${c++}: Reached here`);
                    var posterPath = movie.movie_info.id.toString() + ".jpg";
                    that.app_data_dir.getFile(posterPath, { create: false }, function (ent, error) {
                        if (error) {
                            //console.log(c++ + `: Could not load image file ${posterPath}`);
                            return;
                        }
                        else {
                        }
                        // console.log(c++ + ": callback reached");
                        ent.file(function (file) {
                            movie.set_poster_blob(file);
                        }, err);
                    });
                    new_movie_list.push(movie);
                    ready();
                }
                function onRestoreFailure(e) {
                    err(Error('Could not restore file entry: ' + e.message));
                    ready();
                }
                if (key != "config")
                    Platform.fs.restoreEntry(item.video_file_ID, onRestoreEntry, onRestoreFailure);
                else
                    ready();
            });
            function ready() {
                // console.log((count) + ": ready called");
                count++;
                if (count == Object.keys(stored).length)
                    proceed();
            }
            function proceed() {
                new_movie_list.forEach(function (movie) {
                    that.gui_controller.add_movie_item(movie);
                });
                that.movie_list = that.movie_list.concat(new_movie_list);
            }
        }
    };
    return Controller;
}());
// This object controls the user interface
var GUIController = (function () {
    function GUIController(controller) {
        var _this = this;
        var that = this;
        this.controller = controller;
        this.movie_item_list = [];
        this.$container = $('#container');
        this.main_view = new ListView();
        this.$content_container = $('#content');
        this.$player = $('<video class="player"></video');
        this.$sidebar = $('#sidebar');
        // public for debugging purposes
        this.$toolbar = $('#toolbar');
        this.searchbox = new SearchBox(function (query) { return _this.search(query); });
        this.searchview = new ListView();
        this.genreview = new ListView();
        this.$genre_filter = $('#genres-list');
        this.genre_list = [];
        //console.log(this.$genre_filter);
        this.current_view = 'listview';
        this.playing = false;
        this.genre_all_added = false;
        this.init_ui();
    }
    GUIController.prototype.init_ui = function () {
        var _this = this;
        console.log("initializing UI");
        this.$toolbar.append(this.searchbox.$main_container);
        $("#add-button").click(function () {
            console.log("clicked");
            Platform.fs.chooseEntry("directory", function (entry) {
                console.log("selected directory " + entry.get_base_name());
                _this.controller.load_new_movies_from_dir(entry);
            }, undefined); // TODO: Add Error handling
        });
        $("#close-button").click(function (event) {
            window.close();
        });
        $('#expand-button').click(function (event) {
            _this.expand_sidebar();
        });
        this.$content_container.append(this.main_view.$main_container);
    };
    /*
        Adds an array of genres to the list and the filter if not already present
    */
    GUIController.prototype.add_genres = function (genres) {
        var _this = this;
        if (this.genre_all_added == false) {
            this.add_genre_filter_item({
                id: -1,
                name: "All"
            });
            this.genre_all_added = true;
        }
        genres.forEach(function (genre_from_movie) {
            var found = false;
            _this.genre_list.forEach(function (genre_from_list) {
                if (genre_from_movie.id === genre_from_list.id) {
                    found = true;
                }
            });
            if (found === false) {
                _this.genre_list.push(genre_from_movie);
                _this.add_genre_filter_item(genre_from_movie);
            }
        });
    };
    GUIController.prototype.add_genre_filter_item = function (genre) {
        var _this = this;
        var $genre_filer_item = $('<li>' + genre.name + '</li>');
        $genre_filer_item.click(function (ev) {
            _this.show_genre(genre);
            console.log("clicked" + genre.name);
        });
        this.$genre_filter.append($genre_filer_item);
    };
    GUIController.prototype.show_genre = function (req_genre) {
        var _this = this;
        this.genreview.clear();
        if (req_genre.name == 'All') {
            this.toggle_view('listview');
        }
        else {
            this.toggle_view('genreview');
            this.movie_item_list.forEach(function (movie_item) {
                var added = false;
                movie_item.movie.movie_info.genres.forEach(function (movie_genre) {
                    if (added == false && req_genre.id == movie_genre.id) {
                        _this.genreview.add_item(movie_item);
                        added = true;
                    }
                });
            });
        }
    };
    GUIController.prototype.search = function (query) {
        var _this = this;
        this.searchview.clear();
        if (query == '') {
            this.toggle_view('listview');
        }
        else {
            this.toggle_view('searchview');
            var regex = new RegExp(query, 'i');
            this.movie_item_list.forEach(function (movie_item, index, list) {
                if (regex.test(movie_item.movie.movie_info.title)) {
                    _this.searchview.add_item(movie_item);
                }
            });
        }
    };
    GUIController.prototype.toggle_view = function (view) {
        var _this = this;
        var add = function (list_view) {
            _this.current_view = view;
            _this.$content_container.append(list_view.$main_container);
        };
        this.$content_container.children().detach();
        switch (view) {
            case 'listview':
                add(this.main_view);
                break;
            case 'searchview':
                add(this.searchview);
                break;
            case 'genreview': add(this.genreview);
        }
    };
    GUIController.prototype.expand_sidebar = function () {
        $('#toolbar, #content').toggleClass('sidebar-collapsed');
        $('#sidebar, #toolbar, #content').toggleClass('sidebar-expanded');
    };
    GUIController.prototype.add_movie_item = function (movie) {
        var movie_item = new MovieItem(movie, {
            play: this.play_movie,
            stop: this.stop_movie,
            open_dir: this.open_containing_directory,
            open_imdb_page: this.open_imdb_page
        });
        this.movie_item_list.push(movie_item);
        this.main_view.add_item(movie_item);
        this.add_genres(movie.movie_info.genres);
    };
    GUIController.prototype.play_movie = function (movie_item) {
        Platform.fs.openFileWithSystemDefault(movie_item.movie.video_file);
    };
    GUIController.prototype.open_containing_directory = function (movie_item) {
        movie_item.movie.video_file.getParentDirectory().then(function (dir) {
            Platform.fs.openFileWithSystemDefault(dir);
        }, function (err) {
            console.log(err.message);
        });
    };
    GUIController.prototype.open_imdb_page = function (movie_item) {
        var IMDB_BASE_URL = "http://www.imdb.com/title/";
        Platform.fs.openURLWithSystemDefault(IMDB_BASE_URL + movie_item.movie.movie_info.imdb_id);
    };
    GUIController.prototype.stop_movie = function () {
        // TODO: Remove this dead code
        // if (this.playing) {
        //     this.$player.get(0).pause();
        //     this.$player.detach();
        //     this.$container.appendTo('body');
        //     this.playing = false;
        // }
    };
    return GUIController;
}());
var ListView = (function () {
    function ListView() {
        var that = this;
        this.$main_container = $("<div class='list-view'><div>");
        this.movie_item_container = [];
        if (!ListView.main) {
            ListView.main = this;
        }
    }
    /*
      Add a MovieItem to be shown as the results.
        movie_info: MovieItem to add to the SearchView
    */
    ListView.prototype.add_item = function (movie_item) {
        var $clone;
        if (ListView.main == this) {
            $clone = movie_item.$item_container;
        }
        else {
            $clone = movie_item.$item_container.clone(true);
        }
        this.movie_item_container.push(movie_item);
        this.$main_container.append($clone);
    };
    // Clear the SearchView of all results
    ListView.prototype.clear = function () {
        this.$main_container.children().remove();
        this.movie_item_container = [];
    };
    return ListView;
}());
//declare var window;
//declare var Utils;
var Movie = (function () {
    function Movie(_video_file) {
        this.video_file = _video_file;
        this.tmdb = global.tmdb; //TODO: fix this leaky logic
        this.search_title = '';
        this.search_year = '';
        this._is_poster_loaded = false;
        this.movie_info = {
            id: 0,
            imdb_id: '',
            title: "",
            year: 0,
            tagline: "",
            description: "",
            posterpath: "",
            genres: [],
            cast: [],
            crew: []
        };
        this._onPosterLoaded = [];
    }
    Movie.prototype.getDirector = function () {
        for (var iii = 0; iii < this.movie_info.crew.length; iii++) {
            if (this.movie_info.crew[iii].job == "Director") {
                return this.movie_info.crew[iii].name;
            }
        }
    };
    Movie.prototype.get_nth_cast = function (num) {
        for (var iii = 0; iii < this.movie_info.cast.length; iii++) {
            if (this.movie_info.cast[iii].order == num) {
                return this.movie_info.cast[iii].name;
            }
        }
    };
    // use filename to get the title and year of the movie
    // sets the variables and returns true if match found, else returns false
    Movie.prototype.infer_title_and_year = function () {
        var basename = this.video_file.get_base_name();
        // regex to eliminate sample files
        var regex = /sample/i;
        if (regex.test(basename)) {
            return false;
        }
        // regex to capture the title and year
        regex = /\b([A-Za-z0-9 ]+?)\b[() .\[\]]*((?:19|20)\d\d)/i;
        var matches = regex.exec(basename.split(".").join(" "));
        if (matches !== null) {
            this.search_title = matches[1];
            this.search_year = matches[2];
            return true;
        }
        else {
            return false;
        }
        ;
    };
    // gets the movie information from TMDb's database
    // and saves the info to files and populates the data fields
    // calls the callback with true if hit found, false otherwise
    // also passes the Movie object itself and a parameters object
    Movie.prototype.get_and_save_info = function (cb, param) {
        var _this = this;
        var onSearch = function (result) {
            if (result == "not found") {
                cb(false, _this, param);
            }
            else {
                _this.tmdb.get_movie_info(result.id, onReturnInfo);
            }
        };
        var onReturnInfo = function (result) {
            if (result == "not found") {
                cb(false, _this, param);
            }
            else {
                _this.movie_info.title = result.title;
                _this.movie_info.id = result.id;
                _this.movie_info.imdb_id = result.imdb_id;
                _this.movie_info.description = result.overview;
                _this.movie_info.tagline = result.tagline;
                _this.movie_info.posterpath = _this.tmdb.IMAGE_BASE_URL + "w154" + result.poster_path;
                _this.movie_info.genres = result.genres;
                _this.tmdb.get_credits(result.id, onReturnCredits);
            }
        };
        var onReturnCredits = function (result) {
            if (result == "not found") {
                cb(false, _this, param);
            }
            else {
                _this.movie_info.cast = result.cast;
                _this.movie_info.crew = result.crew;
                cb(true, _this, param);
            }
        };
        this.tmdb.search_movie(this.search_title, onSearch);
    };
    /*
        @blob : blob of image file to set as poster
        Sets the poster to the passed image blob
        Then calls the pending callbacks that need the poster object
    */
    Movie.prototype.set_poster_blob = function (blob) {
        var _this = this;
        this._poster_blob = blob;
        if (!this._is_poster_loaded) {
            this._is_poster_loaded = true;
            this._onPosterLoaded.forEach(function (callback) {
                callback(_this._poster_blob);
            });
            this._onPosterLoaded = [];
        }
    };
    /*
        Fetches the poster from the url specified in the Movie's movie_info object
        Then calls the pending callbacks that need the poster object
    */
    Movie.prototype.load_poster = function () {
        var _this = this;
        Utils.get_image(this.movie_info.posterpath, function (blob) {
            _this.set_poster_blob(blob);
        });
    };
    // called by the party that wants the poster
    // callback has same signature as _onPosterLoaded
    Movie.prototype.poster = function (cb) {
        if (this._is_poster_loaded) {
            cb(this._poster_blob);
        }
        else {
            this._onPosterLoaded.push(cb);
        }
    };
    return Movie;
}());
/// <reference path="./Movie.ts"/>
var MovieItem = (function () {
    function MovieItem(_movie, evHandler) {
        var _this = this;
        var that = this;
        this.movie = _movie;
        this.$item_container = $('<div class="movie-item"> </div>');
        this.$poster = $('<img class="movie-poster">');
        var html = '<div class="movie-info-container">' +
            '<a class="movie-title"></a>' +
            '<br/><br/>' +
            '<a class="director"></a>' +
            '<br/>' +
            '<a class="cast"></a>' +
            '<br/><br/>' +
            '<p class="movie-description"></p>' +
            '</div>';
        this.$movie_info_comtainer = $(html);
        html = '<div class="controls-box">' +
            '<div class="controls-wrapper">' +
            (_movie.movie_info.imdb_id != '' ? '<img class="control-button open-imdb-page-button" src="../icons/IMDb_icon.png">' : '') +
            '<br/>' +
            '<img class="control-button play-button" src="../icons/play-grey.png">' +
            '<br/>' +
            '<img class="control-button info-button" src="../icons/help-info-grey.png">' +
            '<br/>' +
            '<img class="control-button open-dir-button" src="../icons/folder.svg">' +
            '</div>' +
            '</div>';
        this.$controls_box = $(html);
        this.$controls_box.find(".play-button").click(function (event) {
            evHandler.play(that);
        });
        this.$controls_box.find(".open-dir-button").click(function (event) {
            evHandler.open_dir(that);
        });
        this.$controls_box.find(".open-imdb-page-button").click(function (event) {
            evHandler.open_imdb_page(that);
        });
        this.$movie_title = this.$movie_info_comtainer.children(".movie-title");
        this.$director = this.$movie_info_comtainer.children(".director");
        this.$cast = this.$movie_info_comtainer.children(".cast");
        this.$movie_description = this.$movie_info_comtainer.children(".movie-description");
        this.movie.poster(function (blob) {
            var img_url = URL.createObjectURL(blob);
            _this.$poster.attr("src", img_url);
            // myConsole.log(`${posterCount++}: set image source of movie item for ${this.movie.movie_info.id}`);
        });
        this.$movie_title.text(this.movie.movie_info.title);
        this.$director.text("Directed by " + this.movie.getDirector());
        this.$cast.text("Cast: " + this.movie.get_nth_cast(0) + ", " + this.movie.get_nth_cast(1) + ", " + this.movie.get_nth_cast(2));
        this.$movie_description.text(this.movie.movie_info.description);
        this.$item_container.append(this.$poster);
        this.$item_container.append(this.$movie_info_comtainer);
        this.$item_container.append(this.$controls_box);
    }
    return MovieItem;
}());
var Platform;
(function (Platform) {
    var fs;
    (function (fs_1) {
        function init() {
            if (Platform.platform == 'WinRT') {
                fs_1.chooseEntry = chooseEntryWinRT;
                fs_1.openFileWithSystemDefault = openFileWithSystemDefaultWinRT;
                fs_1.openURLWithSystemDefault = openURLWithSystemDefaultWinRT;
                fs_1.appDataDir = appDataDirWinRT;
                fs_1.retainEntry = retainEntryWinRT;
                fs_1.restoreEntry = restoreEntryWinRT;
            }
            else if (Platform.platform == 'node-webkit') {
                fs_1.chooseEntry = chooseEntryNW;
                fs_1.openFileWithSystemDefault = openFileWithSystemDefaultNW;
                fs_1.appDataDir = appDataDirNW;
                fs_1.retainEntry = retainEntryNW;
                fs_1.restoreEntry = restoreEntryNW;
            }
        }
        fs_1.init = init;
        /**
         * Common function for creating a new file or directory from a DirEntry.
         *
         * @param flags - Used to specify whether to create a new entry or not. Defaults to false.
         *              if neither create nor exclusive are set, if the file does not exist, error will be called.
         *              If create is set and exclusive is not set, if the file does not exist it will be created.
         *              If create is set and exclusive is set, if the file exists, error will be called with an error instance.
         *
         * @param exists - Indicated whether the entry exists or not.
         *
         * @param isType - Callback to determine whether entry is a file/directory.
         *
         * @param createAndReturnItem - Callback to create a new file/directory entry and return it to the caller.
         *
         * @param returnItem - Callback to return an existing entry to the caller.
         *
         * @param error - Callback to return error to caller.
         *
         */
        function createEntry(flags, exists, isType, createAndReturnItem, returnItem, error) {
            if (flags.create) {
                if (!exists) {
                    createAndReturnItem();
                }
                else {
                    if (flags.exclusive) {
                        error("EEXIST");
                    }
                    else {
                        if (!isType) {
                            error("ETYPE");
                        }
                        else {
                            returnItem();
                        }
                    }
                }
            }
            else {
                if (!exists) {
                    error("ENEXIST");
                }
                else {
                    if (!isType) {
                        error("ETYPE");
                    }
                    else {
                        returnItem();
                    }
                }
            }
        }
        var WinRTEntry = (function () {
            function WinRTEntry(_storage_item) {
                this.storage_item = null;
                if (!_storage_item)
                    throw new Error("Cannot create entry: storage item is null or undefined");
                this.storage_item = _storage_item;
            }
            WinRTEntry.prototype.isDirectory = function () {
                return this.storage_item.isOfType(Windows.Storage.StorageItemTypes.folder);
            };
            WinRTEntry.prototype.isFile = function () {
                return this.storage_item.isOfType(Windows.Storage.StorageItemTypes.file);
            };
            WinRTEntry.prototype.get_base_name = function () {
                return this.storage_item.name;
            };
            WinRTEntry.prototype.get_full_path = function () {
                return this.storage_item.path;
            };
            WinRTEntry.prototype.getParentDirectory = function () {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this.storage_item.getParentAsync().done(function (parent) {
                        if (parent)
                            resolve(new WinRTDirEntry(parent));
                        else
                            reject(new Error("Could not get parent folder for " + _this.storage_item.name));
                    }, reject);
                });
            };
            /**
             * Ugly hack to allow access to the native file for passing to other WinRT APIs.
             * It's okay as long as this class is not exported.
             */
            WinRTEntry.prototype.getStorageItem = function () {
                return this.storage_item;
            };
            return WinRTEntry;
        }());
        var WinRTFileEntry = (function (_super) {
            __extends(WinRTFileEntry, _super);
            function WinRTFileEntry(file) {
                _super.call(this, file);
            }
            WinRTFileEntry.prototype.file = function (success_cb, error_cb) {
                Windows.Storage.FileIO.readBufferAsync(this.storage_item).done(function (buffer) {
                    var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(buffer);
                    var bytes = new Uint8Array(buffer.length);
                    dataReader.readBytes(bytes);
                    dataReader.close();
                    success_cb(new Blob([bytes]));
                }, function (err) {
                    error_cb(err);
                });
                //success_cb(MSApp.createFileFromStorageFile(this.storage_item));
            };
            WinRTFileEntry.prototype.write = function (blob, callback) {
                var _this = this;
                var reader = new FileReader();
                reader.onloadend = function (ev) {
                    var bytes = new Uint8Array(ev.target.result);
                    try {
                        Windows.Storage.FileIO.writeBytesAsync(_this.storage_item, bytes).done(function () {
                            callback();
                        });
                    }
                    catch (e) {
                        console.log(e.message);
                    }
                };
                reader.onerror = function (ev) {
                    console.log(reader.error);
                };
                reader.readAsArrayBuffer(blob);
            };
            return WinRTFileEntry;
        }(WinRTEntry));
        var WinRTDirEntry = (function (_super) {
            __extends(WinRTDirEntry, _super);
            function WinRTDirEntry(dir) {
                _super.call(this, dir);
            }
            WinRTDirEntry.prototype.getChildren = function (cb) {
                this.storage_item.getItemsAsync().done(function (itemList) {
                    var entryList = itemList.map(function (item) {
                        if (item.isOfType(Windows.Storage.StorageItemTypes.file)) {
                            return new WinRTFileEntry(item);
                        }
                        else if (item.isOfType(Windows.Storage.StorageItemTypes.folder)) {
                            return new WinRTDirEntry(item);
                        }
                    });
                    cb(entryList);
                });
            };
            WinRTDirEntry.prototype.getItem = function (name, itemType, flags, callback) {
                var _this = this;
                var process = function (exists, item) {
                    var createAndReturnFile = function () {
                        _this.storage_item.createFileAsync(name).done(function (file) {
                            callback(new WinRTFileEntry(file), null);
                        }, function (e) {
                            callback(null, e);
                        });
                    };
                    var createAndReturnFolder = function () {
                        _this.storage_item.createFolderAsync(name).done(function (folder) {
                            callback(new WinRTDirEntry(folder), null);
                        }, function (e) {
                            callback(null, e);
                        });
                    };
                    var returnFile = function () {
                        callback(new WinRTFileEntry(item), null);
                    };
                    var returnFolder = function () {
                        callback(new WinRTDirEntry(item), null);
                    };
                    var isFile = function () {
                        return item.isOfType(Windows.Storage.StorageItemTypes.file);
                    };
                    var isFolder = function () {
                        return item.isOfType(Windows.Storage.StorageItemTypes.folder);
                    };
                    var errorFile = function (e) {
                        switch (e) {
                            case "EEXIST":
                                callback(null, new Error(name + " already exists and the exclusive flag is set."));
                                break;
                            case "ENEXIST":
                                callback(null, new Error(name + " does not exist and create flag is not set."));
                                break;
                            case "ETYPE":
                                callback(null, new Error(name + " is a directory."));
                                break;
                            default:
                                callback(null, new Error(name + ": something went wrong getting this file"));
                        }
                    };
                    var errorFolder = function (e) {
                        switch (e) {
                            case "EEXIST":
                                callback(null, new Error(name + " already exists and the exclusive flag is set."));
                                break;
                            case "ENEXIST":
                                callback(null, new Error(name + " does not exist and create flag is not set."));
                                break;
                            case "ETYPE":
                                callback(null, new Error(name + " is a file."));
                                break;
                            default:
                                callback(null, new Error(name + ": something went wrong getting this file"));
                        }
                    };
                    if (itemType == "file") {
                        createEntry(flags, exists, isFile, createAndReturnFile, returnFile, errorFile);
                    }
                    else {
                        createEntry(flags, exists, isFolder, createAndReturnFolder, returnFolder, errorFolder);
                    }
                };
                this.storage_item.getItemAsync(name).done(function (item) {
                    //console.log("found item: " + item);
                    // if (item == null) {
                    //     console.log(`could not get file ${name}`);
                    //     process(false, null);
                    // }
                    process(true, item);
                }, function (err) {
                    console.log("err " + err.message);
                    process(false, null);
                });
            };
            WinRTDirEntry.prototype.getFile = function (name, flags, callback) {
                this.getItem(name, "file", flags, callback);
            };
            WinRTDirEntry.prototype.getDirectory = function (name, flags, callback) {
                this.getItem(name, "dir", flags, callback);
            };
            return WinRTDirEntry;
        }(WinRTEntry));
        function scratchpad(name) {
        }
        fs_1.scratchpad = scratchpad;
        // TODO: replace basename with _basename
        var NodeEntry = (function () {
            function NodeEntry(filename, parent_path, parent_full_path) {
                var path_mod = require('path');
                // The private full path from the root to the file in the real local filesystem.
                // This is required because all file operations in nw uses the full local path.
                this.full_path = path_mod.join(parent_full_path, filename);
                this.basename = path_mod.basename(this.full_path);
            }
            NodeEntry.prototype.isDirectory = function () {
                var fs = require('fs');
                var stats = fs.statSync(this.full_path);
                if (stats.isDirectory()) {
                    return true;
                }
                else {
                    return false;
                }
            };
            NodeEntry.prototype.isFile = function () {
                var fs = require('fs');
                var stats = fs.statSync(this.full_path);
                if (stats.isFile()) {
                    return true;
                }
                else {
                    return false;
                }
            };
            NodeEntry.prototype.get_base_name = function () {
                return this.basename;
            };
            NodeEntry.prototype.get_full_path = function () {
                return this.full_path;
            };
            NodeEntry.prototype.getParentDirectory = function () {
                var p = require('path');
                var dirname = p.dirname(this.full_path);
                return Promise.resolve(new NodeDirEntry(p.basename(dirname), p.dirname(dirname), p.dirname(dirname)));
            };
            return NodeEntry;
        }());
        var NodeFileEntry = (function (_super) {
            __extends(NodeFileEntry, _super);
            function NodeFileEntry(filename, parent_path, parent_full_path) {
                _super.call(this, filename, parent_path, parent_full_path);
            }
            NodeFileEntry.prototype.file = function (success_cb, error_cb) {
                var fs = require('fs');
                fs.readFile(this.full_path, function (e, data) {
                    var blob = new Blob([new Uint8Array(data)]);
                    success_cb(blob);
                });
            };
            NodeFileEntry.prototype.write = function (blob, callback) {
                var _this = this;
                var writeData = function (buffer) {
                    var fs = require('fs');
                    fs.open(_this.full_path, 'w', function (err, fd) {
                        if (err != null) {
                            console.debug(err);
                        }
                        else {
                            fs.write(fd, buffer, 0, buffer.length, 0, function (err, written, buffer) {
                                if (err != null) {
                                    console.debug(err);
                                }
                                else {
                                    console.debug("it seems the data was written properly :)");
                                    callback();
                                }
                            });
                        }
                    });
                };
                var reader = new FileReader();
                reader.onload = function () {
                    var buffer = new Buffer(new Uint8Array(this.result));
                    writeData(buffer);
                };
                reader.readAsArrayBuffer(blob);
            };
            return NodeFileEntry;
        }(NodeEntry));
        fs_1.NodeFileEntry = NodeFileEntry;
        var NodeDirEntry = (function (_super) {
            __extends(NodeDirEntry, _super);
            function NodeDirEntry(dirname, parent_path, parent_full_path) {
                _super.call(this, dirname, parent_path, parent_full_path);
            }
            NodeDirEntry.prototype.getChildren = function (cb) {
                var _this = this;
                var fs = require('fs');
                //console.log(fs);
                fs.readdir(this.full_path, function (err, files) {
                    // @files contains the plain file names of the children; we need to make these into fileEntry's
                    console.log(files);
                    console.log("files");
                    var child_list = [];
                    files.forEach(function (val, index) {
                        var stats = fs.statSync(_this.full_path);
                        if (stats.isFile()) {
                            var file_entry = new NodeFileEntry(val, _this.full_path, _this.full_path);
                            child_list.push(file_entry);
                        }
                        else if (stats.isDirectory()) {
                            var dir_entry = new NodeDirEntry(val, _this.full_path, _this.full_path);
                            child_list.push(dir_entry);
                        }
                    });
                    cb(child_list);
                });
            };
            NodeDirEntry.prototype.getFile = function (name, flags, callback) {
                var _this = this;
                if (typeof flags == 'undefined' || flags == null) {
                    flags = {
                        create: false,
                        exclusive: false
                    };
                }
                var fs = require('fs');
                var path = require('path');
                var file_path = path.join(this.full_path, name);
                var stat = fs.stat(file_path, function (err, stats) {
                    var exists = null;
                    if (err != null) {
                        if (err.code == "ENOENT") {
                            exists = false;
                        }
                        else {
                            callback(null, new Error("Could not stat path " + file_path + ": " + err.message));
                        }
                    }
                    var return_file = function () {
                        callback(new NodeFileEntry(name, _this.full_path, _this.full_path), null);
                    };
                    var create_and_return_file = function () {
                        fs.open(file_path, 'w', function (err, fd) {
                            if (err) {
                                callback(null, Error("Could not create " + file_path + ": " + err.message));
                                return;
                            }
                            fs.close(fd);
                            return_file();
                        });
                    };
                    var is_file = function () {
                        return stats.isFile();
                    };
                    var error = function (e) {
                        switch (e) {
                            case "EEXIST":
                                callback(null, new Error(file_path + " already exists and the exclusive flag is set."));
                                break;
                            case "ENEXIST":
                                callback(null, new Error(file_path + " does not exist and create flag is not set."));
                                break;
                            case "ETYPE":
                                callback(null, new Error(file_path + " is a directory."));
                                break;
                        }
                    };
                    createEntry(flags, exists, is_file, create_and_return_file, return_file, error);
                });
            };
            NodeDirEntry.prototype.getDirectory = function (name, flags, callback) {
                var _this = this;
                if (typeof flags == 'undefined') {
                    flags = {
                        create: false,
                        exclusive: false
                    };
                }
                var fs = require('fs');
                var path = require('path');
                var file_path = path.join(this.full_path, name);
                var stat = fs.stat(file_path, function (err, stats) {
                    var exists = null;
                    if (err != null) {
                        if (err.code == "ENOENT") {
                            exists = false;
                        }
                        else {
                            callback(null, new Error("Could not stat path " + file_path + ": " + err.message));
                        }
                    }
                    var return_dir = function () {
                        callback(new NodeDirEntry(name, _this.full_path, _this.full_path));
                    };
                    function create_and_return_dir() {
                        fs.mkdir(file_path, function (err) {
                            if (err) {
                                callback(null, Error("Could not create " + file_path + ": " + err.message));
                                return;
                            }
                            return_dir();
                        });
                    }
                    var is_directory = function () {
                        return stats.isDirectory();
                    };
                    var error = function (e) {
                        switch (e) {
                            case "EEXIST":
                                callback(null, new Error(file_path + " already exists and the exclusive flag is set."));
                                break;
                            case "ENEXIST":
                                callback(null, new Error(file_path + " does not exist and create flag is not set."));
                                break;
                            case "ETYPE":
                                callback(null, new Error(file_path + " is a file."));
                                break;
                        }
                    };
                    createEntry(flags, exists, is_directory, create_and_return_dir, return_dir, error);
                });
            };
            return NodeDirEntry;
        }(NodeEntry));
        function chooseEntryNW(chooser_type, success, failure) {
            var chooser = document.createElement('input');
            chooser.setAttribute('type', 'file');
            if (chooser_type == "directory") {
                chooser.setAttribute('nwdirectory', '');
            }
            $(chooser).change(function (ev) {
                var fs = require('fs');
                var path = require('path');
                var file_path = chooser.value;
                var basename = path.basename(file_path);
                var parent_path = path.dirname(file_path);
                if (chooser_type == 'directory') {
                    var dir_entry = new NodeDirEntry(basename, undefined, parent_path);
                    success(dir_entry);
                }
                else if (chooser_type == 'file') {
                    var file_entry = new NodeFileEntry(basename, undefined, parent_path);
                    success(file_entry);
                }
            });
            chooser.click();
        }
        function chooseEntryWinRT(chooser_type, success, failure) {
            if (chooser_type == 'directory') {
                var dirPicker = new Windows.Storage.Pickers.FolderPicker();
                dirPicker.fileTypeFilter.replaceAll(["*"]);
                dirPicker.pickSingleFolderAsync().done(function (folder) {
                    if (folder == null)
                        return;
                    success(new WinRTDirEntry(folder));
                }, failure);
            }
            else if (chooser_type == 'file') {
                var filePicker = new Windows.Storage.Pickers.FileOpenPicker();
                filePicker.fileTypeFilter.replaceAll(["*"]);
                filePicker.pickSingleFileAsync().done(function (file) {
                    if (file == null)
                        return;
                    success(new WinRTFileEntry(file));
                }, failure);
            }
            else {
                throw new Error('chooser_type has to be "file" or "directory"');
            }
        }
        function openFileWithSystemDefaultNW(file) {
            if (Platform.platform === 'node-webkit') {
                var gui = require('nw.gui');
                var nw_entry = file;
                gui.Shell.openItem(nw_entry.get_full_path());
            }
        }
        Windows.System.Launcher.launchUriAsync;
        function openFileWithSystemDefaultWinRT(file) {
            if (file.isFile()) {
                var winrt_file_entry = file;
                Windows.System.Launcher.launchFileAsync(winrt_file_entry.getStorageItem());
            }
            else if (file.isDirectory()) {
                var winrt_dir_entry = file;
                Windows.System.Launcher.launchFolderAsync(winrt_dir_entry.getStorageItem());
            }
        }
        function openURLWithSystemDefaultWinRT(url) {
            Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(url));
        }
        function appDataDirNW(callback) {
            var gui = require('nw.gui');
            var path = require('path');
            var fs = require('fs');
            var data_dir = path.join(gui.App.dataPath, "appdata");
            fs.mkdir(data_dir, function (err) {
                if (err != null) {
                    if (err.code == "EEXIST") {
                        console.log("Data directory already exists");
                    }
                    else {
                        console.debug(err);
                        return;
                    }
                }
                else {
                    console.debug("Created " + data_dir);
                }
            });
            var basename = path.basename(data_dir);
            var parent_full_path = path.dirname(data_dir);
            callback(new NodeDirEntry(basename, undefined, parent_full_path));
        }
        function appDataDirWinRT(callback) {
            callback(new WinRTDirEntry(Windows.Storage.ApplicationData.current.localFolder));
        }
        function retainEntryNW(entry) {
            return JSON.stringify([entry.get_full_path(), entry.get_base_name()]);
        }
        function retainEntryWinRT(entry) {
            return Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(entry.getStorageItem());
        }
        function restoreEntryNW(id, success, failure) {
            var fs = require('fs');
            var path = require('path');
            try {
                var id_arr = JSON.parse(id);
            }
            catch (e) {
                failure(e);
                return;
            }
            var full_parent_path = path.dirname(id_arr[0]);
            var root_parent_path = id_arr[1];
            var basename = path.basename(id_arr[0]);
            try {
                var stat = fs.statSync(full_parent_path);
            }
            catch (e) {
                //            console.error(e.message);
                failure(e);
                return;
            }
            if (stat.isFile()) {
                success(new NodeFileEntry(basename, root_parent_path, full_parent_path));
            }
            else if (stat.isDirectory()) {
                success(new NodeDirEntry(basename, root_parent_path, full_parent_path));
            }
        }
        function restoreEntryWinRT(id, success, failure) {
            Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.getItemAsync(id).done(function (storageItem) {
                if (storageItem.isOfType(Windows.Storage.StorageItemTypes.file)) {
                    success(new WinRTFileEntry(storageItem));
                }
                else if (storageItem.isOfType(Windows.Storage.StorageItemTypes.folder)) {
                    success(new WinRTDirEntry(storageItem));
                }
            }, function (err) {
                failure(new Error("Could not restore entry: " + err.message));
            });
        }
    })(fs = Platform.fs || (Platform.fs = {}));
})(Platform || (Platform = {}));
var Platform;
(function (Platform) {
    Platform.platform = "unknown";
    var initiatated = false;
    /**
     * Initialises the Platform layer. Call before using any other function in this module.
     */
    function init() {
        if (initiatated) {
            console.log("Platform already initated");
            return;
        }
        if (typeof Windows !== 'undefined') {
            Platform.platform = 'WinRT';
        }
        else if (typeof module !== 'undefined') {
            Platform.platform = "node-webkit";
        }
        console.log("Platform detected: " + Platform.platform);
        if (Platform.platform == 'WinRT') {
            Platform.localStorage = localStorageNW;
        }
        else if (Platform.platform == 'node-webkit') {
            Platform.localStorage = localStorageNW;
        }
        Platform.fs.init();
        initiatated = true;
    }
    Platform.init = init;
    var localStorageNW = {
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
                callback(new Error("Could not store item: entry is not an object"));
                ;
            }
            else 
            // check entry has only one member
            if (Object.keys(entry).length != 1) {
                callback(new Error("Could not store item: entry is longer than one key-value pair"));
            }
            var key = Object.keys(entry)[0];
            var value = entry[key];
            if (typeof value == "object" || typeof value == "array") {
                value = JSON.stringify(value);
            }
            else {
                callback(new Error("Could not store item: Value of item has to be a valid JSON-able object or array"));
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
        get: function (query, callback) {
            if (typeof query == "array") {
            }
            else if (typeof query == "string") {
                var value = window.localStorage.getItem(query);
                if (value == null)
                    callback(null, Error('Key was not found'));
                else
                    callback(JSON.parse(value));
            }
            else if (query == null) {
                var key, value;
                var obj = {};
                for (var iii = 0; iii < window.localStorage.length; iii++) {
                    key = window.localStorage.key(iii);
                    value = window.localStorage.getItem(key);
                    try {
                        value = JSON.parse(value);
                    }
                    catch (e) {
                    }
                    obj[key] = value;
                }
                callback(obj);
            }
        }
    };
})(Platform || (Platform = {}));
/*  Search box widget. NOTE: Currently doesn't position itself:
    @search_cb: Callback to be executed at every keypress of the search text input. Parameters of callback:
        @query: String containing the text entered in the text input.
*/
var SearchBox = (function () {
    function SearchBox(search_cb) {
        var that = this;
        if (!SearchBox.serial_id) {
            SearchBox.serial_id = 0;
        }
        this.searchbox_id = SearchBox.serial_id++;
        this.$main_container = $('<div class="searchbox-container">');
        this.$main_container.attr('id', 'sb' + this.searchbox_id);
        this.$main_container.append($('<div class=\"sb-search-icon-cont\"> <img class=\"sb-icon\" src=\"../icons/mag-glass.svg\"> </div> <input class=\"sb-text-input\" type=\"search\" placeholder=\"Search movies\">'));
        var $text_input = this.$main_container.find('.sb-text-input');
        $text_input.on('input', function () {
            search_cb($text_input.val());
        });
    }
    return SearchBox;
}());
/// <reference path="./MovieItem.ts"/>
var SearchView = (function () {
    function SearchView() {
        var that = this;
        this.$main_container = $("<div class='search-view'><div>");
        this.movie_item_container = [];
    }
    /*
      Add a MovieItem to be shown as the results.
        movie_info: MovieItem to add to the SearchView
    */
    SearchView.prototype.add_item = function (movie_item) {
        var $clone = movie_item.$item_container.clone();
        this.movie_item_container.push(movie_item);
        this.$main_container.append($clone);
    };
    // Clear the SearchView of all results
    SearchView.prototype.clear = function () {
        this.$main_container.children().remove();
        this.movie_item_container = [];
    };
    return SearchView;
}());
/*
    A thin wrapper for TheMovieDb.org's API.
*/
var TMDb;
(function (TMDb_1) {
    var API_KEY = '';
    var SEARCH_URL = "http://api.themoviedb.org/3/search/movie";
    var MOVIE_INFO_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID";
    var IMAGE_BASE_URL = "http://image.tmdb.org/t/p/";
    var CREDITS_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID/credits";
    var REVIEWS_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID/reviews";
    var GENRES_URL = "http://api.themoviedb.org/3/genre/list";
    var TMDb = (function () {
        function TMDb(api_key) {
            var _this = this;
            API_KEY = api_key;
            this.IMAGE_BASE_URL = IMAGE_BASE_URL;
            this.req_queue = [];
            this.req_count = 0;
            this.max_req_per_10_sec = 40;
            setInterval(function () {
                _this.req_count = 0;
                _this.flush_req();
            }, 10 * 1000);
        }
        TMDb.prototype.flush_req = function () {
            while (this.req_count < this.max_req_per_10_sec && this.req_queue.length > 0) {
                this.req_count++;
                this.req_queue.pop()();
                console.debug("queued request " + this.req_count + " flushed.");
            }
        };
        TMDb.prototype.register = function (func) {
            this.req_queue.push(func);
            this.flush_req();
        };
        // Searches for movies with the string provided.
        // The callback is called with the result of the search
        // The result parameter passed to the callback is either set to the object of the first hit,
        // or is set to the string "not found" if no hits were found.
        TMDb.prototype.search_movie = function (qry_str, cb) {
            this.register(function () {
                function on_reply(resp) {
                    if (resp.results.length > 0) {
                        cb(resp.results[0]);
                    }
                    else {
                        cb("not found");
                    }
                }
                $.getJSON(SEARCH_URL, {
                    api_key: API_KEY,
                    query: qry_str
                }, on_reply);
            });
        };
        // Gets detailed info about the movie with the ID passed
        // The callback is called with the result
        // If movie exists, and a proper object is returned, the callback is called with the returned object,
        // else it is called with the string "not found".
        TMDb.prototype.get_movie_info = function (id, cb) {
            this.register(function () {
                $.getJSON(MOVIE_INFO_URL.replace("MOVIE_ID", id.toString()), {
                    api_key: API_KEY
                }, on_reply);
                function on_reply(resp) {
                    if ("id" in resp) {
                        cb(resp);
                    }
                    else {
                        cb("not found");
                    }
                }
            });
        };
        TMDb.prototype.get_credits = function (id, cb) {
            this.register(function () {
                $.getJSON(CREDITS_URL.replace("MOVIE_ID", id.toString()), {
                    api_key: API_KEY
                }, on_reply);
                function on_reply(resp) {
                    if ("cast" in resp) {
                        cb(resp);
                    }
                    else {
                        cb("not found");
                    }
                }
            });
        };
        /*
            calls callback with true if found and false if not found as the first argument.
            The genres array is passed as the second argument  if successful.

            cb: Callback with the parameters:
                error: error thrown if the list could not be fetched. Null if no error.
                genres_array: Array of genre objects. Null if error occured.
        */
        TMDb.prototype.get_genres = function (cb) {
            this.register(function () {
                $.getJSON(GENRES_URL, {
                    api_key: API_KEY
                }, on_reply);
                function on_reply(resp) {
                    //            console.log("Got the fucking reply.");
                    //            console.log(resp);
                    if ("genres" in resp) {
                        cb(null, resp.genres);
                    }
                    else {
                        cb(Error("Could not get genres list from server."), null);
                    }
                }
            });
        };
        return TMDb;
    }());
    TMDb_1.TMDb = TMDb;
})(TMDb || (TMDb = {}));
// Global object containing utility methods. No properties live here
var Utils = {
    // Accepts a directoryEntry
    // calls callback with an array of all it's children
    get_dir_chilren: function (dir, cb) {
        var dir_reader = dir.createReader();
        // Array to hold Entries for the this directory's children
        var child_list = [];
        // load Entries from directory
        // This calls readEntries till no more entries are returned
        function read_children() {
            dir_reader.readEntries(function (entries) {
                if (entries.length == 0) {
                    cb(child_list);
                }
                else {
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
    clean_list: function (item_list, remove_list) {
        // Remove the ones that could not be recognised
        remove_list.forEach(function (index, i, list) {
            item_list.splice(index - i, 1);
        });
        remove_list.length = 0;
    },
    get_image: function (url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                on_reply(xhr.response);
            }
        };
        xhr.send();
        function on_reply(resp) {
            var buffer = new Uint8Array(resp);
            cb(new Blob([buffer], { type: "image/jpeg" }));
        }
    }
};
//# sourceMappingURL=app.js.map