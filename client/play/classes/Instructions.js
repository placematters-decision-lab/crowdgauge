/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:52 PM
 */
(function () { // self-invoking function
    SAS.Instructions = function () {
        var _self = this;

        //region private fields and methods
        //var _ashxPath = "http://localhost:59159/ashx/";
        var _ashxPath = "http://ws.sasakistrategies.com/ashx/regionalScoresService/";
        var _showAgainFn;
        var _initialize = function() {
            $("#reshowInstr").click(function () {
                if (_showAgainFn != null) _showAgainFn();
            });
        };

        var _showAgainButtonVisible = function (show) {
            $("#reshowInstr").toggle(show);
        };

        var _showModalInstructionDialog = function (html, title) {

        };

        var _showInstructionDialog = function (html, opts, buttonLabel, buttonFn) {
            if(typeof(opts) == 'object') {
                var title = opts.title;
                var name = opts.name;
            }  else {
                var name = 'instructions';
            }
            var wrapper = $("<div data-localize='instructions.descriptions." + name + "'/>").html(html);
            $("#dialog").html(wrapper);
            _showInstructionDialog2(600, opts, buttonLabel, buttonFn);
        };

        var _showInstructionDialog2 = function (w, opts, buttonLabel, buttonFn) {
            _showAgainButtonVisible(false);
            if(typeof(opts) == 'object') {
                var title = opts.title;
                var name = opts.name;
            }
            if (!w) w = 600;
            if (!title) title = 'Instructions';
            if (!buttonLabel) buttonLabel ='Ok';

            var btns = {};
            btns[buttonLabel] = function () {
                if (buttonFn) buttonFn();
                _closeDialog();
            };
            $("#dialog").dialog({
                modal:true,
                title:title,
                buttons:btns,
                width:w,
                height:'auto',
                minWidth:400,
                position:'center',
                dialogClass:''
            });
            $('#ui-dialog-title-dialog').attr('data-localize','instructions.titles.' + name);
            SAS.localizr.setActiveLang();
        };

        var _closeDialog = function () {
            $("#dialog").dialog("close");
            _showAgainButtonVisible(_showAgainFn != null);
        };

        var _printImage = function (url) {
            var mywindow = window.open('', '_blank', 'height=800,width=800');
            mywindow.document.write('<html><head><title>CrowdGauge</title>');
            /*optional stylesheet*/ //mywindow.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
            mywindow.document.write('</head><body >');
            mywindow.document.write('<img src="' + url + '" width="1000" height="1000">');
            mywindow.document.write('</body></html>');
            mywindow.document.close();
            mywindow.print();
            return true;
        };

        var _validateEmail = function (x) {
            var atpos = x.indexOf("@");
            var dotpos = x.lastIndexOf(".");
            if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= x.length) {
                alert("Not a valid e-mail address");
                return false;
            }
            return true;
        };

        var _showEmailFields = function (sel, bubbleStr, entryId) {
            $(sel).html("");
            var form = $('<form method="get" action="' + _ashxPath + "EmailBubbleChart.ashx" + '">').appendTo(sel);
            form.css("font-size", "0.85em");
            var emailTb = $('<input type="text" size="30" name="email">').appendTo($('<label>To:</label>').appendTo(form));
            var emailTbFrom = $('<label>From:<input type="text" size="30" name="from"></label>').appendTo(form);
            var messageTb = $('<input type="text" size="50" name="message">').appendTo($('<label>Message:</label>').appendTo(form));
            $('<input type="hidden" name="img" value="'+bubbleStr+'">').appendTo(form);
            $('<input type="hidden" name="entry_id" value="'+entryId+'">').appendTo(form);
            var emailBtn = $('<input type="submit" value="Send">').appendTo(form);
            messageTb.val("I created my priority chart on CrowdGauge.");
            messageTb.css("font-size", "0.85em");
            $('<input type="button" name="cancel" value="Cancel" />').appendTo(form).click(function () {
                $(sel).slideUp(400);
                return false;
            });
            form.submit(function(event) {
                if (_validateEmail(emailTb.val())) {
                    $(sel).slideUp(400);
                    return true;
                }
                return false;
            });
            $(sel).show(400);
        };
        //endregion

        //region public API
        this.showInstructionDialog = function (html) {
            _showInstructionDialog(html);
        };

        this.showIntroDialog = function() {
            _showAgainFn = null;
            var txt = "<p>Welcome to the planokc CrowdGauge Survey! This exercise is designed to get your feedback on " +
                "possible policies for planokc and show how actions and investments related to those policies impact your priorities for Oklahoma City’s future.</p>";
            txt += "<p>Your results will be used to help create the City’s new comprehensive plan, planokc. You can learn more by visiting <a href='http://www.planokc.org' target='_blank'>planokc.org</a></p>";
            _showInstructionDialog(txt, {name: 'intro'}, "Get Started", function() {
                SAS.mainInstance.preventAccidentalLeaving();
            });
            $(".ui-button").focus();
        };

        this.showStarsDialog = function (numStars) {
            _showAgainFn = function() {
                _self.showStarsDialog(numStars);
            };
            var txt = "<p>Use the stars to rate how important each priority is to you. You can allocate up to <span style='text-decoration:underline'>up to</span> " + numStars + " stars.</p>";
            txt += "<p>Watch your priority chart change as you indicate your highest priorities.</p>";
            _showInstructionDialog(txt, {name: 'priorities'});
        };

        this.showMechanismInstructions = function (mechanisms, priorities, bubblechart, topScorer) {
            _showAgainFn = function() {
                _self.showMechanismInstructions(mechanisms, priorities, bubblechart, topScorer);
            };
            $("#dialog").html("");
            var txtAbove = $("<div></div>").appendTo("#dialog");
            $("<p><b>Click on any action on the left</b> and then <b>click on any of the priority bubbles on the right</b> to open up an explanation of how the project or policy might affect your priorities.</p>").appendTo(txtAbove);
            $("<p>The colors of your priority chart show how each project or policy impacts your priorities in a <span style='background-color: #ec7623'>negative</span>, <span style='background-color: #EAD9C4'>neutral</span>, or <span style='background-color: #2BBEC5'>positive</span> way.</p>").appendTo(txtAbove);
            $("<p>Spend as much time on this page as you like, then move on to the next tab where you’ll be asked to identify the projects and policies that appeal most to you.</p>.").appendTo(txtAbove);
            $("<p>To get started, we've picked the action that appears to have the greatest positive impact on your priorities:</p>.").appendTo(txtAbove);

            var mechDivIns = $("<div class='mechGrp' style='min-height: 30px'></div>").appendTo("#dialog");
            $("<div class='mechIcon'></div>").appendTo(mechDivIns).attr("id", "mechInsExample");
            new SAS.MiniBubbleChart(bubblechart).addMiniBubbleChart("#mechInsExample", topScorer.values);
            var insTxt = $("<div class='mechText' style='font-size: 1em;'></div>").appendTo(mechDivIns);
            SAS.localizr.live(topScorer.data.title,insTxt);

            mechDivIns.click(function () {
                _closeDialog();
            });
            _showInstructionDialog2();
        };

        this.showMapResultsDialog = function () {
            _showAgainFn = null;// -- no space for show again button on map... _self.showMapResultsDialog;
            var txt = "<p>What did people vote for in different communities? Use this map to find out.</p>";
            txt += "<p>Click the projects and policies on the left to see where they are receiving the greatest percentage of the votes.</p>";
            txt += "<p>Click a community's circle on the map to see how a they are voting.</p>";
            _showInstructionDialog(txt);
        };

        this.showMoneyDialog = function (numCoins) {
            _showAgainFn = function() {
                _self.showMoneyDialog(numCoins);
            };
            var txt = "<p>Put your money where your mouse is!</p>";
            txt += "<p>You have <span style='text-decoration:underline'>up to</span> " + numCoins + " coins to spend. The coins represent relative cost within a fixed budget. " +
                "To learn more about each project, hover (or tap if on a tablet) on each project description on the left side of your screen." +
                "<p>See how the colors change in your priority bubble chart to show how well the options you select help achieve your priorities.</p>";
            _showInstructionDialog(txt, {name: 'money'});
        };

        this.showPoliciesDialog = function () {
            _showAgainFn = function() {
                _self.showPoliciesDialog();
            };
            var txt = "<p>Tell us what you think of these policies</p>";
            txt += "<p>This is the last part of the survey before submitting! Please give the thumbs up or down to each of these policies.  If you are neutral or don't have an opinion, don't select either.</p>" +
                "<p>The colors in your priority bubble chart will continue to show how well the options you select help achieve your priorities.</p>";
            _showInstructionDialog(txt, {name: 'policies'});
        }

        this.showCredits = function () {
            var txt = "<p>Many icons are from <a href='http://thenounproject.com/' target='_blank'>The Noun Project</a> Collection.</p>";
           _showInstructionDialog(txt, "Credits");
        };

        this.showSharingDialog = function (entryId, header, pages, bubblechart, sortedPriorities) {
            //TODO
            var txt = "<p>Thanks for taking this survey. For more information about planokc, visit <a href='http://www.planokc.org'>planokc.org</a>.</p>";
            _showInstructionDialog(txt,{title: 'Thank you for sharing!', name: "sharing"});
        };
        //endregion

        _initialize();
    }
})();