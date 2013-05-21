//region node.js core
var url = require("url");
var https = require("https");
//endregion
//region npm modules

//endregion
//region modules

//endregion

/**
 * adopted from: https://github.com/jbuck/express-persona/blob/master/index.js
 @class PersonaServer
 */
var PersonaServer = function (persistentStore, options) {
    var _self = this;

    //region private fields and methods
    /** @type PersistentStore */
    var _persistentStore = persistentStore;
    var _verifierOpts;
    var _personaOpts;
    var _defaultOptions = {
        audience:"",
        verifierURI:"https://verifier.login.persona.org/verify",
        verifyResponse:function (error, req, res, email) {
            var out;
            if (error) {
                out = { status:"failure", reason:error };
            } else {
                out = { status:"okay", email:email };
            }
            _returnJsonObj(res, out);
        },
        logoutResponse:function (error, req, res) {
            var out;
            if (error) {
                out = { status:"failure", reason:error };
            } else {
                out = { status:"okay" };
            }
            _returnJsonObj(res, out);
        }
    };

    var _returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type":"application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    var _init = function () {
        options = options || {};

        _personaOpts = {};
        Object.keys(_defaultOptions).forEach(function (key) {
            if (typeof options[key] === typeof _defaultOptions[key]) {
                _personaOpts[key] = options[key];
            } else {
                _personaOpts[key] = _defaultOptions[key];
            }
        });

        // Use our own https agent that rejects bad SSL certs
        _verifierOpts = url.parse(_personaOpts.verifierURI);
        _verifierOpts.method = "POST";
        _verifierOpts.rejectUnauthorized = true;
        _verifierOpts.agent = new https.Agent(_verifierOpts);
    };

    var _getAuthStr = function () {
        var msSince2012 = new Date().getTime() - 1325376000000;
        return msSince2012 + "-" + Math.floor(Math.random() * 10000);
    };
    //endregion

    //region public API
    this.login = function (req, res, postData) {
        var vreq = https.request(_verifierOpts, function (verifierRes) {
            var body = "";

            verifierRes.on("error", function (error) {
                _personaOpts.verifyResponse("Server-side exception", req, res);
            });

            verifierRes.on("data", function (chunk) {
                body = body + chunk;
            });

            // Match the Persona Remote Verification API's return values
            // https://developer.mozilla.org/en-US/docs/Persona/Remote_Verification_API#Return_values
            verifierRes.on("end", function () {
                //try {
                    var response = JSON.parse(body),
                        valid = response && response.status === "okay";

                    if (valid) {
                        var authString = _getAuthStr();
                        var obj = {auth:authString, email:response.email};
                        _persistentStore.setCookie(res, obj);
                        _persistentStore.save(response.email, obj);
                        _personaOpts.verifyResponse(null, req, res, response.email);
                    } else {
                        _personaOpts.verifyResponse(response.reason, req, res);
                    }

//                } catch (e) {
//                    _personaOpts.verifyResponse("Server-side exception", req, res);
//                }
            });
        });
        // SSL validation can fail, which will be thrown here
        vreq.on("error", function (error) {
            _personaOpts.verifyResponse("Server-side exception", req, res);
        });
        vreq.setHeader("Content-Type", "application/json");
        var data = JSON.stringify({
            assertion:postData.assertion,
            audience:_personaOpts.audience
        });
        vreq.setHeader("Content-Length", data.length);
        vreq.end(data);
    };

    this.logout = function (req, res, postData) {
        var obj = {auth:null, email:null};
        _persistentStore.setCookie(res, obj);
        _persistentStore.save(res.email, obj);
        _personaOpts.logoutResponse(null, req, res);
    };
    //endregion

    _init();
};

module.exports.PersonaServer = PersonaServer;

