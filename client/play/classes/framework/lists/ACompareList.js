/**
 * User: kgoulding
 * Date: 4/10/12
 * Time: 1:35 PM
 */
(function () { // self-invoking function
    //--the difficulty with using this kind of inheritance is that the constructor needs to be called in order to set the prototype
    //--e.g. new SAS.ACompareList()
    //--it then has to be called again to set the correct "this" context...
    //--its unclear how private vars are referenced when the protected "this._" methods are called from child classes...
    SAS.ACompareList = function (bigBubbleChart) {
        var _self = this;

        //region private fields and methods
        /** @type SAS.BubbleChart */
        var _bigBubbleChart = bigBubbleChart;

        var _miniCharts;
        var _catDivs;
        var _mechPanel;
        var _mechanisms = null;
        var _mechDefs = {};

        var _activeMechanism;
        var _onActiveMechanismChange = function () {
        };
        var _policyDivs = {};

        var _addMiniBubbleChart = function (mechanism) {
            if (!_catDivs[SAS.localizr.get(mechanism.data.category)]) return;
            var mc = new SAS.MiniBubbleChart(_bigBubbleChart);
            _miniCharts.push(mc);
            var iconDiv = _self._o_getMechIconDivById(mechanism.id);
            mc.addMiniBubbleChart(iconDiv, mechanism.values);
        };

        var _addCatDiv = function (category) {
            if (!_catDivs[category]) {
                var catClass = 'cat';
                if (category != '') {
                    catClass = "cat_" + category.replace(/ /g, "_").toLowerCase();
                }
                var catDiv = $("<div class='mechCat'></div>").appendTo(_mechPanel);
                var catTitleDiv = $("<div class='mechCatTitle'></div>").appendTo(catDiv);
                catTitleDiv.text(category);
                _catDivs[category] = catDiv;
            }
        };

        var _addPolicyDiv = function (category) {
            if (!_policyDivs[category]) {
                var catClass = "cat_" + category.replace(/ /g, "_").toLowerCase();
                _policyDivs[category] = $('.' + catClass);
            }
        };

        var _resizeMiniBubbleCharts = function () {
            if (_miniCharts == null) return;
            $.each(_miniCharts, function (i, mini) {
                mini.updateSizes();
            });
        };

        var _updateSelectionDisplay = function () {
            _self._o_updateSelectionDisplay(_activeMechanism);
        };

        var _getHighestScoringMechanism = function (mechanisms, priorities) {
            var maxMech = null;
            var maxVal = 0;
            $.each(mechanisms, function (i, mechanism) {
                var score = new SAS.MechanismScorer(mechanism).getScoreForPriorities(priorities);
                if (score > maxVal) {
                    maxVal = score;
                    maxMech = mechanism;
                }
            });
            return maxMech;
        };

        var _getTopScorer = function (priorities) {
            return _getHighestScoringMechanism(_mechanisms, priorities);
        };

        //endregion

        //region protected fields and methods (use '_' to differentiate).

        this._mechPanel = function (p) {
            if (p) {
                _mechPanel = p;
            } else {
                return _mechPanel;
            }
        };

        this._mechanisms = function (p) {
            if (p) {
                _mechanisms = p;
                _mechDefs = {};
                $.each(_mechanisms, function (i, mechanism) {
                    _mechDefs[mechanism.data.uid] = mechanism.data;
                });
            } else {
                return _mechanisms;
            }
        };
        this._showBubbleCharts = function (show) {
            if (_miniCharts == null) return;
            $.each(_miniCharts, function (i, mini) {
                mini.showDivs(show);
            });
        };

        this._ensureShowMiniBubbleCharts = function () {
            if (_miniCharts == null) {
                _miniCharts = [];
                $.each(_mechanisms, function (i, mechanism) {
                    _addMiniBubbleChart(mechanism);
                });
                return true;
            }
            return false;
        };

        this._resizeMiniBubbleCharts = function () {
            _resizeMiniBubbleCharts();
        };

        this._getCatDiv = function (catname) {
            return _catDivs[catname];
        };

        this._addCatDivs = function (divTitles) {
            _catDivs = {};
            $.each(divTitles, function (i, value) {
                _addCatDiv(value);
            });
        };

        this._getPolicyDivs = function () {
            return _policyDivs;
        };

        this._addPolicyDiv = function (category) {
            _addPolicyDiv(category);
        };

        this._setActiveMechanism = function (mechanism) {
            _activeMechanism = mechanism;
            _updateSelectionDisplay();
            _onActiveMechanismChange();
        };

        this._updateSelectionDisplay = function () {
            _updateSelectionDisplay();
        };

        this._o_getMechIconDivById = function (id) { };
        this._o_updateSelectionDisplay = function (id) { };
        //endregion

        //region public API
        this.hasData = function () {
            return _mechanisms != null;
        };

        this.getData = function () {
            return _mechanisms;
        };

        this.getActiveMechanism = function () {
            return _activeMechanism;
        };
        this.setActiveMechanism = function (mech) {
            _activeMechanism = mech;
            _updateSelectionDisplay();
            _onActiveMechanismChange();
        };

        this.getMechanismDef = function (mechId) {
            return _mechDefs[mechId];
        };

        this.onActiveMechanismChange = function (fn) {//this _self is called within the context of the MechanismList (the one with the prototype)
            _onActiveMechanismChange = fn;
        };

        this.getTopScorer = function (priorities) {
            return _getTopScorer(priorities);
        };
        //endregion
    }
})();