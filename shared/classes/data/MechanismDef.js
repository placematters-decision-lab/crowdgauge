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
        var _getUID = function () {
            var msSince2012 = new Date().getTime()-1325376000000;
            return msSince2012 + "-" + Math.floor(Math.random()*10000);
        };

        var _defaults = {
            title: "",
            progressive: "",
            description: "",
            nickname: "",
            uid: "m"+_getUID()
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

        /** @type {Object} the title of the mechanism (e.g. Improve parking strategy) (lang object)*/
        this.title = _settings.title;

        /** @type {Object} the progressive form of the title (e.g. Improving parking strategy) (lang object)*/
        this.progressive = _settings.progressive;

        /** @type {Object} full descriptive text (lang object)*/
        this.description = _settings.description;

        /** @type {Object} a shorter version of the title to help identify this mechanism in the UI (e.g. Parking) (lang object)*/
        this.nickname = _settings.nickname;

        /** @type {String} unique id*/
        this.uid = _settings.uid;
        //endregion
    }
})();