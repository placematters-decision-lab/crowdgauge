/**
 * User: kgoulding
 * Date: 4/4/12
 * Time: 11:17 PM
 */
(function () { // self-invoking function
    SAS.Map = function (container, svgNode) {
        var _self = this;
        var MODE_STAR = "STAR";
        var MODE_CIRCLE = "CIRCLE";

        //region private fields and methods
        var _mode;
        var _mapdata;
        var _currentRankings;
        var _centersText;
        var _centers;
        var _cityCharts;
        var _starMarkers;
        var _circleMarkers;
        var _container = container;
        var _svg = d3.select(svgNode);
        var _dataByCity;
        var map;
        var po = org.polymaps;

        var _onSelectCity = function () {};

        var _createMap = function () {
            /*var svg = po.svg("svg:svg");//fix for Firefox: https://github.com/simplegeo/polymaps/issues/115
             svg.setAttribute('width', '100%');
             svg.setAttribute('height', '100%');*/

            // Create the map object, add it to #map…
            map = po.map()
                .container(_container)
                .center({lat:41.6, lon:-93.66})
                .zoom(10)
                .add(po.interact());

            var script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", "https://dev.virtualearth.net"
                + "/REST/V1/Imagery/Metadata/Road"
                + "?key=AmT-ZC3HPevQq5IBJ7v8qiDUxrojNaqbW1zBsKF0oMNEs53p7Nk5RlAuAmwSG7bg"
                + "&jsonp=bing_callback");
            document.body.appendChild(script);
        };

        window.bing_callback = function (data) {
            /* Display each resource as an image layer. */
            var resourceSets = data.resourceSets;
            for (var i = 0; i < resourceSets.length; i++) {
                var resources = data.resourceSets[i].resources;
                for (var j = 0; j < resources.length; j++) {
                    var resource = resources[j];
                    map.add(po.image()
                        .url(template(resource.imageUrl.replace(/^http:/, "https:"), resource.imageUrlSubdomains)))
                        .tileSize({x:resource.imageWidth, y:resource.imageHeight});
                }
            }
            //map.add(po.image().url("http://sasakistrategies.com/MapTiles/Iowa/MPOBoundary/{Z}/{X}/{Y}.png"));
            // Add the compass control on top.
            map.add(po.compass()
                .pan("none"));

            loadData();
        };

        var useFilter = false;
        var useLabels = true;
        var rotateLabels = false;
        var rm = 10;
        var n = 1;
        //var color = d3.scale.ordinal().range(d3_category20);
        var color = function (d) {
            return d.data.mech.color;
        };
        var makeStar = function (d) {
            var values = d.topmechs;
            //--setting the value of n here permits arrays of different lengths to be used, but this is not recommended as it skews the areas in the visualization as well as the positions of the wedges.
            //--it is recommended to use equal length arrays and use zeros where data is not available.
            n = values.length;
            return star(values);
        };
        var star = d3.layout.pie().sort(null).value(function (d) {
            return 1 / n;//for a star chart, we use a constant angle rather than an angle based on the data value
        });
        var starRad = function (d) {
            return 2;
            //return Math.sqrt(d.data.score) * rm;//use the area of the wedge to represent the value. r is a radius multiplier and can be modified for different data sets.
        };
        var arc = d3.svg.arc().innerRadius(0).outerRadius(starRad);
        var midAngle = function (d) {
            return d.startAngle + (d.endAngle - d.startAngle) / 2;
        };

        var loadData = function () {

            var layer = _svg.insert("svg:g", ".compass");

            _cityCharts = layer.selectAll("g")
                .data(_mapdata)
                .enter().append("svg:g")
                .attr("transform", transform);

            _cityCharts.on("click", function (d) {
                _onSelectCity(_getCityName(d));
            });

            _starMarkers = _cityCharts.append("svg:g");
            _circleMarkers = _cityCharts.append("svg:g");


            var shadCircs = _circleMarkers.append("circle")
                .attr("r", 0)
                .attr("class", "shadow");

            var circs = _circleMarkers.append("circle")
                .attr("r", 0)
                .attr("class", "arc");

            var shadArcs = _starMarkers.selectAll("g.shadow")
                .data(makeStar)
                .enter()
                .append("g")
                .attr("class", "shadow");

            shadArcs.append("path").attr("d", arc);

            var arcs = _starMarkers.selectAll("g.arc")
                .data(makeStar)
                .enter()
                .append("g")
                .attr("class", "arc");

            var paths = arcs.append("path")
                .attr("fill", function (d, i) {
                    return color(d);
                })
                .attr("d", arc);

            _centers = _cityCharts.append("g")
                .attr("transform", "scale(0.1)");
            _centers.append("circle")
                .attr("r", 6)
                .attr("class", "centerCircle");

            _centersText = _centers.append("text")
                .attr("class", "centerCircleText")
                .attr("dy", "3")
                .text(function (d, i) {
                    return _getRank(d);
                });

            $('svg g.arc').tipsy({
                gravity:'n',
                html:true,
                opacity:0.85,
                title:function () {
                    var d = this.__data__;
                    var perc = 100 * d.data.score;
                    return perc.toFixed(1) + "% of the votes in " + d.data.city + " are for: " + d.data.mech.ingText;
                }
            });

            $('svg circle.arc').tipsy({
                gravity:'n',
                html:true,
                opacity:0.85,
                title:function () {
                    var d = this.__data__;
                    var perc = 100 * _getCityPerc(d);
                    return perc.toFixed(1) + "% of the votes in " + _getCityName(d);
                }
            });

            if (useLabels) {
                var labels = arcs.filter(function (d) {
                    //--use this to filter out elements that are too small to label
                    return true;
                })
                    .append("g")
                    .attr("class", "label")
                    .attr("display", labelDisplay)
                    .attr("transform", labelTransform);

                labels.append("text")
                    .attr("dy", ".35em")
                    .attr("transform", function (d) {
                        var offset = -10;
                        //--rotate text so it doesn't go upside down!
                        //--translate to offset from edge
                        if (rotateLabels) {
                            return (midAngle(d) > Math.PI) ? "rotate(180) translate(" + (-offset) + ",0)" : "translate(" + offset + ",0)";
                        } else {
                            return "translate(" + offset + ",0) rotate(" + (-labelRotateAmt(d)) + ")";
                        }
                    })
                    .attr("text-anchor", function (d) {
                        if (rotateLabels) {
                            return (midAngle(d) > Math.PI) ? "end" : "start";
                        } else {
                            return "middle";
                        }
                    })
                    .attr("fill", function (d, i) {
                        var colr = d3.rgb(d.data.mech.color);
                        return SAS.mainMapInstance.useWhiteForeground(d.data.mech.letter) ? colr.brighter() : colr.darker();
                    })
                    //.attr("opacity", 0.5)
                    .text(function (d, i) {
                        return d.data.mech.letter;
                    });
            }

            resizeGfx(map.zoom());

            // Whenever the map moves, update the marker positions.
            var lastZoom = map.zoom();
            map.on("move", function (e) {
                _cityCharts.attr("transform", transform);
                var zoom = map.zoom();
                if (zoom != lastZoom) {//there is no on("zoomChanged") option for polymaps. For efficiency we don't want to rerun all these calculations for pan events - only when the zoom actually changes
                    lastZoom = zoom;
                    if (useLabels) {
                        labels.attr("display", labelDisplay());
                        labels.attr("transform", labelTransform);
                    }
                    resizeGfx(zoom);

                    if (useFilter) {
                        var filterOffsetAmt = getRelativeVal(zoom, 8, 13, 0.08, 0.3);

                        feOffset.attr("dx", filterOffsetAmt)
                            .attr("dy", filterOffsetAmt);
                        console.log("zoom", zoom, "offset", filterOffsetAmt);
                    }
                }
            });

            function resizeGfx(zoom) {
                var offset = getRelativeVal(zoom, 10, 15, 0.1, 0.3);
                shadArcs.attr("transform", "translate(" + offset + ", " + offset + ")");
                shadCircs.attr("transform", "translate(" + offset + ", " + offset + ")");

                var stroke = getRelativeVal(zoom, 10, 15, 0.05, 0.1);
                arcs.attr("style", "stroke-width: " + stroke);
                circs.attr("style", "stroke-width: " + stroke);

            }

            function getRelativeVal(zoom, minzoom, maxzoom, minfrac, maxfrac) {
                return minfrac + ((maxfrac - minfrac) / (maxzoom - minzoom)) * (maxzoom - Math.max(minzoom, Math.min(zoom, maxzoom)));
            }

            map.on("resize", function (e) {
                _cityCharts.attr("transform", transform);
            });

            window.addEventListener("mouseup", function (e) {
                var clickLoc = map.pointLocation(map.mouse(e));
                console.log(clickLoc.lat + ", " + clickLoc.lon + " z: " + map.zoom());
            }, false);

            function getPartialScale() {
                //--its has a nice effect if the pies also scale with the map, but at a different rate
                //--play with the power for different effects
                var p = 3;
                return Math.pow(0.1, (p - 1)) * Math.pow(map.zoom(), p);
            }

            function labelRotateAmt(d) {
                return midAngle(d) * 180 / Math.PI - 90;
            }

            function labelTransform(d) {
                if (!labelsVisible()) return "";//--no need to trigger matrix calculations if these aren't even visible
                return "rotate(" + labelRotateAmt(d) + ") "
                    + "translate(" + starRad(d) + ",0) "
                    + "scale(" + 1 / getPartialScale() + ") ";//invert the parent element scale to use actual font size
            }

            function labelDisplay() {
                return (labelsVisible()) ? null : "none";
            }

            function labelsVisible() {//--only show the labels when we're fully zoomed in...
                return map.zoom() > 10;
            }

            function transform(d) {
                d = map.locationPoint({lat:d.city[0], lon:d.city[1]});
                return "translate(" + d.x + "," + d.y + ") scale(" + getPartialScale() + ")";
            }

            _updateMode();
            _updateCenters();
        };

        /** Returns a Bing URL template given a string and a list of subdomains. */
        function template(url, subdomains) {
            var n = subdomains.length,
                salt = ~~(Math.random() * n); // per-session salt

            /** Returns the given coordinate formatted as a 'quadkey'. */
            function quad(column, row, zoom) {
                var key = "";
                for (var i = 1; i <= zoom; i++) {
                    key += (((row >> zoom - i) & 1) << 1) | ((column >> zoom - i) & 1);
                }
                return key;
            }

            return function (c) {
                var quadKey = quad(c.column, c.row, c.zoom),
                    server = Math.abs(salt + c.column + c.row + c.zoom) % n;
                return url
                    .replace("{quadkey}", quadKey)
                    .replace("{subdomain}", subdomains[server]);
            };
        }

        var _updateMode = function () {
            _circleMarkers.attr("display", (_mode == MODE_CIRCLE) ? "inherit" : "none");
            _starMarkers.attr("display", (_mode == MODE_STAR) ? "inherit" : "none");
        };

        var _updateCircles = function (color) {
            var sizeMult = 8;
            var duration = 750;
            _circleMarkers.select("circle.arc")
                .transition()
                .duration(duration)
                .attr("fill", color)
                .attr("r", function (d, i) {
                    return Math.sqrt(_getCityPerc(d)) * sizeMult;
                });

            _circleMarkers.select("circle.shadow")
                .transition()
                .duration(duration)
                .attr("r", function (d, i) {
                    return Math.sqrt(_getCityPerc(d)) * sizeMult;
                });
        };

        var _updateCenters = function () {
            _centersText.text(function (d, i) {
                return _getRank(d);
            });
            _centers.attr("visibility", function (d, i) {
                return _getVisible(d) ? "visible" : "hidden";
            });
        };

        var _getCityName = function (d) {
            return d.city[2];
        };

        var _getCityPerc = function (d) {
            return _dataByCity[_getCityName(d)][0].percent;
        };

        var _getVisible = function (d) {
            if (!_currentRankings) return false;
            return _currentRankings[_getCityName(d)][0].percent > 0;
        };

        var _getRank = function (d) {
            if (!_currentRankings) return null;
            return _currentRankings[_getCityName(d)][0].i;
        };
        //endregion

        //region public API

        this.updateRankings = function (cityArr) {
            _currentRankings = d3.nest().key(
                function (d) { return d.city; }).map(cityArr)
            _updateCenters();
        };

        this.showStars = function () {
            _mode = MODE_STAR;
            _updateMode();
            _currentRankings = null;
            _updateCenters();
        };

        this.showCircles = function (data, color) {
            _mode = MODE_CIRCLE;
            _updateMode();
            _dataByCity = d3.nest().key(
                function (d) { return d.city; }).map(data);
            _updateCircles(color);
        };

        this.onSelectCity = function (fn) {
            _onSelectCity = fn;
        };

        this.hasData = function () {
            return _mapdata != null;
        };

        this.load = function (data) {
            _mode = MODE_STAR;
            _mapdata = data;
            $.each(_mapdata, function (i, cityVal) {//store city names on top mech objects so that we can access this info for tooltips etc
                var cityName = _getCityName(cityVal);
                $.each(cityVal.topmechs, function (j, mechObj) {
                    mechObj.city = cityName;
                });
            });
            _createMap();
        };

        //endregion
    }
})();