/**
 * User: kgoulding
 * Date: 4/10/12
 * Time: 10:11 PM
 */
(function () { // self-invoking function
    SAS.DataManager = function (parentId) {
        var _self = this;

        //region private fields and methods
        var _mIsSaved;
        var _demoData;
        var _voteData;
        var _priorityData;
        var _timeData;
        var _responseId;
        var _parentId = parentId;
        var _infoWinCnt = 0;

        //var _ws = new SAS.JsonRestWS("http://localhost:59159/svc/", "DataService.svc", false, false);
        //var _ws = new SAS.JsonRestWS("svc/regionalScoresService/", "DataService.svc", true, true);
        var _ws = SAS.configInstance.getRegionalScoresWS();

        var _getData = function () {
            var data = {demographics:_demoData, priorities:_priorityData, mechanisms:_voteData, times:_timeData, infocnt:_infoWinCnt};
            if (_parentId) {
                data.parentId = _parentId;
            }
            return data;
        };

        var _saveData = function (onSave) {
            $.post("/saveResponse", {data:JSON.stringify(_getData())},
                function (result) {
                    _responseId = result.responseId;
                    onSave(_responseId);
                });
        };
        //endregion

        //region public API
        this.incrementInfoWinCount = function () {
            _infoWinCnt++;
        };

        this.storeDemographics = function (demoData) {
            _demoData = demoData;
        };

        this.storePriorities = function (priorityData) {
            _priorityData = priorityData;
        };

        this.storeTimeSpent = function (prioritySecs, impactsSecs, votingSecs) {
            _timeData = {priorities:prioritySecs, impacts:impactsSecs, voting:votingSecs};
        };

        this.storeVotes = function (voteData) {
            _voteData = voteData;
        };
        this.getResponseId = function () {
            return _responseId;
        };

        this.setIsSaved = function (value) {
            _mIsSaved = value;
        };
        this.getIsSaved = function () {
            return _mIsSaved;
        };
        this.saveData = function (onSave) {
            _saveData(onSave);
            _mIsSaved = true;
        };
        //endregion
    }
})();