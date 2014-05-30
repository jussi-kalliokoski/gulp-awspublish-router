"use strict";

var _ = require("lodash");
var through = require("through2");
var awspublish = require("gulp-awspublish");

var passThroughStream = require("./lib/utils/passThroughStream");

module.exports = function (options) {
    var routes = _.map(options.routes, function (value, key) {
        if ( typeof value === "string" ) {
            value = { key: value };
        }

        return _.extend({
            route: key,
            routeMatcher: new RegExp(key),
            key: "$&",
            gzip: false
        }, value);
    });

    return through.obj(function (file, encoding, callback) {
        var self = this;

        var route = _.find(routes, function (route) {
            return route.routeMatcher.test(file.relative);
        });

        file.s3.path = file.s3.path.replace(route.routeMatcher, route.key);
        _.extend(file.s3.headers, route.headers);

        if ( route.gzip ) {
            if ( route.gzip === true ) {
                route.gzip = {};
            }

            passThroughStream({
                target: self,
                modifier: awspublish.gzip(route.gzip),
                callback: callback,
                file: file
            });
        } else {
            self.push(file);
            callback();
        }
    });
};
