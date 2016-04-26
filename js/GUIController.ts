interface IGenre {
    id: number;
    name: string;
}



// This object controls the user interface
class GUIController {


    private controller: Controller;


    // list of MovieItems added to the GUIController
    private movie_item_list: MovieItem[];


    private $container: JQuery;


    private main_view: ListView;


    private $content_container: JQuery;


    private $player: JQuery;


    private $sidebar: JQuery;


    private $toolbar: JQuery;


    private searchbox: SearchBox;


    private searchview: ListView;

    private genreview: ListView;

    private $genre_filter: JQuery;

    private genre_list: IGenre[];

    private current_view: string; // TODO: make this into enum


    private playing: boolean;

    private genre_all_added : boolean;

    private genres_list : IGenre;


    constructor (controller) {

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

        this.searchbox = new SearchBox((query: string) => this.search(query));

        this.searchview = new ListView();

        this.genreview = new ListView();

        this.$genre_filter = $('#genres-list');

        this.genre_list = [];

        console.log(this.$genre_filter);

        this.current_view = 'listview';

        this.playing = false;

        this.genre_all_added = false;

        this.init_ui();

    }

	private init_ui () {
        
        console.log("initializing UI");

        this.$toolbar.append(this.searchbox.$main_container);

        $("#add-button").click(() => {
            console.log("clicked");
			Platform.fs.chooseEntry("directory", (entry: Platform.fs.DirEntry) => {
				console.log("selected directory " + entry.get_base_name());
				this.controller.load_new_movies_from_dir(entry);
			}, undefined);  // TODO: Add Error handling
		});

        $("#close-button").click(function(event) {
            window.close();
        });

        $('#expand-button').click((event) => {
            this.expand_sidebar();
        });

        this.$content_container.append(this.main_view.$main_container);



	}


    /*
        Adds an array of genres to the list and the filter if not already present
    */
    private add_genres (genres: IGenre[]) {

        if (this.genre_all_added == false) {
            this.add_genre_filter_item({
                id: -1,
                name: "All"
            });
            this.genre_all_added = true;
        }

        genres.forEach((genre_from_movie: IGenre) => {
            var found = false;
            this.genre_list.forEach((genre_from_list: IGenre) => {
                if (genre_from_movie.id === genre_from_list.id) {
                    found = true;
                }
            });
            if (found === false) {
                this.genre_list.push(genre_from_movie);
                this.add_genre_filter_item(genre_from_movie);
            }
        });

    }


    private add_genre_filter_item (genre: IGenre) {

        var $genre_filer_item = $('<li>' + genre.name + '</li>');
        $genre_filer_item.click((ev) => {
            this.show_genre(genre);
            console.log("clicked" + genre.name);
        });
        this.$genre_filter.append($genre_filer_item);

    }


    private show_genre (req_genre: IGenre) {
        this.genreview.clear();
        if (req_genre.name == 'All') {
            this.toggle_view('listview');
        } else {
            this.toggle_view('genreview');
            this.movie_item_list.forEach((movie_item: MovieItem) => {
                var added = false;
                movie_item.movie.movie_info.genres.forEach((movie_genre: IGenre) => {
                    if (added == false && req_genre.id == movie_genre.id) {
                        this.genreview.add_item(movie_item);
                        added = true;
                    }
                });
            })
        }

    }


    public search (query: string) {

        this.searchview.clear();
        if (query == '') {
            this.toggle_view('listview');
        } else {
            this.toggle_view('searchview');
            var regex = new RegExp(query, 'i');
            this.movie_item_list.forEach((movie_item: MovieItem, index, list) => {
                if (regex.test(movie_item.movie.movie_info.title)) {
                    this.searchview.add_item(movie_item);
                }
            });
        }

    }


    private toggle_view (view: string) {

        var add = (list_view: ListView) => {
            this.current_view = view;
            this.$content_container.append(list_view.$main_container);
        }

        this.$content_container.children().detach();

        switch (view) {
            case 'listview': add(this.main_view);
                break;
            case 'searchview': add(this.searchview);
                break;
            case 'genreview': add(this.genreview);
        }

    }




    private expand_sidebar () {
        $('#toolbar, #content').toggleClass('sidebar-collapsed');
        $('#sidebar, #toolbar, #content').toggleClass('sidebar-expanded');
    }

    public add_movie_item (movie: Movie) {

        var movie_item = new MovieItem(movie, {
            play: this.play_movie,
            stop: this.stop_movie,
            open_dir: this.open_containing_directory,
            open_imdb_page: this.open_imdb_page
        });

        this.movie_item_list.push(movie_item);

        this.main_view.add_item(movie_item);

        this.add_genres(movie.movie_info.genres)

    }

    private play_movie (movie_item: MovieItem) {

        Platform.fs.openFileWithSystemDefault(movie_item.movie.video_file);

    }

    private open_containing_directory (movie_item: MovieItem) {
        
        movie_item.movie.video_file.getParentDirectory().then((dir) => {
            Platform.fs.openFileWithSystemDefault(dir);
        }, (err) => {
            console.log(err.message);
        });
        
    }

    private open_imdb_page (movie_item: MovieItem) {
        const IMDB_BASE_URL = "http://www.imdb.com/title/";
        Platform.fs.openURLWithSystemDefault(IMDB_BASE_URL + movie_item.movie.movie_info.imdb_id);
    }


    private stop_movie () {

        // TODO: Remove this dead code
        // if (this.playing) {
        //     this.$player.get(0).pause();
        //     this.$player.detach();
        //     this.$container.appendTo('body');
        //     this.playing = false;
        // }

    }


}
