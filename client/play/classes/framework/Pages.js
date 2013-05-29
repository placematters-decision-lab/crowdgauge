/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:57 PM
 */
(function () { // self-invoking function
    SAS.Pages = function (layout, priorityList, mechanismList, bubbleChart, map, dataManager) {
        var _self = this;
        var INTRO = "intro";
        var PRIORITIES = "priorities";
        var IMPACTS = "impacts";
        var MONEY = "money";

        var BTN_NEXT = "next";
        var BTN_BACK = "back";
        var BTN_SUBMIT = "submit";
        var BTN_SHARE = "share";

        var _pageIds = [INTRO, PRIORITIES, IMPACTS, MONEY];
        var _btnStates = [BTN_NEXT, BTN_SUBMIT, BTN_SHARE];
        var _cacheVersion = SAS.mainInstance.getCacheVersion();
        var _lastPage;
        var _moneyShown = false;
        var _submitted = false;

        var _priorityStartTime;
        var _impactsStartTime;
        var _votingStartTime;
        var _submitTime;

        //region private fields and methods
        var _activePage;
        /** @type SAS.PriorityList */
        var _priorityList = priorityList;
        /** @type SAS.BubbleChart */
        var _bubbleChart = bubbleChart;
        /** @type SAS.MechanismList */
        var _mechanismList = mechanismList;
        /** @type SAS.Layout */
        var _layout = layout;
        /** @type SAS.DataManager */
        var _dataManager = dataManager;

        var _instructions = new SAS.Instructions();
        var _introPage = new SAS.IntroPage(dataManager);

        var _selectTab = function (pageId) {
            $(".tabTitle").removeClass("tabTitleHighlight");
            $("#tab_" + pageId).addClass("tabTitleHighlight");

            if (_lastPage != null) {
//                $("#titleBar").removeClass("titleImg_" + _lastPage);
                $("#titleBar").removeClass("priorityTxtH2").html("");
            }
//            $("#titleBar").addClass("titleImg_" + pageId);
            var text = "";
            switch (pageId) {
                case INTRO:
                    break;
                case PRIORITIES:
                    text = "I want to live in a Northeast Ohio where...";
                    break;
                case IMPACTS:
                    text = "How do Northeast Ohio's choices affect your priorities?";
                    break;
                case MONEY:
                    text = "Put your money where your mouse is";
                    break;
            }
            $("#titleBar").addClass("priorityTxtH2").text(text);

            if (pageId == PRIORITIES) {
                $("<div></div>").appendTo('#titleBar').addClass("priorityTxtH3").text("Show your priorities by clicking on the stars below.");
            }

            if (pageId == IMPACTS) {
                $("<div></div>").appendTo('#titleBar').addClass("priorityTxtH3").text("Click through the projects and policies below to understand their potential impacts.");
            }

            if (pageId == MONEY) {
                $("<div></div>").appendTo('#titleBar').addClass("priorityTxtH3").text("Choose projects and policies that support your priorities.");
            }
        };

        var _showNextButton = function (show, btnState) {
            $.each(_btnStates, function (i, btn) {
                if (btn == btnState) {
                    $("#btnNext").addClass("bigButton_" + btn);
                } else {
                    $("#btnNext").removeClass("bigButton_" + btn);
                }
            });
            SAS.controlUtilsInstance.setButtonText($("#btnNext"), btnState);
            $("#btnNext").toggle(show);
            $("#reshowInstr").toggle(show);
        };

        var _showBackButton = function (show, btnState) {
            $.each(_btnStates, function (i, btn) {
                if (btn == btnState) {
                    $("#btnBack").addClass("bigButton_" + btn);
                } else {
                    $("#btnBack").removeClass("bigButton_" + btn);
                }
            });
            SAS.controlUtilsInstance.setButtonText($("#btnBack"), btnState);
            $("#btnBack").toggle(show);
        };

        var _setClickToInfoWin = function (acompList) {
            if (acompList) {
                _bubbleChart.onBubbleClick(function (id) {
                    new SAS.InfoWindow().createMechanismWindow(acompList.getActiveMechanism(), _priorityList.getPriorities(), id);
                });
            } else {
                _bubbleChart.onBubbleClick(function () {});
            }
        };

        var _showMoreInfo = function (show) {
//            $("#moreInfo").toggle(show);
            $("#moreInfo").hide();   // TODO: TEMP
        };

        var _gotoIntro = function () {
            if (_submitted) {
                //--people use the introduction button as a way to go back and start over - so if the user has already submitted, reload the page.
                document.location.reload(true);
                return;
            }
//            _instructions.showIntroDialog();
            $("#titleBar").hide();
            _activePage = INTRO;
            _introPage.showDivs(true);
            _priorityList.showDivs(false);
            _mechanismList.showDivs(false);
            _bubbleChart.showDivs(false);
            _showMoreInfo(false);
            _showNextButton(false, BTN_NEXT);
            _showBackButton(false, BTN_BACK);
        };

        var _fileAndVersion = function () {
            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName()) + '&v=' + SAS.mainInstance.getCacheVersion();
        };

        var _gotoPriorities = function () {
            $("#titleBar").show();
            if (!_priorityStartTime) _priorityStartTime = new Date();
            _activePage = PRIORITIES;
            _introPage.showDivs(false);
            _mechanismList.showDivs(false);
            _priorityList.showDivs(true);
            _bubbleChart.showDivs(true);
            _showMoreInfo(true);//--will allow more info to be shown when bubbles are colored by a later option... will be empty otherwise
            _showNextButton(true, BTN_NEXT);
            _showBackButton(true, BTN_BACK);
            if (!_priorityList.hasData()) {

                d3.json('/getPriorities' + _fileAndVersion(), function (data) {
                    _priorityList.load(data);
                    _bubbleChart.resizeBubbles();
                    _instructions.showStarsDialog(_priorityList.getTotalStars());
                    _bubbleChart.colorByPriority();
                    _layout.positionElements();
                });
            } else {
                _layout.positionElements();
                //_bubbleChart.colorByPriority();--keep the coloring from the later screens
            }
            //_bubbleChart.onBubbleClick(function () {});//--if its colored by a later screen, keep the info available...
        };

        var _gotoImpacts = function () {
            $("#titleBar").show();
            if (!_impactsStartTime) _impactsStartTime = new Date();
            _activePage = IMPACTS;
            _introPage.showDivs(false);
            _priorityList.showDivs(false);

            //_scenarioList.showDivs(false);
            _bubbleChart.showDivs(true);
            //_map.showDivs(false);
            _showMoreInfo(true);
            _showNextButton(true, BTN_NEXT);
            _showBackButton(true, BTN_BACK);
            if (!_mechanismList.hasData()) {
                d3.json('/getMechanisms' + _fileAndVersion(), function (data) {
                    _mechanismList.load(data);
                    _mechanismList.ensureShowMiniBubbleCharts();
                    var priorities = _priorityList.getPriorities();
                    var topScorer = _mechanismList.getTopScorer(priorities);
                    _mechanismList.setActiveMechanism(topScorer);
                    _instructions.showMechanismInstructions(data, priorities, _bubbleChart, topScorer);
                    _bubbleChart.colorForMechanism(topScorer);
                    _layout.positionElements();
                });
            } else {
                _mechanismList.ensureShowMiniBubbleCharts();
                _bubbleChart.colorForMechanism(_mechanismList.getActiveMechanism());
                _layout.positionElements();
            }
            _mechanismList.showDivs(true);
            _setClickToInfoWin(_mechanismList);
        };

        var _gotoMoney = function () {
            $("#titleBar").show();
            if (!_votingStartTime) _votingStartTime = new Date();
            _activePage = MONEY;
            _introPage.showDivs(false);
            _priorityList.showDivs(false);
            //_scenarioList.showDivs(false);
            _bubbleChart.showDivs(true);
            //_map.showDivs(false);
            _showMoreInfo(false);
            _showNextButton(true, (_submitted) ? BTN_SHARE : BTN_SUBMIT);
            _showBackButton(true, BTN_BACK);
            if (!_mechanismList.hasData()) {
                d3.json('/getMechanisms' + _fileAndVersion(), function (data) {
                    _mechanismList.load(data);
                    _mechanismList.ensureShowMoneyAndVotes();
                    _layout.positionElements();
                });
            } else {
                _mechanismList.ensureShowMoneyAndVotes();
                _layout.positionElements();
            }
            if (!_moneyShown) {
                _moneyShown = true;
                _instructions.showMoneyDialog(_mechanismList.getNumCoins());
            }
            _mechanismList.showDivs(true);
            _setClickToInfoWin();
        };

        var _showSharingDialog = function (responseId, headerTxt) {
            _instructions.showSharingDialog(responseId, headerTxt, _self, _bubbleChart, _priorityList.getSortedPriorities());
        };

        var _storeData = function (pageId) {
            if (_submitted) return;
            switch (pageId) {
                case INTRO:
                    _dataManager.storeDemographics(_introPage.getDemographics());
                    break;
                case PRIORITIES:
                    _dataManager.storePriorities(_priorityList.getData());
                    break;
                case MONEY:
                    _dataManager.storeVotes(_mechanismList.getVotes());
                    break;
            }
        };

        var _gotoPage = function (pageId) {
            _storeData(_activePage);
            _lastPage = _activePage;
            switch (pageId) {
                case INTRO:
                    _gotoIntro();
                    break;
                case PRIORITIES:
                    _gotoPriorities();
                    break;
                case IMPACTS:
                    _gotoImpacts();
                    break;
                case MONEY:
                    _gotoMoney();
                    break;
            }
        };

        var _showNext = function () {
            var activePos = _pageIds.indexOf(_activePage);
            if (activePos < 0 || activePos == _pageIds.length - 1) return;
            _gotoPage(_pageIds[activePos + 1]);
            _selectTab(_activePage);
        };

        var _showBack = function () {
            var activePos = _pageIds.indexOf(_activePage);
            if (activePos < 1 || activePos == _pageIds.length) return;
            _gotoPage(_pageIds[activePos - 1]);
            _selectTab(_activePage);
        };

        var _addClickEvents = function (pids) {
            $.each(pids, function (i, pageId) {
                $("#tab_" + pageId)
                    .addClass("tabTitleActive")
                    .click(function () {
                        _gotoPage(pageId);
                        _selectTab(pageId);
                    });
            });
        };

        var _removeClickEvents = function (pids) {
            $.each(pids, function (i, pageId) {
                $("#tab_" + pageId)
                    .removeClass("tabTitleActive")
                    .unbind('click');
            });
        };

        var _initialize = function () {
            _layout.addRightAligners([
//                {sel:$("#btnNext"), leave:10},
                {sel:$("#reshowInstr"), leave:10},
                {sel:$("#moreInfo"), leave:10},
                {sel:$("#footer_sasaki"), leave:5},
                {sel:$("#colorRampLegend"), leave:10}
            ]);
            _layout.addBottomAligners([
                {sel:$("#colorRampLegend"), leave:27},
                {sel:$("#moreInfo"), leave:70},
                {sel:$("#itemsLeft"), leave:24},
                {sel:$("#footer")}
            ]);
            _layout.addHeightFillers([
                {sel:".mechPanel", leave:73},
                {sel:".mechPanelComp", leave:73},
                {sel:"#priorityList", leave:73},
                {sel:$("#chart"), leave:66}
                //40 for image + 24 for footer + 2
            ]);
            _layout.addWidthFillers([
                {sel:$("#chart")}
            ]);

            _addClickEvents([INTRO]);

            _introPage.onStartClick(function () {
                _addClickEvents(_pageIds);
                _showNext();
            });

            $("#opt_credits").click(function () {
                _instructions.showCredits();
            });

            $("#opt_feedback").click(function () {
                var m2Href = "feedback";
                m2Href += "@the";//make spam-bots earn their keep
                m2Href += "tomorrowplan.com";
                window.open("mailto:" + m2Href, '_blank');
                return false;
            });

            $("#btnNext").button();
            $("#btnNext").click(function () {
                if ($(this).hasClass("bigButton_" + BTN_SUBMIT)) {
                    _submitTime = new Date();
                    _showNextButton(false, "");//--hide the button to prevent multiple clicks...
                    _storeData(MONEY);
                    if (_impactsStartTime && _priorityStartTime && _votingStartTime) {
                        var priorityMs = _impactsStartTime.getTime() - _priorityStartTime.getTime();
                        var impactsMs = _votingStartTime.getTime() - _impactsStartTime.getTime();
                        var votingMs = _submitTime.getTime() - _votingStartTime.getTime();
                        _dataManager.storeTimeSpent(Math.round(priorityMs / 1000), Math.round(impactsMs / 1000), Math.round(votingMs / 1000));
                    }
                    _dataManager.saveData(function (entryId) {
                        _submitted = true;
                        _showNextButton(true, BTN_SHARE);
                        _showBackButton(false, BTN_BACK);
                        _showSharingDialog(entryId, "Your response has been submitted. Thank you for your time. ");
                    });
                } else if ($(this).hasClass("bigButton_" + BTN_SHARE)) {
                    _showSharingDialog(_dataManager.getResponseId(), "");
                } else {
                    _showNext();
                }
            });

            $("#btnBack").button();
            $("#btnBack").click(function () {
                _showBack();
            });

            _gotoPage(INTRO);
            _selectTab(_activePage);
        };

        //endregion

        //region public API
        this.updateLayout = function () {
            _layout.positionElements();
        };
        //endregion

        _initialize();
    }
})();