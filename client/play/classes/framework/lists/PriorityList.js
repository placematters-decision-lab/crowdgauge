/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:30 PM
 */
(function () { // self-invoking function
    SAS.PriorityList = function () {
        var _self = this;

        //region private fields and methods
        var _onRatingChange = function () {};
        var _onLoad = function () {};
        var _priorities = null;
        var _priorityLookup = {};
        var _totalStars = 0;
        var _numStars = 5;
        var _randomizeOrder = SAS.configInstance.randomizeOrder.priorities;

        var _recalcStarBalance = function () {
            var starsUsed = 0;
            $.each(_priorities, function (i, priority) {
                starsUsed += priority.score;
            });
            var starsLeft = (_totalStars - starsUsed);
            if (starsLeft == 0) {
                $("#starsLeft").html("<span class='starsLeftNum'>0</span><small> stars left (to redistribute, lower current ratings)</small>");
            } else {
                $("#starsLeft").html("You have <span class='starsLeftNum'>" + starsLeft + "</span> star" + ((starsLeft > 1) ? "s" : "") + " left");
            }
            $(".sliderDiv").find("img").show();//.prop('disabled', false);
            if (starsLeft < _numStars) {
                $.each(_priorities, function (i, priority) {
                    var disabledEndStars = _numStars - (priority.score + starsLeft);
                    if (disabledEndStars > 0) {
                        for (var j = 0; j < disabledEndStars; j++) {
                            var starNum = _numStars - j;
                            priority.ratingDiv.find("img[title='" + starNum + "']").hide();
                        }
                    }
                });
            }
        };

        var _starAsPerc = function (value) {
            switch (value) {
                case 0:
                    return 5;//values calibrated by what looks right (an even distribution makes top values hard to distinguish)
                case 1:
                    return 15;
                case 2:
                    return 30;
                case 3:
                    return 50;
                case 4:
                    return 75;
                case 5:
                    return 100;
            }
        };

        var _createList = function () {
            $("#leftPanel").addClass("sliderPanel");
            $("#priorityList").html("");
            var orderedArr = _priorities.slice(0);//clone
            if (_randomizeOrder) orderedArr.sort(function() { return 0.5 - Math.random();});
            $.each(orderedArr, function (i, priority) {
                /** @type SAS.PriorityDef */
                var pDef = priority.data;
                console.log(i+": "+pDef.title.en);
                var uid = priority.data.uid;
                _priorityLookup[uid] = priority;
                priority.score = 0;
                priority.id = uid;//alias for use as 'd.id' in d3 functions
                priority.value = _starAsPerc(priority.score);
                var div = $("<div class='sliderGrp'></div>").appendTo("#priorityList");
                var iconDiv = $("<div class='sliderIcon'></div>").appendTo(div);
                var img = $("<img src='/files/" + priority.data.svgPath + "?color=grey" + "' width='26' height='26'>").appendTo(iconDiv);
//                var img = $("<img class='sliderIcon' src='" + priority.icon + ".png' width='26' height='26'>").appendTo(div);
                var ratingDiv = $("<div class='sliderDiv id='slider" + i + "'></div>").appendTo(div);
                priority.ratingDiv = ratingDiv;
                var $titleTxt = $("<div class='sliderTitle'></div>").appendTo(div);
                SAS.localizr.live(pDef.title, $titleTxt);
                ratingDiv.raty({
                    path:'img/raty-img',
                    cancel:true,
                    cancelHint:'put all stars back',
                    hintList:['1', '2', '3', '4', '5'],
                    click:function (score, evt) {
                        priority.score = (score == null) ? 0 : parseInt(score);
                        priority.value = _starAsPerc(priority.score);
                        _onRatingChange();
                        _recalcStarBalance();
                    }
                });
            });
            _recalcStarBalance();
        };

        var _showDivs = function (show) {
            $("#priorityList").toggle(show);
            $("#starsLeft").toggle(show);
            if (show) {
                $("#leftPanel").css("width", 505);
            }
        };

        //endregion

        //region public API
        this.getData = function () {
            var priorityData = {};
            $.each(_priorities, function (i, priority) {
                if (priority.score > 0) {
                    /** @type SAS.PriorityDef */
                    var pDef = priority.data;
                    priorityData[pDef.uid] = priority.score;
                }
            });
            return priorityData;
        };

        this.getTotalStars = function () {
            return _totalStars;
        };

        /** @type SAS.PriorityDef */
        this.getPriorityDef = function (pId) {
            return _priorityLookup[pId].data;
        };

        this.getPriorities = function () {
            return {children:_priorities};//--d3 layout expects 'children'
        };

        this.getSortedPriorities = function () {
            var ans = _priorities.slice(0);//clone
            ans.sort(function (a, b) {
                return b.score - a.score;
            });
            return ans;
        };

        this.getValue = function (i) {
            return _priorityLookup[i].value;
        };

        this.hasData = function () {
            return _priorities != null;
        };

        this.onRatingChange = function (fn) {
            _onRatingChange = fn;
        };

        this.onLoad = function (fn) {
            _onLoad = fn;
        };

        this.load = function (data) {
            _priorities = data;
//            _totalStars = Math.ceil(_priorities.length * 2.5);
            _totalStars = 30;
            _createList();
            _onLoad();
        };

        this.setValues = function (priorityStars) {
            $.each(_priorities, function (i, priority) {
                if (!priorityStars[priority.id]) return true;//continue
                priority.score = priorityStars[priority.id];
                priority.value = _starAsPerc(priority.score);
            });
        };

        this.showDivs = function (show) {
            _showDivs(show);
        };

        //endregion
    }
})();