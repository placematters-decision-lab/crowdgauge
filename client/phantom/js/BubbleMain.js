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

        var _actionDefsByNumCoins = {};
        var _actionsByMechAndDef = {};

        var _data = {priorities: null, mechanisms: null, entry: null};

        var _params = function (params) {
            return '?' + $.param($.extend({filename: SAS.configInstance.getFileName()}, params));
        };

        var _tryStart = function () {
            if (!(_data.priorities && _data.mechanisms)) return;
            _priorityList.load(_data.priorities);
            if (_data.entry) _loadEntry();
        };

        var _getMultiplier = function (actionsSelected) {
            var val = 0;
            $.each(actionsSelected, function (i, action) {
                val += action.multiplier;//multiple multipliers have additive effect (e.g. 0.4 and 1.2 = 1.6)
            });
            return val;
        };

        var _recalcMoney = function () {
            var scores = {};
            $.each(_data.mechanisms, function (i, mechanism) {
                var actionsSelected = _data.entry.data.mechanisms[mechanism.data.uid];
                if (!actionsSelected) return true;//continue
                var multiplier = _getMultiplier(actionsSelected);
                new SAS.MechanismScorer(mechanism).appendScores(multiplier, scores);
            });
            _bubbleChart.colorByMoney(null, null, scores);
        };

        var _loadEntry = function () {
            if (!(_data.priorities && _data.mechanisms)) return;//_loadEntry could be called before priorities and mechs load
            _priorityList.setValues(_data.entry.data.priorities);
            _bubbleChart.resizeBubbles(0);
            _recalcMoney();
            _bubbleChart.updateLayout();

            console.log('calling phantom');
            setTimeout(function () {
                if (typeof window.callPhantom === 'function') {
                    window.callPhantom({ meth: 'screenshot' });
                }
            }, 100);//not sure why we need the 100ms delay, but without it the positioning is not updated even though the duration is set to 0
        };

        var _initialize = function () {
            _dataManager = new SAS.DataManager();
            _priorityList = new SAS.PriorityList();
            _bubbleChart = new SAS.BubbleChart(_priorityList);

            _priorityList.onLoad(function () {
                _bubbleChart.createBubbles();
            });

            d3.json('/getPriorities' + _params(), function (data) {
                console.log('loaded Priorities');
                _data.priorities = data;
                _tryStart();
            });
            d3.json('/getMechanisms' + _params(), function (data) {
                console.log('loaded Mechs');
                _data.mechanisms = data;
                _tryStart();
            });
//            d3.json('/getAllActions' + _params(), function (data) {
//                console.log('loaded Actions');
//                _data.actions = data;
//                _tryStart();
//            });
//            d3.json('/getActionDefs' + _params(), function (data) {
//                console.log('loaded ADefs');
//                _data.actionDefs = data;
//                _tryStart();
//            });

//            d3.json('/getResponse' + _params({responseId:'kgtest'}), function (data) {
//                _data.entry = data;
//                _tryStart();
//            });

        };

        this.initialize = function () {
            _initialize();
        };

        this.loadResponseById = function (responseId) {
            console.log('loadResponse: ' + responseId);
            d3.json('/getResponse' + _params({responseId: responseId}), function (data) {
                console.log('loaded R: ' + data);
                _data.entry = data;
                _loadEntry();
            });
        };

        this.loadResponse = function (responseJson) {
            console.log('load response: ' + responseJson);
            _data.entry = JSON.parse(responseJson);
            _loadEntry();
        };
    };

    /**
     @type SAS.Main
     @const
     */
    SAS.mainInstance = new SAS.BubbleMain();
    SAS.mainInstance.initialize();
})();
//
//setTimeout(function() {
//console.log('delayed loadResponse');
//SAS.mainInstance.loadResponse('{"_id":"d0009549fcc9aa036670a55fb60017f3","_rev":"1-fb5966605200a74518fbff99c5f6ebe4","dateCreated":"2013-05-25T03:59:48.363Z","data":{"demographics":{"zip":"66666","age":"19-25","gender":"Prefer not to say","relationship":"None of the above, but Im interested in the region!","ethnicity":"Black or African American"},"priorities":{"p40233878541-7193":4,"p40233997029-562":3,"p40412022934-7351":5},"mechanisms":{"m40238293919-9016_undefined":2,"m40238293919-9016":2,"m40238063421-3387_undefined":2,"m40238063421-3387":2,"m40240485706-3778_undefined":-1,"m40240485706-3778":0,"m40240417238-3499_undefined":-1,"m40240417238-3499":0,"m40240525602-3785_undefined":1,"m40240525602-3785":0,"m40240364137-7413_undefined":1,"m40240364137-7413":0},"times":{"priorities":14,"impacts":5,"voting":15},"infocnt":0},"responseId":"44078388363-9205"}')
//}, 1000);
////
setTimeout(function () {
    console.log('delayed loadResponseById');
    SAS.mainInstance.loadResponseById('44078388363-9205')
}, 1000);
//
//setTimeout(function() {
//    console.log('delayed loadResponse');
//    SAS.mainInstance.loadResponse('44078388363-9205')
//}, 15000);