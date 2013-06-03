/**
 * User: kgoulding
 * Date: 5/31/13
 * Time: 5:24 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.Utils
     **/
    SAS.Utils = function () {
        var _self = this;

        //region private fields and methods
        //var foo = ...
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.gup = function (name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.href);
            if (results == null) return null;
            return results[1];
        };
        //endregion
    };
    /**
     @type SAS.Utils
     @const
     */
    SAS.utilsInstance = new SAS.Utils();
})();