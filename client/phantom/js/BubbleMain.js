(function () { // self-invoking function
    SAS.BubbleMain = function () {
        var _self = this;

        //region private fields and methods
        var _map;
        /** @type SAS.PriorityList */
        var _priorityList;
        /** @type SAS.DataManager */
        var _dataManager;
        /** @type SAS.BubbleChart */
        var _bubbleChart;

        var _data = {priorities: null, mechanisms: null, entry: null};

        var _params = function (params) {
            return '?' + $.param($.extend({filename: SAS.configInstance.getFileName()}, params));
        };

        var _tryStart = function () {
            if (!(_data.priorities && _data.mechanisms && _data.entry)) return;
            _priorityList.load(_data.priorities);
            _priorityList.setValues(_data.entry.data.priorities);
            _bubbleChart.resizeBubbles(0);
            _bubbleChart.colorByPriority();
            _bubbleChart.updateLayout();
        };
        var _initialize = function () {
            _dataManager = new SAS.DataManager();
            _priorityList = new SAS.PriorityList();
            _bubbleChart = new SAS.BubbleChart(_priorityList);

            _priorityList.onLoad(function () {
                _bubbleChart.createBubbles();
            });


            d3.json('/getPriorities' + _params(), function (data) {
                _data.priorities = data;
                _tryStart();
            });
            d3.json('/getMechanisms' + _params(), function (data) {
                _data.mechanisms = data;
                _tryStart();
            });
            d3.json('/getResponse' + _params({responseId:'kgtest'}), function (data) {
                _data.entry = data;
                _tryStart();
            });

        };

        this.initialize = function () {
            _initialize();
        };

    };

    /**
     @type SAS.Main
     @const
     */
    SAS.mainInstance = new SAS.BubbleMain();
    SAS.mainInstance.initialize();
})();