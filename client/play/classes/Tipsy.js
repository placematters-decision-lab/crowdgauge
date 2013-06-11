/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:12 PM
 */
(function () { // self-invoking function
    SAS.Tipsy = function () {
        var _self = this;

        var _detectiPad = function () {
//            return true; //TODO: temp local test

            return (navigator.userAgent.match(/iPad/i) != null);
        };

        var _getClickTouchEventName = function () {
            if (!_detectiPad()) throw 'not supported for non-iPad';
//            return 'click'; //TODO: local test
            return 'touchstart';
        };

        var _initialize = function () {
            if (_detectiPad()) {
                $("html").on(_getClickTouchEventName(), function (e) {
//                    $('.tipsy_ipad').each(function () {
//                        $(this).removeClass('tipsy_ipad').tipsy('hide');
//                    });
//                    return false;
                    $('.tipsy').remove();   //--all ipad tipsy .show calls must use timeout
                });
            }
        };

        this.initialize = function () {
            _initialize();
        };

        this.detectiPad = function () {
            return _detectiPad();
        };

        this.addTooltip = function (selector, options, ipadShow) {
            var $element = $(selector);
            if (!_detectiPad()) {
                $element.tipsy(options);
            } else {
                if (options.live) {
                    $("html").on(_getClickTouchEventName(), selector, function () {
                        if (ipadShow && !ipadShow()) return;
                        var $clickedElem = $(this);
                        //--we can add the tipsy options on click for touch devices
                        $('.tipsy').remove();
                        setTimeout(function(){
                            $clickedElem.tipsy($.extend(options, {trigger: 'manual', live: false})).tipsy('show');
                        }, 100);
                    });
                } else {
                    $element.tipsy($.extend(options, {trigger: 'manual'}));
                    $element.on(_getClickTouchEventName(), function () {
                        if (ipadShow && !ipadShow()) return;
                        var $clickedElem = $(this);
                        $('.tipsy').remove();
                        setTimeout(function(){
                            $clickedElem.tipsy('show');
                        }, 100);
                    });
                }
            }
        };

        this.addClass = function ($element, options) {
            if (!_detectiPad()) {
                $element.addClass(options);
            }
        };

        this.removeClass = function ($element, options) {
            if (!_detectiPad()) {
                $element.removeClass(options);
            }
        };

        this.onShowDialog = function () {
            $('.tipsy').remove();
        };

    };
        SAS.tipsyInstance = new SAS.Tipsy();
        SAS.tipsyInstance.initialize();
    })();/**
 * User: ycui
 * Date: 6/11/13
 * Time: 2:41 PM
 */
