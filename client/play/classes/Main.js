/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:12 PM
 */
(function () { // self-invoking function
    SAS.Main = function () {
        var _self = this;

        //region private fields and methods
        var _map;
        /** @type SAS.PriorityList */
        var _priorityList;
        var _bubbleChart;
        var _mechanismList;
        var _pages;
        var _layout;
        /** @type SAS.DataManager */
        var _dataManager;

        var _filename = 'test1';

        var _detectSVG = function () {
            return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
        };

        var _reportIncompatibleBrowser = function () {
            window.location = "oldbrowser.html";
        };

        var _preventAccidentalLeaving = function () {
            window.onbeforeunload = function () {
                if (!_dataManager.getIsSaved()) {
                    return "You have not submitted your response yet.";
                }
            };
        };

        var _setupClicksForActiveMech = function (activeMech) {
            $("#moreInfo").html("");
            if (activeMech != null) {
                var $link = $("<a href='#'>See all explanations for </a>").appendTo("#moreInfo").click(function () {
                    new SAS.InfoWindow().createMechanismWindow(activeMech, _priorityList.getPriorities());
                });
                var $boldSpan = $('<span>').appendTo($link);
                SAS.localizr.live(activeMech.data.progressive, function(str) {
                    $boldSpan.html(str.toLowerCase());
                });
                _bubbleChart.colorForMechanism(activeMech);
            }
        };

        var _addLangBtn = function ($holder) {
            var $langSel = $("<select></select>").appendTo($holder);

            SAS.controlUtilsInstance.populateSelectList($langSel, null, ['en', 'af'], 'en');
            $langSel.change(function() {
                SAS.localizr.setActiveLang($(this).val());
            });
        };

        var _initialize = function () {
            if (!_detectSVG()) {
                _reportIncompatibleBrowser();
                return;
            }
            _dataManager = new SAS.DataManager();
            _layout = new SAS.Layout();
//            _map = new SAS.MapFrame();
            _priorityList = new SAS.PriorityList();
            _bubbleChart = new SAS.BubbleChart(_priorityList);
            _mechanismList = new SAS.MechanismList(_filename, _bubbleChart);
            _pages = new SAS.Pages(_layout, _priorityList, _mechanismList, _bubbleChart, _map, _dataManager);

            _addLangBtn($('#langSel'));

            _priorityList.onLoad(function () {
                _bubbleChart.createBubbles();
                _layout.positionElements();
            });
            _mechanismList.onLoad(function () {
                _layout.positionElements();
            });
            _priorityList.onRatingChange(function () {
                _bubbleChart.resizeBubbles();
            });
            _mechanismList.onActiveMechanismChange(function () {
                _setupClicksForActiveMech(_mechanismList.getActiveMechanism());
            });
            _layout.onLayout(function () {
                _bubbleChart.updateLayout();
            });
        };
        //endregion

        //region public API
        this.getCacheVersion = function () {
            //TODO - the cacheVersion should update each time any data changes on the server...
            return 13;
        };

        this.getPages = function () {
            return _pages;
        };

        /** @return {SAS.BubbleChart} */
        this.getBubbleChart = function() {
            return _bubbleChart;
        };

        /** @return {SAS.DataManager} */
        this.getDataManager = function () {
            return _dataManager;
        };

        /**
         * @param {String} pId
         * @return {SAS.PriorityDef}
         */
        this.getPriorityDef = function (pId) {
            return _priorityList.getPriorityDef(pId);
        };

        this.initialize = function () {
            _initialize();
        };

        this.preventAccidentalLeaving = function () {
            //TEMP _preventAccidentalLeaving();
        };

        //endregion
    };
    /**
     @type SAS.Main
     @const
     */
    SAS.mainInstance = new SAS.Main();
    SAS.mainInstance.initialize();
})();