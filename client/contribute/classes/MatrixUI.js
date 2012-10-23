/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 12:14 PM
 */
(function () { // self-invoking function
    var UPDATE_TYP_UI = 'uiUpdate';
    var UPDATE_TYP_CELLS = 'cellUpdate';

    var ICON_EDIT = "pencil";
    var ICON_DELETE = "trash";
    var ICON_LOCK = "locked";

    var _bgColors = {};
    _bgColors[Enums.STATUS_APPROVED] = "#c3f0f7";
    _bgColors[Enums.STATUS_DRAFT] = "#ffe87a";
    _bgColors[Enums.STATUS_NEW] = "#f9f9db";
    _bgColors[Enums.STATUS_REVIEW] = "#ea93ea";

    var _scoreColors = {};//todo move to config
    _scoreColors['N/A'] = '#EEEEEE';
    _scoreColors['-2'] = '#EC7623';
    _scoreColors['-1'] = '#FBC917';
    _scoreColors['0'] = '#EAD9C4';
    _scoreColors['+1'] = '#CAE8DE';
    _scoreColors['+2'] = '#2BBEC5';

    var _getUID = function () {//TEMP
        var msSince2012 = new Date().getTime() - 1325376000000;
        return msSince2012 + "-" + Math.floor(Math.random() * 10000);
    };

    /**
     * @class SAS.MatrixUI
     **/
    SAS.MatrixUI = function ($holder, socket) {
        var _self = this;

        //region private fields and methods
        var userId = "u_" + _getUID();//TODO replace with auth

        var _$grid;
        var _priorityIds = [];
        var _priorityLookup = {};
        var _mechIds = [];
        var _mechLookup = {};
        /** @type {Object.<String, Content>} */
        var _contentLookup = {};
        var _cellLookup = {};

        var _dataHandler = new SAS.DataHandler("test1");

        var _addNewPriority = function () {
            var p = new SAS.PriorityDef();
            _editPriority(p, function () {
                _dataHandler.addPriority(p, function () {
                    _callUpdateGrid();
                });
            });
        };
        var _addNewMechanism = function () {
            var m = new SAS.MechanismDef();
            _editMechanism(m, function () {
                _dataHandler.addMechanism(m, function () {
                    _callUpdateGrid();
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

        var _editContent = function (/**Content*/ c, title, fn) {
            _dataHandler.takeLock(userId, false, c, function () {
                var cFrm = new SAS.CellContentDialog(c, title);
                cFrm.onClose(function (manual, dialog) {
                    if (cFrm.hasChanges()) return;//lock should only be released on cancel (otherwise it will happen after save is complete)
                    _dataHandler.releaseLock(userId, c);
                });
                cFrm.showDialog(fn);
            }, function () {
                _showMessage('Content is locked', 'Content is currently locked by another user! If you\'re certain nobody is actively editing this content, you can choose to steal the lock.', {
                    "Close":function () {
                        $(this).dialog("close");
                    },
                    "Steal Lock":function () {
                        _dataHandler.takeLock(userId, true, c);
                        $(this).dialog("close");
                    }
                });
            });
        };

        var _showMessage = function (title, msg, buttons) {
            $('#message_dialog').remove();
            var $dlg = $('<div id="message_dialog"></div>').appendTo("body");
            $dlg.html(msg);
            $dlg.dialog({title:title, buttons:buttons});
        };

        var _getKeyForStructureId = function (/**Content*/content) {
            return content.structureId.mechanism + "_" + content.structureId.priority;
        };

        var _getAllContent = function () {
            _dataHandler.getAllContent(function (contentArr) {
                _priorityIds = [];
                _priorityLookup = {};
                _mechIds = [];
                _mechLookup = {};
                _contentLookup = {};
                $.each(contentArr, function (i, /**Content*/content) {
                    _contentLookup[_getKeyForStructureId(content)] = content;
                    switch (content.contentType) {
                        case Enums.CTYPE_PRIORITY:
                            content.data = new SAS.PriorityDef(content.data);//--replace the reference with a new 'wrapped' reference
                            _priorityIds.push(content.structureId.priority);
                            _priorityLookup[content.structureId.priority] = {content:content, data:content.data};
                            break;
                        case Enums.CTYPE_MECH:
                            content.data = new SAS.MechanismDef(content.data);
                            _mechIds.push(content.structureId.mechanism);
                            _mechLookup[content.structureId.mechanism] = {content:content, data:content.data};
                            break;
                    }
                });
                _$grid.html("");
                var $pRow = $("<div>").addClass("pHeaderRow").appendTo(_$grid);
                $.each(_priorityIds, function (i, pId) {
                    var priorityObj = _priorityLookup[pId];
                    /** @type Content */
                    var content = priorityObj.content;
                    var $pcolHdr = $("<div>").addClass("pColumnHeader").appendTo($pRow);
                    _makeUIBtn(20, ICON_DELETE).appendTo($pcolHdr).click(function () {
                        if (confirm("Are you sure you want to erase " + SAS.localizr.get(priorityObj.data.title))) {
                            _dataHandler.deletePriority(pId, function () {
                                _callUpdateGrid();
                            });
                        }
                    });
                    var editIcn = (content.lock == Enums.LOCK_NONE) ? ICON_EDIT : ICON_LOCK;
                    _makeUIBtn(20, editIcn).appendTo($pcolHdr).click(function () {
                        _editPriority(priorityObj.data, function () {
                            _dataHandler.updateContent(content, true, function () {
                                _callUpdateGrid();
                            });
                        });
                    });
                    $("<div>").addClass("pColTitle").html(SAS.localizr.get(priorityObj.data.getNickname())).appendTo($pcolHdr);
                    var $pIcon = $("<div>").addClass("pColIcon").appendTo($pcolHdr);
                    $.getJSON('/listfiles/' + pId, function (data) {
                        $.each(data, function (index, file) {
                            $('<img src="' + file.thumbnail_url + '?color=gainsboro"}">').addClass("pColIconImg").appendTo($pIcon);
                        });
                    });
                });
                $.each(_mechIds, function (i, mId) {
                    var mechObj = _mechLookup[mId];
                    /** @type Content */
                    var content = mechObj.content;
                    var $mRow = $("<div>").addClass("mRow").appendTo(_$grid);
                    var $pRowHeader = $("<div>").addClass("pRowHeader").appendTo($mRow);
                    _makeUIBtn(20, ICON_DELETE).appendTo($pRowHeader).click(function () {
                        if (confirm("Are you sure you want to erase " + SAS.localizr.get(mechObj.data.title))) {
                            _dataHandler.deleteMechanism(mId, function () {
                                _callUpdateGrid();
                            });
                        }
                    });
                    var editIcn = (content.lock == Enums.LOCK_NONE) ? ICON_EDIT : ICON_LOCK;
                    _makeUIBtn(20, ICON_EDIT).appendTo($pRowHeader).click(function () {
                        _editMechanism(mechObj.data, function () {
                            _dataHandler.updateContent(content, true, function () {
                                _callUpdateGrid();
                            });
                        });
                    });
                    $("<div>").addClass("pRowTitle").html(SAS.localizr.get(_mechLookup[mId].data.getNickname())).appendTo($pRowHeader);
                    $.each(_priorityIds, function (i, pId) {
                        _cellLookup[mId + "_" + pId] = $("<div>").addClass("gCell").appendTo($mRow);
                    });
                });
                _updateCells();
            });
        };

        var _updateCells = function () {
            $.each(_mechIds, function (i, mId) {
                var mechObj = _mechLookup[mId];
                $.each(_priorityIds, function (i, pId) {
                    var priorityObj = _priorityLookup[pId];
                    /** @type Content */
                    var content = _contentLookup[mId + "_" + pId];
                    if (!content) return true;//continue
                    var $cell = _cellLookup[mId + "_" + pId];
                    $cell.html("");
                    var editIcn = (content.lock == Enums.LOCK_NONE) ? ICON_EDIT : ICON_LOCK;
                    var $btn = _makeUIBtn(20, editIcn);
                    if (content && content.status) {
                        $btn.css({background:_bgColors[content.status]});
                    }
                    var title = SAS.localizr.get(mechObj.data.getNickname()) + " : " + SAS.localizr.get(priorityObj.data.getNickname());
                    $btn.appendTo($cell).click(function () {
                        _editContent(content, title, function () {
                            //$btn.css({background:_bgColors[content.status]});
                            _dataHandler.updateContent(content, true, function () {
                                _callUpdateCells();
                            });
                        });
                    });
                    var cellDef = new SAS.CellDef(content.data);
                    if (!cellDef.isEmpty()) {
                        $cell.css({backgroundColor:_scoreColors[cellDef.score]});
                        $('<span>').addClass("contLenLbl").html(SAS.localizr.getLength(cellDef.description).toString()).appendTo($cell);
                    }
                });
            });
        };

        var _makeUIBtn = function (w, icon) {
            var $editBtn = $('<div class="ui-state-default ui-corner-all ui-state-hover inlineBtn"></div>');
            var $btnIcon = $('<span class="ui-icon ui-icon-' + icon + '"></span>').appendTo($editBtn);
            $editBtn.width(w);
            return $editBtn;
        };

        var _lockStateChanged = function (data) {
            var lock = data.lock;
            var structureId = data.structureId;
            var $cell = _cellLookup[structureId.mechanism + "_" + structureId.priority];
            if (!$cell) return;
            var editIcn = (lock == Enums.LOCK_NONE) ? ICON_EDIT : ICON_LOCK;
            $cell.find('.ui-icon').removeClass().addClass('ui-icon ui-icon-' + editIcn)
        };

        var _updateGrid = function (data) {
            switch (data.type) {
                case UPDATE_TYP_UI:
                    _getAllContent();
                    break;
                case UPDATE_TYP_CELLS:
                    //TODO add a better way to query for cell content
                    _dataHandler.getAllContent(function (contentArr) {
                        _contentLookup = {};
                        $.each(contentArr, function (i, /**Content*/content) {
                            _contentLookup[_getKeyForStructureId(content)] = content;
                        });
                        _updateCells();
                    });
            }
        };

        var _callUpdateGrid = function () {
            //_getAllContent();
            socket.emit('broadcastUpdate', { type:UPDATE_TYP_UI });
        };

        var _callUpdateCells = function () {
            //_getAllContent();
            socket.emit('broadcastUpdate', { type:UPDATE_TYP_CELLS });
        };

        var _buildUI = function () {
            var $addPBtn = $("<button>ADD P</button>").appendTo($holder);
            var $addMBtn = $("<button>ADD M</button>").appendTo($holder);
            var $langSel = $("<select></select>").appendTo($holder);

            SAS.controlUtilsInstance.populateSelectList($langSel, null, ['en', 'af'], 'en');
            $langSel.change(function() {
                SAS.localizr.setActiveLang($(this).val());
                _getAllContent();
            });

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
        this.updateGrid = function (data) {
            _updateGrid(data);
        };
        this.lockStateChanged = function (data) {
            _lockStateChanged(data);
        };
        //endregion
    }
})();