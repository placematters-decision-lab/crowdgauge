/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 3:20 PM
 */
(function () { // self-invoking function
    SAS.MapFrame = function () {
        var _self = this;

        //region private fields and methods
        var _mapframe;
        var _showDivs = function (show) {
            $("#mapDiv").toggle(show);
        };
        //endregion

        //region public API
        this.showDivs = function (show) {
            _showDivs(show);
        };

        this.loadContent = function (pages) {
            //$("#mapDiv").addClass("underCons").css("height", 250);
            //$("#mapDiv").html("<p>Map view of results coming soon (once we have more responses).</p><p>Please check back later. You will be able to click the link in the header bar to go straight to the map.</p>")
            //$("#mapDiv").html("");
//            $("<a href='#'>Check out the Scenarios</a>").appendTo("#mapDiv").click(function () {
//                pages.gotoCompare();
//            });
            if (_mapframe == null) {
                _mapframe = $('<iframe id="results_mapframe" scrolling="no" FRAMEBORDER="0" width="100%" height="100%">').appendTo("#mapDiv");
                _mapframe.load(function() {
                    pages.updateLayout();
                });
                _mapframe.attr("src", "rpsd/map/index.html");
            }
            //$("#mapDiv").style("top", $("#titleBar").height());

        };
        //endregion
    }
})();