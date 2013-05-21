/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 3:36 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.PriorityDialog
     * @extends SAS.AFieldDialog
     * @constructor
     **/
    SAS.PriorityDialog = function (/**SAS.PriorityDef*/ priority) {
        var _self = this;
        /** @type SAS.AFieldDialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.AFieldDialog());
        var DIALOG_ID = "priority_dialog";
        _super._init(DIALOG_ID);

        //region private fields and methods
        /** @type SAS.PriorityDef */
        var _priority = priority;
        var _$title;
        var _$description;
        var _$nickname;

        var _$imagePane;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $("<div></div>").appendTo($dlg);
            _$title = _super.p_mkShortTextField('pd_title', "Title", $inputsDiv, _priority.title);
            _$nickname = _super.p_mkShortTextField('pd_nickname', "Nickname (optional short version of title)", $inputsDiv, _priority.nickname);
            _$description = _super.p_mkLongTextField('pd_description', 'Description', $inputsDiv, _priority.description);

            _$imagePane = $("<div class='panel'>").appendTo($inputsDiv);
            _addImagePane();
        };

        var _drawRow = function (file) {
            var $row = $("<div>").appendTo(_$imagePane);
            $('<div>').text('Your icon should appear twice below (black on the left, red on the right). This is to ensure your icons can be dynamically colored.').appendTo($row);
            $('<img src="' + file.thumbnail_url + '?color=black"}">').appendTo($row);
            $('<img src="' + file.thumbnail_url + '?color=crimson"}">').appendTo($row);
            $('<span/>').text(file.name).appendTo($row);
            $('<button/>').text("delete").appendTo($row).click(function () {
                $.post('/deletefile/', {groupId:_priority.uid, name:file.name}, function () {
                    $row.remove();
                });
            });
        };

        var _addImagePane = function () {
            $('<div>').text('SVG file for icon:').appendTo(_$imagePane);
            var $chooseFilesBtn = $('<input type="file" data-url="/fileupload">').appendTo(_$imagePane);
            $chooseFilesBtn.attr("name", _priority.uid);

            $.getJSON('/getImage/' + _priority.uid, function (file) {
                _drawRow(file);
            });
            $chooseFilesBtn.fileupload({
                dataType:'json',
                done:function (e, data) {
                    $.each(data.result, function (index, file) {
                        _drawRow(file);
                    });
                }
            });
        };

        var _applyChanges = function () {
            var vals = {};
            vals.title = _$title.val();
            vals.description = _$description.val();
            vals.nickname = _$nickname.val();
            SAS.localizr.set(_priority, vals);
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