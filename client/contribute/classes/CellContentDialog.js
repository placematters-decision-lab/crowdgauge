/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 3:36 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.MechanismDialog
     * @extends SAS.ADialog
     **/
    SAS.CellContentDialog = function (/**Content*/ content) {
        var _self = this;
        /** @type SAS.ADialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.ADialog());
        var DIALOG_ID = "mechanism_dialog";
        _super._init(DIALOG_ID);

        //region private fields and methods
        /** @type Content */
        var _content = content;
        var _$description;
        var _$paletteSelection;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $("<div></div>").appendTo($dlg);
            var status = _content.status || Enums.STATUS_DRAFT;
            if (status == Enums.STATUS_NEW) status = Enums.STATUS_DRAFT;//always default to 'draft' status
            var statusOpts = [Enums.STATUS_NEW, Enums.STATUS_DRAFT, Enums.STATUS_REVIEW, Enums.STATUS_APPROVED];
            $('<label for="status_sel">Status:</label>').addClass("dialogLabel").appendTo($inputsDiv);
            _$paletteSelection = $('<select id="status_sel"></select>').appendTo($inputsDiv);
            SAS.controlUtilsInstance.populateSelectList(_$paletteSelection, null, statusOpts, status);

            var val = _content.data || "";
            var $descDiv = $('<div>').appendTo($inputsDiv);
            $('<label for="description_txt">Description:</label>').addClass("dialogLabel").appendTo($descDiv);
            _$description = $('<textarea id="description_txt"></textarea>').val(val).appendTo($('<div>').appendTo($descDiv));
            //_$description.wysiwyg();
        };

        var _applyChanges = function () {
            _content.data = _$description.val();
            _content.status = (_content.data === "") ? Enums.STATUS_NEW : _$paletteSelection.val();
        };

        var _showDialog = function (onAccept, onCancel) {
            var $dlg = _super._prepareToShowDialog();
            _buildContent($dlg);
            var title = "Edit Content";
            var buttons = { "Cancel":function () {
                _super._closeDialog();
                if (onCancel) onCancel();
            }, "OK":function () {
                _applyChanges();
                onAccept();
                _super._closeDialog();
            }};
            _super._dialog(title, {modal:true, buttons:buttons, width:700, defaultButtonNum:1 });
        };
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        /**
         * @param {Function} [onAccept] callback to run if user accepts changes
         * @param {Function} [onCancel] callback to run if user cancels
         */
        this.showDialog = function (onAccept, onCancel) {
            _showDialog(onAccept, onCancel);
        };
        //endregion
    }
})();