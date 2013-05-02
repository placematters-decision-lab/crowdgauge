/**
 * User: kgoulding
 * Date: 4/19/12
 * Time: 4:47 PM
 */
(function () { // self-invoking function
    SAS.LocationChart = function (svgNode) {
        var _self = this;

        //region private fields and methods
        var _w = 30,
            _h = 100,
            _p = [120, 5, 5, 5],
            _x = d3.scale.ordinal().rangeRoundBands([0, _w - _p[1] - _p[3]]),
            _y = d3.scale.linear().range([0, _h - _p[0] - _p[2]]);

        var _svg = d3.select(svgNode);
        var _mainGroup;
        var _bgRect;
        var _xIndex = ["a"];//, "b", "c"];//--just using 1 chart right now, but allow for multiple

        var _getColor = function (d) {
            return d[0].m.mech.color.background;
        };
        var _yArr;
        var _chart;
        var _title;
        var _titleBar;
        var _labels;
        var _labelTxt;

        var _setupArr = function (percs) {
            _yArr = [];
            $.each(percs, function (k, arr) {
                $.each(arr, function (i, v) {
                    if (!_yArr[i]) _yArr[i] = [];
                    _yArr[i][_xIndex.indexOf(k)] = {x:k, y:v.perc, m:v};
                });
            });
        };

        var _updateValues = function (percs) {
            _setupArr(percs);
            _update();
        };

        var _update = function (duration) {
            if (!duration) duration = 1000;
            _y = d3.scale.linear().range([0, _h - _p[0] - _p[2]]);
            _y.domain([0, 1]);

            var stackedData = d3.layout.stack()(_yArr);
            _chart.data(stackedData);
            _chart.selectAll("rect")
                .data(Object)
                .transition()
                .duration(duration)
                .attr("y", function (d) {
                    return -_y(d.y0) - _y(d.y);
                })
                .attr("height", function (d) {
                    return _y(d.y);
                });


            _labels.data(stackedData);
            _labels.selectAll("text")
                .data(Object)
                .transition()
                .duration(duration)
                .attr("transform", _labelTrans)
                .attr("visibility", _labelVis);

            _titleBar.selectAll("text")
                .text(_title);

            _titleBar.attr("transform", _titleBarTrans);
        };


        var _titleBarTrans = function () {
            return "translate(" + (_w / 2) + " , " + (-(_h - _p[0])) + ")";
        };
        var _labelTrans = function (d) {
            return "translate(" + (_p[1] + 5 + _x(d.x)) + ", " + (-_y(d.y0) - _y(d.y) / 2 + 5) + ")";
        };
        var _labelVis = function (d) {
            return (_y(d.y) > 12) ? "visible" : "hidden";
        };

        var _loadData = function (percs) {
            _h = $(window).height() - 10;

            _setupArr(percs);
            var stackedData = d3.layout.stack()(_yArr);

            _x.domain(_xIndex);
            _y.domain([0, 1]);

            _mainGroup = _svg.append("g");
            _bgRect = _mainGroup.append("rect")
                .attr("class", "chartBgDark")
                .attr("height", _h)
                .attr("width", _w)
                .attr("y", -_h);

            _chart = _mainGroup.selectAll("g.bar_grp")
                .data(stackedData)
                .enter().append("svg:g")
                .attr("class", "bar_grp")
                .style("fill", function (d, i) {
                    return _getColor(d);
                })
                .style("stroke", function (d, i) { return d3.rgb(_getColor(d)).darker(); });

            // Add a rect for each date.
            var rect = _chart.selectAll("rect")
                .data(Object)
                .enter().append("svg:rect")
                .attr("class", "barrect")
                .attr("x", function (d) { return _p[1] + _x(d.x); })
                .attr("y", function (d) {
                    return -_y(d.y0) - _y(d.y);
                })
                .attr("height", function (d) {
                    if (_y(d.y) < 0) {
                        return -_y(d.y);
                    } else {
                        return _y(d.y);
                    }
                })
                .attr("width", _x.rangeBand());

            _labels = _mainGroup.selectAll("g.label")
                .data(stackedData)
                .enter().append("svg:g");

            _labelTxt = _labels.selectAll("text.mechLabel")
                .data(Object)
                .enter().append("svg:text")
                .attr("class", "mechLabel")
                .attr("transform", _labelTrans)
                .attr("visibility", _labelVis)
                .attr("fill", function (d, i) {
                    var colr = d3.hsl(d.m.mech.color.background);
                    if (d.m.mech.color.textShift == 'brighter') {
                        return colr.brighter(2);
                    }  else {
                        return colr.darker(2);
                    }

                })
                .text(function (d) {
                    return d.m.mech.letter;
                });

            _titleBar = _mainGroup.append("g")
                .attr("transform", _titleBarTrans);

            _titleBar.append("text")
                .attr("class", "barLabel barLabelOuter")
                .attr("transform", "rotate(-90)")

                .text(_title);

            _titleBar.append("text")
                .attr("class", "barLabel barLabelInner")
                .attr("transform", "rotate(-90)")
                .text(_title);

            $('svg rect.barrect').tipsy({//--or use IE friendly tooltip... http://svg-whiz.com/svg/Tooltip.svg
                gravity:'e',
                html:true,
                opacity:0.95,
                title:function () {
                    var d = this.__data__;
                    if (!d) return "";//there are other non-data rectangles present!
                    var perc = 100 * d.m.perc;
                    return perc.toFixed(1) + "% of the votes are for: " + SAS.localizr.getProp(d.m.mech, 'progressive');
                }
            });

            _updateLayout();
        };
        var _updateLayout = function () {
            if (!_mainGroup) return;
            var fullWidth = $(window).width();
            var fullHeight = $(window).height();
            var leftPos = $("#svgDiv").position().left;
            var ypos = _h - _p[2] - 5;
            _mainGroup.attr("transform", "translate(" + (fullWidth - _w - leftPos) + ", " + ypos + ")");
            _h = fullHeight - 10;
            _update(0);
            _bgRect
                .attr("height", fullHeight)
                .attr("width", _w)
                .attr("y", -(fullHeight - (fullHeight - ypos)));
        };
        //endregion

        //region public API
        this.updateLayout = function () {
            _updateLayout();
        };
        this.setHeight = function (ht) {
            _h = ht;
            _update();
        };
        this.setData = function (location, data) {
            _title = location;

            if (!_chart) {
                _loadData(data);
            } else {
                _updateValues(data);
            }
        };
        //endregion
    }
})();