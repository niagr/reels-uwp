/*  Search box widget. NOTE: Currently doesn't position itself:
    @search_cb: Callback to be executed at every keypress of the search text input. Parameters of callback:
        @query: String containing the text entered in the text input.
*/
class SearchBox {


    private static serial_id: number;


    private searchbox_id: number;


    public $main_container: JQuery;



    constructor (search_cb) {


        var that = this;

        if (!SearchBox.serial_id) {
            SearchBox.serial_id = 0;
        }


        this.searchbox_id = SearchBox.serial_id++;

        this.$main_container = $('<div class="searchbox-container">');


        this.$main_container.attr('id', 'sb' + this.searchbox_id);

        this.$main_container.append($(
            '<div class=\"sb-search-icon-cont\"> <img class=\"sb-icon\" src=\"../icons/mag-glass.svg\"> </div> <input class=\"sb-text-input\" type=\"search\" placeholder=\"Search movies\">'
        ));

        var $text_input = this.$main_container.find('.sb-text-input');

        $text_input.on('input', function() {
            search_cb($text_input.val());
        });



    }

}
