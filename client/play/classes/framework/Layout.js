/**
 * User: kgoulding
 * Date: 4/5/12
 * Time: 10:58 AM
 */
(function () { // self-invoking function
    SAS.Layout = function () {
        var _self = this;

        //region private fields and methods
        var _rightAligners = [];
        var _bottomAligners = [];
        var _widthFillers = [];
        var _heightFillers = [];
        var _onLayout = function () {
        };

        var _getHeightAfter = function (selObj) {
            if (selObj.leave) {
                if (typeof selObj.leave === "number") return selObj.leave;
                return $(selObj.leave).height();
            }
            return 0;
        };
        var _getWidthAfter = function (selObj) {
            if (selObj.leave) {
                if (typeof selObj.leave === "number") return selObj.leave;
                return $(selObj.leave).width();
            }
            return 0;
        };

        var _parseSize = function (textSize) {
            if (textSize == 'none') return null;
            return parseInt(textSize);
        };

        var _positionElements = function () {
            var fullWidth = $(window).width();
            var fullHeight = $(window).height();
            $.each(_rightAligners, function (i, selObj) {//jqElems can be a pre-selected element or a dynamic selector string
                var jqElem = $(selObj.sel);
                var w = jqElem.width();
                var leave = _getWidthAfter(selObj);
                jqElem.css("left", (fullWidth - w - leave));
            });
            $.each(_bottomAligners, function (i, selObj) {//jqElems can be a pre-selected element or a dynamic selector string
                var jqElem = $(selObj.sel);
                var h = jqElem.height();
                var leave = _getHeightAfter(selObj);
                jqElem.css("top", (fullHeight - h - leave));
            });
            $.each(_widthFillers, function (i, selObj) {//jqElems can be a pre-selected element or a dynamic selector string
                var jqElem = $(selObj.sel);
                var x = jqElem.position().left;
                var leave = _getWidthAfter(selObj);
                var w = fullWidth - x - leave;
                var minW = _parseSize(jqElem.css('minWidth'));
                var maxW = _parseSize(jqElem.css('maxWidth'));
                if (minW != null) w = Math.max(minW, w);
                if (maxW != null) w = Math.min(maxW, w);
                jqElem.width(w);
            });
            $.each(_heightFillers, function (i, selObj) {//jqElems can be a pre-selected element or a dynamic selector string
                var jqElem = $(selObj.sel);
                var jqParent = jqElem.offsetParent();
                var pHeight;
                if (jqParent[0] && /^body$/i.test(jqParent[0].tagName)) {//--body element
                    pHeight = fullHeight;
                } else {
                    pHeight = jqParent.height();
                }
                var pos = jqElem.position();
                var ht;
                if (pos == null) {
                    var offset = jqElem.offset();
                    if (offset != null) {
                        ht = pHeight - offset.top;
                    }
                } else {
                    ht = pHeight - pos.top;
                }
                var leave = _getHeightAfter(selObj);
                jqElem.outerHeight(Math.max(0, ht - leave));
            });
            _onLayout();
        };

        var _initialize = function () {
            $(window).resize(function () {
                _positionElements();
            });
        };
        //endregion

        //region public API
        this.addRightAligners = function (jqElems) {
            _rightAligners = _rightAligners.concat(jqElems);
            _positionElements();
        };

        this.addBottomAligners = function (jqElems) {
            _bottomAligners = _bottomAligners.concat(jqElems);
            _positionElements();
        };

        this.addWidthFillers = function (jqElems) {
            _widthFillers = _widthFillers.concat(jqElems);
            _positionElements();
        };

        this.addHeightFillers = function (jqElems) {
            _heightFillers = _heightFillers.concat(jqElems);
            _positionElements();
        };

        this.positionElements = function () {
            _positionElements();
        };


        this.onLayout = function (fn) {
            _onLayout = fn;
        };
        //endregion

        _initialize();
    }
})();