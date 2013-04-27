/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 10:55 PM
 */
(function () { // self-invoking function
    SAS.MapMechList = function () {
        var _self = this;
        var TOP = "top";
        //region private fields and methods
        var _mechanisms;
        var _mechDivsById;
        var _selectedMechanism;
        var _onSelect = function () {};

        var _updateSelectionDisplay = function () {
            $(".mechLegendRow").removeClass("selected");
            if (!_selectedMechanism) return;
            _mechDivsById[_selectedMechanism.id].addClass("selected");
        };

        var _loadData = function () {
            $("#mechList").html("Projects and Policies");
            _mechDivsById = {};
            var top5Div = $("<div class='mechLegendRow'></div>").appendTo("#mechList");
            $("<div class='mechColorItem'></div>").appendTo(top5Div);//used as spacer
            var top5txt = $("<div class='mechItemLabel'></div>").appendTo(top5Div);
            top5txt.html("Display Top 5 for Each City");
            _mechDivsById[TOP] = top5Div;
            top5Div.click(function () {
                _selectedMechanism = {id:TOP};
                _updateSelectionDisplay();
                _onSelect(null);
            });

//            $.each(_mechanisms.children, function(i, mech) {
            $.each(_mechanisms, function(i, mech) { // modified by ycui, 04262013
//                if (mech.category != "Project" && mech.category != "Policy") return true;//continue
                var div = $("<div class='mechLegendRow'></div>").appendTo("#mechList");
//                _mechDivsById[mech.id] = div;
                _mechDivsById[mech.data.uid] = div;
                var colorItem = $("<div class='mechColorItem'></div>").appendTo(div);
                colorItem.html(mech.letter);
                if (SAS.mainMapInstance.useWhiteForeground(mech.letter)) {
                    colorItem.css("color", "white");
                }
                colorItem.css("background-color", mech.color);
                var txt = $("<div class='mechItemLabel'></div>").appendTo(div);
//                txt.html(mech.text);
                txt.html(mech.data.title["en"]); // TODO: "en" -> others
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
        this.loadData = function(data) {
            _mechanisms = data;
            _loadData();
        };

        this.onSelect = function (fn) {
            _onSelect = fn;
        };
        //endregion
    }
})();