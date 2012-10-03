/**
 * User: KGoulding
 * Date: 9/27/12
 * Time: 9:20 AM
 */
(function () { // self-invoking function
    /**
     * @class SAS.ImageList
     **/
    SAS.ImageList = function ($parent, groupId, multiple) {
        var _self = this;

        //region private fields and methods
        var _$filepanel;

        var _drawRow = function (file) {
            var $row = $("<div>").appendTo(_$filepanel);
            $('<img src="' + file.thumbnail_url + '"}">').appendTo($row);
            $('<span/>').text(file.name).appendTo($row);
            $('<button/>').text("delete").appendTo($row).click(function() {
                $.post('/deletefile/', {groupId:groupId, name:file.name}, function() {
                    $row.remove();
                });
            });
        };

        var _init = function () {

            var $chooseFilesBtn;
            if (multiple) {
                $chooseFilesBtn = $('<input type="file" data-url="/fileupload" multiple>').appendTo($parent);
            } else {
                $chooseFilesBtn = $('<input type="file" data-url="/fileupload">').appendTo($parent);
            }
            $chooseFilesBtn.attr("name", groupId);
            _$filepanel = $("<div>").appendTo($parent);

            $.getJSON('/listfiles/' + groupId, function (data) {
                $.each(data, function (index, file) {
                    _drawRow(file);
                });
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
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API

        //endregion

        _init();
    }
})();