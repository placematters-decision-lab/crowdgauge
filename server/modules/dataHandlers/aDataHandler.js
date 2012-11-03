//region includes

//endregion

//region includes
//constants
/**
 @class ADataHandler
 */
ADataHandler = function (db) {
    var _self = this;

    this.p_db = db;

    this.p_addOrUpdate = function (doc, docId, callback) {
        var db = _self.p_db;
        if (docId) {
            db.head(docId, function (err, _, headers) {
                if (err) {
                    //probably a 404 in which case we don't need a 'revision'
                } else {
                    doc._rev = JSON.parse(headers.etag);
                }
                db.insert(doc, docId, function (err, res) {
                    if (err) console.log("ERROR: problem adding doc: " + err.description);
                    if (callback) callback();
                });
            });
        } else {
            db.insert(doc, {}, function (err, res) {
                if (err) console.log("ERROR: problem adding doc: " + err.description);
                if (callback) callback();
            });
        }
    };

    this.p_createViews = function (views) {
        this.p_addOrUpdate(views, '_design/views');
    };

    this.p_returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type":"application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    this.p_returnBasicSuccess = function (res) {
        _self.p_returnJsonObj(res, "OK");
    };
};

exports.ADataHandler = ADataHandler;



