/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 11:56 PM
 */
(function () { // self-invoking function
    SAS.BarChart = function (svgNode) {
        var _self = this;

        //region private fields and methods
        var margin = {top:0, right:10, bottom:20, left:10},
            width = 400 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        //var _divId = "#barChart";
        var _data = null;
        var _mechanism;
        var index;
        var y;
        var x;
        var _svg = d3.select(svgNode);
        var _mainGroup;
        var bar;
        var rects;
        var numgs;

        var _setup = function () {
            index = d3.range(_data.length);
            index.sort(function (a, b) {
                return _data[b].percent - _data[a].percent;
            });

            y = d3.scale.linear()
                .domain([0, 40])//d3.max(data)
                .range([0, height]);//--leave extra label space..

            x = d3.scale.ordinal()
                .domain(index)
                .rangeRoundBands([0, width], .1);

            var barWidth = x.rangeBand();

            _mainGroup  = _svg.append("g");
            /*svg = d3.select(_divId).append("svg")
                .attr("class", "barChartSvg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");*/

            bar = _mainGroup.append("g").selectAll(".bar")
                .data(_data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function (d, i) { return "translate(" + x(i) + "," + (height - y(d.percent)) + ")"; });

            rects = bar.append("rect")
                .attr("class", "bar_rect")
                .style("fill", _mechanism.color)
                .attr("height", function (d) { return y(d.percent); })
                .attr("width", x.rangeBand());

            bar.append("text")
                .attr("class", "barLabel barLabelOuter")
                .attr("transform", "translate(" + (barWidth / 2) + " , -5) rotate(-90)")
                .text(function (d, i) { return d.city;});

            bar.append("text")
                .attr("class", "barLabel barLabelInner")
                .attr("transform", "translate(" + (barWidth / 2) + " , -5) rotate(-90)")
                .text(function (d, i) { return d.city;});

            $('svg rect.bar_rect').tipsy({
                gravity:'w',
                html:true,
                opacity:0.85,
                title:function () {
                    var d = this.__data__;
                    var perc = d.percent;
                    return _mechanism.ingText + " gets " + perc.toFixed(1) + "% of the votes in " + d.city;
                }
            });

            _addNumbers();
        };

        var _addNumbers = function () {
            var barWidth = x.rangeBand();

            var labels = [];
            $.each(_data, function (i, value) {
                labels.push(i + 1);
            });

            numgs = _mainGroup.append("g").selectAll("g.xAxis")
                .data(labels)
                .enter().append("g")
                .attr("class", "xAxis")
                .attr("visibility", _labelVis)
                .attr("transform", function (d, i) { return "translate(" + (x(i) + barWidth / 2) + ", " + height + ")" });

            numgs.append("circle")
                .attr("class", "xAxisCircle")
                .attr("r", barWidth / 3);

            numgs.append("text")
                .attr("class", "xAxisText")
                .attr("dy", "3")
                .text(function (d, i) {
                    return (i + 1);
                });
            //.attr("transform", "translate(0, 18)");

        };

        var _labelVis = function (d, i) {
            return (_data[index[i]].percent > 0) ? "visible" : "hidden";
            //return true;
        };

        var _update = function () {
            index.sort(function (a, b) {
                return _data[b].percent - _data[a].percent;
            });

            x.domain(index);

            rects.transition()
                .duration(750)
                .attr("height", function (d) {
                    return y(d.percent);
                })
                .style("fill", _mechanism.color);

            bar.transition()
                .duration(750)
                .delay(function (d, i) {
                    return 900 + x(i);//using x(i) results in left-most items moving first (was i * 50)
                })
                .attr("transform", function (d, i) { return "translate(" + x(i) + "," + (height - y(d.percent)) + ")"; });

            numgs.attr("visibility", "hidden");
            numgs.transition()
                .delay(1500)
                .attr("visibility", _labelVis);

        };

        var _updateLayout = function() {
            if (!_mainGroup) return;
            var fullHeight = $(window).height();
            _mainGroup.attr("transform", "translate(10, " + (fullHeight - height - 10) + ")");

        };

        var _showMain = function(show) {
            if (!_mainGroup) return;
            _mainGroup.attr("display", show ? "inherit" : "none");
        };

        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.updateLayout = function () {
            _updateLayout();
        };

        this.hide = function() {
            _showMain(false);
        };

        this.updateData = function (cityArr, mech) {
            _showMain(true);
            _mechanism = mech;
            if (!_data) {
                _data = [];
                $.each(cityArr, function (i, cityObj) {
                    _data.push({city:cityObj.city, percent:cityObj.percent * 100})
                });
                _setup();
            } else {
                //--update the percent on exist data
                var dataByCity = d3.nest().key(
                    function (d) { return d.city; }).map(cityArr)
                $.each(_data, function (i, dv) {
                    dv.percent = dataByCity[dv.city][0].percent * 100;
                });
                _update();
            }
        };
        //endregion
    }
})();