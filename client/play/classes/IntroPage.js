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
        var _$incomeInput;
        var _$ethnicityInput;
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
            var zipCity = "";
            if (_zipLookup[zip]) {
                zipCity = _zipLookup[zip][0].name;
            } else {
                if (_isValidZip(zip)) {
                    zipCity = "Other City";
                }
            }
            if (zipCity != "") $('label[for="zipInput"]').removeClass("nonvalid");
            $("#zipCity").html(zipCity);
        };

        var _populateControls = function ($holder) {
            $holder.append('<div id="promptTxt"><p>First, please provide us with some basic details:</p></div>');
            var $zip = $('<div class="demoInput">').appendTo($holder);
            $zip.append('<label class="demoLabel" for="zipInput">Zip</label>');
            _$zipInput = $('<input id="zipInput" type="text" size="5">').appendTo($zip);

            var $age = $('<div class="demoInput">').appendTo($holder);
            $age.append('<label class="demoLabel" for="ageInput">Age</label>');
            _$ageInput = $('<select id="ageInput"></select>').appendTo($age);
            var ages = ["under 19", "19-24", "25-34", "35-44", "45-54", "55-64", "65-74", "75+", "Prefer not to say"];
            SAS.controlUtilsInstance.populateSelectList(_$ageInput, "[Select Age Range]", ages);

            var $income = $('<div class="demoInput">').appendTo($holder);
            $income.append('<label class="demoLabel" for="incomeInput">Household income</label>');
            _$incomeInput = $('<select id="incomeInput"></select>').appendTo($income);
            var incomes = ["Less than $24,999", "$25,000 – 49,999", "$50,000 – 74,999", "$75,000 – 99,999", "$100,000 – 124,999", "$125,000 – 149,999", "$150,000 – 199,999", "$200,000 or greater", "Prefer not to say"];
            SAS.controlUtilsInstance.populateSelectList(_$incomeInput, "[Select Household Income]", incomes);

            var $ethnicity = $('<div class="demoInput">').appendTo($holder);
            $ethnicity.append('<label class="demoLabel" for="ethnicityInput">Ethnicity</label>');
            _$ethnicityInput = $('<select id="ethnicityInput"></select>').appendTo($ethnicity);
            var ethnicities = ["African American/Black", "Asian", "Hispanic/Latino", "White/Caucasian","American Indian", "Two or More Races", "Other", "Prefer not to say"];
            SAS.controlUtilsInstance.populateSelectList(_$ethnicityInput, "[Select Ethnicity]", ethnicities);

            var $gender = $('<div class="demoInput">').appendTo($holder);
            $gender.append('<label class="demoLabel" for="genderInput">Gender</label>');
            _$genderInput = $('<select id="genderInput"></select>').appendTo($gender);
            var genders = ["Male", "Female", "Prefer not to say"];
            SAS.controlUtilsInstance.populateSelectList(_$genderInput, "[Select Gender]", genders);


            _$btnStart = $('<button class="btn-large btn-primary" data-localize="buttons.start">Start</button>').appendTo($holder);
            _$btnStart.button();
        };

        var _getDemographics = function () {
            return {
                zip:_$zipInput.val(),
                age:_$ageInput.val(),
                income:_$incomeInput.val(),
                ethnicity:_$ethnicityInput.val(),
                gender:_$genderInput.val()
            };
        };

        var _validate = function () {
            //TEMP
            //return true;
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