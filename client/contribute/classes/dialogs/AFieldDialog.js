/**
 * User: KGoulding
 * Date: 11/8/12
 * Time: 4:23 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.AFieldDialog
     * @extends SAS.ADialog
     **/
    SAS.AFieldDialog = function () {
        var _self = this;
        /** @type SAS.ADialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.ADialog());

        //region private fields and methods
        //var foo = ...
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        this.p_mkShortTextField = function (id, title, $div, langObj) {
            var $fieldRow = $('<div>').appendTo($div);
            $('<label for="' + id + '">' + title + ':</label>').addClass("dialogLabel").appendTo($fieldRow);
            var $ans = $('<input id="' + id + '" type="text" size="50" />').appendTo($('<div>').appendTo($fieldRow));
            SAS.localizr.live(langObj, $ans);
            return $ans;
        };

        this.p_mkLongTextField = function (id, title, $div, langObj) {
            var $fieldRow = $('<div>').appendTo($div);
            $('<label for="' + id + '">' + title + ':</label>').addClass("dialogLabel").appendTo($fieldRow);
            var $ans = $('<textarea id="' + id + '" rows="4" cols="50" />').appendTo($('<div>').appendTo($fieldRow));
            SAS.localizr.live(langObj, $ans);
            return $ans;
        };

        this.p_mkColorPickerField = function (id, title, $div, langObj) {
            var $colorHdr = $('<div class="dept_row_color table_hdr">').text('Color').appendTo($row);

//            _addPasteArea($colorHdr, function (rows) {
//                _pasteMultipleForId(_activePalette, 'Clr', rows);
//            }, function () {
//                function rgb2hex(rgbs) {
//                    var rgb = rgbs.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
//                    if (!rgb) {
//                        console.log('Could not match rgb: ' + rgbs);
//                        return '#000000';
//                    }
//                    function hex(x) {
//                        return ("0" + parseInt(x).toString(16)).slice(-2);
//                    }
//
//                    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
//                }
//
//                //'this' is the td element
//                return rgb2hex($(this).css('backgroundColor'));
//            });
        };
        //endregion

        //region public API
        //this.getFoo = function() { ...
        //endregion
    }
})();