/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 3:42 PM
 */
(function () { // self-invoking function
    var MODE_PRIORITY = 'priorities';
    var MODE_MECH = 'mechanisms';
    var _pageIds = [MODE_PRIORITY, MODE_MECH];

    SAS.MapMain = function () {
        var _self = this;

        //region private fields and methods
        var po = org.polymaps;
//        var _cacheVersion = 12; // TODO: add version
        // mechanisms
        var _mechanisms;
        var _mechanismsById;
        var _mechData;
        var _mechCountsByZip;

        // priorities
        var _priorities;
        var _prioritiesById;
        var _priData;
        var _priCountsByZip;

        var _itemData;
        var _itemCountsByZip;
        var _itemCountsByLocation;
        var _itemPercsByLocation;

        var _mode = MODE_PRIORITY; // start from Mechanism Mode
        // locations
        var _locations;
        var _locationData;
        /** @type SAS.Map */
        var _map;
        /** @type SAS.MapItemList */
        var _itemList;
        /** @type SAS.BarChart */
        var _barChart;
        /** @type SAS.LocationChart */
        var _locationChart;
        /** @type SAS.Layout */
        var _layout;
        var _topNum = 5; // Modify

        var _instructions = SAS.instructionsInstance;

        var _setMode = function (mode) {
            _mode = mode;
            _tryLoadData(_mode);
        };

        var _selectTab = function (pageId) {
            $(".tabTitle").removeClass("tabTitleHighlight");
            $("#tab_" + pageId).addClass("tabTitleHighlight");

//            if (_lastPage != null) {
//                $("#titleBar").removeClass("titleImg_" + _lastPage);
//            }
//            $("#titleBar").addClass("titleImg_" + pageId);
            _setMode(pageId);
        };

        var _fileAndVersion = function () {
//            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName()) + '&v=' + SAS.mainInstance.getCacheVersion();
            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName());
        };

        var _loadData = function (itemCountsByZip, itemData, data) {

            _itemList.loadData(data, _topNum); // load #itemList

            _itemCountsByZip = itemCountsByZip;
            _itemData = itemData;
            _itemCountsByLocation = {};
            _itemPercsByLocation = {};

            $.each(_locations, function (i, location) {
                // count for the total item per location
                var total = 0;
                $.each(location.data.zips, function (j, zip) {
                    $.each(_itemCountsByZip, function (k, zmc) {
                        if (zmc.zip == zip) {
                            total += zmc.count;
                        }
                    });
                });

                // count for the specify item per location
                var itemCounts = {};
                var itemPercs = {};
                $.each(location.data.zips, function (j, zip) {
                    $.each(_itemCountsByZip, function (k, zic) {
                        if (zic.zip == zip) { // exist key
                            if (!itemCounts[zic.itemId]) {
                                itemCounts[zic.itemId] = zic.count;
                                itemPercs[zic.itemId] = zic.count / total;
                            } else { // not exist key
                                itemCounts[zic.itemId] += zic.count;
                                itemPercs[zic.itemId] += zic.count / total;
                            }
                        }
                    });
                });
                _itemCountsByLocation[location.data.name] = itemCounts;
                _itemPercsByLocation[location.data.name] = itemPercs;
            });

            // show the top items
            _showTopItems();
            _layout.positionElements();
            $('.loader').hide();
        };

        var _getTopItems = function (limit) {
            var structuredData = [];
            $.each(_itemPercsByLocation, function (loc, itemPercs) {
                // sort count of item per location
                var orderedList = [];
                $.each(itemPercs, function (itemId, perc) {
                    orderedList.push({item: _itemData[itemId], score: perc});
                });
                orderedList.sort(function (a, b) {
                    return b.score - a.score;
                });
                structuredData.push({location: _locationData[loc], topitems: orderedList.slice(0, limit)});
            });
            return structuredData;
        };

        var _showTopItems = function () {
            var structuredData = _getTopItems(_topNum);
            _map.load(structuredData);
        };


        var _loadItemChartData = function (item) {
            var data = [];
            $.each(_locations, function (i, location) { // per location
                // count for the total item per location
                var total = 0;
                $.each(location.data.zips, function (j, zip) {
                    $.each(_itemCountsByZip, function (k, zmc) {
                        if (zmc.zip == zip) {
                            total += zmc.count;
                        }
                    });
                });

                var locationData = _itemCountsByLocation[location.data.name];

                if (locationData[item.data.uid]) {
                    // for _mechCountForZip by coins
//                    if (locationData[item.data.uid] < 0) {
//                        locationData[item.data.uid] = 0;
//                    }

                    data.push({no: 0, location: location.data.name, perc: locationData[item.data.uid] / total});
                } else {
                    data.push({no: 0, location: location.data.name, perc: 0});
                }
            });
            // Sort
            var orderedList = [];
            data.sort(function (a, b) {
                return b.perc - a.perc;
            });
            $.each(data, function (i, d) {
                orderedList.push({no: i + 1, location: d.location, perc: d.perc});
            });

            _barChart.updateData(orderedList, item);
            _map.updateRankings(orderedList);
            _map.showCircles(orderedList, item.data.color.background);
            _updateLayout();
        };

        var _showLocationData = function (location) {
            var locationData = _itemCountsByLocation[location];
            if (!locationData) return;

            // count for the total items for the location
            var locationTotal = 0;
            $.each(locationData, function (itemId, count) {
                locationTotal += count;
            });

            var orderedData = [];
            $.each(_itemData, function (itemId, item) {
                if (locationData[itemId]) {
                    orderedData.push({item: _itemData[itemId], perc: locationData[itemId] / locationTotal});
                } else { // fill unmatched itemId w/ perc = 0
                    orderedData.push({item: _itemData[itemId], perc: 0});
                }
            });

            orderedData.reverse();//--so it matches the top-down item list
            _locationChart.updateData(location, {a: orderedData});
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
            _itemList = new SAS.MapItemList();
            _layout.addHeightFillers({sel: "#content", leave: 0});

            $('#svgDiv').css('left', $('#itemList').outerWidth());
            _layout.addWidthFillers({sel: "#svgDiv", leave: 0});

            _selectTab(MODE_PRIORITY);  // highlight tabs
            _addClickEvents(_pageIds);

            SAS.instructionsInstance.initialize();
            _instructions.showMapResultsDialog(true); // show instruction

            // display events
            _map.onSelectLocation(function (location) {
                _showLocationData(location);
            });

            _itemList.onSelect(function (item) {
                if (item == null) {
                    _map.showStars();
                    _barChart.hide();
                } else {
                    _loadItemChartData(item);
                }
            });

            // get data from CouchDB
            //  priorities
            d3.json('/getPriorities' + _fileAndVersion(), function (data) {
                if (!data) {
                    console.log('missing priority data');
                    return;
                }
                var cnt = "A".charCodeAt(0);
                _priorities = data;
                _priData = {};
                $.each(_priorities, function (i, priority) {
                    priority.props = {};
                    priority.props.letter = String.fromCharCode(cnt++);
                    var color = d3.hsl(priority.data.color.background);
                    if (priority.data.color.textShift == 'brighter') {
                        priority.props.textColor = color.brighter(2);
                    } else {
                        priority.props.textColor = color.darker(2);
                    }

                    if (priority.data.nickname && SAS.localizr.getProp(priority.data, 'nickname') != "") {
                        priority.props.tooltipLabel = SAS.localizr.getProp(priority.data, 'nickname'); // TODO: nickname
                    } else if (priority.data.title) {
                        priority.props.tooltipLabel = SAS.localizr.getProp(priority.data, 'title');
                    }

                    _priData[priority.data.uid] = priority;
                });
                _prioritiesById = {};
                $.each(_priorities, function (i, priority) {
                    _prioritiesById[priority.id] = priority;
                });
                _tryLoadData(MODE_PRIORITY);
            });

            d3.json('/getPriCountForZip' + _fileAndVersion(), function (data) {
                _priCountsByZip = data;
                _tryLoadData(MODE_PRIORITY);
            });

            // mechanisms
            d3.json('/getMechanisms' + _fileAndVersion(), function (data) {
                var cnt = "A".charCodeAt(0);
                if (!data) {
                    console.log('missing mechanism data');
                    return;
                }
                _mechanisms = data;
                _mechData = {};
                $.each(_mechanisms, function (i, mech) {
                    mech.props = {};
                    mech.props.letter = String.fromCharCode(cnt++);
                    var color = d3.hsl(mech.data.color.background);
                    if (mech.data.color.textShift == 'brighter') {
                        mech.props.textColor = color.brighter(2);
                    } else {
                        mech.props.textColor = color.darker(2);
                    }
                    mech.props.tooltipLabel = SAS.localizr.getProp(mech.data, 'progressive');

                    _mechData[mech.data.uid] = mech;
                });
                _mechanismsById = {};
                $.each(_mechanisms, function (i, mechanism) {
                    _mechanismsById[mechanism.id] = mechanism;
                });
                _tryLoadData(MODE_MECH);
            });

            d3.json('/getMechCountForZip' + _fileAndVersion(), function (data) {
                _mechCountsByZip = data;
                _tryLoadData(MODE_MECH);
            });

            d3.json('/getLocations' + _fileAndVersion(), function (data) {
                _locations = data; // array
                _locationData = {}; // object: hashmap
                $.each(_locations, function (i, location) {
                    _locationData[location.data.name] = location.data;
                });

                _tryLoadData(_mode);
            });

            $(window).resize(function () {
                _updateLayout();
            });

            $("#vibrantneo_logo").click(function () {
                window.open("http://vibrantneo.org/");
            });

            $("#imaginemyneo_logo").click(function () {
                var prId = SAS.utilsInstance.gup('prId');
                if (prId) {
                    window.open("/?prId=" + prId);
                } else {
                    window.open("/");
                }
            });

            SAS.tipsyInstance.addTooltip('#itemList a', {gravity:$.fn.tipsy.autoNS, opacity: 0.85, live: true});
        };

        var _resetCharts = function () {
            _locationChart.reset();
        };

        var _tryLoadData = function (loadMode) {
            if (!_locations) return;
            _resetCharts();
            if (_mode == MODE_MECH) {
                if (loadMode == MODE_MECH && _mechanismsById && _mechCountsByZip) {
                    _loadData(_mechCountsByZip, _mechData, _mechanisms);
                }
            }
            if (_mode == MODE_PRIORITY) {
                if (loadMode == MODE_PRIORITY && _prioritiesById && _priCountsByZip) {
                    _loadData(_priCountsByZip, _priData, _priorities);
                }
            }
        };

        var _addClickEvents = function (pids) {
            $.each(pids, function (i, pageId) {
                $("#tab_" + pageId)
                    .addClass("tabTitleActive")
                    .click(function () {
                        _locationChart.hide(); // hide _locationChart, _barChart
                        _barChart.hide();
                        _selectTab(pageId);
                        _setMode(pageId);
                    });
            });
        };

        //endregion

        //region public API
        this.initialize = function () {
            $(document).ready(function () {
                _initialize();
            });
        };

        // for test
        this.switchMode = function () {
            if (_mode == MODE_PRIORITY) {
                _mode = MODE_MECH;
                _locationChart.hide(); // hide _locationChart, _barChart
                _barChart.hide();
                _tryLoadData(_mode);
            } else if (_mode == MODE_MECH) {
                _mode = MODE_PRIORITY;
                _locationChart.hide(); // hide _locationChart, _barChart
                _barChart.hide();
                _tryLoadData(_mode);
            }
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