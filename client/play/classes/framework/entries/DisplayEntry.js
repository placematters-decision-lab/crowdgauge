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

        var _leaderName = '';

        var _params = function (params) {
            return '?' + $.param($.extend({filename: SAS.configInstance.getFileName()}, params));
        };

        var _lastLeadernameXhr = null;
        var _validateLeadername = function (text, callback) {
            //abort previous query first
            if (_lastLeadernameXhr) _lastLeadernameXhr.abort();
            _lastLeadernameXhr = $.getJSON('/validateLeadername' + _params({leadername: text}), function (ans) {
                callback(ans.unique);
            });
        };

        var _saveLeadername = function (text, callback) {
            d3.json('/saveLeadername' + _params({leadername: text, responseId: _responseId, responseAuth:SAS.utilsInstance.gup('responseAuth')}), function (ans) {
                if (!ans.success) {
                    alert(ans.message);
                }
                callback(ans.success);
            });
        };

        var _showMyVibrant5Dialog = function () {
            $('#my_vibrant_dlg').remove();
            var $dlg = $('<div id="my_vibrant_dlg">').appendTo('body');
            $('<div class="take_txt btn_take">Take the <div class="my_vibrant_5"></div> challenge</div>').appendTo($dlg);
            $('<p>Share with at least 5 friends and <strong>get your name on our leaderboard</strong>.</p>').appendTo($dlg);
            $('<p>When you share this page by email or social media (e.g. Facebook) we give you points for how many referrals you make. You also get points for each person you friend refers and for each person your friend&#8216;s friend refers - and so on.</p>').appendTo($dlg);
            $('<p>We don&#8216;t keep any record of your email and the challenge is completely optional. You can still share with your friends even if you don&#8216;t want your name on the leaderboard.</p>').appendTo($dlg);
            var $showMe = $('<p>Show me on the leaderboard as:</p>').appendTo($dlg);
            var $leaderText = $('<input id="leaderboardName" type="text" size=16>').val(_leaderName).appendTo($showMe);
            var $warning = $('<div class="invalid">').appendTo($showMe).hide();
            var $ok = $('<div class="valid">').text('ok').appendTo($showMe).hide();
            var $loader = $('<div class="valid_loader ajax_loader_small">').appendTo($showMe).hide();
            var text = '';
            var updateWarning = function (warning, valid) {
                $warning.text(warning);
                $warning.toggle(!valid);
                $ok.toggle(valid);
            };
            var validateText = function () {
                if (text.length < 3) {
                    updateWarning('too short', false);
                    return;
                }
                $loader.show();
                $ok.hide();
                _validateLeadername(text, function (unique) {
                    updateWarning('taken', unique);
                    $loader.hide();
                });
            };
            $leaderText.keyup(function (event) {
                if ($leaderText.val() != text) {
                    text = $leaderText.val();
                    validateText();
                }
            });
            var cancelBtn = (_leaderName && _leaderName.length > 0) ? 'Cancel' : 'Skip the leaderboard';

            var btns = {};
            btns[cancelBtn] = function () {
                $dlg.dialog("close");
            };
            btns['Take the Challenge'] = function () {
                if (text.length == 0 || $warning.is(":visible") || $loader.is(":visible")) {
                    validateText();
                    return;
                }
                $loader.show();
                _saveLeadername(text, function (success) {
                    $loader.hide();
                    if (success) {
                        _setLeaderName(text);
                        $dlg.dialog("close");
                    } else {
                        validateText();
                    }
                });
            };
            $dlg.dialog({
                modal: true,
                title: 'Instructions',
                buttons: btns,
                width: 620,
                height: 500,
                position: 'center'
            });
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
                if (coins.length == 1 && coins[0].multiplier < 0) return;//continue (its a thumbs down vote)
                var mechanism = _mechanisms[id];
                if (!mechanism) return;//continue
                $('<li>' + mechanism.title + '</li>').appendTo(mlist);
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

        var _initialize = function () {
            _responseId = SAS.utilsInstance.gup('responseId');
            _sharing = SAS.utilsInstance.gup('sharing') === 'yes';
            $(".btnPlay").button().click(function (event) {
                event.preventDefault();
                window.location = '/client/play/index.html?prId=' + _responseId;
            });
            $(".btnMap").button().click(function (event) {
                event.preventDefault();
                window.open('/client/play/map.html?prId=' + _responseId, '_blank');
            });
            $(".btn_take").click(function (event) {
                event.preventDefault();
                _showMyVibrant5Dialog();
            });
            d3.json('/getResponse' + _params({responseId: _responseId}), function (entry) {
                _entry = entry;
                _updateGender();
                _tryLoadEntry();
            });
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
            d3.json('/getLeadername' + _params({responseId: _responseId}), function (ans) {
                _setLeaderName(ans.leadername);
            });

            d3.json('/descendantCount' + _params({responseId: _responseId}), function (ans) {
                $('.yourScore').text(ans.count);
            });

            SAS.tipsyInstance.addTooltip('#leftPanel a', {gravity:$.fn.tipsy.autoNS, opacity: 0.85, live: true});
        };

        var _setLeaderName = function (leadername) {
            _leaderName = leadername;
            var displayName = _leaderName;
            if (!displayName || displayName.length == 0) {
                displayName = 'no leaderboard name';
            }
            $('.leadername').text(displayName);
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
})();