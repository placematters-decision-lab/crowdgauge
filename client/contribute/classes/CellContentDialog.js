/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 3:36 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.CellContentDialog
     * @extends SAS.ADialog
     **/
    SAS.CellContentDialog = function (/**Content*/ content, title) {
        var _self = this;
        /** @type SAS.ADialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.ADialog());
        var DIALOG_ID = "cellcontent_dialog";
        _super._init(DIALOG_ID);

        //region private fields and methods
        /** @type Content */
        var _content = content;
        var _title = title;
        var _hasChanges = false;

        var _$description;
        var _$paletteSelection;
        var _$scoreSelection;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $("<div></div>").appendTo($dlg);
            var status = _content.status || Enums.STATUS_DRAFT;
            if (status == Enums.STATUS_NEW) status = Enums.STATUS_DRAFT;//always default to 'draft' status
            var statusOpts = [Enums.STATUS_NEW, Enums.STATUS_DRAFT, Enums.STATUS_REVIEW, Enums.STATUS_APPROVED];
            var scoreOpts = ['N/A', '-2', '-1', '0', '+1', '+2'];
            var cellDef = new SAS.CellDef(_content.data);

            $('<label for="status_sel">Status:</label>').addClass("dialogLabel").appendTo($inputsDiv);
            _$paletteSelection = $('<select id="status_sel"></select>').appendTo($inputsDiv);
            SAS.controlUtilsInstance.populateSelectList(_$paletteSelection, null, statusOpts, status);
            $('<label for="score_sel">Score:</label>').addClass("dialogLabel").appendTo($inputsDiv);
            _$scoreSelection = $('<select id="score_sel"></select>').appendTo($inputsDiv);
            SAS.controlUtilsInstance.populateSelectList(_$scoreSelection, null, scoreOpts, cellDef.score);
            var $descDiv = $('<div>').appendTo($inputsDiv);
            $('<label for="description_txt">Description:</label>').addClass("dialogLabel").appendTo($descDiv);
            _$description = $('<textarea id="description_txt"></textarea>').val(cellDef.description).appendTo($('<div>').appendTo($descDiv));
            //_$description.wysiwyg();
        };

        var _applyChanges = function () {
            var cellDef = new SAS.CellDef({description:_$description.val(), score:_$scoreSelection.val()});
            _content.data = cellDef;
            _content.status = (cellDef.isEmpty()) ? Enums.STATUS_NEW : _$paletteSelection.val();
            _hasChanges = true;
        };

        var _showDialog = function (onAccept, onCancel) {
            var $dlg = _super._prepareToShowDialog();
            _buildContent($dlg);
            var buttons = { "Cancel":function () {
                _super._closeDialog();
                if (onCancel) onCancel();
            }, "OK":function () {
                _applyChanges();
                onAccept();
                _super._closeDialog();
            }};
            _super._dialog(_title, {modal:true, buttons:buttons, width:700, defaultButtonNum:1 });
        };
        //endregion

        //region public API
        this.hasChanges = function () {
            return _hasChanges;
        };

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