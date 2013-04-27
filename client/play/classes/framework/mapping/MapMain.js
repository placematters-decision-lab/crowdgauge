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
        var _cities;
        var _structuredData;
        /** @type SAS.Map */
        var _map;
        /** @type SAS.MapMechList */
        var _mechList;
        /** @type SAS.BarChart */
        var _barChart;
        /** @type SAS.CityChart */
        var _cityChart;
        /** @type SAS.JsonRestWS */
        var _ws;
        /** @type SAS.Layout */
        var _layout;

        var _fileAndVersion = function () { // for 'getMechanisms', 'getCommunities'
//            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName()) + '&v=' + SAS.mainInstance.getCacheVersion();
              return '?filename=NRV'; // TODO: otherwise, call Main.js -> Pages.js
        };

        var _loadData = function () {
//            _ws.getWebService("getTopActions", {num:5}, function (data) {
//            d3.json('/getTopActions?num=5', function (data) {
            d3.json('/getTopMechByCommunity?limit=5', function (data) {
                _structuredData = [];
                $.each(data, function (city, mechs) {
                    var mechData = [];
                    $.each(mechs, function (mid, score) {
                        mechData.push({mech:_mechanismsById[mid], score:score});
                    });
                    _structuredData.push({city:_cities[city], topmechs:mechData});
                });
                _map.load(_structuredData);
            });
        };

        var _loadMechChartData = function (mech) {
//            _ws.getWebService("getMechDataByCity", {mid:mech.id}, function (data) {
//                d3.json('/getMechDataByCity?mid=' + mech.id, function (data) {
                d3.json('/getMechDataByCommunity?mechId=' + mech.id, function (data) {
                _barChart.updateData(data, mech);
                _map.updateRankings(data);
                _map.showCircles(data, mech.color);
                _updateLayout();
            });
        };

        var _showCityData = function (city) {
            // debug info
            console.log("I am 'showCityData'");

//            _ws.getWebService("getCityData", {city:city}, function (data) {
//                d3.json('/getCityData?city=' + city, function (data) {
                d3.json('/getCommunityData?communityName=' + city, function (data) {
                var orderedData = [];
                $.each(_mechanisms, function (i, mechanism) {
                    var val = data[mechanism.id] || 0;
                    orderedData.push({mech:mechanism, perc:val});
                });
                orderedData.reverse();//--so it matches the top-down mech list
                _cityChart.setData(city, {a:orderedData});
            });
        };

        var _updateLayout = function () {
            _barChart.updateLayout();
            _cityChart.updateLayout();
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
            _cityChart = new SAS.CityChart(svg);
            _mechList = new SAS.MapMechList();
            _layout.addHeightFillers({sel:"#mechList", leave:0});
            _layout.addWidthFillers({sel:"#svgDiv", leave:0});

            // display data in html
            _map.onSelectCity(function(city) {
                // debug info
                console.log("I am 'onSelectCity'");

                _showCityData(city);
            });

            _mechList.onSelect(function (mech) {
                if (mech == null) {
                    _map.showStars();
                    _barChart.hide();
                } else {
                    _loadMechChartData(mech);
                }
            });
//            _ws = SAS.configInstance.getRegionalScoresWS();
            // get mechanisms from CouchDB
            d3.json('/getMechanisms' + _fileAndVersion(), function (data) {
            // d3.json("../mechanisms.json?v=" + _cacheVersion, function (data) {
                var cnt = "A".charCodeAt(0);
//                _mechanisms = data.children; // TODO: why to ues .children?
                _mechanisms = data;
                $.each(_mechanisms, function (i, mech) {
                    mech.letter = String.fromCharCode(cnt++);
                });
                _mechList.loadData(data);
                _mechanismsById = {};
                $.each(_mechanisms, function (i, mechanism) {
                    _mechanismsById[mechanism.id] = mechanism;
                });
                if (_cities) _loadData();
            });
//            d3.json('/getCities', function (data) {
            d3.json('/getCommunities' + _fileAndVersion(), function (data) {
//            d3.json("../cities.json?v=" + _cacheVersion, function (data) {
                _cities = data;
                if (_mechanismsById) _loadData();
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

        this.useWhiteForeground = function(letter) {
            switch(letter) {
                case "K": return true;
                case "L": return true;
                case "M": return true;
                case "O": return true;
                case "P": return true;
                case "T": return true;
                case "U": return true;
                default: return false;
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