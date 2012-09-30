/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 3:36 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.PriorityDialog
     * @extends SAS.ADialog
     **/
    SAS.PriorityDialog = function (/**SAS.PriorityDef*/ priority) {
        var _self = this;
        /** @type SAS.ADialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.ADialog());
        var DIALOG_ID = "priority_dialog";
        _super._init(DIALOG_ID);

        //region private fields and methods
        /** @type SAS.PriorityDef */
        var _priority = priority;
        var _$title;
        var _$description;
        var _$nickname;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $("<div></div>").appendTo($dlg);
            _$title = $("<input type='text' />").val(_priority.title).appendTo($("<label>Title:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            _$description = $("<input type='text' />").val(_priority.description).appendTo($("<label>Description:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            _$nickname = $("<input type='text' />").val(_priority.nickname).appendTo($("<label>Nickname:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
        };

        var _applyChanges = function () {
            _priority.title = _$title.val();
            _priority.description = _$description.val();
            _priority.nickname = _$nickname.val();
        };

        var _showDialog = function (onAccept, onCancel) {
            var $dlg = _super._prepareToShowDialog();
            _buildContent($dlg);
            var title = "Edit Priority";
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