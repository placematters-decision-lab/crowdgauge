/**
 * User: kgoulding
 * Date: 12/30/11
 * Time: 11:17 PM
 */
(function () { // self-invoking function
    SAS.ControlUtils = function () {
        var PROMPT = "_PROMPT_";
        var _self = this;

        //--private fields and methods
        var _clearSelectList = function(selId) {
            $(selId).find('option').remove()
        };

        //--protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...

        //region public API
        /**
         * @param {String|Object} selId (the JQuery selector string or preselected JQuery object)
         */
        this.clearSelectList = function(selId) {
            _clearSelectList(selId);
        };

        this.isPrompt = function(val) {
            return val == PROMPT;
        };

        this.replacePrompt = function(val, rep) {
            if (val == PROMPT) return rep;
            return val;
        };

        /**
         * @param {String|Object} selId (the JQuery selector string or preselected JQuery object)
         * @param {String} promptStr
         * @param {Array} arr
         * @param {String} [selectedValue]
         */
        this.populateSelectList = function(selId, promptStr, arr, selectedValue) {
            var selJq = $(selId);
            _clearSelectList(selJq);
            if (promptStr != null) {
                selJq.append($("<option />").val(PROMPT).text(promptStr));
            }
            $.each(arr, function (i, value) {
                var optionJq = $("<option />").val(value).text(value).prop("selected", (selectedValue == value));
                selJq.append(optionJq);
            });
        };

        /**
         * @param {String|Object} selId (the JQuery selector string or preselected JQuery object)
         * @param {String} promptStr
         */
        this.updateSelectListPrompt = function (selId, promptStr) {
            var selJq = $(selId);
            selJq.find('option[value="'+PROMPT+'"]').text(promptStr);
        };

        /**
         * @param {String|Object} selId (the JQuery selector string or preselected JQuery object)
         * @param {Array} arr
         * @param {Function} valGetter (a function that takes an object and returns the value for the option element)
         * @param {Function} textGetter (a function that takes an object and returns the text for the option element)
         */
        this.populateSelectListFancy = function(selId, arr, valGetter, textGetter) {
            var selJq = $(selId);
            $.each(arr, function (i, propObj) {
                var val = valGetter(propObj);
                var text = textGetter(propObj);
                selJq.append($("<option />").val(val).text(text));
            });
        };

        /**
         * @param {String|Object} element (JQuery selector string or preselected JQuery object)
         * @param {String|Object} [parent] (optional JQuery selector string or preselected JQuery object)
         */
        this.fillRemainingHeight = function (selector, parent) {
            $(selector).each(function (i, elem) {
                var jqElem = $(elem);
                var jqParent;
                if (parent == null) {
                    jqParent = jqElem.offsetParent();
                } else {
                    jqParent = $(parent);
                }
                var pos = jqElem.position();
                var pHeight = jqParent.height();
                jqElem.height(pHeight - pos.top);
            });

        };

        this.jsonColorToCSS = function(jsonColor) {
            if (jsonColor == null || jsonColor == "") return "gray";
            if (jsonColor.indexOf(",") > 0) return "rgb(" + jsonColor + ")";
            return jsonColor;
        };

        this.getButtonText = function ($elem) {
            var $jqUIBtn = $("span.ui-button-text", $elem);//support jqueryUI style buttons with text within a span
            if ($jqUIBtn.length > 0) {
                return $jqUIBtn.text();
            } else {
                return $elem.html();
            }
        };

        this.setButtonText = function ($elem, v) {
            var $jqUIBtn = $("span.ui-button-text", $elem);//support jqueryUI style buttons with text within a span
            if ($jqUIBtn.length > 0) {
                $jqUIBtn.text(v);
            } else {
                $elem.html(v);
            }
        };
    };
    /**
     @type SAS.ControlUtils
     @const
     */
    SAS.controlUtilsInstance = new SAS.ControlUtils();
})();