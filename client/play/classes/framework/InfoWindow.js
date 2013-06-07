/**
 * User: kgoulding
 * Date: 4/4/12
 * Time: 10:30 AM
 */
(function () { // self-invoking function
    var GENERIC_DESCRIPTION = 'unclear effect - in some instances this project might have a positive impact on this priority, but in other cases, the impact might be negative.';
    SAS.InfoWindow = function () {
        var _self = this;

        //region private fields and methods
        var _iconSize = 50;
        var _allwaysListAllPriorities = true;

        var _addPIcon = function (/**SAS.PriorityDef*/pDef, /*SAS.CellDef*/cell, title, prepend, right, defaultText) {
            var $priorityDiv = $("<div class='info_right_prio_grp'>");
            if (prepend) {
                $priorityDiv.prependTo(right);
            } else {
                $priorityDiv.appendTo(right);
            }
            var titleDiv = $("<div class='info_right_title_grp'>").appendTo($priorityDiv);
            var iconDiv = $("<div class='info_icon'>").appendTo(titleDiv);
            var iconSvg = d3.select(iconDiv[0]).append("svg")
                .attr("width", _iconSize + 2)
                .attr("height", _iconSize + 2);//--add 2px for chrome silliness

            var grp = iconSvg.append("g")
                .attr("transform", "scale(" + _iconSize / 200 + ") translate(100, 100)");

            grp.append("circle")
                .attr("class", "score_" + cell.score)
                .attr("r", "100");

            var imgScale = 1; //0.65;//scale down to fit square SVG icons within circles (multiply the diameter by 1/sqrt(2) = 0.707) + inset from the edge a little
            var siz = 200 * imgScale;
            grp.append("image")
                .attr("x", -siz / 2)
                .attr("y", -siz / 2)
                .attr("width", siz)
                .attr("height", siz)
                .attr("xlink:href", "/files/" + pDef.svgPath + "?color=white");

            var rt_hdr = $("<div class='info_right_title'>").appendTo(titleDiv);

            // tipsy
           // $('.info_right_title a').tipsy({gravity: 'n'});

            rt_hdr.html(SAS.localizr.get(title));
            var rd_bdy = $("<div class='info_body'>").appendTo($priorityDiv);
            var infoText = SAS.localizr.get(cell.description);
            if (infoText == "") infoText = defaultText;
            rd_bdy.html(infoText);

            return $priorityDiv;
        };

        var _isNotInteresting = function (data) {
            if (data.score == 'na') return true;
            var descrip = SAS.localizr.get(data.description);
            return !descrip || descrip == '' || descrip.toLowerCase() == GENERIC_DESCRIPTION;
        };

        var _buildImpactsHtml = function (mechanism, priorities, priorityId) {
            $("#dialog").html("");
            var mainDiv = $("<div></div>").appendTo("#dialog");
            var headerDiv = $("<div class='info_header'>").appendTo(mainDiv);

            var lt_hdr = $("<div class='info_left_title'>").appendTo(headerDiv);  // TODO: move to header
            lt_hdr.html('<p class="info_hdr">How might</p><p class="info_left_title">' + SAS.localizr.get(mechanism.data.progressive) + '</p><p class="info_hdr">contribute to a Vibrant Northeast Ohio where . . . </p>');

            var wrapper = $("<div class='right_wrapper'>").appendTo(mainDiv);
            var right = $("<div class='info_right'>").appendTo(wrapper);
            var left = $("<div class='info_left'>").appendTo(mainDiv);
            var lt_box = $("<div class='info_left_box'>").appendTo(left);
            var lt_def = $("<div class='info_defin'>").appendTo(lt_box);
            lt_def.html();

            var p = {mechId: mechanism.id};
            if (!_allwaysListAllPriorities && priorityId) p.priorityId = priorityId;

            d3.json('/getMechanismInfo?' + $.param(p), function (data) {
                $.each(data.pictures, function (i, pic) {
                    var img = $("<img>").appendTo(lt_box);
                    img.attr("src", "/files/panel/" + pic.filename);
                    img.attr("alt", pic.filename);
                    var cap = $("<div class='info_caption'>").appendTo(lt_box);
                    cap.html(pic.caption);
                });

                $.each(data.priorities, function (k, pCell) {
                    if (pCell.data && (!_isNotInteresting(pCell.data) || priorityId == pCell.pId)) {
                        var pDef = SAS.mainInstance.getPriorityDef(pCell.pId);
                        var defaultText = "It is unlikely that " + SAS.localizr.get(mechanism.data.progressive) + " will have a great contribution to creating a future where " + SAS.localizr.get(pDef.title);
                        _addPIcon(pDef, pCell.data, pDef.title, priorityId == pCell.pId, right, defaultText);
                    }
                });
            });
        };

        var _buildActionsHtml = function (/**SAS.PriorityDef*/pDef, votes) {
            //votes[mechanism.id].push({'actionId': aId, 'multiplier': multiplier, 'numCoins': micon.getTotalCoins()});

            $("#dialog").html("");
            var mainDiv = $("<div></div>").appendTo("#dialog");
            var headerDiv = $("<div class='info_header'>").appendTo(mainDiv);

            var lt_hdr = $("<div class='info_left_title'>").appendTo(headerDiv);  // TODO: move to header
            lt_hdr.html('<p class="info_hdr">How do my choices contribute to a vibrant Northeast Ohio where...</p><p class="info_left_title">' + SAS.localizr.get(pDef.title) + '</p>');

            var wrapper = $("<div class='right_wrapper'>").appendTo(mainDiv);
            var right = $("<div class='info_right'>").appendTo(wrapper);
            var left = $("<div class='info_left'>").appendTo(mainDiv);
            var lt_box = $("<div class='info_left_box'>").appendTo(left);
            var lt_def = $("<div class='info_defin'>").appendTo(lt_box);
            lt_def.html();

            $.each(votes, function (mechId, mechVotes) {
                var actionCells = SAS.mainInstance.getActionCells(mechId);
                var mech = SAS.mainInstance.getMechanismDef(mechId);
                var p = {mechId: mechId, priorityId: pDef.uid};
                d3.json('/getMechanismInfo?' + $.param(p), function (data) {
                    $.each(data.priorities, function (k, pCell) {
                        var $priorityDiv = _addPIcon(pDef, pCell.data, mech.progressive, false, right, null);
                        $priorityDiv.find('.info_right_title_grp').addClass('priority_spending_title');
                        $priorityDiv.addClass('priority_spending_grp');
                        var $priorityVotesDiv = $('<div class="priority_spending">').appendTo($priorityDiv);
                        $.each(mechVotes, function (i, vote) {
                            var action = actionCells[vote.actionId];
                            if (action) {
                                var iconClasses = [];
                                var descrip = '';
                                if (vote.numCoins > 0) {
                                    descrip = SAS.localizr.get(action.description);
                                    iconClasses = ['coins', 'coins_on_' + vote.numCoins];
                                } else {
                                    var dir = vote.multiplier > 0 ? 'up' : 'down';
                                    iconClasses = ['thumbs_' + dir, 'thumbs_on_' + dir];
                                    descrip = vote.multiplier > 0 ? 'vote for' : 'vote against (has opposite effect)';
                                }
                                var $actionDiv = $("<div class='mech_action_div'>").appendTo($priorityVotesDiv);
                                $('<div>').addClass(iconClasses.join(' ')).appendTo($actionDiv);
                                $('<div class="mech_action">').html(descrip).appendTo($actionDiv);
                            }
                        });
                    });
                });
            });
        };

        var _showDialog = function () {
            var $dialog = $("#dialog");
            var resizeDlg = function () {
                $('.right_wrapper').height(function () {
                    return $dialog.height() - $(this).position().top;
                });
            };
            $dialog.dialog({
                modal: true,
                title: 'Additional Information',
                buttons: { "Ok": function () {
                    $(this).dialog("close");
                } },
                height: $(window).height() - 80,
                width: 800,
                minWidth: 600,
                maxHeight: $(window).height() - 80,
                position: [10, 20],
                dialogClass: 'noTitle',
                resize: resizeDlg
            });
            //$dialog.find("a").tipsy({gravity: 'n'});
            resizeDlg();
        };

        var _createImpactsWindow = function (mechanism, priorities, priorityId) {
            if (mechanism == null) return;
            SAS.mainInstance.getDataManager().incrementInfoWinCount();
            _buildImpactsHtml(mechanism, priorities, priorityId);
            _showDialog();
        };

        var _createActionsWindow = function (priority, votes) {
            if (priority == null) return;
            SAS.mainInstance.getDataManager().incrementInfoWinCount();
            _buildActionsHtml(priority, votes);
            _showDialog();
        };
        //endregion

        //region public API
        this.createImpactsWindow = function (mechanism, priorities, priorityId) {
            _createImpactsWindow(mechanism, priorities, priorityId);
        };
        this.createActionsWindow = function (priority, votes) {
            _createActionsWindow(priority, votes);
        };
        //endregion
    }
})();