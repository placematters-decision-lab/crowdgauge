/**
 * User: kgoulding
 * Date: 4/10/12
 * Time: 10:27 PM
 */
(function () { // self-invoking function
    SAS.IntroPage = function () {
        var _self = this;

        //region private fields and methods
        var _$zipInput;
        var _$ageInput;
        var _$genderInput;
        var _$btnStart;

        var _cacheVersion = SAS.mainInstance.getCacheVersion();
        var _zipLookup = {};
        var _onStartClick = function () {};
        var _showDivs = function (show) {
            $("#intro").toggle(show);
            //$("#btnNext").
        };

        var _isValidZip = function (zip) {
            return /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zip);
        };

        var _checkZip = function () {
            var zip = $("#zipInput").val();
            var zipLocation = "";
            if (_zipLookup[zip]) {
                zipLocation = _zipLookup[zip][0].name;
            } else {
                if (_isValidZip(zip)) {
                    zipLocation = "Other Location";
                }
            }
            if (zipLocation != "") $('label[for="zipInput"]').removeClass("nonvalid");
            $("#zipLocation").html(zipLocation);
        };

        var _populateControls = function ($holder) {
            $holder.append('<div id="promptTxt"><p>First, please provide us with some basic details:</p></div>');
            var $zip = $('<div class="demoInput">').appendTo($holder);
            $zip.append('<label class="demoLabel" for="zipInput">Zip</label>');
            _$zipInput = $('<input id="zipInput" type="text" size="5">').appendTo($zip);

            var $age = $('<div class="demoInput">').appendTo($holder);
            $age.append('<label class="demoLabel" for="ageInput">Age</label>');
            _$ageInput = $('<select id="ageInput"></select>').appendTo($age);
            var ages = ["under 12", "12-18", "19-25", "26-35", "36-45", "46-55", "56-65", "66-75", "76+", "Prefer not to say"];
            SAS.controlUtilsInstance.populateSelectList(_$ageInput, "[Select Age Range]", ages);

            var $gender = $('<div class="demoInput">').appendTo($holder);
            $gender.append('<label class="demoLabel" for="genderInput">Gender</label>');
            _$genderInput = $('<select id="genderInput"></select>').appendTo($gender);
            var genders = ["Male", "Female", "Prefer not to say"];
            SAS.controlUtilsInstance.populateSelectList(_$genderInput, "[Select Gender]", genders);

            _$btnStart = $('<button data-localize="buttons.start">START</button>').appendTo($holder);
            _$btnStart.button();
        };

        var _getDemographics = function () {
            return {
                zip:_$zipInput.val(),
                age:_$ageInput.val(),
                gender:_$genderInput.val()
            };
        };

        var _validate = function () {
            //TEMP
            return true;
            var valid = true;
            var zip = _$zipInput.val();
            $('label').removeClass("nonvalid");
            if (!_isValidZip(zip)) {
                $('label[for="zipInput"]').addClass("nonvalid");
                valid = false;
            }
            $('.demoInput select').each(function () {
                if (SAS.controlUtilsInstance.isPrompt($(this).val())) {
                    $('label[for="'+$(this).attr("id")+'"]').addClass("nonvalid");
                    valid = false;
                }
            });
            var oktxt = "First, please provide us with some basic details:";
            var plsChange = "Please complete the <span class='nonvalid'>highlighted</span> items then try again.";
            $("#promptTxt").html("<p>" + (valid ? oktxt : plsChange) + "</p>");
            return valid;
        };

        var _initialize = function () {
            _populateControls($('#introFrm'));
            $('.demoInput select').change(function () {
                $('label[for="'+$(this).attr("id")+'"]').toggleClass("nonvalid", SAS.controlUtilsInstance.isPrompt($(this).val()));
            });
            _$btnStart.click(function () {
                if (_validate()) _onStartClick();
//                _onStartClick();
            });
        };
        //endregion

        //region public API

        this.showDivs = function (show) {
            _showDivs(show);
        };

        this.getDemographics = function () {
            return _getDemographics();
        };

        this.onStartClick = function (fn) {
            _onStartClick = fn;
        };
        //endregion

        _initialize();
    }
})();