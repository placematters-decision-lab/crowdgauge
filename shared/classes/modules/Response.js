if (typeof(require) !== "undefined") var Enums = require('./Enums');

(function () { // self-invoking function
    /**
     * @class Response
     **/
    var Response = function () {
        var _self = this;

        //region public API
        this.ipAddress = "";
        this.dateCreated = null;
        /** @type {SAS.PriorityDef|SAS.MechanismDef|SAS.CellDef} */
        this.data = null;
        //endregion
    };
    if (typeof(module) !== "undefined") module.exports = Response;
})();

