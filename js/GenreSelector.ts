type IOnItemSelectedCallback = (item: IItem) => any;

interface IItem {
    id: number;
    name: string;
}

const ITEM_ALL: IItem =  {
    id: -1,
    name: "All"
}

class NavBar {
    
    
    
    
    private $container: JQuery;
    private widgetForItemName: {[itemName:string]:JQuery};
    
    private itemAllAdded: boolean;
    private itemList: IItem[];
    
    private onItemSelectedCallback: IOnItemSelectedCallback;
    
    public onItemSelected (callback: IOnItemSelectedCallback) {
        this.onItemSelectedCallback = callback;
    }
    
    constructor (_$container: JQuery, callback?: IOnItemSelectedCallback) {
        if (!_$container) {
            throw new Error('Invalid container element.');
        } else 
            this.$container = _$container;
            this.$container.addClass('navbar')
        if (callback) {
            this.onItemSelected(callback);
        }
        this.widgetForItemName = {};
        this.itemAllAdded = false;
        this.itemList = [];
        
        if (this.itemAllAdded == false) {
            this.addItem(ITEM_ALL);
            this.itemAllAdded = true;
        }
        
    }
    
    /*
        Adds an array of items to the list and the filter if not already present
    */
    public addItems (items: IItem[]) {

        

        items.forEach((item_from_movie: IItem) => {
            var found = false;
            this.itemList.forEach((item_from_list: IItem) => {
                if (item_from_movie.id === item_from_list.id) {
                    found = true;
                }
            });
            if (found === false) {
                this.itemList.push(item_from_movie);
                this.addItem(item_from_movie);
            }
        });

    }
    
    // BAD: recursive wrt setSelected
    // public forceSelectitem (item: IItem) {
    //     this.setSelected(item);
    // }
    
    private addItem (item: IItem) {

        var $item = $('<li>' + item.name + '</li>');
        $item.click((ev) => this.onItemSelectedCallback(item));
        this.$container.append($item);
        this.widgetForItemName[item.name] = $item;

    }
    
    public setSelected (item: IItem) {
        this.$container.children('li').removeClass('selected');       
        this.widgetForItemName[item.name].addClass('selected');        
    }
    
    
    
}