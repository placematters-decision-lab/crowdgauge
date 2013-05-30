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
            $("#reshowInstr").hide();
        };

        var _showAgainButtonVisible = function (show) {
            $("#reshowInstr").toggle(show);
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
            $("<p>Find out how to further your priorities&#8230;</p><p>Click through the <b>list of projects and policies on the left</b> to see how they might affect your priorities and then click on any of the priority bubbles to open up an explanation.</p>").appendTo(txtAbove);
            $("<p>The colors of your priority chart show how each project or policy impacts your priorities, in a <span style='background-color: #2BBEC5'>positive</span> , <span style='background-color: #EAD9C4'>neutral</span>, or <span style='background-color: #ec7623'>negative</span> way. Look for projects or policies that make your biggest bubbles turn blue.</p>").appendTo(txtAbove);
            $("<p>To get started, we've picked the action that appears to have the greatest positive impact on your priorities:</p>").appendTo(txtAbove);

            var mechDivIns = $("<div class='mechGrp' style='min-height: 30px'></div>").appendTo("#dialog");
            $("<div class='mechIcon'></div>").appendTo(mechDivIns).attr("id", "mechInsExample");
            new SAS.MiniBubbleChart(bubblechart).addMiniBubbleChart("#mechInsExample", topScorer.values);
            var insTxt = $("<div class='mechText' style='font-size: 1em;'></div>").appendTo(mechDivIns);
            insTxt.html(SAS.localizr.get(topScorer.data.title));

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
            var txt = "<p>You have " + numCoins + " coins in your budget and face two categories of choices projects and policies. You may choose as many projects as you can afford. Policies do not cost coins and you can choose as many as you want. See how the colors change in your priority chart to show how well the options you select help achieve your priorities.</p>";
            _showInstructionDialog(txt);
        };

        this.showCredits = function () {
            var txt = "<p>Planning trade-offs can be a tough topic to explore in-depth. ImagineMyNEO is a tool designed to help dive into challenging issues, offering users a chance to weigh different choices and understand the real challenges and trade-offs beneath them.</p>";
            txt += "<p>ImagineMyNEO prioritizes issues that are both <strong>spatial</strong> and <strong>regional</strong> because Vibrant NEO 2040 is a regional visioning and decision-making framework. Priorities, policies, and projects with a spatial impact are prioritized so that the results from ImagineMyNEO can be incorporated into scenario development. It does not include issues like &#8220;having strong schools&#8220; that are very important but have less of a spatial impact at the regional scale.</p>";
            txt += "<p>We will be taking your input and presenting preliminary findings at our workshops occurring at the end of July. Ultimately, your priorities will be used to shape the preferred scenario.</p>";
           _showInstructionDialog(txt, "Purpose of ImagineMyNEO");
        };

        this.showWhy = function () {
            var txt = "<p>A regional vision is only successful if it is based upon local opinions. We want to make sure that we&#8216;re able to reach a broad group of people, so that we can understand the range of opinions across the region.  These questions help us see if we&#8216;re reaching a diverse audience.</p>";
            txt += "<p>These responses will not be used to identify any individual. Your individual responses to these questions will remain anonymous.</p>";
            _showInstructionDialog(txt, "Why are we asking?");
        };

        this.showSharingDialog = function (responseId, header, pages, bubblechart, sortedPriorities) {
            $("#dialog").html("");
            var mainDiv = $("<div></div>").appendTo("#dialog");
            $("<p>"+header+"Share your badge?</p>").appendTo(mainDiv);

            var wrapper = $("<div class='right_wrapper'>").appendTo(mainDiv);
            var right = $("<div class='share_right'>").appendTo(wrapper);
            var left = $("<div class='share_left'>").appendTo(mainDiv);
            $('<img src="/png?responseId='+responseId+'">').appendTo(left);
            var btnHolder = $("<div style='width:200px'>").appendTo(right);

            $("<button class='sharingBtn sharingBtn_facebook'></button>").appendTo(btnHolder).click(function () {
                var summary = encodeURIComponent("This is how I 'ImagineMyNEO!' See what my priorities are for the future of our region and how I would allocate our limited resources and assign policies to achieve this future.");
                var imageUrl = encodeURIComponent('http://imaginemyneo.crowdgauge.org/png?responseId=' + responseId);
                var sharedUrl = encodeURIComponent('http://imaginemyneo.crowdgauge.org/client/play/entries.html?responseId=' + responseId);
//                var sharedUrl = encodeURIComponent('http://127.0.0.1:8080/client/play/entries.html?responseId=' + responseId);
                window.open('http://www.facebook.com/sharer.php?s=100&p[title]=My+Design+Profile&p[summary]=' + summary + '&p[url]='+sharedUrl+'&p[images][0]=' + imageUrl, 'sharer', 'status=0,width=800,height=600,resizable=yes');
            });

            var btnsBelow = $("<div class='share_btns'>").appendTo(mainDiv);
            $("<button class='sharingBtn sharingBtn_map'>")
                .appendTo(btnsBelow)
                .click(function () {
                    _closeDialog();
                    window.location.replace("http://imaginemyneo.crowdgauge.org/client/play/map.html");
//                    pages.gotoMap();
                });
            $("<button class='sharingBtn sharingBtn_compare'>")
                .appendTo(btnsBelow)
                .click(function () {
                    _closeDialog();
                    window.location.replace("http://vibrantneo.org/");
//                    pages.gotoCompare();
                });

            _showInstructionDialog2(600);
        };
        //endregion

        _initialize();
    }
})();