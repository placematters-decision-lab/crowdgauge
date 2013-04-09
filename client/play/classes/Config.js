/**
 * User: kgoulding
 * Date: 4/17/12
 * Time: 2:05 PM
 */
(function () { // self-invoking function
    SAS.Config = function () {
        var _self = this;

        //region private fields and methods
        var _isLocal = function () {
            return document.location.hostname == "localhost";
        };
        //endregion

        //region public API
        this.randomizeOrder = {priorities:true};//randomize the order of the priorities to alleviate question order bias.

        this.getRegionalScoresWS = function () {
            if (_isLocal()) {
                return new SAS.JsonRestWS("http://localhost:59159/svc/", "DataService.svc", false, true);
            } else {
                return new SAS.JsonRestWS("svc/regionalScoresService/", "DataService.svc", true, true);
            }
        };
        this.getUseProxy = function () {
            return !_isLocal();
        };

        this.getFileName = function () {
            return "NRV";
        };

        this.introText = function () {

        }
        //endregion
    };
    /**
     @type SAS.Config
     @const
     */
    SAS.configInstance = new SAS.Config();
    //SAS.configInstance.initialize();
})();