"use strict";

var awspublishRouter = require("../index.js");
var File = require("vinyl");

var createFile = function (options) {
    var file = new File(options);

    file.s3 = {
        headers: {},
        path: file.relative
    };

    return file;
};

describe("awspublishRouter", function () {
    it("should route the file with the original key", function () {
        var stream = awspublishRouter({
            routes: {
                "^bar\\.html$": {
                    key: "wrong"
                },

                "^foo\\.html$": "$&"
            }
        });

        var file = createFile({
            path: "/foo/foo.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.write(file);
        file.s3.path.should.equal("foo.html");
    });

    it("should route the file with the specified key", function () {
        var stream = awspublishRouter({
            routes: {
                "^bar\\.html$": {
                    key: "cat"
                },

                "^foo\\.html$": "$&"
            }
        });

        var file = createFile({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.write(file);
        file.s3.path.should.equal("cat");
    });

    it("should allow RegExp backreference for the key", function () {
        var stream = awspublishRouter({
            routes: {
                "^(\\w+)\\.html$": "meh/$1"
            }
        });

        var file = createFile({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.write(file);
        file.s3.path.should.equal("meh/bar");
    });

    it("should gzip the file if `gzip` is enabled for the route", function (callback) {
        var stream = awspublishRouter({
            routes: {
                "^bar\\.html$": {
                    key: "$&",
                    gzip: true
                }
            }
        });

        var file = createFile({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.on("data", function (file) {
            file.s3.headers["Content-Encoding"].should.equal("gzip");
            file.s3.path.should.equal("bar.html");
            callback();
        });

        stream.write(file);
    });

    it("should gzip the file with the options in `gzip` of the route", function (callback) {
        var stream = awspublishRouter({
            routes: {
                "^bar\\.html$": {
                    key: "$&",
                    gzip: {
                        ext: ".gz"
                    }
                }
            }
        });

        var file = createFile({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.on("data", function (file) {
            file.s3.headers["Content-Encoding"].should.equal("gzip");
            file.s3.path.should.equal("bar.html.gz");
            callback();
        });

        stream.write(file);
    });
});
