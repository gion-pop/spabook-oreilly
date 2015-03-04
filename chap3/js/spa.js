/**
 * Created by gion on 3/5/15.
 */

var spa = (function() {
    "use strict";
    var initModule = function($container) {
        $container.html('<h1 style="display: inline-block; margin: 25px;">hello world!</h1>');
    };

    return {initModule: initModule};
})();
