/// <reference path="./Movie.ts"/>

interface IMovieItemEventHandler {
    play (m: MovieItem): void;
    stop (m: MovieItem): void;
    open_dir (m: MovieItem):void;
    open_imdb_page (m: MovieItem): void;
}

class MovieItem {


    public movie : Movie;

    public $item_container: JQuery;

    private $poster: JQuery;

    private $movie_info_comtainer: JQuery;

    private $controls_box: JQuery;

    private $movie_title: JQuery;

    private $director : JQuery;

    private $cast : JQuery;

    private $movie_description : JQuery;


    constructor (_movie: Movie, evHandler: IMovieItemEventHandler) {

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
                      (_movie.movie_info.imdb_id != '' ? '<img class="control-button open-imdb-page-button" src="../icons/IMDb_icon.png">' : '')  +
                      '<br/>' +
                      '<img class="control-button play-button" src="../icons/play-grey.png">' +
                      '<br/>' +
                      '<img class="control-button info-button" src="../icons/help-info-grey.png">' +
                      '<br/>' +
                      '<img class="control-button open-dir-button" src="../icons/folder.svg">' +
                  '</div>' +
               '</div>'

        this.$controls_box = $(html);
        this.$controls_box.find(".play-button").click(function(event) {
            evHandler.play(that);
        });
        this.$controls_box.find(".open-dir-button").click(function(event) {
            evHandler.open_dir(that);
        });
        this.$controls_box.find(".open-imdb-page-button").click(function(event) {
            evHandler.open_imdb_page(that);
        });

        this.$movie_title = this.$movie_info_comtainer.children(".movie-title");
        this.$director = this.$movie_info_comtainer.children(".director");
        this.$cast = this.$movie_info_comtainer.children(".cast");
        this.$movie_description = this.$movie_info_comtainer.children(".movie-description");

        this.movie.poster((blob) => {
            var img_url = URL.createObjectURL(blob);
            this.$poster.attr("src", img_url);
        });

        this.$movie_title.text(this.movie.movie_info.title);
        this.$director.text("Directed by " + this.movie.getDirector());
        this.$cast.text("Cast: " + this.movie.get_nth_cast(0) + ", " + this.movie.get_nth_cast(1) + ", " + this.movie.get_nth_cast(2));
        this.$movie_description.text(this.movie.movie_info.description);

        this.$item_container.append(this.$poster);
        this.$item_container.append(this.$movie_info_comtainer);
        this.$item_container.append(this.$controls_box);

    }


}
