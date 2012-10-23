/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 11:02 AM
 */
(function () { // self-invoking function
    /**
     * @class SAS.CellDef
     **/
    SAS.CellDef = function (data) {
        var _self = this;

        //region private fields and methods
        var _defaults = {
            description: {},
            score: "N/A"
        };

        var _settings = $.extend({}, _defaults, data);
        //endregion

        //region public API
        this.isEmpty = function () {
            return $.isEmptyObject(_self.description)
                && _self.score == _defaults.score;
        };

        /** @type {String} */
        this.description = _settings.description;

        /** @type {String} */
        this.score = _settings.score;
        //endregion
    }
})();