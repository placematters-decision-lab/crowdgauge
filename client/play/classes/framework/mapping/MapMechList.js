/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 10:55 PM
 */
(function () { // self-invoking function
    SAS.MapMechList = function () {
        var _self = this;
        var TOP = "top";
        var _topNum;
        //region private fields and methods
        var _mechanisms;
        var _mechDivsById;
        var _selectedMechanism;
        var _onSelect = function () {};

        var _updateSelectionDisplay = function () {
            $(".mechLegendRow").removeClass("selected");
            if (!_selectedMechanism) return;
            if (_selectedMechanism.id) {
                _mechDivsById[_selectedMechanism.id].addClass("selected");
            }
            else {
                _mechDivsById[_selectedMechanism.data.uid].addClass("selected");
            }
        };

        var _loadData = function () {
            $("#mechList").html("Projects and Policies");
            _mechDivsById = {};
            var top5Div = $("<div class='mechLegendRow'></div>").appendTo("#mechList");
            $("<div class='mechColorItem'></div>").appendTo(top5Div);//used as spacer
            var top5txt = $("<div class='mechItemLabel'></div>").appendTo(top5Div);
            top5txt.html("Display Top " + _topNum + " for Each Location");
            _mechDivsById[TOP] = top5Div;
            top5Div.click(function () {
                _selectedMechanism = {id:TOP};
                _updateSelectionDisplay();
                _onSelect(null);
            });

            $.each(_mechanisms, function(i, mech) {
                var div = $("<div class='mechLegendRow'></div>").appendTo("#mechList");
                _mechDivsById[mech.data.uid] = div;
                var colorItem = $("<div class='mechColorItem'></div>").appendTo(div);
                colorItem.html(mech.data.letter);
                var textColor = d3.hsl(mech.data.color.background);
                if (mech.data.color.textShift === 'brighter') {
                    textColor = textColor.brighter(3)
                } else {
                    textColor = textColor.darker(2)
                }
                colorItem.css("color", textColor.toString());
                colorItem.css("background-color", mech.data.color.background);
                var txt = $("<div class='mechItemLabel'></div>").appendTo(div);
                txt.html(SAS.localizr.getProp(mech.data, 'title'));
                div.click(function () {
                    _selectedMechanism = mech;
                    _updateSelectionDisplay();
                    _onSelect(_selectedMechanism);
                });
            });

            _selectedMechanism = {id:TOP};
            _updateSelectionDisplay();
        };
        //endregion

        //region public API
        this.loadData = function(data, topNum) {
            _topNum = topNum;
            _mechanisms = data;
            _loadData();
        };

        this.onSelect = function (fn) {
            _onSelect = fn;
        };
        //endregion
    }
})();