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
        var _$zipCity;
        var _$ageInput;
        var _$genderInput;
        var _$relationshipInput;
        var _$ethnicityInput;
        var _$btnStart;

        var _fileAndVersion = function () {
//            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName()) + '&v=' + SAS.mainInstance.getCacheVersion();
            return '?filename=' + encodeURIComponent(SAS.configInstance.getFileName());
        };

        var _instructions = SAS.instructionsInstance;
        var _cacheVersion = SAS.mainInstance.getCacheVersion();
        var _zipLookup = {};
        var _onStartClick = function () {};
        var _showDivs = function (show) {
            $("#intro").toggle(show);
            $("#introImage").toggle(show);
            //$("#btnNext").
        };

        var _isValidZip = function (zip) {
            return /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zip);
        };

        var _checkZip = function () {
            var zip = $("#zipInput").val();
            var zipCity = "";
            if (_zipLookup[zip]) {
                zipCity = _zipLookup[zip];
            } else {
                if (_isValidZip(zip)) {
                    zipCity = "Other County";
                }
            }
            if (zipCity != "") $('label[for="zipInput"]').removeClass("nonvalid");
            $("#zipCity").html(zipCity);
        };

        var _populateControls = function ($holder) {
            $holder.append('<div id="promptTxt">First, please provide us with some basic details:</div>');
            var $why = $('<div class="promptTxtS"><p><a href=#>Why are we asking?</a></p></div>').click(function () {
                _instructions.showWhy();
            });
            $holder.append($why);
            var $zip = $('<div class="demoInput">').appendTo($holder);
            $zip.append('<label class="demoLabel" for="zipInput">Zip</label>');
            _$zipInput = $('<input id="zipInput" type="text" size="5">').appendTo($zip);
            _$zipCity = $('<label id="zipCity">').appendTo($zip);

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

            var $ethnicity = $('<div class="demoInput">').appendTo($holder);
            $ethnicity.append('<label class="demoLabel" for="ethnicityInput">Ethnicity</label>');
            _$ethnicityInput = $('<select id="ethnicityInput"></select>').appendTo($ethnicity);
            var ethnicitys = ["White", "Black or African American", "Asian or Pacific Islander", "American Indian and Alaska Native", "Other", "Two or more races", "Prefer not to say"];
            SAS.controlUtilsInstance.populateSelectList(_$ethnicityInput, "[Select Ethnicity]", ethnicitys);

            var $relationship = $('<div class="demoInput">').appendTo($holder);
            $relationship.append('<label class="demoLabel" for="relationshipInput">Relationship to Northeast Ohio</label>');
            _$relationshipInput = $('<select id="relationshipInput"></select>').appendTo($relationship);
            var relationships = ["Born and/or raised here", "Moved here from somewhere else", "From here, but moved away", "None of the above, but I'm interested in the region!"];
            SAS.controlUtilsInstance.populateSelectList(_$relationshipInput, "[Select Relationship to Northeast Ohio]", relationships);

            _$btnStart = $('<button class="start_button" data-localize="buttons.start">START</button>').appendTo($holder);
            _$btnStart.button();
        };

        var _getDemographics = function () {
            return {
                zip:_$zipInput.val(),
                age:_$ageInput.val(),
                gender:_$genderInput.val(),
                relationship:_$relationshipInput.val(),
                ethnicity:_$ethnicityInput.val()
            };
        };

        var _validate = function () {
            if (document.location.hostname == "localhost" || document.location.hostname == "127.0.0.1") return true;
            var valid = true;
            var zip = _$zipInput.val();
            $('label').removeClass("nonvalid");
            if (!_isValidZip(zip)) {
                $('label[for="zipInput"]').addClass("nonvalid");
                valid = false;
            }
//            _checkZip();
            $('.demoInput select').each(function () {
                if (SAS.controlUtilsInstance.isPrompt($(this).val())) {
                    $('label[for="'+$(this).attr("id")+'"]').addClass("nonvalid");
                    valid = false;
                }
            });
            var oktxt = "First, please provide us with some basic details:";
            var plsChange = "Please complete the <span class='nonvalid'>highlighted</span> items then try again.";
            $("#promptTxt").html((valid ? oktxt : plsChange));
            return valid;
        };

        var _initialize = function () {
            _populateControls($('#introFrm'));
            $('.demoInput select').change(function () {
                $('label[for="'+$(this).attr("id")+'"]').toggleClass("nonvalid", SAS.controlUtilsInstance.isPrompt($(this).val()));
            });
           _$zipInput.change(function () {
               _checkZip();
            });
            _$btnStart.click(function () {
                if (_validate()) _onStartClick();
            });

            $(".tabTitle").click(function () {
                _validate();
            });

            d3.json('/getLocations' + _fileAndVersion(), function (data) {
                _locations = data; // array
                $.each(_locations, function (i, location) {
                    $.each(location.data.zips, function (i, zip) {
                        _zipLookup[zip] = location.data.name;
                    });
                });
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