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
        var _responseId;
        var _sharing;
        var _mechanisms = null;
        var _entry = null;
        var _priorities = null;

        var _params = function (params) {
            return '?' + $.param($.extend({filename: SAS.configInstance.getFileName()}, params));
        };

        var _loadEntry = function () {
            $('<img class="bubbleImg" src="/png?responseId=' + _responseId + '">').appendTo("#bubbleChart");

            $("#priorities").html('<h3>Priorities ' + _heSheI() + ' chose:</h3>');
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
            $("#mechanisms").html('<h3>Actions ' + _heSheI() + ' would take:</h3>');
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

        var _tryLoadEntry = function () {
            if (_mechanisms == null || _priorities == null || _entry == null) return;
            $('.loader').hide();
            _loadEntry();
        };

        var _heSheI = function () {
            if (_sharing) return 'I';
            var gender = _entry.data.demographics.gender;
            if (gender == 'Male') return 'he';
            if (gender == 'Female') return 'she';
            return 'he/she';
        };

        var _updateGender = function () {
            var gender = _entry.data.demographics.gender;
            var reps = null;
            if (gender == 'Male') {
                reps = {heshe: 'he', hisher: 'his'};
            }
            if (gender == 'Female') {
                reps = {heshe: 'she', hisher: 'her'};
            }
            if (!reps) return;
            $('.gender').each(function () {
                var text = $(this).text();
                if (text == 'he/she') {
                    $(this).text(reps['heshe']);
                }
                if (text == 'his/her') {
                    $(this).text(reps['hisher']);
                }
            });
        };

        var _getEntryData = function () {
            d3.json('/getResponse' + _params({responseId: _responseId}), function (entry) {
                _entry = entry;
                _updateGender();
                _tryLoadEntry();
            });
        };

        var _initialize = function () {
            _responseId = SAS.utilsInstance.gup('responseId');
            _sharing = SAS.utilsInstance.gup('sharing') === 'yes';
            $(".btnPlay").button().click(function (event) {
                event.preventDefault();
                window.location = "/client/play/index.html?prId=" + _responseId;
            });
            $(".btnMap").button().click(function (event) {
                event.preventDefault();
                window.location = "/client/play/map.html";
            });
            _getEntryData();
            d3.json("/getMechanisms" + _params(), function (data) {
                _mechanisms = {};
                $.each(data, function (i, mechanism) {
                    _mechanisms[mechanism.data.uid] = {title: SAS.localizr.getProp(mechanism.data, 'title'), actions: {}};
//                    $.each(mechanism.actions, function (j, action) {
//                        _mechanisms[mechanism.data.uid].actions["c_" + action.value] = action.title;
//                    });
                });
                _tryLoadEntry();
            });
            d3.json("/getPriorities" + _params(), function (data) {
                _priorities = {};
                $.each(data, function (i, priority) {
                    _priorities[priority.data.uid] = SAS.localizr.getProp(priority.data, 'title');
                });
                _tryLoadEntry();
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