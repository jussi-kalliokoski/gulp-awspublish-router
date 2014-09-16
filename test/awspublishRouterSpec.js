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

var createSimpleTest = function (options, callback) {
    return function () {
        var stream = awspublishRouter(options);

        var file = createFile({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.write(file);
        callback(file);
    };
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

    it("should apply given headers to the file if `headers` is specified for the route", function () {
        var stream = awspublishRouter({
            routes: {
                "^bar\\.html$": {
                    key: "$&",
                    headers: {
                        "Content-Type": "text/plain"
                    }
                }
            }
        });

        var file = createFile({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.write(file);
        file.s3.headers["Content-Type"].should.equal("text/plain");
    });

    it("should apply cache headers according to the `cacheTime` value in the route, " +
            "using private and no-transform by default and no `Expires` header", createSimpleTest({
                routes: {
                    "^.+$": {
                        key: "$&",
                        cacheTime: 300
                    }
                }
            }, function (file) {
        var directives = file.s3.headers["Cache-Control"].split(", ");
        directives.should.contain("max-age=300");
        directives.should.contain("public");
        directives.should.not.contain("private");
        directives.should.contain("no-transform");
        expect(file.s3.headers.Expires).to.equal(undefined);
    }));

    it("should allow defining a default cache time in the cache options", createSimpleTest({
                cache: {
                    cacheTime: 500
                },

                routes: {
                    "^.+$": "$&"
                }
            }, function (file) {
        var directives = file.s3.headers["Cache-Control"].split(", ");
        directives.should.contain("max-age=500");
    }));

    it("should allow enabling `public` in the route", createSimpleTest({
                routes: {
                    "^.+$": {
                        key: "$&",
                        cacheTime: 300,
                        public: false
                    }
                }
            }, function (file) {
        var directives = file.s3.headers["Cache-Control"].split(", ");
        directives.should.contain("private");
        directives.should.not.contain("public");
    }));

    it("should allow enabling `public` in the cache options", createSimpleTest({
                cache: {
                    public: false
                },

                routes: {
                    "^.+$": {
                        key: "$&",
                        cacheTime: 300
                    }
                }
            }, function (file) {
        var directives = file.s3.headers["Cache-Control"].split(", ");
        directives.should.contain("private");
        directives.should.not.contain("public");
    }));

    it("should allow enabling transforms in the route", createSimpleTest({
                routes: {
                    "^.+$": {
                        key: "$&",
                        cacheTime: 300,
                        allowTransform: true
                    }
                }
            }, function (file) {
        var directives = file.s3.headers["Cache-Control"].split(", ");
        directives.should.not.contain("no-transform");
    }));

    it("should allow enabling transforms in the cache options", createSimpleTest({
                cache: {
                    allowTransform: true
                },

                routes: {
                    "^.+$": {
                        key: "$&",
                        cacheTime: 300
                    }
                }
            }, function (file) {
        var directives = file.s3.headers["Cache-Control"].split(", ");
        directives.should.not.contain("no-transform");
    }));

    it("should allow enabling the Expires header in the route", createSimpleTest({
                routes: {
                    "^.+$": {
                        key: "$&",
                        cacheTime: 300,
                        useExpires: true
                    }
                }
            }, function (file) {
        Math.abs(new Date(file.s3.headers.Expires) - Date.now()).should.be.above(250 * 1000);
        Math.abs(new Date(file.s3.headers.Expires) - Date.now()).should.be.below(350 * 1000);
    }));

    it("should allow enabling Expires header in the cache options", createSimpleTest({
                cache: {
                    useExpires: true
                },

                routes: {
                    "^.+$": {
                        key: "$&",
                        cacheTime: 300
                    }
                }
            }, function (file) {
        Math.abs(new Date(file.s3.headers.Expires) - Date.now()).should.be.above(250 * 1000);
        Math.abs(new Date(file.s3.headers.Expires) - Date.now()).should.be.below(350 * 1000);
    }));

    it("should not stop after first file with gzip (issue #2)", function (callback) {
        var stream = awspublishRouter({
            routes: {
                "^.+$": {
                    key: "$&",
                    gzip: true
                }
            }
        });

        var file1 = createFile({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        var file2 = createFile({
            path: "/bar/foo.html",
            base: "/bar/",
            contents: new Buffer("woof")
        });

        var filesProcessed = 0;

        stream.on("end", function () {
            filesProcessed.should.equal(2);
            callback();
        });

        stream.on("data", function (file) {
            file.s3.headers["Content-Encoding"].should.equal("gzip");

            switch ( file.relative ) {
            case "bar.html":
            case "foo.html":
                file.s3.path.should.equal(file.relative);
                break;
            default:
                throw new Error("unexpected file: " + file.relative);
            }

            filesProcessed += 1;
        });

        stream.write(file1);
        stream.write(file2);

        process.nextTick(function () {
            stream.end();
        });
    });

    it("should initialize awspublish options for the file if not predefined", function () {
        var stream = awspublishRouter({
            routes: {
                "^.+$": {
                    key: "$&"
                }
            }
        });

        var file = new File({
            path: "/foo/bar.html",
            base: "/foo/",
            contents: new Buffer("meow")
        });

        stream.write(file);
        file.s3.path.should.equal("bar.html");
        file.s3.headers.should.deep.equal({});
    });
});
