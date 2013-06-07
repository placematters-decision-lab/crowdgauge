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

        var _pagesVisited = [];
        var _instructions = SAS.instructionsInstance;
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
                    text = "How might civic projects and policies impact your priorities?";
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

        var _setClickToInfoWin = function () {
            if (_activePage == IMPACTS) {
                _bubbleChart.onBubbleClick(function (id) {
                    new SAS.InfoWindow().createImpactsWindow(_mechanismList.getActiveMechanism(), _priorityList.getPriorities(), id);
                });
            } else if (_activePage == MONEY) {
                _bubbleChart.onBubbleClick(function (id) {
                    new SAS.InfoWindow().createActionsWindow(_priorityList.getPriorityDef(id), _mechanismList.getVotes());
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
            _showLoadIcon(false);
        };

        var _fileAndVersion = function () {
            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName()) + '&v=' + SAS.mainInstance.getCacheVersion();
        };

        var _showLoadIcon = function (show) {
            $("#listLoadIcon").toggle(show);
        };

        var _gotoPriorities = function () {
            _activePage = PRIORITIES;
            _introPage.showDivs(false);
            if (!_priorityList.hasData()) return;//--will come back once data has loaded
            $("#titleBar").show();
            if (!_priorityStartTime) _priorityStartTime = new Date();
            _mechanismList.showDivs(false);
            _priorityList.showDivs(true);
            _bubbleChart.showDivs(true);
            _showMoreInfo(true);//--will allow more info to be shown when bubbles are colored by a later option... will be empty otherwise
            _showNextButton(true, BTN_NEXT);
            _showBackButton(true, BTN_BACK);
            if (_pagesVisited.indexOf(PRIORITIES) < 0) {
                _pagesVisited.push(PRIORITIES);
                _instructions.showStarsDialog(_priorityList.getTotalStars(), true);
            } else {
                _instructions.showStarsDialog(_priorityList.getTotalStars(), false);
            }
            _bubbleChart.resizeBubbles();
            _bubbleChart.colorByPriority();
            _layout.positionElements();
            //_bubbleChart.onBubbleClick(function () {});//--if its colored by a later screen, keep the info available...
        };

        var _gotoImpacts = function () {
            _activePage = IMPACTS;
            if (!_mechanismList.hasData()) return;//--will come back once data has loaded

            $("#titleBar").show();
            if (!_impactsStartTime) _impactsStartTime = new Date();
            _introPage.showDivs(false);
            _priorityList.showDivs(false);

            //_scenarioList.showDivs(false);
            _bubbleChart.showDivs(true);
            //_map.showDivs(false);
            _showMoreInfo(true);
            _showNextButton(true, BTN_NEXT);
            _showBackButton(true, BTN_BACK);

            var priorities = _priorityList.getPriorities();
            var topScorer = _mechanismList.getTopScorer(priorities);

            if (_pagesVisited.indexOf(IMPACTS) < 0) {
                _pagesVisited.push(IMPACTS);
                _instructions.showMechanismInstructions(priorities, _bubbleChart, topScorer, true);
            } else {
                _instructions.showMechanismInstructions(priorities, _bubbleChart, topScorer, false);
            }
            _mechanismList.setActiveMechanism(topScorer);
            _mechanismList.ensureShowMiniBubbleCharts();
            _bubbleChart.colorForMechanism(_mechanismList.getActiveMechanism());
            _mechanismList.showDivs(true);
            _layout.positionElements();
            _setClickToInfoWin();
        };

        var _gotoMoney = function () {
            _activePage = MONEY;
            if (!_mechanismList.hasData()) return;//--will come back once data has loaded

            $("#titleBar").show();
            if (!_votingStartTime) _votingStartTime = new Date();
            _introPage.showDivs(false);
            _priorityList.showDivs(false);
            //_scenarioList.showDivs(false);
            _bubbleChart.showDivs(true);
            //_map.showDivs(false);
            _showMoreInfo(false);
            _showNextButton(true, (_submitted) ? BTN_SHARE : BTN_SUBMIT);
            _showBackButton(true, BTN_BACK);

            _mechanismList.ensureShowMoneyAndVotes();
            _layout.positionElements();

            if (_pagesVisited.indexOf(MONEY) < 0) {
                _pagesVisited.push(MONEY);
                _instructions.showMoneyDialog(_mechanismList.getNumCoins(), true);
            } else {
                _instructions.showMoneyDialog(_mechanismList.getNumCoins(), false);
            }
            _mechanismList.showDivs(true);
            _setClickToInfoWin();
        };

        var _gotoSharingPage = function (saveObj, headerTxt) {
            var p = $.extend(saveObj, { sharing: 'yes' });
            window.location = '/client/play/entries.html?' + $.param(p);
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
            if (pageId != INTRO && _lastPage == INTRO) {
                _logosMin(true); // #header #logos animation
            } else if (pageId == INTRO) {
                _logosMin(false);
            }
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

        var _preloadData = function () {
            d3.json('/getPriorities' + _fileAndVersion(), function (data) {
                _priorityList.load(data);
                if (_activePage == PRIORITIES) {
                    _gotoPriorities();
                }
            });
            d3.json('/getMechanisms' + _fileAndVersion(), function (data) {
                _mechanismList.load(data);
                _mechanismList.preloadActionDefs();
                if (_activePage == IMPACTS) {
                    _gotoImpacts();
                } else if (_activePage == MONEY) {
                    _gotoMoney();
                }
            });
        };

        var _resizeFonts = function () {
            var fontsize_introTxtH1 = 50;
            var fontsize_introTxt = 12;  //TODO: initial font
            var fontsize_priorityTxtH2 = 35;  //TODO: initial font

            var preferredWidth = 768;
            var displayWidth = $(window).width();
            var percentage = displayWidth / preferredWidth;
            var newFontSize_introTxt = Math.max(14, Math.floor(fontsize_introTxt * percentage) - 1);
            var newFontSize_introTxtH1 =  Math.max(20, Math.floor(fontsize_introTxtH1 * percentage) - 1);
            var newFontSize_priorityTxtH2 =  Math.max(20, Math.floor(fontsize_priorityTxtH2 * percentage) - 1);

            $(".introTxtH1").css("font-size", newFontSize_introTxtH1);
            $(".introTxt").css("font-size", newFontSize_introTxt);
            $(".priorityTxtH2").css("font-size", newFontSize_priorityTxtH2);
        };

        var _initialize = function () {
            _preloadData();
            var bottomoffset = 65;

            _layout.addRightAligners([
//                {sel:$("#btnNext"), leave:10},
//                {sel: $("#reshowInstr"), leave: 10},
                {sel: $("#moreInfo"), leave: 10},
                {sel: $("#footer_sasaki"), leave: 5}
                //{sel: $("#colorRampLegend"), leave: 10}
            ]);
            _layout.addBottomAligners([
                //{sel: $("#colorRampLegend"), leave: 27},
                {sel: $("#moreInfo"), leave: 70},
                {sel: $("#itemsLeft"), leave: 24},
                {sel: $("#footer")}
            ]);
            _layout.addHeightFillers([
                {sel: ".mechPanel", leave: bottomoffset},
                {sel: ".mechPanelComp", leave: bottomoffset},
                {sel: "#priorityList", leave: bottomoffset},
                {sel: $("#chart"), leave: 66},
                {sel: $(".introTxt"), leave: 10}
                //40 for image + 24 for footer + 2
            ]);
            _layout.addWidthFillers([
                {sel: $("#chart")},
                {sel: $(".introTxt"), leave: $(".introFrm").outerWidth() + 70},
                {sel: $("#tab_group"), leave: $("#options").outerWidth() + 5},//add 5 to prevent resize flicker
                {sel: $("#titleBar"), leave: $("#bigButtonHolder").width() + 70}//add 5 to prevent resize flicker
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
                    _showNextButton(false, '');//--hide the button to prevent multiple clicks...
                    _showBackButton(false, '');
                    _storeData(MONEY);
                    if (_impactsStartTime && _priorityStartTime && _votingStartTime) {
                        var priorityMs = _impactsStartTime.getTime() - _priorityStartTime.getTime();
                        var impactsMs = _votingStartTime.getTime() - _impactsStartTime.getTime();
                        var votingMs = _submitTime.getTime() - _votingStartTime.getTime();
                        _dataManager.storeTimeSpent(Math.round(priorityMs / 1000), Math.round(impactsMs / 1000), Math.round(votingMs / 1000));
                    }
                    _dataManager.saveData(function (saveObj) {
                        _submitted = true;
                        _gotoSharingPage(saveObj);
                        //_showNextButton(true, BTN_SHARE);
                        //_showBackButton(false, BTN_BACK);
                        //_showSharingDialog(responseData, "Your response has been submitted. Thank you for your time. ");
                    });
//                } else if ($(this).hasClass("bigButton_" + BTN_SHARE)) {
//                    _gotoSharingPage(_dataManager.getResponseId(), "");
                } else {
                    _showNext();
                }
            });

            $("#btnBack").button();
            $("#btnBack").click(function () {
                _showBack();
            });

            $("#vibrantneo_logo").click(function () {
                window.open("http://vibrantneo.org/");
            });

            _gotoPage(INTRO);
            _selectTab(_activePage);
        };

        var _logosMin = function (min) {
            var collapsedFooterHeight = 10;
            var expandedFooterHeight = 50;

            var $footer = $("#footer");
            var top = $footer.offset().top;
            if (min) {
                var duration = 500;
                $("#imaginemyneo_logo").animate({
                    width: 150,
                    marginTop: 1
                }, duration);

                $("#vibrantneo_logo").animate({
                    width: 70,
                    marginTop: 1
                }, duration);

                $("#logos").animate({
                    height: '40px'
                }, duration);
                $footer.animate({
                    top: top - (expandedFooterHeight - collapsedFooterHeight),
                    height: expandedFooterHeight
                }, duration, function() {
                    _layout.positionElements();
                });
            } else {
                //going back to intro page...
                $footer.animate({
                    top: top + (expandedFooterHeight - collapsedFooterHeight),
                    height: collapsedFooterHeight
                }, 300, function() {
                    _layout.positionElements();
                });
            }
        };

        //endregion

        //region public API
        this.updateLayout = function () {
            _layout.positionElements();
        };

        this.afterLayout = function () {
            _resizeFonts();
        };
        //endregion

        _initialize();
    }
})();