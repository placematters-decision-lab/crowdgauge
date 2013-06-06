/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 10:55 PM
 */
(function () { // self-invoking function
    SAS.MapItemList = function () {
        var _self = this;
        var TOP = "top";
        var _topNum;
        //region private fields and methods
        var _items;
        var _itemDivsById;
        var _selectedItem;
        var _onSelect = function () {};

        var _updateSelectionDisplay = function () {
            $(".itemLegendRow").removeClass("selected");
            if (!_selectedItem) return;
            if (_selectedItem.id) {
                _itemDivsById[_selectedItem.id].addClass("selected");
            }
            else {
                _itemDivsById[_selectedItem.data.uid].addClass("selected");
            }
        };

        var _loadData = function () {
            $("#itemList").html('');
            _itemDivsById = {};
            var top5Div = $("<div class='itemLegendRow'></div>").appendTo("#itemList");
            $("<div class='itemColorItem'></div>").appendTo(top5Div);//used as spacer
            var top5txt = $("<div class='itemItemLabel'></div>").appendTo(top5Div);
            top5txt.html("Display Top " + _topNum + " for Each Location");
            _itemDivsById[TOP] = top5Div;
            top5Div.click(function () {
                _selectedItem = {id:TOP};
                _updateSelectionDisplay();
                _onSelect(null);
            });

            $.each(_items, function(i, item) {
                var div = $("<div class='itemLegendRow'></div>").appendTo("#itemList");
                _itemDivsById[item.data.uid] = div;
                var colorItem = $("<div class='itemColorItem'></div>").appendTo(div);
                colorItem.html(item.props.letter);
                var textColor = d3.hsl(item.data.color.background);
                if (item.data.color.textShift === 'brighter') {
                    textColor = textColor.brighter(3)
                } else {
                    textColor = textColor.darker(2)
                }
                colorItem.css("color", textColor.toString());
                colorItem.css("background-color", item.data.color.background);
                var txt = $("<div class='itemItemLabel'></div>").appendTo(div);
                txt.html(SAS.localizr.getProp(item.data, 'title'));
                div.click(function () {
                    _selectedItem = item;
                    _updateSelectionDisplay();
                    _onSelect(_selectedItem);
                });
            });

            _selectedItem = {id:TOP};
            _updateSelectionDisplay();
        };
        //endregion

        //region public API
        this.loadData = function(data, topNum) {
            _topNum = topNum;
            _items = data;
            _loadData();
        };

        this.onSelect = function (fn) {
            _onSelect = fn;
        };
        //endregion
    }
})();