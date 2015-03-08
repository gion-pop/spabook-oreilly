/**
 * Created by gion on 3/5/15.
 */

var spa = (function() {
    "use strict";
    var initModule = function($container) {
        spa.model.initModule();
        spa.shell.initModule($container);
    };

    return {initModule: initModule};
})();
