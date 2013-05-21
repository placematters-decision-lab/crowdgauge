/**
 * User: KGoulding
 * Date: 9/19/12
 * Time: 9:23 AM
 */
(function () { // self-invoking function
    /**
     * @class SAS.DataHandler - works with server-side @see ContributeDataHandler
     * @constructor
     **/
    SAS.DataHandler = function (userId, filename) {
        var _self = this;

        //region private fields and methods
        var _filename = filename;
        var _userId = userId;
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        /**
         * works with @see ContributeDataHandler.takeLock
         * @param {Boolean} force setting this to true lets you steal the lock
         * @param {Content} c
         * @param {Function} [successFn]
         * @param {Function} [failFn]
         */
        this.takeLock = function (force, c, successFn, failFn) {
            $.post("/takeLock", {structureId:JSON.stringify(c.structureId), force:force, user:_userId},
                function (allowed) {
                    if (allowed && successFn) successFn();
                    if (!allowed && failFn) failFn();
                });
        };

        /**
         * works with @see ContributeDataHandler.releaseLock
         * @param {Content} c
         * @param {Function} [callback]
         */
        this.releaseLock = function (c, callback) {
            $.post("/releaseLock", {structureId:JSON.stringify(c.structureId), user:_userId},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ContributeDataHandler.addPriority
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
         * works with @see ContributeDataHandler.addAction
         * @param {SAS.ActionDef} a
         * @param {Function} [callback]
         */
        this.addAction = function (a, callback) {
            $.post("/addAction", {data:JSON.stringify(a)},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ContributeDataHandler.addMechanism
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
         * works with @see ContributeDataHandler.addMechanism
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
         * works with @see ContributeDataHandler.deleteAction
         * @param {String} aId
         * @param {Function} [callback]
         */
        this.deleteAction = function (aId, callback) {
            $.post("/deleteAction", {id:aId},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ContributeDataHandler.deletePriority
         * @param {String} pId
         * @param {Function} [callback]
         */
        this.deletePriority = function (pId, callback) {
            $.post("/deletePriority", {id:pId},
                function (data) {
                    if (callback) callback(data);
                });
        };

        this.deleteCell = function (mId, aId, callback) {
            $.post("/deleteCell", {mid:mId, aId:aId},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ContributeDataHandler.updateContent
         * @param {Content} c
         * @param {Boolean} releaseLock
         * @param {Function} [callback]
         */
        this.updateContent = function (c, releaseLock, callback) {
            $.post("/updateContent", {data:JSON.stringify(c), releaseLock:releaseLock},
                function (data) {
                    if (callback) callback(data);
                });
        };

        /**
         * works with @see ContributeDataHandler.getAllContent
         * @param {function(Array.<Content>)} callback
         */
        this.getAllContent = function (callback) {
            $.get('/getAllContent?filename=' + encodeURIComponent(_filename), function (data) {
                callback(data);
            });
        };

        //endregion
    }
})();