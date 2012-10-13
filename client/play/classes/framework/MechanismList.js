/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:32 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.MechanismList
     * @extends SAS.ACompareList
     **/
    SAS.MechanismList = function (bigBubbleChart) {
        var _self = this;
        /** @type SAS.ACompareList */
        var _super = SAS.Inheritance.Extend(this, new SAS.ACompareList(bigBubbleChart));

        var IMPACTS = "impacts";
        var SCENARIO = "scenario";

        //region private fields and methods
        /** @type SAS.BubbleChart */
        var _bigBubbleChart = bigBubbleChart;
        var _onLoad = function () {
        };

        var _mechIconDivsById = {};
        var _mechSubDivsById = {};

        var _moneyIcons;
        var _mode = IMPACTS;
        var _totalCoins = 12;
        //var _transTime = 1000;

        var _setMode = function (mode) {
            _mode = mode;
            if (_mode == IMPACTS) {
                //_super._getCatDiv("Baseline").slideDown(_transTime);
                $(".mechGrp").css("minHeight", "30px");
                $(".mechGrp").removeClass("mechGrpBox").addClass("mechGrpBtn");
                _showMoneyIcons(false);
                _super._showBubbleCharts(true);
            } else {
                //_super._getCatDiv("Baseline").slideUp(_transTime);
                $(".mechGrp").removeClass("selected");
                $(".mechGrp").css("minHeight", "24px");
                if (_mode == SCENARIO) {
                    $(".mechSub").show();
                    $(".mechGrp").removeClass("mechGrpBtn").addClass("mechGrpBox");
                }
            }
            if (_mode == SCENARIO) {
                _showMoneyIcons(true);
                $("#coinsLeft").show();
            } else {
                $("#coinsLeft").hide();
                $(".mechSub").hide();
            }
        };

        var _showMoneyIcons = function (show) {
            if (_moneyIcons == null) return;
            $.each(_moneyIcons, function (k, micons) {
                $.each(micons, function (i, micon) {
                    micon.showDivs(show);
                });
            });
        };

        var _radioClick = function (mechanism, clickedIcon) {
            if (mechanism.category == "Policy") {
                if (mechanism.id == "14") _moneyIcons["15"][0].setOn(false);
                if (mechanism.id == "15") _moneyIcons["14"][0].setOn(false);
                if (mechanism.id == "20") _moneyIcons["21"][0].setOn(false);
                if (mechanism.id == "21") _moneyIcons["20"][0].setOn(false);
                return;
            }
            $.each(_moneyIcons[mechanism.id], function (i, micon) {
                if (clickedIcon != micon) {
                    if (clickedIcon.isOn()) {
                        micon.setOn(false);
                        micon.setNetCoins(clickedIcon.getAction().coins);
                    } else {//--icons can be unchecked too
                        micon.setNetCoins(0);
                    }
                }
            });
        };

        var _addMoneyAndVotes = function (mechanism) {
            _moneyIcons[mechanism.id] = [];
            $.each(mechanism.actions, function (i, action) {
                var actionDiv;
                if (action.title == "") {
                    actionDiv = $("<div>").appendTo(_mechIconDivsById[mechanism.id]);
                } else {
                    actionDiv = $("<div class='mech_action_div'>").appendTo(_mechSubDivsById[mechanism.id]);
                }
                var micon = new SAS.MoneyVoteIcon(mechanism, action);
                _moneyIcons[mechanism.id].push(micon);
                micon.addMoneyAndVotes(actionDiv, mechanism.values);
                micon.onSelectionChange(function () {
                    _radioClick(mechanism, micon);
                    _recalcMoney(mechanism, micon);
                });
            });
        };

        var _recalcCoinBalance = function (coinsUsed) {
            var coinsLeft = (_totalCoins - coinsUsed);
            if (coinsLeft == 0) {
                $("#coinsLeft").html("<span class='coinsLeftNum'>0</span><small> coins left (to redistribute, uncheck current selections)</small>");
            } else {
                $("#coinsLeft").html("You have <span class='coinsLeftNum'>" + coinsLeft + "</span> coin" + ((coinsLeft > 1) ? "s" : "") + " left");
            }

            $.each(_moneyIcons, function (mechId, micons) {
                $.each(micons, function (i, micon) {
                    micon.setEnabled(coinsLeft >= micon.getNetCoins());
                });
            });
        };

        var _recalcMoney = function (mechanism, micon) {
            var scores = {};
            var coinsUsed = 0;
            $.each(_super._mechanisms(), function (i, mechanism) {
                var micons = _moneyIcons[mechanism.id];
                if (micons == null) return true;//continue
                $.each(micons, function (j, micon) {
                    if (micon.isOn()) {
                        coinsUsed += micon.getAction().coins;
                        new SAS.MechanismScorer(mechanism).appendScores(micon.getAction().multiplier, scores);
                    }
                });
            });
            _bigBubbleChart.colorByMoney(mechanism, micon, scores);
            _recalcCoinBalance(coinsUsed);
        };

        var _addMechListItem = function (mechanism) {
            if (!_super._getCatDiv(mechanism.category)) return;
            var mechDiv = $("<div class='mechGrp'></div>").appendTo(_super._getCatDiv(mechanism.category));
            mechDiv.attr("id", "mech" + mechanism.id);
            _mechIconDivsById[mechanism.id] = $("<div class='mechIcon'></div>").appendTo(mechDiv);
            _mechIconDivsById[mechanism.id].attr("id", "mechIcon" + mechanism.id);
            var titleTxt = $("<div class='mechText'></div>").appendTo(mechDiv);
            titleTxt.html(mechanism.text);
            _mechSubDivsById[mechanism.id] = $("<div class='mechSub'></div>").appendTo(mechDiv);
            mechDiv.click(function () {
                if (_mode == IMPACTS) {
                    _super._setActiveMechanism(mechanism);
                }
            });
        };

        var _createList = function () {
            $("#mechanismList").html("");
            _super._mechPanel($("<div class='mechPanel'></div>").appendTo("#mechanismList"));

            _super._addCatDivs(["Project", "Policy"]);

            $.each(_super._mechanisms(), function (i, mechanism) {
                _addMechListItem(mechanism);
                if (mechanism.id == "BASELINE") {
                    _super._setActiveMechanism(mechanism);
                }
            });
        };

        var _showDivs = function (show) {
            $("#mechanismList").toggle(show);
            $("#coinsLeft").toggle(show && _mode == SCENARIO);
            $("#clickInstr").toggle(show && _mode == IMPACTS);
            if (show) {
                $("#leftPanel").css("width", "445px");
            }
            _super._updateSelectionDisplay();
        };

        //--protected fields and methods (use '_' to differentiate).

        _super._o_getMechIconDivById = function (id) {
            return _mechIconDivsById[id][0];
        };

        _super._o_getMechIconDivById = function (id) {
            return _mechIconDivsById[id][0];
        };

        _super._o_updateSelectionDisplay = function (mech) {
            $(".mechGrp").removeClass("selected");
            if (mech == null || _mode == SCENARIO) return;
            $("#mech" + mech.id).addClass("selected");
        };
        //endregion

        //region public API
        this.showDivs = function (show) {
            _showDivs(show);
        };

        this.onLoad = function (fn) {
            _onLoad = fn;
        };

        this.getVotes = function () {
            var votes = {};
            if (_moneyIcons == null) return votes;
            $.each(_super._mechanisms(), function (i, mechanism) {
                var micons = _moneyIcons[mechanism.id];
                if (micons == null) return true;//continue
                $.each(micons, function (j, micon) {
                    if (micon.isOn()) {
                        votes[mechanism.id] = micon.getAction().coins;
                    }
                });
            });
            return votes;
        };

        this.getNumCoins = function () {
            return _totalCoins;
        };

        this.load = function (data) {
            _super._mechanisms(data);
            _createList();
            _onLoad();
        };

        this.ensureShowMiniBubbleCharts = function () {
            if (!_super._ensureShowMiniBubbleCharts()) {
                //_showBubbleCharts(true);--delay until after tween
                _super._resizeMiniBubbleCharts();
            }
            _setMode(IMPACTS);
        };

        this.ensureShowMoneyAndVotes = function () {
            _setMode(SCENARIO);
            _super._showBubbleCharts(false);
            if (_moneyIcons == null) {
                _moneyIcons = {};
                $.each(_super._mechanisms(), function (i, mechanism) {
                    _addMoneyAndVotes(mechanism);
                });
                _recalcMoney();
            } else {
                //_showMoneyIcons(true);
                _recalcMoney();
            }
            _super._updateSelectionDisplay();
        };
        //endregion

    }
})();