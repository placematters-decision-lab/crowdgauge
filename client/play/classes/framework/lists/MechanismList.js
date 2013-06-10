/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:32 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.MechanismList
     * @extends SAS.ACompareList
     * @param filename
     * @param bigBubbleChart
     * @constructor
     */
    SAS.MechanismList = function (filename, bigBubbleChart) {
        var _self = this;
        /** @type SAS.ACompareList */
        var _super = SAS.Inheritance.Extend(this, new SAS.ACompareList(bigBubbleChart));

        var IMPACTS = "impacts";
        var SCENARIO = "scenario";
        var POLICIES = "policies";

        //region private fields and methods
        var _filename = filename;

        /** @type SAS.BubbleChart */
        var _bigBubbleChart = bigBubbleChart;
        var _onLoad = function () {
        };

        var _mechIconDivsById = {};
        var _mechSubDivsById = {};

        var _moneyIcons;
        var _mode = IMPACTS;
        var _policies = false;
        var _totalCoins = 15;
        var _usedCoins = 0;

        var _clickInstrShown = false;
        var _instructions = SAS.instructionsInstance;

        var _actionDefs = {};

        //var _transTime = 1000;
        var _onRatingChange = function () {};

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
                if (_mode == SCENARIO || _mode == POLICIES) {
                    $(".mechSub").show();
                    $(".mechGrp").removeClass("mechGrpBtn").addClass("mechGrpBox");
                }
            }
            if (_mode == SCENARIO || _mode == POLICIES) {
                _showMoneyIcons(true);
                $("#coinsLeft").show();
                $("#coinsReset").show();
                $("#colorRampLegend").show();
            } else {
                $("#coinsLeft").hide();
                $("#coinsReset").hide();
//                $("#colorRampLegend").hide();
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
            $.each(_moneyIcons[mechanism.id], function (i, micon) {
                if (clickedIcon != micon) {
                    if (clickedIcon.isOn()) {
                        micon.setOn(false);        // TODO !!!!!!!!!!!!!!!!!!!!!!!!!
                        micon.setNetCoins(clickedIcon.getTotalCoins());
                    } else {//--icons can be unchecked too
                        micon.setNetCoins(0);
                    }
                }
            });
        };

        var _actionsByMechId = null;
        var _loadAllActions = function (callback) {
            d3.json('/getAllActions', function (allActions) {
                _actionsByMechId = {};
                if (!allActions) {
                    console.log('getAllActions failed: ' + allActions);
                    return;
                }
                $.each(allActions, function (i, action) {
                    if (!action.data) return;//continue
                    var mechId = action.structureId.mechanism;
                    if (!_actionsByMechId[mechId]) _actionsByMechId[mechId] = {actions: []};
                    _actionsByMechId[mechId].actions.push(action);
                });
                if (callback) callback();
            });
        };

        var _getActionCells = function (mechId) {
            var ans = {};
            var mObj = _actionsByMechId[mechId];
            if (!mObj) return ans;
            $.each(mObj.actions, function (i, action) {
                if (!action.data || action.data.value === 0) return true;//continue
                var aId = action.structureId.action;
                ans[aId] = action.data;
            });
            return ans;
        };

        var _addMoneyAndVotes = function (mechanism) {
            if (_actionsByMechId == null) return;

            _moneyIcons[mechanism.id] = [];
            var micons = [];

            var mObj = _actionsByMechId[mechanism.id];
            if (!mObj) return;
            // sort actions by value (multiplier of cell)
            var actions = mObj.actions;
            actions.sort(function (a, b) {
                return (a.data.value > b.data.value) ? 1 : -1;
            });

            $.each(actions, function (i, action) {
                if (!action.data || action.data.value === 0) return true;//continue
                var aId = action.structureId.action;
                var actionDiv;
                if (SAS.localizr.get(action.data.description) == "" && SAS.localizr.get(mechanism.data.category) == "policy") {   // policy
                    actionDiv = $("<div>").appendTo(_mechIconDivsById[mechanism.id]);
                    _super._addPolicyDiv(SAS.localizr.get(mechanism.data.category));
                    micons[0] = new SAS.MoneyVoteIcon(mechanism, action.data, _actionDefs[aId], {thumbState: 'up'}, _self); // TODO!!!!!!!!!
                    micons[1] = new SAS.MoneyVoteIcon(mechanism, action.data, _actionDefs[aId], {thumbState: 'down'}, _self);
                    //TODO: this is a hacky fix to force divs to not show policies when on the budget page and vice versa when first loading, should work on creating a sequential loading of actions and hiding of policies/budget
//                        if(_policies) {
//                            _showDivs(true, true);
//                        } else {
//                            _showDivs(true);
//                        }
                } else {  // project
                    actionDiv = $("<div id='" + aId + "' class='mech_action_div'>").appendTo(_mechSubDivsById[mechanism.id]);
//                        action.data.aId = action.aId;
                    micons[0] = new SAS.MoneyVoteIcon(mechanism, action.data, _actionDefs[aId], {thumbState: 'non'}, _self);
                }
                $.each(micons, function (i, micon) {
                    _moneyIcons[mechanism.id].push(micon);
                    micon.addMoneyAndVotes(actionDiv, mechanism.values);
                    micon.onSelectionChange(function () {
                        /*
                         Temporarily removed radio click as the options for this game are not exclusive
                         TODO: abstract to make this optional so admin can select whether they want exclusive or non-exclusive actions
                         */
                        if (_actionDefs[aId].value == 0) {
                            _radioClick(mechanism, micon); //exclusive selection between thumbs up and down
                        }
                        _recalcMoney(mechanism, micon, micon.getThumbState());
                    });

                });
            });

        };

        var _ensureActionDefsLoaded = function (callback) {
            if ($.isEmptyObject(_actionDefs)) {
                d3.json('/getActionDefs?filename=' + _filename, function (actionDefs) {
                    _actionDefs = {};
                    $.each(actionDefs, function (i, /**SAS.ActionDef*/ value) {
                        _actionDefs[value.uid] = value;
                    });
                    _loadAllActions(function () {
                        if (callback) callback();
                    });
                });
            } else {
                if (callback) callback();//TODO possible scenario where this can get hit before all actions loaded?
            }
        };

        var _recalcCoinBalance = function (coinsUsed) {
            _usedCoins = coinsUsed; // TODO
            var coinsLeft = (_totalCoins - coinsUsed);
            if (coinsLeft == 0) {
                $("#coinsLeft").html("<span class='coinsLeftNum'>0</span><small> coins left (to redistribute, uncheck current selections)</small>");
            } else {
                $("#coinsLeft").html("You have <span class='coinsLeftNum'>" + coinsLeft + "</span> coin" + ((coinsLeft > 1) ? "s" : "") + " left ");
            }

            $('#coinsReset').html("<div class='coinsReset'></div>").click(function () {
                $.each(_moneyIcons, function (mechId, micons) {
                    $.each(micons, function (i, micon) {
                        micon.setOn(false);
                    });
                });

                _recalcMoney();
                _onRatingChange();
                _recalcCoinBalance(0);
            });
//            $('.coinsReset').tipsy({title: "Put all your choice back."});

            $.each(_moneyIcons, function (mechId, micons) {
                $.each(micons, function (i, micon) {
                    micon.setEnabled(coinsLeft >= micon.getNetCoins());
                });
            });
        };

        var _recalcMoney = function (mechanism, micon, thumbState) {
            var scores = {};
            var coinsUsed = 0;
            $.each(_super._mechanisms(), function (i, mechanism) {
                var micons = _moneyIcons[mechanism.id];
                if (micons == null) return true;//continue
                $.each(micons, function (j, micon) {
                    if (micon.isOn()) {
                        coinsUsed += micon.getTotalCoins();
                        new SAS.MechanismScorer(mechanism).appendScores(micon.getMultiplier(), scores);
                    }
                });
            });
            _bigBubbleChart.colorByMoney(mechanism, micon, scores, thumbState);
            _recalcCoinBalance(coinsUsed);
        };

        var _addMechListItem = function (mechanism) {
            mechanism.id = mechanism.data.uid;
//            mechanism.category = "main";
            if (!_super._getCatDiv(SAS.localizr.get(mechanism.data.category))) return;
            var mechDiv = $("<div class='mechGrp'></div>").appendTo(_super._getCatDiv(SAS.localizr.get(mechanism.data.category)));
            mechDiv.attr("id", "mech" + mechanism.id);
            _mechIconDivsById[mechanism.id] = $("<div class='mechIcon'></div>").appendTo(mechDiv);
            _mechIconDivsById[mechanism.id].attr("id", "mechIcon" + mechanism.id);
            var $titleTxt = $("<div class='mechText'></div>").appendTo(mechDiv);
            SAS.localizr.live(mechanism.data.title, $titleTxt);
            _mechSubDivsById[mechanism.id] = $("<div class='mechSub'></div>").appendTo(mechDiv);
//            $("<div class='coins coins_off_4'></div>").appendTo(mechDiv);

            // tipsy
            //$('.mechText a').tipsy({gravity: 'n', live: true});

            mechDiv.click(function () {
                if (_mode == IMPACTS) {
                    if (!_clickInstrShown) {
                        _clickInstrShown = true;
                        _instructions.showClickInstructions(mechanism);
                    }
                    _super._setActiveMechanism(mechanism);
                }
            });
        };

        var _createList = function () {
            $("#mechanismList").html("");
            _super._mechPanel($("<div class='mechPanel'></div>").appendTo("#mechanismList"));

//            _super._addCatDivs(["main"]);
//            _super._addCatDivs([Enums.MECH_PROJECT, Enums.MECH_POLICY]);   // TODO:
            _super._addCatDivs(["project", "policy"]);

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
            $("#coinsReset").toggle(show && _mode == SCENARIO);
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
            var actions = {};
            if (_moneyIcons == null) return votes;
            $.each(_super._mechanisms(), function (i, mechanism) {
                var micons = _moneyIcons[mechanism.id];
                if (micons == null) return true;//continue
                $.each(micons, function (j, micon) {
                    if (micon.isOn()) {
                        /*
                         Added check to see if mechanism already has votes associated with it, make this cumulative, this
                         is a hack for a special case where you want to allocate individual coins to a single
                         TODO: abstract this so the admin can choose whether action votes are exclusive or not, maybe store the actual votes by action instead of mechanism
                         */
                        var multiplier = micon.getMultiplier();
                        var aId = micon.getAction().uid;
                        if (!votes[mechanism.id])        votes[mechanism.id] = [];
                        votes[mechanism.id].push({'actionId': aId, 'multiplier': multiplier, 'numCoins': micon.getTotalCoins()});
//                        votes[mechanism.id].add({'actionId':aId, 'multiplier':multiplier, 'numCoins':micon.getTotalCoins()}); // TODO: what???
                    }
                });
            });
            return votes;
        };

        this.getNumCoins = function () {
            return _totalCoins;
        };

        this.getLeftCoins = function () {
            return _totalCoins - _usedCoins;
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

        this.preloadActionDefs = function () {
            _ensureActionDefsLoaded();
        };

        this.ensureShowMoneyAndVotes = function () {
            _setMode(SCENARIO);
            _super._showBubbleCharts(false);
            if (_moneyIcons == null) {
                _moneyIcons = {};
                _ensureActionDefsLoaded(function () {
                    $.each(_super._mechanisms(), function (i, mechanism) {
                        _addMoneyAndVotes(mechanism);
                    });
                });
                _recalcMoney();
            } else {
                _showMoneyIcons(true);  // TODO!!!!!!!!!!DELETE
                _recalcMoney();
            }
            _super._updateSelectionDisplay();
        };

        this.getActionCells = function (mechId) {
            return _getActionCells(mechId);
        };
        //endregion

    }
})();