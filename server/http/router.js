var route = function(handle, pathname, request, response, postData) {
    var midPos = pathname.indexOf("/", 1);
    var action = (midPos >= 0) ? pathname.substr(0, midPos) : pathname;
    //console.log("About to route a request for " + pathname+ " : "+action);
    if (typeof handle[action] === 'function') {
        handle[action](request, response, postData);
        return true;
    } else {
        return false;
    }
};

exports.route = route;
