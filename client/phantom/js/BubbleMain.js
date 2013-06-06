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

            try {
                _priorityList.setValues(_data.entry.data.priorities);
                _bubbleChart.resizeBubbles();
                _recalcMoney();
                _bubbleChart.updateLayout();
            }
            catch (err) {
                console.log('Error in _loadEntry: ' + err.message);
            }

            //console.log('calling phantom (no delay)');
            if (typeof window.callPhantom === 'function') {
                window.callPhantom({ meth: 'screenshot' });
            }
//            setTimeout(function () {
//                if (typeof window.callPhantom === 'function') {
//                    window.callPhantom({ meth: 'screenshot' });
//                }
//            }, 100);//not sure why we need the 100ms delay, but without it the positioning is not updated even though the duration is set to 0
        };

        var _initialize = function () {
            _dataManager = new SAS.DataManager();
            _priorityList = new SAS.PriorityList();
            _bubbleChart = new SAS.BubbleChart(_priorityList, true);

            _priorityList.onLoad(function () {
                _bubbleChart.createBubbles();
            });

            d3.json('/getPriorities' + _params(), function (data) {
                //console.log('loaded Priorities');
                _data.priorities = data;
                _tryStart();
            });
            d3.json('/getMechanisms' + _params(), function (data) {
                //console.log('loaded Mechs');
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
            //console.log('loadResponse: ' + responseId);
            d3.json('/getResponse' + _params({responseId: responseId}), function (data) {
                //console.log('loaded R: ' + data);
                _data.entry = data;
                _loadEntry();
            });
        };

        this.loadResponse = function (responseJson) {
            //console.log('load response: ' + responseJson);
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
//    SAS.mainInstance.loadResponse('{\"_id\":\"2bd10687aa13b5fc94879eec2c0017ae\",\"_rev\":\"1-7c156e0d67afdf80e688af984ad00772\",\"dateCreated\":\"2013-05-28T20:23:26.183Z\",\"data\":{\"demographics\":{\"zip\":\"55555\",\"age\":\"under 12\",\"gender\":\"Male\",\"relationship\":\"Born and raised here\",\"ethnicity\":\"White\"},\"priorities\":{\"p40233878541-7193\":5,\"p40234157559-4780\":5,\"p40234465466-9077\":5},\"mechanisms\":{\"m40239679897-1893\":[{\"actionId\":\"a43957659546-9057\",\"multiplier\":1,\"numCoins\":2},{\"actionId\":\"a43163610206-3312\",\"multiplier\":1,\"numCoins\":2}],\"m40240417238-3499\":[{\"actionId\":\"a43251888053-605\",\"multiplier\":-1,\"numCoins\":0}],\"m40240364137-7413\":[{\"actionId\":\"a43251888053-605\",\"multiplier\":1,\"numCoins\":0}],\"m40240034404-8499\":[{\"actionId\":\"a43957633490-9153\",\"multiplier\":1,\"numCoins\":1}],\"m40240382658-8379\":[{\"actionId\":\"a43251888053-605\",\"multiplier\":-1,\"numCoins\":0}],\"m40240045059-5664\":[{\"actionId\":\"a43938403518-8508\",\"multiplier\":1,\"numCoins\":3},{\"actionId\":\"a43938463722-1951\",\"multiplier\":1,\"numCoins\":6}],\"m40240432087-2563\":[{\"actionId\":\"a43251888053-605\",\"multiplier\":1,\"numCoins\":0}]},\"times\":{\"priorities\":32,\"impacts\":15,\"voting\":64},\"infocnt\":1},\"responseId\":\"44396606183-9631\"}')
//}, 1000);
////
//setTimeout(function () {
//    console.log('delayed loadResponseById');
//    SAS.mainInstance.loadResponseById('44078388363-9205')
//}, 1000);
//
//setTimeout(function() {
//    console.log('delayed loadResponse');
//    SAS.mainInstance.loadResponse('44078388363-9205')
//}, 15000);