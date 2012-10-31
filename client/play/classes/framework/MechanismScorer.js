/**
 * User: kgoulding
 * Date: 4/4/12
 * Time: 11:55 AM
 */
(function () { // self-invoking function
    SAS.MechanismScorer = function (mechanism) {
        var _self = this;

        //region private fields and methods
        var _mechanism = mechanism;
        //endregion

        //region public API
        this.getScoreForPriorities = function (priorities) {
            if (priorities == null) return 0;
            var numValid = 0;
            var tot = 0;
            $.each(priorities.children, function (i, priority) {
                var str_val = (_mechanism.values[priority.id]) ? _mechanism.values[priority.id] : "na";
                if (str_val == "na") return true;//continue
                var val = parseFloat(str_val);
                numValid += 1;
                tot += priority.value * val;
            });
            return tot / numValid;
        };

        this.appendScores = function (multiplier, scores) {
            $.each(_mechanism.values, function (priorityId, mpr) {
                var str_val = mpr;
                if (str_val == "na" || str_val == "") return true;//continue
                var val = parseFloat(str_val);
                var score = multiplier * val;
                if (scores[priorityId] == null) {
                    scores[priorityId] = score;
                } else {
                    scores[priorityId] += score;
                }
            });
        };
        //endregion
    }
})();