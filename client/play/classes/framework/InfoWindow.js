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
        var _addPriority = function (priority, right, mechanism) {
            var mechMeetsPriority = mechanism.values[priority.id];
            var titleDiv = $("<div class='info_right_title_grp'>").appendTo(right);
            var iconDiv = $("<div class='info_icon'>").appendTo(titleDiv);
            var iconSvg = d3.select(iconDiv[0]).append("svg")
                .attr("width", _iconSize + 2)
                .attr("height", _iconSize + 2);//--add 2px for chrome silliness

            var grp = iconSvg.append("g")
                .attr("transform", "scale(" + _iconSize/200 + ") translate(100, 100)");

            grp.append("circle")
                .attr("class", "score_" + mechMeetsPriority.score)
                .attr("r", "100");

            grp.append("image")
                .attr("x", -100)
                .attr("y", -100)
                .attr("width", 200)
                .attr("height", 200)
                .attr("xlink:href", "rpsd/icons-white/"+priority.id+".svg");

            var rt_hdr = $("<div class='info_right_title'>").appendTo(titleDiv);
            rt_hdr.html(priority.title);
            var rd_bdy = $("<div class='info_body'>").appendTo(right);
            var infoText = mechMeetsPriority.infoText;
            if (infoText == "") infoText = "It is unlikely that " + mechanism.ingText + " will have a great contribution to creating a Greater Des Moine where " + priority.title;
            rd_bdy.html(infoText);
        };

        var _buildHtml = function (mechanism, priorities, priorityId) {
            $("#dialog").html("");
            var mainDiv = $("<div></div>").appendTo("#dialog");
            var headerDiv = $("<div class='info_header'>").appendTo(mainDiv);

            //$('<a href="#"/></a>').appendTo(headerDiv);//hack to prevent scrolling to bottom, see: http://forum.jquery.com/topic/default-scroll-position-of-jquery-ui-dialog

            $("<div class='info_hdr info_hdr_top'>").appendTo(headerDiv);
            var lt_hdr = $("<div class='info_left_title'>").appendTo(headerDiv);
            lt_hdr.html(mechanism.ingText);
            $("<div class='info_hdr info_hdr_below'>").appendTo(headerDiv);

            var wrapper = $("<div class='right_wrapper'>").appendTo(mainDiv);
            var right = $("<div class='info_right'>").appendTo(wrapper);
            if (priorityId != null) {
                var priorityLookup = d3.nest().key(
                    function (d) { return d.id; }).map(priorities.children);
                var priority = priorityLookup[priorityId][0];
                _addPriority(priority, right, mechanism);
            } else {
                $.each(priorities.children, function (k, priority) {
                    if (mechanism.values[priority.id].infoText != "") {
                        _addPriority(priority, right, mechanism);
                    }
                });
            }

            var mindeMixerText = "In many cases, it is difficult to determine how a project or policy might affect a community. Do you agree or disagree with some of the explanations? Join the discussion with <span id='mindMixerLink'>MindMixer</span>, The Tomorrow Plan’s community forum.";
            $("<div class='info_mind'>").html(mindeMixerText).appendTo(right);
            $("#mindMixerLink").click(function () {
                window.open("http://ideas.thetomorrowplan.com","_blank");
            });

            var left = $("<div class='info_left'>").appendTo(mainDiv);

            var lt_box = $("<div class='info_left_box'>").appendTo(left);

            var lt_def = $("<div class='info_defin'>").appendTo(lt_box);
            lt_def.html(mechanism.definition);

            $.each(mechanism.pictures, function (i, pic) {
                var img = $("<img>").appendTo(lt_box);
                img.attr("src", "rpsd/moreInfoPics/" + pic.filename);
                img.attr("alt", pic.alttext);
                var cap = $("<div class='info_caption'>").appendTo(lt_box);
                cap.html(pic.caption);
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
                dialogClass: 'noTitle'
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