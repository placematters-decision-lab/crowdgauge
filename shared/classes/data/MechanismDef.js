/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 11:02 AM
 */
(function () { // self-invoking function
    /**
     * @class SAS.MechanismDef
     **/
    SAS.MechanismDef = function (data) {
        var _self = this;

        //region private fields and methods
        var _defaults = {
            title: "",
            gerund: "",
            description: "",
            nickname: ""
        };
        var _settings = $.extend({}, _defaults, data);
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.getNickname = function () {
            if (_self.nickname && _self.nickname.length > 0) return _self.nickname;
            return _self.title;
        };

        /** @type {String} the title of the mechanism (e.g. Improve parking strategy)*/
        this.title = _settings.title;

        /** @type {String} the gerund form of the title (e.g. Improving parking strategy)*/
        this.gerund = _settings.gerund;

        /** @type {String} full descriptive text*/
        this.description = _settings.description;

        /** @type {String} a shorter version of the title to help identify this mechanism in the UI (e.g. Parking) */
        this.nickname = _settings.nickname;
        //endregion
    }
})();