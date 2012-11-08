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
     * @extends SAS.AFieldDialog
     * @constructor
     **/
    SAS.MechanismDialog = function (/**SAS.MechanismDef*/ mechanism) {
        var _self = this;
        /** @type SAS.AFieldDialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.AFieldDialog());
        var DIALOG_ID = "mechanism_dialog";
        _super._init(DIALOG_ID);

        //region private fields and methods
        /** @type SAS.MechanismDef */
        var _mechanism = mechanism;
        var _$title;
        var _$progressive;
        var _$description;
        var _$nickname;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $("<div></div>").appendTo($dlg);
            _$title = _super.p_mkShortField('md_title', "Title", $inputsDiv, _mechanism.title);
            _$progressive = _super.p_mkShortField('md_progressive', "Progressive tense of title", $inputsDiv, _mechanism.progressive);
            _$nickname = _super.p_mkShortField('md_nickname', "Nickname (optional short version of title)", $inputsDiv, _mechanism.nickname);
            _$description = _super.p_mkLongTextField('md_description', 'Description', $inputsDiv, _mechanism.description);

            new SAS.ImageList($('<div class="panel">').appendTo($inputsDiv), _mechanism.uid, true);
        };

        var _applyChanges = function () {
            var vals = {};
            vals.title = _$title.val();
            vals.progressive = _$progressive.val();
            vals.description = _$description.val();
            vals.nickname = _$nickname.val();
            SAS.localizr.set(_mechanism, vals);
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