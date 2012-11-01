/**
 * User: kgoulding
 * Date: 4/4/12
 * Time: 10:30 AM
 */
(function () { // self-invoking function
    SAS.InfoWindow = function () {
        var _self = this;

        //region private fields and methods
        var _iconSize = 50;
        var _addPriority = function (pId, /*SAS.CellDef*/cell, right, mechanism) {
            var titleDiv = $("<div class='info_right_title_grp'>").appendTo(right);
            var iconDiv = $("<div class='info_icon'>").appendTo(titleDiv);
            var iconSvg = d3.select(iconDiv[0]).append("svg")
                .attr("width", _iconSize + 2)
                .attr("height", _iconSize + 2);//--add 2px for chrome silliness

            var grp = iconSvg.append("g")
                .attr("transform", "scale(" + _iconSize / 200 + ") translate(100, 100)");

            grp.append("circle")
                .attr("class", "score_" + cell.score)
                .attr("r", "100");

            var pDef = SAS.mainInstance.getPriorityDef(pId);

            var imgScale = 0.65;//scale down to fit square SVG icons within circles (multiply the diameter by 1/sqrt(2) = 0.707) + inset from the edge a little
            var siz = 200 * imgScale;
            grp.append("image")
                .attr("x", -siz / 2)
                .attr("y", -siz / 2)
                .attr("width", siz)
                .attr("height", siz)
                .attr("xlink:href", "/files/" + pDef.svgPath + "?color=white");

            var rt_hdr = $("<div class='info_right_title'>").appendTo(titleDiv);
            rt_hdr.html(SAS.localizr.get(pDef.title));
            var rd_bdy = $("<div class='info_body'>").appendTo(right);
            var infoText = SAS.localizr.get(cell.description);
            if (infoText == "") infoText = "It is unlikely that " + SAS.localizr.get(mechanism.data.progressive) + " will have a great contribution to creating a future where " + SAS.localizr.get(pDef.title);
            rd_bdy.html(infoText);
        };

        var _buildHtml = function (mechanism, priorities, priorityId) {
            $("#dialog").html("");
            var mainDiv = $("<div></div>").appendTo("#dialog");
            var headerDiv = $("<div class='info_header'>").appendTo(mainDiv);

            //$('<a href="#"/></a>').appendTo(headerDiv);//hack to prevent scrolling to bottom, see: http://forum.jquery.com/topic/default-scroll-position-of-jquery-ui-dialog

            $("<div class='info_hdr info_hdr_top'>").appendTo(headerDiv);
            var lt_hdr = $("<div class='info_left_title'>").appendTo(headerDiv);
            lt_hdr.html(SAS.localizr.get(mechanism.data.progressive));
            $("<div class='info_hdr info_hdr_below'>").appendTo(headerDiv);

            var wrapper = $("<div class='right_wrapper'>").appendTo(mainDiv);
            var right = $("<div class='info_right'>").appendTo(wrapper);
//            if (priorityId != null) {
//                var priorityLookup = d3.nest().key(
//                    function (d) { return d.id; }).map(priorities.children);
//                var priority = priorityLookup[priorityId][0];
//                _addPriority(priority, right, mechanism);
//            } else {
//                $.each(priorities.children, function (k, priority) {
//                    if (mechanism.values[priority.id].infoText != "") {
//                        _addPriority(priority, right, mechanism);
//                    }
//                });
//            }

            var left = $("<div class='info_left'>").appendTo(mainDiv);

            var lt_box = $("<div class='info_left_box'>").appendTo(left);

            var lt_def = $("<div class='info_defin'>").appendTo(lt_box);
            lt_def.html(SAS.localizr.get(mechanism.data.description));

            d3.json('/getMechanismInfo?mechId=' + mechanism.id + ((priorityId) ? "&priorityId=" + priorityId : ""), function (data) {
                $.each(data.pictures, function (i, pic) {
                    var img = $("<img>").appendTo(lt_box);
                    img.attr("src", "/files/panel/" + pic.filename);
                    img.attr("alt", pic.filename);
                    var cap = $("<div class='info_caption'>").appendTo(lt_box);
                    cap.html(pic.caption);
                });
                $.each(data.priorities, function (k, pCell) {
                    if (pCell.data && SAS.localizr.get(pCell.data.description)) {
                        _addPriority(pCell.pId, pCell.data, right, mechanism);
                    }
                });
            });


        };

        var _createMechanismWindow = function (mechanism, priorities, priorityId) {
            if (mechanism == null) return;
            SAS.mainInstance.getDataManager().incrementInfoWinCount();
            //var link = mechanism.id + "_" + priorityId + ".html";
            //$("#dialog").load("moreInfo/" + link, function () {
            _buildHtml(mechanism, priorities, priorityId);
            $("#dialog").dialog({
                modal:true,
                title:'Additional Information',
                buttons:{ "Ok":function () {
                    $(this).dialog("close");
                } },
                height:650,
                width:800,
                minWidth:600,
                maxHeight:$(window).height() - 80,
                position:[10, 20],
                dialogClass:'noTitle'
            });
        };
        //endregion

        //region public API
        this.createMechanismWindow = function (mechanism, priorities, priorityId) {
            _createMechanismWindow(mechanism, priorities, priorityId);
        };
        //endregion
    }
})();