/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 3:36 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.ActionCellContentDialog
     * @extends SAS.ADialog
     * @constructor
     **/
    SAS.ActionCellContentDialog = function (/**Content*/ content, title, colorGetter) {
        var _self = this;
        /** @type SAS.ADialog */
        var _super = SAS.Inheritance.Extend(this, new SAS.ADialog());
        var DIALOG_ID = "actioncellcontent_dialog";
        _super._init(DIALOG_ID);

        var _multiplierVals = [ 0, 0.1, 0.25, 0.5, 0.75, 0.8, 0.9, 1, 1.1, 1.2, 1.25, 1.5 ];

        //region private fields and methods
        /** @type Content */
        var _content = content;
        /** @type SAS.CellDef */
        var _cellDef = new SAS.CellDef(_content.data);
        var _title = title;
        var _colorGetter = colorGetter;
        var _hasChanges = false;

        var _$description;
        var _$statusSelection;
        var _$multiplierSlider;
        var _$sliderLbl;

        var _buildContent = function ($dlg) {
            var $inputsDiv = $('<div></div>').appendTo($dlg);
            var status = _content.status || Enums.STATUS_DRAFT;
            if (status == Enums.STATUS_NEW) status = Enums.STATUS_DRAFT;//always default to 'draft' status
            var statusOpts = [Enums.STATUS_NEW, Enums.STATUS_DRAFT, Enums.STATUS_REVIEW, Enums.STATUS_APPROVED];

            $('<label for="status_sel">Status:</label>').addClass("dialogLabel").appendTo($inputsDiv);
            _$statusSelection = $('<select id="status_sel"></select>').appendTo($inputsDiv);
            SAS.controlUtilsInstance.populateSelectList(_$statusSelection, null, statusOpts, status);

            $('<div>Multiplier (the extent to which this action achieves the mechanisms effect on the priorities):</div>').appendTo($inputsDiv);

            _$multiplierSlider = $('<div></div>').css({display:'inline-block'}).width(150).appendTo($inputsDiv);
            _$sliderLbl = $('<div></div>').addClass("controlLabel").css({display:'inline-block', marginLeft:10}).appendTo($inputsDiv);
            _$multiplierSlider.slider({
                min:0,
                range:"min",
                max:_multiplierVals.length - 1,
                step:1,
                value:_multiplierToSlider(_cellDef.value),
                slide:function (event, ui) {
                    _updateSlider(_sliderToMultiplier(ui.value));
                }
            });
            _$multiplierSlider.find('.ui-slider-range').addClass('ui-corner-all');//for ranges that start at the minimum we need to apply rounded corners (theme-based) otherwise it overlaps and looks ugly.
            _updateSlider(_cellDef.value);

            var $descDiv = $('<div>').appendTo($inputsDiv);
            $('<label for="description_txt">Description:</label>').addClass("dialogLabel").appendTo($descDiv);
            _$description = $('<textarea id="description_txt"></textarea>').val(SAS.localizr.get(_cellDef.description)).appendTo($('<div>').appendTo($descDiv));
            //_$description.wysiwyg();
        };

        var _updateSlider = function (mult) {
            if (mult == 1) {
                _$sliderLbl.html("1x (no multiplier)");
            } else {
                _$sliderLbl.html(mult + "x the effect of the score");
            }
            if (_colorGetter) _$multiplierSlider.find('.ui-slider-range, .ui-slider-handle').css({background:_colorGetter(mult)});
        };

        var _multiplierToSlider = function (val) {
            return _multiplierVals.indexOf(val);
        };

        var _sliderToMultiplier = function (val) {
            return _multiplierVals[val];
        };

        var _applyChanges = function () {
            _cellDef.value = _sliderToMultiplier(_$multiplierSlider.slider('value'));
            SAS.localizr.set(_cellDef, {description:_$description.val()});
            _content.data = _cellDef;
            _content.status = (_cellDef.isEmpty()) ? Enums.STATUS_NEW : _$statusSelection.val();
            _hasChanges = true;
        };

        var _showDialog = function (onAccept, onCancel) {
            var $dlg = _super._prepareToShowDialog();
            _buildContent($dlg);
            var buttons = { "Cancel":function () {
                _super._closeDialog();
                if (onCancel) onCancel();
            }, "OK":function () {
                _applyChanges();
                onAccept();
                _super._closeDialog();
            }};
            _super._dialog(_title, {modal:true, buttons:buttons, width:700, defaultButtonNum:1 });
        };
        //endregion

        //region public API
        this.hasChanges = function () {
            return _hasChanges;
        };

        /**
         * @param {Function} [onAccept] callback to run if user accepts changes
         * @param {Function} [onCancel] callback to run if user cancels
         */
        this.showDialog = function (onAccept, onCancel) {
            _showDialog(onAccept, onCancel);
        };
        //endregion
    }
})();