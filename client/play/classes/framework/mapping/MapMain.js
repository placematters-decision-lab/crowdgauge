/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 3:42 PM
 */
(function () { // self-invoking function
    SAS.MapMain = function () {
        var _self = this;

        //region private fields and methods
        var po = org.polymaps;

        var _cacheVersion = 12;
        var _mechanismsById;
        var _mechanisms;
        var _locations;
        var _locationData; // {key: locationname, value: location}
        var _mechData; // {key: mechId, value: mech}}
        var _mechCountsByZip; // [zip, mechId, count]
        var _mechCountsByLocation; // {key: cityname, value: [mechId, counts]}
        var _mechPercsByLocation;
        /** @type SAS.Map */
        var _map;
        /** @type SAS.MapMechList */
        var _mechList;
        /** @type SAS.BarChart */
        var _barChart;
        /** @type SAS.LocationChart */
        var _locationChart;
        /** @type SAS.Layout */
        var _layout;
        var _topNum = 9; // Modify

        var _fileAndVersion = function () {
//            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName()) + '&v=' + SAS.mainInstance.getCacheVersion();
            return '?filename=NRV'; // TODO: add version
        };

        var _loadData = function () {
            _mechCountsByLocation = {};
            _mechPercsByLocation = {};

            $.each(_locations, function (i, location) { // per location
                // count for the total mechanisms per location
                var total = 0;
                $.each (location.data.zips, function (j, zip) {
                    $.each(_mechCountsByZip, function (k, zmc) {
                        if (zmc.zip == zip) {
                            total += zmc.count;
                        }
                    });
                });

                // count for the specify mechanism per location
                var mechCounts = {};
                var mechPercs = {};
                $.each(location.data.zips, function (j, zip) {
                    // assume: zips not duplicated
                    $.each(_mechCountsByZip, function (k, zmc) {
                        if (zmc.zip == zip) {
                            if (!mechCounts[zmc.mechId]) { // not exist key, http://stackoverflow.com/questions/135448/how-do-i-check-to-see-if-an-object-has-a-property-in-javascript
                                mechCounts[zmc.mechId] = zmc.count;
                                mechPercs[zmc.mechId] = zmc.count / total;
                            } else { // not exist key
                                mechCounts[zmc.mechId] += zmc.count;
                                mechPercs[zmc.mechId] += zmc.count / total;
                            }
                        }
                    });
                });
                _mechCountsByLocation[location.data.name] = mechCounts;
                _mechPercsByLocation[location.data.name] = mechPercs;
            });

            // show the top 5 mechanisms
            _showTop();
            _layout.positionElements();
        };

        var _getTopMechs = function (limit) {
            var structuredData = [];
            $.each(_mechPercsByLocation, function (loc, mechPercs) {
                // sort count of mechanism per location
                var orderedList = [];
                $.each(mechPercs, function (mechId, perc) {
                    orderedList.push({mech: _mechData[mechId], score: perc});
                });
                orderedList.sort(function (a, b) {
                    return b.score - a.score;
                });
                structuredData.push({location: _locationData[loc], topmechs: orderedList.slice(0, limit)});
            });
            return structuredData;
        };

        var _showTop = function () {
            var structuredData = _getTopMechs(_topNum);
            _map.load(structuredData);
        };


        var _loadMechChartData = function (mech) {
            var data = [];
            $.each(_locations, function (i, location) { // per location
                // count for the total mechanisms per location
                var total = 0;
                $.each (location.data.zips, function (j, zip) {
                    $.each(_mechCountsByZip, function (k, zmc) {
                        if (zmc.zip == zip) {
                            total += zmc.count;
                        }
                    });
                });

                var locationData = _mechCountsByLocation[location.data.name];

                if (locationData[mech.data.uid]) {
                    data.push({no: 0, location: location.data.name, perc: locationData[mech.data.uid] / total});
                } else {
                    data.push({no: 0, location: location.data.name, perc: 0});
                }
            });
            // Sort
            var orderedList = [];
            data.sort(function (a, b) {
                return b.perc - a.perc;
            });
            $.each (data, function(i, d) {
                orderedList.push({no: i + 1, location: d.location, perc: d.perc});
            });

            _barChart.updateData(orderedList, mech);
            _map.updateRankings(orderedList);
            _map.showCircles(orderedList, mech.data.color.background);
            _updateLayout();
        };

        var _showLocationData = function (location) {
            var locationData = _mechCountsByLocation[location];
            if (!locationData) return;

            // count for the total mechanisms for the location
            var locationTotal = 0;
            $.each(locationData, function (mechId, count) {
                locationTotal += count;
            });

            var orderedData = [];
            $.each (_mechData, function (mechId, mech) {
                if (locationData[mechId]) {
                    orderedData.push({mech: _mechData[mechId], perc: locationData[mechId] / locationTotal});
                } else { // fill unmatched mechId w/ perc = 0
                    orderedData.push({mech: _mechData[mechId], perc: 0});
                }
            });

            orderedData.reverse();//--so it matches the top-down mech list
            _locationChart.setData(location, {a: orderedData});
        };

        var _updateLayout = function () {
            _barChart.updateLayout();
            _locationChart.updateLayout();
        };

        var _initialize = function () {
            var svg = po.svg("svg:svg");//fix for Firefox: https://github.com/simplegeo/polymaps/issues/115
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('id', 'svgMain');

            var container = document.getElementById("svgDiv").appendChild(svg);

            _map = new SAS.Map(container, svg);
            _layout = new SAS.Layout();
            _barChart = new SAS.BarChart(svg);
            _locationChart = new SAS.LocationChart(svg);
            _mechList = new SAS.MapMechList();
            _layout.addHeightFillers({sel: "#mechList", leave: 0});
            _layout.addWidthFillers({sel: "#svgDiv", leave: 0});

            // display events
            _map.onSelectLocation(function (location) {
                _showLocationData(location);
            });

            _mechList.onSelect(function (mech) {
                if (mech == null) {
                    _map.showStars();
                    _barChart.hide();
                } else {
                    _loadMechChartData(mech);
                }
            });

            // get data from CouchDB
            d3.json('/getMechanisms' + _fileAndVersion(), function (data) {
                var cnt = "A".charCodeAt(0);
                _mechanisms = data;
                _mechData = {};
                $.each(_mechanisms, function (i, mech) {
                    mech.data.letter = String.fromCharCode(cnt++);
                    _mechData[mech.data.uid] = mech.data;
                });
                _mechList.loadData(data, _topNum);
                _mechanismsById = {};
                $.each(_mechanisms, function (i, mechanism) {
                    _mechanismsById[mechanism.id] = mechanism;
                });
                if (_locations && _mechCountsByZip) _loadData();
            });

            d3.json('/getLocations' + _fileAndVersion(), function (data) {
                _locations = data; // array
                _locationData = {}; // object: hashmap
                $.each(_locations, function(i, location) {
                    _locationData[location.data.name] = location.data;
                });

                if (_mechanismsById && _mechCountsByZip) _loadData();
            });

            d3.json('/getCoinCountForMechZip' + _fileAndVersion(), function (data) {
                _mechCountsByZip = data;
                if (_mechanismsById && _locations) _loadData();
            });

            $(window).resize(function () {
                _updateLayout();
            });
        };
        //endregion

        //region public API
        this.initialize = function () {
            $(document).ready(function () {
                _initialize();
            });
        };
        //endregion
    };
    /**
     @type SAS.MapMain
     @const
     */
    SAS.mainMapInstance = new SAS.MapMain();
    SAS.mainMapInstance.initialize();
})();