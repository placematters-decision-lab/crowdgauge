(function () { // self-invoking function
    var DEFAULT_LANG = "en";
    /**
     * @class SAS.Localizer
     **/
    SAS.Localizer = function () {
        var _self = this;

        //region private fields and methods
        var _activeLang = DEFAULT_LANG;
        var _updaters = [];

        var _get = function (obj, lang) {
            if (typeof obj === "string") {
                return obj;
            }
            lang = lang || _activeLang;
            if (obj[lang]) return obj[lang];
            if (obj[DEFAULT_LANG]) return DEFAULT_LANG + ":" + obj[DEFAULT_LANG];
            return "";
        };
        //endregion

        //region public API
        this.set = function (obj, props, lang) {
            lang = lang || _activeLang;
            $.each(props, function (k, value) {
                if (!obj[k]) {
                    obj[k] = {};
                }
                obj[k][lang] = value;
            });
        };

        this.get = function (obj, lang) {
            return _get(obj, lang);
        };

        this.getLength = function (obj, lang) {
            lang = lang || _activeLang;
            var str = obj[lang];
            if (str) return str.length;
            return 0;
        };

        this.getProp = function (obj, prop, lang) {
            lang = lang || _activeLang;
            if (!obj[prop]) return null;
            return obj[prop][lang];
        };

        this.live = function (obj, fn) {
            if (typeof obj === 'function') {
                fn = obj;
                _updaters.push(fn);
                fn();
            } else {
                _updaters.push(function () {
                    fn(_get(obj));
                });
                fn(_get(obj));
            }
        };

        this.setActiveLang = function (lang) {
            _activeLang = lang;
            $.each(_updaters, function (i, fn) {
                fn();
            });
        };
        //endregion
    };
    /**
     @type SAS.Localizer
     @const
     */
    SAS.localizr = new SAS.Localizer();
    //SAS.localizr.initialize();

})();