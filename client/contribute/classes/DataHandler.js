/**
 * User: KGoulding
 * Date: 9/19/12
 * Time: 9:23 AM
 */
(function () { // self-invoking function
    /**
     * @class SAS.DataHandler - works with server-side @see ServerDataHandler
     **/
    SAS.DataHandler = function (filename) {
        var _self = this;

        //region private fields and methods
        var _filename = filename;
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        /**
         * works with @see ServerDataHandler.addPriority
         * @param {SAS.PriorityDef} p
         * @param {Function} [callback]
         */
        this.addPriority = function (p, callback) {
            $.post("/addPriority", {data:JSON.stringify(p)},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ServerDataHandler.addMechanism
         * @param {SAS.MechanismDef} m
         * @param {Function} [callback]
         */
        this.addMechanism = function (m, callback) {
            $.post("/addMechanism", {data:JSON.stringify(m)},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ServerDataHandler.addMechanism
         * @param {String} mId
         * @param {Function} [callback]
         */
        this.deleteMechanism = function (mId, callback) {
            $.post("/deleteMechanism", {id:mId},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ServerDataHandler.addMechanism
         * @param {String} pId
         * @param {Function} [callback]
         */
        this.deletePriority = function (pId, callback) {
            $.post("/deletePriority", {id:pId},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ServerDataHandler.updateContent
         * @param {Content} c
         * @param {Function} [callback]
         */
        this.updateContent = function (c, callback) {
            $.post("/updateContent", {data:JSON.stringify(c)},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ServerDataHandler.getAllContent
         * @param {function(Array.<Content>)} callback
         */
        this.getAllContent = function (callback) {
            $.get('/getAllContent?filename='+encodeURIComponent(_filename), function(data) {
                callback(data);
            });
        };

        //endregion
    }
})();