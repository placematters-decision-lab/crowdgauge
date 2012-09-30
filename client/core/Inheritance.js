/**
 * User: kgoulding
 * Date: 4/10/12
 * Time: 5:41 PM
 */
SAS.Inheritance = {};
SAS.Inheritance.Extend = function(t, p) {
    //this over-simplified... look at http://www.gridlinked.info/oop-with-coffeescript-javascript/ to see how coffeeScript implements inheritance...
    //-- also see exports.inherits in https://github.com/joyent/node/blob/master/lib/util.js#L411
    //--for example, if you override a member (like you can in C#) - such as .getName(), there is no way to call base.getName()
    for(var f in p) {
        if (typeof(p[f]) === "function") {
            t[f] = p[f];
        }
    }
    return p;
};