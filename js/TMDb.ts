/*
    A thin wrapper for TheMovieDb.org's API.
*/

module TMDb {


    var API_KEY : string = '';

	const SEARCH_URL = "http://api.themoviedb.org/3/search/movie";
    const MOVIE_INFO_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID";
    const IMAGE_BASE_URL = "http://image.tmdb.org/t/p/";
    const CREDITS_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID/credits";
    const REVIEWS_URL = "http://api.themoviedb.org/3/movie/MOVIE_ID/reviews";
    const GENRES_URL = "http://api.themoviedb.org/3/genre/list"


    export class TMDb {

        IMAGE_BASE_URL: string;

        private req_queue: Function[];

        private req_count: number;

        private max_req_per_10_sec: number;


        constructor (api_key: string) {

            API_KEY = api_key;
            this.IMAGE_BASE_URL = IMAGE_BASE_URL;
            this.req_queue = [];
            this.req_count = 0;
            this.max_req_per_10_sec = 40;


            setInterval(() => {
                this.req_count = 0;
                this.flush_req();
            }, 10 * 1000);


        }


        private flush_req () {

            while (this.req_count < this.max_req_per_10_sec && this.req_queue.length > 0) {
                this.req_count++;
                this.req_queue.pop()();
                console.debug("queued request " + this.req_count + " flushed.");
            }

        }


        private register (func: Function) {

            this.req_queue.push(func);
            this.flush_req();

        }


        // Searches for movies with the string provided.
    	// The callback is called with the result of the search
    	// The result parameter passed to the callback is either set to the object of the first hit,
    	// or is set to the string "not found" if no hits were found.
        public search_movie (qry_str: string, cb: {(string): any}) {

            this.register(() => {

                function on_reply(resp) {

        			if (resp.results.length > 0) {
        				cb(resp.results[0]);
        			} else {
        				cb("not found")
        			}

        		}

        		$.getJSON(SEARCH_URL, {
        			api_key: API_KEY,
        			query: qry_str
        		}, on_reply);

            });



        }


        // Gets detailed info about the movie with the ID passed
    	// The callback is called with the result
    	// If movie exists, and a proper object is returned, the callback is called with the returned object,
    	// else it is called with the string "not found".
    	public get_movie_info (id: number, cb: {(string): void}) {

            this.register(() => {

        		$.getJSON(MOVIE_INFO_URL.replace("MOVIE_ID", id.toString()), {
        			api_key: API_KEY
        		}, on_reply);

        		function on_reply(resp) {

        			if ("id" in resp) {
        				cb(resp);
        			} else {
        				cb("not found")
        			}

        		}

            });


    	}


        public get_credits (id: number, cb: {(string): void}) {

            this.register(() => {

                $.getJSON(CREDITS_URL.replace("MOVIE_ID", id.toString()), {
        			api_key: API_KEY
        		}, on_reply);

        		function on_reply(resp) {

        			if ("cast" in resp) {
        				cb(resp);
        			} else {
        				cb("not found")
        			}

        		}

            });


        }


        /*
            calls callback with true if found and false if not found as the first argument.
            The genres array is passed as the second argument  if successful.

            cb: Callback with the parameters:
                error: error thrown if the list could not be fetched. Null if no error.
                genres_array: Array of genre objects. Null if error occured.
        */
        public get_genres (cb: {(Error?, any?)}) {

            this.register(() => {

                $.getJSON(GENRES_URL, {
        			api_key: API_KEY
        		}, on_reply);

        		function on_reply(resp) {

        //            console.log("Got the fucking reply.");
        //            console.log(resp);

        			if ("genres" in resp) {
        				cb(null, resp.genres);
        			} else {
        				cb(Error("Could not get genres list from server."), null);
        			}

        		}

            });


        }


    }


}
