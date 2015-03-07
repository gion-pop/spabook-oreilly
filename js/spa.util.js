/**
 * Copyright (c) 1998- Michael S. Mikowski
 *
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

/* global $, spa */

spa.util = function() {
    "use strict";
    var makeError, setConfigMap;

    makeError = function(name_text, msg_text, data) {
        var error = new Error();
        error.name = name_text;
        error.message = msg_text;

        if (data) {
            error.data = data;
        }
        return error;
    };


    setConfigMap = function(arg_map) {
        var input_map = arg_map.input_map,
            settable_map = arg_map.settable_map,
            config_map = arg_map.config_map,
            key_name, error;

        for (key_name in input_map) {
            if (input_map.hasOwnProperty(key_name) && settable_map.hasOwnProperty(key_name)) {
                config_map[key_name] = input_map[key_name];
            } else {
                error = makeError(
                    'Bad Input',
                    'Setting config key |' + key_name + '| is not supproted'
                );
                throw error;
            }
        }
    };


    return {
        makeError: makeError,
        setConfigMap: setConfigMap
    };
}();
