/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 12:14 PM
 */
(function () { // self-invoking function
    var bgColors = {};
    bgColors[Enums.STATUS_APPROVED] = "#c3f0f7";
    bgColors[Enums.STATUS_DRAFT] = "#ffe87a";
    bgColors[Enums.STATUS_NEW] = "#f9f9db";
    bgColors[Enums.STATUS_REVIEW] = "#ea93ea";
    /**
     * @class SAS.MatrixUI
     **/
    SAS.MatrixUI = function ($holder, socket) {
        var _self = this;

        //region private fields and methods
        var _$grid;

        var _dataHandler = new SAS.DataHandler("test1");

        var _addNewPriority = function () {
            var p = new SAS.PriorityDef();
            _editPriority(p, function () {
                _dataHandler.addPriority(p, function() {
                    _updateGrid();
                });
            });
        };
        var _addNewMechanism = function () {
            var m = new SAS.MechanismDef();
            _editMechanism(m, function () {
                _dataHandler.addMechanism(m, function() {
                    _updateGrid();
                });
            });
        };

        var _editMechanism = function (/**SAS.MechanismDef*/ m, fn) {
            var mFrm = new SAS.MechanismDialog(m);
            mFrm.showDialog(fn);
        };

        var _editPriority = function (/**SAS.PriorityDef*/ p, fn) {
            var pFrm = new SAS.PriorityDialog(p);
            pFrm.showDialog(fn);
        };

        var _editContent = function (/**Content*/ c, fn) {
            var cFrm = new SAS.CellContentDialog(c);
            cFrm.showDialog(fn);
        };

        var _getKeyForStructureId = function (/**Content*/content) {
            return content.structureId.mechanism + "_" + content.structureId.priority;
        };

        var _getAllContent = function () {
            _dataHandler.getAllContent(function (contentArr) {
                var editIcon = "pencil";
                var deleteIcon = "trash";

                var priorityIds = [];
                var priorityLookup = {};
                var mechIds = [];
                var mechLookup = {};
                /** @type {Object.<String, Content>} */
                var contentLookup = {};
                $.each(contentArr, function (i, /**Content*/content) {
                    contentLookup[_getKeyForStructureId(content)] = content;
                    switch (content.contentType) {
                        case Enums.CTYPE_PRIORITY:
                            content.data = new SAS.PriorityDef(content.data);//--replace the reference with a new 'wrapped' reference
                            priorityIds.push(content.structureId.priority);
                            priorityLookup[content.structureId.priority] = {content:content, data:content.data};
                            break;
                        case Enums.CTYPE_MECH:
                            content.data = new SAS.MechanismDef(content.data);
                            mechIds.push(content.structureId.mechanism);
                            mechLookup[content.structureId.mechanism] = {content:content, data:content.data};
                            break;
                    }
                });
                _$grid.html("");
                var $pRow = $("<div>").addClass("pHeaderRow").appendTo(_$grid);
                $.each(priorityIds, function (i, pId) {
                    var priorityObj = priorityLookup[pId];
                    var $pcolHdr = $("<div>").addClass("pColumnHeader").appendTo($pRow);
                    _makeUIBtn(20, deleteIcon).appendTo($pcolHdr).click(function () {
                        if (confirm("Are you sure you want to erase "+priorityObj.data.title)) {
                            _dataHandler.deletePriority(pId, function() {
                                _updateGrid();
                            });
                        }
                    });
                    _makeUIBtn(20, editIcon).appendTo($pcolHdr).click(function () {
                        _editPriority(priorityObj.data, function () {
                            _dataHandler.updateContent(priorityObj.content, function() {
                                _updateGrid();
                            });
                        });
                    });
                    $("<div>").addClass("pColTitle").html(priorityObj.data.getNickname()).appendTo($pcolHdr);
                });
                $.each(mechIds, function (i, mId) {
                    var mechObj = mechLookup[mId];
                    var $mRow = $("<div>").addClass("mRow").appendTo(_$grid);
                    var $pRowHeader = $("<div>").addClass("pRowHeader").appendTo($mRow);
                    _makeUIBtn(20, deleteIcon).appendTo($pRowHeader).click(function () {
                        if (confirm("Are you sure you want to erase "+mechObj.data.title)) {
                            _dataHandler.deleteMechanism(mId, function() {
                                _updateGrid();
                            });
                        }
                    });
                    _makeUIBtn(20, editIcon).appendTo($pRowHeader).click(function () {
                        _editMechanism(mechObj.data, function () {
                            _dataHandler.updateContent(mechObj.content, function() {
                                _updateGrid();
                            });
                        });
                    });
                    $("<div>").addClass("pRowTitle").html(mechLookup[mId].data.getNickname()).appendTo($pRowHeader);
                    $.each(priorityIds, function (i, pId) {
                        var $cell = $("<div>").addClass("gCell").appendTo($mRow);
                        var content = contentLookup[mId + "_" + pId];
                        if (!content) return true;//continue
                        if (content && content.status) {
                            $cell.css({backgroundColor:bgColors[content.status]});
                        }
                        _makeUIBtn(20, editIcon).appendTo($cell).click(function () {
                            _editContent(content, function() {
                                $cell.css({backgroundColor:bgColors[content.status]});
                                _dataHandler.updateContent(content);
                                _updateGrid();
                            });
                        });
                        if (content.data && content.data.length > 0) {
                            $('<span>').addClass("contLenLbl").html(content.data.length.toString()).appendTo($cell);
                        }
                    });
                });
            });
        };

        var _makeUIBtn = function (w, icon) {//pencil, close
            var $editBtn = $('<div class="ui-state-default ui-corner-all ui-state-hover inlineBtn"><span class="ui-icon ui-icon-'+icon+'"></span></div>');
            $editBtn.width(w);
            return $editBtn;
        };

        var _updateGrid = function () {
            //_getAllContent();
            socket.emit('broadcastUpdate', { });
        };

        var _buildUI = function () {
            var $addPBtn = $("<button>ADD P</button>").appendTo($holder);
            var $addMBtn = $("<button>ADD M</button>").appendTo($holder);

            _$grid = $("<div>").appendTo($holder);

            $addPBtn.click(function () {
                _addNewPriority();
            });
            $addMBtn.click(function () {
                _addNewMechanism();
            });

            _getAllContent();
        };
        //endregion

        //region protected fields and methods (use '_' to differentiate).
        //this._getFoo = function() { ...
        //endregion

        //region public API
        this.createUI = function () {
            _buildUI();
        };
        this.updateGrid = function () {
            _getAllContent();
        };
        //endregion
    }
})();