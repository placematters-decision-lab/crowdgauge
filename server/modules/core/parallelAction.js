//region node.js core

//endregion
//region npm modules

//endregion
//region modules

//endregion

//TODO move this core code to a GIT submodule and share with VisualizerService etc. http://youtrack.jetbrains.com/issue/IDEA-64024
/**
 @class ParallelAction
 */
ParallelAction = function (callback) {
    var _self = this;

    var _fnsToRun = [];
    var _callback = callback;
    var _cnt;
    var _started = false;

    var _start = function () {
        _started = true;
        _cnt = _fnsToRun.length;
        if (_cnt == 0) {
            _callback();
        } else if (_cnt == 1) {
            _fnsToRun[0](function () {
                _callback();
            });
        } else {
            _fnsToRun.forEach(function (fn) {
                fn(function () {
                    _cnt--;
                    if (_cnt == 0) {
                        _callback();
                    }
                });
            });
        }
    };

    this.addFn = function (fn) {
        if (_started) throw 'Process has already started. Delay start until all actions are added.';
        _fnsToRun.push(fn);
    };

    this.start = function () {
        _start();
    };
};

module.exports.ParallelAction = ParallelAction;

