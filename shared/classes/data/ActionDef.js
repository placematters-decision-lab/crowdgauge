/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 11:02 AM
 */
(function () { // self-invoking function
    /**
     * @class SAS.ActionDef
     * @constructor
     **/
    SAS.ActionDef = function (data) {
        var _self = this;

        //region private fields and methods
        var _getUID = function () {
            var msSince2012 = new Date().getTime()-1325376000000;
            return msSince2012 + "-" + Math.floor(Math.random()*10000);
        };

        var _defaults = {
            title: "",
            value: 0,
            uid: "a"+_getUID()
        };
        var _settings = $.extend({}, _defaults, data);
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.getNickname = function () {
            return _self.title;
        };

        /** @type {String} the title of the action*/
        this.title = _settings.title;

        /** @type {Number} the value of the action (for example number of coins)*/
        this.value = _settings.value;

        /** @type {String} unique id*/
        this.uid = _settings.uid;
        //endregion
    }
})();