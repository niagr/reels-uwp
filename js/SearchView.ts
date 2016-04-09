/// <reference path="./MovieItem.ts"/>


class SearchView {


    // The main conaining div for the widget.
    public $main_container : JQuery;

    // List of MovieItem's added to the SearchView
    private movie_item_container: MovieItem[];


    constructor () {

        var that = this;

        this.$main_container = $("<div class='search-view'><div>");

        this.movie_item_container = [];

    }


    /*
      Add a MovieItem to be shown as the results.
        movie_info: MovieItem to add to the SearchView
    */
    public add_item (movie_item: MovieItem) {

        var $clone: JQuery = movie_item.$item_container.clone()
        this.movie_item_container.push(movie_item);
        this.$main_container.append($clone);

    }


    // Clear the SearchView of all results
    public clear () {
        this.$main_container.children().remove();
        this.movie_item_container = [];
    }

    // This function turned out to have a typo bug...turned out it was never used so noone ever found it. FUCK JAVASCRIPT!!
    // public remove_item = function(movie_item) {
    //
    //     item_container.forEach(function(item, index, list) {
    //         if (item.movie.movie_info.id == movie_item.movie.movie_info.id) {
    //             item.$item_container.detach();
    //             list.splice(index, 1);
    //         }
    //     })
    //
    // }


}
