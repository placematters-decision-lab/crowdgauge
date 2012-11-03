/**
 * User: KGoulding
 * Date: 10/23/12
 * Time: 11:34 AM
 */
(function () { // self-invoking function
    var COLR_LESS = '#fcffdd';
    var COLR_NEUTRAL = '#9DD60E';
    var COLR_MORE = '#297F05';
    /**
     * @class SAS.ActionsGrid
     * @extends SAS.AMechGrid
     * @constructor
     **/
    SAS.ActionsGrid = function ($holder, dataHandler) {
        var _self = this;
        /** @type SAS.AMechGrid */
        var _super = SAS.Inheritance.Extend(this, new SAS.AMechGrid());
        _super.p_init(dataHandler);

        //region private fields and methods
        var _$grid = $('<div></div>').appendTo($holder);
        var _dataHandler = dataHandler;

        var _actionIds = [];
        var _actionLookup = {};
        var _mechIds = [];
        var _mechLookup = {};
        /** @type {Object.<String, Content>} */
        var _contentLookup = {};
        var _cellLookup = {};

        var _buildGrid = function () {
            _$grid.html("");
            var $pRow = $("<div>").addClass("pHeaderRow").appendTo(_$grid);
            _super.p_addColHeader($pRow);
            $.each(_actionIds, function (i, aId) {
                var actionObj = _actionLookup[aId];
                /** @type Content */
                var content = actionObj.content;
                var $pcolHdr = $("<div>").addClass("pColumnHeader").appendTo($pRow);
                _super.p_addDeleteButton($pcolHdr).click(function () {
                    if (confirm("Are you sure you want to erase " + SAS.localizr.get(actionObj.data.title))) {
                        _dataHandler.deleteAction(aId, function () {
                            _super.p_callOnGridUpdateRequired();
                        });
                    }
                });
                _super.p_addEditButton($pcolHdr, content).click(function () {
                    _editAction(actionObj.data, function () {
                        _dataHandler.updateContent(content, true, function () {
                            _super.p_callOnGridUpdateRequired();
                        });
                    });
                });
                var $colTitle = $("<div>").addClass("pColTitle").appendTo($pcolHdr);
                var $titleTxt = $("<div>").appendTo($colTitle);
                $("<div>").html('(' + actionObj.data.value + ')').appendTo($colTitle);
                SAS.localizr.live(actionObj.data.getNickname(), function (val) {
                    $titleTxt.html(val);
                });
            });

            $.each(_mechIds, function (i, mId) {
                var mechObj = _mechLookup[mId];
                var $mRow = _super.p_addMechanism(mId, mechObj).appendTo(_$grid);
                $.each(_actionIds, function (i, aId) {
                    _cellLookup[mId + "_" + aId] = $("<div>").addClass("gCell").appendTo($mRow);
                });
            });
            _updateCells();
        };

        var _getTitle = function (mechObj, actionObj) {
            return SAS.localizr.get(mechObj.data.getNickname()) + " : " + SAS.localizr.get(actionObj.data.getNickname());
        };

        var _getColor = function (value) {
            if (value < 1) {
                return d3.interpolateRgb(COLR_LESS, COLR_NEUTRAL)(value);
            }
            var max = 1.5;
            if (value === max) return COLR_MORE;
            return d3.interpolateRgb(COLR_NEUTRAL, COLR_MORE)((value - 1) / (max - 1));
        };

        var _updateCells = function () {
            _$grid.width(4000);//--width will be set correctly at the end - this is to ensure layout does not wrap while building
            var $rtCell = null;
            $.each(_mechIds, function (i, mId) {
                var mechObj = _mechLookup[mId];

                $.each(_actionIds, function (i, aId) {
                    var actionObj = _actionLookup[aId];
                    /** @type Content */
                    var content = _contentLookup[mId + "_" + aId];
                    if (!content) return true;//continue
                    var $cell = _cellLookup[mId + "_" + aId];
                    $cell.html("");
                    var $btn = _super.p_addEditButton($cell, content);
                    SAS.localizr.live(function () {
                        $cell.attr('title', _getTitle(mechObj, actionObj));
                    });
                    $btn.appendTo($cell).click(function () {
                        _super.p_editContent(content, function () {
                            return new SAS.ActionCellContentDialog(content, _getTitle(mechObj, actionObj), _getColor);
                        }, function () {
                            //$btn.css({background:_bgColors[content.status]});
                            _dataHandler.updateContent(content, true, function () {
                                _super.p_callOnCellUpdateRequired();
                            });
                        });
                    });
                    var cellDef = new SAS.CellDef(content.data);//TODO figure out whether this needs to be a special CellDef or Actions and Priorities can share
                    if (!cellDef.isEmpty()) {
                        $cell.css({backgroundColor:_getColor(cellDef.value)});
                        var $conLen = $('<span>').addClass("contLenLbl").appendTo($cell);
                        SAS.localizr.live(function () {
                            $conLen.html(SAS.localizr.getLength(cellDef.description).toString());
                        });
                    }
                    $rtCell = $cell;
                });
            });
            if ($rtCell) {
                _$grid.width($rtCell.position().left + $rtCell.outerWidth());
            }
            _super.p_callOnUpdate();
        };

        var _editAction = function (/**SAS.ActionDef*/ a, fn) {
            var pFrm = new SAS.ActionDialog(a);
            pFrm.showDialog(fn);
        };
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.addNewAction = function () {
            var a = new SAS.ActionDef();
            _editAction(a, function () {
                _dataHandler.addAction(a, function () {
                    _super.p_callOnGridUpdateRequired();
                });
            });
        };

        this.setLockState = function (structureId, lock) {
            var $cell = _cellLookup[structureId.mechanism + "_" + structureId.action];
            _super.p_setLockState($cell, lock);
        };

        this.updateContent = function (mechIds, mechLookup, contentLookup, actionIds, actionLookup) {
            _mechIds = mechIds;
            _mechLookup = mechLookup;
            _contentLookup = contentLookup;
            _actionIds = actionIds;
            _actionLookup = actionLookup;
            _buildGrid();
        };

        this.updateCells = function (contentLookup) {
            _contentLookup = contentLookup;
            _updateCells();
        };

        this.showContent = function () {
            _updateCells();
        };
        //endregion
    }
})();