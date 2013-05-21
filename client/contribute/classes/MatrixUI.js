/**
 * User: KGoulding
 * Date: 9/18/12
 * Time: 12:14 PM
 */
(function () { // self-invoking function
    var UPDATE_TYP_UI = 'uiUpdate';
    var UPDATE_TYP_CELLS = 'cellUpdate';

    var _getUID = function () {//TEMP
        var msSince2012 = new Date().getTime() - 1325376000000;
        return msSince2012 + "-" + Math.floor(Math.random() * 10000);
    };

    /**
     * @class SAS.MatrixUI
     * @constructor
     **/
    SAS.MatrixUI = function ($holder, socket) {
        var _self = this;

        //region private fields and methods
        var userId = "u_" + _getUID();//TODO replace with auth

        var _onTabChanged = function (isActions) {};
        var _$tabs;

        /** @type SAS.PriorityGrid */
        var _priorityGrid;

        /** @type SAS.ActionsGrid */
        var _actionsGrid;

        /** @type SAS.AMechGrid */
        var _currentMechGrid;

        var _dataHandler = new SAS.DataHandler(userId, "test1");

        var _getKeyForStructureId = function (/**Content*/content) {
            if (content.structureId.priority) return content.structureId.mechanism + "_" + content.structureId.priority;
            if (content.structureId.action) return content.structureId.mechanism + "_" + content.structureId.action;
            return content.structureId.mechanism;
        };

        var _getAllContent = function () {
            _dataHandler.getAllContent(function (contentArr) {
                var priorityIds = [];
                var priorityLookup = {};
                var actionIds = [];
                var actionLookup = {};
                var mechIds = [];
                var mechLookup = {};
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
                        case Enums.CTYPE_ACTION:
                            content.data = new SAS.ActionDef(content.data);
                            actionIds.push(content.structureId.action);
                            actionLookup[content.structureId.action] = {content:content, data:content.data};
                            break;
                    }
                });
                _priorityGrid.updateContent(mechIds, mechLookup, contentLookup, priorityIds, priorityLookup);
                _actionsGrid.updateContent(mechIds, mechLookup, contentLookup, actionIds, actionLookup);
            });
        };

        var _lockStateChanged = function (data) {
            var lock = data.lock;
            var structureId = data.structureId;
            if (structureId.priority) {
                _priorityGrid.setLockState(structureId, lock);
            } else if (structureId.action) {
                _actionsGrid.setLockState(structureId, lock);
            }
        };

        var _updateGrid = function (data) {
            switch (data.type) {
                case UPDATE_TYP_UI:
                    _getAllContent();
                    break;
                case UPDATE_TYP_CELLS:
                    //TODO add a better way to query for cell content
                    _dataHandler.getAllContent(function (contentArr) {
                        var contentLookup = {};
                        $.each(contentArr, function (i, /**Content*/content) {
                            contentLookup[_getKeyForStructureId(content)] = content;
                        });
                        _priorityGrid.updateCells(contentLookup);
                        _actionsGrid.updateCells(contentLookup);
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

        /**
         * @param {SAS.AMechGrid} mechGrid
         * @private
         */
        var _setupMechGrid = function (mechGrid) {
            mechGrid.onUpdate(function () {
                _$tabs.tabs("refresh");
            });
            mechGrid.onGridUpdateRequired(function () {
                _callUpdateGrid();
            });
            mechGrid.onCellUpdateRequired(function () {
                _callUpdateCells();
            });
        };

        var _buildUI = function () {
            var $toolbar = $('<div id="toolbar" class="ui-widget-header ui-corner-all">');
            var $addMBtn = $('<button>Add Mechanism</button>').button().appendTo($toolbar);
            var $addPBtn = $('<button>Add Priority</button>').button().appendTo($toolbar);
            var $addABtn = $('<button>Add Action Column</button>').button().appendTo($toolbar);
//            var $langSel = $('<select class="langSel"></select>').appendTo($toolbar);

//            SAS.controlUtilsInstance.populateSelectList($langSel, null, ['en', 'af'], 'en');
//            $langSel.change(function () {
//                SAS.localizr.setActiveLang($(this).val());
////                _callUpdateCells();
//            });

            _$tabs = $("<div>").appendTo($holder);
            $toolbar.appendTo($holder);

            var $tabLinks = $("<ul>").appendTo(_$tabs);
            $('<li><a href="#tab_prio">Priorities</a></li>').appendTo($tabLinks);
            $('<li><a href="#tab_actions">Actions</a></li>').appendTo($tabLinks);

            var $tabPrio = $('<div id="tab_prio">').appendTo(_$tabs);
            var $tabActions = $('<div id="tab_actions">').appendTo(_$tabs);
            _$tabs.tabs({
                    'activate':function (event, ui) {
                        $addPBtn.toggle(ui.newPanel[0] == $tabPrio[0]);
                        $addABtn.toggle(ui.newPanel[0] == $tabActions[0]);
                        _currentMechGrid = (ui.newPanel[0] == $tabPrio[0]) ? _priorityGrid : _actionsGrid;
                        _currentMechGrid.showContent();
                        _onTabChanged(_currentMechGrid == _actionsGrid);
                    }}
            );

            $addABtn.hide();

            _priorityGrid = new SAS.PriorityGrid($('<div class="tabContent">').appendTo($tabPrio), _dataHandler);
            _setupMechGrid(_priorityGrid);

            _actionsGrid = new SAS.ActionsGrid($('<div class="tabContent">').appendTo($tabActions), _dataHandler);
            _setupMechGrid(_actionsGrid);

            $addPBtn.click(function () {
                _priorityGrid.addNewPriority();
            });
            $addMBtn.click(function () {
                _currentMechGrid.addNewMechanism();
            });
            $addABtn.click(function () {
                _actionsGrid.addNewAction();
            });

            _currentMechGrid = _priorityGrid;

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

        /**
         * @param {Function} fn
         */
        this.onTabChanged = function (fn) {
            _onTabChanged = fn;
        };
        //endregion
    }
})();