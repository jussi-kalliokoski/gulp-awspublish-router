"use strict";

var _ = require("lodash");
var through = require("through2");

module.exports = function (options) {
    var routes = _.map(options.routes, function (value, key) {
        if ( typeof value === "string" ) {
            value = { key: value };
        }

        return _.extend({
            route: key,
            routeMatcher: new RegExp(key),
            key: "$&"
        }, value);
    });

    return through.obj(function (file, encoding, callback) {
        _.each(routes, function (route) {
            if ( !route.routeMatcher.test(file.relative) ) {
                return;
            }

            file.s3.path = file.s3.path.replace(route.routeMatcher, route.key);

            return false;
        });
    });
};
