/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:28 PM
 */
(function () { // self-invoking function
    SAS.BubbleChart = function (priorityList, backgroundMode) {
        var _self = this;
        var PRIORITY = "priority";
        var MONEY = "money";
        var IMPACTS = "impacts";

        //region private fields and methods
        var _mRadius = 1000;
        var _circleRad = 99;//--allow small buffer for stroke
        var _mSvg;
        var _mainGrp;

        /** @type SAS.PriorityList */
        var _priorityList = priorityList;
        var _backgroundMode = backgroundMode;//disable all animations for server-side rendering
        var _onBubbleClick = function (id) {
        };
        var _colorMode = PRIORITY;
        var _mainCircles;
        var _imageIcons;
        var _overlayCircles;
        var _overlayOpac = 0.8;

        var _format = d3.format(",d");
        var _nodes;

        var _sizeColorRamp = ["#EC7623", "#ff0000"];
//        var _sizeColorRamp = ["#ff0000", "#EC7623"];

        var _bubble = d3.layout.pack()
            .sort(null)
            .size([_mRadius, _mRadius]);

        var _recolorBubblesForMechanism = function (mechanism) {
            if (!_mainCircles) return;
            _mainCircles
                .style("fill", null)
                .attr("class", function (d) {
                    if (mechanism != null) {
                        return "score_" + mechanism.values[d.id];
                    }
                    return "";
                });
        };

        var _setColorMode = function (cmode) {
            $("#colorRampLegend").removeClass("colorRamp_" + _colorMode);
            _colorMode = cmode;
            $("#colorRampLegend").addClass("colorRamp_" + _colorMode);
        };

        var _getGradientColor = function (colorArr, val) {
            val = Math.max(0, Math.min(1, val));
            var stepFrac = 1 / (colorArr.length - 1);
            for (var i = 0; i < colorArr.length - 1; i++) {
                var pos = stepFrac * i;
                var nextPos = stepFrac * (i + 1);
                if (pos <= val && val < nextPos) {
                    var along = (val - pos) / stepFrac;
                    return d3.interpolateRgb(colorArr[i], colorArr[i + 1])(along);
                }
            }
            return colorArr[colorArr.length - 1];
        };

        var _scoreCounts = function (score) {
            return score != "na";// && score != 0;
        };

        var _previewMoney = function (mechanism, micon) {
            var delay = 100;
            var maxFill = 0.8;//--otherwise preview circles overwhelm others
            if (mechanism && micon) {
                var r = maxFill * Math.sqrt(100 * Math.abs(micon.getMultiplier(1.2))) * 10;
                _overlayCircles
                    .style("fill", null)
                    .style("opacity", _overlayOpac)
                    .style("stroke-width", function (d) {
                        return 2.5 * 100 / d.r;//emulate NonScalingStroke (which is not supported in FF or IE)
                    })
                    .style("stroke-opacity", function (d) {
                        if (mechanism != null && _scoreCounts(mechanism.values[d.id])) return 0.25;
                        return 0;
                    })
                    .attr("class", function (d) {
                        return _getBubbleClass(mechanism, d.id, micon);
                    })
                    .attr("r", r / 1.5);

                _overlayCircles.transition()
                    .ease("bounce")
                    .duration(400)
                    .attr("r", r);
            } else {
                _overlayCircles
                    .transition()
                    .ease("quad")
                    .duration(200)
                    .attr("r", 0)
                    .style("opacity", 0);
            }
        };

        var _getBubbleClass = function (mechanism, id, micon) {
            if (mechanism != null) {
                var score = mechanism.values[id];
                if (micon.useInverseScore()) {
                    if (_scoreCounts(score)) return "score_" + (-score);
                } else {
                    if (_scoreCounts(score)) return "score_" + score;
                }
                return "nofill";
            }
            return "nofill";
        };

        var _colorByMoney = function (mechanism, micon, scores) {
            var colorRamp = ["#ec7623", "#fbc917", "#EAD9C4", "#afd7cc", "#2BBEC5"];
            var bigScore = 5;
            //var currentColors = {};

            var delay = 100;
            if (mechanism && micon) {
                var r = Math.sqrt(100 * Math.abs(micon.getMultiplier())) * 10;
                _overlayCircles
                    .style("fill", null)
                    .style("opacity", _overlayOpac)
                    .style("stroke-width", function (d) {
                        return 2.5 * 100 / d.r;//emulate NonScalingStroke (which is not supported in FF or IE)
                    })
                    .style("stroke-opacity", function (d) {
                        if (mechanism != null && _scoreCounts(mechanism.values[d.id])) return 0.25;
                        return 0;
                    })
                    .attr("class", function (d) {
                        return _getBubbleClass(mechanism, d.id, micon);
                    });

                if (micon.isOn()) {
                    delay = 0;
//                    _overlayCircles.transition()
//                        .ease("bounce")
//                        .duration(1300)
//                        .attr("r", r);

                    _overlayCircles.transition()
                        .ease("quad")
                        .delay(delay)
                        .duration(800)
                        .style("opacity", 0)
                        .attr("r", r)
                        .each("end", function () {
                            d3.select(this)
                                .attr("r", 0)
                                .style("opacity", _overlayOpac);
                        });

                } else {
                    delay = 600;
                    _overlayCircles
                        .attr("r", r)
                        .style("opacity", _overlayOpac)
                        .transition()
                        .ease("quad")
                        .duration(800)
                        .attr("r", 0)
                        .style("opacity", 0);
                }
            }

            var mainCircleFill = function (d) {
                var score = scores[d.id];
                if (score == null) return "#CCCCCC";
                var adjScore = score;
                if (adjScore != 0) {//--a hack to move away from the center (to make it more obvious whether small value are +ve or -ve)
                    adjScore += (adjScore > 0) ? 0.5 : -0.5;
                }
                var scoreFrac = (adjScore + bigScore) / (bigScore * 2);
                return _getGradientColor(colorRamp, scoreFrac);
            };

            if (_backgroundMode) {
                _mainCircles.style("fill", mainCircleFill);
            } else {
                _mainCircles.transition()
                    .delay(delay)
                    .duration(800)
                    .style("fill", mainCircleFill);
            }

        };

        var _colorBySize = function () {
            _mainCircles
                .style("fill", function (d) {
                    return d3.interpolateRgb(_sizeColorRamp[0], _sizeColorRamp[1])(d.value / 100);
                });
        };

        var _resizeBubbles = function () {
            var duration = 1500;

            var mainGrp = _mainGrp.selectAll("g.node").data(_bubble.nodes(_priorityList.getPriorities()));
            var translateFn = function (d) {
                return "translate(" + d.x + "," + d.y + ") scale(" + d.r / 100 + "," + d.r / 100 + ")";
            };

            if (_backgroundMode) {
                mainGrp.attr("transform", translateFn);
            } else {
                mainGrp.transition()
                    .duration(duration)
                    .attr("transform", translateFn);
            }

            var strokeWidthFn = function (d) {
                return 1.5 * (100 / d.r);//--inverse scale
            };

            if (_colorMode == PRIORITY) {
                var priorityFill = function (d) {
                    return d3.interpolateRgb(_sizeColorRamp[0], _sizeColorRamp[1])(d.value / 100)
                };
                if (_backgroundMode) {
                    _mainCircles
                        .style("fill", priorityFill)
                        .style("stroke-width", strokeWidthFn);
                } else {
                    _mainCircles.transition()
                        .duration(duration)
                        .style("fill", priorityFill)
                        .style("stroke-width", strokeWidthFn);
                }
            } else {
                if (_backgroundMode) {
                    _mainCircles.style("stroke-width", strokeWidthFn);
                } else {
                    _mainCircles.transition()
                        .duration(duration)
                        .style("stroke-width", strokeWidthFn);
                }
            }
        };

        var _updateTitle = function (sel) {
            SAS.localizr.live(function (val) {
                sel.attr("title", function (d) {
                    return SAS.localizr.get(d.data.title);// + ": " + d.value;
                });
            });
        };

        var _getImageData = function () {
            var data = {};
            _mainCircles.each(function (d) {
                var color = d3.rgb(d3.select(this).style("fill")).toString().substr(1);
                data[d.id] = {x: Math.round(d.x), y: Math.round(d.y), r: Math.round(d.r), c: color};
            });
            return data;
        };

        var _setClickable = function (clickable) {

            //_imageIcons.classed("bubbleIconNoMouse", true); --this is no longer needed as all bubbleIcons now have pointer-events:none;
        };

        var _createBubbles = function () {
            _nodes = _mainGrp.selectAll("g.node")
                .data(_bubble.nodes(_priorityList.getPriorities()))
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            var bubbles = _nodes.filter(function (d) {
                return d.depth > 0;
            });

            //_updateTitle(bubbles);

            _mainCircles = bubbles.append("circle")
                .attr("r", _circleRad);

            _overlayCircles = bubbles.append("circle")
                .style("stroke", "black")
                .attr("r", 0)
                .style("opacity", _overlayOpac);

            _imageIcons = bubbles.append("image")
                .attr("class", "bubbleIcon")
                //.attr("transform", "scale(0.65)")//scale down to fit square SVG icons within circles (multiply the diameter by 1/sqrt(2) = 0.707) + inset from the edge a little
                .attr("x", -100).attr("y", -100)
                .attr("width", 200).attr("height", 200)
                .attr("xlink:href", function (d) {
                    return "/files/" + d.data.svgPath + "?color=white";
                });

//            $('svg image').tipsy({
//                gravity: 'n',
//                html: true,
//                opacity: 0.95,
//                title: function () {
//                    var d = this.__data__;
//                    return SAS.localizr.get(d.data.title);
//                }
//            });

            SAS.mainInstance.addTooltip($('svg circle'), {//--on 'clickable' screens images are not interactive so we need to use circles
                gravity: 'ne',
                html: true,
                opacity: 0.95,
                title: function () {
                    var d = this.__data__;
                    var tip = SAS.localizr.get(d.data.title);
                    if (_colorMode == IMPACTS && !d3.select(this).classed("score_na")) tip += "<br/>(click for more)";
                    if (_colorMode == MONEY) tip += "<br/>(click to see components)";
                    return tip;
                }//,
//                trigger: 'manual'
            });

            _nodes.on("click", function (d) {
                _onBubbleClick(d.id);
            });
        };

        var _showDivs = function (show) {
            $("#chart").toggle(show);
            $("#colorRampLegend").toggle(show);
        };

        var _updateLayout = function () {
            var $chart = $("#chart");
            var w = $chart.width();
            var h = $chart.height();
            var scale = Math.min(w, h) / 1000;
            _mSvg.attr("width", w).attr("height", h);
            _mainGrp.attr("transform", "scale(" + scale + ")");
        };

        var _initialize = function () {
            _mSvg = d3.select("#chart").append("svg")
                .attr("width", _mRadius)
                .attr("height", _mRadius)
                .attr("class", "bubble");

            _mainGrp = _mSvg.append("g");
        };
        //endregion

        //region public API
        this.showDivs = function (show) {
            _showDivs(show);
        };

        this.setRadius = function (value) {
            _mRadius = value;
        };
        this.getRadius = function () {
            return _mRadius;
        };

        this.getCircleRad = function () {
            return _circleRad;
        };

        this.getSvg = function () {
            return _mSvg;
        };

        this.colorByPriority = function () {
            _setClickable(false);
            _setColorMode(PRIORITY);
            _colorBySize();
        };

        this.previewMoney = function (mechanism, micon) {
            _previewMoney(mechanism, micon);
        };

        this.colorByMoney = function (mechanism, micon, scores) {
            _setClickable(false);
            _setColorMode(MONEY);
            _colorByMoney(mechanism, micon, scores);
        };

        this.colorForMechanism = function (mechanism) {
            _setClickable(true);
            _setColorMode(IMPACTS);
            _recolorBubblesForMechanism(mechanism);
        };

        this.createBubbles = function () {
            _createBubbles();
        };

        this.resizeBubbles = function () {
            _resizeBubbles();
        };

        this.onBubbleClick = function (fn) {
            _onBubbleClick = fn;
        };

        this.updateLayout = function () {
            _updateLayout();
        };

        this.getIconsForImage = function () {
            return _getImageData();
        };
        //endregion

        _initialize();
    }
})();