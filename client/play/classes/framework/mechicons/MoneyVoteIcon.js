/**
 * User: kgoulding
 * Date: 4/4/12
 * Time: 2:23 PM
 */
(function () { // self-invoking function
    SAS.MoneyVoteIcon = function (mechanism, action, actionDef) {
        var _self = this;
        var ON = "on";
        var OFF = "off";
        var HLITE = "hlite";
        var DISABLED = "disabled";

        //region private fields and methods
        var _mState = OFF;
        var _mechanism = mechanism;
        var _mAction = action;
        /** @type SAS.ActionDef */
        var _actionDef = actionDef;
        var _moneyDiv;
        var _textDiv;
        var _enabled = true;
        var _isOn = false;
        var _totalCoins = _actionDef.value;
        var _netCoins = _totalCoins;
        var _onSelectionChange = function () {};

        var _currentClass = function () {
            return "coins_" + _mState + "_" + _totalCoins;
        };

        var _hoverClass = function () {
            return "coins_" + HLITE + "_" + _totalCoins;
        };

        var _addMoneyAndVotes = function (sel, values) {
            console.log(_actionDef.value);
            if(_actionDef.value == 0) {
                console.log(_mechanism.id);
                $('#mech' + _mechanism.id + ' .mechText').hide();
            }
            _moneyDiv = $("<div class='coins " + _currentClass() + "'></div>").appendTo(sel);
            _textDiv = $("<div class='mech_action' data-toggle='popover' data-placement='right' data-original-title='"+ SAS.localizr.get(_mAction.title) +"' data-content='"+ SAS.localizr.get(_mAction.description) + "'></div>")
                .appendTo(sel);

            SAS.localizr.live(_mAction.title, _textDiv);   //replaced description with title

            _moneyDiv.hover(
                function () {
                    if (_enabled) {
                        $(this).removeClass(_currentClass());
                        $(this).addClass(_hoverClass());
                        SAS.mainInstance.getBubbleChart().previewMoney(_mechanism, _self);
                    }
                },
                function () {
                    $(this).removeClass(_hoverClass());
                    $(this).addClass(_currentClass());
                    SAS.mainInstance.getBubbleChart().previewMoney(null, null);
                });

            _moneyDiv.click(function () {
                if (!_enabled) return;
                _isOn = !_isOn;
                _updateState();
                _onSelectionChange();
            });
        };

        var _updateState = function () {
            var state;
            if (_isOn) {
                state = ON;
            } else {
                if (_enabled) {
                    state = OFF;
                } else {
                    state = DISABLED;
                }
            }
            _changeState(state);
        };

        var _changeState = function (state) {
            _moneyDiv.removeClass(_currentClass());
            _mState = state;
            _moneyDiv.addClass(_currentClass());
        };

        var _showDivs = function (show) {
            _moneyDiv.toggle(show);
            _textDiv.toggle(show);
        };
        //endregion

        //region public API
        this.showDivs = function (show) {
            _showDivs(show);
        };

        this.isOn = function () {
            return _isOn;
        };

        this.setOn = function (on) {
            _isOn = on;
            _updateState();
        };

        this.setNetCoins = function (numCoins) {
            _netCoins = _totalCoins - numCoins;
        };

        this.getNetCoins = function () {
            return _netCoins;
        };

        this.getTotalCoins = function () {
            return _totalCoins;
        };

        /**
         * @param {Number} [max] optional maximum for return value
         * @return {Number}
         */
        this.getMultiplier = function (max) {
            var val = 0;
            if (_mAction.value) val = _mAction.value;
            if (max) return Math.min(val, max);
            return val;
        };

        this.setEnabled = function (enabled) {
            if (_isOn && !enabled) return;//you can't disable it if its on!
            _enabled = enabled;
            _updateState();
        };

        this.addMoneyAndVotes = function (sel, values) {
            _addMoneyAndVotes(sel, values);
        };

        this.setAction = function (value) {
            _mAction = value;
        };
        /**
         @type ActionItem
         */
        this.getAction = function () {
            return _mAction;
        };

        this.setState = function (value) {
            _mState = value;
        };
        this.getState = function () {
            return _mState;
        };

        this.onSelectionChange = function (fn) {
            _onSelectionChange = fn;
        };
        //endregion
    }
})();