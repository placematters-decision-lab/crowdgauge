/**
 * User: KGoulding
 * Date: 10/23/12
 * Time: 11:34 AM
 */
(function () { // self-invoking function
    var ICON_EDIT = 'pencil';
    var ICON_DELETE = 'trash';
    var ICON_LOCK = 'locked';

    var _bgColors = {};
    _bgColors[Enums.STATUS_APPROVED] = '#c3f0f7';
    _bgColors[Enums.STATUS_DRAFT] = '#ffe87a';
    _bgColors[Enums.STATUS_NEW] = '#f9f9db';
    _bgColors[Enums.STATUS_REVIEW] = '#ea93ea';

    /**
     * @class SAS.AMechGrid
     * @constructor
     **/
    SAS.AMechGrid = function (dataHandler) {
        var _self = this;

        //region private fields and methods
        var _dataHandler;

        var _onUpdate = function () {};
        var _onGridUpdateRequired = function () {};
        var _onCellUpdateRequired = function () {};

        var _makeUIBtn = function (w, icon) {
            var $editBtn = $('<div class="ui-state-default ui-corner-all ui-state-hover inlineBtn"></div>');
            var $btnIcon = $('<span class="ui-icon ui-icon-' + icon + '"></span>').appendTo($editBtn);
            $editBtn.width(w);
            return $editBtn;
        };

        var _addNewMechanism = function () {
            var m = new SAS.MechanismDef();
            _editMechanism(m, function () {
                _dataHandler.addMechanism(m, function () {
                    _onGridUpdateRequired();
                });
            });
        };

        var _editMechanism = function (/**SAS.MechanismDef*/ m, fn) {
            var mFrm = new SAS.MechanismDialog(m);
            mFrm.showDialog(fn);
        };

        var _showMessage = function (title, msg, buttons) {
            $('#message_dialog').remove();
            var $dlg = $('<div id="message_dialog"></div>').appendTo("body");
            $dlg.html(msg);
            $dlg.dialog({title:title, buttons:buttons});
        };
        //endregion

        //region protected fields and methods (use 'p_' to differentiate).
        this.p_init = function (dataHandler) {
            _dataHandler = dataHandler;
        };

        this.p_setLockState = function ($cell, lock) {
            if (!$cell) return;
            var editIcn = (lock == Enums.LOCK_NONE) ? ICON_EDIT : ICON_LOCK;
            $cell.find('.ui-icon').removeClass().addClass('ui-icon ui-icon-' + editIcn)
        };

        this.p_addMechanism = function (mId, mechObj) {
            /** @type Content */
            var content = mechObj.content;
            /** @type SAS.MechanismDef */
            var mechDef = mechObj.data;
            var $mRow = $("<div>").addClass("mRow");
            var $pRowHeader = $("<div>").addClass("pRowHeader").appendTo($mRow);
            _makeUIBtn(20, ICON_DELETE).appendTo($pRowHeader).click(function () {
                if (confirm("Are you sure you want to erase " + SAS.localizr.get(mechObj.data.title))) {
                    _dataHandler.deleteMechanism(mId, function () {
                        _onGridUpdateRequired();
                    });
                }
            });
            var editIcn = (content.lock == Enums.LOCK_NONE) ? ICON_EDIT : ICON_LOCK;
            _makeUIBtn(20, ICON_EDIT).appendTo($pRowHeader).click(function () {
                _editMechanism(mechDef, function () {
                    _dataHandler.updateContent(content, true, function () {
                        _onGridUpdateRequired();
                    });
                });
            });
            var $rTitle = $("<div>").addClass("pRowTitle").appendTo($pRowHeader);
            SAS.localizr.live(mechDef.getNickname(), $rTitle);
            return $mRow;
        };

        this.p_callOnUpdate = function () {
            _onUpdate();
        };

        this.p_callOnGridUpdateRequired = function () {
            _onGridUpdateRequired();
        };

        this.p_callOnCellUpdateRequired = function () {
            _onCellUpdateRequired();
        };

        this.p_addColHeader = function ($pRow) {
            var $rowColHdr = $("<div>").addClass("pRowColumnHeader").appendTo($pRow);
            $rowColHdr.html('Mechanisms:');
        };

        this.p_addDeleteButton = function ($holder) {
            return _makeUIBtn(20, ICON_DELETE).appendTo($holder)
        };

        this.p_addEditButton = function ($holder, content) {
            var editIcn = (content.lock == Enums.LOCK_NONE) ? ICON_EDIT : ICON_LOCK;
            var $btn = _makeUIBtn(20, editIcn).appendTo($holder);
            if (content && content.status) {
                $btn.css({background:_bgColors[content.status]});
            }
            return $btn;
        };

        this.p_editContent = function (/**Content*/ c, frmMakerFn, fn) {
            _dataHandler.takeLock(false, c, function () {
                var cFrm = frmMakerFn();
                cFrm.onClose(function (manual, dialog) {
                    if (cFrm.hasChanges()) return;//lock should only be released on cancel (otherwise it will happen after save is complete)
                    _dataHandler.releaseLock(c);
                });
                cFrm.showDialog(fn);
            }, function () {
                _showMessage('Content is locked', 'Content is currently locked by another user! If you\'re certain nobody is actively editing this content, you can choose to steal the lock.', {
                    "Close":function () {
                        $(this).dialog("close");
                    },
                    "Steal Lock":function () {
                        _dataHandler.takeLock(true, c);
                        $(this).dialog("close");
                    }
                });
            });
        };
        //endregion

        //region public API
        /**
         * @param {Function} fn
         */
        this.onUpdate = function (fn) {
            _onUpdate = fn;
        };

        /**
         * @param {Function} fn
         */
        this.onGridUpdateRequired = function (fn) {
            _onGridUpdateRequired = fn;
        };

        /**
         * @param {Function} fn
         */
        this.onCellUpdateRequired = function (fn) {
            _onCellUpdateRequired = fn;
        };

        this.addNewMechanism = function () {
            _addNewMechanism();
        };

        this.showContent = function() {};//for override
        //endregion
    }
})();