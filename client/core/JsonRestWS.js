/**
 * User: tadiraman
 * Date: 11/22/11
 * Time: 1:07 PM
 */
(function () { // self-invoking function
    /**
     * @param {String} baseUrl (not including the name of the svc, must end in '/')
     * @param {String} wsName (the name of the .svc (without the extension))
     * @param {Boolean} useProxy (whether or not to use a php proxy server to avoid cross domain issues)
     * @param {Boolean} doubleJson (some web services return JSON serialized strings as JSON (double JSON))
     * @param {Boolean} useSvc (set to false if you want to use non-svc web services)
     */
    SAS.JsonRestWS = function (baseUrl, wsName, useProxy, doubleJson, useSvc) {
        var _self = this;
        //--private fields and methods
        var _wsName = wsName;
        var _baseUrl = baseUrl;
        var _callComplete = function () {
        };
        var _useProxy = useProxy;
        var _doubleJson = doubleJson;
        var _useSvc = useSvc;
        var _proxyPath = location.protocol + "//" + document.location.hostname + "/php/morkel.php";

        var _callWebService = function (type, method, params, postData, callbackFn, errorFn) {
            if (SAS.debugInstance != null && SAS.debugInstance.webServicesDisabled()) {
                _callComplete();
                if (errorFn) {
                    errorFn();
                }
                return;
            }
            return $.ajax({
                type:type,
                url:_getUrl(type, method, params),
                data:_getPostDataStr(postData),
                dataType:'json',
                processData:false,
                success:function (msg) {
                    _callComplete();
                    if (callbackFn) {
                        var obj = (_useProxy) ? msg.contents : msg;
                        var pObj = obj;
                        if (_doubleJson) {
                            try {
                                pObj = JSON.parse(obj);
                            }
                            catch (ex) {
                                console.log("Error parsing JSON: " + obj);
                            }
                        }
                        callbackFn(pObj);

                    }
                },
                error:function (a, b, c) {
                    _callComplete();
                    if (a.statusText == "error") {
                        console.log("JsonRestWS ERROR: " + method + " : " + a.status);
                    }
                    if (errorFn) {
                        errorFn();
                    }
                }
            });
        };

        var _getUrl = function (type, method, params) {
            if (typeof(params) != "string") params = _convertParams(params);
            var url = _baseUrl + _wsName + ((_useSvc) ? ".svc/" : "/") + method + "?" + params;
            if (_useProxy) {
                return _proxyPath + "?type=" + type + "&url=" + encodeURIComponent(url);
            } else {
                return url;
            }
        };

        var _getPostDataStr = function (postData) {
            if (typeof(postData) == "string") return postData;
            return _convertParams(postData);
        };

        var _isArray = function(a) {
            return (a && a.constructor == Array);
        };

        var _convertParams = function (obj) {
            var ans = [];
            if (obj == null) return ans;
            $.each(obj, function(k, val) {
                if (_isArray(val)) {
                    ans.push(k + "=" + encodeURIComponent(val.join("|")));
                } else {
                    ans.push(k + "=" + encodeURIComponent(val));
                }
            });
            return ans.join("&");
        };
        //--protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...

        //region public API
        /**
         @param {Function} fn
         */
        this.setCallComplete = function (fn) {
            _callComplete = fn;
        };

        /**
         * Call the webservice using POST (WebInvoke must be used for .svcs)
         * @param {String} method
         * @param {String|Object} params (REST params either a single string or an object)
         * @param {String|Object} postData (will be available on server as 'form' variables)
         * @param {Function} callbackFn
         * @param {Function} errorFn
         */
        this.postWebService = function (method, params, postData, callbackFn, errorFn) {
            return _callWebService("POST", method, params, postData, callbackFn, errorFn);
        };

        /**
         * Call the webservice using GET (WebGet must be used for .svcs)
         * @param {String} method
         * @param {String|Object} params (REST params either a single string or an object)
         * @param {Function} callbackFn
         * @param {Function} errorFn
         */
        this.getWebService = function (method, params, callbackFn, errorFn) {
            return _callWebService("GET", method, params, null, callbackFn, errorFn);
        };


    }
})();
