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
        var _activePalette = null;
        var _clipboardColorData = {};

        //region private fields and methods
        //var foo = ...
        var _getColor = function (color) {
            if (!_activePalette) return color || '#000000';
            return _activePalette;
        };
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

        this.p_mkColorPickerField = function (id, title, $div, color) {
            var $colorHdr = $('<div class="dept_row_color">').text("Color:").appendTo($div);

            var $cpInput = $('<input type="hidden" />').css({position: "static", display: "inline-block", verticalAlign: "middle"}).appendTo($div);
            $cpInput.miniColors({
                change: function (hex, rgb) {
                    _activePalette = hex;
                }
            });
            var pasteClass = 'btn_paste_clr';
            var getter = function () {
                return _activePalette;
            };
            var updater = function () {
                if (_clipboardColorData[pasteClass]) {
                    _activePalette = _clipboardColorData[pasteClass].data;
                    $cpInput.miniColors('value', _getColor(color));
                }
            };
            $div.data('fieldUpdaterClr', function (val) {//--this can be used to update the value anywhere we can access the dept_row object
                $cpInput.miniColors('value', _getColor(color));
            });

            $cpInput.miniColors('value', _getColor(color));
            return $cpInput;
        };
        //endregion

        //region public API
        //this.getFoo = function() { ...
        //endregion
    }
})();