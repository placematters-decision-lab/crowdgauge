/**
 * User: KGoulding
 * Date: 10/23/12
 * Time: 11:34 AM
 */
(function () { // self-invoking function
    var ICN_PREVIEW_COLOR = 'rgb(120,120,120)';

    var _scoreColors = {//todo move to config
        'N/A':'#EEEEEE',
        '-2':'#EC7623',
        '-1':'#FBC917',
        '0':'#EAD9C4',
        '+1':'#CAE8DE',
        '+2':'#2BBEC5'
    };
    /**
     * @class SAS.PriorityGrid
     * @extends SAS.AMechGrid
     * @constructor
     **/
    SAS.PriorityGrid = function ($holder, dataHandler) {
        var _self = this;
        /** @type SAS.AMechGrid */
        var _super = SAS.Inheritance.Extend(this, new SAS.AMechGrid());
        _super.p_init(dataHandler);

        //region private fields and methods
        var _$grid = $('<div></div>').appendTo($holder);
        var _dataHandler = dataHandler;
        var _priorityIds = [];
        var _priorityLookup = {};
        var _mechIds = [];
        var _mechLookup = {};
        /** @type {Object.<String, Content>} */
        var _contentLookup = {};
        var _cellLookup = {};

        var _editPriority = function (/**SAS.PriorityDef*/ p, fn) {
            var pFrm = new SAS.PriorityDialog(p);
            pFrm.showDialog(fn);
        };

        var _buildGrid = function () {
            _$grid.html("");
            var $pRow = $("<div>").addClass("pHeaderRow").appendTo(_$grid);
            _super.p_addColHeader($pRow);
            $.each(_priorityIds, function (i, pId) {
                var priorityObj = _priorityLookup[pId];
                /** @type Content */
                var content = priorityObj.content;
                var $pcolHdr = $("<div>").addClass("pColumnHeader").appendTo($pRow);
                _super.p_addDeleteButton($pcolHdr).click(function () {
                    if (confirm("Are you sure you want to erase " + SAS.localizr.get(priorityObj.data.title))) {
                        _dataHandler.deletePriority(pId, function () {
                            _super.p_callOnGridUpdateRequired();
                        });
                    }
                });
                _super.p_addEditButton($pcolHdr, content).click(function () {
                    _editPriority(priorityObj.data, function () {
                        _dataHandler.updateContent(content, true, function () {
                            _super.p_callOnGridUpdateRequired();
                        });
                    });
                });
                var $colTitle = $("<div>").addClass("pColTitle").appendTo($pcolHdr);
                SAS.localizr.live(priorityObj.data.getNickname(), $colTitle);

                var $pIcon = $("<div>").addClass("pColIcon").appendTo($pcolHdr);
                $.getJSON('/listfiles/' + pId, function (data) {
                    $.each(data, function (index, file) {
                        $('<img src="' + file.thumbnail_url + '?color=' + ICN_PREVIEW_COLOR + '"}">').addClass("pColIconImg").appendTo($pIcon);
                    });
                });
            });

            $.each(_mechIds, function (i, mId) {
                var mechObj = _mechLookup[mId];
                var $mRow = _super.p_addMechanism(mId, mechObj).appendTo(_$grid);
                $.each(_priorityIds, function (i, pId) {
                    _cellLookup[mId + "_" + pId] = $("<div>").addClass("gCell").appendTo($mRow);
                });
            });
            _updateCells();
        };

        var _showMessage = function (title, msg, buttons) {
            $('#message_dialog').remove();
            var $dlg = $('<div id="message_dialog"></div>').appendTo("body");
            $dlg.html(msg);
            $dlg.dialog({title:title, buttons:buttons});
        };

        var _getTitle = function (mechObj, priorityObj) {
            return SAS.localizr.get(mechObj.data.getNickname()) + " : " + SAS.localizr.get(priorityObj.data.getNickname());
        };

        var _updateCells = function () {
            _$grid.width(4000);//--width will be set correctly at the end - this is to ensure layout does not wrap while building
            var $rtCell = null;
            var scoreOpts = $.map(_scoreColors, function(value, key) { return key; });
            $.each(_mechIds, function (i, mId) {
                var mechObj = _mechLookup[mId];

                $.each(_priorityIds, function (i, pId) {
                    var priorityObj = _priorityLookup[pId];
                    /** @type Content */
                    var content = _contentLookup[mId + "_" + pId];
                    if (!content) return true;//continue
                    var $cell = _cellLookup[mId + "_" + pId];
                    $cell.html("");
                    var $btn = _super.p_addEditButton($cell, content);
                    SAS.localizr.live(function () {
                        $cell.attr('title', _getTitle(mechObj, priorityObj));
                    });
                    $btn.appendTo($cell).click(function () {
                        _super.p_editContent(content, function() {
                            return new SAS.CellContentDialog(content, _getTitle(mechObj, priorityObj), scoreOpts);
                        }, function () {
                            //$btn.css({background:_bgColors[content.status]});
                            _dataHandler.updateContent(content, true, function () {
                                _super.p_callOnCellUpdateRequired();
                            });
                        });
                    });
                    var cellDef = new SAS.CellDef(content.data);
                    if (!cellDef.isEmpty()) {
                        $cell.css({backgroundColor:_scoreColors[cellDef.score]});
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
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.addNewPriority = function () {
            var p = new SAS.PriorityDef();
            _editPriority(p, function () {
                _dataHandler.addPriority(p, function () {
                    _super.p_callOnGridUpdateRequired();
                });
            });
        };

        this.setLockState = function (structureId, lock) {
            var $cell = _cellLookup[structureId.mechanism + "_" + structureId.priority];
            _super.p_setLockState($cell, lock);
        };

        this.updateContent = function (mechIds, mechLookup, contentLookup, priorityIds, priorityLookup) {
            _mechIds = mechIds;
            _mechLookup = mechLookup;
            _contentLookup = contentLookup;
            _priorityIds = priorityIds;
            _priorityLookup = priorityLookup;
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