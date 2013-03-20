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

        var _showInstructionDialog = function (html, title, buttonLabel, buttonFn) {
            $("#dialog").html(html);
            _showInstructionDialog2(600, title, buttonLabel, buttonFn);
        };

        var _showInstructionDialog2 = function (w, title, buttonLabel, buttonFn) {
            _showAgainButtonVisible(false);
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
            var txt = "<p>This is the intro</p>";
            _showInstructionDialog(txt, "Introduction", "Get Started", function() {
                SAS.mainInstance.preventAccidentalLeaving();
            });
            $(".ui-button").focus();
        };

        this.showStarsDialog = function (numStars) {
            _showAgainFn = function() {
                _self.showStarsDialog(numStars);
            };
            var txt = "<p>Use the stars to rate how important each value is to you. You can allocate up to " + numStars + " stars.</p>";
            txt += "<p>Watch your priority chart change as you indicate your highest priorities.</p>";
            _showInstructionDialog(txt);
        };

        this.showMechanismInstructions = function (mechanisms, priorities, bubblechart, topScorer) {
            _showAgainFn = function() {
                _self.showMechanismInstructions(mechanisms, priorities, bubblechart, topScorer);
            };
            $("#dialog").html("");
            var txtAbove = $("<div></div>").appendTo("#dialog");
            $("<p>Ever wonder how planning affects you?</p><p>Click through the <b>list of actions on the left</b> to see how different projects and policies might affect your priorities.</p>").appendTo(txtAbove);
            $("<div class='clickTheIcon' style='height:40px'>Then click on any of the bubbles to open up an explanation.</div>").appendTo(txtAbove);
            $("<p>The colors of your priority chart show how each project or policy impacts your priorities, in a <span style='background-color: #2BBEC5'>positive</span> , <span style='background-color: #EAD9C4'>neutral</span>, or <span style='background-color: #ec7623'>negative</span> way.</p>").appendTo(txtAbove);
            $("<p>Look for actions that make your biggest bubbles turn blue. To get started, we've picked the action that appears to have the greatest positive impact on your priorities:</p>.").appendTo(txtAbove);

            var mechDivIns = $("<div class='mechGrp' style='min-height: 30px'></div>").appendTo("#dialog");
            $("<div class='mechIcon'></div>").appendTo(mechDivIns).attr("id", "mechInsExample");
            new SAS.MiniBubbleChart(bubblechart).addMiniBubbleChart("#mechInsExample", topScorer.values);
            var insTxt = $("<div class='mechText' style='font-size: 1em;'></div>").appendTo(mechDivIns);
            insTxt.html(topScorer.data.title);
            console.log(topScorer.data.title);

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
            var txt = "<p>Put your money where your 'mouse' is!</p>";
            txt += "<p>You have " + numCoins + " coins in your budget. You may choose as many policies as you want and as many projects as you can afford. See how the colors change in your priority chart to show how well the options you select help achieve your priorities.</p>";
            _showInstructionDialog(txt);
        };

        this.showCredits = function () {
            var txt = "<p>Many icons are from <a href='http://thenounproject.com/' target='_blank'>The Noun Project</a> Collection.</p>";
           _showInstructionDialog(txt, "Credits");
        };

        this.showSharingDialog = function (entryId, header, pages, bubblechart, sortedPriorities) {
            //TODO
        };
        //endregion

        _initialize();
    }
})();