"use strict";

var _ = require("lodash");
var through = require("through2");
var awspublish = require("gulp-awspublish");

var passThroughStream = require("./lib/utils/passThroughStream");
var applyCacheHeaders = require("./lib/utils/applyCacheHeaders");
var initFile = require("./lib/utils/initFile");

var cacheDefaults = {
    cacheTime: null,
    public: true,
    allowTransform: false,
    useExpires: false
};

module.exports = function (options) {
    var cacheOptions = _.extend({}, cacheDefaults, options.cache);

    var routes = _.map(options.routes, function (value, key) {
        if ( typeof value === "string" ) {
            value = { key: value };
        }

        return _.extend({}, cacheOptions, {
            route: key,
            routeMatcher: new RegExp(key),
            key: "$&",
            gzip: false
        }, value);
    });

    return through.obj(function (file, encoding, callback) {
        if ( file.isNull() ) {
            callback();
            return;
        }

        var self = this;
        initFile(file);

        var route = _.find(routes, function (route) {
            return route.routeMatcher.test(file.relative);
        });

        file.s3.path = file.s3.path.replace(route.routeMatcher, route.key);
        applyCacheHeaders(file, route);
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
