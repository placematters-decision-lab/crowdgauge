/**
 * User: KGoulding
 * Date: 9/19/12
 * Time: 9:26 AM
 */

if (typeof(require) !== "undefined") var Enums = require('./Enums');

(function () { // self-invoking function
    /**
     * @class Content
     **/
    var Content = function () {
        var _self = this;

        //region private fields and methods
        //var foo = ...
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.lock = Enums.LOCK_NONE;
        this.status = Enums.STATUS_NEW;
        this.filename = "";
        this.contentType = Enums.CTYPE_CELL;
        /** @type {{mechanism:String, priority:String}} */
        this.structureId = {};
        /** @type {SAS.PriorityDef|SAS.MechanismDef|SAS.CellDef} */
        this.data = null;
        //endregion
    };
    if (typeof(module) !== "undefined") module.exports = Content;
})();

