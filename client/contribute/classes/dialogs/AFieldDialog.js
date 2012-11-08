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
        this.p_mkShortField = function (id, title, $div, langObj) {
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
        //endregion

        //region public API
        //this.getFoo = function() { ...
        //endregion
    }
})();