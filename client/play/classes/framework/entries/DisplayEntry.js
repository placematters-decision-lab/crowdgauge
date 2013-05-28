/**
 * User: kgoulding
 * Date: 4/15/12
 * Time: 10:47 PM
 */
(function () { // self-invoking function
    SAS.DisplayEntry = function () {
        var _self = this;

        //region private fields and methods
        var _cacheVersion = 12;
        var _ashxPath = "http://ws.sasakistrategies.com/ashx/regionalScoresService/";
//        var _ws = SAS.configInstance.getRegionalScoresWS();
        var _mechanisms = null;
        var _entry = null;
        var _priorities = null;

        var _params = function (params) {
            return '?' + $.param($.extend({filename: SAS.configInstance.getFileName()}, params));
        };

        var _gup = function (name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.href);
            if (results == null)    return "";
            else    return results[1];
        }

        var _loadEntry = function () {
            $('<img src="/png?responseId=' + _entry.responseId + '">').appendTo("#bubbleChart");

            $("#priorities").html("<h3>Priorities I chose:</h3>");
            var prioritiesByStar = {};
            $.each(_entry.data.priorities, function (pid, stars) {
                if (!prioritiesByStar["s_" + stars]) prioritiesByStar["s_" + stars] = [];
                prioritiesByStar["s_" + stars].push(_priorities[pid]);
            });
            for (var i = 5; i > 0; i--) {
                var arr = prioritiesByStar["s_" + i];
                if (arr) {
                    $('<div><b>' + i + ' star' + (i > 1 ? 's' : '') + '</b></div>').appendTo("#priorities");
                    var plist = $("<ul>").appendTo("#priorities");
                    $.each(arr, function (j, priorityTitle) {
                        $('<li>' + priorityTitle + '</li>').appendTo(plist);
                    });
                }
            }
            $("#mechanisms").html("<h3>Actions I would take:</h3>");
            var mlist = $("<ul>").appendTo("#mechanisms");
            $.each(_entry.data.mechanisms, function (id, coins) {
                var mechanism = _mechanisms[id];
                var text = mechanism.title;
                var action = mechanism.actions["c_" + coins];
                if (action) {
                    text += ": " + action;
                }
                $('<li>' + text + '</li>').appendTo(mlist);
            });
        };

        var _getEntryData = function () {
            var responseId = _gup("responseId");
            d3.json('/getResponse' + _params({responseId: responseId}), function (data) {
                console.log('loaded R: ' + data);
                _entry = data;
                _loadEntry();
            });
        };

        var _initialize = function () {
            $("#btnCreateYours").click(function () {
                window.location = "index.html";
            });
//            d3.json("getMmechanisms?v=" + _cacheVersion, function (data) {
            d3.json("/getMechanisms" + _params(), function (data) {
                _mechanisms = {};
                $.each(data, function (i, mechanism) {
                    _mechanisms[mechanism.data.uid] = {title: SAS.localizr.getProp(mechanism.data, 'title'), actions: {}};
//                    $.each(mechanism.actions, function (j, action) {
//                        _mechanisms[mechanism.data.uid].actions["c_" + action.value] = action.title;
//                    });
                });
                if (_priorities != null) {
                    _getEntryData();
                }
            });
            d3.json("/getPriorities" + _params(), function (data) {
                _priorities = {};
                $.each(data, function (i, priority) {
                    _priorities[priority.data.uid] = SAS.localizr.getProp(priority.data, 'title');
                });
                if (_mechanisms != null) {
                    _getEntryData();
                }
            });

        };
        //endregion

        //region public API
        //this.getFoo = function() { ...
        //endregion

        $(document).ready(function () {
            _initialize();
        });
    };
    new SAS.DisplayEntry();
})
    ();