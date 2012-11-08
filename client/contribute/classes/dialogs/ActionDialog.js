/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 3:36 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.ActionDialog
     * @extends SAS.ADialog
     * @constructor
     **/
    SAS.ActionDialog = function (/**SAS.ActionDef*/ action) {
        var _self = this;
        /** @type SAS.ADialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.ADialog());
        var DIALOG_ID = "priority_dialog";
        _super._init(DIALOG_ID);

        //region private fields and methods
        /** @type SAS.ActionDef */
        var _action = action;
        var _$title;
        var _$value;

        var _$imagePane;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $("<div></div>").appendTo($dlg);
            _$title = $("<input type='text' />").val(SAS.localizr.get(_action.title)).appendTo($("<label>Title:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            _$value = $("<input/>").appendTo($("<label>Value:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            _$value.spinner();
            _$value.spinner( "value", _action.value );
            //_$imagePane = $("<div class='panel'>").appendTo($inputsDiv);
            //_addImagePane();
        };

//        var _addImagePane = function () {
//            var $chooseFilesBtn = $('<input type="file" data-url="/fileupload">').appendTo(_$imagePane);
//            $chooseFilesBtn.attr("name", _action.uid);
//
//            $.getJSON('/getImage/' + _action.uid, function (file) {
//                _drawRow(file);
//            });
//            $chooseFilesBtn.fileupload({
//                dataType:'json',
//                done:function (e, data) {
//                    $.each(data.result, function (index, file) {
//                        _drawRow(file);
//                    });
//                }
//            });
//        };

        var _applyChanges = function () {
            var vals = {};
            vals.title = _$title.val();
            SAS.localizr.set(_action, vals);
            _action.value = _$value.spinner("value");
        };

        var _showDialog = function (onAccept, onCancel) {
            var $dlg = _super._prepareToShowDialog();
            _buildContent($dlg);
            var title = "Action Properties";
            var buttons = { "Cancel":function () {
                _super._closeDialog();
                if (onCancel) onCancel();
            }, "OK":function () {
                _applyChanges();
                onAccept();
                _super._closeDialog();
            }};
            _super._dialog(title, {modal:true, buttons:buttons, width:500, defaultButtonNum:1 });
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