/**
 * User: KGoulding
 * Date: 9/20/12
 * Time: 1:04 PM
 */
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
    SAS.MechanismDialog = function (/**SAS.MechanismDef*/ mechanism) {
        var _self = this;
        /** @type SAS.ADialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.ADialog());
        var DIALOG_ID = "mechanism_dialog";
        _super._init(DIALOG_ID);

        //region private fields and methods
        /** @type SAS.MechanismDef */
        var _mechanism = mechanism;
        var _$title;
        var _$gerund;
        var _$description;
        var _$nickname;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $("<div></div>").appendTo($dlg);
            _$title = $("<input type='text' />").val(_mechanism.title).appendTo($("<label>Title:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            _$gerund = $("<input type='text' />").val(_mechanism.gerund).appendTo($("<label>Gerund form of title:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            _$description = $("<input type='text' />").val(_mechanism.description).appendTo($("<label>Description:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            _$nickname = $("<input type='text' />").val(_mechanism.nickname).appendTo($("<label>Nickname:</label>").addClass("dialogLabel").appendTo($("<div>").appendTo($inputsDiv)));
            new SAS.ImageList($("<div class='panel'>").appendTo($inputsDiv), _mechanism.uid, true);
        };

        var _applyChanges = function () {
            _mechanism.title = _$title.val();
            _mechanism.gerund = _$gerund.val();
            _mechanism.description = _$description.val();
            _mechanism.nickname = _$nickname.val();
        };

        var _showDialog = function (onAccept, onCancel) {
            var $dlg = _super._prepareToShowDialog();
            _buildContent($dlg);
            var title = "Edit Mechanism";
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