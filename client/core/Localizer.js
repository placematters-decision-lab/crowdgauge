(function () { // self-invoking function
    var DEFAULT_LANG = "en";
    /**
     * @class SAS.Localizer
     **/
    SAS.Localizer = function () {
        var _self = this;

        //region private fields and methods
        var _activeLang = DEFAULT_LANG;
        var _langFileDir = 'lang';
        var _updaters = [];
        var _defaultValues = {};

        var _get = function (obj, lang) {
            if (typeof obj === 'undefined') {
                return '(missing)';
            }
            if (typeof obj === "string") {
                return obj;
            }
            lang = lang || _activeLang;
            if (obj[lang]) return obj[lang];
            if (obj[DEFAULT_LANG]) return DEFAULT_LANG + ":" + obj[DEFAULT_LANG];
            return "";
        };

        var _setText = function ($elem, v) {
            if ($elem.is('input')) {
                $elem.val(v);
            } else if ($elem.is('button')) {
                SAS.controlUtilsInstance.setButtonText($elem, v);
            } else {
                $elem.html(v);
            }
        };

        var _getText = function ($elem) {
            if ($elem.is('input')) {
                return $elem.val();
            } else if ($elem.is('button')) {
                return SAS.controlUtilsInstance.getButtonText($elem);
            } else {
                return $elem.html();
            }
        };

        var _updateLocalizableValues = function (values) {
            $('[data-localize]').each(function () {
                var tag = $(this).attr('data-localize');
                var parts = tag.split(".");//objects e.g. {buttons:{submit:''} are mapped to 'buttons.submit'
                var v = values;
                $.each(parts, function (i, prt) {
                    if (v[prt]) v = v[prt];
                });
                if (typeof v === 'string') {
                    _setText($(this), v);
                }
            });
        };

        var _storeLocalizableValues = function () {
            var values = {};
            $('[data-localize]').each(function () {//e.g. 'buttons.submit' needs to be mapped to {buttons:{submit:''}}
                var tag = $(this).attr('data-localize');
                var parts = tag.split(".");
                var v = values;
                for (var i = 0; i < parts.length; i++) {
                    var prt = parts[i];
                    if (i < parts.length - 1) {
                        if (!v[prt]) v[prt] = {};
                        v = v[prt];
                    } else {
                        v[prt] = _getText($(this));
                    }
                }
            });
            return values;
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

        /**
         * @param {Function|Object} obj either a function to run or an object with language strings e.g. {en:'Hello World!', es:'¡Hola Mundo!"}
         * @param {Function(string)|Object} fnj either a function that is passed the translated string or a jQuery object
         */
        this.live = function (obj, fnj) {
            if (typeof obj === 'function') {
                _updaters.push(obj);
                obj();
            } else {
                var fn;
                if (fnj instanceof jQuery) {//support setting .html on any jquery selector passed in
                    var $j = fnj;
                    fn = function (val) {
                        _setText($j, val);
                    };
                } else {
                    fn = fnj;
                }
                _updaters.push(function () {
                    fn(_get(obj));
                });
                fn(_get(obj));
            }
        };


        this.setActiveLang = function (lang) {
            if (lang != _activeLang && _activeLang == DEFAULT_LANG) {
                _defaultValues = _storeLocalizableValues();
            }
            _activeLang = lang;
            $.each(_updaters, function (i, fn) {
                fn();
            });
            if (_langFileDir) {
                if (_activeLang != DEFAULT_LANG) {
                    $.getJSON(_langFileDir + "/" + _activeLang + ".json", function (data) {
                        _updateLocalizableValues(data);
                    });
                } else {
                    _updateLocalizableValues(_defaultValues);
                }
            }

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