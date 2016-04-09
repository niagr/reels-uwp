interface IMovieInfo {
    id: number;
    title: string;
    imdb_id: string;
    year: number;
    tagline: string;
    description: string;
    posterpath: string;
    genres: IGenre[];
    crew: any[];
    cast: any[];
}

interface IPosterCallback {
    (_poster_blob: Blob): any
}

interface IGetAndSaveInfoCallback {
    (result: boolean, movie: Movie, param: any): any;
}

//declare var window;

//declare var Utils;

class Movie {


    public video_file: Platform.fs.FileEntry;

    public search_title: string;

    public search_year: string;

    private _poster_blob: Blob;

    private _is_poster_loaded: boolean;

    private _onPosterLoaded: IPosterCallback[];

    public movie_info: IMovieInfo;

    public tmdb: TMDb.TMDb;


    constructor (_video_file: Platform.fs.FileEntry) {

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
        }
        this._onPosterLoaded = [];

    }


    public getDirector(): string {
        for (var iii = 0; iii < this.movie_info.crew.length; iii++) {
            if (this.movie_info.crew[iii].job == "Director") {
                return this.movie_info.crew[iii].name;
            }
        }
    }


    public get_nth_cast (num: number): string {
        for (var iii = 0; iii < this.movie_info.cast.length; iii++) {
            if (this.movie_info.cast[iii].order == num) {
                return this.movie_info.cast[iii].name;
            }
        }
    }


    // use filename to get the title and year of the movie
	// sets the variables and returns true if match found, else returns false
    public infer_title_and_year () : boolean {

        let basename = this.video_file.get_base_name();

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
		} else {
			return false;
		};

    }


    // gets the movie information from TMDb's database
    // and saves the info to files and populates the data fields
    // calls the callback with true if hit found, false otherwise
    // also passes the Movie object itself and a parameters object
    public get_and_save_info (cb: IGetAndSaveInfoCallback, param: any) : void {



		var onSearch = (result) => {
			if (result == "not found") {
				cb(false, this, param);
			} else {
				this.tmdb.get_movie_info(result.id, onReturnInfo)
			}
		}

        var onReturnInfo = (result) => {

			if (result == "not found") {
				cb(false, this, param);
			} else {
				this.movie_info.title = result.title;
                this.movie_info.id = result.id;
                this.movie_info.imdb_id = result.imdb_id;
                this.movie_info.description = result.overview;
                this.movie_info.tagline = result.tagline;
                this.movie_info.posterpath = this.tmdb.IMAGE_BASE_URL +  "w154" + result.poster_path;
                this.movie_info.genres = result.genres;
                this.tmdb.get_credits(result.id, onReturnCredits)
			}

		}

        var onReturnCredits = (result) => {

            if (result == "not found") {
				cb(false, this, param);
			} else {
                this.movie_info.cast = result.cast;
                this.movie_info.crew = result.crew;
				cb(true, this, param);
			}

        }

        this.tmdb.search_movie(this.search_title, onSearch);

    }


    /*
        @blob : blob of image file to set as poster
        Sets the poster to the passed image blob
        Then calls the pending callbacks that need the poster object
    */
    public set_poster_blob (blob: Blob) {

        this._poster_blob = blob;
        this._is_poster_loaded = true;
        this._onPosterLoaded.forEach((callback) => {
                callback(this._poster_blob);
        });

    }


    /*
        Fetches the poster from the url specified in the Movie's movie_info object
        Then calls the pending callbacks that need the poster object
    */
    public load_poster () {

        Utils.get_image(this.movie_info.posterpath, (blob) => {
            this._poster_blob = blob;
            this._is_poster_loaded = true;
//            _onPosterLoaded(_poster_blob);
            this._onPosterLoaded.forEach((callback) => {
                callback(this._poster_blob);
            });
        });

    }


    // called by the party that wants the poster
    // callback has same signature as _onPosterLoaded
    public poster(cb: IPosterCallback) {

        if (this._is_poster_loaded) {
            cb(this._poster_blob);
        } else {
            this._onPosterLoaded.push(cb);
        }

    }



}
