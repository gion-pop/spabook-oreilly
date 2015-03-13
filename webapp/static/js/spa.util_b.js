/**
 * Created by gion on 3/8/15.
 */

/* global $, spa */

spa.util_b = (function() {
    "use strict";
    var configMap = {
            regex_encode_html: /[&"'><]/g,
            regex_encode_noamp: /["'><"]/g,
            html_encode_map: {
                '&': '&#38;',
                '"': '&#34;',
                "'": '&#39;',
                '>': '&#62;',
                '<': '&#60;'
            }
        },

        decodeHtml,
        encodeHtml,
        getEmSize;


    configMap.encode_noamp_map = $.extend(
        {}, configMap.html_encode_map
    );
    delete configMap.encode_noamp_map['&'];


    /**
     * Decodes HTML entities in a browser-friendly way.
     * @param {String} str
     * @returns {String} Decoded string
     */
    decodeHtml = function(str) {
        return $('<div/>').html(str || '').text();
    };


    /**
     * Single pass encoder for html entities and handles an arbitrary number of characters.
     * @param {String} input_arg_str
     * @param {boolean} [exclude_amp]
     * @returns {String} Encoded string
     */
    encodeHtml = function(input_arg_str, exclude_amp) {
        var input_str = String(input_arg_str),
            regex, lookup_map;
        if (exclude_amp) {
            lookup_map = configMap.encode_noamp_map;
            regex = configMap.regex_encode_noamp;
        } else {
            lookup_map = configMap.html_encode_map;
            regex = configMap.regex_encode_html;
        }
        return input_str.replace(regex,
            function(match, name) {
                return lookup_map[match] || '';
            }
        );
    };


    /**
     * returns size of ems in pixels.
     * @param elem
     * @returns {Number} em size of elem
     */
    getEmSize = function(elem) {
        return Number(
            getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]
        );
    };


    return {
        decodeHtml: decodeHtml,
        encodeHtml: encodeHtml,
        getEmSize: getEmSize
    };
})();
