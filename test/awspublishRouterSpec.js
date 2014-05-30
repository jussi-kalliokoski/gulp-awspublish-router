"use strict";

var awspublishRouter = require("../index.js");
var awspublish = require("gulp-awspublish");
var File = require("vinyl");

var createFile = function (options) {
    var file = new File(options);

    file.s3 = {
        headers: {},
        path: file.relative
    };

    return file;
};

var createMockPublisher = function () {
    return awspublish.create({
        key: "fake",
        secret: "fake",
        bucket: "fake"
    });
};

describe("awspublishRouter", function () {
    it("should route the file with the original key", function () {
        var stream = awspublishRouter({
            publisher: createMockPublisher(),
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
            publisher: createMockPublisher(),
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
            publisher: createMockPublisher(),
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
});
