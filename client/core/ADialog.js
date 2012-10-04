/**
 * User: kgoulding
 * Date: 6/14/12
 * Time: 10:11 AM
 */
(function () { // self-invoking function
    //region private static fields and methods
    var _OnAnyClose = function (manual) { };
    var _OnAnyShown = function () { };
    //endregion

    /**
     * @class SAS.ADialog
     **/
    SAS.ADialog = function () {
        var _self = this;

        //region private fields and methods
        var _dlg;
        var _dialogId;
        var _onClose = function (manual, dialog) { };
        var _onShown = function () { };
        var _mIsShowing;
        var _closedManually;
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        this._init = function (dialogId) {
            _dialogId = dialogId;
        };

        this._prepareToShowDialog = function () {
            _mIsShowing = true;
            $("#" + _dialogId + "").remove();
            _dlg = $("<div id='" + _dialogId + "'></div>").appendTo("body");
            return _dlg;
        };

        this._dialog = function (title, settings) {
            _closedManually = false;
            settings = $.extend({
                width:800,
                height:480,
                modal:false,
                resize:function(event, ui) {},
                close:null,
                buttons:{ "OK":function () {
                    _self._closeDialog();
                }
                }
            }, settings);

            _dlg.dialog({
                title:title,
                modal:settings.modal,
                width:settings.width,
                height:settings.height,
                buttons:settings.buttons,
                position:{
                    my:"left top",
                    at:"left top",
                    offset:"30 30"
                },
                close:function (event, ui) {
                    _mIsShowing = false;
                    if (settings.close) settings.close(_closedManually);//_onClose is a public delegate - settings.close is used by derived classes
                    _onClose(_closedManually);
                    _OnAnyClose(_closedManually);
                },
                open:function () {
                    if (settings.defaultButtonNum != null) {
                        $(this).closest('.ui-dialog').find('.ui-dialog-buttonpane button:eq(' + settings.defaultButtonNum + ')').focus();
                    }
                    _onShown();
                    _OnAnyShown();
                },
                resizeStop:settings.resize
            });
        };

        /**
         * @param [ht]
         * @return {Number}
         */
        this._height = function (ht) {
            if (ht) {
                _dlg.dialog( "option", "height", ht );
            } else {
                return _dlg.dialog( "option", "height" );
            }
        };
        this._width = function (wd) {
            if (wd) {
                _dlg.dialog( "option", "width", wd );
            } else {
                return _dlg.dialog( "option", "width" );
            }
        };

        this._closeDialog = function () {
            _closedManually = true;
            _dlg.dialog("close");
        };
        //endregion

        //region public API
        this.setIsShowing = function (value) {
            _mIsShowing = value;
        };
        this.getIsShowing = function () {
            return _mIsShowing;
        };

        this.onClose = function (fn) {
            _onClose = fn;
        };

        /**
         * @param {Function} fn
         */
        this.onShown = function (fn) {
            _onShown = fn;
        };
        //endregion
    };

    //region public static fields and methods
    SAS.ADialog.OnAnyClose = function (fn) {
        _OnAnyClose = fn;
    };
    SAS.ADialog.OnAnyShown = function (fn) {
        _OnAnyShown = fn;
    };
    //endregion
})();