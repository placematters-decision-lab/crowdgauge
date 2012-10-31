/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:42 PM
 */
(function () { // self-invoking function
    SAS.MiniBubbleChart = function (bigBubbleChart) {
        var _self = this;
        var miniR = 30;
        /** @type SAS.BubbleChart */
        var _bigBubbleChart = bigBubbleChart;
        var _circlesById = {};
        var _miniVis;

        //region private fields and methods
        var _addMiniBubbleChart = function (sel, values) {
            _miniVis = d3.select(sel).append("svg")
                .attr("width", miniR)
                .attr("height", miniR)
                .attr("class", "bubbleMini");

            var scale = miniR / _bigBubbleChart.getRadius();
            var grp = _miniVis.append("g")
                .attr("transform", "scale(" + scale + ")");

            _circlesById = {};
            _getMainCirclesFromBig().each(function (d, i) {
                var score = (values[d.id]) ? values[d.id] : "na";
                _circlesById[d.id] = grp.append("circle")
                    .attr("class", "score_" + score)
                    .attr("r", d.r)
                    .attr("transform", "translate(" + d.x + "," + d.y + ")");
            });
        };

        var _showDivs = function (show) {
            _miniVis.attr("display", (show) ? "block" : "none");
        };

        var _updateSizes = function () {
            _getMainCirclesFromBig().each(function (d, i) {
                _circlesById[d.id]
                    .attr("r", d.r)
                    .attr("transform", "translate(" + d.x + "," + d.y + ")");
            });
        };

        var _getMainCirclesFromBig = function () {
            return _bigBubbleChart.getSvg().selectAll("g.node")
                .selectAll("circle")
                .filter(function (d) {//--remove all inner effect circles...
                    return d3.select(this).attr("r") == _bigBubbleChart.getCircleRad().toString();
                });
        };

        //endregion

        //region public API
        this.showDivs = function (show) {
            _showDivs(show);
        };

        this.addMiniBubbleChart = function (sel, values) {
            _addMiniBubbleChart(sel, values);
        };

        this.updateSizes = function () {
            _updateSizes();
        };
        //endregion
    }
})();