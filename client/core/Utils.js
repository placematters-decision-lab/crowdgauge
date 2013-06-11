/**
 * User: kgoulding
 * Date: 5/31/13
 * Time: 5:24 PM
 */
if (typeof(SAS) === 'undefined') SAS = {};
(function () { // self-invoking function
    /**
     * @class SAS.Utils
     **/
    SAS.Utils = function () {
        var _self = this;

        //region private fields and methods
        //var foo = ...
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.gup = function (name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.href);
            if (results == null) return null;
            return results[1];
        };

        this.addBookmarkMe = function (jqSel) {
            $(jqSel).click(function() {
                if (window.sidebar) { // Mozilla Firefox Bookmark
                    window.sidebar.addPanel(location.href,document.title,"");
                } else if( /*@cc_on!@*/false) { // IE Favorite
                    window.external.AddFavorite(location.href,document.title);
                } else if(window.opera && window.print) { // Opera Hotlist
                    this.title=document.title;
                    return true;
                } else { // webkit - safari/chrome
                    alert('Press ' + (SAS.tipsyInstance.detectiPad() ? 'the Action button at the top of the screen' : 'CTRL D') + ' to bookmark this page.');
                }
            });
        };
        //endregion
    };
    /**
     @type SAS.Utils
     @const
     */
    SAS.utilsInstance = new SAS.Utils();
})();